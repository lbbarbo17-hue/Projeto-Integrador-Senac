<?php
$host = "localhost";
$usuario = "root";
$senha = ""; // No XAMPP, a senha padrão vem em branco
$banco = "confeitaria"; // Substitua pelo nome que você colocou no PHPMyAdmin

$mysqli = new mysqli($host, $usuario, $senha, $banco);

// Verifica se deu erro na conexão
if ($mysqli->connect_error) {
    die("Falha ao conectar ao banco de dados: " . $mysqli->connect_error);
}
?>