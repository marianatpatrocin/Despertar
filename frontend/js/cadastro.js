const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const possuiFormacaoSelect = document.getElementById('possuiFormacao');
  const campoFormacao = document.getElementById('campoFormacao');

  possuiFormacaoSelect.addEventListener('change', () => {
    campoFormacao.style.display = (possuiFormacaoSelect.value === 'true') ? 'block' : 'none';
  });

  document.getElementById('form-cadastro').addEventListener('submit', cadastrarVoluntario);
});

async function cadastrarVoluntario(e) {
  e.preventDefault();

  const voluntario = {
    nome: document.getElementById('nome').value,
    data_nascimento: document.getElementById('dataNascimento').value,
    telefone: document.getElementById('telefone').value,
    email: document.getElementById('email').value,
    endereco: document.getElementById('cidade').value,
    possui_formacao: document.getElementById('possuiFormacao').value === 'true',
    formacao: document.getElementById('formacao').value,
    area_atuacao: document.getElementById('areaAtuacao').value,
    descricao: document.getElementById('descricao').value,
    foto: document.getElementById('foto').value,
    senha: document.getElementById('senha').value
  };

  try {
    const res = await fetch(`${API_BASE}/voluntarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voluntario)
    });

    const data = await res.json();

    if (data.success) {
      alert('Cadastro realizado com sucesso!');
      window.location.href = 'login.html';
    } else {
      alert('Erro ao cadastrar: ' + data.message);
    }
  } catch (err) {
    console.error('Erro ao cadastrar:', err);
    alert('Erro na comunicação com o servidor.');
  }
}
 const inputFoto = document.getElementById('foto');
const preview = document.getElementById('preview-foto');

inputFoto.addEventListener('change', () => {
  const file = inputFoto.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => (preview.src = e.target.result);
    reader.readAsDataURL(file);
  }
});
