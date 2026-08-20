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
        window.location.href = 'index.html#modal-carrinho';
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
        window.location.href = 'index.html#modal-carrinho';
    }
}

function fecharCarrinho() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        modal.classList.add('escondido');
        modal.style.setProperty('display', 'none', 'important');
    }
}

function irParaCheckout() {
    if (!carrinho || carrinho.length === 0) {
        alert("Sua sacola está vazia!");
        return;
    }
    fecharCarrinho();
    const telaCheckout = document.getElementById('tela-checkout');
    if (telaCheckout) {
        telaCheckout.classList.remove('escondido', 'escondida');
        telaCheckout.style.setProperty('display', 'flex', 'important');
        trocarFormaPagamento();
    }
}

function finalizarPedidoDireto() {
    if (!carrinho || carrinho.length === 0) {
        alert("Sua sacola está vazia!");
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
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogadoDoceEncanto'));
    const emailDono = usuarioLogado ? usuarioLogado.email : 'cliente_visitante@doceencanto.com';
    const numeroPedido = Math.floor(1000 + Math.random() * 9000);
    const dataFormatada = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const pedidosAnteriores = JSON.parse(localStorage.getItem('pedidosDoceEncanto')) || [];
    const novoPedido = {
        id: numeroPedido,
        emailUsuario: emailDono,
        data: dataFormatada,
        itens: [...carrinho],
        observacao: observacaoTxt,
        total: totalGeral
    };
    pedidosAnteriores.unshift(novoPedido);
    localStorage.setItem('pedidosDoceEncanto', JSON.stringify(pedidosAnteriores));

    // 2. Fechar sacola e limpar carrinho
    fecharCarrinho();
    carrinho = [];
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
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogadoDoceEncanto'));
    const emailDono = usuarioLogado ? usuarioLogado.email : 'cliente_visitante@doceencanto.com';
    const numeroPedido = Math.floor(1000 + Math.random() * 9000);
    const dataFormatada = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const pedidosAnteriores = JSON.parse(localStorage.getItem('pedidosDoceEncanto')) || [];
    const novoPedido = {
        id: numeroPedido,
        emailUsuario: emailDono,
        data: dataFormatada,
        itens: [...carrinho],
        observacao: observacaoTxt,
        total: totalGeral
    };
    pedidosAnteriores.unshift(novoPedido);
    localStorage.setItem('pedidosDoceEncanto', JSON.stringify(pedidosAnteriores));

    // 2. Fechar tela de checkout e limpar carrinho
    const telaCheckout = document.getElementById('tela-checkout');
    if (telaCheckout) {
        telaCheckout.classList.add('escondido', 'escondida');
        telaCheckout.style.setProperty('display', 'none', 'important');
    }
    carrinho = [];
    salvarCarrinho();
    atualizarCarrinho();

    // 3. Exibir Modal "Pedido Realizado!" com resumo e botão do WhatsApp
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
        <div style="background:#ffffff; width:100%; max-width:440px; border-radius:24px; padding:32px 25px; text-align:center; box-shadow:0 15px 35px rgba(0,0,0,0.2); border:2px solid #fce4ec; font-family:'Poppins', sans-serif;">
            <div style="width:70px; height:70px; background:#e8f5e9; color:#2ecc71; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2.2rem; margin:0 auto 15px auto;">
                <i class="fa-solid fa-check"></i>
            </div>
            
            <h3 style="font-family:'Fredoka', sans-serif; color:#6d3828; font-size:1.6rem; margin:0 0 8px 0;">Pedido #${numPedido} Realizado!</h3>
            <p style="color:#2ecc71; font-weight:bold; font-size:0.95rem; margin-bottom:15px;">✓ Salvo com sucesso no seu perfil!</p>
            <p style="color:#666; font-size:0.9rem; line-height:1.5; margin-bottom:20px;">Seu pedido já foi cadastrado na sua conta! Clique no botão abaixo para nos enviar pelo WhatsApp e acompanhar o preparo.</p>

            <div style="background:#fff8fa; border:1px dashed #f8e1e7; border-radius:14px; padding:12px 18px; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center; font-weight:bold; color:#6d3828;">
                <span>Total a Pagar:</span>
                <span style="color:#d81b60; font-size:1.1rem;">R$ ${total.toFixed(2).replace('.', ',')}</span>
            </div>

            <a href="${linkWhats}" target="_blank" onclick="fecharModalSucesso()" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#25d366; color:#ffffff; text-decoration:none; padding:14px; border-radius:30px; font-weight:bold; font-size:1rem; font-family:'Fredoka', sans-serif; box-shadow:0 6px 20px rgba(37,211,102,0.35); margin-bottom:12px;">
                <i class="fa-brands fa-whatsapp" style="font-size:1.3rem;"></i> Mandar pedido por WhatsApp
            </a>

            <button onclick="fecharModalSucesso()" style="background:transparent; border:none; color:#888; font-size:0.9rem; cursor:pointer; font-weight:600;">
                Fechar e continuar navegando
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
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:99999; padding:15px; box-sizing:border-box;';
        
        modal.innerHTML = `
            <div style="background:#fff; width:100%; max-width:420px; border-radius:20px; overflow:hidden; position:relative; box-shadow:0 10px 25px rgba(0,0,0,0.2); animation: popIn 0.3s ease; font-family:'Poppins', sans-serif;">
                <button onclick="fecharModalProduto()" style="position:absolute; top:12px; right:12px; background:rgba(0,0,0,0.4); color:#fff; border:none; width:32px; height:32px; border-radius:50%; font-size:1.2rem; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center;">&times;</button>
                <img id="modal-img-produto" src="" alt="Produto" style="width:100%; height:220px; object-fit:cover; display:block;">
                <div style="padding:20px;">
                    <h3 id="modal-nome-produto" style="margin:0 0 8px 0; font-size:1.25rem; color:#4a2c2a; font-weight:700;"></h3>
                    <p id="modal-desc-produto" style="font-size:0.88rem; color:#666; line-height:1.5; margin-bottom:15px; max-height:150px; overflow-y:auto; word-break:break-word;"></p>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #fce4ec; padding-top:14px;">
                        <span id="modal-preco-produto" style="font-size:1.25rem; font-weight:bold; color:#e07a93;"></span>
                        <button id="modal-btn-pedir" style="background:#e07a93; color:#fff; border:none; padding:10px 22px; border-radius:20px; font-weight:bold; font-size:0.9rem; cursor:pointer; box-shadow:0 4px 12px rgba(224,122,147,0.3);">Pedir Agora</button>
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

// =========================================================
// 10. INICIALIZAÇÃO AO CARREGAR A PÁGINA E SINCRONIZAÇÃO
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    try {
        carrinho = JSON.parse(localStorage.getItem('carrinho_doce_encanto')) || [];
    } catch (e) { carrinho = []; }

    atualizarCarrinho();

    // Sincroniza sessão do usuário na Navbar
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogadoDoceEncanto'));
    const userNavLink = document.getElementById('user-nav-link');

    if (userNavLink && usuarioLogado) {
        const primeiroNome = usuarioLogado.nome ? usuarioLogado.nome.split(' ')[0] : 'Perfil';
        userNavLink.href = usuarioLogado.email === 'admin@doceencanto.com' ? 'admin.html' : 'perfil.html';
        userNavLink.innerHTML = `<i class="fa-regular fa-user"></i> ${primeiroNome}`;
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
    if (e.key === 'carrinho_doce_encanto') {
        try {
            carrinho = JSON.parse(e.newValue) || [];
        } catch (err) {
            carrinho = [];
        }
        atualizarCarrinho();
    }
});

window.addEventListener('focus', function() {
    try {
        carrinho = JSON.parse(localStorage.getItem('carrinho_doce_encanto')) || [];
    } catch (err) {
        carrinho = [];
    }
    atualizarCarrinho();
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
;