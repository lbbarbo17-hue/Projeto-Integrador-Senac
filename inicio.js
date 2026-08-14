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
    atualizarCarrinho(); // <-- Atualiza a contagem na hora!
    
    mostrarNotificacao(`✓ "${nome}" adicionado à sacola!`);
}

// =========================================================
// 2. MENSAGEM FLUTUANTE (TOAST)
// =========================================================
function mostrarNotificacao(texto) {
    let notif = document.getElementById('notificacao-item');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'notificacao-item';
        notif.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#d81b60; color:#fff; padding:12px 20px; border-radius:30px; font-size:0.85rem; font-weight:bold; box-shadow:0 4px 15px rgba(216,27,96,0.3); z-index:1000000; display:none;';
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

    // --- CORREÇÃO DO "0" DO CARRINHO ---
    // Soma a quantidade total de produtos
    const totalQtd = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    
    // Atualiza TODOS os elementos de contador que estiverem na página
    const contadores = document.querySelectorAll('#contador-carrinho, .carrinho-qtd-badge');
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

    if (regra === '10%') {
        valorDescontoCupom = subtotal * 0.10;
    } else {
        valorDescontoCupom = Number(regra);
    }

    if (valorDescontoCupom > subtotal) {
        valorDescontoCupom = subtotal;
    }

    alert(`Cupom "${codigo}" aplicado!\nDesconto: R$ ${valorDescontoCupom.toFixed(2).replace('.', ',')}`);
    atualizarCarrinho();
}

function alterarQtd(index, delta) {
    carrinho[index].quantidade += delta;
    if (carrinho[index].quantidade <= 0) carrinho.splice(index, 1);
    
    if (cupomAtivo === 'DOCE10') {
        valorDescontoCupom = calcularSubtotal() * 0.10;
    }

    salvarCarrinho();
    atualizarCarrinho();
}

function limparCarrinho() {
    carrinho = [];
    valorDescontoCupom = 0;
    cupomAtivo = '';
    salvarCarrinho();
    atualizarCarrinho();
}

function salvarCarrinho() {
    localStorage.setItem('carrinho_doce_encanto', JSON.stringify(carrinho));
}

// =========================================================
// 5. ABRIR E FECHAR MODAIS
// =========================================================
function abrirCarrinho(e) {
    if (e && e.preventDefault) e.preventDefault();
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        modal.classList.remove('escondido');
        atualizarCarrinho();
    }
}

function fecharCarrinho() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) modal.classList.add('escondido');
}

function irParaCheckout() {
    if (!carrinho || carrinho.length === 0) {
        alert("Sua sacola está vazia!");
        return;
    }
    fecharCarrinho();
    const telaCheckout = document.getElementById('tela-checkout');
    if (telaCheckout) telaCheckout.classList.remove('escondido');
}

function voltarParaCarrinho() {
    const telaCheckout = document.getElementById('tela-checkout');
    if (telaCheckout) telaCheckout.classList.add('escondido');
    abrirCarrinho();
}

// =========================================================
// 6. ENVIAR PEDIDO AO WHATSAPP
// =========================================================
function processarPedidoSite() {
    const ruaInput = document.getElementById('rua-cliente');
    const bairroInput = document.getElementById('bairro-cliente');
    const rua = ruaInput ? ruaInput.value.trim() : '';
    const bairro = bairroInput ? bairroInput.value.trim() : '';

    if (!rua || !bairro) {
        alert("Preencha o Endereço para continuar!");
        return;
    }

    const subtotal = calcularSubtotal();
    let totalGeral = (subtotal + TAXA_ENTREGA + TAXA_SERVICO) - valorDescontoCupom;
    if (totalGeral < 0) totalGeral = 0;

    let msg = "*🧁 PEDIDO REALIZADO - DOCE ENCANTO 🧁*\n\n";
    carrinho.forEach(i => msg += `• ${i.quantidade}x ${i.nome}\n`);
    msg += `\n*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    msg += `\n*Taxa Entrega:* R$ ${TAXA_ENTREGA.toFixed(2).replace('.', ',')}`;
    msg += `\n*Taxa Serviço:* R$ ${TAXA_SERVICO.toFixed(2).replace('.', ',')}`;
    if (valorDescontoCupom > 0) {
        msg += `\n*Cupom (${cupomAtivo}):* - R$ ${valorDescontoCupom.toFixed(2).replace('.', ',')}`;
    }
    msg += `\n*TOTAL FINAL:* R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
    msg += `\n\n*Endereço:* ${rua}, ${bairro}`;

    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
}

// Executa a atualização assim que a página carregar
document.addEventListener('DOMContentLoaded', atualizarCarrinho); 
document.addEventListener('DOMContentLoaded', function() {
    const linksNav = document.querySelectorAll('.navbar .nav-link');

    linksNav.forEach(link => {
        link.addEventListener('click', function() {
            // Limpa o rosa de todo mundo
            linksNav.forEach(l => l.classList.remove('active'));
            
            // Coloca o rosa APENAS no botão que recebeu o clique
            this.classList.add('active');
        });
    });
}); 
document.addEventListener('DOMContentLoaded', function() {
    const linksNav = document.querySelectorAll('.navbar .nav-link');

    linksNav.forEach(link => {
        link.addEventListener('click', function() {
            linksNav.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
});