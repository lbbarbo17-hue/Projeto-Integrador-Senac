const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const arquivoBanco = path.join(__dirname, 'doce-encanto.db');

function executar(db, sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, erro => (erro ? reject(erro) : resolve()));
    });
}

async function iniciarBanco() {
    const db = await new Promise((resolve, reject) => {
        const conexao = new sqlite3.Database(arquivoBanco, erro => {
            if (erro) return reject(erro);
            resolve(conexao);
        });
    });

    await executar(db, `
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha TEXT NOT NULL,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const colunas = await new Promise((resolve, reject) => {
        db.all('PRAGMA table_info(usuarios)', (erro, resultado) => (erro ? reject(erro) : resolve(resultado)));
    });

    if (!colunas.some(coluna => coluna.name === 'administrador')) {
        await executar(db, 'ALTER TABLE usuarios ADD COLUMN administrador INTEGER NOT NULL DEFAULT 0');
    }

    // Em bancos já existentes, o primeiro usuário passa a ser o administrador inicial.
    await executar(db, `
        UPDATE usuarios
        SET administrador = 1
        WHERE id = (SELECT MIN(id) FROM usuarios)
          AND NOT EXISTS (SELECT 1 FROM usuarios WHERE administrador = 1)
    `);

    return db;
}

module.exports = iniciarBanco;
