// =========================================================================
// script.js - GERENCIADOR CENTRAL DE BANCO DE DADOS & CONTAS (DOCE ENCANTO)
// Suporta sincronização de usuários, pedidos, permissões, cashback e favoritos
// =========================================================================

(function() {
    const STORAGE_KEY_USUARIOS = 'usuariosDoceEncanto';
    const STORAGE_KEY_PEDIDOS = 'pedidosDoceEncanto';
    const STORAGE_KEY_SESSAO = 'usuarioLogadoDoceEncanto';
    const STORAGE_KEY_FAVORITOS = 'favoritosDoceEncanto';
    const STORAGE_KEY_LOGINS = 'historicoLoginsDoceEncanto';

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
                    criadoEm: '01/08/2026 10:00',
                    ultimoLogin: 'Hoje às 14:15',
                    totalLogins: 12
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
                    criadoEm: '10/08/2026 14:30',
                    ultimoLogin: 'Ontem às 18:40',
                    totalLogins: 5
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
                    criadoEm: '20/08/2026 16:15',
                    ultimoLogin: '23/09/2026 16:30',
                    totalLogins: 2
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
                    criadoEm: '14/08/2026 19:43',
                    ultimoLogin: 'Hoje às 11:20',
                    totalLogins: 4
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
                if (!u.ultimoLogin && u.email === 'admin@doceencanto.com') {
                    u.ultimoLogin = 'Hoje às 14:15';
                    u.totalLogins = 12;
                    atualizado = true;
                }
            });
            if (atualizado) {
                localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
            }
        }

        // Semeadura inicial de histórico de logins para o painel administrativo
        let logins = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGINS));
        if (!logins || logins.length === 0) {
            logins = [
                { id: 1, nome: 'Administrador Geral', email: 'admin@doceencanto.com', role: 'admin', data: 'Hoje às 14:15', timestamp: Date.now() - 3600000, status: 'Ativo agora' },
                { id: 2, nome: 'Laura Barbosa', email: 'laura@email.com', role: 'cliente', data: 'Hoje às 11:20', timestamp: Date.now() - 14400000, status: 'Concluído' },
                { id: 3, nome: 'Maria Silva', email: 'maria.silva@gmail.com', role: 'cliente', data: 'Ontem às 18:40', timestamp: Date.now() - 86400000, status: 'Concluído' },
                { id: 4, nome: 'Carlos Oliveira', email: 'carlos.oliveira@gmail.com', role: 'cliente', data: '23/09/2026 16:30', timestamp: Date.now() - 172800000, status: 'Concluído' }
            ];
            localStorage.setItem(STORAGE_KEY_LOGINS, JSON.stringify(logins));
        }

        // Semeadura inicial de pedidos para visualização no admin e cliente
        let pedidos = JSON.parse(localStorage.getItem(STORAGE_KEY_PEDIDOS));
        if (!pedidos || pedidos.length === 0) {
            pedidos = [
                {
                    id: 1045,
                    emailUsuario: 'maria.silva@gmail.com',
                    nomeCliente: 'Maria Silva',
                    telefone: '(41) 98888-1234',
                    endereco: 'Rua XV de Novembro, 1200 - Centro, Curitiba',
                    formaPagamento: 'PIX',
                    data: 'Hoje às 15:10',
                    status: '1. Recebido 📋',
                    itens: [
                        { nome: 'Bolo de pote Cenoura com Brigadeiro', preco: 14.00, quantidade: 2 }
                    ],
                    observacao: 'Deixar na portaria.',
                    total: 28.00
                },
                {
                    id: 1042,
                    emailUsuario: 'maria.silva@gmail.com',
                    nomeCliente: 'Maria Silva',
                    telefone: '(41) 98888-1234',
                    endereco: 'Rua XV de Novembro, 1200 - Centro, Curitiba',
                    formaPagamento: 'PIX',
                    data: '24/09/2026 11:30',
                    status: '2. Processando 👩‍🍳',
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
                    status: '4. Feito / Entregue ✅',
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
                    status: '4. Feito / Entregue ✅',
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
            let usuarioFinal = null;
            
            if (index !== -1) {
                // Atualiza mantendo propriedades antigas se não passadas
                usuarios[index] = { ...usuarios[index], ...usuario };
                usuarioFinal = usuarios[index];
            } else {
                // Novo usuário
                if (!usuario.id) usuario.id = Date.now();
                if (!usuario.role) usuario.role = usuario.email.toLowerCase() === 'admin@doceencanto.com' ? 'admin' : 'cliente';
                if (usuario.saldoCashback === undefined) usuario.saldoCashback = 5.00;
                if (!usuario.criadoEm) {
                    const agora = new Date();
                    usuario.criadoEm = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }
                usuarios.push(usuario);
                usuarioFinal = usuario;
            }
            localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));

            // Se for o usuário logado, atualiza também a sessão com dados completos
            const logado = this.obterUsuarioLogado();
            if (logado && logado.email.toLowerCase() === usuario.email.toLowerCase()) {
                this.fazerLogin(usuarioFinal);
            }

            // Sincroniza usuário com Firebase em nuvem se disponível
            if (window.DoceEncantoFirebase && typeof window.DoceEncantoFirebase.salvarUsuarioFirebase === 'function') {
                window.DoceEncantoFirebase.salvarUsuarioFirebase(usuarioFinal);
            }

            return usuarioFinal;
        },

        fazerLogin: function(usuario) {
            if (!usuario || !usuario.email) return false;
            const emailLimpo = usuario.email.trim().toLowerCase();
            const usuarioCompleto = this.obterUsuarioPorEmail(emailLimpo) || usuario;

            const agora = new Date();
            const dataFormatada = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            // 1. Atualiza dados de login no registro do usuário
            let usuarios = this.obterUsuarios();
            const userIndex = usuarios.findIndex(u => u.email.toLowerCase() === emailLimpo);
            if (userIndex !== -1) {
                usuarios[userIndex].ultimoLogin = dataFormatada;
                usuarios[userIndex].ultimoLoginTimestamp = Date.now();
                usuarios[userIndex].totalLogins = (usuarios[userIndex].totalLogins || 0) + 1;
                localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
                usuarioCompleto.ultimoLogin = dataFormatada;
                usuarioCompleto.totalLogins = usuarios[userIndex].totalLogins;
            }

            // 2. Grava evento no histórico central de logins
            let historico = this.obterHistoricoLogins();
            const registroLogin = {
                id: Date.now(),
                nome: usuarioCompleto.nome || 'Cliente',
                email: emailLimpo,
                role: usuarioCompleto.role || (emailLimpo === 'admin@doceencanto.com' ? 'admin' : 'cliente'),
                data: dataFormatada,
                timestamp: Date.now(),
                status: 'Sessão Ativa ✅'
            };
            historico.unshift(registroLogin);
            if (historico.length > 60) historico = historico.slice(0, 60);
            localStorage.setItem(STORAGE_KEY_LOGINS, JSON.stringify(historico));

            // Sincroniza na nuvem com Firebase se disponível
            if (window.DoceEncantoFirebase && typeof window.DoceEncantoFirebase.salvarLoginFirebase === 'function') {
                window.DoceEncantoFirebase.salvarLoginFirebase(registroLogin);
            }

            const sessao = {
                id: usuarioCompleto.id || Date.now(),
                nome: usuarioCompleto.nome || 'Cliente',
                email: emailLimpo,
                telefone: usuarioCompleto.telefone || '',
                role: usuarioCompleto.role || (emailLimpo === 'admin@doceencanto.com' ? 'admin' : 'cliente'),
                saldoCashback: usuarioCompleto.saldoCashback !== undefined ? usuarioCompleto.saldoCashback : 5.00,
                cep: usuarioCompleto.cep || '',
                endereco: usuarioCompleto.endereco || '',
                numero: usuarioCompleto.numero || '',
                complemento: usuarioCompleto.complemento || '',
                bairro: usuarioCompleto.bairro || '',
                cidade: usuarioCompleto.cidade || 'Curitiba',
                criadoEm: usuarioCompleto.criadoEm || '',
                ultimoLogin: dataFormatada,
                totalLogins: usuarioCompleto.totalLogins || 1
            };
            localStorage.setItem(STORAGE_KEY_SESSAO, JSON.stringify(sessao));
            return sessao;
        },

        obterHistoricoLogins: function() {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_LOGINS)) || [];
        },

        limparHistoricoLogins: function() {
            localStorage.setItem(STORAGE_KEY_LOGINS, JSON.stringify([]));
            return true;
        },

        fazerLogout: function() {
            localStorage.removeItem(STORAGE_KEY_SESSAO);
            return true;
        },

        autenticar: function(email, senha) {
            if (!email || !senha) return null;
            const emailLimpo = email.trim().toLowerCase();
            if (emailLimpo === 'admin@doceencanto.com' && senha === '123456') {
                const adminUser = this.obterUsuarioPorEmail(emailLimpo) || {
                    id: 1,
                    nome: 'Administrador Geral',
                    email: 'admin@doceencanto.com',
                    role: 'admin',
                    telefone: '(41) 99999-9999'
                };
                this.fazerLogin(adminUser);
                return adminUser;
            }
            const usuarios = this.obterUsuarios();
            const encontrado = usuarios.find(u => u.email.toLowerCase() === emailLimpo && String(u.senha) === String(senha));
            if (encontrado) {
                this.fazerLogin(encontrado);
                return encontrado;
            }
            return null;
        },

        excluirUsuario: function(email) {
            let usuarios = this.obterUsuarios();
            const novos = usuarios.filter(u => u.email.toLowerCase() !== email.toLowerCase());
            localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(novos));

            const logado = this.obterUsuarioLogado();
            if (logado && logado.email.toLowerCase() === email.toLowerCase()) {
                this.fazerLogout();
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
            const emailLimpo = email.trim().toLowerCase();
            const pedidos = this.obterPedidos();
            return pedidos.filter(p => p.emailUsuario && p.emailUsuario.trim().toLowerCase() === emailLimpo);
        },

        salvarNovoPedido: function(pedido) {
            let pedidos = this.obterPedidos();
            if (!pedido.id) pedido.id = Math.floor(1000 + Math.random() * 9000);
            
            // Status inicial padronizado com a linha do tempo (1. Recebido 📋)
            if (!pedido.status) pedido.status = '1. Recebido 📋';
            
            if (pedido.emailUsuario) {
                pedido.emailUsuario = pedido.emailUsuario.trim().toLowerCase();
            }

            if (!pedido.data) {
                const agora = new Date();
                pedido.data = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }

            pedidos.unshift(pedido);
            localStorage.setItem(STORAGE_KEY_PEDIDOS, JSON.stringify(pedidos));

            // Sincroniza pedido na nuvem com Firebase se disponível
            if (window.DoceEncantoFirebase && typeof window.DoceEncantoFirebase.salvarPedidoFirebase === 'function') {
                window.DoceEncantoFirebase.salvarPedidoFirebase(pedido);
            }

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

                // Sincroniza atualização de status na nuvem com Firebase se disponível
                if (window.DoceEncantoFirebase && typeof window.DoceEncantoFirebase.atualizarStatusPedidoFirebase === 'function') {
                    window.DoceEncantoFirebase.atualizarStatusPedidoFirebase(idPedido, novoStatus);
                }
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