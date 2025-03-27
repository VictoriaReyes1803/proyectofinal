// Hola, soy un comentario
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'tucontrasena',
  insecureAuth: true,
  multipleStatements: true
});

connection.connect((err) => {
    if (err) {
      console.error('Error al conectar a MySQL:', err);
      return;
    }
    console.log('Conectado a MySQL.');

    const sql = `
      CREATE DATABASE IF NOT EXISTS Biblioteca;
      USE Biblioteca;
    `;
  
    connection.query(sql, (err) => {
      if (err) {
        console.error('Error al crear/usar la base de datos:', err);
        return;
      }
      console.log('Base de datos "Biblioteca" verificada/seleccionada.');
    });

});
module.exports = connection;