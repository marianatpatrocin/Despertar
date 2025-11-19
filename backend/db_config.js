const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Aninha2007',
  database: 'despertar'
});
connection.connect(err => {
  if (err) console.error('Erro na conexão MySQL:', err);
  else console.log('MySQL conectado!');
});
module.exports = connection;
