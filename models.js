const connection = require('./db');

// DROP INDEX IF EXISTS idx_license ON autor;

// CREATE INDEX idx_license ON autor(license);

const createTablesSQL = `
CREATE TABLE IF NOT EXISTS autor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license VARCHAR(12) NOT NULL, 
    name TINYTEXT NOT NULL,
    lastname TINYTEXT ,
    secondLastName TINYTEXT,
    year SMALLINT NOT NULL
    );
CREATE INDEX idx_license ON autor(license);

CREATE TABLE IF NOT EXISTS libro (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ISBN VARCHAR(16) NOT NULL,
  title VARCHAR(512) NOT NULL,
  autor_license varchar(12),
  editorial TINYTEXT,
  pages SMALLINT,
  year SMALLINT NOT NULL,
  genre TINYTEXT,
  language TINYTEXT NOT NULL,
  format TINYTEXT,
  sinopsis TEXT,
  content TEXT,
  CONSTRAINT fk_autor FOREIGN KEY (autor_license) REFERENCES autor(license) ON DELETE CASCADE ON UPDATE CASCADE
);
`;
const createTables = () => {
connection.query(createTablesSQL, (err) => {
if (err) {
    console.error('❌ Error al crear las tablas:', err);
    return;
}
console.log('✅ Tablas "autor" y "libro" creadas/verificadas.');
createUsers();
}
);


const createUsersSQL = `
        CREATE USER IF NOT EXISTS 'usuarioA'@'localhost' IDENTIFIED BY 'tucontrasena';
        CREATE USER IF NOT EXISTS 'usuarioB'@'localhost' IDENTIFIED BY 'tucontrasena';

        -- Permisos para usuario A
        GRANT INSERT, SELECT ON Biblioteca.libro TO 'usuarioA'@'localhost';
        GRANT SELECT ON Biblioteca.autor TO 'usuarioA'@'localhost';

        -- Permisos para usuario B
        GRANT INSERT, SELECT ON Biblioteca.autor TO 'usuarioB'@'localhost';
        GRANT SELECT ON Biblioteca.libro TO 'usuarioB'@'localhost';

        FLUSH PRIVILEGES;
    `;
    const createUsers = () => {
    connection.query(createUsersSQL, (err) => {
        if (err) {
            console.error('❌ Error al crear los usuarios o asignar permisos:', err);
        } else {
            console.log('✅ Usuarios "usuarioA" y "usuarioB" creados con permisos adecuados.');
        }

        // connection.end();
        console.log('🔌 Conexión cerrada.');
    });
}
};


module.exports = {
    createTables
};