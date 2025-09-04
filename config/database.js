const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loom_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000, // Aumentar timeout
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci'
};
console.log('Tentando conectar ao banco de dados com as configurações:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database
});

const pool = mysql.createPool(dbConfig);

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    connection.release();
    return true;
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('O banco de dados não existe. Crie-o usando o script init.sql.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('Conexão recusada. Verifique se o MySQL está rodando e acessível.');
    }
    return false;
  }
};

testConnection();

module.exports = pool;
