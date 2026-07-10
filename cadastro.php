<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cadastro</title>
</head>
<body>

<h1>Cadastro de Cliente</h1>

<form action="salvar_usuario.php" method="POST">

    <label>Nome:</label>
    <br>
    <input type="text" name="nome" required>

    <br><br>

    <label>Email:</label>
    <br>
    <input type="email" name="email" required>

    <br><br>

    <label>Senha:</label>
    <br>
    <input type="password" name="senha" required>

    <br><br>

    <button type="submit">
        Cadastrar
    </button>

</form>

</body>
</html>