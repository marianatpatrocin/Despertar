const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Novo usuário conectado:', socket.id);

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg); // Broadcast para todos
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Servidor de chat rodando na porta ${PORT}`);
});
