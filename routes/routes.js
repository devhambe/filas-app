const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const con = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'filas_app'
});

router.get('/', (req, res) => {
	// res.render('login.ejs');
	res.render('index.ejs');
});

router.get('/senhas', (req, res) => {
	res.render('senhas.ejs');
});

router.get('/login', (req, res) => {
	res.render('login.ejs');
});

router.get('/dashboard', (req, res) => {
	if (req.session.loggedin) {
		res.render('dashboard.ejs', { nome: req.session.nome });
	} else {
		res.redirect('/login');
	}
});

router.get('/register', (req, res) => {
	res.render('register.ejs');
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
	const email = req.body.email;
	const password = req.body.password;
	async function checkUser(email, password) {
		con.query('SELECT nome, password FROM users WHERE email = ?', [ email ], async function(err, result) {
			if (result.length > 0) {
				const hashedPassword = result[0].password;

				const match = await bcrypt.compare(password, hashedPassword);

				if (match) {
					req.session.loggedin = true;
					req.session.nome = result[0].nome;
					res.redirect('/dashboard');
				} else {
					// TODO Msg de erro
					res.redirect('/login');
				}
			} else {
				// TODO email inválido - msg de erro
				res.redirect('/login');
			}
		});
	}
	checkUser(email, password);
});

router.post('/register', async (req, res) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);

		const sql =
			'INSERT INTO users (nome, email, password) VALUES ("' +
			req.body.nome +
			'", "' +
			req.body.email +
			'", "' +
			hashedPassword +
			'")';
		con.query(sql, function(err, result) {
			if (err) throw err;
		});

		res.redirect('/login');
	} catch (err) {
		res.redirect('/register');
	}
});

module.exports = router;
