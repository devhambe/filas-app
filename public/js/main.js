function checkTime(i) {
	if (i < 10) {
		i = '0' + i; // acrescenta um zero à frente de números<10
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
	document.getElementById('tempo-atual').innerHTML = h + ':' + m + ':' + s;
	t = setTimeout(function() {
		getTime();
	}, 500);
}

function getDate() {
	const options = { weekday: 'long', month: 'long', year: 'numeric', day: 'numeric' };
	const today = new Date();
	const str = today.toLocaleDateString('pt-PT', options);
	document.getElementById('data-atual').innerHTML = str.toUpperCase();
}

function populate(elements, array) {
	for (i in elements) {
		if (array[i] !== null) {
			$(elements[i]).text(array[i]);
		} else if (array[i] == undefined) {
			$(elements[i]).text('...');
		}
	}
}
