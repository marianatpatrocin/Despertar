document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.getElementById('form-cadastro-comunidade');

    if (formCadastro) {
        formCadastro.addEventListener('submit', cadastrarComunidade);
    }
});

async function cadastrarComunidade(event) {
    event.preventDefault();

    const payload = {
        nome_comunidade: document.getElementById('nome_comunidade').value,
        nome_responsavel: document.getElementById('nome_responsavel').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        endereco: document.getElementById('endereco').value,
        num_criancas_jovens: parseInt(document.getElementById('num_criancas_jovens').value) || null,
        faixa_etaria_aprox: document.getElementById('faixa_etaria_aprox').value,
        possui_estrutura: document.getElementById('possui_estrutura').value === '1',
        descricao: document.getElementById('descricao').value,
        senha: document.getElementById('senha').value
    };

    if (payload.faixa_etaria_aprox === "") {
        alert("Por favor, selecione a faixa etária predominante.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/comunidades', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const results = await response.json();

        if (response.ok && results.success) {
            alert(results.message);
            window.location.href = 'login.html';
        } else {
            alert(results.message || "Erro ao cadastrar.");
        }

    } catch (error) {
        console.error("Erro de conexão:", error);
        alert("Erro ao se conectar com o servidor.");
    }
}
