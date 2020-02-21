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

const filaA = { id: 0 };
const filaB = { id: 0 };
const filaC = { id: 0 };
const filaD = { id: 0 };
//TODO mudar objetos -> 1
// num só
const filas = {
	filaA: { test: '123' },
	filaB: { test: '321' }
};

const test = {
	filas: [ 'test' ]
};

console.log(test.filas[0]);

// Método para enviar o nº de users presentes na fila
function updateUsersInFila(obj, fila) {
	const numUsers = Object.keys(obj).length - 1;
	io.to(fila).emit('users-in-fila', numUsers);
}

// Método para adicionar um novo user à fila
function addToFila(socket, fila, obj) {
	obj.id++;
	obj[socket.id] = fila + obj.id;
	updateUsersInFila(obj, fila);
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

// Método para fazer update ao número de pessoas nas filas no dashboard
function updateDashboard() {
	const objects = [ filaA, filaB, filaC, filaD ];
	let arrayUsers = [];
	let arraySenhas = [];
	for (obj in objects) {
		const numUsers = Object.keys(objects[obj]).length - 1;
		arrayUsers.push(numUsers);
		const senha = Object.values(objects[obj]);
		arraySenhas.push(senha[1]);
	}
	io.emit('dashboard-filas', { arrayUsers: arrayUsers, arraySenhas: arraySenhas });
}

function updatePainel() {
	const objects = [ filaA, filaB, filaC, filaD ];
	let arraySenhas = [];
	for (obj in objects) {
		const senha = Object.values(objects[obj]);
		arraySenhas.push(senha[1]);
	}
	io.emit('painel-senhas', arraySenhas);
}

function update() {
	updateDashboard();
	updatePainel();
}

// Eventos Socket.IO

// EVENTO onConnection
io.on('connection', (socket) => {
	// EVENTO na ligação de um novo user
	socket.on('new-user', (fila) => {
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
			update();
		});
	});

	// EVENTO para retornar o nº de users presentes na fila
	socket.on('get-number-users', (fila) => {
		switch (fila) {
			case 'A':
				updateUsersInFila(filaA, fila);
				break;
			case 'B':
				updateUsersInFila(filaB, fila);
				break;
			case 'C':
				updateUsersInFila(filaC, fila);
				break;
			case 'D':
				updateUsersInFila(filaD, fila);
				break;
		}
	});

	socket.on('painel', () => {
		updatePainel();
	});

	socket.on('dashboard', () => {
		updateDashboard();
	});

	// EVENTO onDisconnect
	socket.on('disconnect', () => {
		const objects = [ filaA, filaB, filaC, filaD ];
		for (obj in objects) {
			removeFromFila(socket, objects[obj]);
		}
		update();
	});
});

server.listen(3000, function() {
	console.log(new Date() + '\nServer a correr na porta 3000');
});
