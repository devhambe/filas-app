function checkTime(i) {
	if (i < 10) {
		i = "0" + i; // acrescenta um zero à frente de números < 10
	}
	return i;
}

function getTime() {
	var today = new Date();
	var h = today.getHours();
	var m = today.getMinutes();
	var s = today.getSeconds();
	m = checkTime(m);
	s = checkTime(s);
	document.getElementById("tempo-atual").innerHTML = h + ":" + m + ":" + s;
	t = setTimeout(function() {
		getTime();
	}, 500);
}

function getDate() {
	const options = {
		weekday: "long",
		month: "long",
		year: "numeric",
		day: "numeric"
	};
	const today = new Date();
	const str = today.toLocaleDateString("pt-PT", options);
	document.getElementById("data-atual").innerHTML = str.toUpperCase();
}

function populateUsers(elements, users) {
	for (i in elements) {
		if (users[i] !== null) {
			$(elements[i]).text(users[i]);
		}
	}
}

function populateSenhas(elements, senhas) {
	for (i in elements) {
		const fila = senhas[i][0];
		if (senhas[i][1] !== undefined) {
			const senha = fila + senhas[i][1];
			$(elements[i]).text(senha);
			$(`button[data-fila='${fila}']`).prop("disabled", false);
			const entrada = Date.now();
			$("#timer").data("entrada", entrada.toString());
		} else {
			$(elements[i]).text("...");
			$(`button[data-fila='${fila}']`).prop("disabled", true);
		}
	}
}

function populatePainel(fila, senha, balcao) {
	if (senha == null) {
		senha = "000";
		balcao = "---";
	} else if (senha < 10) {
		senha = "00" + senha;
	} else if (senha >= 10) {
		senha = "0" + senha;
	}
	$(`#senha-${fila}`)
		.text(senha)
		.fadeOut()
		.fadeIn()
		.fadeOut()
		.fadeIn();
	$(`#balcao-${fila}`)
		.text(balcao)
		.fadeOut()
		.fadeIn()
		.fadeOut()
		.fadeIn();

	const audio_senha = document.getElementById("audio-senha");
	audio_senha.play();
}

function mostrarFuncao(nivel, id) {
	let funcao;
	if (nivel == 1) {
		funcao = "Administrador";
		$(".btn-chamar").hide();
	} else if (nivel == 2) {
		funcao = "Operador";
		$(".sidebar-register, .sidebar-balcoes").hide();
		$.ajax({
			type: "POST",
			url: "/ajax/balcao",
			data: { id: id },
			success: function(res) {
				res = JSON.parse(res);
				if (res.length == 0) {
					$(".btn-chamar").prop("disabled", true);
				} else {
					$(".balcao-atual").text(`Balcão nº ${res[0].numero}`);
					$(".balcao-atual").attr("data-id", res[0].numero);
				}
			}
		});
	}
	$(".funcao").text(funcao);
}
