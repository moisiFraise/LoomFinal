const pool = require('../config/database');

const PushSubscription = {
  create: async (userId, subscription) => {
    const subscriptionJson = JSON.stringify(subscription);
    const query = 'INSERT INTO inscricoes_push (id_usuario, dados_inscricao) VALUES (?, ?)';
    
    return await pool.safeQuery(query, [userId, subscriptionJson]);
  },

  findByUserId: async (userId) => {
    const query = 'SELECT * FROM inscricoes_push WHERE id_usuario = ? AND ativo = 1';
    const [rows] = await pool.safeQuery(query, [userId]);
    return rows;
  },

  findByClubMembers: async (clubeId) => {
    const query = `
      SELECT DISTINCT ip.* 
      FROM inscricoes_push ip
      INNER JOIN participacoes p ON ip.id_usuario = p.id_usuario
      WHERE p.id_clube = ? AND ip.ativo = 1
    `;
    const [rows] = await pool.safeQuery(query, [clubeId]);
    return rows;
  },

  delete: async (userId, endpoint) => {
    const query = 'UPDATE inscricoes_push SET ativo = 0 WHERE id_usuario = ? AND JSON_EXTRACT(dados_inscricao, "$.endpoint") = ?';
    return await pool.safeQuery(query, [userId, endpoint]);
  },

  deleteByUserId: async (userId) => {
    const query = 'UPDATE inscricoes_push SET ativo = 0 WHERE id_usuario = ?';
    return await pool.safeQuery(query, [userId]);
  }
};

module.exports = PushSubscription;
