const db = require('../config/db');

const PushSubscription = {
  create: (userId, subscription, callback) => {
    const subscriptionJson = JSON.stringify(subscription);
    const query = 'INSERT INTO inscricoes_push (id_usuario, dados_inscricao) VALUES (?, ?)';
    
    db.query(query, [userId, subscriptionJson], callback);
  },

  findByUserId: (userId, callback) => {
    const query = 'SELECT * FROM inscricoes_push WHERE id_usuario = ? AND ativo = 1';
    db.query(query, [userId], callback);
  },

  findByClubMembers: (clubeId, callback) => {
    const query = `
      SELECT DISTINCT ip.* 
      FROM inscricoes_push ip
      INNER JOIN participacoes p ON ip.id_usuario = p.id_usuario
      WHERE p.id_clube = ? AND ip.ativo = 1
    `;
    db.query(query, [clubeId], callback);
  },

  delete: (userId, endpoint, callback) => {
    const query = 'UPDATE inscricoes_push SET ativo = 0 WHERE id_usuario = ? AND JSON_EXTRACT(dados_inscricao, "$.endpoint") = ?';
    db.query(query, [userId, endpoint], callback);
  },

  deleteByUserId: (userId, callback) => {
    const query = 'UPDATE inscricoes_push SET ativo = 0 WHERE id_usuario = ?';
    db.query(query, [userId], callback);
  }
};

module.exports = PushSubscription;
