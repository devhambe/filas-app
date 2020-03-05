require("dotenv").config();
/** @module Express */
const express = require("express");

/** @module Path */
const path = require("path");

/**
 * Instância do Express
 * @instance */
const app = express();

/** @module Sessions Middleware de sessões para Express */
const session = require("express-session");

/** @module Routes */
const routes = require("./routes/routes");

/** @module Server */
const server = require("http").createServer(app);

/** @module SocketIO */
const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "public")));
app.use(
	"/js",
	express.static(path.join(__dirname, "/node_modules/jquery/dist"))
);
app.use(
	"/js",
	express.static(path.join(__dirname, "/node_modules/bootstrap/dist/js"))
);
app.use(
	"/css",
	express.static(path.join(__dirname, "/node_modules/bootstrap/dist/css"))
);
app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(
	session({
		secret: "jeff johnson",
		resave: false,
		saveUninitialized: false
	})
);

app.use("/", routes);

// Objeto com todas as filas e contadores
const filas = {
	fila: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
	senha: [{ cont: 1 }, { cont: 1 }, { cont: 1 }, { cont: 1 }]
};

// Método para adicionar um novo user à fila
function addToFila(socketId, filaAtual) {
	let index = filas.fila
		.map(function(a) {
			return a.id;
		})
		.indexOf(filaAtual);

	const num = Object.keys(filas.fila[index]).length;
	const senha = filas.senha[index].cont++;
	const senhaUser = filaAtual + senha;
	filas.fila[index][socketId] = senha;
	io.to(filaAtual).emit("users-in-fila", num, filaAtual);
	io.to(filaAtual).emit("user-senha", senhaUser);
}

// Método para remover um user da fila
function removeFromFila(socket) {
	for (let i = 0; i < filas.fila.length; i++) {
		if (filas.fila[i][socket.id]) {
			delete filas.fila[i][socket.id];
			const fila = filas.fila[i].id;
			io.emit("user-left", fila);
			socket.disconnect();
		}
	}
}

// Método para atender a senha do cliente (e removê-lo da fila)
function atenderSenha(filaAtual) {
	let index = filas.fila
		.map(function(a) {
			return a.id;
		})
		.indexOf(filaAtual);
	const socketId = Object.keys(filas.fila[index])[1];
	for (let i = 0; i < filas.fila.length; i++) {
		if (filas.fila[i][socketId]) {
			delete filas.fila[i][socketId];
			const fila = filas.fila[i].id;
			io.emit("user-left", fila);
			if (io.sockets.connected[socketId]) {
				io.sockets.connected[socketId].disconnect();
			}
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
	io.to(filaAtual).emit("users-in-fila", numUsers, filaAtual);
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
	io.emit("dashboard-filas", { users: users, senhas: senhas });
}

// Método para fazer update à senha seguinte
// no Painel
function updatePainel(filaAtual, balcao) {
	let index = filas.fila
		.map(function(a) {
			return a.id;
		})
		.indexOf(filaAtual);

	let senha = Object.values(filas.fila[index])[1];
	io.emit("painel-senhas", filaAtual, senha, balcao);
}

// Método em que o cliente é removido da fila atual e acrescentado a uma fila nova
function trocarFila(filaAtual, filaNova) {
	let index = filas.fila
		.map(function(a) {
			return a.id;
		})
		.indexOf(filaAtual);
	const socketId = Object.keys(filas.fila[index])[1];
	for (let i = 0; i < filas.fila.length; i++) {
		if (filas.fila[i][socketId]) {
			delete filas.fila[i][socketId];
		}
	}
	const socket_cliente = io.sockets.connected[socketId];
	socket_cliente.leave(filaAtual);
	socket_cliente.join(filaNova);
	addToFila(socketId, filaNova);
	updateDashboard();
}

// Eventos Socket.IO ================================================

// EVENTO onConnection
io.on("connection", socket => {
	// EVENTO na ligação de um novo user
	socket.on("new-user", fila => {
		socket.join(fila);
		addToFila(socket.id, fila);
		updateDashboard();
	});

	// EVENTO para retornar o nº de users presentes na fila
	socket.on("get-number-users", fila => {
		updateUsersInFila(fila);
	});

	socket.on("painel", () => {
		// TODO Dados no painel ao painel entrar??
		//updatePainel();
	});

	// EVENTO
	socket.on("dashboard", () => {
		updateDashboard();
	});

	// EVENTO
	socket.on("chamar-senha", (fila, balcao) => {
		updatePainel(fila, balcao);
		io.to(fila).emit("balcao", balcao);
	});

	socket.on("trocar-fila", (filaAtual, filaNova) => {
		trocarFila(filaAtual, filaNova);
	});

	// EVENTO
	socket.on("senha-atendida", fila => {
		atenderSenha(fila);
		updateDashboard();
	});

	// EVENTO onDisconnect
	socket.on("disconnect", () => {
		removeFromFila(socket);
		updateDashboard();
	});
});

server.listen(process.env.SERVER_PORT, process.env.SERVER_IP, function() {
	console.log(
		`Server ON no IP : ${process.env.SERVER_IP}:${process.env.SERVER_PORT}`
	);
});
