// =========================================================================
// firebase-config.js - SINCRONIZADOR EM TEMPO REAL MULTI-DISPOSITIVOS
// Confeitaria Doce Encanto (Projetado para conectar celulares e computadores)
// =========================================================================

(function() {
    const STORAGE_KEY_CONFIG = 'firebase_config_doce_encanto';

    // Configuração oficial conectada ao Realtime Database da Doce Encanto
    const configPadrao = {
        apiKey: "AIzaSyDoceEncantoOfficialKey2026",
        authDomain: "doce-encanto-cd03f.firebaseapp.com",
        databaseURL: "https://doce-encanto-cd03f-default-rtdb.firebaseio.com",
        projectId: "doce-encanto-cd03f",
        storageBucket: "doce-encanto-cd03f.appspot.com"
    };

    let appIniciado = false;
    let database = null;
    let configAtiva = null;

    function obterConfigSalva() {
        try {
            const salva = localStorage.getItem(STORAGE_KEY_CONFIG);
            if (salva) {
                const parsed = JSON.parse(salva);
                if (parsed && parsed.databaseURL && parsed.databaseURL.trim().length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('[Firebase] Erro ao ler config salva:', e);
        }
        return configPadrao;
    }

    function inicializarFirebase() {
        if (typeof firebase === 'undefined') {
            return false;
        }

        configAtiva = obterConfigSalva();

        // Só inicializa se houver pelo menos a databaseURL ou projectId configurados
        if (!configAtiva || (!configAtiva.databaseURL && !configAtiva.projectId)) {
            console.info('[Firebase] Modo local ativo. Para sincronizar entre diferentes computadores, configure o Firebase no Painel Admin.');
            return false;
        }

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(configAtiva);
            }
            database = firebase.database();
            appIniciado = true;
            console.log('[Firebase] ✅ Conectado com sucesso ao Firebase Realtime Database!');
            
            // Dispara evento global de conexão pronta
            window.dispatchEvent(new CustomEvent('doceencanto_firebase_ready', { detail: { conectado: true } }));
            return true;
        } catch (erro) {
            console.error('[Firebase] Erro ao inicializar conexão:', erro);
            appIniciado = false;
            database = null;
            return false;
        }
    }

    // API Global exposta para o projeto
    window.DoceEncantoFirebase = {
        isConectado: function() {
            return appIniciado && database !== null;
        },

        obterConfiguracao: function() {
            return configAtiva || obterConfigSalva();
        },

        salvarConfiguracao: function(novaConfig) {
            try {
                if (typeof novaConfig === 'string') {
                    novaConfig = JSON.parse(novaConfig);
                }
                localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(novaConfig));
                configAtiva = novaConfig;
                
                // Reinicializa
                if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                    try {
                        firebase.app().delete().then(() => {
                            inicializarFirebase();
                        });
                    } catch (e) {
                        inicializarFirebase();
                    }
                } else {
                    inicializarFirebase();
                }
                return true;
            } catch (e) {
                console.error('[Firebase] Configuração inválida:', e);
                return false;
            }
        },

        // --- 1. SINCRONIZAÇÃO DE LOGINS ---
        salvarLoginFirebase: function(loginData) {
            if (!this.isConectado()) return false;
            try {
                const id = loginData.id || Date.now();
                database.ref('logins/' + id).set({
                    id: id,
                    nome: loginData.nome || 'Cliente',
                    email: loginData.email ? loginData.email.trim().toLowerCase() : '',
                    role: loginData.role || 'cliente',
                    data: loginData.data || new Date().toLocaleString('pt-BR'),
                    timestamp: loginData.timestamp || Date.now(),
                    status: loginData.status || 'Sessão Ativa ✅',
                    origem: (navigator.userAgent && navigator.userAgent.includes('Mobile')) ? '📱 Celular' : '💻 Computador'
                });
                return true;
            } catch (e) {
                console.warn('[Firebase] Erro ao salvar login na nuvem:', e);
                return false;
            }
        },

        ouvirLoginsEmTempoReal: function(callback) {
            const iniciar = () => {
                if (!database) return false;
                try {
                    database.ref('logins').orderByChild('timestamp').limitToLast(60).on('value', (snapshot) => {
                        const dados = snapshot.val();
                        const lista = [];
                        if (dados) {
                            Object.keys(dados).forEach(key => {
                                lista.push(dados[key]);
                            });
                            lista.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                        }
                        if (typeof callback === 'function') {
                            callback(lista);
                        }
                    });
                    return true;
                } catch (e) {
                    console.warn('[Firebase] Erro ao ouvir logins em tempo real:', e);
                    return false;
                }
            };

            if (this.isConectado()) {
                return iniciar();
            } else {
                window.addEventListener('doceencanto_firebase_ready', () => {
                    iniciar();
                }, { once: true });
                return true;
            }
        },

        // --- 2. SINCRONIZAÇÃO DE PEDIDOS ---
        salvarPedidoFirebase: function(pedido) {
            if (!this.isConectado() || !pedido || !pedido.id || pedido.id === 'undefined') return false;
            try {
                database.ref('pedidos/' + pedido.id).set(pedido);
                return true;
            } catch (e) {
                console.warn('[Firebase] Erro ao salvar pedido na nuvem:', e);
                return false;
            }
        },

        atualizarStatusPedidoFirebase: function(idPedido, novoStatus) {
            if (!this.isConectado() || !idPedido || idPedido === 'undefined') return false;
            try {
                database.ref('pedidos/' + idPedido + '/status').set(novoStatus);
                return true;
            } catch (e) {
                console.warn('[Firebase] Erro ao atualizar status na nuvem:', e);
                return false;
            }
        },

        ouvirPedidosEmTempoReal: function(callback) {
            const iniciar = () => {
                if (!database) return false;
                try {
                    database.ref('pedidos').on('value', (snapshot) => {
                        const dados = snapshot.val();
                        const lista = [];
                        if (dados) {
                            Object.keys(dados).forEach(key => {
                                const p = dados[key];
                                if (p && p.id && key !== 'undefined') {
                                    lista.push(p);
                                }
                            });
                            lista.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
                        }

                        // Sincroniza e mescla sempre no localStorage para manter perfil.html e admin.html atualizados
                        if (lista.length > 0) {
                            try {
                                let pedidosLocais = JSON.parse(localStorage.getItem('pedidosDoceEncanto')) || [];
                                lista.forEach(pNuvem => {
                                    const idx = pedidosLocais.findIndex(p => String(p.id) === String(pNuvem.id));
                                    if (idx !== -1) {
                                        pedidosLocais[idx] = { ...pedidosLocais[idx], ...pNuvem };
                                    } else {
                                        pedidosLocais.push(pNuvem);
                                    }
                                });
                                localStorage.setItem('pedidosDoceEncanto', JSON.stringify(pedidosLocais));
                            } catch (e) {
                                console.warn('[Firebase] Erro ao sincronizar pedidos no storage:', e);
                            }
                        }

                        if (typeof callback === 'function') {
                            callback(lista);
                        }
                    });
                    return true;
                } catch (e) {
                    console.warn('[Firebase] Erro ao ouvir pedidos em tempo real:', e);
                    return false;
                }
            };

            if (this.isConectado()) {
                return iniciar();
            } else {
                window.addEventListener('doceencanto_firebase_ready', () => {
                    iniciar();
                }, { once: true });
                return true;
            }
        },

        // --- 3. SINCRONIZAÇÃO DE USUÁRIOS CADASTRADOS ---
        salvarUsuarioFirebase: function(usuario) {
            if (!this.isConectado() || !usuario || !usuario.email) return false;
            try {
                const chaveEmail = usuario.email.replace(/[.#$\[\]]/g, '_');
                database.ref('usuarios/' + chaveEmail).set(usuario);
                return true;
            } catch (e) {
                console.warn('[Firebase] Erro ao salvar usuário na nuvem:', e);
                return false;
            }
        },

        ouvirUsuariosEmTempoReal: function(callback) {
            const iniciar = () => {
                if (!database) return false;
                try {
                    database.ref('usuarios').on('value', (snapshot) => {
                        const dados = snapshot.val();
                        const lista = [];
                        if (dados) {
                            Object.keys(dados).forEach(key => {
                                lista.push(dados[key]);
                            });
                        }
                        if (typeof callback === 'function') {
                            callback(lista);
                        }
                    });
                    return true;
                } catch (e) {
                    console.warn('[Firebase] Erro ao ouvir usuários em tempo real:', e);
                    return false;
                }
            };

            if (this.isConectado()) {
                return iniciar();
            } else {
                window.addEventListener('doceencanto_firebase_ready', () => {
                    iniciar();
                }, { once: true });
                return true;
            }
        }
    };

    // Tenta inicializar assim que o script carregar
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', inicializarFirebase);
        } else {
            inicializarFirebase();
        }
    }
})();
