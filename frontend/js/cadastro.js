const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Página de cadastro carregada');
  
  const possuiFormacaoSelect = document.getElementById('possuiFormacao');
  const campoFormacao = document.getElementById('campoFormacao');
  const formCadastro = document.getElementById('form-cadastro');
  const inputFoto = document.getElementById('foto');
  const preview = document.getElementById('preview-foto');

  if (possuiFormacaoSelect && campoFormacao) {
    possuiFormacaoSelect.addEventListener('change', () => {
      campoFormacao.style.display = (possuiFormacaoSelect.value === 'true') ? 'block' : 'none';
    });
  }

  if (inputFoto && preview) {
    inputFoto.addEventListener('change', () => {
      const file = inputFoto.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => (preview.src = e.target.result);
        reader.readAsDataURL(file);
      }
    });
  }

  if (formCadastro) {
    formCadastro.addEventListener('submit', cadastrarVoluntario);
    console.log('Event listener de submit adicionado ao formulário');
  }
});

async function cadastrarVoluntario(e) {
  e.preventDefault();
  console.log('Função cadastrarVoluntario chamada');

  const voluntario = {
    nome: document.getElementById('nome').value.trim(),
    data_nascimento: document.getElementById('dataNascimento').value,
    telefone: document.getElementById('telefone').value.trim(),
    email: document.getElementById('email').value.trim(),
    cidade: document.getElementById('cidade').value.trim(),
    possui_formacao: document.getElementById('possuiFormacao').value === 'true',
    formacao: document.getElementById('formacao').value || null,
    area_atuacao: document.getElementById('areaAtuacao').value || null,
    descricao: document.getElementById('descricao').value.trim() || null,
    foto: null,
    senha: document.getElementById('senha').value
  };

  console.log('Dados do voluntário:', {...voluntario, senha: '****'});

  if (!voluntario.nome || !voluntario.email || !voluntario.senha) {
    alert('Por favor, preencha todos os campos obrigatórios (nome, email e senha).');
    return;
  }

  try {
    console.log('Enviando requisição para:', `${API_BASE}/voluntarios`);
    
    const res = await fetch(`${API_BASE}/voluntarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voluntario)
    });

    console.log('Status da resposta:', res.status);
    const data = await res.json();
    console.log('Resposta do servidor:', data);

    if (data.success) {
      alert('Cadastro realizado com sucesso! Faça login para continuar.');
      window.location.href = 'login.html';
    } else {
      alert('Erro ao cadastrar: ' + (data.message || 'Erro desconhecido'));
    }
  } catch (err) {
    console.error('Erro ao cadastrar:', err);
    alert('Erro na comunicação com o servidor. Verifique se o backend está rodando.');
  }
}
