const API_BASE = 'http://localhost:3000';

function showTemporaryMessage(message, isError = false) {
    console.log(message);

    const msgBox = document.createElement('div');
    msgBox.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        background-color: ${isError ? '#ef4444' : '#10b981'}; /* bg-red-500 ou bg-emerald-500 */
        color: white;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        font-family: 'Inter', sans-serif;
        transition: opacity 0.3s ease-in-out;
        opacity: 1;
    `;
    msgBox.innerText = message;
    document.body.appendChild(msgBox);

    setTimeout(() => {
        msgBox.style.opacity = '0';
        setTimeout(() => document.body.removeChild(msgBox), 300);
    }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!usuarioLogado || usuarioLogado.tipo !== 'voluntario') {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('nome-voluntario').innerText = usuarioLogado.nome;

    const voluntarioId = usuarioLogado.id;

    carregarComunidadesProximas();
    
    if (voluntarioId) {
        carregarMinhasCandidaturas(voluntarioId);
        carregarConvites(voluntarioId);
        carregarOficinas(voluntarioId);
    } else {
        document.getElementById('lista-candidaturas').innerHTML = '<p class="text-red-500">Erro no perfil de login: ID do usuário não encontrado. Faça login novamente.</p>';
        console.error('ID do voluntário ausente. Não é possível carregar candidaturas, convites ou oficinas.');
    }
});


function carregarComunidadesProximas() {
    // Busca todas as comunidades, sem passar o filtro 'cidade'
    fetch(`${API_BASE}/comunidades`) 
        .then(res => {
            if (!res.ok) throw new Error('Erro na requisição de comunidades.');
            return res.json();
        })
        .then(data => {
            const container = document.getElementById('lista-comunidades');
            container.innerHTML = '';

            if (!data.success || data.data.length === 0) {
                container.innerHTML = '<p>Nenhuma comunidade encontrada no sistema.</p>';
                return;
            }

            data.data.forEach(c => {
                const div = document.createElement('div');
                div.className = 'comunidade-item p-4 bg-white shadow-md rounded-xl mb-4';
                div.innerHTML = `
                    <h3 class="link-comunidade text-xl font-semibold text-indigo-600 cursor-pointer">${c.nome_comunidade}</h3>
                    <p class="text-gray-600"><strong>Endereço:</strong> ${c.endereco}</p>
                    <p class="text-gray-600"><strong>Descrição:</strong> ${c.descricao || 'Sem descrição disponível.'}</p>
                `;

                // link para ver detalhes da comunidade
                div.querySelector('.link-comunidade').addEventListener('click', () => {
                    localStorage.setItem('comunidadeSelecionada', JSON.stringify(c)); // salvar comunidade selecionada
                    window.location.href = `minhasinfoscomunidade.html?id=${c.id}`;
                });

                // botão candidatar
                const btn = document.createElement('button');
                btn.className = 'btn-candidatar mt-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200';
                btn.innerText = 'Candidatar-se';
                btn.addEventListener('click', () => candidatar(c.id));
                div.appendChild(btn);

                container.appendChild(div);
            });
        })
        .catch(err => {
            console.error(err);
            document.getElementById('lista-comunidades').innerHTML = '<p class="text-red-500">Erro ao carregar comunidades. Verifique a conexão com o servidor.</p>';
        });
}

function candidatar(comunidadeId) {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) {
        showTemporaryMessage("Você precisa estar logado.", true);
        window.location.href = "login.html";
        return;
    }
    
    // Verifica novamente se o ID do voluntário está disponível
    if (!usuario.id) {
        showTemporaryMessage("Seu ID de voluntário não está disponível. Faça login novamente.", true);
        return;
    }

    fetch(`${API_BASE}/candidaturas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voluntario_id: usuario.id, comunidade_id: comunidadeId })
    })
    .then(res => res.json())
    .then(r => {
        if (r.success) {
            showTemporaryMessage('Candidatura enviada com sucesso!');
            carregarMinhasCandidaturas(usuario.id);
        } else {
            showTemporaryMessage('Erro: ' + r.message, true);
        }
    })
    .catch(err => {
        console.error(err);
        showTemporaryMessage("Erro de conexão com o servidor.", true);
    });
}

