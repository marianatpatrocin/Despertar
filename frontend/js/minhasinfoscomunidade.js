document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (usuarioLogado && usuarioLogado.tipo === 'comunidade') {
        document.getElementById('community-name').innerText = usuarioLogado.nome;
        document.getElementById('community-info').innerText = usuarioLogado.nome;
    } else {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'login.html';
    }
});