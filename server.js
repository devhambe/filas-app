//npm run devStart
const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const session = require('express-session');

const bcrypt = require('bcrypt');
const mysql = require('mysql');
const con = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'filas_app'
});

app.use(express.static(path.join(__dirname, 'public')));
// app.engine('html', require('ejs').renderFile);
app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(
	session({
		secret: 'jeff johnson',
		resave: false,
		saveUninitialized: false
	})
);

app.get('/', (req, res) => {
	res.render('login.ejs');
	// res.render('index.ejs');
});

app.get('/test', (req, res) => {
	if (req.session.loggedin) {
		res.render('test.ejs', { nome: req.session.nome });
	} else {
		res.redirect('/');
	}
});

app.get('/logout', (req, res) => {
	// TODO session destroy
	res.redirect('/');
});

app.get('/login', (req, res) => {
	res.render('login.ejs');
});

app.post('/login', (req, res) => {
	const email = req.body.email;
	const password = req.body.password;
	async function checkUser(email, password) {
		con.query('SELECT nome, password FROM users WHERE email = ?', [ email ], async function(err, result) {
			const hashedPassword = result[0].password;

			const match = await bcrypt.compare(password, hashedPassword);

			if (match) {
				req.session.loggedin = true;
				req.session.nome = result[0].nome;
				res.redirect('/test');
			} else {
				// TODO Msg de erro
				res.redirect('/login');
			}
		});
	}
	checkUser(email, password);
});

app.get('/register', (req, res) => {
	res.render('register.ejs');
});

app.post('/register', async (req, res) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);

		var sql =
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
server.listen(3000);
