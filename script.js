// =========================================================================
// script.js - GERENCIADOR CENTRAL DE BANCO DE DADOS & CONTAS (DOCE ENCANTO)
// Suporta sincronização de usuários, pedidos, permissões, cashback e favoritos
// =========================================================================

(function() {
    const STORAGE_KEY_USUARIOS = 'usuariosDoceEncanto';
    const STORAGE_KEY_PEDIDOS = 'pedidosDoceEncanto';
    const STORAGE_KEY_SESSAO = 'usuarioLogadoDoceEncanto';
    const STORAGE_KEY_FAVORITOS = 'favoritosDoceEncanto';

    // 1. INICIALIZAÇÃO / SEMEADURA AUTOMÁTICA DE DADOS SE NÃO EXISTIREM
    function inicializarBanco() {
        let usuarios = JSON.parse(localStorage.getItem(STORAGE_KEY_USUARIOS));
        if (!usuarios || usuarios.length === 0) {
            usuarios = [
                {
                    id: 1,
                    nome: 'Administrador Geral',
                    email: 'admin@doceencanto.com',
                    senha: '123456',
                    telefone: '(41) 99999-9999',
                    cep: '80010-080',
                    endereco: 'Rua André de Barros',
                    numero: '750',
                    complemento: 'Loja 01',
                    bairro: 'Centro',
                    cidade: 'Curitiba',
                    role: 'admin',
                    saldoCashback: 50.00,
                    criadoEm: '01/08/2026 10:00'
                },
                {
                    id: 2,
                    nome: 'Maria Silva',
                    email: 'maria.silva@gmail.com',
                    senha: '123456',
                    telefone: '(41) 98888-1234',
                    cep: '80020-310',
                    endereco: 'Rua XV de Novembro',
                    numero: '1200',
                    complemento: 'Apto 42',
                    bairro: 'Centro',
                    cidade: 'Curitiba',
                    role: 'cliente',
                    saldoCashback: 15.50,
                    criadoEm: '10/08/2026 14:30'
                },
                {
                    id: 3,
                    nome: 'Carlos Oliveira',
                    email: 'carlos.oliveira@gmail.com',
                    senha: '123456',
                    telefone: '(41) 97777-5678',
                    cep: '80230-010',
                    endereco: 'Av. Sete de Setembro',
                    numero: '450',
                    complemento: 'Bloco B',
                    bairro: 'Batel',
                    cidade: 'Curitiba',
                    role: 'cliente',
                    saldoCashback: 8.00,
                    criadoEm: '20/08/2026 16:15'
                },
                {
                    id: 4,
                    nome: 'Laura Barbosa',
                    email: 'laura@email.com',
                    senha: '123456',
                    telefone: '(41) 99123-4567',
                    cep: '80045-010',
                    endereco: 'Rua Marechal Deodoro',
                    numero: '800',
                    complemento: 'Sala 3',
                    bairro: 'Alto da XV',
                    cidade: 'Curitiba',
                    role: 'cliente',
                    saldoCashback: 22.00,
                    criadoEm: '14/08/2026 19:43'
                }
            ];
            localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
        } else {
            // Garante que todos os usuários existentes tenham os campos completos e role definidos
            let atualizado = false;
            usuarios.forEach(u => {
                if (!u.role) {
                    u.role = u.email === 'admin@doceencanto.com' ? 'admin' : 'cliente';
                    atualizado = true;
                }
                if (u.saldoCashback === undefined) {
                    u.saldoCashback = 10.00;
                    atualizado = true;
                }
                if (!u.telefone) u.telefone = '(41) 99999-9999';
                if (!u.cidade) u.cidade = 'Curitiba';
                if (!u.criadoEm) u.criadoEm = '15/08/2026 12:00';
            });
            if (atualizado) {
                localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
            }
        }

        // Semeadura inicial de pedidos para visualização no admin e cliente
        let pedidos = JSON.parse(localStorage.getItem(STORAGE_KEY_PEDIDOS));
        if (!pedidos || pedidos.length === 0) {
            pedidos = [
                {
                    id: 1042,
                    emailUsuario: 'maria.silva@gmail.com',
                    nomeCliente: 'Maria Silva',
                    telefone: '(41) 98888-1234',
                    endereco: 'Rua XV de Novembro, 1200 - Centro, Curitiba',
                    formaPagamento: 'PIX',
                    data: '24/09/2026 11:30',
                    status: 'Em Produção 👩‍🍳',
                    itens: [
                        { nome: 'Bolo de pote Ninho com Morango', preco: 14.00, quantidade: 2 },
                        { nome: 'Fondue Brownie Supreme', preco: 21.90, quantidade: 1 }
                    ],
                    observacao: 'Caprichar nos morangos por favor!',
                    total: 49.90
                },
                {
                    id: 1038,
                    emailUsuario: 'carlos.oliveira@gmail.com',
                    nomeCliente: 'Carlos Oliveira',
                    telefone: '(41) 97777-5678',
                    endereco: 'Av. Sete de Setembro, 450 - Batel, Curitiba',
                    formaPagamento: 'Cartão de Crédito',
                    data: '23/09/2026 17:15',
                    status: 'Entregue ✅',
                    itens: [
                        { nome: 'Naked Cake Prestígio 1kg', preco: 89.90, quantidade: 1 }
                    ],
                    observacao: 'Para aniversário às 19h.',
                    total: 89.90
                },
                {
                    id: 1025,
                    emailUsuario: 'laura@email.com',
                    nomeCliente: 'Laura Barbosa',
                    telefone: '(41) 99123-4567',
                    endereco: 'Rua Marechal Deodoro, 800 - Alto da XV, Curitiba',
                    formaPagamento: 'PIX',
                    data: '22/09/2026 14:00',
                    status: 'Entregue ✅',
                    itens: [
                        { nome: 'Supreme de Maracujá', preco: 17.00, quantidade: 2 },
                        { nome: 'Combo 3 Brigadeirão Gourmet', preco: 25.00, quantidade: 1 }
                    ],
                    observacao: 'Sem observações.',
                    total: 59.00
                }
            ];
            localStorage.setItem(STORAGE_KEY_PEDIDOS, JSON.stringify(pedidos));
        }
    }

    inicializarBanco();

    // 2. OBJETO DE API GLOBAL DO BANCO DE DADOS
    window.DoceEncantoDB = {
        // --- USUÁRIOS ---
        obterUsuarios: function() {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_USUARIOS)) || [];
        },

        obterUsuarioPorEmail: function(email) {
            if (!email) return null;
            const usuarios = this.obterUsuarios();
            return usuarios.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
        },

        obterUsuarioLogado: function() {
            const sessao = JSON.parse(localStorage.getItem(STORAGE_KEY_SESSAO));
            if (!sessao || !sessao.email) return null;
            return this.obterUsuarioPorEmail(sessao.email) || sessao;
        },

        salvarUsuario: function(usuario) {
            let usuarios = this.obterUsuarios();
            const index = usuarios.findIndex(u => u.email.toLowerCase() === usuario.email.toLowerCase());
            
            if (index !== -1) {
                // Atualiza mantendo propriedades antigas se não passadas
                usuarios[index] = { ...usuarios[index], ...usuario };
            } else {
                // Novo usuário
                if (!usuario.id) usuario.id = Date.now();
                if (!usuario.role) usuario.role = 'cliente';
                if (usuario.saldoCashback === undefined) usuario.saldoCashback = 5.00;
                if (!usuario.criadoEm) {
                    const agora = new Date();
                    usuario.criadoEm = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }
                usuarios.push(usuario);
            }
            localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));

            // Se for o usuário logado, atualiza também a sessão
            const logado = this.obterUsuarioLogado();
            if (logado && logado.email.toLowerCase() === usuario.email.toLowerCase()) {
                const dadosSessao = {
                    nome: usuario.nome || logado.nome,
                    email: usuario.email,
                    role: usuario.role || logado.role || 'cliente'
                };
                localStorage.setItem(STORAGE_KEY_SESSAO, JSON.stringify(dadosSessao));
            }
            return true;
        },

        excluirUsuario: function(email) {
            let usuarios = this.obterUsuarios();
            const novos = usuarios.filter(u => u.email.toLowerCase() !== email.toLowerCase());
            localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(novos));

            const logado = this.obterUsuarioLogado();
            if (logado && logado.email.toLowerCase() === email.toLowerCase()) {
                localStorage.removeItem(STORAGE_KEY_SESSAO);
            }
            return true;
        },

        alterarCargoUsuario: function(email, novoCargo) {
            let usuarios = this.obterUsuarios();
            const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (usuario) {
                usuario.role = novoCargo;
                localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));

                const logado = this.obterUsuarioLogado();
                if (logado && logado.email.toLowerCase() === email.toLowerCase()) {
                    logado.role = novoCargo;
                    localStorage.setItem(STORAGE_KEY_SESSAO, JSON.stringify(logado));
                }
                return true;
            }
            return false;
        },

        adicionarCashback: function(email, valor) {
            let usuarios = this.obterUsuarios();
            const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (usuario) {
                usuario.saldoCashback = Number(((usuario.saldoCashback || 0) + Number(valor)).toFixed(2));
                localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
                return usuario.saldoCashback;
            }
            return 0;
        },

        // --- PEDIDOS ---
        obterPedidos: function() {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_PEDIDOS)) || [];
        },

        obterPedidosUsuario: function(email) {
            if (!email) return [];
            const pedidos = this.obterPedidos();
            return pedidos.filter(p => p.emailUsuario && p.emailUsuario.toLowerCase() === email.toLowerCase());
        },

        salvarNovoPedido: function(pedido) {
            let pedidos = this.obterPedidos();
            if (!pedido.id) pedido.id = Math.floor(1000 + Math.random() * 9000);
            if (!pedido.status) pedido.status = 'Em Produção 👩‍🍳';
            if (!pedido.data) {
                const agora = new Date();
                pedido.data = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }

            pedidos.unshift(pedido);
            localStorage.setItem(STORAGE_KEY_PEDIDOS, JSON.stringify(pedidos));

            // Bonifica com 5% de cashback na conta do usuário cadastrado
            if (pedido.emailUsuario && pedido.emailUsuario !== 'cliente_visitante@doceencanto.com') {
                const cashback = Number((pedido.total * 0.05).toFixed(2));
                this.adicionarCashback(pedido.emailUsuario, cashback);
            }

            return pedido;
        },

        atualizarStatusPedido: function(idPedido, novoStatus) {
            let pedidos = this.obterPedidos();
            const pedido = pedidos.find(p => String(p.id) === String(idPedido));
            if (pedido) {
                pedido.status = novoStatus;
                localStorage.setItem(STORAGE_KEY_PEDIDOS, JSON.stringify(pedidos));
                return true;
            }
            return false;
        },

        // --- FAVORITOS ---
        obterFavoritos: function(email) {
            if (!email) return [];
            const todos = JSON.parse(localStorage.getItem(STORAGE_KEY_FAVORITOS)) || {};
            return todos[email.toLowerCase()] || [];
        },

        alternarFavorito: function(email, produtoNome) {
            if (!email || !produtoNome) return false;
            let todos = JSON.parse(localStorage.getItem(STORAGE_KEY_FAVORITOS)) || {};
            const userKey = email.toLowerCase();
            let favs = todos[userKey] || [];

            const idx = favs.indexOf(produtoNome);
            let adicionado = false;
            if (idx === -1) {
                favs.push(produtoNome);
                adicionado = true;
            } else {
                favs.splice(idx, 1);
                adicionado = false;
            }
            todos[userKey] = favs;
            localStorage.setItem(STORAGE_KEY_FAVORITOS, JSON.stringify(todos));
            return adicionado;
        },

        isFavorito: function(email, produtoNome) {
            const favs = this.obterFavoritos(email);
            return favs.includes(produtoNome);
        },

        // --- BUSCA AUTOMÁTICA DE CEP (VIACEP API) ---
        buscarCep: async function(cepLimpo) {
            const cep = String(cepLimpo).replace(/\D/g, '');
            if (cep.length !== 8) return null;
            try {
                const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const dados = await resp.json();
                if (dados.erro) return null;
                return {
                    rua: dados.logradouro || '',
                    bairro: dados.bairro || '',
                    cidade: dados.localidade || 'Curitiba',
                    uf: dados.uf || 'PR'
                };
            } catch (e) {
                console.warn('Erro ao consultar ViaCEP:', e);
                return null;
            }
        },

        // --- EXPORTAÇÃO DE RELATÓRIO DO BANCO ---
        exportarBancoJSON: function() {
            const dadosCompletos = {
                dataExportacao: new Date().toISOString(),
                usuarios: this.obterUsuarios(),
                pedidos: this.obterPedidos()
            };
            const jsonStr = JSON.stringify(dadosCompletos, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-doce-encanto-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // Sincroniza contador de carrinho na inicialização
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof atualizarCarrinho === 'function') {
            atualizarCarrinho();
        }
    });
})();