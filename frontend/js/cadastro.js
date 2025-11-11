document.addEventListener('DOMContentLoaded', () => {
    const botaoCadastro = document.querySelector('.botao');
    
    if (botaoCadastro) {
        botaoCadastro.addEventListener('click', cadastrarVoluntario);
    }
});

async function cadastrarVoluntario(event) {
    event.preventDefault(); 

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;
    const endereco = document.getElementById('endereco').value;
    const descricao = document.getElementById('descricao').value;
    const senha = document.getElementById('senha').value;

    const data = { nome, email, telefone, endereco, descricao, senha };
    const endpoint = 'http://localhost:3000/voluntarios';

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
            window.location.href = 'login.html';
        } else {
            alert(results.message);
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        alert('Erro ao se conectar com o servidor. Verifique se o backend está rodando.');
    }
}