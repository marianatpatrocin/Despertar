# Despertar — Plataforma de Conexão entre Voluntários e Comunidades

O Despertar é uma plataforma web desenvolvida para conectar voluntários a comunidades carentes, facilitando o agendamento de oficinas educativas, atividades culturais e ações sociais.
O projeto utiliza HTML, CSS e JavaScript no frontend, Node.js no backend e MySQL como banco de dados.

---

## Sumário
- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Rodar](#como-rodar)
- [Melhorias Futuras](#melhorias-futuras)
- [Contribuição](#contribuição)
- [Licença](#licença)

---

## Sobre o Projeto
O Despertar foi criado com o propósito de aproximar pessoas dispostas a oferecer tempo e conhecimento de comunidades que necessitam de apoio educacional e social.  
A plataforma permite cadastrar voluntários, comunidades e oficinas, além de editar e listar todos esses dados de forma simples e organizada.

---

## Funcionalidades

### Voluntários
- Cadastro  
- Listagem  
- Edição  
- Exclusão
- Chat 

### Comunidades
- Cadastro  
- Listagem  
- Edição  
- Exclusão
- Chat

### Oficinas
- Cadastro  
- Visualização  
- Agendamento  
- Edição  
- Exclusão  

---

## Tecnologias

### Frontend
- HTML5  
- CSS3  
- JavaScript  

### Backend
- Node.js  
- Express  
- MySQL  
- Body-parser  
- CORS  

### Banco de Dados
- MySQL  
- Script SQL localizado em `/database/despertar.sql`

---
## Como rodar o projeto

### Pré-requisitos
Antes de começar, você precisa ter instalado:
- **Node.js** (versão LTS recomendada)
- **MySQL** (ou MariaDB)
- **Git** (opcional, caso esteja usando controle de versão)

```bash
### 1. Clonar o repositório
git clone https://github.com/marianatpatrocin/Despertar.git
cd Despertar

### 2. Instalar dependências
npm install

###3. Configurar o banco de dados

Crie um banco no MySQL:

CREATE DATABASE Despertar;

### 4. Configure o arquivo .env com suas credenciais:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_DATABASE=Despertar
PORT=3000

### 5. Iniciar o servidor
npm start

### 6. Acessar o sistema
Abra no navegador:
http://localhost:3000
