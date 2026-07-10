// Seleciona todas as seções do cardápio e os links do menu
const sections = document.querySelectorAll('.menu-section');
const navLinks = document.querySelectorAll('.nav-link');

// Função que monitora a rolagem da página
window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        // Verifica se a seção está visível na tela (com uma folga de 1/3 da altura)
        if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
            current = section.getAttribute('id');
        }
    });

    // Remove a cor rosa de todos os links e adiciona apenas no que está ativo
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});