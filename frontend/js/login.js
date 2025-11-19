const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de login carregada');
    
    const formulario = document.querySelector('form');
    console.log('Formulário encontrado:', formulario);
    
    if (formulario) {
        formulario.addEventListener('submit', fazerLogin);
        console.log('Event listener de submit adicionado ao formulário');
    } else {
        console.error('Formulário não encontrado!');
    }
});

async function fazerLogin(event) {
    event.preventDefault();
    console.log('=== Iniciando processo de login ===');

    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');

    if (!emailInput || !senhaInput) {
        console.error('Campos de email ou senha não encontrados!');
        alert('Erro: Campos do formulário não encontrados.');
        return;
    }

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    console.log('Email:', email);
    console.log('Senha:', senha ? '****' : 'vazia');

    if (!email || !senha) {
        alert('Por favor, preencha email e senha.');
        return;
    }

    const data = { email, senha };
    const endpoint = `${API_BASE}/login`;

    console.log('Endpoint:', endpoint);
    console.log('Payload:', JSON.stringify({...data, senha: '****'}));

    try {
        console.log('Enviando requisição...');
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        console.log('Resposta recebida. Status:', response.status, response.statusText);

        if (!response.ok && response.status >= 500) {
            throw new Error(`Erro no servidor: ${response.status}`);
        }

        const results = await response.json();
        console.log('Dados da resposta:', results);

        if (response.ok && results.success) {
            console.log('Login bem-sucedido!');
            console.log('Tipo de usuário:', results.usuario.tipo);
            
            localStorage.setItem('usuarioLogado', JSON.stringify(results.usuario));
            console.log('Usuário salvo no localStorage');

            alert(results.message || 'Login realizado com sucesso!');

            if (results.usuario.tipo === 'voluntario') {
                console.log('Redirecionando para inicio-logado.html');
                window.location.href = 'inicio-logado.html';
            } else if (results.usuario.tipo === 'comunidade') {
                console.log('Redirecionando para inicio-logado.html');
                window.location.href = 'inicio-logado.html';
            } else {
                console.error('Tipo de usuário desconhecido:', results.usuario.tipo);
                alert('Erro: Tipo de usuário inválido.');
            }
        } else {
            console.log('Login falhou:', results.message);
            alert(results.message || 'Email ou senha incorretos.');
        }
    } catch (error) {
        console.error('=== ERRO DURANTE LOGIN ===');
        console.error('Tipo:', error.name);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        
        alert('Erro ao conectar com o servidor. Verifique se o backend está rodando na porta 3000.');
    }
}