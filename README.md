# Sistema de Login — Doce Encanto

Sistema de autenticação com Node.js, Express, EJS e SQLite. Ele permite cadastro, login, controle de sessão, acesso à página protegida e logout.

## Instalação e execução

1. Instale o [Node.js](https://nodejs.org/).
2. No diretório do projeto, execute `npm install`.
3. Copie `.env.example` para `.env` e defina uma `SESSION_SECRET` segura.
4. Execute `npm start`.
5. Abra `http://localhost:3000`

O SQLite cria automaticamente o arquivo `database/doce-encanto.db` e a tabela `usuarios` na primeira execução.

## Rotas

| Rota | Método | Ação |
| --- | --- | --- |
| `/cadastro` | GET/POST | Mostra e processa o cadastro. |
| `/login` | GET/POST | Mostra e processa a autenticação. |
| `/inicio` | GET | Página protegida, exige sessão. |
| `/admin` | GET | Painel restrito para administração de usuários. |
| `/logout` | POST | Encerra a sessão atual. |

As senhas são protegidas com `bcrypt` (12 rounds) e nunca são armazenadas em texto simples. O e-mail possui restrição `UNIQUE` no SQLite e também é validado no servidor.

O primeiro usuário cadastrado recebe o papel de administrador. Esse usuário pode acessar `/admin`, promover ou remover outros administradores e excluir contas. O sistema nunca permite remover o último administrador nem excluir a própria conta pelo painel.

## Estrutura

```
database/     configuração e arquivo SQLite gerado
middleware/   proteção das rotas autenticadas
public/       CSS e demais recursos estáticos
routes/       rotas de autenticação e páginas protegidas
views/        telas EJS
app.js         configuração do Express e do servidor
```
