// Aguarda todo o conteúdo da página carregar
document.addEventListener("DOMContentLoaded", () => {
    
    // Seleciona todas as seções que possuem um ID correspondente no menu
    const secoes = document.querySelectorAll("section[id]");
    const linksMenu = document.querySelectorAll(".menu nav a");

    // Função que monitora a rolagem para mudar a classe active no menu
    window.addEventListener("scroll", () => {
        let topoAtual = window.pageYOffset;

        secoesInternas.forEach(secao => {
            const secaoTopo = secao.offsetTop - 120; // Folga para o menu fixo
            const secaoAltura = secao.offsetHeight;
            const secaoId = secao.getAttribute("id");

            // Se a seção estiver visível no meio da tela
            if (topoAtual >= secaoTopo && topoAtual < secaoTopo + secaoAltura) {
                linksMenu.forEach(link => {
                    link.classList.remove("active");
                    // Se o link terminar com a hashtag da seção atual, ganha o destaque
                    if (link.getAttribute("href").endsWith("#" + secaoId)) {
                        link.classList.add("active");
                    }
                });
            }
        });

        // Caso especial: Se estiver bem no topo, força o link "Início" a ficar ativo
        if (topoAtual < 200) {
            linksMenu.forEach(link => link.classList.remove("active"));
            const linkInicio = document.querySelector('a[href="inicio.html"]');
            if (linkInicio) linkInicio.classList.add("active");
        }
    });
}); 
// Array que armazenará os itens adicionados
let carrinho = [];

// Função para abrir e fechar a barra do carrinho
function toggleCarrinho() {
    const painel = document.getElementById('carrinho-lateral');
    painel.classList.toggle('aberto');
}

// Função para adicionar produtos (Chame esta função nos botões do seu Cardápio)
// Exemplo de uso no HTML do cardápio: onclick="adicionarAoCarrinho('Morangoffe', 18.00)"
function adicionarAoCarrinho(nome, preco) {
    // Verifica se o item já está no carrinho
    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ nome, preco, quantidade: 1 });
    }

    atualizarCarrinho();
}

// Função para remover um item do carrinho
function removerDoCarrinho(nome) {
    carrinho = carrinho.filter(item => item.nome !== nome);
    atualizarCarrinho();
}

// Função que reconstrói a lista visual do carrinho e soma os valores
function atualizarCarrinho() {
    const conteinerItens = document.getElementById('carrinho-itens');
    const contador = document.getElementById('carrinho-contador');
    const totalTexto = document.getElementById('carrinho-total');

    // Zera o container visual
    conteinerItens.innerHTML = '';

    let totalGeral = 0;
    let totalItens = 0;

    if (carrinho.length === 0) {
        conteinerItens.innerHTML = '<p class="carrinho-vazio">Seu carrinho está com fome. Adicione doces!</p>';
    } else {
        carrinho.forEach(item => {
            totalGeral += item.preco * item.quantidade;
            totalItens += item.quantidade;

            // Cria a linha do produto
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item-carrinho');
            itemDiv.innerHTML = `
                <div class="item-info">
                    <h4>${item.nome} x${item.quantidade}</h4>
                    <span>R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                </div>
                <button class="btn-remover" onclick="removerDoCarrinho('${item.nome}')">Remover</button>
            `;
            conteinerItens.appendChild(itemDiv);
        });
    }

    // Atualiza os contadores numéricos da tela
    contador.innerText = totalItens;
    totalTexto.innerText = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
}

// Envia a lista de compras mastigadinha direto para o WhatsApp da confeitaria
function finalizarPedido() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    let numeroWhats = "5541999999999"; // Substitua pelo seu WhatsApp real com DDD
    let mensagem = "🧁 *Novo Pedido - Doce Encanto* 🧁\n\n";

    carrinho.forEach(item => {
        mensagem += `• ${item.nome} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2)}\n`;
    });

    const total = document.getElementById('carrinho-total').innerText;
    mensagem += `\n💰 *${total}*`;

    // Converte os espaços e caracteres para formato URL
    const urlFinal = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagem)}`;
    
    // Abre a conversa
    window.open(urlFinal, '_blank');
}