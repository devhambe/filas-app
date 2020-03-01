const express = require("express");
const path = require("path");
const app = express();
const session = require("express-session");
const routes = require("./routes/routes");
const server = require("http").createServer(app);
const io = require("socket.io")(server);

// TODO localhost?

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

// Objeto com todas as filas
const filas = {
	fila: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
	senha: [{ cont: 1 }, { cont: 1 }, { cont: 1 }, { cont: 1 }]
};

// Método para adicionar um novo user à fila
function addToFila(socket, filaAtual) {
	let index = filas.fila
		.map(function(a) {
			return a.id;
		})
		.indexOf(filaAtual);

	const num = Object.keys(filas.fila[index]).length;
	const senha = filas.senha[index].cont++;
	filas.fila[index][socket.id] = senha;
	io.to(filaAtual).emit("users-in-fila", num);
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
function atenderSenha() {
	for (let i = 0; i < filas.fila.length; i++) {
		const senhaId = Object.keys(filas.fila[i])[1];
		if (filas.fila[i][senhaId]) {
			delete filas.fila[i][senhaId];
			const fila = filas.fila[i].id;
			io.emit("user-left", fila);
			if (io.sockets.connected[senhaId]) {
				io.sockets.connected[senhaId].disconnect();
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
	io.to(filaAtual).emit("users-in-fila", numUsers);
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

// Eventos Socket.IO ================================================

// EVENTO onConnection
io.on("connection", socket => {
	// EVENTO na ligação de um novo user
	socket.on("new-user", fila => {
		socket.join(fila, () => {
			addToFila(socket, fila);
			updateDashboard();
		});
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

	// EVENTO
	socket.on("senha-atendida", () => {
		atenderSenha();
		updateDashboard();
		// io.emit("painel-senhas", "A", "000", "---");
	});

	// EVENTO onDisconnect
	socket.on("disconnect", () => {
		removeFromFila(socket);
		updateDashboard();
	});
});

server.listen(3000, function() {
	console.log(new Date() + "\nServer a correr na porta 3000");
});

// TODO Clientes Prioritários

// TODO TTS?
