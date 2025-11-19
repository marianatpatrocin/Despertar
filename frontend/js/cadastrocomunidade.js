const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de cadastro de comunidade carregada');
    
    const formCadastro = document.getElementById('form-cadastro-comunidade');

    if (formCadastro) {
        formCadastro.addEventListener('submit', cadastrarComunidade);
        console.log('Event listener de submit adicionado ao formulário');
    }
});

async function cadastrarComunidade(event) {
    event.preventDefault();
    console.log('Função cadastrarComunidade chamada');

    const payload = {
        nome_comunidade: document.getElementById('nome_comunidade').value.trim(),
        nome_responsavel: document.getElementById('nome_responsavel').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefone: document.getElementById('telefone').value.trim() || null,
        endereco: document.getElementById('endereco').value.trim() || null,
        num_criancas_jovens: parseInt(document.getElementById('num_criancas_jovens').value) || null,
        faixa_etaria_aprox: document.getElementById('faixa_etaria_aprox').value,
        possui_estrutura: document.getElementById('possui_estrutura').value === '1',
        descricao: document.getElementById('descricao').value.trim() || null,
        senha: document.getElementById('senha').value
    };

    console.log('Dados da comunidade:', {...payload, senha: '****'});

    if (!payload.nome_comunidade || !payload.nome_responsavel || !payload.email || !payload.senha) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    if (!payload.faixa_etaria_aprox) {
        alert("Por favor, selecione a faixa etária predominante.");
        return;
    }

    try {
        console.log('Enviando requisição para:', `${API_BASE}/comunidades`);
        
        const response = await fetch(`${API_BASE}/comunidades`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('Status da resposta:', response.status);
        const results = await response.json();
        console.log('Resposta do servidor:', results);

        if (response.ok && results.success) {
            alert('Cadastro realizado com sucesso!');
            console.log('Redirecionando para a página de login...');
            window.location.href = 'login.html';
        } else {
            alert('Erro ao cadastrar: ' + (results.message || "Erro desconhecido"));
        }

    } catch (error) {
        console.error("Erro de conexão:", error);
        alert("Erro ao se conectar com o servidor. Verifique se o backend está rodando.");
    }
}
