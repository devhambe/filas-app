# filas-app

## Introdução
Este sistema de gestão de filas tem como objetivo facilitar o funcionamento das filas de espera onde quer que seja implementado.
O programa funciona da maneira seguinte:
+	O administrador consegue registar utilizadores, estes podem ser outros administradores ou podem ser operadores de balcões.
+	Para além dos utilizadores, o administrador consegue criar os balcões, cada balcão tem um número e um operador associado, os balcões também podem ser desativados.
+	Os clientes quando pedem uma senha, conseguem ver a sua senha, e a quantidade de pessoas que estão na mesma fila.
+	Quando o operador chamar a senha do cliente, o painel de senhas é atualizado e o cliente é avisado. O painel de senhas mostra a senha que foi chamada e o balcão que chamou a senha.
+	O operador tem a opção de registar os dados do cliente e a função de transferir o cliente para outra fila de espera.
+	Ambos os administradores e operadores conseguem ver a lista de clientes que foram registados.
+	O painel de senhas mostra a data e um relógio. Através de uma API de notícias (NewsAPI https://newsapi.org/), o painel mostra os headlines de topo das últimas notícias.

## Para inicializar

### Base de dados
Para inicializar o programa, importe o ficheiro filas_app.sql para o seu sistema de gestão de base de dados.

### NewsAPI Key
Arranje uma chave do NewsAPI em https://newsapi.org/

### Variáveis de ambiente
Crie um ficheiro com o nome .env com as seguintes variáveis:
![ficheiro .env](https://imgur.com/2OQrY3n.png)
