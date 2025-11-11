document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (usuarioLogado && usuarioLogado.tipo === 'comunidade') {
        const tituloComunidade = document.querySelector('h1');
        if (tituloComunidade) {
            tituloComunidade.innerText = `${usuarioLogado.nome_comunidade}`;
        }
    } else {
        window.location.href = 'login.html';
    }
});