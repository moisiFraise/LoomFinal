const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  console.log('Iniciando configuração do banco de dados...');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };
  
  console.log('Tentando conectar ao MySQL com as configurações:', {
    host: config.host,
    user: config.user
  });

  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('Conexão com o MySQL estabelecida com sucesso!');
    
    const sqlPath = path.join(__dirname, 'init.sql');
    console.log(`Lendo arquivo SQL: ${sqlPath}`);
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const commands = sql.split(';').filter(cmd => cmd.trim() !== '');
    
    console.log(`Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';
      console.log(`Executando comando ${i + 1}/${commands.length}`);
      await connection.query(command);
    }
    
    console.log('Banco de dados configurado com sucesso!');
  } catch (error) {
    console.error('Erro ao configurar o banco de dados:');
    console.error(error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Conexão recusada. Verifique se o MySQL está rodando no XAMPP.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexão com o MySQL encerrada.');
    }
  }
}

setupDatabase();
