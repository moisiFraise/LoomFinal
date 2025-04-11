const pool = require('../config/database');

class Clube {
  static async criar(nome, descricao, idCriador, visibilidade, senha) {
    try {
      const senhaAcesso = visibilidade === 'privado' ? senha : null;
      
      const [result] = await pool.query(
        'INSERT INTO clubes (nome, descricao, id_criador, visibilidade, senha_acesso) VALUES (?, ?, ?, ?, ?)',
        [nome, descricao, idCriador, visibilidade, senhaAcesso]
      );
      
      await pool.query(
        'INSERT INTO participacoes (id_usuario, id_clube) VALUES (?, ?)',
        [idCriador, result.insertId]
      );
      
      return { 
        id: result.insertId, 
        nome, 
        descricao, 
        id_criador: idCriador,
        visibilidade
      };
    } catch (error) {
      console.error('Erro ao criar clube:', error);
      throw error;
    }
  }
  
  static async verificarSenha(clubeId, senha) {
    try {
      const [rows] = await pool.query(
        'SELECT senha_acesso FROM clubes WHERE id = ?',
        [clubeId]
      );
      
      if (rows.length === 0) {
        return false;
      }
      
      const clube = rows[0];
      
      if (!clube.senha_acesso) {
        return false;
      }
      
      return senha === clube.senha_acesso;
    } catch (error) {
      console.error('Erro ao verificar senha do clube:', error);
      throw error;
    }
  }
}

module.exports = Clube;
