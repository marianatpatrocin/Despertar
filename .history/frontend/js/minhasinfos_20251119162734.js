const API_BASE = 'http://localhost:3000';
let perfilData = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('=== Página Minhas Infos carregada ===');
  
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

  console.log('ID do usuário:', usuario.id);
  
  await carregarPerfil(usuario.id);
  configurarUploadFoto(usuario.id);
  configurarModal(usuario.id);
  configurarLogout();
});

async function carregarPerfil(usuarioId) {
  console.log('=== Carregando perfil do usuário ID:', usuarioId, '===');
  
  try {
    const url = `${API_BASE}/voluntarios/${usuarioId}`;
    console.log('Fazendo requisição para:', url);
    
    const res = await fetch(url);
    console.log('Status da resposta:', res.status);
    
    const data = await res.json();
    console.log('Dados recebidos:', data);

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Erro ao buscar dados');
    }

    const v = data.data;
    console.log('Dados do voluntário:', v);
    perfilData = v;

    // Atualizar elementos da página
    const elementos = {
      'nome-voluntario': v.nome || 'N/A',
      'email-voluntario': v.email || 'N/A',
      'telefone': v.telefone || '-',
      'cidade': v.cidade || '-',
      'nascimento': formatarData(v.data_nascimento) || '-',
      'formacao': v.formacao || '-',
      'areaAtuacao': v.area_atuacao || '-',
      'descricao': v.descricao || '-'
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

    // Atualizar foto
    const fotoElement = document.getElementById('foto-perfil');
    if (fotoElement) {
      fotoElement.src = v.foto || '/frontend/assets/perfil.jpg';
      console.log('✓ Foto atualizada');
    }

    console.log('=== Perfil carregado com sucesso! ===');

  } catch (err) {
    console.error('=== ERRO ao carregar perfil ===');
    console.error('Mensagem:', err.message);
    console.error('Stack:', err.stack);
    
    const nomeElement = document.getElementById('nome-voluntario');
    if (nomeElement) {
      nomeElement.textContent = 'Erro ao carregar dados do perfil.';
    }
    alert('Erro ao carregar seus dados. Tente fazer login novamente.');
  }
}

function formatarData(data) {
  if (!data) return null;
  const d = new Date(data);
  const dia = String(d.getDate() + 1).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// --- MODAL DE EDIÇÃO ---
function configurarModal(usuarioId) {
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
    formEditar.addEventListener('submit', (e) => salvarEdicao(e, usuarioId));
    console.log('✓ Form de edição configurado');
  }
}

async function abrirModal() {
  console.log('Abrindo modal de edição...');
  
  if (!perfilData) {
    console.log('Dados do perfil não carregados, carregando...');
    alert('Aguarde, carregando dados...');
    return;
  }

  const modal = document.getElementById('modal-editar');
  modal.style.display = 'block';

  // Preencher campos do modal
  const campos = {
    'edit-nome': perfilData.nome || '',
    'edit-nascimento': perfilData.data_nascimento || '',
    'edit-telefone': perfilData.telefone || '',
    'edit-email': perfilData.email || '',
    'edit-cidade': perfilData.cidade || '',
    'edit-formacao': perfilData.formacao || '',
    'edit-area-atuacao': perfilData.area_atuacao || '',
    'edit-descricao': perfilData.descricao || '',
    'edit-senha': perfilData.senha || ''
  };

  for (const [id, valor] of Object.entries(campos)) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.value = valor;
      console.log(`✓ ${id} preenchido`);
    }
  }

  // Select especial
  const possuiFormacao = document.getElementById('edit-possui-formacao');
  if (possuiFormacao) {
    possuiFormacao.value = perfilData.possui_formacao ? 'true' : 'false';
  }

  console.log('Modal preenchido e aberto');
}

async function salvarEdicao(e, usuarioId) {
  e.preventDefault();
  console.log('=== Salvando edição do perfil ===');

  const updateBody = {
    nome: document.getElementById('edit-nome').value.trim(),
    data_nascimento: document.getElementById('edit-nascimento').value || null,
    telefone: document.getElementById('edit-telefone').value.trim(),
    email: document.getElementById('edit-email').value.trim(),
    cidade: document.getElementById('edit-cidade').value.trim(),
    possui_formacao: document.getElementById('edit-possui-formacao').value === 'true' ? 1 : 0,
    formacao: document.getElementById('edit-formacao').value || null,
    area_atuacao: document.getElementById('edit-area-atuacao').value || null,
    descricao: document.getElementById('edit-descricao').value.trim() || null,
    senha: document.getElementById('edit-senha').value
  };

  console.log('Dados para atualizar:', {...updateBody, senha: '****'});

  try {
    const url = `${API_BASE}/voluntarios/${usuarioId}`;
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
      alert('Perfil atualizado com sucesso!');
      document.getElementById('modal-editar').style.display = 'none';
      await carregarPerfil(usuarioId);
      console.log('Perfil recarregado após edição');
    } else {
      alert('Erro ao atualizar perfil: ' + (data.message || 'Erro desconhecido') + (data.data ? '\n' + JSON.stringify(data.data) : ''));
    }
  } catch (err) {
    console.error('Erro ao atualizar:', err);
    alert('Erro ao tentar atualizar o perfil. Verifique sua conexão.');
  }
}

// --- UPLOAD DE FOTO ---
function configurarUploadFoto(usuarioId) {
  console.log('Configurando upload de foto...');
  
  const fotoPerfil = document.getElementById('foto-perfil');
  const inputFoto = document.getElementById('input-foto');

  if (!fotoPerfil || !inputFoto) {
    console.warn('Elementos de foto não encontrados');
    return;
  }

  fotoPerfil.addEventListener('click', () => {
    inputFoto.click();
    console.log('Input de foto acionado');
  });

  inputFoto.addEventListener('change', async () => {
    const file = inputFoto.files[0];
    if (!file) return;

    console.log('Arquivo selecionado:', file.name, file.type);

    const formData = new FormData();
    formData.append('foto', file);

    try {
      const url = `${API_BASE}/voluntarios/${usuarioId}/foto`;
      console.log('Enviando foto para:', url);
      
      const res = await fetch(url, {
        method: 'PUT',
        body: formData
      });

      const data = await res.json();
      console.log('Resposta upload foto:', data);

      if (data.success) {
        const reader = new FileReader();
        reader.onload = e => {
          fotoPerfil.src = e.target.result;
          console.log('Foto atualizada na interface');
        };
        reader.readAsDataURL(file);
        alert('Foto atualizada com sucesso!');
      } else {
        alert('Erro ao atualizar foto: ' + (data.message || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao enviar foto:', err);
      alert('Erro ao enviar nova foto.');
    }
  });

  console.log('✓ Upload de foto configurado');
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
