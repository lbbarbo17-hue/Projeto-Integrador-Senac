function exigeAutenticacao(req, res, next) {
    if (!req.session.usuario) return res.redirect('login.html');
    next();
}

function redirecionaAutenticado(req, res, next) {
    if (req.session.usuario) return res.redirect('inicio.html');
    next();
}

function exigeAdministrador(req, res, next) {
    if (!req.session.usuario) return res.redirect('login.html');
    if (!req.session.usuario.administrador) return res.status(403).render('403');
    next();
}

module.exports = { exigeAutenticacao, redirecionaAutenticado, exigeAdministrador };
