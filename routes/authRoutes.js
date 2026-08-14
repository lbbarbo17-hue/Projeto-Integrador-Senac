const express = require('express');
const bcrypt = require('bcrypt');
const { redirecionaAutenticado } = require('../middleware/authMiddleware');

const router = express.Router();

function definirMensagem(req, tipo, texto) {
    req.session.mensagem = { tipo, texto };
}

function obterMensagem(req) {
    const mensagem = req.session.mensagem;
    delete req.session.mensagem;
    return mensagem;
}

function buscarUsuario(db, email) {
    return new Promise((resolve, reject) => {
        db.get('SELECT id, nome, email, senha, administrador FROM usuarios WHERE email = ?', [email], (erro, usuario) => {
            if (erro) return reject(erro);
            resolve(usuario);
        });
    });
}

function contarUsuarios(db) {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) AS total FROM usuarios', (erro, resultado) => (erro ? reject(erro) : resolve(resultado.total)));
    });
}

function criarUsuario(db, nome, email, senha, administrador) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO usuarios (nome, email, senha, administrador) VALUES (?, ?, ?, ?)', [nome, email, senha, administrador], erro => {
            if (erro) return reject(erro);
            resolve();
        });
    });
}

router.get('/login', redirecionaAutenticado, (req, res) => {
    const mensagem = req.query.logout ? { tipo: 'sucesso', texto: 'Você saiu da sua conta.' } : obterMensagem(req);
    res.render('login', { mensagem });
});

router.post('/login', redirecionaAutenticado, async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const senha = req.body.senha || '';

    try {
        const usuario = await buscarUsuario(req.app.locals.db, email);
        if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
            definirMensagem(req, 'erro', 'E-mail ou senha inválidos.');
            return res.redirect('/login');
        }

        req.session.regenerate(erro => {
            if (erro) return res.status(500).render('login', { mensagem: { tipo: 'erro', texto: 'Não foi possível iniciar a sessão.' } });
            req.session.usuario = { id: usuario.id, nome: usuario.nome, email: usuario.email, administrador: Boolean(usuario.administrador) };
            res.redirect('/inicio');
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).render('login', { mensagem: { tipo: 'erro', texto: 'Ocorreu um erro ao entrar. Tente novamente.' } });
    }
});

router.get('/cadastro', redirecionaAutenticado, (req, res) => {
    res.render('cadastro', { mensagem: obterMensagem(req) });
});

router.post('/cadastro', redirecionaAutenticado, async (req, res) => {
    const nome = (req.body.nome || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const senha = req.body.senha || '';

    if (nome.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || senha.length < 6) {
        definirMensagem(req, 'erro', 'Preencha os dados corretamente. A senha deve ter ao menos 6 caracteres.');
        return res.redirect('/cadastro');
    }

    try {
        const senhaCriptografada = await bcrypt.hash(senha, 12);
        const administrador = (await contarUsuarios(req.app.locals.db)) === 0 ? 1 : 0;
        await criarUsuario(req.app.locals.db, nome, email, senhaCriptografada, administrador);
        definirMensagem(req, 'sucesso', 'Cadastro realizado! Agora entre com sua conta.');
        res.redirect('/login');
    } catch (erro) {
        if (erro.code === 'SQLITE_CONSTRAINT') {
            definirMensagem(req, 'erro', 'Este e-mail já possui uma conta.');
            return res.redirect('/cadastro');
        }
        console.error(erro);
        res.status(500).render('cadastro', { mensagem: { tipo: 'erro', texto: 'Não foi possível concluir seu cadastro.' } });
    }
});

module.exports = router;
