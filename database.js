const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Garante que o diretório database exista
const dbDir = path.resolve(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Caminho do arquivo SQLite
const dbPath = path.resolve(dbDir, 'doce-encanto.db');

// Conexão com o banco SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados SQLite (Doce Encanto):', err.message);
    } else {
        console.log('Conectado com sucesso ao banco de dados SQLite Doce Encanto.');
    }
});

// Inicialização e Estruturação das Tabelas com Migração Automática
db.serialize(() => {
    // 1. TABELA DE USUÁRIOS
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Migração de colunas para tabela usuarios
    const colunasUsuarios = [
        { nome: 'telefone', tipo: 'TEXT' },
        { nome: 'endereco', tipo: 'TEXT' },
        { nome: 'complemento', tipo: 'TEXT' },
        { nome: 'bairro', tipo: 'TEXT' },
        { nome: 'cidade', tipo: "TEXT DEFAULT 'Curitiba'" },
        { nome: 'cep', tipo: 'TEXT' },
        { nome: 'role', tipo: "TEXT DEFAULT 'cliente'" },
        { nome: 'saldo_cashback', tipo: 'REAL DEFAULT 0.00' }
    ];

    db.all("PRAGMA table_info(usuarios)", (err, columns) => {
        if (!err && columns) {
            const existentes = columns.map(c => c.name);
            colunasUsuarios.forEach(col => {
                if (!existentes.includes(col.nome)) {
                    db.run(`ALTER TABLE usuarios ADD COLUMN ${col.nome} ${col.tipo}`, () => {});
                }
            });
        }
    });

    // 2. TABELA DE PEDIDOS
    db.run(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_pedido TEXT,
            usuario_id INTEGER,
            email_usuario TEXT,
            nome_cliente TEXT,
            telefone_cliente TEXT,
            endereco_entrega TEXT,
            forma_pagamento TEXT,
            itens_json TEXT,
            subtotal REAL DEFAULT 0.00,
            desconto REAL DEFAULT 0.00,
            total REAL NOT NULL,
            status TEXT DEFAULT 'Em Preparação',
            observacao TEXT,
            data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
        )
    `);

    // Migração de colunas para tabela pedidos
    const colunasPedidos = [
        { nome: 'numero_pedido', tipo: 'TEXT' },
        { nome: 'email_usuario', tipo: 'TEXT' },
        { nome: 'nome_cliente', tipo: 'TEXT' },
        { nome: 'telefone_cliente', tipo: 'TEXT' },
        { nome: 'endereco_entrega', tipo: 'TEXT' },
        { nome: 'forma_pagamento', tipo: 'TEXT' },
        { nome: 'itens_json', tipo: 'TEXT' },
        { nome: 'subtotal', tipo: 'REAL DEFAULT 0.00' },
        { nome: 'desconto', tipo: 'REAL DEFAULT 0.00' },
        { nome: 'status', tipo: "TEXT DEFAULT 'Em Preparação'" },
        { nome: 'observacao', tipo: 'TEXT' }
    ];

    db.all("PRAGMA table_info(pedidos)", (err, columns) => {
        if (!err && columns) {
            const existentes = columns.map(c => c.name);
            colunasPedidos.forEach(col => {
                if (!existentes.includes(col.nome)) {
                    db.run(`ALTER TABLE pedidos ADD COLUMN ${col.nome} ${col.tipo}`, () => {});
                }
            });
        }
    });

    // 3. TABELA DE PRODUTOS
    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            categoria TEXT,
            preco REAL NOT NULL,
            descricao TEXT,
            imagem TEXT,
            disponivel INTEGER DEFAULT 1,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 4. TABELA DE FAVORITOS DO USUÁRIO
    db.run(`
        CREATE TABLE IF NOT EXISTS favoritos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            produto_nome TEXT NOT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
        )
    `);

    // 5. INSERÇÃO DE CONTAS PADRÃO SE NÃO EXISTIREM
    setTimeout(() => {
        db.get("SELECT id FROM usuarios WHERE email = 'admin@doceencanto.com'", (err, row) => {
            if (!row) {
                db.run(`
                    INSERT INTO usuarios (nome, email, senha, telefone, endereco, bairro, cidade, cep, role, saldo_cashback)
                    VALUES ('Administrador Geral', 'admin@doceencanto.com', '123456', '(41) 99999-9999', 'Rua André de Barros, 750', 'Centro', 'Curitiba', '80010-080', 'admin', 50.00)
                `, () => console.log('Conta do Administrador inicializada no SQLite.'));
            }
        });

        db.get("SELECT id FROM usuarios WHERE email = 'maria.silva@gmail.com'", (err, row) => {
            if (!row) {
                db.run(`
                    INSERT INTO usuarios (nome, email, senha, telefone, endereco, bairro, cidade, cep, role, saldo_cashback)
                    VALUES ('Maria Silva', 'maria.silva@gmail.com', '123456', '(41) 98888-1234', 'Rua XV de Novembro, 1200', 'Centro', 'Curitiba', '80020-310', 'cliente', 15.50)
                `);
            }
        });
    }, 500);
});

// FUNÇÕES DE CRUD (EXPORTADAS PARA O NODE.JS)
const DatabaseAPI = {
    db,
    // Usuários
    cadastrarUsuario: (usuario, callback) => {
        const query = `
            INSERT INTO usuarios (nome, email, senha, telefone, endereco, complemento, bairro, cidade, cep, role, saldo_cashback)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(query, [
            usuario.nome, usuario.email, usuario.senha, usuario.telefone || '',
            usuario.endereco || '', usuario.complemento || '', usuario.bairro || '',
            usuario.cidade || 'Curitiba', usuario.cep || '', usuario.role || 'cliente',
            usuario.saldo_cashback || 0.00
        ], function(err) {
            callback(err, { id: this.lastID, ...usuario });
        });
    },

    buscarUsuarioPorEmail: (email, callback) => {
        db.get("SELECT * FROM usuarios WHERE email = ?", [email], callback);
    },

    listarUsuarios: (callback) => {
        db.all("SELECT id, nome, email, telefone, endereco, bairro, cidade, cep, role, saldo_cashback, criado_em FROM usuarios ORDER BY id DESC", [], callback);
    },

    atualizarUsuario: (id, dados, callback) => {
        const query = `
            UPDATE usuarios 
            SET nome = ?, telefone = ?, endereco = ?, complemento = ?, bairro = ?, cidade = ?, cep = ?
            WHERE id = ?
        `;
        db.run(query, [dados.nome, dados.telefone, dados.endereco, dados.complemento, dados.bairro, dados.cidade, dados.cep, id], callback);
    },

    excluirUsuario: (id, callback) => {
        db.run("DELETE FROM usuarios WHERE id = ?", [id], callback);
    },

    // Pedidos
    criarPedido: (pedido, callback) => {
        const query = `
            INSERT INTO pedidos (numero_pedido, usuario_id, email_usuario, nome_cliente, telefone_cliente, endereco_entrega, forma_pagamento, itens_json, subtotal, desconto, total, status, observacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(query, [
            pedido.numero_pedido, pedido.usuario_id, pedido.email_usuario,
            pedido.nome_cliente, pedido.telefone_cliente, pedido.endereco_entrega,
            pedido.forma_pagamento, pedido.itens_json, pedido.subtotal,
            pedido.desconto, pedido.total, pedido.status || 'Em Preparação',
            pedido.observacao || ''
        ], function(err) {
            callback(err, { id: this.lastID, ...pedido });
        });
    },

    listarPedidos: (callback) => {
        db.all("SELECT * FROM pedidos ORDER BY id DESC", [], callback);
    },

    atualizarStatusPedido: (id, status, callback) => {
        db.run("UPDATE pedidos SET status = ? WHERE id = ?", [status, id], callback);
    }
};

module.exports = DatabaseAPI;
