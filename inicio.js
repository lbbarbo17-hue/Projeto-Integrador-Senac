document.addEventListener("DOMContentLoaded", function () {
    const linkCarrinho = document.getElementById("abrir-carrinho-link");

    if (linkCarrinho) {
        linkCarrinho.addEventListener("click", function (event) {
            event.preventDefault();
            abrirCarrinho();
        });
    }
});


// =========================================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// =========================================================
const NUMERO_WHATSAPP = "5541999999999"; 

const TAXA_ENTREGA = 5.00;
const TAXA_SERVICO = 2.50;

let valorDescontoCupom = 0;
let cupomAtivo = '';

let carrinho = [];
try {
    carrinho = JSON.parse(localStorage.getItem('carrinho_doce_encanto')) || [];
} catch (e) { carrinho = []; }

// =========================================================
// SINCRONIZAÇÃO DE CUPOM E OBSERVAÇÕES
// =========================================================
function carregarCupomSalvo() {
    try {
        const salvo = JSON.parse(localStorage.getItem('cupom_ativo_doce_encanto'));
        if (salvo && salvo.codigo) {
            cupomAtivo = salvo.codigo;
            const subtotal = calcularSubtotal();
            if (salvo.regra === '10%') {
                valorDescontoCupom = subtotal * 0.10;
            } else {
                valorDescontoCupom = Number(salvo.regra);
            }
            if (valorDescontoCupom > subtotal) valorDescontoCupom = subtotal;
        } else {
            valorDescontoCupom = 0;
            cupomAtivo = '';
        }
    } catch (e) {
        valorDescontoCupom = 0;
        cupomAtivo = '';
    }
}
carregarCupomSalvo();

function salvarObservacao() {
    const obsInput = document.getElementById('observacao-carrinho');
    if (obsInput) {
        localStorage.setItem('observacao_carrinho_doce_encanto', obsInput.value);
    }
}

function carregarObservacao() {
    const obsInput = document.getElementById('observacao-carrinho');
    if (obsInput) {
        const salvo = localStorage.getItem('observacao_carrinho_doce_encanto');
        if (salvo !== null) {
            obsInput.value = salvo;
        }
    }
}

// =========================================================
// 1. ADICIONAR AO CARRINHO (SEM ABRIR MODAL)
// =========================================================
function adicionarAoCarrinho(nome, preco) {
    let precoNumerico = preco;
    if (typeof preco === 'string') {
        precoNumerico = parseFloat(preco.replace('R$', '').replace('.', '').replace(',', '.').trim());
    }
    if (isNaN(precoNumerico)) precoNumerico = 0;

    const itemExistente = carrinho.find(item => item.nome === nome);
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ nome: nome, preco: precoNumerico, quantidade: 1 });
    }

    salvarCarrinho();
    atualizarCarrinho();
    mostrarNotificacao(`✓ "${nome}" adicionado à sacola!`);
}

// =========================================================
// 2. MENSAGEM FLUTUANTE (TOAST ENCAIXADA NA PALETA ROSA)
// =========================================================
function mostrarNotificacao(texto) {
    let notif = document.getElementById('notificacao-item');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'notificacao-item';
        notif.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#e07a93; color:#fff; padding:12px 20px; border-radius:30px; font-size:0.85rem; font-weight:bold; box-shadow:0 4px 15px rgba(224,122,147,0.4); z-index:1000000; display:none; font-family:"Poppins", sans-serif;';
        document.body.appendChild(notif);
    }
    notif.innerText = texto;
    notif.style.display = 'block';
    setTimeout(() => {
        notif.style.display = 'none';
    }, 2200);
}

// =========================================================
// 3. ATUALIZA O NÚMERO DO CARRINHO E OS VALORES
// =========================================================
function atualizarCarrinho() {
    carregarCupomSalvo();
    carregarObservacao();

    const listaItens = document.getElementById('carrinho-itens');
    const subtotalEl = document.getElementById('subtotal-valor');
    const taxaEntregaEl = document.getElementById('taxa-entrega');
    const taxaServicoEl = document.getElementById('taxa-servico');
    const totalEl = document.getElementById('total-valor');
    const totalRodapeEl = document.getElementById('total-rodape-txt');
    const totalCheckoutEl = document.getElementById('total-checkout-valor');
    
    const linhaDesconto = document.getElementById('linha-desconto');
    const nomeCupomTxt = document.getElementById('nome-cupom-txt');
    const descontoValorTxt = document.getElementById('desconto-valor');

    // Soma a quantidade total de produtos
    const totalQtd = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    
    // Atualiza TODOS os elementos de contador que estiverem na página
    const contadores = document.querySelectorAll('#contador-carrinho, .carrinho-qtd-badge, #carrinho-contador-topo');
    contadores.forEach(el => {
        el.innerText = totalQtd;
    });

    // Renderiza a lista dentro do modal (se ele existir na tela)
    if (listaItens) {
        listaItens.innerHTML = '';
        if (carrinho.length === 0) {
            listaItens.innerHTML = '<p style="text-align:center; color:#888; padding:15px;">Sua sacola está vazia.</p>';
        } else {
            carrinho.forEach((item, index) => {
                const precoFormatado = Number(item.preco).toFixed(2).replace('.', ',');
                listaItens.innerHTML += `
                    <div class="item-carrinho-linha">
                        <div class="item-detalhes">
                            <strong>${item.nome}</strong>
                            <span>R$ ${precoFormatado}</span>
                        </div>
                        <div class="item-carrinho-qtd">
                            <button type="button" onclick="alterarQtd(${index}, -1)">-</button>
                            <span>${item.quantidade}</span>
                            <button type="button" onclick="alterarQtd(${index}, 1)">+</button>
                        </div>
                    </div>
                `;
            });
        }
    }

    // Cálculos dos totais
    const subtotal = calcularSubtotal();
    let totalGeral = 0;

    if (subtotal > 0) {
        totalGeral = (subtotal + TAXA_ENTREGA + TAXA_SERVICO) - valorDescontoCupom;
        if (totalGeral < 0) totalGeral = 0;
    } else {
        valorDescontoCupom = 0;
        cupomAtivo = '';
        try { localStorage.removeItem('cupom_ativo_doce_encanto'); } catch(e) {}
    }

    // Exibição dos valores
    if (subtotalEl) subtotalEl.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    if (taxaEntregaEl) taxaEntregaEl.innerText = subtotal > 0 ? `R$ ${TAXA_ENTREGA.toFixed(2).replace('.', ',')}` : `R$ 0,00`;
    if (taxaServicoEl) taxaServicoEl.innerText = subtotal > 0 ? `R$ ${TAXA_SERVICO.toFixed(2).replace('.', ',')}` : `R$ 0,00`;

    if (valorDescontoCupom > 0 && subtotal > 0) {
        if (linhaDesconto) linhaDesconto.style.display = 'flex';
        if (nomeCupomTxt) nomeCupomTxt.innerText = cupomAtivo;
        if (descontoValorTxt) descontoValorTxt.innerText = `- R$ ${valorDescontoCupom.toFixed(2).replace('.', ',')}`;
    } else {
        if (linhaDesconto) linhaDesconto.style.display = 'none';
    }

    const totalFormatado = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
    if (totalEl) totalEl.innerText = totalFormatado;
    if (totalRodapeEl) totalRodapeEl.innerText = totalFormatado;
    if (totalCheckoutEl) totalCheckoutEl.innerText = totalFormatado;
}

// =========================================================
// 4. FUNÇÕES AUXILIARES DO CARRINHO E CUPOM
// =========================================================
function calcularSubtotal() {
    if (!carrinho || carrinho.length === 0) return 0;
    return carrinho.reduce((acc, item) => acc + (Number(item.preco) * item.quantidade), 0);
}

function aplicarCupom(codigo, regra) {
    const subtotal = calcularSubtotal();
    if (subtotal === 0) {
        alert("Adicione itens à sacola antes de aplicar um cupom!");
        return;
    }

    cupomAtivo = codigo;
    try {
        localStorage.setItem('cupom_ativo_doce_encanto', JSON.stringify({ codigo: codigo, regra: regra }));
    } catch (e) {}

    if (regra === '10%') {
        valorDescontoCupom = subtotal * 0.10;
    } else {
        valorDescontoCupom = Number(regra);
    }

    if (valorDescontoCupom > subtotal) {
        valorDescontoCupom = subtotal;
    }

    mostrarNotificacao(`✓ Cupom "${codigo}" aplicado! Desconto: R$ ${valorDescontoCupom.toFixed(2).replace('.', ',')}`);
    atualizarCarrinho();
}

function alterarQtd(index, delta) {
    if (!carrinho[index]) return;
    carrinho[index].quantidade += delta;
    if (carrinho[index].quantidade <= 0) carrinho.splice(index, 1);
    
    salvarCarrinho();
    carregarCupomSalvo();
    atualizarCarrinho();
}

function limparCarrinho() {
    carrinho = [];
    valorDescontoCupom = 0;
    cupomAtivo = '';
    localStorage.removeItem('carrinho_doce_encanto');
    localStorage.removeItem('cupom_ativo_doce_encanto');
    localStorage.removeItem('observacao_carrinho_doce_encanto');
    const obsInput = document.getElementById('observacao-carrinho');
    if (obsInput) obsInput.value = '';
    salvarCarrinho();
    atualizarCarrinho();
}

function salvarCarrinho() {
    localStorage.setItem('carrinho_doce_encanto', JSON.stringify(carrinho));
}

// =========================================================
// 5. ABRIR E FECHAR MODAIS DE CARRINHO E CHECKOUT
// =========================================================
function abrirCarrinho(e) {
    if (e && e.preventDefault) e.preventDefault();
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        modal.classList.remove('escondido', 'oculto');
        modal.style.setProperty('display', 'flex', 'important');
        atualizarCarrinho();
    } else {
        window.location.href = 'cardapio.html#modal-carrinho';
    }
}

function toggleCarrinho(e) {
    if (e && e.preventDefault) e.preventDefault();
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        const visivel = window.getComputedStyle(modal).display !== 'none';
        if (visivel) {
            fecharCarrinho();
        } else {
            abrirCarrinho();
        }
    } else {
        window.location.href = 'cardapio.html#modal-carrinho';
    }
}

function fecharCarrinho() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        modal.classList.add('escondido');
        modal.style.setProperty('display', 'none', 'important');
    }
}

function verificarLoginParaPedido() {
    const usuarioLogado = window.DoceEncantoDB 
        ? window.DoceEncantoDB.obterUsuarioLogado() 
        : JSON.parse(localStorage.getItem('usuarioLogadoDoceEncanto'));

    if (!usuarioLogado || !usuarioLogado.email || usuarioLogado.email === 'cliente_visitante@doceencanto.com') {
        exibirModalExigirConta();
        return false;
    }
    return true;
}

function exibirModalExigirConta() {
    fecharCarrinho();
    let modal = document.getElementById('modal-exigir-conta');
    const paginaAtual = window.location.pathname.split('/').pop() || 'cardapio.html';
    const urlRetorno = encodeURIComponent(paginaAtual + (window.location.search ? window.location.search : ''));

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-exigir-conta';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(71,57,54,0.75); display:flex; align-items:center; justify-content:center; z-index:999999; backdrop-filter:blur(6px); padding:16px; box-sizing:border-box; overflow-y:auto;';
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharModalExigirConta();
        });
    }

    modal.innerHTML = `
        <div style="background:#ffffff; border-radius:26px; padding:28px 24px; width:100%; max-width:440px; text-align:center; border:2px solid #fab3cb; box-shadow:0 20px 45px rgba(0,0,0,0.25); max-height:92vh; overflow-y:auto; box-sizing:border-box;">
            
            <div style="width:60px; height:60px; border-radius:50%; background:#fce4ec; color:#d81b60; font-size:1.7rem; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; box-shadow:0 4px 15px rgba(216,27,96,0.18);">
                <i class="fa-solid fa-cake-candles"></i>
            </div>
            
            <h3 style="font-family:'Fredoka',sans-serif; color:#6d3828; margin:0 0 6px; font-size:1.45rem;">Identifique-se para pedir</h3>
            <p style="color:#666; font-size:0.88rem; line-height:1.4; margin:0 0 16px;">
                Para concluir sua compra e acumular <strong style="color:#d81b60;">5% de cashback</strong>, crie sua conta ou faça login:
            </p>

            <!-- ABAS DE NAVEGAÇÃO -->
            <div style="display:flex; background:#fceef2; border-radius:30px; padding:4px; margin-bottom:18px;">
                <button type="button" id="aba-btn-cadastro" onclick="alternarAbaAuth('cadastro')" style="flex:1; border:none; padding:10px 12px; border-radius:25px; font-weight:600; font-family:'Fredoka',sans-serif; font-size:0.92rem; cursor:pointer; background:#fab3cb; color:#ffffff; transition:all 0.2s ease;">
                    <i class="fa-solid fa-user-plus"></i> Criar Conta
                </button>
                <button type="button" id="aba-btn-login" onclick="alternarAbaAuth('login')" style="flex:1; border:none; padding:10px 12px; border-radius:25px; font-weight:600; font-family:'Fredoka',sans-serif; font-size:0.92rem; cursor:pointer; background:transparent; color:#6d3828; transition:all 0.2s ease;">
                    <i class="fa-solid fa-right-to-bracket"></i> Já Tenho Conta
                </button>
            </div>

            <!-- MENSAGEM DE ALERTA NO MODAL -->
            <div id="modal-auth-msg" style="display:none; padding:10px; border-radius:10px; font-size:0.85rem; margin-bottom:14px; text-align:center;"></div>

            <!-- FORMULÁRIO 1: CRIAR CONTA RÁPIDA -->
            <form id="form-modal-cadastro" onsubmit="submeterCadastroModal(event)" style="display:flex; flex-direction:column; gap:11px; text-align:left;">
                <div>
                    <label style="font-size:0.82rem; font-weight:600; color:#473936; display:block; margin-bottom:4px;">Nome Completo</label>
                    <input id="modal-cad-nome" type="text" placeholder="Como podemos te chamar?" required style="width:100%; padding:10px 14px; border-radius:14px; border:1.5px solid #fab3cb; font-family:'Poppins',sans-serif; font-size:0.88rem; box-sizing:border-box; outline:none;">
                </div>
                <div>
                    <label style="font-size:0.82rem; font-weight:600; color:#473936; display:block; margin-bottom:4px;">WhatsApp / Celular</label>
                    <input id="modal-cad-tel" type="tel" placeholder="(41) 99999-9999" oninput="mascaraTelefoneModal(this)" required style="width:100%; padding:10px 14px; border-radius:14px; border:1.5px solid #fab3cb; font-family:'Poppins',sans-serif; font-size:0.88rem; box-sizing:border-box; outline:none;">
                </div>
                <div>
                    <label style="font-size:0.82rem; font-weight:600; color:#473936; display:block; margin-bottom:4px;">E-mail</label>
                    <input id="modal-cad-email" type="email" placeholder="seuemail@exemplo.com" required style="width:100%; padding:10px 14px; border-radius:14px; border:1.5px solid #fab3cb; font-family:'Poppins',sans-serif; font-size:0.88rem; box-sizing:border-box; outline:none;">
                </div>
                <div>
                    <label style="font-size:0.82rem; font-weight:600; color:#473936; display:block; margin-bottom:4px;">Senha (mínimo 6 dígitos)</label>
                    <input id="modal-cad-senha" type="password" placeholder="Crie sua senha de acesso" minlength="6" required style="width:100%; padding:10px 14px; border-radius:14px; border:1.5px solid #fab3cb; font-family:'Poppins',sans-serif; font-size:0.88rem; box-sizing:border-box; outline:none;">
                </div>

                <div style="background:#fff8fa; border:1px dashed #f48fb1; border-radius:12px; padding:8px 12px; margin-top:2px; font-size:0.8rem; color:#555;">
                    <i class="fa-solid fa-gift" style="color:#d81b60;"></i> Você ganha <strong>R$ 5,00 de bônus</strong> de boas-vindas imediatamente!
                </div>

                <button type="submit" style="background:linear-gradient(135deg, #fab3cb, #f48fb1); color:#fff; border:none; padding:13px; border-radius:25px; font-weight:600; font-family:'Fredoka',sans-serif; font-size:1rem; cursor:pointer; margin-top:6px; box-shadow:0 4px 15px rgba(244,143,177,0.4); display:flex; align-items:center; justify-content:center; gap:8px;">
                    <i class="fa-solid fa-check"></i> Cadastrar e Continuar Compra
                </button>
            </form>

            <!-- FORMULÁRIO 2: LOGIN RÁPIDO -->
            <form id="form-modal-login" onsubmit="submeterLoginModal(event)" style="display:none; flex-direction:column; gap:12px; text-align:left;">
                <div>
                    <label style="font-size:0.82rem; font-weight:600; color:#473936; display:block; margin-bottom:4px;">E-mail</label>
                    <input id="modal-login-email" type="email" placeholder="seuemail@exemplo.com" required style="width:100%; padding:10px 14px; border-radius:14px; border:1.5px solid #fab3cb; font-family:'Poppins',sans-serif; font-size:0.88rem; box-sizing:border-box; outline:none;">
                </div>
                <div>
                    <label style="font-size:0.82rem; font-weight:600; color:#473936; display:block; margin-bottom:4px;">Senha</label>
                    <input id="modal-login-senha" type="password" placeholder="Sua senha cadastrada" required style="width:100%; padding:10px 14px; border-radius:14px; border:1.5px solid #fab3cb; font-family:'Poppins',sans-serif; font-size:0.88rem; box-sizing:border-box; outline:none;">
                </div>

                <button type="submit" style="background:linear-gradient(135deg, #fab3cb, #f48fb1); color:#fff; border:none; padding:13px; border-radius:25px; font-weight:600; font-family:'Fredoka',sans-serif; font-size:1rem; cursor:pointer; margin-top:6px; box-shadow:0 4px 15px rgba(244,143,177,0.4); display:flex; align-items:center; justify-content:center; gap:8px;">
                    <i class="fa-solid fa-right-to-bracket"></i> Entrar e Continuar Compra
                </button>

                <div style="text-align:center; margin-top:4px;">
                    <a href="esqueceusenha.html" style="font-size:0.82rem; color:#f48fb1; text-decoration:none;">Esqueceu sua senha?</a>
                </div>
            </form>

            <!-- LINKS SECUNDÁRIOS -->
            <div style="margin-top:16px; border-top:1px solid #fceef2; padding-top:12px; font-size:0.82rem; color:#888;">
                <span>Prefere abrir a página completa?</span>
                <div style="margin-top:6px; display:flex; justify-content:center; gap:12px;">
                    <a href="cadastro.html?retorno=${urlRetorno}" style="color:#6d3828; font-weight:600; text-decoration:none;">Tela de Cadastro</a>
                    <span>•</span>
                    <a href="login.html?retorno=${urlRetorno}" style="color:#6d3828; font-weight:600; text-decoration:none;">Tela de Login</a>
                </div>
                <button type="button" onclick="fecharModalExigirConta()" style="background:none; border:none; color:#999; font-size:0.82rem; cursor:pointer; padding:6px; margin-top:8px;">
                    Voltar para o cardápio
                </button>
            </div>

        </div>
    `;

    modal.style.display = 'flex';
}

function alternarAbaAuth(aba) {
    const btnCad = document.getElementById('aba-btn-cadastro');
    const btnLog = document.getElementById('aba-btn-login');
    const formCad = document.getElementById('form-modal-cadastro');
    const formLog = document.getElementById('form-modal-login');
    const msgBox = document.getElementById('modal-auth-msg');
    if (msgBox) msgBox.style.display = 'none';

    if (aba === 'cadastro') {
        if (btnCad) { btnCad.style.background = '#fab3cb'; btnCad.style.color = '#ffffff'; }
        if (btnLog) { btnLog.style.background = 'transparent'; btnLog.style.color = '#6d3828'; }
        if (formCad) formCad.style.display = 'flex';
        if (formLog) formLog.style.display = 'none';
    } else {
        if (btnCad) { btnCad.style.background = 'transparent'; btnCad.style.color = '#6d3828'; }
        if (btnLog) { btnLog.style.background = '#fab3cb'; btnLog.style.color = '#ffffff'; }
        if (formCad) formCad.style.display = 'none';
        if (formLog) formLog.style.display = 'flex';
    }
}

function mascaraTelefoneModal(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) {
        v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    } else if (v.length > 0) {
        v = v.replace(/^(\d*)/, '($1');
    }
    input.value = v;
}

function submeterCadastroModal(e) {
    if (e && e.preventDefault) e.preventDefault();
    const msgBox = document.getElementById('modal-auth-msg');
    const nome = document.getElementById('modal-cad-nome').value.trim();
    const tel = document.getElementById('modal-cad-tel').value.trim();
    const email = document.getElementById('modal-cad-email').value.trim().toLowerCase();
    const senha = document.getElementById('modal-cad-senha').value;

    function mostrarErro(txt) {
        if (msgBox) {
            msgBox.style.display = 'block';
            msgBox.style.backgroundColor = '#fde8e8';
            msgBox.style.color = '#c81e1e';
            msgBox.textContent = txt;
        }
    }

    if (nome.length < 2) {
        mostrarErro('Por favor, informe seu nome completo.');
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarErro('Por favor, informe um e-mail válido.');
        return;
    }
    const telLimpo = tel.replace(/\D/g, '');
    if (telLimpo.length < 10) {
        mostrarErro('Informe um WhatsApp/celular válido com DDD.');
        return;
    }
    if (senha.length < 6) {
        mostrarErro('A senha deve ter no mínimo 6 dígitos.');
        return;
    }

    const usuarios = window.DoceEncantoDB ? window.DoceEncantoDB.obterUsuarios() : (JSON.parse(localStorage.getItem('usuariosDoceEncanto')) || []);
    if (usuarios.some(u => u.email.toLowerCase() === email) || email === 'admin@doceencanto.com') {
        mostrarErro('Este e-mail já possui cadastro. Clique em "Já Tenho Conta" para entrar.');
        return;
    }

    const novoUsuario = {
        id: Date.now(),
        nome: nome,
        email: email,
        telefone: tel,
        senha: senha,
        role: 'cliente',
        saldoCashback: 5.00,
        cep: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: 'Curitiba',
        criadoEm: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    if (window.DoceEncantoDB) {
        window.DoceEncantoDB.salvarUsuario(novoUsuario);
        window.DoceEncantoDB.fazerLogin(novoUsuario);
    } else {
        usuarios.push(novoUsuario);
        localStorage.setItem('usuariosDoceEncanto', JSON.stringify(usuarios));
        localStorage.setItem('usuarioLogadoDoceEncanto', JSON.stringify(novoUsuario));
    }

    atualizarNavbarUsuario();
    fecharModalExigirConta();
    mostrarNotificacao(`✓ Bem-vindo(a), ${nome.split(' ')[0]}! Conta criada com R$ 5,00 bônus.`);
    
    // Avança direto para o checkout com os dados salvos
    setTimeout(() => {
        irParaCheckout();
    }, 200);
}

function submeterLoginModal(e) {
    if (e && e.preventDefault) e.preventDefault();
    const msgBox = document.getElementById('modal-auth-msg');
    const email = document.getElementById('modal-login-email').value.trim();
    const senha = document.getElementById('modal-login-senha').value;

    function mostrarErro(txt) {
        if (msgBox) {
            msgBox.style.display = 'block';
            msgBox.style.backgroundColor = '#fde8e8';
            msgBox.style.color = '#c81e1e';
            msgBox.textContent = txt;
        }
    }

    let usuarioLogado = null;
    if (window.DoceEncantoDB && typeof window.DoceEncantoDB.autenticar === 'function') {
        usuarioLogado = window.DoceEncantoDB.autenticar(email, senha);
    } else {
        const usuarios = JSON.parse(localStorage.getItem('usuariosDoceEncanto')) || [];
        const encontrado = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha);
        if (encontrado) {
            usuarioLogado = encontrado;
            localStorage.setItem('usuarioLogadoDoceEncanto', JSON.stringify(usuarioLogado));
        }
    }

    if (usuarioLogado) {
        atualizarNavbarUsuario();
        fecharModalExigirConta();
        mostrarNotificacao(`✓ Bem-vindo(a) de volta, ${usuarioLogado.nome ? usuarioLogado.nome.split(' ')[0] : ''}!`);
        setTimeout(() => {
            irParaCheckout();
        }, 200);
    } else {
        mostrarErro('E-mail ou senha incorretos.');
    }
}

function fecharModalExigirConta() {
    const modal = document.getElementById('modal-exigir-conta');
    if (modal) modal.style.display = 'none';
}

function irParaCheckout() {
    if (!carrinho || carrinho.length === 0) {
        alert("Sua sacola está vazia!");
        return;
    }
    // Exige que o cliente tenha conta conectada para ir ao checkout
    if (!verificarLoginParaPedido()) {
        return;
    }

    fecharCarrinho();
    const telaCheckout = document.getElementById('tela-checkout');
    if (telaCheckout) {
        telaCheckout.classList.remove('escondido', 'escondida');
        telaCheckout.style.setProperty('display', 'flex', 'important');
        trocarFormaPagamento();

        // Preenche automaticamente o endereço cadastrado do usuário se existir
        try {
            const usuario = window.DoceEncantoDB ? window.DoceEncantoDB.obterUsuarioLogado() : JSON.parse(localStorage.getItem('usuarioLogadoDoceEncanto'));
            if (usuario) {
                const ruaInput = document.getElementById('rua-cliente');
                const bairroInput = document.getElementById('bairro-cliente');
                if (ruaInput && !ruaInput.value.trim() && usuario.endereco) {
                    let endComp = usuario.endereco;
                    if (usuario.numero) endComp += `, ${usuario.numero}`;
                    if (usuario.complemento) endComp += ` (${usuario.complemento})`;
                    ruaInput.value = endComp;
                }
                if (bairroInput && !bairroInput.value.trim() && usuario.bairro) {
                    bairroInput.value = usuario.bairro + (usuario.cidade ? ` - ${usuario.cidade}` : '');
                }
            }
        } catch (e) {
            console.warn('Erro ao preencher endereço do usuário:', e);
        }
    }
}

function finalizarPedidoDireto() {
    if (!carrinho || carrinho.length === 0) {
        alert("Sua sacola está vazia!");
        return;
    }
    // Exige login/conta para finalizar o pedido
    if (!verificarLoginParaPedido()) {
        return;
    }

    const subtotal = calcularSubtotal();
    let totalGeral = (subtotal + TAXA_ENTREGA + TAXA_SERVICO) - valorDescontoCupom;
    if (totalGeral < 0) totalGeral = 0;

    const obsInput = document.getElementById('observacao-carrinho');
    const observacaoTxt = obsInput ? obsInput.value.trim() : '';

    let msg = "*🧁 PEDIDO REALIZADO - DOCE ENCANTO 🧁*\n\n";
    carrinho.forEach(i => msg += `• ${i.quantidade}x ${i.nome}\n`);
    msg += `\n*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    msg += `\n*Taxa Entrega:* R$ ${TAXA_ENTREGA.toFixed(2).replace('.', ',')}`;
    msg += `\n*Taxa Serviço:* R$ ${TAXA_SERVICO.toFixed(2).replace('.', ',')}`;
    if (valorDescontoCupom > 0) {
        msg += `\n*Cupom (${cupomAtivo}):* - R$ ${valorDescontoCupom.toFixed(2).replace('.', ',')}`;
    }
    msg += `\n*TOTAL FINAL:* R$ ${totalGeral.toFixed(2).replace('.', ',')}`;

    if (observacaoTxt) {
        msg += `\n\n*Observação:* ${observacaoTxt}`;
    }

    // 1. Salva o pedido no histórico local (Meus Pedidos)
    const usuarioLogado = window.DoceEncantoDB ? window.DoceEncantoDB.obterUsuarioLogado() : JSON.parse(localStorage.getItem('usuarioLogadoDoceEncanto'));
    const emailDono = (usuarioLogado && usuarioLogado.email ? usuarioLogado.email.trim().toLowerCase() : 'cliente_visitante@doceencanto.com');
    const nomeCliente = usuarioLogado ? (usuarioLogado.nome || 'Cliente') : 'Cliente';
    const telCliente = usuarioLogado ? (usuarioLogado.telefone || '') : '';
    const numeroPedido = Math.floor(1000 + Math.random() * 9000);
    const dataFormatada = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const novoPedido = {
        id: numeroPedido,
        emailUsuario: emailDono,
        nomeCliente: nomeCliente,
        telefone: telCliente,
        endereco: usuarioLogado && usuarioLogado.endereco ? `${usuarioLogado.endereco}, ${usuarioLogado.bairro || ''}` : 'Balcão / Retirada',
        formaPagamento: 'PIX Direto',
        status: '1. Recebido 📋',
        data: dataFormatada,
        itens: [...carrinho],
        observacao: observacaoTxt,
        total: totalGeral
    };

    if (window.DoceEncantoDB) {
        window.DoceEncantoDB.salvarNovoPedido(novoPedido);
    } else {
        const pedidosAnteriores = JSON.parse(localStorage.getItem('pedidosDoceEncanto')) || [];
        pedidosAnteriores.unshift(novoPedido);
        localStorage.setItem('pedidosDoceEncanto', JSON.stringify(pedidosAnteriores));
    }

    // 2. Fechar sacola e limpar carrinho
    fecharCarrinho();
    carrinho = [];
    valorDescontoCupom = 0;
    cupomAtivo = '';
    localStorage.removeItem('cupom_ativo_doce_encanto');
    localStorage.removeItem('observacao_carrinho_doce_encanto');
    const obsInputLimpar = document.getElementById('observacao-carrinho');
    if (obsInputLimpar) obsInputLimpar.value = '';
    salvarCarrinho();
    atualizarCarrinho();

    // 3. Exibe a tela de Pedido Realizado diretamente!
    exibirModalPedidoSucesso(numeroPedido, totalGeral, msg);
}

function voltarParaCarrinho() {
    const telaCheckout = document.getElementById('tela-checkout');
    if (telaCheckout) {
        telaCheckout.classList.add('escondido');
        telaCheckout.style.setProperty('display', 'none', 'important');
    }
    abrirCarrinho();
}

// =========================================================
// 6. CONTROLE DAS ABAS DE FORMA DE PAGAMENTO (PIX / CARTÃO)
// =========================================================
function trocarFormaPagamento() {
    const selects = document.querySelectorAll('#select-pagamento-modal');
    let forma = 'pix';
    
    selects.forEach(sel => {
        if (sel && sel.value) forma = sel.value;
    });

    const secPix = document.getElementById('pagina-pix');
    const secCartao = document.getElementById('pagina-cartao');

    if (forma === 'pix') {
        if (secPix) {
            secPix.style.display = 'block';
            secPix.classList.remove('escondida');
        }
        if (secCartao) {
            secCartao.style.display = 'none';
            secCartao.classList.add('escondida');
        }
    } else if (forma === 'cartao') {
        if (secPix) {
            secPix.style.display = 'none';
            secPix.classList.add('escondida');
        }
        if (secCartao) {
            secCartao.style.display = 'block';
            secCartao.classList.remove('escondida');
        }
    }
}

// Função para copiar chave PIX
function copiarPix() {
    const inputPix = document.getElementById('chave-pix-input');
    const texto = inputPix ? inputPix.value : '00020126580014br.gov.bcb.pix0136pix-doceencanto@gmail.com';
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(() => {
            mostrarNotificacao('✓ Chave PIX copiada com sucesso!');
        }).catch(() => {
            copiarPixFallback(inputPix);
        });
    } else {
        copiarPixFallback(inputPix);
    }
}

function copiarPixFallback(inputPix) {
    if (inputPix) {
        inputPix.select();
        inputPix.setSelectionRange(0, 99999);
        document.execCommand('copy');
        mostrarNotificacao('✓ Chave PIX copiada com sucesso!');
    }
}

// Máscaras de entrada para cartão
function mascaraCartao(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/(\d{4})/g, '$1 ').trim();
    input.value = v.substring(0, 19);
}

function mascaraValidade(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length >= 2) {
        v = v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    input.value = v.substring(0, 5);
}

// =========================================================
// 7. ENVIAR PEDIDO AO WHATSAPP
// =========================================================
function processarPedidoSite() {
    if (!verificarLoginParaPedido()) {
        return;
    }

    const ruaInput = document.getElementById('rua-cliente');
    const bairroInput = document.getElementById('bairro-cliente');
    const rua = ruaInput ? ruaInput.value.trim() : '';
    const bairro = bairroInput ? bairroInput.value.trim() : '';

    if (!rua || !bairro) {
        alert("Preencha o Endereço para continuar!");
        if (ruaInput && !rua) ruaInput.focus();
        else if (bairroInput) bairroInput.focus();
        return;
    }

    const selectPagamento = document.getElementById('select-pagamento-modal');
    const formaPagamento = selectPagamento ? selectPagamento.value : 'pix';

    let detalhePagamento = 'PIX';
    if (formaPagamento === 'cartao') {
        const nomeCartao = document.getElementById('cartao-nome')?.value.trim();
        const numCartao = document.getElementById('cartao-numero')?.value.trim();
        const valCartao = document.getElementById('cartao-validade')?.value.trim();
        const cvvCartao = document.getElementById('cartao-cvv')?.value.trim();
        const tipoCartao = document.getElementById('cartao-tipo')?.value || 'Crédito';

        if (!nomeCartao || !numCartao || !valCartao || !cvvCartao) {
            alert("Por favor, preencha todos os dados do cartão!");
            return;
        }

        const ultimosDigitos = numCartao.replace(/\s+/g, '').slice(-4);
        detalhePagamento = `Cartão (${tipoCartao === 'debito' ? 'Débito' : 'Crédito'} final ${ultimosDigitos})`;
    }

    const subtotal = calcularSubtotal();
    let totalGeral = (subtotal + TAXA_ENTREGA + TAXA_SERVICO) - valorDescontoCupom;
    if (totalGeral < 0) totalGeral = 0;

    const obsInput = document.getElementById('observacao-carrinho');
    const observacaoTxt = obsInput ? obsInput.value.trim() : '';

    let msg = "*🧁 PEDIDO REALIZADO - DOCE ENCANTO 🧁*\n\n";
    carrinho.forEach(i => msg += `• ${i.quantidade}x ${i.nome}\n`);
    msg += `\n*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    msg += `\n*Taxa Entrega:* R$ ${TAXA_ENTREGA.toFixed(2).replace('.', ',')}`;
    msg += `\n*Taxa Serviço:* R$ ${TAXA_SERVICO.toFixed(2).replace('.', ',')}`;
    if (valorDescontoCupom > 0) {
        msg += `\n*Cupom (${cupomAtivo}):* - R$ ${valorDescontoCupom.toFixed(2).replace('.', ',')}`;
    }
    msg += `\n*TOTAL FINAL:* R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
    msg += `\n*Forma de Pagamento:* ${detalhePagamento}`;
    msg += `\n\n*Endereço:* ${rua}, ${bairro}`;

    if (observacaoTxt) {
        msg += `\n\n*Observação:* ${observacaoTxt}`;
    }

    // 1. Salvar o pedido no histórico local (para constar nos "Meus Pedidos" do Perfil)
    const usuarioLogado = window.DoceEncantoDB ? window.DoceEncantoDB.obterUsuarioLogado() : JSON.parse(localStorage.getItem('usuarioLogadoDoceEncanto'));
    const emailDono = (usuarioLogado && usuarioLogado.email ? usuarioLogado.email.trim().toLowerCase() : 'cliente_visitante@doceencanto.com');
    const nomeCliente = usuarioLogado ? (usuarioLogado.nome || 'Cliente') : 'Cliente';
    const telCliente = usuarioLogado ? (usuarioLogado.telefone || '') : '';
    const numeroPedido = Math.floor(1000 + Math.random() * 9000);
    const dataFormatada = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const novoPedido = {
        id: numeroPedido,
        emailUsuario: emailDono,
        nomeCliente: nomeCliente,
        telefone: telCliente,
        endereco: `${rua}, ${bairro}`,
        formaPagamento: detalhePagamento,
        data: dataFormatada,
        status: '1. Recebido 📋',
        itens: [...carrinho],
        observacao: observacaoTxt,
        total: totalGeral
    };

    if (window.DoceEncantoDB) {
        window.DoceEncantoDB.salvarNovoPedido(novoPedido);
    } else {
        const pedidosAnteriores = JSON.parse(localStorage.getItem('pedidosDoceEncanto')) || [];
        pedidosAnteriores.unshift(novoPedido);
        localStorage.setItem('pedidosDoceEncanto', JSON.stringify(pedidosAnteriores));
    }

    // 2. Fechar tela de checkout e limpar carrinho
    const telaCheckout = document.getElementById('tela-checkout');
    if (telaCheckout) {
        telaCheckout.classList.add('escondido', 'escondida');
        telaCheckout.style.setProperty('display', 'none', 'important');
    }
    carrinho = [];
    valorDescontoCupom = 0;
    cupomAtivo = '';
    localStorage.removeItem('cupom_ativo_doce_encanto');
    localStorage.removeItem('observacao_carrinho_doce_encanto');
    const obsInputFinal = document.getElementById('observacao-carrinho');
    if (obsInputFinal) obsInputFinal.value = '';
    salvarCarrinho();
    atualizarCarrinho();

    // 3. Exibir Modal "Pedido Realizado!" com linha do tempo e botões de ação
    exibirModalPedidoSucesso(numeroPedido, totalGeral, msg);
}

function exibirModalPedidoSucesso(numPedido, total, msgWhatsApp) {
    let modal = document.getElementById('modal-pedido-sucesso');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-pedido-sucesso';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); display:flex; align-items:center; justify-content:center; z-index:99999; padding:20px; box-sizing:border-box; backdrop-filter:blur(4px);';
        document.body.appendChild(modal);
    }

    const linkWhats = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msgWhatsApp)}`;

    modal.innerHTML = `
        <div style="background:#ffffff; width:100%; max-width:470px; border-radius:24px; padding:30px 24px; text-align:center; box-shadow:0 15px 40px rgba(0,0,0,0.22); border:2px solid #fce4ec; font-family:'Poppins', sans-serif; position:relative;">
            <div style="width:65px; height:65px; background:#e8f5e9; color:#2ecc71; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2rem; margin:0 auto 12px auto;">
                <i class="fa-solid fa-check"></i>
            </div>
            
            <h3 style="font-family:'Fredoka', sans-serif; color:#6d3828; font-size:1.55rem; margin:0 0 6px 0;">Pedido #${numPedido} Realizado!</h3>
            <p style="color:#2ecc71; font-weight:bold; font-size:0.9rem; margin-bottom:14px;">✓ Registrado com sucesso no seu perfil!</p>

            <!-- LINHA DO TEMPO DO PEDIDO -->
            <div style="background:#fff7f9; border:1px solid #fce4ec; border-radius:18px; padding:16px 12px; margin-bottom:18px; text-align:left;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:0.82rem; font-weight:700; color:#6d3828;">
                    <span><i class="fa-solid fa-route" style="color:#d81b60;"></i> Linha do Tempo do Pedido:</span>
                    <span style="color:#2ecc71; background:#e8f5e9; padding:2px 8px; border-radius:10px;"><i class="fa-solid fa-circle-check"></i> 1. Recebido</span>
                </div>
                
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:6px; text-align:center;">
                    <div style="padding:8px 3px; background:#e8f5e9; border:1.5px solid #2ecc71; border-radius:12px;">
                        <i class="fa-solid fa-clipboard-check" style="color:#2e7d32; font-size:1.15rem; display:block; margin-bottom:3px;"></i>
                        <span style="font-size:0.72rem; font-weight:bold; color:#1b5e20; display:block;">1. Recebido</span>
                        <small style="font-size:0.65rem; color:#2e7d32; font-weight:600;">Confirmado</small>
                    </div>
                    <div style="padding:8px 3px; background:#fff3e0; border:1.5px dashed #ffa726; border-radius:12px;">
                        <i class="fa-solid fa-kitchen-set" style="color:#e65100; font-size:1.15rem; display:block; margin-bottom:3px;"></i>
                        <span style="font-size:0.72rem; font-weight:bold; color:#e65100; display:block;">2. Processando</span>
                        <small style="font-size:0.65rem; color:#e65100;">Na Cozinha</small>
                    </div>
                    <div style="padding:8px 3px; background:#f9f9f9; border:1px solid #e0e0e0; border-radius:12px; opacity:0.65;">
                        <i class="fa-solid fa-motorcycle" style="color:#888; font-size:1.15rem; display:block; margin-bottom:3px;"></i>
                        <span style="font-size:0.72rem; font-weight:600; color:#777; display:block;">3. A Caminho</span>
                        <small style="font-size:0.65rem; color:#888;">Entrega</small>
                    </div>
                    <div style="padding:8px 3px; background:#f9f9f9; border:1px solid #e0e0e0; border-radius:12px; opacity:0.65;">
                        <i class="fa-solid fa-circle-check" style="color:#888; font-size:1.15rem; display:block; margin-bottom:3px;"></i>
                        <span style="font-size:0.72rem; font-weight:600; color:#777; display:block;">4. Feito</span>
                        <small style="font-size:0.65rem; color:#888;">Entregue</small>
                    </div>
                </div>
                <div style="margin-top:10px; font-size:0.78rem; color:#666; text-align:center;">
                    Status atual: <strong style="color:#d81b60;">Pedido recebido e enviado para a produção!</strong>
                </div>
            </div>

            <div style="background:#fffcfd; border:1px dashed #f8e1e7; border-radius:14px; padding:12px 18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; font-weight:bold; color:#6d3828;">
                <span style="font-size:0.92rem;">Total do Pedido:</span>
                <span style="color:#d81b60; font-size:1.15rem;">R$ ${total.toFixed(2).replace('.', ',')}</span>
            </div>

            <!-- BOTÕES DE AÇÃO: MEUS PEDIDOS & WHATSAPP -->
            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:14px;">
                <a href="perfil.html" style="display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg, #f48fb1, #d81b60); color:#ffffff; text-decoration:none; padding:13px; border-radius:30px; font-weight:bold; font-size:0.95rem; font-family:'Fredoka', sans-serif; box-shadow:0 5px 18px rgba(216,27,96,0.3); transition:transform 0.2s;">
                    <i class="fa-solid fa-clock-rotate-left"></i> Acompanhar Linha do Tempo em Meus Pedidos
                </a>

                <a href="${linkWhats}" target="_blank" onclick="fecharModalSucesso()" style="display:flex; align-items:center; justify-content:center; gap:8px; background:#25d366; color:#ffffff; text-decoration:none; padding:13px; border-radius:30px; font-weight:bold; font-size:0.95rem; font-family:'Fredoka', sans-serif; box-shadow:0 5px 18px rgba(37,211,102,0.3); transition:transform 0.2s;">
                    <i class="fa-brands fa-whatsapp" style="font-size:1.2rem;"></i> Mandar pedido por WhatsApp
                </a>
            </div>

            <button onclick="fecharModalSucesso()" style="background:transparent; border:none; color:#888; font-size:0.85rem; cursor:pointer; font-weight:600; padding:4px;">
                Continuar navegando na loja
            </button>
        </div>
    `;
    modal.style.display = 'flex';
}

function fecharModalSucesso() {
    const modal = document.getElementById('modal-pedido-sucesso');
    if (modal) modal.style.display = 'none';
}

// =========================================================
// 8.1 MODAL DE AVISOS (TEMPO DE ANTECEDÊNCIA & ANTECIPAÇÃO DE VALOR)
// =========================================================
function abrirModalAviso(titulo, textoCompleto) {
    let modal = document.getElementById('modal-aviso-encomenda');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-aviso-encomenda';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); display:flex; align-items:center; justify-content:center; z-index:99999; padding:20px; box-sizing:border-box; backdrop-filter:blur(4px);';
        document.body.appendChild(modal);
    }

    const mensagemWhats = `Olá! Li sobre *${titulo}* e gostaria de combinar os detalhes da minha encomenda.`;
    const linkWhats = `https://wa.me/5511949010900?text=${encodeURIComponent(mensagemWhats)}`;

    modal.innerHTML = `
        <div style="background:#ffffff; width:100%; max-width:480px; border-radius:24px; padding:32px 25px; text-align:center; box-shadow:0 15px 35px rgba(0,0,0,0.2); border:2px solid #fce4ec; font-family:'Poppins', sans-serif; position:relative;">
            <button onclick="fecharModalAviso()" style="position:absolute; top:15px; right:15px; background:#fceef2; color:#6d3828; border:none; width:32px; height:32px; border-radius:50%; font-size:1.2rem; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:bold;">&times;</button>
            
            <div style="width:60px; height:60px; background:#fceef2; color:#f48fb1; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.8rem; margin:0 auto 15px auto;">
                <i class="fa-solid fa-circle-info"></i>
            </div>
            
            <h3 style="font-family:'Fredoka', sans-serif; color:#6d3828; font-size:1.4rem; margin:0 0 14px 0;">${titulo}</h3>
            
            <p style="color:#555; font-size:0.92rem; line-height:1.6; margin-bottom:25px; text-align:justify; background:#fff8fa; padding:15px; border-radius:14px; border:1px dashed #f8e1e7;">${textoCompleto}</p>

            <a href="${linkWhats}" target="_blank" onclick="fecharModalAviso()" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#25d366; color:#ffffff; text-decoration:none; padding:14px; border-radius:30px; font-weight:bold; font-size:1rem; font-family:'Fredoka', sans-serif; box-shadow:0 6px 20px rgba(37,211,102,0.35); margin-bottom:12px;">
                <i class="fa-brands fa-whatsapp" style="font-size:1.3rem;"></i> Combinar pelo WhatsApp
            </a>

            <button onclick="fecharModalAviso()" style="background:transparent; border:none; color:#888; font-size:0.88rem; cursor:pointer; font-weight:600;">
                Fechar aviso
            </button>
        </div>
    `;
    modal.style.display = 'flex';
}

function fecharModalAviso() {
    const modal = document.getElementById('modal-aviso-encomenda');
    if (modal) modal.style.display = 'none';
}

// =========================================================
// 8. ABRIR E FECHAR MODAL DE DETALHES DO PRODUTO (VER MAIS COM ROSA PADRONIZADO)
// =========================================================
function abrirModal(nome, precoTexto, precoNumero, imagem, descricao) {
    let modal = document.getElementById('modal-produto');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-produto';
        modal.className = 'modal-produto-overlay';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:99999; padding:12px; box-sizing:border-box;';
        
        modal.innerHTML = `
            <div style="background:#fff; width:100%; max-width:420px; max-height:90vh; overflow-y:auto; border-radius:20px; position:relative; box-shadow:0 10px 25px rgba(0,0,0,0.2); animation: popIn 0.3s ease; font-family:'Poppins', sans-serif;">
                <button onclick="fecharModalProduto()" style="position:absolute; top:12px; right:12px; background:rgba(0,0,0,0.5); color:#fff; border:none; width:32px; height:32px; border-radius:50%; font-size:1.2rem; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center;">&times;</button>
                <img id="modal-img-produto" src="" alt="Produto" style="width:100%; height:190px; object-fit:cover; display:block;">
                <div style="padding:16px;">
                    <h3 id="modal-nome-produto" style="margin:0 0 6px 0; font-size:1.2rem; color:#4a2c2a; font-weight:700;"></h3>
                    <p id="modal-desc-produto" style="font-size:0.85rem; color:#666; line-height:1.5; margin-bottom:12px; max-height:130px; overflow-y:auto; word-break:break-word;"></p>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #fce4ec; padding-top:12px;">
                        <span id="modal-preco-produto" style="font-size:1.2rem; font-weight:bold; color:#e07a93;"></span>
                        <button id="modal-btn-pedir" style="background:#e07a93; color:#fff; border:none; padding:10px 20px; border-radius:20px; font-weight:bold; font-size:0.88rem; cursor:pointer; box-shadow:0 4px 12px rgba(224,122,147,0.3);">Pedir Agora</button>
                    </div>
                </div>
            </div>
        `;
        modal.addEventListener('click', function(e) {
            if (e.target === modal) fecharModalProduto();
        });
        document.body.appendChild(modal);
    }

    const imgEl = document.getElementById('modal-img-produto');
    const nomeEl = document.getElementById('modal-nome-produto');
    const descEl = document.getElementById('modal-desc-produto');
    const precoEl = document.getElementById('modal-preco-produto');

    if (imgEl) imgEl.src = imagem || '';
    if (nomeEl) nomeEl.innerText = nome || '';
    if (descEl) descEl.innerText = descricao || '';
    if (precoEl) precoEl.innerText = precoTexto || '';
    
    const btnPedir = document.getElementById('modal-btn-pedir');
    if (btnPedir) {
        btnPedir.onclick = function() {
            adicionarAoCarrinho(nome, precoNumero);
            fecharModalProduto();
        };
    }

    modal.style.display = 'flex';
}

function fecharModalProduto() {
    const modal = document.getElementById('modal-produto');
    if (modal) {
        modal.style.display = 'none';
    }
} 

// Captura cliques automáticos do botão "Ver Mais" que utilizam data-attributes
document.addEventListener('click', function (event) {
    const btn = event.target.closest('.btn-ver-mais');
    if (!btn) return;

    const nome = btn.getAttribute('data-nome');
    if (!nome) return;

    const precoTxt = btn.getAttribute('data-preco-txt');
    const precoNum = parseFloat(btn.getAttribute('data-preco-num'));
    const img = btn.getAttribute('data-img');
    const desc = btn.getAttribute('data-descricao');

    abrirModal(nome, precoTxt, precoNum, img, desc);
});

// =========================================================
// 9. PESQUISA NA PÁGINA
// =========================================================
function abrirPesquisaNovaPagina() {
    const modal = document.getElementById('modal-pagina-pesquisa');
    if (modal) {
        modal.style.display = 'block';
        const inputModal = document.getElementById('input-pesquisa-modal');
        const inputOriginal = document.getElementById('input-pesquisa');
        if (inputModal) {
            if (inputOriginal) inputModal.value = inputOriginal.value;
            inputModal.focus();
            pesquisarNaNovaPagina();
        }
    }
}

function fecharPesquisaNovaPagina() {
    const modal = document.getElementById('modal-pagina-pesquisa');
    if (modal) {
        modal.style.display = 'none';
    }
}

function pesquisarNaNovaPagina() {
    const termo = (document.getElementById('input-pesquisa-modal')?.value || document.getElementById('input-pesquisa')?.value || '').toLowerCase().trim();
    const containerResultados = document.getElementById('resultados-busca-nova-pagina');
    if (!containerResultados) return;

    if (!termo) {
        containerResultados.innerHTML = '<p style="text-align: center; color: #888; margin-top: 40px;">Digite algo para pesquisar no cardápio...</p>';
        return;
    }

    const cards = document.querySelectorAll('.menu-container .product-card');
    let encontrados = 0;
    let html = '<div class="products-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; padding: 20px 0;">';

    cards.forEach(card => {
        const titulo = card.querySelector('h3')?.innerText || '';
        const desc = card.querySelector('.product-description')?.innerText || '';
        if (titulo.toLowerCase().includes(termo) || desc.toLowerCase().includes(termo)) {
            encontrados++;
            html += `<div class="product-card">${card.innerHTML}</div>`;
        }
    });

    html += '</div>';

    if (encontrados === 0) {
        containerResultados.innerHTML = `<p style="text-align: center; color: #888; margin-top: 40px;">Nenhum produto encontrado para "<strong>${termo}</strong>".</p>`;
    } else {
        containerResultados.innerHTML = html;
    }
}

function atualizarNavbarUsuario() {
    const usuarioLogado = window.DoceEncantoDB ? window.DoceEncantoDB.obterUsuarioLogado() : JSON.parse(localStorage.getItem('usuarioLogadoDoceEncanto'));
    const userNavLink = document.getElementById('user-nav-link');

    if (userNavLink) {
        if (usuarioLogado && usuarioLogado.email && usuarioLogado.email !== 'cliente_visitante@doceencanto.com') {
            const primeiroNome = usuarioLogado.nome ? usuarioLogado.nome.split(' ')[0] : 'Minha Conta';
            userNavLink.href = (usuarioLogado.role === 'admin' || usuarioLogado.email.toLowerCase() === 'admin@doceencanto.com') ? 'admin.html' : 'perfil.html';
            userNavLink.innerHTML = `<i class="fa-regular fa-user"></i> ${primeiroNome}`;
            userNavLink.title = `Conectado como ${usuarioLogado.nome || usuarioLogado.email}`;
        } else {
            userNavLink.href = 'login.html';
            userNavLink.innerHTML = `<i class="fa-regular fa-user"></i> Login`;
            userNavLink.title = 'Minha Conta / Entrar';
        }
    }
}

// =========================================================
// 10. INICIALIZAÇÃO AO CARREGAR A PÁGINA E SINCRONIZAÇÃO
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    try {
        carrinho = JSON.parse(localStorage.getItem('carrinho_doce_encanto')) || [];
    } catch (e) { carrinho = []; }

    atualizarCarrinho();
    atualizarNavbarUsuario();

    // Se o cliente acabou de se cadastrar ou logar para concluir compra
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === 'abrir') {
        setTimeout(() => {
            if (carrinho && carrinho.length > 0) {
                irParaCheckout();
            }
        }, 300);
    }

    // Evento de troca de pagamento
    const selectsPagamento = document.querySelectorAll('#select-pagamento-modal');
    selectsPagamento.forEach(sel => {
        sel.addEventListener('change', trocarFormaPagamento);
    });

    const linksNav = document.querySelectorAll('.navbar .nav-link');
    linksNav.forEach(link => {
        link.addEventListener('click', function() {
            linksNav.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// Sincronização em tempo real entre abas e navegação
window.addEventListener('storage', function(e) {
    if (e.key === 'carrinho_doce_encanto' || e.key === 'cupom_ativo_doce_encanto' || e.key === 'observacao_carrinho_doce_encanto') {
        try {
            carrinho = JSON.parse(localStorage.getItem('carrinho_doce_encanto')) || [];
        } catch (err) {
            carrinho = [];
        }
        carregarCupomSalvo();
        carregarObservacao();
        atualizarCarrinho();
    }
});

window.addEventListener('focus', function() {
    try {
        carrinho = JSON.parse(localStorage.getItem('carrinho_doce_encanto')) || [];
    } catch (err) {
        carrinho = [];
    }
    carregarCupomSalvo();
    carregarObservacao();
    atualizarCarrinho();
});

// Fechar modais ao clicar no fundo ou pressionar a tecla ESC
document.addEventListener('click', function(e) {
    const modalCarrinho = document.getElementById('modal-carrinho');
    const telaCheckout = document.getElementById('tela-checkout');
    if (modalCarrinho && e.target === modalCarrinho) {
        fecharCarrinho();
    }
    if (telaCheckout && e.target === telaCheckout) {
        telaCheckout.classList.add('escondido', 'escondida');
        telaCheckout.style.setProperty('display', 'none', 'important');
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharCarrinho();
        const telaCheckout = document.getElementById('tela-checkout');
        if (telaCheckout) {
            telaCheckout.classList.add('escondido', 'escondida');
            telaCheckout.style.setProperty('display', 'none', 'important');
        }
        if (typeof fecharModalAviso === 'function') fecharModalAviso();
        if (typeof fecharModalProduto === 'function') fecharModalProduto();
    }
}); 
let avisoTituloAtual = "";

function abrirModalAviso(titulo, textoCompleto) {
    avisoTituloAtual = titulo;
    let modal = document.getElementById('modal-aviso-encomenda');
    
    // Se o modal estático existir no HTML, apenas preenche os dados e exibe
    const tituloEl = document.getElementById('modal-aviso-titulo');
    const textoEl = document.getElementById('modal-aviso-texto');
    const btnWhats = document.getElementById('btn-modal-aviso-whats');
    const mensagemWhats = `Olá! Gostaria de falar sobre a encomenda: *${titulo}*.`;
    const linkWhats = `https://wa.me/5511949010900?text=${encodeURIComponent(mensagemWhats)}`;

    if (modal && tituloEl && textoEl && btnWhats) {
        tituloEl.innerText = titulo;
        textoEl.innerText = textoCompleto;
        btnWhats.href = linkWhats;
        modal.style.display = 'flex';
        return;
    }

    // Fallback caso não exista a estrutura estática no HTML
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-aviso-encomenda';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); display:flex; align-items:center; justify-content:center; z-index:99999; padding:20px; box-sizing:border-box; backdrop-filter:blur(4px);';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background:#ffffff; width:100%; max-width:480px; border-radius:24px; padding:32px 25px; text-align:center; box-shadow:0 15px 35px rgba(0,0,0,0.2); border:2px solid #fce4ec; font-family:'Poppins', sans-serif; position:relative;">
            <button onclick="fecharModalAviso()" style="position:absolute; top:15px; right:15px; background:#fceef2; color:#6d3828; border:none; width:34px; height:34px; border-radius:50%; font-size:1.2rem; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:bold;">&times;</button>
            
            <div style="width:60px; height:60px; background:#fceef2; color:#f48fb1; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.8rem; margin:0 auto 15px auto;">
                <i class="fa-solid fa-circle-info"></i>
            </div>
            
            <h3 style="font-family:'Fredoka', sans-serif; color:#6d3828; font-size:1.4rem; margin:0 0 14px 0;">${titulo}</h3>
            
            <div style="color:#555; font-size:0.92rem; line-height:1.6; margin-bottom:20px; text-align:justify; background:#fff8fa; padding:16px; border-radius:14px; border:1px dashed #f8e1e7;">
                ${textoCompleto}
            </div>

            <a href="${linkWhats}" target="_blank" onclick="fecharModalAviso()" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#25d366; color:#ffffff; text-decoration:none; padding:14px; border-radius:30px; font-weight:bold; font-size:1rem; font-family:'Fredoka', sans-serif; box-shadow:0 6px 20px rgba(37,211,102,0.35); margin-bottom:12px;">
                <i class="fa-brands fa-whatsapp" style="font-size:1.3rem;"></i> Combinar pelo WhatsApp
            </a>

            <button onclick="fecharModalAviso()" style="background:transparent; border:none; color:#888; font-size:0.88rem; cursor:pointer; font-weight:600;">
                Fechar aviso
            </button>
        </div>
    `;
    modal.style.display = 'flex';
}

function fecharModalAviso() {
    const modal = document.getElementById('modal-aviso-encomenda');
    if (modal) modal.style.display = 'none';
} 
    // Se a URL contiver o hash #modal-carrinho, abre o modal do carrinho automaticamente
    if (window.location.hash === '#modal-carrinho') {
        abrirCarrinho();
    }

// =========================================================
// ATIVADOR UNIVERSAL DE ARRASTAR PRO LADO (DRAG-TO-SCROLL)
// Funciona tanto no touch quanto com o mouse no celular / desktop
// =========================================================
function inicializarArrastarProLado() {
    const carrosseis = document.querySelectorAll('.products-grid, .cards-grid');

    carrosseis.forEach(slider => {
        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;
        let isDragging = false;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            isDragging = false;
            slider.style.cursor = 'grabbing';
            slider.style.userSelect = 'none';
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = 'grab';
            setTimeout(() => { isDragging = false; }, 60);
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.5;
            if (Math.abs(walk) > 6) {
                isDragging = true;
            }
            slider.scrollLeft = scrollLeft - walk;
        });

        // Previne abrir o modal se o usuário estava arrastando a lista
        slider.addEventListener('click', (e) => {
            if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarArrastarProLado);
} else {
    inicializarArrastarProLado();
}