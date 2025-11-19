// frontend/js/chat-socket.js

const socket = io('http://localhost:3000');
const form = document.getElementById('form-chat');
const input = document.getElementById('input-chat');
const messages = document.getElementById('mensagens-chat');
const destinatarioSelect = document.getElementById('destinatario-chat');


// Carregar todos os voluntários e comunidades para o select
async function carregarDestinatarios() {
  const [vols, coms] = await Promise.all([
    fetch('http://localhost:3000/voluntarios').then(r => r.json()),
    fetch('http://localhost:3000/comunidades').then(r => r.json())
  ]);

    destinatarioSelect.innerHTML = '';
    // Pega o usuário logado para não mostrar ele mesmo
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (vols.success && vols.data.length) {
      vols.data.forEach(v => {
        if (!usuarioLogado || usuarioLogado.tipo !== 'voluntario' || usuarioLogado.id !== v.id) {
          const opt = document.createElement('option');
          opt.value = `voluntario-${v.id}`;
          opt.textContent = `Voluntário: ${v.nome}`;
          destinatarioSelect.appendChild(opt);
        }
      });
    }
    if (coms.success && coms.data.length) {
      coms.data.forEach(c => {
        if (!usuarioLogado || usuarioLogado.tipo !== 'comunidade' || usuarioLogado.id !== c.id) {
          const opt = document.createElement('option');
          opt.value = `comunidade-${c.id}`;
          opt.textContent = `Comunidade: ${c.nome_comunidade}`;
          destinatarioSelect.appendChild(opt);
        }
      });
    }
    // Registrar o socket do usuário logado
    if (usuarioLogado) {
      socket.emit('register', {
        id: usuarioLogado.id,
        tipo: usuarioLogado.tipo,
        nome: usuarioLogado.nome || usuarioLogado.nome_comunidade || 'Usuário'
      });
    }
    // Carregar histórico inicial
    if (destinatarioSelect.value) {
      carregarHistorico(destinatarioSelect.value);
    }
  }

  carregarDestinatarios();

  destinatarioSelect.addEventListener('change', function() {
    if (this.value) carregarHistorico(this.value);
  });

  function carregarHistorico(destinatarioKey) {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLogado || !destinatarioKey) return;
    const [destTipo, destId] = destinatarioKey.split('-');
    const remTipo = usuarioLogado.tipo;
    const remId = usuarioLogado.id;
    fetch(`http://localhost:3000/mensagens_chat?remetente_tipo=${remTipo}&remetente_id=${remId}&destinatario_tipo=${destTipo}&destinatario_id=${destId}`)
      .then(r => r.json())
      .then(json => {
        messages.innerHTML = '';
        if (json.success && json.data.length) {
          json.data.forEach(m => {
            const item = document.createElement('li');
            let nomeRemetente = 'Você';
            if (!(m.remetente_tipo === remTipo && m.remetente_id == remId)) {
              nomeRemetente = destinatarioSelect.querySelector(`option[value="${destinatarioKey}"]`).textContent;
            }
            item.textContent = `[${nomeRemetente}] ${m.mensagem}`;
            messages.appendChild(item);
          });
          messages.scrollTop = messages.scrollHeight;
        }
      });
  }

form.addEventListener('submit', function(e) {
  e.preventDefault();
  const msg = input.value;
  const destinatario = destinatarioSelect.value;
  if (msg && destinatario) {
    socket.emit('private message', { destinatario, msg });
    input.value = '';
  }
});

socket.on('private message', function({ remetente, msg }) {
  const item = document.createElement('li');
  item.textContent = `[${remetente}] ${msg}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});
