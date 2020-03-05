/** Chamada das variavéis de ambiente no .env */
require("dotenv").config();

/** @requires Express */
const express = require("express");

/** @requires Path */
const path = require("path");

/** Instância do Express */
const app = express();

/** @requires Sessions Middleware de sessões para Express */
const session = require("express-session");

/** @requires Routes/Routes */
const routes = require("./routes/routes");

/** @requires Server */
const server = require("http").createServer(app);

/** @requires SocketIO */
const io = require("socket.io")(server);

/**
 * Para usar ficheiros estáticos como por ex. /js e /css,
 * usa-se a função de middleware express.static()
 */

/** Ficheiro /public como ficheiro estático */
app.use(express.static(path.join(__dirname, "public")));

/** Ficheiros de Jquery como ficheiros estáticos */
app.use(
	"/js",
	express.static(path.join(__dirname, "/node_modules/jquery/dist"))
);

/** Ficheiros de JS do Bootstrap como ficheiros estáticos */
app.use(
	"/js",
	express.static(path.join(__dirname, "/node_modules/bootstrap/dist/js"))
);

/** Ficheiros de CSS do Bootstrap como ficheiros estáticos */
app.use(
	"/css",
	express.static(path.join(__dirname, "/node_modules/bootstrap/dist/css"))
);

/**
 * Definição do template engine para o uso dos ficheiros estáticos e o uso de variavéis nas páginas HTML
 * O template engine utilizado é o EJS
 */
app.set("view engine", "ejs");

/**
 * Análise de requests recebidas com payloads urlencoded
 * Permite o acesso à variável 'req.body'
 */
app.use(express.urlencoded({ extended: false }));

/**
 * Sessões com express.
 * Mais informação em https://stackoverflow.com/a/40396102
 */
app.use(
	session({
		/** Secret usado para calcular o hash da sessão */
		secret: "ajZ2x~udsba+_s8",
		resave: false,
		saveUninitialized: false
	})
);

/** Usar o ficheiro routes.js para tratar das rotas */
app.use("/", routes);

/**
 * Objeto com todas as filas e contadores
 * @type {object}
 * @constant
 */
const filas = {
	fila: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
	senha: [{ cont: 1 }, { cont: 1 }, { cont: 1 }, { cont: 1 }]
};

/**
 * Função para encontrar o índice de um array que contém objetos utilizando a função Array.prototype.map()
 * Source: https://stackoverflow.com/a/16008853
 * @param {Array} filas
 * @param {string} indexOf
 */
function indexFromFilasArray(filas, indexOf) {
	const index = filas
		.map(function(a) {
			return a.id;
		})
		.indexOf(indexOf);

	return index;
}

/**
 * Função para adicionar um novo user à fila
 * @param {string} socketId ID do socket do cliente
 * @param {string} filaAtual Fila atual do cliente
 */
function addToFila(socketId, filaAtual) {
	const index = indexFromFilasArray(filas.fila, filaAtual);

	/** Número de pessoas na fila */
	const num = Object.keys(filas.fila[index]).length;

	/**
	 * Senha do utilizador = Fila + Contador (ex. C23)
	 */
	const cont = filas.senha[index].cont++;
	const senhaUser = filaAtual + cont;
	filas.fila[index][socketId] = cont;

	/** Emissões de eventos para a sala do cliente*/
	io.to(filaAtual).emit("users-in-fila", num, filaAtual);
	io.to(filaAtual).emit("user-senha", senhaUser);
}

/**
 * Função para remover um user da fila.
 * @param {object} socket Objeto socket do cliente
 */
function removeFromFila(socket) {
	/**
	 * Como não dá para passar variavéis quando um socket é desconectado,
	 * percorre-se através do array de todas as filas
	 */
	for (let i = 0; i < filas.fila.length; i++) {
		/** Verifica-se a existência do socket dentro da fila (através do socket.id)*/
		if (filas.fila[i][socket.id]) {
			/** Remove-se o cliente da fila e é emitido um evento para todos os sockets que um cliente da fila «tal» */
			delete filas.fila[i][socket.id];
			const fila = filas.fila[i].id;
			io.emit("user-left", fila);

			/** Por último, desconectamos o socket */
			socket.disconnect();
		}
	}
}

/**
 * Função para atender a senha do cliente (e removê-lo da fila)
 * Basicamente, o cliente é removido de uma fila @see removeFromFila .
 * Desta vez consegue-se passar variáveis para encontrar o índice do cliente
 * @param {string} filaAtual Fila atual do cliente
 */
function atenderSenha(filaAtual) {
	const index = indexFromFilasArray(filas.fila, filaAtual);
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

/**
 * Função para enviar o nº de users presentes na fila
 * @param {string} filaAtual Fila atual do cliente
 */
function updateUsersInFila(filaAtual) {
	const index = indexFromFilasArray(filas.fila, filaAtual);
	const numUsers = Object.keys(filas.fila[index]).length - 1;
	io.to(filaAtual).emit("users-in-fila", numUsers, filaAtual);
}

/**
 * Função para fazer update ao número de pessoas nas filas e à senha seguinte no Dashboard
 * Emite o número de pessoas e a senha atual para cada fila
 */
function updateDashboard() {
	let users = [];
	let senhas = [];
	for (let i = 0; i < filas.fila.length; i++) {
		users.push(Object.keys(filas.fila[i]).length - 1);
		senhas.push(Object.values(filas.fila[i]));
	}
	io.emit("dashboard-filas", { users: users, senhas: senhas });
}

/**
 * Função para fazer update à senha seguinte no Painel
 * Emite a fila que foi atualizada, com nova senha e o balcão
 * @param {string} filaAtual Fila atual do cliente
 * @param {string} balcao Balcão para qual o cliente foi chamado
 */
function updatePainel(filaAtual, balcao) {
	const index = indexFromFilasArray(filas.fila, filaAtual);
	const senha = Object.values(filas.fila[index])[1];
	io.emit("painel-senhas", filaAtual, senha, balcao);
}

/**
 * Função em que o cliente é removido da fila atual e acrescentado a uma fila nova
 * @param {string} filaAtual Fila atual do cliente
 * @param {string} filaNova Fila para qual o cliente será transferido
 */
function trocarFila(filaAtual, filaNova) {
	const index = indexFromFilasArray(filas.fila, filaAtual);
	const socketId = Object.keys(filas.fila[index])[1];
	for (let i = 0; i < filas.fila.length; i++) {
		if (filas.fila[i][socketId]) {
			delete filas.fila[i][socketId];
		}
	}
	/**
	 * 1. Encontra o objeto socket do cliente no array de todos os sockets conectados
	 * 2. Sair da sala da fila antiga
	 * 3. Entrar na sala da fila nova
	 * 4. Adicionar o cliente à fila nova
	 * 5. Fazer update ao dashboard
	 */
	const socket_cliente = io.sockets.connected[socketId];
	socket_cliente.leave(filaAtual);
	socket_cliente.join(filaNova);
	addToFila(socketId, filaNova);
	updateDashboard();
}

/** EVENTO onConnection */
io.on("connection", socket => {
	/** EVENTO na ligação de um novo user */
	socket.on("new-user", fila => {
		/** O cliente entra numa sala (que tem o nome da fila)*/
		socket.join(fila);

		addToFila(socket.id, fila);
		updateDashboard();
	});

	/** EVENTO para retornar o nº de users presentes na fila */
	socket.on("get-number-users", fila => {
		updateUsersInFila(fila);
	});

	socket.on("painel", () => {
		// TODO Dados no painel ao painel entrar??
		//updatePainel();
	});

	/** EVENTO para atualizar o dashboard, quando alguem entra no dashboard */
	socket.on("dashboard", () => {
		updateDashboard();
	});

	/** EVENTO quando a senha é chamada ao balcão */
	socket.on("chamar-senha", (fila, balcao) => {
		updatePainel(fila, balcao);
		io.to(fila).emit("balcao", balcao);
	});

	/** EVENTO quando o cliente é transferido para outra fila */
	socket.on("trocar-fila", (filaAtual, filaNova) => {
		trocarFila(filaAtual, filaNova);
	});

	/** EVENTO quando o cliente é atendido */
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

server.listen(process.env.SERVER_PORT, process.env.SERVER_IP, () => {
	console.log(
		`Server ON no IP : ${process.env.SERVER_IP}:${process.env.SERVER_PORT}`
	);
});
