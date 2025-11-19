const express = require('express');
const cors = require('cors');
const connection = require('./db_config');

const http = require('http');
const { Server } = require('socket.io');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});



// Mapeamento de sockets por id de usuário/comunidade
const socketUsers = {};

// Rota para buscar histórico de mensagens entre dois usuários
app.get('/mensagens_chat', (req, res) => {
    const { remetente_tipo, remetente_id, destinatario_tipo, destinatario_id } = req.query;
    if (!remetente_tipo || !remetente_id || !destinatario_tipo || !destinatario_id) {
        return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios ausentes.' });
    }
    const query = `
        SELECT * FROM mensagens_chat
        WHERE
          ((remetente_tipo = ? AND remetente_id = ? AND destinatario_tipo = ? AND destinatario_id = ?)
           OR
           (remetente_tipo = ? AND remetente_id = ? AND destinatario_tipo = ? AND destinatario_id = ?))
        ORDER BY data_envio ASC
    `;
    connection.query(query, [
        remetente_tipo, remetente_id, destinatario_tipo, destinatario_id,
        destinatario_tipo, destinatario_id, remetente_tipo, remetente_id
    ], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar mensagens', data: err });
        res.json({ success: true, data: results });
    });
});

io.on('connection', (socket) => {
    console.log('Novo usuário conectado:', socket.id);

    // O cliente deve enviar seu id e tipo ao conectar
    socket.on('register', ({ id, tipo, nome }) => {
        if (id && tipo) {
            socketUsers[`${tipo}-${id}`] = { socketId: socket.id, nome };
            socket.data.userKey = `${tipo}-${id}`;
            socket.data.nome = nome;
            console.log(`Registrado: ${tipo}-${id} (${nome})`);
        }
    });


    // Mensagem privada
    socket.on('private message', async ({ destinatario, msg }) => {
        const remetenteKey = socket.data.userKey || 'desconhecido';
        const remetenteNome = socket.data.nome || 'Desconhecido';
        // Parse destinatario
        const [destTipo, destId] = destinatario.split('-');
        const [remTipo, remId] = remetenteKey.split('-');
        // Salvar no banco
        if (remTipo && remId && destTipo && destId && msg) {
            connection.query(
                `INSERT INTO mensagens_chat (remetente_tipo, remetente_id, destinatario_tipo, destinatario_id, mensagem) VALUES (?, ?, ?, ?, ?)`,
                [remTipo, remId, destTipo, destId, msg],
                (err) => {
                    if (err) console.error('Erro ao salvar mensagem:', err);
                }
            );
        }
        // Enviar para destinatário se online
        if (socketUsers[destinatario]) {
            io.to(socketUsers[destinatario].socketId).emit('private message', { remetente: remetenteNome, msg });
        }
        // Também exibe para o próprio remetente
        socket.emit('private message', { remetente: 'Você', msg });
    });

    socket.on('disconnect', () => {
        // Remove do mapeamento
        if (socket.data.userKey) {
            delete socketUsers[socket.data.userKey];
        }
        console.log('Usuário desconectado:', socket.id);
    });
});

// Criar tabelas se não existirem
connection.query(`
  CREATE TABLE IF NOT EXISTS relatos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_autor INT NOT NULL,
    tipo_autor ENUM('voluntarios','comunidades') NOT NULL,
    texto TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`, (err) => {
  if (err) {
    console.error('Erro ao criar tabela relatos:', err);
  } else {
    console.log('✓ Tabela relatos verificada/criada');
  }
});

connection.query(`
  CREATE TABLE IF NOT EXISTS candidaturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voluntario_id INT NOT NULL,
    comunidade_id INT NOT NULL,
    status ENUM('pendente','aceita','recusada') DEFAULT 'pendente',
    data_candidatura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voluntario_id) REFERENCES voluntarios(id) ON DELETE CASCADE,
    FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE
  );
`, (err) => {
  if (err) {
    console.error('Erro ao criar tabela candidaturas:', err);
  } else {
    console.log('✓ Tabela candidaturas verificada/criada');
  }
});

connection.query(`
  CREATE TABLE IF NOT EXISTS convites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_comunidade INT NOT NULL,
    id_voluntario INT NOT NULL,
    status ENUM('pendente','aceito','recusado') DEFAULT 'pendente',
    mensagem TEXT,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_comunidade) REFERENCES comunidades(id) ON DELETE CASCADE,
    FOREIGN KEY (id_voluntario) REFERENCES voluntarios(id) ON DELETE CASCADE
  );
`, (err) => {
  if (err) {
    console.error('Erro ao criar tabela convites:', err);
  } else {
    console.log('✓ Tabela convites verificada/criada');
  }
});

connection.query(`
  CREATE TABLE IF NOT EXISTS participacoes_oficinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_oficina INT NOT NULL,
    id_voluntario INT NOT NULL,
    confirmado BOOLEAN DEFAULT TRUE,
    data_confirmacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_oficina) REFERENCES oficinas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_voluntario) REFERENCES voluntarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participacao (id_oficina, id_voluntario)
  );
`, (err) => {
  if (err) {
    console.error('Erro ao criar tabela participacoes_oficinas:', err);
  } else {
    console.log('✓ Tabela participacoes_oficinas verificada/criada');
  }
});

// ROTAS VOLUNTARIOS

app.post('/voluntarios', (req, res) => {
    const {
        nome, data_nascimento, telefone, email, cidade,
        possui_formacao, formacao, area_atuacao,
        descricao, foto, senha
    } = req.body;

    const query = `
    INSERT INTO voluntarios
    (nome, data_nascimento, telefone, email, cidade, possui_formacao, formacao, area_atuacao,
     descricao, foto, senha)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

    const params = [nome, data_nascimento, telefone, email, cidade,
        possui_formacao, formacao, area_atuacao,
        descricao, foto, senha];

    connection.query(query, params, (err, results) => {
        if (err) return res.status(400).json({ success: false, message: 'Erro ao cadastrar', data: err });
        res.status(201).json({ success: true, message: 'Voluntário cadastrado', data: results });
    });
});


app.get('/voluntarios', (req, res) => {
    const { id, area } = req.query;

    if (id) {
        const query = `SELECT * FROM voluntarios WHERE id = ?`;
        return connection.query(query, [id], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: "Erro", data: err });
            return res.status(200).json({ success: true, data: results });
        });
    }

    // Buscar por área
    if (area) {
        const query = `SELECT * FROM voluntarios WHERE area_atuacao LIKE ?`;
        return connection.query(query, [`%${area}%`], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: "Erro", data: err });
            return res.status(200).json({ success: true, data: results });
        });
    }

    // Buscar todos
    const query = `SELECT * FROM voluntarios`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Erro", data: err });
        return res.status(200).json({ success: true, data: results });
    });
});

app.get('/voluntarios/:id', (req, res) => {
  const id = req.params.id;

  const query = 'SELECT * FROM voluntarios WHERE id = ?';
  connection.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro no servidor', data: err });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'Voluntário não encontrado' });

    res.json({ success: true, data: results[0] });
  });
});


app.get('/voluntarios/listar', (request, response) => {
    let query = "SELECT * FROM voluntarios";
    connection.query(query, (err, results) => {
        if (err) {
            return response.status(500).json({
                success: false,
                message: "Erro ao listar voluntários",
                data: err
            });
        }

        return response.status(200).json({
            success: true,
            message: "Sucesso",
            data: results
        });
    });
});

app.put('/voluntarios/:id', (req, res) => {
    const {
        nome, data_nascimento, telefone, email, cidade,
        possui_formacao, formacao, area_atuacao,
        descricao, senha
    } = req.body;

    const query = `
    UPDATE voluntarios SET
    nome = ?, data_nascimento = ?, telefone = ?, email = ?, cidade = ?,
    possui_formacao = ?, formacao = ?, area_atuacao = ?,
    descricao = ?, senha = ?
    WHERE id = ?;
  `;

    const params = [nome, data_nascimento, telefone, email, cidade,
        possui_formacao, formacao, area_atuacao,
        descricao, senha, req.params.id];

    connection.query(query, params, (err, results) => {
        if (err) return res.status(400).json({ success: false, message: 'Erro ao editar', data: err });
        res.status(200).json({ success: true, message: 'Voluntário atualizado', data: results });
    });
});


app.delete('/voluntarios/deletar/:id', (request, response) => {
    let query = "DELETE FROM voluntarios WHERE id = ?";
    connection.query(query, [request.params.id], (err, results) => {
        if (err) {
            return response.status(500).json({
                success: false,
                message: "Erro ao deletar voluntário",
                error: err
            });
        } else if (results.affectedRows > 0) {
            return response.status(200).json({
                success: true,
                message: "Voluntário deletado com sucesso",
                data: results
            });
        } else {
            return response.status(404).json({
                success: false,
                message: "Voluntário não encontrado"
            });
        }
    });
});


// ROTAS COMUNIDADE

app.post('/comunidades', (request, response) => {

    let params = [
        request.body.nome_comunidade,
        request.body.nome_responsavel,
        request.body.email,
        request.body.telefone,
        request.body.endereco,
        request.body.num_criancas_jovens,
        request.body.faixa_etaria_aprox,
        request.body.possui_estrutura,
        request.body.descricao,
        request.body.senha
    ];

    let query = `
        INSERT INTO comunidades
        (nome_comunidade, nome_responsavel, email, telefone, endereco, num_criancas_jovens, faixa_etaria_aprox, possui_estrutura, descricao, senha)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro MySQL POST /comunidades:', err);
            return response.status(400).json({
                success: false,
                message: "Erro ao cadastrar comunidade",
                data: err
            });
        }
        return response.status(201).json({
            success: true,
            message: "Comunidade cadastrada com sucesso",
            data: results
        });
    });
});


app.get('/comunidades', (request, response) => {
    let query = "SELECT * FROM comunidades";

    connection.query(query, (err, results) => {
        if (err) {
            return response.status(500).json({
                success: false,
                message: "Erro ao listar comunidades",
                data: err
            });
        }

        return response.status(200).json({
            success: true,
            message: "Sucesso",
            data: results
        });
    });
});

app.get('/comunidades/:id', (request, response) => {
    const id = request.params.id;

    let query = "SELECT * FROM comunidades WHERE id = ?";

    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro MySQL GET /comunidades/:id:', err);
            return response.status(500).json({
                success: false,
                message: "Erro ao buscar comunidade",
                data: err
            });
        }

        if (results.length === 0) {
            return response.status(404).json({
                success: false,
                message: "Comunidade não encontrada"
            });
        }

        return response.status(200).json({
            success: true,
            message: "Comunidade encontrada",
            data: results[0]
        });
    });
});


app.put('/comunidades/:id', (request, response) => {

    const possuiEstrutura = request.body.possui_estrutura == "1" ? 1 : 0;
    const numJovens = request.body.num_criancas_jovens ? parseInt(request.body.num_criancas_jovens) : null;

    let params = [
        request.body.nome_comunidade,
        request.body.nome_responsavel,
        request.body.email,
        request.body.telefone,
        request.body.endereco,
        numJovens,
        request.body.faixa_etaria_aprox,
        possuiEstrutura,
        request.body.descricao,
        request.body.senha,
        request.params.id
    ];

    let query = `
        UPDATE comunidades
        SET 
            nome_comunidade = ?, 
            nome_responsavel = ?, 
            email = ?,
            telefone = ?, 
            endereco = ?, 
            num_criancas_jovens = ?, 
            faixa_etaria_aprox = ?, 
            possui_estrutura = ?, 
            descricao = ?, 
            senha = ?
        WHERE id = ?;
    `;

    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro MySQL PUT /comunidades:', err);
            return response.status(400).json({
                success: false,
                message: "Erro ao editar comunidade",
                data: err
            });
        }
        return response.status(200).json({
            success: true,
            message: "Comunidade atualizada com sucesso",
            data: results
        });
    });
});


app.delete('/comunidades/:id', (request, response) => {
    let query = "DELETE FROM comunidades WHERE id = ?";

    connection.query(query, [request.params.id], (err, results) => {
        if (err) {
            return response.status(500).json({
                success: false,
                message: "Erro ao deletar comunidade",
                error: err
            });
        } else if (results.affectedRows > 0) {
            return response.status(200).json({
                success: true,
                message: "Comunidade deletada com sucesso",
                data: results
            });
        } else {
            return response.status(404).json({
                success: false,
                message: "Comunidade não encontrada"
            });
        }
    });
});



// ROTA DE LOGIN

app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    const buscarUsuario = (tabela, nomeCampo) => {
        return new Promise((resolve, reject) => {
            let query;
            if (tabela === 'voluntarios') {
                query = `SELECT *, ${nomeCampo} as nome FROM ${tabela} WHERE email = ? AND senha = ?`;
            } else {
                // Para comunidades, retornar tanto nome_comunidade quanto nome_responsavel
                query = `SELECT *, nome_comunidade as nome, nome_responsavel FROM ${tabela} WHERE email = ? AND senha = ?`;
            }
            connection.query(query, [email, senha], (err, results) => {
                if (err) return reject(err);
                if (results.length > 0) {
                    return resolve({
                        ...results[0],
                        tipo: tabela === 'voluntarios' ? 'voluntario' : 'comunidade'
                    });
                }
                resolve(null);
            });
        });
    };

    buscarUsuario('voluntarios', 'nome')
        .then(usuario => {
            if (usuario) {
                res.status(200).json({
                    success: true,
                    message: 'Login de voluntário realizado com sucesso!',
                    usuario
                });
                return null;
            }
            return buscarUsuario('comunidades', 'nome_comunidade');
        })
        .then(usuario => {
            if (usuario === null) return;
            if (usuario) {
                res.status(200).json({
                    success: true,
                    message: 'Login de comunidade realizado com sucesso!',
                    usuario
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: 'E-mail ou senha incorretos.'
                });
            }
        })
        .catch(err => {
            res.status(500).json({
                success: false,
                message: 'Erro no servidor.',
                error: err
            });
        });
});

// ROTAS OFICINAS

app.post('/oficinas', (req, res) => {
    const { id_comunidade, titulo, data_oficina, horario, local } = req.body;

    if (!id_comunidade || !titulo || !data_oficina || !horario || !local) {
        return res.status(400).json({
            success: false,
            message: "Preencha todos os campos obrigatórios."
        });
    }

    const query = `
        INSERT INTO oficinas (id_comunidade, titulo, data_oficina, horario, local)
        VALUES (?, ?, ?, ?, ?)
    `;

    connection.query(query,
        [id_comunidade, titulo, data_oficina, horario, local],
        (err, results) => {
            if (err) {
                console.error("Erro ao criar oficina:", err);
                return res.status(400).json({ success: false, message: "Erro ao criar oficina", data: err });
            }
            res.status(201).json({ success: true, message: "Oficina criada!", data: results });
        }
    );
});

app.get('/oficinas/comunidade/:id', (req, res) => {
    const query = `
        SELECT o.*, 
               COUNT(p.id) as total_confirmados
        FROM oficinas o
        LEFT JOIN participacoes_oficinas p ON p.id_oficina = o.id
        WHERE o.id_comunidade = ? AND o.status = 'ativa'
        GROUP BY o.id
        ORDER BY o.data_oficina ASC
    `;

    connection.query(query, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Erro ao listar oficinas", data: err });
        }

        res.status(200).json({ success: true, data: results });
    });
});

app.get('/oficinas/:id', (req, res) => {
    const query = `SELECT * FROM oficinas WHERE id = ?`;

    connection.query(query, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Erro ao buscar oficina", data: err });
        }

        res.status(200).json({ success: true, data: results[0] });
    });
});

// Buscar oficinas das comunidades onde o voluntário se candidatou
app.get('/oficinas/voluntario/:voluntarioId', (req, res) => {
    const { voluntarioId } = req.params;

    const query = `
        SELECT o.*, c.nome_comunidade,
               CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END as confirmado
        FROM oficinas o
        INNER JOIN comunidades c ON o.id_comunidade = c.id
        INNER JOIN candidaturas ca ON ca.comunidade_id = c.id
        LEFT JOIN participacoes_oficinas p ON p.id_oficina = o.id AND p.id_voluntario = ?
        WHERE ca.voluntario_id = ?
        AND o.status = 'ativa'
        ORDER BY o.data_oficina ASC
    `;

    connection.query(query, [voluntarioId, voluntarioId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar oficinas do voluntário:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Erro ao buscar oficinas", 
                error: err 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: results 
        });
    });
});

// Confirmar participação em oficina
app.post('/oficinas/:id/confirmar', (req, res) => {
    const { id } = req.params;
    const { id_voluntario } = req.body;

    if (!id_voluntario) {
        return res.status(400).json({ success: false, message: "ID do voluntário é obrigatório" });
    }

    const query = `
        INSERT INTO participacoes_oficinas (id_oficina, id_voluntario)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE confirmado = TRUE
    `;

    connection.query(query, [id, id_voluntario], (err, results) => {
        if (err) {
            console.error("Erro ao confirmar participação:", err);
            return res.status(400).json({ success: false, message: "Erro ao confirmar participação", error: err });
        }
        res.status(200).json({ success: true, message: "Participação confirmada com sucesso!" });
    });
});

// Cancelar participação em oficina
app.delete('/oficinas/:id/cancelar-participacao', (req, res) => {
    const { id } = req.params;
    const { id_voluntario } = req.body;

    if (!id_voluntario) {
        return res.status(400).json({ success: false, message: "ID do voluntário é obrigatório" });
    }

    const query = `
        DELETE FROM participacoes_oficinas
        WHERE id_oficina = ? AND id_voluntario = ?
    `;

    connection.query(query, [id, id_voluntario], (err, results) => {
        if (err) {
            console.error("Erro ao cancelar participação:", err);
            return res.status(400).json({ success: false, message: "Erro ao cancelar participação", error: err });
        }
        res.status(200).json({ success: true, message: "Participação cancelada!" });
    });
});

app.put('/oficinas/:id', (req, res) => {
    const { titulo, data_oficina, horario, local } = req.body;

    const query = `
        UPDATE oficinas
        SET titulo = ?, data_oficina = ?, horario = ?, local = ?
        WHERE id = ?
    `;

    connection.query(query,
        [titulo, data_oficina, horario, local, req.params.id],
        (err, results) => {
            if (err) {
                return res.status(400).json({ success: false, message: "Erro ao editar oficina", data: err });
            }
            res.status(200).json({ success: true, message: "Oficina atualizada!", data: results });
        }
    );
});

app.put('/oficinas/cancelar/:id', (req, res) => {
    const query = `
        UPDATE oficinas
        SET status = 'cancelada'
        WHERE id = ?
    `;

    connection.query(query, [req.params.id], (err, results) => {
        if (err) {
            return res.status(400).json({ success: false, message: "Erro ao cancelar oficina", data: err });
        }

        res.status(200).json({ success: true, message: "Oficina cancelada!" });
    });
});

app.delete('/oficinas/:id', (req, res) => {
    const query = `DELETE FROM oficinas WHERE id = ?`;

    connection.query(query, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Erro ao excluir oficina", data: err });
        }

        res.status(200).json({ success: true, message: "Oficina excluída!", data: results });
    });
});

// ROTAS DE CONVITES

app.post('/convites', (req, res) => {
    const { id_comunidade, id_voluntario } = req.body;

    if (!id_comunidade || !id_voluntario) {
        return res.status(400).json({
            success: false,
            message: "Campos obrigatórios não enviados."
        });
    }

    const queryComunidade = "SELECT nome_comunidade FROM comunidades WHERE id = ?";

    connection.query(queryComunidade, [id_comunidade], (err, result) => {
        if (err) {
            console.error("Erro ao buscar comunidade:", err);
            return res.status(500).json({
                success: false,
                message: "Erro ao buscar comunidade."
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Comunidade não encontrada."
            });
        }

        const nomeComunidade = result[0].nome_comunidade;

        const mensagemPadrao = `A comunidade "${nomeComunidade}" precisa de você!`;

        const queryInsert = `
            INSERT INTO convites (id_comunidade, id_voluntario, status, mensagem)
            VALUES (?, ?, 'pendente', ?)
        `;

        connection.query(
            queryInsert,
            [id_comunidade, id_voluntario, mensagemPadrao],
            (err, results) => {
                if (err) {
                    console.error("Erro ao criar convite:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Erro ao enviar convite."
                    });
                }

                return res.status(201).json({
                    success: true,
                    message: "Convite enviado com sucesso!",
                    convite: {
                        id: results.insertId,
                        id_comunidade,
                        id_voluntario,
                        mensagem: mensagemPadrao
                    }
                });
            }
        );
    });
});

// Buscar convites de um voluntário
app.get('/convites', (req, res) => {
    const { id_voluntario } = req.query;

    if (!id_voluntario) {
        return res.status(400).json({
            success: false,
            message: "ID do voluntário é obrigatório."
        });
    }

    const query = `
        SELECT c.id, c.status, c.mensagem, c.data_envio, c.id_comunidade,
               com.nome_comunidade
        FROM convites c
        JOIN comunidades com ON c.id_comunidade = com.id
        WHERE c.id_voluntario = ?
        ORDER BY c.data_envio DESC
    `;

    connection.query(query, [id_voluntario], (err, results) => {
        if (err) {
            console.error("Erro ao buscar convites:", err);
            return res.status(500).json({
                success: false,
                message: "Erro ao buscar convites."
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});

// Responder convite (aceitar/recusar)
app.put('/convites/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['aceito', 'recusado'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status inválido. Use 'aceito' ou 'recusado'."
        });
    }

    const query = `UPDATE convites SET status = ? WHERE id = ?`;

    connection.query(query, [status, id], (err, results) => {
        if (err) {
            console.error("Erro ao atualizar convite:", err);
            return res.status(500).json({
                success: false,
                message: "Erro ao responder convite."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Convite não encontrado."
            });
        }

        res.json({
            success: true,
            message: `Convite ${status} com sucesso!`
        });
    });
});

// ROTAS RELATOS

app.post("/relatos", (req, res) => {
    const { id_autor, tipo_autor, texto } = req.body;

    if (!texto) {
        return res.status(400).json({
            success: false,
            message: "Texto obrigatório"
        });
    }

    const query = `
        INSERT INTO relatos (id_autor, tipo_autor, texto)
        VALUES (?, ?, ?)
    `;

    connection.query(query, [id_autor, tipo_autor, texto], (err, results) => {
        if (err) {
            console.error("Erro ao salvar relato:", err);
            return res.status(500).json({
                success: false,
                message: "Erro interno ao salvar relato."
            });
        }

        res.status(201).json({
            success: true,
            message: "Relato criado com sucesso!",
            data: results
        });
    });
});

app.get("/relatos", (req, res) => {
    const query = `
        SELECT r.id, r.texto, r.tipo_autor, r.id_autor, r.criado_em,
            COALESCE(v.nome, c.nome_comunidade, 'Autor desconhecido') AS autor_nome
        FROM relatos r
        LEFT JOIN voluntarios v ON r.tipo_autor = 'voluntarios' AND r.id_autor = v.id
        LEFT JOIN comunidades c ON r.tipo_autor = 'comunidades' AND r.id_autor = c.id
        ORDER BY r.criado_em DESC
    `;

    connection.query(query, (err, relatos) => {
        if (err) {
            console.error("Erro ao buscar relatos:", err);
            return res.status(500).json({ success: false, message: "Erro ao buscar relatos." });
        }

        res.json({ success: true, data: relatos });
    });
});

// Editar relato
app.put("/relatos/:id", (req, res) => {
    const { id } = req.params;
    const { texto } = req.body;

    if (!texto || texto.trim() === '') {
        return res.status(400).json({
            success: false,
            message: "Texto obrigatório"
        });
    }

    const query = `UPDATE relatos SET texto = ? WHERE id = ?`;

    connection.query(query, [texto.trim(), id], (err, results) => {
        if (err) {
            console.error("Erro ao atualizar relato:", err);
            return res.status(500).json({
                success: false,
                message: "Erro ao atualizar relato."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Relato não encontrado."
            });
        }

        res.json({
            success: true,
            message: "Relato atualizado com sucesso!"
        });
    });
});

// Excluir relato
app.delete("/relatos/:id", (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM relatos WHERE id = ?`;

    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error("Erro ao excluir relato:", err);
            return res.status(500).json({
                success: false,
                message: "Erro ao excluir relato."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Relato não encontrado."
            });
        }

        res.json({
            success: true,
            message: "Relato excluído com sucesso!"
        });
    });
});

// CANDIDATURAS
app.post("/candidaturas", (req, res) => {
  const { voluntario_id, comunidade_id } = req.body;

  if (!voluntario_id || !comunidade_id) {
    return res.status(400).json({ success: false, message: "Dados incompletos." });
  }

  // Verifica se já existe candidatura
  const queryVerifica = `
    SELECT * FROM candidaturas 
    WHERE voluntario_id = ? AND comunidade_id = ?
  `;
  connection.query(queryVerifica, [voluntario_id, comunidade_id], (err, results) => {
    if (err) {
      console.error("Erro ao verificar candidatura:", err);
      return res.status(500).json({ success: false, message: "Erro interno ao verificar candidatura." });
    }

    if (results.length > 0) {
      return res.status(400).json({ success: false, message: "Você já se candidatou a esta comunidade." });
    }

    // Inserir candidatura
    const queryInsere = `
      INSERT INTO candidaturas (voluntario_id, comunidade_id) VALUES (?, ?)
    `;
    connection.query(queryInsere, [voluntario_id, comunidade_id], (err2, results2) => {
      if (err2) {
        console.error("Erro ao registrar candidatura:", err2);
        return res.status(500).json({ success: false, message: "Erro interno ao registrar candidatura." });
      }

      return res.json({ success: true, message: "Candidatura registrada com sucesso." });
    });
  });
});


app.get("/candidaturas", (req, res) => {
  const { voluntario_id } = req.query;
  if (!voluntario_id) {
    return res.status(400).json({ success: false, message: "ID do voluntário é obrigatório." });
  }

  const query = `
    SELECT c.id, c.status, c.data_candidatura, c.comunidade_id, com.nome_comunidade
    FROM candidaturas c
    JOIN comunidades com ON c.comunidade_id = com.id
    WHERE c.voluntario_id = ?
    ORDER BY c.data_candidatura DESC
  `;
  
  connection.query(query, [voluntario_id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar candidaturas:", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar candidaturas." });
    }

    res.json({ success: true, data: results });
  });
});


server.listen(port, () => {
    console.log(`Servidor rodando na porta ${port} (REST + Socket.io)`);
});