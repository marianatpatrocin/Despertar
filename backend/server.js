const express = require('express');
const cors = require('cors')
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const connection = require('./db_config.js');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors())
app.listen(port, () => console.log(`Rodando na porta ${port}`));

// ROTAS VOLUNTARIOS

app.post('/voluntarios', (request, response) => {
    let params = [
            request.body.nome,
            request.body.email,
            request.body.telefone,
            request.body.endereco,
            request.body.descricao,
            request.body.senha
        ]
        
        let query = "INSERT INTO voluntarios(nome, email, telefone, endereco, descricao, senha) VALUES (?, ?, ?, ?, ?, ?);"
        connection.query(query, params, (err, results) => {
            if (err) {
                return response.status(400).json({
                    success: false,
                    message: "Erro ao cadastrar voluntário",
                    data: err
                });
            } else {
                return response.status(201).json({
                    success: true,
                    message: "Voluntário cadastrado com sucesso",
                    data: results
                });
            }
        });
});

app.get('/voluntarios/listar', (request, response) => {
    let query = "SELECT * FROM voluntarios";
    connection.query(query, (err, results) => {
        if (results) {
            response.status(200).json({
                success: true,
                message: "Sucesso",
                data: results
            });
        } else {
            response
                .status(400)
                .json({
                    success: false,
                    message: "Sem sucesso",
                    data: err
                });
        }
    });
});

app.put('/voluntarios/editar/:id', (request, response) => {
    let params = Array (
        request.body.nome,
        request.body.email,
        request.body.telefone,
        request.body.endereco,
        request.body.descricao,
        request.body.senha
    )

    let query = "UPDATE voluntarios SET nome = ?, email = ?, telefone = ?, endereco = ?, descricao = ?, senha = ? WHERE id = ?;";
    connection.query(query, params, (err, results) => {
        if (results) {
            response.status(201).json({
                success: true,
                message: "Sucesso",
                data: results
            });
        } else {
            response
                .status(400)
                .json({
                    success: false,
                    message: "Sem sucesso",
                    data: err
                });
        }
    });
});

app.delete('/voluntarios/deletar/:id', (request, response) => {
    let query = "DELETE FROM voluntarios WHERE id = ?";
    connection.query(query, [request.params.id], (err, results) => {
        if (err) {
            response
                .status(400)
                .json({
                    success: false,
                    message: "Erro ao deletar voluntário",
                    error: err
                });
        } else {
            if (results.affectedRows > 0) {
                response.status(200).json({
                    success: true,
                    message: "Voluntário deletado",
                    data: results
                });
            } else {
                response.status(404).json({
                    success: false,
                    message: "Voluntário não encontrado"
                });
            }
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
            request.body.descricao,
            request.body.senha
        ]
        
        let query = "INSERT INTO comunidades(nome_comunidade, nome_responsavel, email, telefone, endereco, descricao, senha) VALUES (?, ?, ?, ?, ?, ?, ?);"
        connection.query(query, params, (err, results) => {
            if (err) {
                return response.status(400).json({
                    success: false,
                    message: "Erro ao cadastrar comunidade",
                    data: err
                });
            } else {
                return response.status(201).json({
                    success: true,
                    message: "Comunidade cadastrada com sucesso",
                    data: results
                });
            }
        });
});

app.get('/comunidades', (request, response) => {
    let query = "SELECT * FROM comunidades";
    connection.query(query, (err, results) => {
        if (results) {
            response.status(200).json({
                success: true,
                message: "Sucesso",
                data: results
            });
        } else {
            response
                .status(400)
                .json({
                    success: false,
                    message: "Sem sucesso",
                    data: err
                });
        }
    });
});

app.put('/comunidades/:id', (request, response) => {
    let params = Array (
        request.body.nome_comunidade,
        request.body.nome_responsavel,
        request.body.email,
        request.body.telefone,
        request.body.endereco,
        request.body.descricao,
        request.body.senha
    )

    let query = "UPDATE comunidades SET nome_comunidade = ?, nome_responsavel = ?, email = ?, telefone = ?, endereco = ?, descricao = ?, senha = ? WHERE id = ?;";
    connection.query(query, params, (err, results) => {
        if (results) {
            response.status(201).json({
                success: true,
                message: "Sucesso",
                data: results
            });
        } else {
            response
                .status(400)
                .json({
                    success: false,
                    message: "Sem sucesso",
                    data: err
                });
        }
    });
});

app.delete('/comunidades/:id', (request, response) => {
    let query = "DELETE FROM comunidades WHERE id = ?";
    connection.query(query, [request.params.id], (err, results) => {
        if (err) {
            response
                .status(400)
                .json({
                    success: false,
                    message: "Erro ao deletar comunidade",
                    error: err
                });
        } else {
            if (results.affectedRows > 0) {
                response.status(200).json({
                    success: true,
                    message: "Comunidade deletada",
                    data: results
                });
            } else {
                response.status(404).json({
                    success: false,
                    message: "Comunidade não encontrada"
                });
            }
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
                if (err) {
                    return reject(err);
                }
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

    // Tenta buscar primeiro em voluntários, depois em comunidades
    buscarUsuario('voluntarios', 'nome')
        .then(usuario => {
            if (usuario) {
                return res.status(200).json({
                    success: true,
                    message: 'Login de voluntário realizado com sucesso!',
                    usuario: usuario
                });
            }
            return buscarUsuario('comunidades', 'nome_comunidade');
        })
        .then(usuario => {
            if (usuario) {
                return res.status(200).json({
                    success: true,
                    message: 'Login de comunidade realizado com sucesso!',
                    usuario: usuario
                });
            }
            // Se não encontrou em nenhuma das duas tabelas
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