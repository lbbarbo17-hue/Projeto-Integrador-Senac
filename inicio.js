// Aguarda todo o conteúdo da página carregar
document.addEventListener("DOMContentLoaded", () => {
    
    // Seleciona todas as seções que possuem um ID correspondente no menu
    const secoes Internas = document.querySelectorAll("section[id]");
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