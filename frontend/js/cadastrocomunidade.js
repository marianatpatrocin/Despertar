document.addEventListener('DOMContentLoaded', () => {
    const botaoCadastro = document.querySelector('.botao');
    
    // Verifica se o botão de cadastro existe na página
    if (botaoCadastro) {
        botaoCadastro.addEventListener('click', cadastrarComunidade);
    }
});

async function cadastrarComunidade(event) {
    event.preventDefault();

    const nome_comunidade = document.getElementById('nome_comunidade').value;
    const nome_responsavel = document.getElementById('nome_responsavel').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;
    const endereco = document.getElementById('endereco').value;
    const descricao = document.getElementById('descricao').value;
    const senha = document.getElementById('senha').value;

    const data = { nome_comunidade, nome_responsavel, email, telefone, endereco, descricao, senha };
    const endpoint = 'http://localhost:3000/comunidades';

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
        alert('Erro ao se conectar com o servidor.');
    }
}

