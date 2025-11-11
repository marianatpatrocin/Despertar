const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'despertar',
});
 
connection.connect((err) =>{
    if(err){
        throw err;
    } else{
        console.log('Mysql conectado');
    }
});
 
module.exports = connection;