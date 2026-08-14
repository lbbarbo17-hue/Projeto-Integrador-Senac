const express = require('express');
const session = require('express-session');
const path = require('path');
const iniciarBanco = require('./database/connection');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');

const app = express();
const porta = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));
app.use('/imagens_inicio', express.static(path.join(__dirname, 'imagens_inicio')));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'altere-esta-chave-antes-de-publicar',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 4
    }
}));

app.get('/', (req, res) => res.redirect(req.session.usuario ? '/inicio' : '/login'));
app.get('/loja', (req, res) => res.sendFile(path.join(__dirname, 'inicio.html')));
app.get('/inicio.css', (req, res) => res.sendFile(path.join(__dirname, 'inicio.css')));
app.get('/inicio.js', (req, res) => res.sendFile(path.join(__dirname, 'inicio.js')));
app.get('/login.html', (req, res) => res.redirect('/login'));
app.get('/cadastro.html', (req, res) => res.redirect('/cadastro'));
app.use(authRoutes);
app.use(protectedRoutes);

app.use((req, res) => res.status(404).render('404'));

async function iniciarServidor() {
    try {
        app.locals.db = await iniciarBanco();
        app.listen(porta, () => console.log(`Servidor em execução: http://localhost:${porta}`));
    } catch (erro) {
        console.error('Não foi possível iniciar o banco de dados:', erro);
        process.exit(1);
    }
}

iniciarServidor();
