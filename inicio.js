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
    if (telaCheckout) {
        telaCheckout.classList.remove('escondido');
        trocarFormaPagamento();
    }
}

function voltarParaCarrinho() {
    const telaCheckout = document.getElementById('tela-checkout');
    if (telaCheckout) telaCheckout.classList.add('escondido');
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

    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
}

// =========================================================
// 8. ABRIR E FECHAR MODAL DE DETALHES DO PRODUTO (VER MAIS)
// =========================================================
function abrirModal(nome, precoTexto, precoNumero, imagem, descricao) {
    let modal = document.getElementById('modal-produto');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-produto';
        modal.className = 'modal-produto-overlay';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:99999; padding:15px; box-sizing:border-box;';
        
        modal.innerHTML = `
            <div style="background:#fff; width:100%; max-width:450px; border-radius:20px; overflow:hidden; position:relative; box-shadow:0 10px 25px rgba(0,0,0,0.2); animation: popIn 0.3s ease; font-family:'Poppins', sans-serif;">
                <button onclick="fecharModalProduto()" style="position:absolute; top:12px; right:12px; background:rgba(0,0,0,0.5); color:#fff; border:none; width:32px; height:32px; border-radius:50%; font-size:1.2rem; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center;">&times;</button>
                <img id="modal-img-produto" src="" alt="Produto" style="width:100%; height:220px; object-fit:cover; display:block;">
                <div style="padding:20px;">
                    <h3 id="modal-nome-produto" style="margin:0 0 8px 0; font-size:1.25rem; color:#4a2c2a; font-weight:700;"></h3>
                    <p id="modal-desc-produto" style="font-size:0.88rem; color:#666; line-height:1.5; margin-bottom:15px; max-height:150px; overflow-y:auto; word-break:break-word;"></p>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #fce4ec; padding-top:14px;">
                        <span id="modal-preco-produto" style="font-size:1.25rem; font-weight:bold; color:#d81b60;"></span>
                        <button id="modal-btn-pedir" style="background:#d81b60; color:#fff; border:none; padding:10px 22px; border-radius:20px; font-weight:bold; font-size:0.9rem; cursor:pointer; box-shadow:0 4px 12px rgba(216,27,96,0.3);">Pedir Agora</button>
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

// =========================================================
// SISTEMA AUTOMÁTICO DO BOTÃO "VER MAIS" (Via data-* attributes)
// =========================================================
document.addEventListener('click', function (event) {
    const btn = event.target.closest('.btn-ver-mais');
    if (!btn) return;

    const nome = btn.getAttribute('data-nome');
    if (!nome) return;

    const precoTxt = btn.getAttribute('data-preco-txt');
    const precoNum = parseFloat(btn.getAttribute('data-preco-num'));
    const img = btn.getAttribute('data-img');
    const desc = btn.getAttribute('data-descricao');

    exibirModalProduto(nome, precoTxt, precoNum, img, desc);
});

function exibirModalProduto(nome, precoTexto, precoNumero, imagem, descricao) {
    let modal = document.getElementById('modal-produto-global');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-produto-global';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.65); display:flex; align-items:center; justify-content:center; z-index:999999; padding:15px; box-sizing:border-box;';
        
        modal.innerHTML = `
            <div style="background:#fff; width:100%; max-width:420px; border-radius:18px; overflow:hidden; position:relative; box-shadow:0 12px 30px rgba(0,0,0,0.3); font-family:sans-serif;">
                <button onclick="fecharModalProdutoGlobal()" style="position:absolute; top:12px; right:12px; background:rgba(0,0,0,0.5); color:#fff; border:none; width:34px; height:34px; border-radius:50%; font-size:20px; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center;">&times;</button>
                <img id="mg-img" src="" style="width:100%; height:210px; object-fit:cover; display:block;">
                <div style="padding:20px;">
                    <h3 id="mg-nome" style="margin:0 0 10px 0; font-size:1.25rem; color:#333;"></h3>
                    <p id="mg-desc" style="font-size:0.9rem; color:#555; line-height:1.5; margin-bottom:18px; max-height:140px; overflow-y:auto;"></p>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #eee; padding-top:15px;">
                        <span id="mg-preco" style="font-size:1.25rem; font-weight:bold; color:#d81b60;"></span>
                        <button id="mg-btn-pedir" style="background:#d81b60; color:#fff; border:none; padding:10px 22px; border-radius:25px; font-weight:bold; cursor:pointer; font-size:0.9rem;">Adicionar à sacola</button>
                    </div>
                </div>
            </div>
        `;
        modal.addEventListener('click', function(e) {
            if (e.target === modal) fecharModalProdutoGlobal();
        });
        document.body.appendChild(modal);
    }

    const imgEl = document.getElementById('mg-img');
    const nomeEl = document.getElementById('mg-nome');
    const descEl = document.getElementById('mg-desc');
    const precoEl = document.getElementById('mg-preco');

    if (imgEl) imgEl.src = imagem || '';
    if (nomeEl) nomeEl.innerText = nome || '';
    if (descEl) descEl.innerText = descricao || '';
    if (precoEl) precoEl.innerText = precoTexto || '';
    
    const btnPedir = document.getElementById('mg-btn-pedir');
    if (btnPedir) {
        btnPedir.onclick = function() {
            adicionarAoCarrinho(nome, precoNumero);
            fecharModalProdutoGlobal();
        };
    }

    modal.style.display = 'flex';
}

function fecharModalProdutoGlobal() {
    const modal = document.getElementById('modal-produto-global');
    if (modal) modal.style.display = 'none';
}

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