const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loom_db',
  waitForConnections: true,
  connectionLimit: 5, // Pool compartilhado entre app e sessões
  queueLimit: 0,
  acquireTimeout: 60000, // Timeout para adquirir conexão
  timeout: 60000, // Timeout geral
  reconnect: true, // Reconectar automaticamente
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  timezone: '-03:00', // Fuso horário do Brasil (UTC-3)
  // Configurações para otimizar o pool e evitar vazamentos
  idleTimeout: 60000, // 1 minuto para conexões ociosas (menor)
  maxIdle: 2, // Máximo de conexões ociosas (reduzido)
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // IMPORTANTES: Forçar liberação de conexões
  releaseTimeout: 60000, // Timeout para liberar conexão
  evictTimeout: 60000, // Timeout para expulsar conexões antigas
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

// Monitorar pool de conexões para detectar vazamentos
setInterval(() => {
  try {
    const poolInfo = pool.pool || {};
    const stats = {
      totalConnections: poolInfo._allConnections?.length || 0,
      freeConnections: poolInfo._freeConnections?.length || 0,
      usedConnections: (poolInfo._allConnections?.length || 0) - (poolInfo._freeConnections?.length || 0),
      acquiringConnections: poolInfo._acquiringConnections?.length || 0
    };
    
    // Log apenas se houver uso suspeito
    if (stats.usedConnections > 3 || stats.totalConnections > 4) {
      console.log('⚠️ Pool stats:', stats);
    }
  } catch (error) {
    // Ignorar erros de monitoramento para não quebrar a aplicação
    console.log('Pool monitoring disabled due to mysql2 version differences');
  }
}, 30000); // A cada 30 segundos

module.exports = pool;
