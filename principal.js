const { faker } = require('@faker-js/faker');

// const Chart = require('chart.js');
// const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const { performance } = require('perf_hooks');

const connection = require('./db');
const {createTables} = require('./models');

connection.connect((err) => {
    if (err) {
        console.error('❌ Error al conectar a MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL.');
        // createTables();
}
);
// el tiempo que toma crear 100,000 libros en la base de datos usando datos aleatorios en csv


const generateUniqueNumbers = (min, max, count) => {
    const uniqueNumbers = new Set();
    while (uniqueNumbers.size < count) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        uniqueNumbers.add(num);
    }
    return Array.from(uniqueNumbers);
};

const generateAuthors = (numAuthors) => {
    const authors = [];
    const uniqueLicenses = generateUniqueNumbers(100000, 999999, numAuthors);

    for (let i = 0; i < numAuthors; i++) {
        authors.push({
            id : i + 1,
            license: uniqueLicenses[i],
            name: faker.person.firstName(),
            lastname: faker.person.lastName(),
            secondLastName: faker.person.lastName(),
            year: faker.number.int({ min: 1950, max: 2023 })
        });
    }
    return authors;
};

// Generar libros
const generateBooks = (numBooks, authors) => {
    const books = [];
    const uniqueISBNS = generateUniqueNumbers(1000000000000, 9999999999999, numBooks);

    for (let i = 0; i < numBooks; i++) {
        books.push([
            i + 1,
            uniqueISBNS[i],
            faker.lorem.words(3),  // Título
            authors[faker.number.int({ min: 1, max: authors.length - 1 })].license,  // Asignamos un autor aleatorio
            faker.lorem.words(2),  // Editorial
            faker.number.int({ min: 50, max: 1000 }),  // Páginas
            faker.number.int({ min: 1990, max: 2023 }),  // Año
            faker.lorem.word(),  // Género
            faker.lorem.word(),  // Idioma
            faker.lorem.word(),  // Formato
            faker.lorem.text(),  // Sinopsis
            faker.lorem.text()   // Contenido
        ]);
    }
    return books;
};

// Crear archivos CSV
const createCSVFile = (data, filePath) => {
    const csv = data.map(row => row.join(',')).join('\n');
    fs.writeFileSync(filePath, csv);
};

// Cargar datos a MySQL
const loadDataToMySQL = (filePath, tableName) => {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(filePath);

        // const deleteQuery = `DELETE FROM ${tableName};`;
        // connection.query(deleteQuery, (deleteErr) => {
        //     if (deleteErr) {
        //         console.error(`❌ Error al borrar registros de la tabla "${tableName}":`, deleteErr);
        //         return reject(deleteErr);
        //     }
        //     console.log(`✅ Registros eliminados de la tabla "${tableName}".`);

        const query = `
            LOAD DATA INFILE '${filePath.replace(/\\/g, '\\\\')}'
            INTO TABLE ${tableName}
            FIELDS TERMINATED BY ',' 
            LINES TERMINATED BY '\\n';`;
        connection.query(query, { 
            streamFactory: () => readStream
         },(err, result) => {
            console.log(`✅ Datos cargados a la tabla "${tableName}".`);
            if (err) reject(err);
            resolve(result);
        });
    });

};
connection.connect((err) => {
    if (err) {
        console.error('❌ Error al conectar a MySQL:', err);
        return;
    }
   
    // Crear las tablas si no existen
    createTables();

    // Generar 15,000 autores y 100,000 libros
    const authors = generateAuthors(15000);
    const books = generateBooks(100000, authors);

    // Crear archivos CSV para autores y libros
    const authorsFilePath = 'C:\\tmp\\autores.csv';
    const booksFilePath = 'C:\\tmp\\libros.csv';

    const authorsCSV = authors.map(author => [
        author.id,
        author.license,
        author.name,
        author.lastname,
        author.secondLastName,
        author.year
    ]);

    const booksCSV = books;
    
    // Escribir los archivos CSV
    createCSVFile(authorsCSV, authorsFilePath);
    createCSVFile(booksCSV, booksFilePath);

    // Medir tiempo de carga de datos
    const startTime = performance.now();

    loadDataToMySQL(authorsFilePath, 'autor')
        .then(() => loadDataToMySQL(booksFilePath, 'libro'))
        .then(() => {
            const endTime = performance.now();
            console.log(`✅ Inserción de datos completada en ${((endTime - startTime) / 1000).toFixed(2)} segundos.`);
            connection.end();
        })
        .catch((err) => {
            console.error('❌ Error al cargar los datos a MySQL:', err);
            connection.end();
        });
});