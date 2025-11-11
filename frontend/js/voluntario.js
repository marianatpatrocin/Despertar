document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (usuarioLogado && usuarioLogado.tipo === 'voluntario') {
        const saudacao = document.querySelector('h1');
        if (saudacao) {
            saudacao.innerText = `Olá, ${usuarioLogado.nome}!`;
        }
    } else {
        window.location.href = 'login.html';
    }
});