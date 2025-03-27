const Process = require("./utils/Process");
const FileStream = require("fs");

function random_number(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function random_text(characters_num) {
  let text = "";
  for (let i = 0; i < characters_num; i++) {
    const letra = String.fromCharCode(random_number(65, 89));
    text += letra;
  }
  return text;
}

function generate_autores_data(size) {
  let csv = "";
  for (let i = 0; i < size; i++) {
    const license = random_text(12);
    const name = random_text(random_number(5, 20));
    const lastname = random_text(random_number(5, 20));
    const year = random_number(1950, 2024);

    csv += `${license},${name},${lastname},${year}\n`;
  }
  return csv;
}

function generate_libros_data(size) {
  let csv = "";
  for (let i = 0; i < size; i++) {
    const isbn = random_text(16);
    const title = random_text(random_number(10, 50));
    const autor_license = random_text(12);
    const editorial = random_text(random_number(5, 15));
    const pages = random_number(50, 1000);
    const year = random_number(1950, 2024);
    const genre = random_text(random_number(5, 10));
    const language = random_text(random_number(4, 8));
    const format = random_text(random_number(3, 8));

    csv += `${isbn},${title},${autor_license},${editorial},${pages},${year},${genre},${language},${format}\n`;
  }
  return csv;
}

function generarReporte(metricas) {
  const grafico_mysql = {
    type: "bar",
    labels: `['Generar Autores', 'Insertar Autores', 'Exportar CSV', 'Respaldar MongoDB', 'Restaurar MySQL', 'Dump MySQL', 'Importar Dump', 'Libros en MongoDB']`,
    data: `[${metricas.mysql.generarAutores}, ${metricas.mysql.insertarAutores}, ${metricas.mysql.exportarCSV}, ${metricas.mysql.respaldarMongo}, ${metricas.mysql.restaurarMySQL}, ${metricas.mysql.dumpMySQL}, ${metricas.mysql.importarDump}, ${metricas.mysql.librosEnMongo}]`,
    title: "Tiempos de ejecución MySQL (ms)",
  };

  const reporte = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <title>Métricas de Rendimiento</title>
    </head>
    <body">
        <h1>Resultados de Rendimiento</h1>
        <div style="width: 80%; margin: auto;">
            <canvas id="grafico-mysql"></canvas>
        </div>

        <script>
            const mysql = document.getElementById('grafico-mysql');
            
            new Chart(mysql, {
                type: '${grafico_mysql.type}',
                data: {
                    labels: ${grafico_mysql.labels},
                    datasets: [{
                        label: '${grafico_mysql.title}',
                        data: ${grafico_mysql.data},
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 99, 132, 0.6)', 
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(255, 205, 86, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                            'rgba(255, 159, 64, 0.6)',
                            'rgba(201, 203, 207, 0.6)',
                            'rgba(94, 232, 185, 0.6)'
                        ],
                        borderColor: [
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 99, 132, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 205, 86, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)',
                            'rgba(201, 203, 207, 1)',
                            'rgba(94, 232, 185, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        </script>
    </body>
    </html>`;

  FileStream.writeFileSync("reporte.html", reporte);
  console.log("Reporte generado con éxito en reporte.html");
  console.log("Métricas finales:", metricas.mysql);
}

async function ejecutarPractica() {
  const metricas = {
    mysql: {
      generarAutores: 0,
      insertarAutores: 0,
      exportarCSV: 0,
      respaldarMongo: 0,
      restaurarMySQL: 0,
      dumpMySQL: 0,
      importarDump: 0,
      librosEnMongo: 0,
      usuarioAFallido: 0,
      usuarioBFallido: 0,
    },
  };

  console.log("0) Creando base de datos MySQL");
  const crearBaseDatos = new Process("mysql", { shell: true });
  crearBaseDatos.ProcessArguments.push("-uroot");
  crearBaseDatos.ProcessArguments.push("--port=6033");
  crearBaseDatos.ProcessArguments.push("--password=utt");
  crearBaseDatos.Execute();
  crearBaseDatos.Write(`
        DROP DATABASE IF EXISTS Biblioteca;
        CREATE DATABASE IF NOT EXISTS Biblioteca;
        USE Biblioteca;

        CREATE TABLE IF NOT EXISTS autor (
            id INT AUTO_INCREMENT PRIMARY KEY,
            license VARCHAR(12) NOT NULL, 
            name TINYTEXT NOT NULL,
            lastname TINYTEXT,
            secondLastName TINYTEXT,
            year SMALLINT NOT NULL
        );

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

        CREATE TABLE IF NOT EXISTS old_books (
            ISBN VARCHAR(16), 
            year SMALLINT, 
            pages SMALLINT
        );
    `);
  crearBaseDatos.End();
  await crearBaseDatos.Finish();

  console.log("0) Creando base de datos MongoDB");
  const dropMongo = new Process("mongosh");
  dropMongo.Execute();
  dropMongo.Write("use Biblioteca;");
  dropMongo.Write("\n");
  dropMongo.Write("db.dropDatabase();");
  dropMongo.Write("\n");
  dropMongo.Write('db.createCollection("Autores");');
  dropMongo.Write("\n");
  dropMongo.Write('db.createCollection("Libros");');
  dropMongo.End();
  await dropMongo.Finish();
  console.log(
    `MongoDB database created in ${dropMongo.EndTime - dropMongo.StartTime} ms`
  );

  console.log("1) Generando 150,000 Autores");
  const startGeneracionAutores = Date.now();
  const autoresData = generate_autores_data(150000);
  const archivoAutores = "C:/tmp/autores_data.csv";
  FileStream.writeFileSync(archivoAutores, autoresData);
  const endGeneracionAutores = Date.now();
  metricas.mysql.generarAutores = endGeneracionAutores - startGeneracionAutores;
  console.log(
    `[MySQL] Autores generados en ${metricas.mysql.generarAutores} ms`
  );

  console.log("2) Insertando Autores en MySQL");
  const insertarAutores = new Process("mysql", { shell: true });
  insertarAutores.ProcessArguments.push("-uroot");
  insertarAutores.ProcessArguments.push("--port=6033");
  insertarAutores.ProcessArguments.push("--password=utt");
  insertarAutores.Execute();
  insertarAutores.Write("USE Biblioteca;");
  insertarAutores.Write(`LOAD DATA INFILE '${archivoAutores}' INTO TABLE autor 
                    FIELDS TERMINATED BY ',' 
                    LINES TERMINATED BY '\n'
                    (license, name, lastname, year);`);
  insertarAutores.End();
  await insertarAutores.Finish();
  metricas.mysql.insertarAutores =
    insertarAutores.EndTime - insertarAutores.StartTime;
  console.log(
    `[MySQL] Autores insertados en ${metricas.mysql.insertarAutores} ms`
  );

  console.log("3) Exportando tablas a CSV");
  const exportarCSV = new Process("mysql", { shell: true });
  exportarCSV.ProcessArguments.push("-uroot");
  exportarCSV.ProcessArguments.push("--port=6033");
  exportarCSV.ProcessArguments.push("--password=utt");
  exportarCSV.Execute();
  exportarCSV.Write("USE Biblioteca;");
  exportarCSV.Write(
    "SELECT * FROM autor INTO OUTFILE 'C:/tmp/autores_export.csv' FIELDS TERMINATED BY ',' LINES TERMINATED BY '\\n';"
  );
  exportarCSV.Write(
    "SELECT * FROM libro INTO OUTFILE 'C:/tmp/libros_export.csv' FIELDS TERMINATED BY ',' LINES TERMINATED BY '\\n';"
  );
  exportarCSV.End();
  await exportarCSV.Finish();
  metricas.mysql.exportarCSV = exportarCSV.EndTime - exportarCSV.StartTime;
  console.log(`[MySQL] Tablas exportadas en ${metricas.mysql.exportarCSV} ms`);

  console.log("4) Respaldando tablas a MongoDB");
  const mongoimport_from_mysql_autores = new Process("mongoimport");
  mongoimport_from_mysql_autores.ProcessArguments.push("--db=Biblioteca");
  mongoimport_from_mysql_autores.ProcessArguments.push("--collection=Autores");
  mongoimport_from_mysql_autores.ProcessArguments.push("--type=csv");
  mongoimport_from_mysql_autores.ProcessArguments.push("--headerline");
  mongoimport_from_mysql_autores.ProcessArguments.push(
    "--file=C:/tmp/autores_export.csv"
  );

  const mongoimport_from_mysql_libros = new Process("mongoimport");
  mongoimport_from_mysql_libros.ProcessArguments.push("--db=Biblioteca");
  mongoimport_from_mysql_libros.ProcessArguments.push("--collection=Libros");
  mongoimport_from_mysql_libros.ProcessArguments.push("--type=csv");
  mongoimport_from_mysql_libros.ProcessArguments.push("--headerline");
  mongoimport_from_mysql_libros.ProcessArguments.push(
    "--file=C:/tmp/libros_export.csv"
  );

  const mongoexport_autores = new Process("mongoexport");
  mongoexport_autores.ProcessArguments.push("--collection=Autores");
  mongoexport_autores.ProcessArguments.push("--db=Biblioteca");
  mongoexport_autores.ProcessArguments.push("--out=C:/tmp/autores_backup.json");

  const mongoexport_libros = new Process("mongoexport");
  mongoexport_libros.ProcessArguments.push("--collection=Libros");
  mongoexport_libros.ProcessArguments.push("--db=Biblioteca");
  mongoexport_libros.ProcessArguments.push("--out=C:/tmp/libros_backup.json");

  const startRespaldarMongo = Date.now();
  await mongoimport_from_mysql_autores.ExecuteAsync(true);
  await mongoimport_from_mysql_libros.ExecuteAsync(true);
  await mongoexport_autores.ExecuteAsync(true);
  await mongoexport_libros.ExecuteAsync(true);

  const eliminarMySQL = new Process("mysql", { shell: true });
  eliminarMySQL.ProcessArguments.push("-uroot");
  eliminarMySQL.ProcessArguments.push("--port=6033");
  eliminarMySQL.ProcessArguments.push("--password=utt");
  eliminarMySQL.Execute();
  eliminarMySQL.Write("USE Biblioteca;");
  eliminarMySQL.Write("DELETE FROM autor;");
  eliminarMySQL.Write("DELETE FROM libro;");
  eliminarMySQL.End();
  await eliminarMySQL.Finish();

  const endRespaldarMongo = Date.now();
  metricas.mysql.respaldarMongo = endRespaldarMongo - startRespaldarMongo;
  console.log(
    `[MySQL] Respaldo en MongoDB completado en ${metricas.mysql.respaldarMongo} ms`
  );

  console.log("5) Restaurando respaldo de MongoDB a MySQL");
  const mongoimport_autores = new Process("mongoimport");
  mongoimport_autores.ProcessArguments.push("--db=Biblioteca");
  mongoimport_autores.ProcessArguments.push("--collection=Autores");
  mongoimport_autores.ProcessArguments.push(
    "--file=C:/tmp/autores_backup.json"
  );

  const mongoimport_libros = new Process("mongoimport");
  mongoimport_libros.ProcessArguments.push("--db=Biblioteca");
  mongoimport_libros.ProcessArguments.push("--collection=Libros");
  mongoimport_libros.ProcessArguments.push("--file=C:/tmp/libros_backup.json");

  const startRestaurarMySQL = Date.now();
  await mongoimport_autores.ExecuteAsync(true);
  await mongoimport_libros.ExecuteAsync(true);

  const mongoexport_csv_autores = new Process("mongoexport");
  mongoexport_csv_autores.ProcessArguments.push("--collection=Autores");
  mongoexport_csv_autores.ProcessArguments.push("--db=Biblioteca");
  mongoexport_csv_autores.ProcessArguments.push("--type=csv");
  mongoexport_csv_autores.ProcessArguments.push(
    "--fields=id,license,name,lastname,secondLastName,year"
  );
  mongoexport_csv_autores.ProcessArguments.push(
    "--out=C:/tmp/autores_restore.csv"
  );

  const mongoexport_csv_libros = new Process("mongoexport");
  mongoexport_csv_libros.ProcessArguments.push("--collection=Libros");
  mongoexport_csv_libros.ProcessArguments.push("--db=Biblioteca");
  mongoexport_csv_libros.ProcessArguments.push("--type=csv");
  mongoexport_csv_libros.ProcessArguments.push(
    "--out=C:/tmp/libros_restore.csv"
  );

  await mongoexport_csv_autores.ExecuteAsync(true);
  await mongoexport_csv_libros.ExecuteAsync(true);

  const restaurarMySQL = new Process("mysql", { shell: true });
  restaurarMySQL.ProcessArguments.push("-uroot");
  restaurarMySQL.ProcessArguments.push("--port=6033");
  restaurarMySQL.ProcessArguments.push("--password=utt");
  restaurarMySQL.Execute();
  restaurarMySQL.Write("USE Biblioteca;");
  restaurarMySQL.Write(`LOAD DATA INFILE 'C:/tmp/autores_restore.csv' INTO TABLE autor 
                    FIELDS TERMINATED BY ',' 
                    LINES TERMINATED BY '\n'
                    IGNORE 1 ROWS
                    (id,license,name,lastname,@secondLastName,year)
                    SET secondLastName = NULLIF(@secondLastName, '');`);
  restaurarMySQL.Write(`LOAD DATA INFILE 'C:/tmp/libros_restore.csv' INTO TABLE libro 
                    FIELDS TERMINATED BY ',' 
                    LINES TERMINATED BY '\n'
                    IGNORE 1 ROWS;`);
  restaurarMySQL.End();
  await restaurarMySQL.Finish();

  const endRestaurarMySQL = Date.now();
  metricas.mysql.restaurarMySQL = endRestaurarMySQL - startRestaurarMySQL;
  console.log(
    `[MySQL] Restauración completada en ${metricas.mysql.restaurarMySQL} ms`
  );

  console.log("6) Realizando dump de MySQL");
  const mysqldump = new Process("mysqldump");
  mysqldump.ProcessArguments.push("-uroot");
  mysqldump.ProcessArguments.push("--port=6033");
  mysqldump.ProcessArguments.push("--password=utt");
  mysqldump.ProcessArguments.push("Biblioteca");
  mysqldump.ProcessArguments.push(
    "--result-file=C:/tmp/biblioteca_snapshot.sql"
  );
  await mysqldump.ExecuteAsync(true);
  metricas.mysql.dumpMySQL = mysqldump.EndTime - mysqldump.StartTime;
  console.log(`[MySQL] Dump completado en ${metricas.mysql.dumpMySQL} ms`);

  console.log("7) Importando snapshot de MySQL");

  const setupDb = new Process("mysql", { shell: true });
  setupDb.ProcessArguments.push("-uroot");
  setupDb.ProcessArguments.push("--port=6033");
  setupDb.ProcessArguments.push("--password=utt");
  setupDb.Execute();
  setupDb.Write("DROP DATABASE IF EXISTS Biblioteca;");
  setupDb.Write("CREATE DATABASE Biblioteca;");
  setupDb.End();
  await setupDb.Finish();
  const importarDump = new Process("mysql", { shell: true });
  importarDump.ProcessArguments.push("-uroot");
  importarDump.ProcessArguments.push("--port=6033");
  importarDump.ProcessArguments.push("--password=utt");
  importarDump.ProcessArguments.push("Biblioteca");
  importarDump.ProcessArguments.push("<");
  importarDump.ProcessArguments.push("C:/tmp/biblioteca_snapshot.sql");
  const startImport = Date.now();
  await importarDump.ExecuteAsync(true);
  const endImport = Date.now();
  metricas.mysql.importarDump = (setupDb.EndTime - setupDb.StartTime) + (endImport - startImport);
  console.log(`[MySQL] Importación de snapshot completada en ${metricas.mysql.importarDump} ms`);

  console.log("8) Generando 1,000,000 libros en MongoDB");
  const librosData = generate_libros_data(1000000);
  const archivoLibros = "C:/tmp/libros_data.csv";
  FileStream.writeFileSync(archivoLibros, librosData);

  const mongoImportLibros = new Process("mongoimport");
  mongoImportLibros.ProcessArguments.push("--db=Biblioteca");
  mongoImportLibros.ProcessArguments.push("--collection=Libros");
  mongoImportLibros.ProcessArguments.push("--type=csv");
  mongoImportLibros.ProcessArguments.push(
    "--fields=ISBN,title,autor_license,editorial,pages,year,genre,language,format"
  );
  mongoImportLibros.ProcessArguments.push(`--file=${archivoLibros}`);
  const startLibrosMongo = Date.now();
  await mongoImportLibros.ExecuteAsync(true);
  const endLibrosMongo = Date.now();
  metricas.mysql.librosEnMongo = endLibrosMongo - startLibrosMongo;
  console.log(
    `[MongoDB] 1,000,000 libros generados en ${metricas.mysql.librosEnMongo} ms`
  );

  console.log("9) Exportando campos específicos de libros a CSV");
  const mongoexport_campos = new Process("mongoexport");
  mongoexport_campos.ProcessArguments.push("--collection=Libros");
  mongoexport_campos.ProcessArguments.push("--db=Biblioteca");
  mongoexport_campos.ProcessArguments.push("--fields=ISBN,year,pages");
  mongoexport_campos.ProcessArguments.push("--type=csv");
  mongoexport_campos.ProcessArguments.push("--out=C:/tmp/libros_campos.csv");
  await mongoexport_campos.ExecuteAsync(true);

  console.log("10) Importando CSV a nueva tabla MySQL");
  const importarOldBooks = new Process("mysql", { shell: true });
  importarOldBooks.ProcessArguments.push("-uroot");
  importarOldBooks.ProcessArguments.push("--port=6033");
  importarOldBooks.ProcessArguments.push("--password=utt");
  importarOldBooks.Execute();
  importarOldBooks.Write("USE Biblioteca;");
  importarOldBooks.Write("DROP TABLE IF EXISTS old_books;");
  importarOldBooks.Write(
    "CREATE TABLE old_books (ISBN VARCHAR(16), year SMALLINT, pages SMALLINT);"
  );
  importarOldBooks.Write(`LOAD DATA INFILE 'C:/tmp/libros_campos.csv' INTO TABLE old_books 
                    FIELDS TERMINATED BY ',' 
                    LINES TERMINATED BY '\n'
                    IGNORE 1 ROWS;`);
  importarOldBooks.End();
  await importarOldBooks.Finish();

  console.log("11) Midiendo tiempo de fallo de usuario A para insertar Autor");
  const usuarioAFallido = new Process("mysql", { shell: true });
  usuarioAFallido.ProcessArguments.push("-uusuarioTest");
  usuarioAFallido.ProcessArguments.push("--port=6033");
  usuarioAFallido.ProcessArguments.push("--password=password");
  const startFalloA = Date.now();
  usuarioAFallido.Execute();
  usuarioAFallido.Write("USE Biblioteca;");
  usuarioAFallido.Write(
    `INSERT INTO autor VALUES (NULL, 'LIC123', 'NombreFallo', 'ApellidoFallo', NULL, 2024);`
  );
  usuarioAFallido.End();
  try {
    await usuarioAFallido.Finish();
  } catch (error) {
  }
  const endFalloA = Date.now();
  metricas.mysql.usuarioAFallido = endFalloA - startFalloA;
  console.log(
    `[MySQL] Tiempo de fallo de usuario A: ${metricas.mysql.usuarioAFallido} ms`
  );

  console.log("12) Midiendo tiempo de fallo de usuario B para insertar Libro");
  const usuarioBFallido = new Process("mysql", { shell: true });
  usuarioBFallido.ProcessArguments.push("-uusuarioTest2");
  usuarioBFallido.ProcessArguments.push("--port=6033");
  usuarioBFallido.ProcessArguments.push("--password=password");
  const startFalloB = Date.now();
  usuarioBFallido.Execute();
  usuarioBFallido.Write("USE Biblioteca;");
  usuarioBFallido.Write(
    `INSERT INTO libro VALUES (NULL, 'ISBN123', 'TituloFallo', 'LIC123', 'EditorialFallo', 200, 2024, 'GeneroFallo', 'EspañolFallo', 'FormatoFallo', 'SinopsisFallo', NULL);`
  );
  usuarioBFallido.End();
  try {
    await usuarioBFallido.Finish();
  } catch (error) {
  }
  const endFalloB = Date.now();
  metricas.mysql.usuarioBFallido = endFalloB - startFalloB;
  console.log(
    `[MySQL] Tiempo de fallo de usuario B: ${metricas.mysql.usuarioBFallido} ms`
  );

  generarReporte(metricas);
}

(async () => {
  await ejecutarPractica();
})();
