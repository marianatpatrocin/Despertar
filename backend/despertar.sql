-- Script completo de criação do banco de dados Despertar
-- Usa CREATE IF NOT EXISTS para evitar erros se já existir

CREATE DATABASE IF NOT EXISTS despertar;
USE despertar;

-- Tabela de voluntários
CREATE TABLE IF NOT EXISTS voluntarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  data_nascimento DATE,
  telefone VARCHAR(20),
  email VARCHAR(255) NOT NULL UNIQUE,
  cidade VARCHAR(255),
  possui_formacao BOOLEAN,
  formacao VARCHAR(100),
  area_atuacao VARCHAR(100),
  descricao TEXT,
  foto VARCHAR(255),
  senha VARCHAR(255) NOT NULL,
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de comunidades
CREATE TABLE IF NOT EXISTS comunidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_comunidade VARCHAR(255) NOT NULL,
  nome_responsavel VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  endereco VARCHAR(255),
  num_criancas_jovens INT, 
  faixa_etaria_aprox ENUM('0-5 Anos', '6-12 Anos', '13-18 Anos', 'Mista') NOT NULL, 
  possui_estrutura BOOLEAN,
  descricao TEXT,
  senha VARCHAR(255) NOT NULL,
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de oficinas
CREATE TABLE IF NOT EXISTS oficinas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_comunidade INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  data_oficina DATETIME NOT NULL,
  horario TIME NOT NULL,
  local VARCHAR(255) NOT NULL,
  status ENUM('ativa', 'cancelada') DEFAULT 'ativa',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_comunidade) REFERENCES comunidades(id) ON DELETE CASCADE
);

-- Tabela de convites
CREATE TABLE IF NOT EXISTS convites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_comunidade INT NOT NULL,
  id_voluntario INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  mensagem TEXT,
  data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_comunidade) REFERENCES comunidades(id) ON DELETE CASCADE,
  FOREIGN KEY (id_voluntario) REFERENCES voluntarios(id) ON DELETE CASCADE
);

-- Tabela de participações em oficinas
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

CREATE TABLE IF NOT EXISTS relatos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_autor INT NOT NULL,
  tipo_autor ENUM('voluntarios','comunidades') NOT NULL,
  texto TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de mensagens privadas do chat
CREATE TABLE IF NOT EXISTS mensagens_chat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  remetente_tipo ENUM('voluntario','comunidade') NOT NULL,
  remetente_id INT NOT NULL,
  destinatario_tipo ENUM('voluntario','comunidade') NOT NULL,
  destinatario_id INT NOT NULL,
  mensagem TEXT NOT NULL,
  data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de candidaturas
CREATE TABLE IF NOT EXISTS candidaturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voluntario_id INT NOT NULL,
  comunidade_id INT NOT NULL,
  status ENUM('pendente','aceita','recusada') DEFAULT 'pendente',
  data_candidatura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (voluntario_id) REFERENCES voluntarios(id) ON DELETE CASCADE,
  FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE
);

-- Verificação
SELECT 'Banco de dados Despertar configurado com sucesso!' AS status;
SELECT COUNT(*) AS total_voluntarios FROM voluntarios;
SELECT COUNT(*) AS total_comunidades FROM comunidades;
SELECT COUNT(*) AS total_oficinas FROM oficinas;
SELECT COUNT(*) AS total_convites FROM convites;
SELECT COUNT(*) AS total_relatos FROM relatos;
SELECT COUNT(*) AS total_candidaturas FROM candidaturas;
