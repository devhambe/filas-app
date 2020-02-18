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
app.use('/js', express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.use('/js', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/js')));
app.use('/css', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/css')));
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
	// res.render('login.ejs');
	res.render('index.ejs');
});

app.get('/senhas', (req, res) => {
	res.render('senhas.ejs');
});

app.get('/wait', (req, res) => {
	res.render('wait.ejs');
});

app.get('/login', (req, res) => {
	res.render('login.ejs');
});

app.get('/dashboard', (req, res) => {
	if (req.session.loggedin) {
		res.render('dashboard.ejs', { nome: req.session.nome });
	} else {
		res.redirect('/');
	}
});

app.get('/logout', (req, res) => {
	// Session destroy
	req.session.destroy(function(e) {
		if (e) {
			console.log(e);
		}
	});
	res.redirect('/login');
});

app.post('/login', (req, res) => {
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

app.get('/register', (req, res) => {
	res.render('register.ejs');
});

app.post('/register', async (req, res) => {
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

const filaA = { id: 0 };
const filaB = { id: 0 };
const filaC = { id: 0 };
const filaD = { id: 0 };

// Método para enviar o nº de users presentes na fila
function getUsersInFila(obj, fila) {
	const numUsers = Object.keys(obj).length - 1;
	io.to(fila).emit('users-in-fila', numUsers);
}

// Método para adicionar um novo user à fila
function addToFila(socket, fila, obj) {
	obj.id++;
	obj[socket.id] = fila + obj.id;
	getUsersInFila(obj, fila);
}

// Método para remover um user da fila
function removeFromFila(socket, obj) {
	if (obj[socket.id]) {
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				delete obj[socket.id];
			}
		}
		io.sockets.emit('user-left');
		socket.disconnect();
	}
}

// Eventos Socket.IO

// EVENTO onConnection
io.on('connection', (socket) => {
	// EVENTO na ligação de um novo user
	socket.on('new-user', (fila) => {
		currFila = fila;
		socket.join(fila, () => {
			switch (fila) {
				case 'A':
					addToFila(socket, fila, filaA);
					break;
				case 'B':
					addToFila(socket, fila, filaB);
					break;
				case 'C':
					addToFila(socket, fila, filaC);
					break;
				case 'D':
					addToFila(socket, fila, filaD);
					break;
			}
		});
	});

	// EVENTO para retornar o nº de users presentes na fila
	socket.on('get-number-users', (fila) => {
		const numUsers = 0;
		switch (fila) {
			case 'A':
				getUsersInFila(filaA, fila);
				break;
			case 'B':
				getUsersInFila(filaB, fila);
				break;
			case 'C':
				getUsersInFila(filaC, fila);
				break;
			case 'D':
				getUsersInFila(filaD, fila);
				break;
		}
	});

	// EVENTO onDisconnect
	socket.on('disconnect', () => {
		removeFromFila(socket, filaA);
		removeFromFila(socket, filaB);
		removeFromFila(socket, filaC);
		removeFromFila(socket, filaD);
	});
});

server.listen(3000, function() {
	console.log(new Date() + '\nServer a correr na porta 3000');
});
