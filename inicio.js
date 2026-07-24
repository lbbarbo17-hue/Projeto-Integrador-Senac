// --- 1. MONITORAMENTO DE SCROLL E MENU ATIVO ---
document.addEventListener("DOMContentLoaded", () => {
    
    // Carrega o carrinho salvo assim que a página abre
    carregarCarrinhoDoStorage();

    // Seleciona todas as seções com ID e os links da navbar
    const secoes = document.querySelectorAll("section[id]");
    const linksMenu = document.querySelectorAll(".navbar a, .menu nav a");

    window.addEventListener("scroll", () => {
        let topoAtual = window.pageYOffset;

        // Destaque dinâmico das seções ao rolar
        secoes.forEach(secao => {
            const secaoTopo = secao.offsetTop - 120; // Folga para navbar fixa
            const secaoAltura = secao.offsetHeight;
            const secaoId = secao.getAttribute("id");

            if (topoAtual >= secaoTopo && topoAtual < secaoTopo + secaoAltura) {
                linksMenu.forEach(link => {
                    link.classList.remove("active");
                    const href = link.getAttribute("href");
                    if (href && href.endsWith("#" + secaoId)) {
                        link.classList.add("active");
                    }
                });
            }
        });

        // Caso especial: topo da página
        if (topoAtual < 150) {
            linksMenu.forEach(link => link.classList.remove("active"));
            const linkInicio = document.querySelector('a[href="inicio.html"]');
            if (linkInicio) linkInicio.classList.add("active");
        }
    });
});


// --- 2. SISTEMA DE CARRINHO (INTEGRADO E COM LOCALSTORAGE) ---
let carrinho = [];

// Carrega dados salvos no navegador ao iniciar
function carregarCarrinhoDoStorage() {
    const salvo = localStorage.getItem('carrinhoDoceEncanto');
    if (salvo) {
        carrinho = JSON.parse(salvo);
    }
    atualizarCarrinho();
}

// Salva as alterações no navegador
function salvarCarrinhoNoStorage() {
    localStorage.setItem('carrinhoDoceEncanto', JSON.stringify(carrinho));
}

// Abre/Fecha tanto o Modal quanto a Gaveta Lateral (suporta os dois layouts)
function toggleCarrinho() {
    const modal = document.getElementById('modal-carrinho');
    const painelLateral = document.getElementById('carrinho-lateral');

    if (modal) {
        modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
    }
    
    if (painelLateral) {
        painelLateral.classList.toggle('aberto');
    }
}

// Adiciona produto e atualiza tudo
function adicionarAoCarrinho(nome, preco) {
    // Garante que o preço seja tratado como número boato
    const precoNum = typeof preco === 'string' ? parseFloat(preco.replace(',', '.')) : preco;

    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ nome, preco: precoNum, quantidade: 1 });
    }

    salvarCarrinhoNoStorage();
    atualizarCarrinho();
}

// Função dos botões "Pedir": Adiciona + Atualiza + Abre a janela na hora
function adicionarEAbriCarrinho(nome, preco) {
    adicionarAoCarrinho(nome, preco);
    
    // Garante que a janela se abra imediatamente
    const modal = document.getElementById('modal-carrinho');
    const painelLateral = document.getElementById('carrinho-lateral');

    if (modal) modal.style.display = 'flex';
    if (painelLateral) painelLateral.classList.add('aberto');
}

// Remove item do carrinho
function removerDoCarrinho(nome) {
    carrinho = carrinho.filter(item => item.nome !== nome);
    salvarCarrinhoNoStorage();
    atualizarCarrinho();
}

// Reconstrói a interface visual do carrinho
function atualizarCarrinho() {
    // Procura elementos do Layout Modal ou do Layout Lateral
    const conteinerItens = document.getElementById('carrinho-itens') || document.getElementById('itens-carrinho');
    const contadorTopo = document.getElementById('carrinho-contador-topo');
    const contadorLateral = document.getElementById('carrinho-contador');
    const totalTexto = document.getElementById('carrinho-total') || document.getElementById('total-valor');

    let totalGeral = 0;
    let totalItens = 0;

    if (conteinerItens) {
        conteinerItens.innerHTML = '';

        if (carrinho.length === 0) {
            conteinerItens.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">Seu carrinho está vazio. Adicione doces!</p>';
        } else {
            carrinho.forEach(item => {
                const subtotal = item.preco * item.quantidade;
                totalGeral += subtotal;
                totalItens += item.quantidade;

                const itemDiv = document.createElement('div');
                itemDiv.className = 'item-carrinho';
                itemDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #eee;';
                
                itemDiv.innerHTML = `
                    <div>
                        <strong style="color: #6d3828; display: block; font-size: 0.95rem;">${item.nome} (x${item.quantidade})</strong>
                        <span style="color: #f48fb1; font-size: 0.88rem; font-weight: 600;">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button onclick="removerDoCarrinho('${item.nome}')" style="background: none; border: none; color: #d32f2f; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                        Remover
                    </button>
                `;
                conteinerItens.appendChild(itemDiv);
            });
        }
    }

    // Atualiza contadores numéricos na tela
    if (contadorTopo) contadorTopo.innerText = totalItens;
    if (contadorLateral) contadorLateral.innerText = totalItens;

    // Atualiza valores totais
    if (totalTexto) {
        totalTexto.innerText = `${totalGeral.toFixed(2).replace('.', ',')}`;
    }
}

// --- 3. DISPARO DE PEDIDO PARA O WHATSAPP ---
function finalizarPedido() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    const numeroWhats = "5511949010900"; // Número oficial da Doce Encanto
    let mensagem = "🧁 *Novo Pedido - Doce Encanto* 🧁\n\n";

    let totalGeral = 0;
    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        totalGeral += subtotal;
        mensagem += `• ${item.nome} (x${item.quantidade}) - R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    });

    mensagem += `\n💰 *Total: R$ ${totalGeral.toFixed(2).replace('.', ',')}*`;
    mensagem += `\n\n📍 Gostaria de confirmar a entrega/retirada!`;

    const urlFinal = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagem)}`;
    window.open(urlFinal, '_blank');
}

// Captura opcional para botões com atributos data-* (sem quebrar os botões com onclick)
document.addEventListener("click", function(event) {
    const botao = event.target.closest('.btn-pedir-rosa');
    
    if (botao) {
        const nome = botao.getAttribute('data-nome');
        const preco = parseFloat(botao.getAttribute('data-preco'));
        
        if (nome && !isNaN(preco)) {
            adicionarEAbriCarrinho(nome, preco);
        }
    }
}); 
// Função para ABRIR o modal do carrinho
function abrirCarrinho(event) {
    if(event) event.preventDefault(); // Impede a página de recarregar
    
    // Procura o modal na tela (tenta achar pelo ID ou pela Classe)
    const modal = document.getElementById('modal-carrinho') || document.querySelector('.modal-carrinho');
    
    if (modal) {
        modal.style.display = 'flex'; // Exibe o modal centralizado
    }
}

// Função para FECHAR o modal do carrinho
function fecharCarrinho() {
    const modal = document.getElementById('modal-carrinho') || document.querySelector('.modal-carrinho');
    
    if (modal) {
        modal.style.display = 'none'; // Esconde o modal
    }
}