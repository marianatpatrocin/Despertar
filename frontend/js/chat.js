const API_BASE = 'http://localhost:3000';
let other = { tipo: 'comunidade', id: 1 }; // aqui define o destinatário da conversa (ex: comunidade ou voluntário)
const usuario = JSON.parse(localStorage.getItem('usuarioLogado')); // must exist

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-send').addEventListener('click', enviarMensagem);
  carregarMensagens();
  setInterval(carregarMensagens, 2000);
});

function carregarMensagens() {
  if (!usuario) return;
  fetch(`${API_BASE}/mensagens?a_tipo=${usuario.tipo}&a_id=${usuario.id}&b_tipo=${other.tipo}&b_id=${other.id}`)
    .then(r => r.json())
    .then(res => {
      const box = document.getElementById('chat-box');
      box.innerHTML = '';
      res.data.forEach(m => {
        const p = document.createElement('div');
        const remetente = (m.remetente_tipo === usuario.tipo && m.remetente_id === usuario.id) ? 'Você' : 'Outro';
        p.textContent = `${remetente} (${new Date(m.enviada_em).toLocaleTimeString()}): ${m.texto}`;
        box.appendChild(p);
      });
      box.scrollTop = box.scrollHeight;
    });
}

function enviarMensagem() {
  const texto = document.getElementById('msg-text').value.trim();
  if (!texto) return;
  const payload = {
    remetente_tipo: usuario.tipo,
    remetente_id: usuario.id,
    destinatario_tipo: other.tipo,
    destinatario_id: other.id,
    texto
  };
  fetch(`${API_BASE}/mensagens`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(res => {
    if (res.success) {
      document.getElementById('msg-text').value = '';
      carregarMensagens();
    } else alert('Erro ao enviar');
  });
}
