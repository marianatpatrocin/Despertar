const express = require('express');
const cors = require('cors');
const connection = require('./db_config');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

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
        descricao, foto, senha
    } = req.body;

    const query = `
    UPDATE voluntarios SET
    nome = ?, data_nascimento = ?, telefone = ?, email = ?, cidade = ?,
    possui_formacao = ?, formacao = ?, area_atuacao = ?,
    descricao = ?, foto = ?, senha = ?
    WHERE id = ?;
  `;

    const params = [nome, data_nascimento, telefone, email, cidade,
        possui_formacao, formacao, area_atuacao,
        descricao, foto, senha, req.params.id];

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
            const query = `SELECT *, ${nomeCampo} as nome FROM ${tabela} WHERE email = ? AND senha = ?`;
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
                return res.status(200).json({
                    success: true,
                    message: 'Login de voluntário realizado com sucesso!',
                    usuario
                });
            }
            return buscarUsuario('comunidades', 'nome_comunidade');
        })
        .then(usuario => {
            if (usuario) {
                return res.status(200).json({
                    success: true,
                    message: 'Login de comunidade realizado com sucesso!',
                    usuario
                });
            }
            res.status(401).json({
                success: false,
                message: 'E-mail ou senha incorretos.'
            });
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
        SELECT * FROM oficinas
        WHERE id_comunidade = ? AND status = 'ativa'
        ORDER BY data_oficina ASC
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


app.get("/candidaturas", async (req, res) => {
  const { voluntario_id } = req.query;
  if (!voluntario_id) {
    return res.status(400).json({ success: false, message: "ID do voluntário é obrigatório." });
  }

  try {
    const [candidaturas] = await db.query(`
      SELECT c.id, c.status, c.comunidade_id, com.nome_comunidade
      FROM candidaturas c
      JOIN comunidades com ON c.comunidade_id = com.id
      WHERE c.voluntario_id = ?
    `, [voluntario_id]);

    res.json({ success: true, data: candidaturas });
  } catch (err) {
    console.error("Erro ao buscar candidaturas:", err);
    res.status(500).json({ success: false, message: "Erro ao buscar candidaturas." });
  }
});


app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});