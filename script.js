// script.js - DELEGAÇÃO E SINCRONIZAÇÃO UNIFICADA DO CARRINHO (LOCALSTORAGE)
// Todas as ações de carrinho usam inicio.js para manter 100% de conexao em todas as paginas!

document.addEventListener('DOMContentLoaded', function() {
    // Atualiza contador da navbar imediatamente
    if (typeof atualizarCarrinho === 'function') {
        atualizarCarrinho();
    }
});