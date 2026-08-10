// ESTRUTURA DO CARRINHO COM QUANTIDADE E TOTAL CORRETOS
let carrinho = [];

function adicionarAoCarrinho(nome, preco) {
    // Verifica se o item já existe no carrinho
    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            nome: nome,
            preco: parseFloat(preco),
            quantidade: 1
        });
    }

    atualizarCarrinho();
    
    // Abre a janela do carrinho automaticamente ao adicionar
    const modal = document.getElementById('carrinho-modal');
    if (modal && !modal.classList.contains('active')) {
        modal.classList.add('active');
    }
}

function alterarQuantidade(index, delta) {
    carrinho[index].quantidade += delta;

    // Se a quantidade chegar a zero ou menos, remove do carrinho
    if (carrinho[index].quantidade <= 0) {
        carrinho.splice(index, 1);
    }

    atualizarCarrinho();
}

function atualizarCarrinho() {
    // 1. Atualiza o contador de itens totais na Navbar
    const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
    const contadorElem = document.getElementById('carrinho-contador-topo');
    if (contadorElem) {
        contadorElem.innerText = totalItens;
    }

    // 2. Elementos do Modal / Gaveta
    const containerItens = document.getElementById('carrinho-itens');
    const valorTotalElem = document.getElementById('carrinho-valor-total');

    if (!containerItens) return;

    if (carrinho.length === 0) {
        containerItens.innerHTML = '<p class="carrinho-vazio" style="text-align:center; padding: 20px; color: #888;">Seu carrinho está vazio.</p>';
        if (valorTotalElem) valorTotalElem.innerText = 'R$ 0,00';
        return;
    }

    let html = '';
    let totalGeral = 0;

    // 3. Renderiza cada item e calcula o total correto
    carrinho.forEach((item, index) => {
        const subtotal = item.preco * item.quantidade;
        totalGeral += subtotal;

        html += `
            <div class="carrinho-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                <div style="flex-grow: 1;">
                    <strong style="color: #4A2E2B; display: block; font-size: 0.95rem;">${item.nome}</strong>
                    <span style="color: #888; font-size: 0.85rem;">R$ ${item.preco.toFixed(2).replace('.', ',')} x ${item.quantidade}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button onclick="alterarQuantidade(${index}, -1)" style="background: #E85D88; color: white; border: none; width: 26px; height: 26px; border-radius: 50%; cursor: pointer; font-weight: bold;">-</button>
                    <span style="font-weight: bold; font-size: 0.9rem;">${item.quantidade}</span>
                    <button onclick="alterarQuantidade(${index}, 1)" style="background: #E85D88; color: white; border: none; width: 26px; height: 26px; border-radius: 50%; cursor: pointer; font-weight: bold;">+</button>
                </div>
            </div>
        `;
    });

    containerItens.innerHTML = html;

    // 4. Atualiza a exibição do Valor Total correto
    if (valorTotalElem) {
        valorTotalElem.innerText = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
    }
}

function toggleCarrinho() {
    const modal = document.getElementById('carrinho-modal');
    if (modal) {
        modal.classList.toggle('active');
    }
}

function finalizarPedidoWhatsApp() {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    let mensagem = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
    let totalGeral = 0;

    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        totalGeral += subtotal;
        mensagem += `• ${item.quantidade}x ${item.nome} - R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    });

    mensagem += `\n*Valor Total: R$ ${totalGeral.toFixed(2).replace('.', ',')}*`;

    const fone = '5511949010900';
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(mensagem)}`, '_blank');
} 
// Função para abrir e fechar a janela do carrinho
function toggleCarrinho() {
    const modal = document.getElementById('carrinho-modal');
    if (modal) {
        modal.classList.toggle('active');
    }
}

// Garante que o botão X dentro do carrinho realmente feche a janela
document.addEventListener('DOMContentLoaded', function() {
    const btnFechar = document.querySelector('.btn-close-cart');
    if (btnFechar) {
        btnFechar.onclick = function() {
            const modal = document.getElementById('carrinho-modal');
            if (modal) {
                modal.classList.remove('active');
            }
        };
    }
});