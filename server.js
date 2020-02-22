//npm run devStart
const express = require('express');
const path = require('path');
const app = express();
const routes = require('./routes/routes');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const session = require('express-session');

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

app.use('/', routes);

const filas = {
	fila: [ { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' } ]
};

// Método para adicionar um novo user à fila
function addToFila(socket, filaAtual) {
	let index = filas.fila
		.map(function(a) {
			return a.id;
		})
		.indexOf(filaAtual);

	const num = Object.keys(filas.fila[index]).length;
	filas.fila[index][socket.id] = num;

	io.to(filaAtual).emit('users-in-fila', num);
}

// Método para remover um user da fila
function removeFromFila(socket) {
	for (let i = 0; i < filas.fila.length; i++) {
		if (filas.fila[i][socket.id]) {
			delete filas.fila[i][socket.id];
			const fila = filas.fila[i].id;
			io.emit('user-left', fila);
			socket.disconnect();
		}
	}
}

// Método para enviar o nº de users presentes na fila
function updateUsersInFila(filaAtual) {
	let index = filas.fila
		.map(function(a) {
			return a.id;
		})
		.indexOf(filaAtual);

	const numUsers = Object.keys(filas.fila[index]).length - 1;
	io.to(filaAtual).emit('users-in-fila', numUsers);
}

// Método para fazer update ao número de pessoas nas filas e à senha seguinte
// no Dashboard
function updateDashboard() {
	let users = [];
	let senhas = [];
	for (let i = 0; i < filas.fila.length; i++) {
		users.push(Object.keys(filas.fila[i]).length - 1);
		senhas.push(Object.values(filas.fila[i]));
	}
	io.emit('dashboard-filas', { users: users, senhas: senhas });
}

// Método para fazer update à senha seguinte
// no Painel
function updatePainel() {
	let senhas = [];
	for (let i = 0; i < filas.fila.length; i++) {
		senhas.push(Object.values(filas.fila[i]));
	}
	io.emit('painel-senhas', senhas);
}

function update() {
	updateDashboard();
	updatePainel();
}

// Eventos Socket.IO ================================================

// EVENTO onConnection
io.on('connection', (socket) => {
	// EVENTO na ligação de um novo user
	socket.on('new-user', (fila) => {
		socket.join(fila, () => {
			addToFila(socket, fila);
			update();
		});
	});

	// EVENTO para retornar o nº de users presentes na fila
	socket.on('get-number-users', (fila) => {
		updateUsersInFila(fila);
	});

	socket.on('painel', () => {
		updatePainel();
	});

	socket.on('dashboard', () => {
		updateDashboard();
	});

	// EVENTO onDisconnect
	socket.on('disconnect', () => {
		removeFromFila(socket);
		update();
	});
});

server.listen(3000, function() {
	console.log(new Date() + '\nServer a correr na porta 3000');
});
