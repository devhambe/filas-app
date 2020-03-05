require("dotenv").config();
/** @module Express */
const express = require("express");

/** @module ExpressRouter */
const router = express.Router();

/** @module Bcrypt */
const bcrypt = require("bcrypt");

/** @module Mysql */
const mysql = require("mysql");

/** @constant
 *  @type {Connection}
 */
const con = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_DATABASE
});

/**
 *  @module NewsAPI API de notícias
 */
const NewsAPI = require("newsapi");

/**
 * @constant
 * @type {NewsAPI}
 */
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

/**
 * Método para autenticar o acesso às páginas
 * Nivel 0 : Acesso a todos os níveis
 * @param {Request} req
 * @param {Response} res
 * @param {string} page Página a ser renderizada, Ex. 'index.ejs'
 * @param {number} nivel Nível de permissões do utilizador
 */
function autenticar(req, res, page, nivel) {
	if (req.session.loggedin) {
		if (req.session.nivel == nivel || nivel == 0) {
			res.render(page, {
				/** As variáveis passadas à página */
				nome: req.session.nome,
				nivel: req.session.nivel,
				id: req.session.userId
			});
		} else {
			res.redirect("/dashboard");
		}
	} else {
		res.redirect("/login");
	}
}

/** Rota GET para o /index */
router.get("/", (req, res) => {
	res.render("index.ejs");
});

/** Rota GET para o /painel */
router.get("/painel", (req, res) => {
	autenticar(req, res, "painel.ejs", 0);
});

/** Rota GET para o /login */
router.get("/login", (req, res) => {
	res.render("login.ejs");
});

/** Rota GET para o /dashboard */
router.get("/dashboard", (req, res) => {
	autenticar(req, res, "dashboard.ejs", 0);
});

/** Rota GET para o /register */
router.get("/register", (req, res) => {
	autenticar(req, res, "register.ejs", 1);
});

/** Rota GET para o /clientes */
router.get("/clientes", (req, res) => {
	autenticar(req, res, "clientes.ejs", 0);
});

/** Rota GET para o /balcoes */
router.get("/balcoes", (req, res) => {
	autenticar(req, res, "balcoes.ejs", 1);
});

/** Rota GET para o /logout */
router.get("/logout", (req, res) => {
	/** Session destroy */
	req.session.destroy(function(e) {
		if (e) {
			console.log(e);
		}
	});
	res.redirect("/login");
});

/** Rota POST para o /login */
router.post("/login", (req, res) => {
	const email = req.body.email;
	const password = req.body.password;
	/**
	 * Método para a verificação do utilizador na base de dados para o login
	 * @param {string} email
	 * @param {string} password
	 */
	async function checkUser(email, password) {
		/**
		 * Query à BD dos dados do utilizador para o login
		 */
		try {
			con.query(
				"SELECT id, nome, password, nivel FROM users WHERE email = ?",
				[email],
				async function(err, result) {
					/**
					 * Verificação da existência de um utilizador com o email dado
					 */
					if (result.length > 0) {
						const hashedPassword = result[0].password;

						/**
						 * A password inserida é encriptada e comparada com a password encriptada na BD
						 */
						const match = await bcrypt.compare(
							password,
							hashedPassword
						);

						/** Se for igual (se a password estiver certa):
						 * As seguintes variáveis são atribuídas à sessão:
						 * loggedin (true)
						 * ID do utilizador
						 * Nome do utilizador
						 * Nível do utilizador
						 */
						if (match) {
							req.session.loggedin = true;
							req.session.userId = result[0].id;
							req.session.nome = result[0].nome;
							req.session.nivel = result[0].nivel;
							res.redirect("/dashboard");
						} else {
							res.redirect("/login");
						}
					} else {
						res.redirect("/login");
					}
				}
			);
		} catch (err) {
			res.redirect("/login");
		}
	}
	checkUser(email, password);
});

/**
 * Rota POST para o /register
 */
router.post("/register", async (req, res) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);

		const sql =
			"INSERT INTO users (nome, email, password, nivel) VALUES (?, ?, ?, (SELECT id FROM niveis WHERE perm = ?))";
		con.query(
			sql,
			[req.body.nome, req.body.email, hashedPassword, req.body.nivel],
			function(err, result) {
				if (err) throw err;
			}
		);

		res.redirect("/register");
	} catch (err) {
		res.redirect("/register");
	}
});

/**
 * Rotas para chamadas Ajax por POST
 */

router.post("/ajax/users", (req, res) => {
	try {
		const sql =
			"SELECT u.id, u.nome, u.email, n.perm from users u inner join niveis n on u.nivel = n.id";
		con.query(sql, function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {
		res.redirect("/register");
	}
});

router.post("/ajax/users/delete", (req, res) => {
	try {
		const sql = "DELETE FROM users WHERE id = ?";
		con.query(sql, [req.body.userId], function(err, result) {
			if (err) throw err;
			res.json({ success: "Removido com sucesso", status: 200 });
		});
	} catch (err) {
		res.redirect("/register");
	}
});

// Request que retorna todos os balcões existentes para serem apresentados na tabela
router.post("/ajax/balcoes", (req, res) => {
	try {
		const sql =
			"SELECT b.id, b.numero, b.estado, u.nome from balcoes b inner join users u on b.operador = u.id ORDER BY b.numero DESC";
		con.query(sql, function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {
		res.redirect("/balcoes");
	}
});

// Request que retorna o balcão atual do operador ( se estiver em uso )
router.post("/ajax/balcao", (req, res) => {
	try {
		const sql =
			"SELECT id, numero from balcoes where estado = 1 and operador = ?";
		con.query(sql, [req.body.id], function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {
		res.redirect("/balcoes");
	}
});

// Request para adicionar um novo balcão
router.post("/ajax/balcoes/add", (req, res) => {
	try {
		if (req.body.estado === undefined) {
			req.body.estado = 0;
		} else {
			req.body.estado = 1;
		}
		const sql = `INSERT INTO balcoes (numero, estado, operador) VALUES (?, ?, ?) `;
		con.query(
			sql,
			[req.body.numero, req.body.estado, req.body.operador],
			function(err, result) {
				if (err) throw err;
				result = JSON.stringify(result);
				res.send(result);
			}
		);
	} catch (err) {}
});

// Request para atualizar um balcão existente
router.post("/ajax/balcoes/update", (req, res) => {
	try {
		if (req.body.estado === undefined) {
			req.body.estado = 0;
		} else {
			req.body.estado = 1;
		}
		const sql =
			"UPDATE balcoes SET numero = ?, operador = ?, estado = ? where id = ?";
		con.query(
			sql,
			[req.body.numero, req.body.operador, req.body.estado, req.body.id],
			function(err, result) {
				if (err) throw err;
				res.json({ success: "Atualizado com sucesso", status: 200 });
			}
		);
	} catch (err) {
		res.redirect("/balcoes");
	}
});

// Request para remover um balcão
router.post("/ajax/balcoes/delete", (req, res) => {
	try {
		const sql = "DELETE FROM balcoes where id = ?";
		con.query(sql, [req.body.balcaoId], function(err, result) {
			if (err) throw err;
			res.json({ success: "Removido com sucesso", status: 200 });
		});
	} catch (err) {
		res.redirect("/balcoes");
	}
});

// Request que retorna os dados de um determinado balcão para a sua edição
router.post("/ajax/balcoes/edit", (req, res) => {
	try {
		const sql = "SELECT * FROM balcoes where id = ?";
		con.query(sql, [req.body.balcaoId], function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {
		res.redirect("/balcoes");
	}
});

// Request que retorna os todos os operadores que não têm um balcão associado
router.post("/ajax/operadores", (req, res) => {
	try {
		let sql;
		if (req.body.operador === undefined) {
			sql =
				'SELECT u.id, u.nome FROM users u LEFT JOIN balcoes b ON b.operador = u.id WHERE b.operador IS NULL AND u.nivel = (SELECT id FROM niveis WHERE perm = "Operador")';
		} else {
			sql = `SELECT u.id, u.nome FROM users u LEFT JOIN balcoes b ON b.operador = u.id WHERE b.operador IS NULL AND u.nivel = (SELECT id FROM niveis WHERE perm = "Operador") OR b.operador = ${req.body.operador}`;
		}
		con.query(sql, function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {
		res.redirect("/balcoes");
	}
});

router.post("/ajax/clientes", (req, res) => {
	try {
		const sql = "SELECT * FROM clientes";
		con.query(sql, function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {
		res.redirect("/clientes");
	}
});

router.post("/ajax/clientes/add", (req, res) => {
	try {
		const sql = `INSERT INTO clientes (nome, apelido, morada, cod_postal, cidade, email, telefone) VALUES (?, ?, ?, ?, ?, ?, ?)`;
		con.query(
			sql,
			[
				req.body.nome,
				req.body.apelido,
				req.body.morada,
				req.body.cod_postal,
				req.body.cidade,
				req.body.email,
				req.body.telefone
			],
			function(err, result) {
				if (err) throw err;
				result = JSON.stringify(result);
				res.send(result);
			}
		);
	} catch (err) {
		res.redirect("/clientes");
	}
});

router.post("/ajax/clientes/delete", (req, res) => {
	try {
		const sql = "DELETE FROM clientes where id = ?";
		con.query(sql, [req.body.clienteId], function(err, result) {
			if (err) throw err;
			result = JSON.stringify(result);
			res.send(result);
		});
	} catch (err) {
		res.redirect("/clientes");
	}
});

router.post("/ajax/noticias", (req, res) => {
	try {
		const noticias = {
			title: [],
			desc: [],
			img: []
		};
		newsapi.v2
			.topHeadlines({
				country: "pt",
				language: "pt",
				pageSize: "5",
				category: "general"
			})
			.then(news => {
				for (k in news.articles) {
					noticias.title.push(news.articles[k].title);
					noticias.desc.push(news.articles[k].description);
					noticias.img.push(news.articles[k].urlToImage);
				}
				res.send(noticias);
			});
	} catch (err) {
		res.redirect("/painel");
	}
});

module.exports = router;
