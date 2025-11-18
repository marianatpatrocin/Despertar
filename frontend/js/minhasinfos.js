const API_BASE = 'http://localhost:3000';
const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
let perfilData = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!usuario || !usuario.id) {
    window.location.href = 'login.html';
    return;
  }
  await carregarPerfil();
  configurarUploadFoto();
});

async function carregarPerfil() {
  try {
    const res = await fetch(`${API_BASE}/voluntarios/${usuario.id}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    const v = data.data;
    perfilData = v;

    document.getElementById('nome-voluntario').textContent = v.nome || 'N/A';
    document.getElementById('email-voluntario').textContent = v.email || 'N/A';
    document.getElementById('telefone').textContent = v.telefone || '-';
    document.getElementById('cidade').textContent = v.cidade || '-';
    document.getElementById('nascimento').textContent = v.data_nascimento || '-';
    document.getElementById('formacao').textContent = v.formacao || '-';
    document.getElementById('descricao').textContent = v.descricao || '-';

    const fotoElement = document.getElementById('foto-perfil');
    if (fotoElement) fotoElement.src = v.foto || '/frontend/assets/perfil.jpg';

  } catch (err) {
    console.error('Erro ao carregar perfil:', err.message);
    document.getElementById('nome-voluntario').textContent = 'Erro ao carregar dados do perfil.';
  }
}

// --- MODAL DE EDIÇÃO ---
const modal = document.getElementById('modal-editar');
const btnEditar = document.getElementById('editarPerfil');
const fechar = document.getElementById('fechar-modal');

if (btnEditar) btnEditar.onclick = abrirModal;
if (fechar) fechar.onclick = () => (modal.style.display = 'none');
window.onclick = e => { if (e.target == modal) modal.style.display = 'none'; };

async function abrirModal() {
  if (!perfilData) {
    await carregarPerfil();
    if (!perfilData) return;
  }

  modal.style.display = 'block';

  document.getElementById('edit-nome').value = perfilData.nome || '';
  document.getElementById('edit-nascimento').value = perfilData.data_nascimento || '';
  document.getElementById('edit-telefone').value = perfilData.telefone || '';
  document.getElementById('edit-email').value = perfilData.email || '';
  document.getElementById('edit-cidade').value = perfilData.cidade || '';
  document.getElementById('edit-possui-formacao').value = perfilData.possui_formacao ? 'true' : 'false';
  document.getElementById('edit-formacao').value = perfilData.formacao || '';
  document.getElementById('edit-area-atuacao').value = perfilData.area_atuacao || '';
  document.getElementById('edit-descricao').value = perfilData.descricao || '';
  document.getElementById('edit-senha').value = perfilData.senha || '';
}

document.getElementById('form-editar').addEventListener('submit', async (e) => {
  e.preventDefault();

  const updateBody = {
    nome: document.getElementById('edit-nome').value,
    data_nascimento: document.getElementById('edit-nascimento').value,
    telefone: document.getElementById('edit-telefone').value,
    email: document.getElementById('edit-email').value,
    cidade: document.getElementById('edit-cidade').value,
    possui_formacao: document.getElementById('edit-possui-formacao').value === 'true',
    formacao: document.getElementById('edit-formacao').value,
    area_atuacao: document.getElementById('edit-area-atuacao').value,
    descricao: document.getElementById('edit-descricao').value,
    senha: document.getElementById('edit-senha').value
  };

  try {
    const res = await fetch(`${API_BASE}/voluntarios/${usuario.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateBody)
    });

    const data = await res.json();

    if (data.success) {
      alert('Perfil atualizado com sucesso!');
      modal.style.display = 'none';
      await carregarPerfil();
    } else {
      alert('Erro ao atualizar perfil: ' + data.message);
    }
  } catch (err) {
    console.error('Erro na comunicação com o servidor:', err);
    alert('Erro ao tentar atualizar o perfil.');
  }
});

// --- UPLOAD DE FOTO ---
function configurarUploadFoto() {
  const fotoPerfil = document.getElementById('foto-perfil');
  const inputFoto = document.getElementById('input-foto');

  fotoPerfil.addEventListener('click', () => inputFoto.click());

  inputFoto.addEventListener('change', async () => {
    const file = inputFoto.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('foto', file);

    try {
      const res = await fetch(`${API_BASE}/voluntarios/${usuario.id}/foto`, {
        method: 'PUT',
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        const reader = new FileReader();
        reader.onload = e => fotoPerfil.src = e.target.result;
        reader.readAsDataURL(file);
        alert('Foto atualizada com sucesso!');
      } else {
        alert('Erro ao atualizar foto.');
      }
    } catch (err) {
      console.error('Erro ao enviar foto:', err);
      alert('Erro ao enviar nova foto.');
    }
  });
}