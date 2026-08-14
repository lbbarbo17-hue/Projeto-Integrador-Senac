// ==========================================
// CONFIGURAÇÕES GLOBAIS
// ==========================================
const NUMERO_WHATSAPP = "5541999999999"; // Coloque seu número aqui com DDD

// Garante que o carrinho existe e é válido
let carrinho = [];
try {
    carrinho = JSON.parse(localStorage.getItem('carrinho_doce_encanto')) || [];
} catch (e) {
    carrinho = [];
}

// ==========================================
// FLUXO DO CHECKOUT
// ==========================================

// Função do Botão "Avançar"
function irParaCheckout() {
    console.log("Botão Avançar clicado!");

    // 1. Verifica se tem itens no carrinho
    if (!carrinho || carrinho.length === 0) {
        alert("Seu carrinho está vazio! Adicione produtos primeiro.");
        return;
    }

    // 2. Pega os elementos do DOM
    const modalCarrinho = document.getElementById('modal-carrinho');
    const telaCheckout = document.getElementById('tela-checkout');
    const selectPagamento = document.getElementById('select-pagamento-modal');
    const totalCheckoutText = document.getElementById('total-checkout-valor');

    if (!telaCheckout) {
        alert("Erro no HTML: A div com id 'tela-checkout' não foi encontrada.");
        return;
    }

    // 3. Atualiza o valor total no checkout
    if (totalCheckoutText) {
        totalCheckoutText.innerText = `R$ ${calcularTotal().toFixed(2).replace('.', ',')}`;
    }

    // 4. Esconde o modal do carrinho e mostra a tela de checkout
    if (modalCarrinho) {
        modalCarrinho.classList.add('escondido');
        modalCarrinho.style.display = 'none';
    }
    
    telaCheckout.classList.remove('escondido');
    telaCheckout.style.display = 'flex';

    // 5. Gerencia qual aba de pagamento exibir (PIX ou Cartão)
    const abaPix = document.getElementById('pagina-pix');
    const abaCartao = document.getElementById('pagina-cartao');
    const opcaoEscolhida = selectPagamento ? selectPagamento.value : 'pix';

    // Oculta ambas as abas primeiro
    if (abaPix) {
        abaPix.classList.add('escondida');
        abaPix.style.display = 'none';
    }
    if (abaCartao) {
        abaCartao.classList.add('escondida');
        abaCartao.style.display = 'none';
    }

    // Exibe apenas a escolhida
    if (opcaoEscolhida === 'pix' && abaPix) {
        abaPix.classList.remove('escondida');
        abaPix.style.display = 'block';
    } else if (opcaoEscolhida === 'cartao' && abaCartao) {
        abaCartao.classList.remove('escondida');
        abaCartao.style.display = 'block';
    }
}

// Voltar do Checkout para o Carrinho
function voltarParaCarrinho() {
    const telaCheckout = document.getElementById('tela-checkout');
    if (telaCheckout) {
        telaCheckout.classList.add('escondido');
        telaCheckout.style.display = 'none';
    }
    abrirCarrinho();
}

// Abrir Modal do Carrinho (Impede a página de pular para o topo)
function abrirCarrinho(e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }
    
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        modal.classList.remove('escondido');
        modal.style.display = 'flex';
        atualizarCarrinho();
    }
}

// Fechar Modal do Carrinho
function fecharCarrinho() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        modal.classList.add('escondido');
        modal.style.display = 'none';
    }
}

// ==========================================
// REGRAS DO CARRINHO DE COMPRAS
// ==========================================

function adicionarAoCarrinho(nome, preco) {
    // Trata o preço para garantir que seja um Número válido
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
    abrirCarrinho();
}

function atualizarCarrinho() {
    const listaItens = document.getElementById('carrinho-itens');
    const totalValor = document.getElementById('total-valor');
    const contadorBadge = document.getElementById('contador-carrinho');

    if (listaItens) {
        listaItens.innerHTML = '';
        if (carrinho.length === 0) {
            listaItens.innerHTML = '<p style="text-align:center; color:#888; margin: 20px 0;">Seu carrinho está vazio.</p>';
        } else {
            carrinho.forEach((item, index) => {
                const precoFormatado = Number(item.preco).toFixed(2).replace('.', ',');
                listaItens.innerHTML += `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #eee;">
                        <div>
                            <strong style="font-size:0.95rem; color:#333;">${item.nome}</strong><br>
                            <small style="color:#666;">R$ ${precoFormatado} x ${item.quantidade}</small>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <button type="button" onclick="alterarQtd(${index}, -1)" style="padding:2px 8px; cursor:pointer;">-</button>
                            <span>${item.quantidade}</span>
                            <button type="button" onclick="alterarQtd(${index}, 1)" style="padding:2px 8px; cursor:pointer;">+</button>
                        </div>
                    </div>
                `;
            });
        }
    }

    const total = calcularTotal();
    if (totalValor) totalValor.innerText = total.toFixed(2).replace('.', ',');
    if (contadorBadge) contadorBadge.innerText = carrinho.reduce((acc, i) => acc + i.quantidade, 0);
}

function alterarQtd(index, delta) {
    carrinho[index].quantidade += delta;
    if (carrinho[index].quantidade <= 0) {
        carrinho.splice(index, 1);
    }
    salvarCarrinho();
    atualizarCarrinho();
}

function salvarCarrinho() {
    localStorage.setItem('carrinho_doce_encanto', JSON.stringify(carrinho));
}

function calcularTotal() {
    if (!carrinho || carrinho.length === 0) return 0;
    return carrinho.reduce((acc, item) => acc + (Number(item.preco) * item.quantidade), 0);
}

// ==========================================
// FUNÇÕES AUXILIARES DO CHECKOUT
// ==========================================

// Copiar código PIX
function copiarPix() {
    const input = document.getElementById('chave-pix-input');
    if (input) {
        input.select();
        document.execCommand('copy');
        alert("Código PIX copiado para a área de transferência!");
    }
}

// GPS / Localização
function obterLocalizacaoAtual() {
    const statusGeo = document.getElementById('status-geo');
    if (!navigator.geolocation) {
        if (statusGeo) statusGeo.innerText = "GPS não suportado neste navegador.";
        return;
    }

    if (statusGeo) {
        statusGeo.innerText = "Buscando coordenadas GPS...";
        statusGeo.style.color = "#000";
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
            const coordsInput = document.getElementById('coords-gps');
            const ruaInput = document.getElementById('rua-cliente');
            
            if (coordsInput) coordsInput.value = link;
            if (ruaInput && !ruaInput.value) ruaInput.value = `Localização GPS Selecionada`;
            
            if (statusGeo) {
                statusGeo.innerText = "📍 Localização GPS capturada com sucesso!";
                statusGeo.style.color = "#2e7d32";
            }
        },
        () => {
            if (statusGeo) {
                statusGeo.innerText = "Erro ao obter GPS. Por favor digite o endereço.";
                statusGeo.style.color = "#c62828";
            }
        }
    );
}

// Finalizar Pedido
function processarPedidoSite() {
    const ruaInput = document.getElementById('rua-cliente');
    const bairroInput = document.getElementById('bairro-cliente');
    const gpsInput = document.getElementById('coords-gps');

    const rua = ruaInput ? ruaInput.value.trim() : '';
    const bairro = bairroInput ? bairroInput.value.trim() : '';
    const gps = gpsInput ? gpsInput.value : '';

    if (!rua || !bairro) {
        alert("Por favor, preencha o Endereço e o Bairro antes de finalizar.");
        return;
    }

    const abaCartaoVisivel = document.getElementById('pagina-cartao') && document.getElementById('pagina-cartao').style.display !== 'none';
    
    if (abaCartaoVisivel) {
        const numCartao = document.getElementById('cartao-numero');
        const nomeCartao = document.getElementById('cartao-nome');
        if (numCartao && nomeCartao && (!numCartao.value || !nomeCartao.value)) {
            alert("Por favor, preencha o número e nome no cartão.");
            return;
        }
    }

    alert("🎉 Pedido Confirmado com Sucesso!");

    // Monta a mensagem para o WhatsApp
    let msg = "*🧁 NOVO PEDIDO - DOCE ENCANTO 🧁*\n\n";
    carrinho.forEach(i => msg += `• ${i.quantidade}x ${i.nome}\n`);
    msg += `\n*Total:* R$ ${calcularTotal().toFixed(2).replace('.', ',')}`;
    msg += `\n*Endereço:* ${rua}, ${bairro}`;
    if (gps) msg += `\n*GPS:* ${gps}`;
    msg += `\n*Pagamento:* ${abaCartaoVisivel ? 'Cartão de Crédito/Débito' : 'PIX'} (Confirmado)`;

    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');

    // Limpa o carrinho após finalizar
    carrinho = [];
    salvarCarrinho();
    atualizarCarrinho();
    
    const telaCheckout = document.getElementById('tela-checkout');
    if (telaCheckout) {
        telaCheckout.classList.add('escondido');
        telaCheckout.style.display = 'none';
    }
}

// Inicializa a página ao carregar
document.addEventListener('DOMContentLoaded', () => {
    atualizarCarrinho();
}); 
function abrirModal(nome, precoFormatado, precoNumero, imagemSrc, descricaoCompleta) {
    // Preenche as informações no Modal
    document.getElementById('modal-titulo').innerText = nome;
    document.getElementById('modal-descricao').innerText = descricaoCompleta;
    document.getElementById('modal-preco').innerText = precoFormatado;
    document.getElementById('modal-img').src = imagemSrc;

    // Configura o botão de pedido dentro do modal
    const btnPedir = document.getElementById('modal-btn-pedir');
    btnPedir.onclick = function() {
        adicionarAoCarrinho(nome, precoNumero);
        fecharModal();
    };

    // Exibe o modal
    document.getElementById('modal-produto').classList.add('active');
}

function fecharModal() {
    document.getElementById('modal-produto').classList.remove('active');
}

// Fecha o modal se o usuário clicar fora do card
function fecharModalFora(event) {
    if (event.target.classList.contains('modal-overlay')) {
        fecharModal();
    }
}