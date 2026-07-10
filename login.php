<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <title>Login - Doce Encanto</title>
    <link rel="stylesheet" href="css/style.css">
</head>

<body>

    <div class="login">

        <h1>🍰 Login</h1>

        <form action="verificar_login.php" method="POST">

            <label>Email</label>
            <input type="email" name="email" placeholder="Digite seu email" required>
            
            <label>Senha</label>
            <input type="password" name="senha" placeholder="Digite sua senha" required>
            <button type="submit">Entrar</button>

        </form>

        <p>Não possui uma conta?
            <a href="cadastro.php">Cadastre-se</a>
         </p>

    </div>

</body>

</html>