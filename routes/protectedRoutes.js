const express = require('express');
const { exigeAutenticacao, exigeAdministrador } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/inicio', exigeAutenticacao, (req, res) => {
    res.render('inicio', { usuario: req.session.usuario });
});

router.post('/logout', exigeAutenticacao, (req, res, next) => {
    req.session.destroy(erro => {
        if (erro) return next(erro);
        res.clearCookie('connect.sid');
        res.redirect('/login?logout=1');
    });
});

function listarUsuarios(db) {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, nome, email, administrador, criado_em FROM usuarios ORDER BY criado_em DESC', (erro, usuarios) => {
            if (erro) return reject(erro);
            resolve(usuarios);
        });
    });
}

function buscarUsuarioPorId(db, id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT id, administrador FROM usuarios WHERE id = ?', [id], (erro, usuario) => (erro ? reject(erro) : resolve(usuario)));
    });
}

function quantidadeAdministradores(db) {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) AS total FROM usuarios WHERE administrador = 1', (erro, resultado) => (erro ? reject(erro) : resolve(resultado.total)));
    });
}

function executar(db, sql, parametros) {
    return new Promise((resolve, reject) => db.run(sql, parametros, erro => (erro ? reject(erro) : resolve())));
}

router.get('/admin', exigeAdministrador, async (req, res, next) => {
    try {
        const usuarios = await listarUsuarios(req.app.locals.db);
        res.render('admin', { usuario: req.session.usuario, usuarios, mensagem: req.session.mensagem });
        delete req.session.mensagem;
    } catch (erro) { next(erro); }
});

router.post('/admin/usuarios/:id/administrador', exigeAdministrador, async (req, res, next) => {
    const id = Number(req.params.id);
    try {
        const alvo = await buscarUsuarioPorId(req.app.locals.db, id);
        if (!alvo || alvo.id === req.session.usuario.id) {
            req.session.mensagem = { tipo: 'erro', texto: 'Não é possível alterar seu próprio acesso nesta tela.' };
        } else if (alvo.administrador && await quantidadeAdministradores(req.app.locals.db) === 1) {
            req.session.mensagem = { tipo: 'erro', texto: 'Mantenha pelo menos um administrador no sistema.' };
        } else {
            await executar(req.app.locals.db, 'UPDATE usuarios SET administrador = ? WHERE id = ?', [alvo.administrador ? 0 : 1, id]);
            req.session.mensagem = { tipo: 'sucesso', texto: 'Permissão do usuário atualizada.' };
        }
        res.redirect('/admin');
    } catch (erro) { next(erro); }
});

router.post('/admin/usuarios/:id/excluir', exigeAdministrador, async (req, res, next) => {
    const id = Number(req.params.id);
    try {
        const alvo = await buscarUsuarioPorId(req.app.locals.db, id);
        if (!alvo || alvo.id === req.session.usuario.id) {
            req.session.mensagem = { tipo: 'erro', texto: 'Não é possível excluir sua própria conta nesta tela.' };
        } else if (alvo.administrador && await quantidadeAdministradores(req.app.locals.db) === 1) {
            req.session.mensagem = { tipo: 'erro', texto: 'Não é possível excluir o último administrador.' };
        } else {
            await executar(req.app.locals.db, 'DELETE FROM usuarios WHERE id = ?', [id]);
            req.session.mensagem = { tipo: 'sucesso', texto: 'Usuário excluído com sucesso.' };
        }
        res.redirect('/admin');
    } catch (erro) { next(erro); }
});

module.exports = router;
