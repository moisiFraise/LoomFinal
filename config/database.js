const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loom_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: process.env.VERCEL ? 10 : 100, // Pool maior para múltiplos usuários
  queueLimit: 0,
  acquireTimeout: 30000, // 30s
  timeout: 30000, // 30s
  connectTimeout: 20000, // 20s para conectar
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  timezone: '-03:00',
  idleTimeout: 10000, // 10s no Vercel
  maxIdle: 5,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

console.log('Tentando conectar ao banco de dados com as configurações:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database
});

const pool = mysql.createPool(dbConfig);

// Wrapper para garantir que conexões sempre sejam liberadas
async function executeQuery(query, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(query, params);
    return [rows, connection];
  } catch (error) {
    if (connection) connection.release();
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Wrapper para transações com auto-release
async function executeTransaction(callback) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Método simples que sempre retorna array no formato [rows]
pool.safeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(query, params);
    return [rows];
  } finally {
    if (connection) connection.release();
  }
};

pool.safeTransaction = executeTransaction;

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

// Monitorar pool de conexões
setInterval(() => {
  try {
    const poolInfo = pool.pool || {};
    const stats = {
      totalConnections: poolInfo._allConnections?.length || 0,
      freeConnections: poolInfo._freeConnections?.length || 0,
      usedConnections: (poolInfo._allConnections?.length || 0) - (poolInfo._freeConnections?.length || 0),
      acquiringConnections: poolInfo._acquiringConnections?.length || 0
    };
    
    if (stats.usedConnections > 10) {
      console.log('📊 Pool stats:', stats);
    }
  } catch (error) {
    // Ignorar erros de monitoramento
  }
}, 30000);

module.exports = pool;
