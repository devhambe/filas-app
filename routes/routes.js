require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const con = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_DATABASE
});

function autenticar(req, res, page, nivel) {
	if (req.session.loggedin) {
		if (req.session.nivel == nivel || nivel == 0) {
			res.render(page, { nome: req.session.nome, nivel: req.session.nivel, id: req.session.userId });
		} else {
			res.redirect('/dashboard');
		}
	} else {
		res.redirect('/login');
	}
}

router.get('/', (req, res) => {
	res.render('index.ejs');
});

router.get('/painel', (req, res) => {
	autenticar(req, res, 'painel.ejs', 0);
});

router.get('/login', (req, res) => {
	res.render('login.ejs');
});

router.get('/dashboard', (req, res) => {
	autenticar(req, res, 'dashboard.ejs', 0);
});

router.get('/register', (req, res) => {
	autenticar(req, res, 'register.ejs', 1);
});

router.get('/balcoes', (req, res) => {
	autenticar(req, res, 'balcoes.ejs', 1);
});

router.get('/logout', (req, res) => {
	// Session destroy
	req.session.destroy(function(e) {
		if (e) {
			console.log(e);
		}
	});
	res.redirect('/login');
});

//TODO Prepared statements

router.post('/login', (req, res) => {
	const nome = req.body.nome;
	const password = req.body.password;
	async function checkUser(nome, password) {
		con.query('SELECT id, nome, password, nivel FROM users WHERE nome = ?', [ nome ], async function(err, result) {
			if (result.length > 0) {
				const hashedPassword = result[0].password;

				const match = await bcrypt.compare(password, hashedPassword);

				if (match) {
					req.session.loggedin = true;
					req.session.userId = result[0].id;
					req.session.nome = result[0].nome;
					req.session.nivel = result[0].nivel;
					res.redirect('/dashboard');
				} else {
					// TODO Msg de erro
					res.redirect('/login');
				}
			} else {
				// TODO nome inválido - msg de erro
				res.redirect('/login');
			}
		});
	}
	checkUser(nome, password);
});

router.post('/register', async (req, res) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);

		const sql = `INSERT INTO users (nome, email, password, nivel) VALUES ("${req.body.nome}", "${req.body
			.email}", "${hashedPassword}", (SELECT id FROM niveis WHERE perm = "${req.body.nivel}"))`;
		con.query(sql, function(err, result) {
			if (err) throw err;
		});

		res.redirect('/register');
	} catch (err) {
		res.redirect('/register');
	}
});

router.post('/ajax/users', (req, res) => {
	try {
		const sql = 'SELECT u.id, u.nome, u.email, n.perm from users u inner join niveis n on u.nivel = n.id';
		con.query(sql, function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {
		res.redirect('/register');
	}
});

router.post('/ajax/users/delete', (req, res) => {
	try {
		const sql = 'DELETE FROM users where id =' + req.body.userId;
		con.query(sql, function(err, result) {
			if (err) throw err;
			res.json({ success: 'Removido com sucesso', status: 200 });
		});
	} catch (err) {
		res.redirect('/register');
	}
});

// Request que retorna todos os balcões existentes para serem apresentados na tabela
router.post('/ajax/balcoes', (req, res) => {
	try {
		const sql = 'SELECT b.id, b.numero, b.estado, u.nome from balcoes b inner join users u on b.operador = u.id';
		con.query(sql, function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {
		res.redirect('/balcoes');
	}
});

// Request que retorna o balcão atual do operador ( se estiver em uso )
router.post('/ajax/balcao', (req, res) => {
	try {
		const sql = `SELECT id, numero from balcoes where estado = 1 and operador = ${req.body.id}`;
		con.query(sql, function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {
		res.redirect('/balcoes');
	}
});

// Request para adicionar um novo balcão
router.post('/ajax/balcoes/add', (req, res) => {
	try {
		if (req.body.estado === undefined) {
			req.body.estado = 0;
		} else {
			req.body.estado = 1;
		}
		const sql = `INSERT INTO balcoes (numero, estado, operador) VALUES ("${req.body.numero}", "${req.body
			.estado}", "${req.body.operador}") `;
		con.query(sql, function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {}
});

// Request para atualizar um balcão existente
router.post('/ajax/balcoes/update', (req, res) => {
	try {
		if (req.body.estado === undefined) {
			req.body.estado = 0;
		} else {
			req.body.estado = 1;
		}
		const sql = `UPDATE balcoes SET numero = ${req.body.numero}, operador = ${req.body.operador}, estado = ${req
			.body.estado} where id = ${req.body.id}`;
		con.query(sql, function(err, result) {
			if (err) throw err;
			res.json({ success: 'Atualizado com sucesso', status: 200 });
		});
	} catch (err) {
		res.redirect('/balcoes');
	}
});

// Request para remover um balcão
router.post('/ajax/balcoes/delete', (req, res) => {
	try {
		const sql = 'DELETE FROM balcoes where id =' + req.body.balcaoId;
		con.query(sql, function(err, result) {
			if (err) throw err;
			res.json({ success: 'Removido com sucesso', status: 200 });
		});
	} catch (err) {
		res.redirect('/balcoes');
	}
});

// Request que retorna os dados de um determinado balcão para a sua edição
router.post('/ajax/balcoes/edit', (req, res) => {
	try {
		const sql = 'SELECT * FROM balcoes where id =' + req.body.balcaoId;
		con.query(sql, function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {
		res.redirect('/balcoes');
	}
});

// Request que retorna os todos os operadores que não têm um balcão associado
router.post('/ajax/operadores', (req, res) => {
	try {
		let sql;
		if (req.body.operador === undefined) {
			sql =
				'SELECT u.id, u.nome FROM users u LEFT JOIN balcoes b ON b.operador = u.id WHERE b.operador IS NULL AND u.nivel = (SELECT id FROM niveis WHERE perm = "Operador")';
		} else {
			sql = `SELECT u.id, u.nome FROM users u LEFT JOIN balcoes b ON b.operador = u.id WHERE b.operador IS NULL AND u.nivel = (SELECT id FROM niveis WHERE perm = "Operador") OR b.operador = ${req
				.body.operador}`;
		}
		con.query(sql, function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {
		res.redirect('/balcoes');
	}
});

module.exports = router;
