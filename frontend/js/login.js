document.addEventListener('DOMContentLoaded', () => {
    const botaoEntrar = document.querySelector('.botao-entrar');
    if (botaoEntrar) {
        botaoEntrar.addEventListener('click', fazerLogin);
    }
});

async function fazerLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    const data = { email, senha };
    const endpoint = 'http://localhost:3000/login';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const results = await response.json();

        if (response.ok) {
            alert(results.message);

            // Salva os dados do usuário no localStorage
            localStorage.setItem('usuarioLogado', JSON.stringify(results.usuario));

            // Redirecionamento baseado no tipo de usuário
            if (results.usuario.tipo === 'voluntario') {
                window.location.href = 'minhasinfos.html';
            } else if (results.usuario.tipo === 'comunidade') {
                window.location.href = 'minhasinfoscomunidade.html';
            }
        } else {
            alert(results.message);
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        alert('Erro ao tentar logar. Verifique se o backend está rodando.');
    }
}