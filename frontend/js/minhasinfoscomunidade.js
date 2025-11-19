const API_BASE = 'http://localhost:3000';
let comunidadeData = null;

document.addEventListener("DOMContentLoaded", async () => {
    console.log('=== Página Minhas Infos Comunidade carregada ===');
    
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    console.log('usuarioLogado do localStorage:', usuarioLogado);

    if (!usuarioLogado) {
        console.log('Nenhum usuário logado, redirecionando para login');
        alert('Você precisa fazer login primeiro.');
        window.location.href = 'login.html';
        return;
    }

    const usuario = JSON.parse(usuarioLogado);
    console.log('Dados do usuário:', usuario);

    if (!usuario.id) {
        console.error('ID do usuário não encontrado!');
        alert('Erro: ID do usuário não encontrado.');
        window.location.href = 'login.html';
        return;
    }

    // Verifica se é uma comunidade
    if (usuario.tipo !== 'comunidade') {
        console.error('Usuário não é uma comunidade!');
        alert('Acesso negado. Esta página é apenas para comunidades.');
        window.location.href = 'inicio.html';
        return;
    }

    console.log('ID da comunidade:', usuario.id);
    
    await carregarDadosComunidade(usuario.id);
    configurarModal(usuario.id);
    configurarExclusao(usuario.id);
    configurarLogout();
});

async function carregarDadosComunidade(comunidadeId) {
    console.log('=== Carregando dados da comunidade ID:', comunidadeId, '===');
    
    try {
        const url = `${API_BASE}/comunidades/${comunidadeId}`;
        console.log('Fazendo requisição para:', url);
        
        const res = await fetch(url);
        console.log('Status da resposta:', res.status);
        
        const data = await res.json();
        console.log('Dados recebidos:', data);

        if (!res.ok || !data.success) {
            throw new Error(data.message || 'Erro ao buscar dados');
        }

        const c = data.data;
        console.log('Dados da comunidade:', c);
        comunidadeData = c;

        // Atualizar elementos da página
        const elementos = {
            'nome-comunidade': c.nome_comunidade || 'N/A',
            'email-comunidade': c.email || 'N/A',
            'responsavel': c.nome_responsavel || '-',
            'telefone': c.telefone || '-',
            'endereco': c.endereco || '-',
            'num-jovens': c.num_criancas_jovens || '-',
            'faixa-etaria': c.faixa_etaria_aprox || '-',
            'estrutura': c.possui_estrutura ? 'Sim' : 'Não',
            'descricao': c.descricao || '-'
        };

        console.log('Atualizando elementos da página...');
        for (const [id, valor] of Object.entries(elementos)) {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor;
                console.log(`✓ ${id}: ${valor}`);
            } else {
                console.warn(`✗ Elemento não encontrado: ${id}`);
            }
        }

        console.log('=== Dados da comunidade carregados com sucesso! ===');

    } catch (err) {
        console.error('=== ERRO ao carregar dados da comunidade ===');
        console.error('Mensagem:', err.message);
        console.error('Stack:', err.stack);
        
        const nomeElement = document.getElementById('nome-comunidade');
        if (nomeElement) {
            nomeElement.textContent = 'Erro ao carregar dados da comunidade.';
        }
        alert('Erro ao carregar seus dados. Tente fazer login novamente.');
    }
}

// --- MODAL DE EDIÇÃO ---
function configurarModal(comunidadeId) {
    console.log('Configurando modal de edição...');
    
    const modal = document.getElementById('modal-editar');
    const btnEditar = document.getElementById('editarPerfil');
    const fechar = document.getElementById('fechar-modal');
    const formEditar = document.getElementById('form-editar');

    if (btnEditar) {
        btnEditar.onclick = () => abrirModal();
        console.log('✓ Botão editar configurado');
    }

    if (fechar) {
        fechar.onclick = () => {
            modal.style.display = 'none';
            console.log('Modal fechado');
        };
    }

    window.onclick = e => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    };

    if (formEditar) {
        formEditar.addEventListener('submit', (e) => salvarEdicao(e, comunidadeId));
        console.log('✓ Form de edição configurado');
    }
}

async function abrirModal() {
    console.log('Abrindo modal de edição...');
    
    if (!comunidadeData) {
        console.log('Dados da comunidade não carregados');
        alert('Aguarde, carregando dados...');
        return;
    }

    const modal = document.getElementById('modal-editar');
    modal.style.display = 'block';

    // Preencher campos do modal
    const campos = {
        'edit-nome': comunidadeData.nome_comunidade || '',
        'edit-responsavel': comunidadeData.nome_responsavel || '',
        'edit-email': comunidadeData.email || '',
        'edit-telefone': comunidadeData.telefone || '',
        'edit-endereco': comunidadeData.endereco || '',
        'edit-num-jovens': comunidadeData.num_criancas_jovens || '',
        'edit-faixa-etaria': comunidadeData.faixa_etaria_aprox || '',
        'edit-descricao': comunidadeData.descricao || '',
        'edit-senha': comunidadeData.senha || ''
    };

    for (const [id, valor] of Object.entries(campos)) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.value = valor;
            console.log(`✓ ${id} preenchido`);
        }
    }

    // Select especial
    const estrutura = document.getElementById('edit-estrutura');
    if (estrutura) {
        estrutura.value = comunidadeData.possui_estrutura ? '1' : '0';
    }

    console.log('Modal preenchido e aberto');
}

async function salvarEdicao(e, comunidadeId) {
    e.preventDefault();
    console.log('=== Salvando edição da comunidade ===');

    const updateBody = {
        nome_comunidade: document.getElementById('edit-nome').value.trim(),
        nome_responsavel: document.getElementById('edit-responsavel').value.trim(),
        email: document.getElementById('edit-email').value.trim(),
        telefone: document.getElementById('edit-telefone').value.trim() || null,
        endereco: document.getElementById('edit-endereco').value.trim() || null,
        num_criancas_jovens: parseInt(document.getElementById('edit-num-jovens').value) || null,
        faixa_etaria_aprox: document.getElementById('edit-faixa-etaria').value,
        possui_estrutura: document.getElementById('edit-estrutura').value === '1',
        descricao: document.getElementById('edit-descricao').value.trim() || null,
        senha: document.getElementById('edit-senha').value
    };

    console.log('Dados para atualizar:', {...updateBody, senha: '****'});

    try {
        const url = `${API_BASE}/comunidades/${comunidadeId}`;
        console.log('Enviando PUT para:', url);
        
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateBody)
        });

        console.log('Status da resposta:', res.status);
        const data = await res.json();
        console.log('Resposta:', data);

        if (data.success) {
            alert('Comunidade atualizada com sucesso!');
            document.getElementById('modal-editar').style.display = 'none';
            
            // Atualizar localStorage
            const usuarioAtualizado = {...JSON.parse(localStorage.getItem('usuarioLogado')), ...updateBody};
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));
            
            await carregarDadosComunidade(comunidadeId);
            console.log('Dados recarregados após edição');
        } else {
            alert('Erro ao atualizar comunidade: ' + (data.message || 'Erro desconhecido'));
        }
    } catch (err) {
        console.error('Erro ao atualizar:', err);
        alert('Erro ao tentar atualizar a comunidade. Verifique sua conexão.');
    }
}

// --- EXCLUIR COMUNIDADE ---
function configurarExclusao(comunidadeId) {
    console.log('Configurando botão de exclusão...');
    
    const btnExcluir = document.getElementById('excluirComunidade');
    
    if (btnExcluir) {
        btnExcluir.onclick = () => excluirComunidade(comunidadeId);
        console.log('✓ Botão excluir configurado');
    }
}

async function excluirComunidade(comunidadeId) {
    console.log('=== Iniciando exclusão da comunidade ===');
    
    const confirmacao = confirm(
        'Tem certeza que deseja excluir sua comunidade?\n\n' +
        'Esta ação é IRREVERSÍVEL e todos os dados serão perdidos permanentemente!\n\n' +
        'Digite OK para confirmar.'
    );
    
    if (!confirmacao) {
        console.log('Exclusão cancelada pelo usuário');
        return;
    }

    try {
        const url = `${API_BASE}/comunidades/${comunidadeId}`;
        console.log('Enviando DELETE para:', url);
        
        const res = await fetch(url, {
            method: 'DELETE'
        });

        console.log('Status da resposta:', res.status);
        const data = await res.json();
        console.log('Resposta:', data);

        if (data.success) {
            alert('Comunidade excluída com sucesso!');
            localStorage.removeItem('usuarioLogado');
            console.log('usuário removido do localStorage');
            window.location.href = 'inicio.html';
        } else {
            alert('Erro ao excluir comunidade: ' + (data.message || 'Erro desconhecido'));
        }
    } catch (err) {
        console.error('Erro ao excluir:', err);
        alert('Erro ao tentar excluir a comunidade. Verifique sua conexão.');
    }
}

// --- LOGOUT ---
function configurarLogout() {
    console.log('Configurando logout...');
    
    const btnSair = document.getElementById('btn-sair');
    
    if (btnSair) {
        btnSair.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Fazendo logout...');
            
            localStorage.removeItem('usuarioLogado');
            console.log('Usuário removido do localStorage');
            
            alert('Logout realizado com sucesso!');
            window.location.href = 'inicio.html';
        });
        console.log('✓ Botão de logout configurado');
    } else {
        console.warn('Botão de sair não encontrado');
    }
}
