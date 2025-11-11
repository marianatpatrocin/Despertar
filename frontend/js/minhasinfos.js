document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (usuarioLogado && usuarioLogado.tipo === 'voluntario') {
        document.getElementById('profile-name').innerText = usuarioLogado.nome;
        document.getElementById('profile-email').innerText = usuarioLogado.email;

    } else {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'login.html';
    }
});