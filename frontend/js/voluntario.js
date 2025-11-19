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
    if (!usuarioLogado) {
        window.location.href = 'login.html';
        return;
    }

    // Exibir nome correto em qualquer página
        const nomeSpan = document.getElementById('nome-voluntario');
        if (nomeSpan) nomeSpan.innerText = usuarioLogado.nome;

    // Só executa funções de painel voluntário se for voluntário
    if (usuarioLogado.tipo === 'voluntario') {
        const voluntarioId = usuarioLogado.id;
            carregarComunidadesProximas();
            if (voluntarioId) {
                carregarMinhasCandidaturas(voluntarioId);
                // Só chama se existir o container
                if (document.getElementById('lista-convites')) {
                    carregarConvites(voluntarioId);
                }
                if (document.getElementById('lista-oficinas')) {
                    carregarOficinas(voluntarioId);
                }
            } else {
                const c = document.getElementById('lista-candidaturas');
                if (c) c.innerHTML = '<p class="text-red-500">Erro no perfil de login: ID do usuário não encontrado. Faça login novamente.</p>';
                console.error('ID do voluntário ausente. Não é possível carregar candidaturas, convites ou oficinas.');
            }
    }
    configurarLogout();
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
            if (!container) return;
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
            const container = document.getElementById('lista-comunidades');
            if (container) container.innerHTML = '<p class="text-red-500">Erro ao carregar comunidades. Verifique a conexão com o servidor.</p>';
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


// --- CARREGAR MINHAS CANDIDATURAS ---
function carregarMinhasCandidaturas(voluntarioId) {
    fetch(`${API_BASE}/candidaturas?voluntario_id=${voluntarioId}`)
        .then(res => res.json())
        .then(data => {
                const container = document.getElementById('lista-candidaturas');
                if (!container) return;
                container.innerHTML = '';
                if (!data.success || data.data.length === 0) {
                    container.innerHTML = '<p>Você ainda não se candidatou a nenhuma comunidade.</p>';
                    return;
                }

            data.data.forEach(candidatura => {
                const div = document.createElement('div');
                div.className = 'candidatura-item p-4 bg-white shadow-md rounded-xl mb-4';
                
                const statusClass = candidatura.status === 'aceita' ? 'text-green-600' : 
                                  candidatura.status === 'recusada' ? 'text-red-600' : 
                                  'text-yellow-600';
                
                div.innerHTML = `
                    <h4 class="text-lg font-semibold">${candidatura.nome_comunidade || 'Comunidade'}</h4>
                    <p class="text-gray-600"><strong>Status:</strong> <span class="${statusClass}">${candidatura.status}</span></p>
                    <p class="text-gray-600 text-sm">Enviada em: ${new Date(candidatura.data_candidatura).toLocaleDateString()}</p>
                `;
                container.appendChild(div);
            });
        })
        .catch(err => {
            console.error('Erro ao carregar candidaturas:', err);
            const container = document.getElementById('lista-candidaturas');
            if (container) {
                container.innerHTML = '<p class="text-red-500">Erro ao carregar suas candidaturas.</p>';
            }
        });
}

// --- CARREGAR CONVITES ---
function carregarConvites(voluntarioId) {
    console.log('=== Carregando convites para voluntário ID:', voluntarioId, '===');
    
    fetch(`${API_BASE}/convites?id_voluntario=${voluntarioId}`)
        .then(res => {
            console.log('Status da resposta convites:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('Dados de convites recebidos:', data);
            

                const container = document.getElementById('lista-convites');
                if (!container) {
                    // Não exibe erro se não existir na página
                    return;
                }
                container.innerHTML = '';

            if (!data.success || data.data.length === 0) {
                console.log('Nenhum convite encontrado');
                container.innerHTML = '<p>Você não tem convites no momento.</p>';
                return;
            }

            console.log('Total de convites:', data.data.length);

            data.data.forEach(convite => {
                console.log('Processando convite:', convite);
                
                const div = document.createElement('div');
                div.className = 'convite-item p-4 bg-white shadow-md rounded-xl mb-4';
                
                const statusClass = convite.status === 'aceito' ? 'text-green-600' : 
                                  convite.status === 'recusado' ? 'text-red-600' : 
                                  'text-yellow-600';
                
                const dataFormatada = new Date(convite.data_envio).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                
                div.innerHTML = `
                    <h4 class="text-lg font-semibold text-indigo-700">${convite.nome_comunidade || 'Comunidade'}</h4>
                    <p class="text-gray-700 mt-2">${convite.mensagem || 'Você foi convidado!'}</p>
                    <p class="text-gray-600 mt-1"><strong>Status:</strong> <span class="${statusClass} font-semibold">${convite.status}</span></p>
                    <p class="text-gray-500 text-sm">Recebido em: ${dataFormatada}</p>
                `;
                
                if (convite.status === 'pendente') {
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'mt-3 flex gap-2';
                    
                    const btnAceitar = document.createElement('button');
                    btnAceitar.className = 'btn-aceitar';
                    btnAceitar.innerText = '✓ Aceitar';
                    btnAceitar.addEventListener('click', () => responderConvite(convite.id, 'aceito', voluntarioId));
                    
                    const btnRecusar = document.createElement('button');
                    btnRecusar.className = 'btn-recusar';
                    btnRecusar.innerText = '✗ Recusar';
                    btnRecusar.addEventListener('click', () => responderConvite(convite.id, 'recusado', voluntarioId));
                    
                    actionsDiv.appendChild(btnAceitar);
                    actionsDiv.appendChild(btnRecusar);
                    div.appendChild(actionsDiv);
                }
                
                container.appendChild(div);
            });
            
            console.log('Convites carregados com sucesso!');
        })
        .catch(err => {
            console.error('=== ERRO ao carregar convites ===');
            console.error('Mensagem:', err.message);
            console.error('Stack:', err.stack);
            
            const container = document.getElementById('lista-convites');
            if (container) {
                container.innerHTML = '<p class="text-red-500">Erro ao carregar convites.</p>';
            }
        });
}

// --- RESPONDER CONVITE ---
function responderConvite(conviteId, status, voluntarioId) {
    fetch(`${API_BASE}/convites/${conviteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showTemporaryMessage(`Convite ${status} com sucesso!`);
            carregarConvites(voluntarioId);
        } else {
            showTemporaryMessage('Erro ao responder convite: ' + data.message, true);
        }
    })
    .catch(err => {
        console.error(err);
        showTemporaryMessage('Erro de conexão.', true);
    });
}

// --- CARREGAR OFICINAS ---
function carregarOficinas(voluntarioId) {
    // Buscar oficinas das comunidades onde o voluntário se candidatou
    fetch(`${API_BASE}/oficinas/voluntario/${voluntarioId}`)
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('lista-oficinas');
            if (!container) return;
            
            container.innerHTML = '';

            if (!data.success || data.data.length === 0) {
                container.innerHTML = '<p>Nenhuma oficina disponível. Candidate-se a uma comunidade para ver as oficinas!</p>';
                return;
            }

            data.data.forEach(oficina => {
                const div = document.createElement('div');
                div.className = 'oficina-item p-4 bg-white shadow-md rounded-xl mb-4';
                
                const dataFormatada = new Date(oficina.data_oficina).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                
                const confirmado = oficina.confirmado === 1;
                
                div.innerHTML = `
                    <h4 class="text-lg font-semibold text-indigo-700">${oficina.titulo}</h4>
                    <p class="text-gray-700"><strong>Comunidade:</strong> ${oficina.nome_comunidade || 'N/A'}</p>
                    <p class="text-gray-700"><strong>Data:</strong> ${dataFormatada}</p>
                    <p class="text-gray-700"><strong>Horário:</strong> ${oficina.horario}</p>
                    <p class="text-gray-700"><strong>Local:</strong> ${oficina.local}</p>
                    ${confirmado ? '<p class="text-green-600 font-semibold mt-2">✓ Participação confirmada</p>' : ''}
                `;
                
                if (!confirmado) {
                    const btnConfirmar = document.createElement('button');
                    btnConfirmar.className = 'btn-confirmar mt-3';
                    btnConfirmar.innerText = 'Confirmar Participação';
                    btnConfirmar.addEventListener('click', () => confirmarParticipacao(oficina.id, voluntarioId));
                    div.appendChild(btnConfirmar);
                } else {
                    const btnCancelar = document.createElement('button');
                    btnCancelar.className = 'btn-recusar mt-3';
                    btnCancelar.innerText = 'Cancelar Participação';
                    btnCancelar.addEventListener('click', () => cancelarParticipacao(oficina.id, voluntarioId));
                    div.appendChild(btnCancelar);
                }
                
                container.appendChild(div);
            });
        })
        .catch(err => {
            console.error('Erro ao carregar oficinas:', err);
            const container = document.getElementById('lista-oficinas');
            if (container) {
                container.innerHTML = '<p class="text-red-500">Erro ao carregar oficinas.</p>';
            }
        });
}

// --- CONFIRMAR PARTICIPAÇÃO ---
function confirmarParticipacao(oficinaId, voluntarioId) {
    fetch(`${API_BASE}/oficinas/${oficinaId}/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_voluntario: voluntarioId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showTemporaryMessage('Participação confirmada com sucesso!');
            carregarOficinas(voluntarioId);
        } else {
            showTemporaryMessage('Erro ao confirmar participação: ' + data.message, true);
        }
    })
    .catch(err => {
        console.error(err);
        showTemporaryMessage('Erro de conexão.', true);
    });
}

// --- CANCELAR PARTICIPAÇÃO ---
function cancelarParticipacao(oficinaId, voluntarioId) {
    if (!confirm('Deseja realmente cancelar sua participação nesta oficina?')) return;
    
    fetch(`${API_BASE}/oficinas/${oficinaId}/cancelar-participacao`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_voluntario: voluntarioId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showTemporaryMessage('Participação cancelada!');
            carregarOficinas(voluntarioId);
        } else {
            showTemporaryMessage('Erro ao cancelar participação: ' + data.message, true);
        }
    })
    .catch(err => {
        console.error(err);
        showTemporaryMessage('Erro de conexão.', true);
    });
}

// --- LOGOUT ---
function configurarLogout() {
  const btnSair = document.getElementById('btn-sair');
  if (btnSair) {
    btnSair.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('usuarioLogado');
      alert('Logout realizado com sucesso!');
      window.location.href = 'inicio.html';
    });
  }
}
