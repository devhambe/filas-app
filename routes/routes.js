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
			res.render(page, { nome: req.session.nome, nivel: req.session.nivel });
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
	autenticar(req, res, 'painel.ejs', 1);
});

router.get('/login', (req, res) => {
	res.render('login.ejs');
});

router.get('/dashboard', (req, res) => {
	autenticar(req, res, 'dashboard.ejs', 0);
});

router.get('/filas', (req, res) => {
	autenticar(req, res, 'filas.ejs', 2);
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

router.post('/login', (req, res) => {
	const nome = req.body.nome;
	const password = req.body.password;
	async function checkUser(nome, password) {
		con.query('SELECT nome, password, nivel FROM users WHERE nome = ?', [ nome ], async function(err, result) {
			if (result.length > 0) {
				const hashedPassword = result[0].password;

				const match = await bcrypt.compare(password, hashedPassword);

				if (match) {
					req.session.loggedin = true;
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

		const sql =
			'INSERT INTO users (nome, email, password, nivel) VALUES ("' +
			req.body.nome +
			'", "' +
			req.body.email +
			'", "' +
			hashedPassword +
			'", (select id from niveis where perm ="' +
			req.body.nivel +
			'"))';
		con.query(sql, function(err, result) {
			if (err) throw err;
		});

		res.redirect('/register');
	} catch (err) {
		res.redirect('/register');
	}
});

router.post('/ajax/users/add', (req, res) => {
	const sql = 'SELECT u.id, u.nome, u.email, n.perm from users u inner join niveis n on u.nivel = n.id';
	con.query(sql, function(err, result) {
		if (err) throw err;
		result = JSON.stringify(result);
		res.send(result);
	});
});

router.post('/ajax/users/delete', (req, res) => {
	const sql = 'DELETE FROM users where id =' + req.body.userId;
	con.query(sql, function(err, result) {
		if (err) throw err;
		res.json({ success: 'Removido com sucesso', status: 200 });
	});
});

module.exports = router;
