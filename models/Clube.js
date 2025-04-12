const pool = require('../config/database');

class Clube {
  static async criar(nome, descricao, idCriador, visibilidade, senha, categorias = []) {
    try {
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        const senhaAcesso = visibilidade === 'privado' ? senha : null;
        
        const [result] = await connection.query(
          'INSERT INTO clubes (nome, descricao, id_criador, visibilidade, senha_acesso) VALUES (?, ?, ?, ?, ?)',
          [nome, descricao, idCriador, visibilidade, senhaAcesso]
        );
        
        const clubeId = result.insertId;
        
        await connection.query(
          'INSERT INTO participacoes (id_usuario, id_clube) VALUES (?, ?)',
          [idCriador, clubeId]
        );
        
        if (categorias && categorias.length > 0) {
          const valoresSQL = categorias.map(categoriaId => `(${clubeId}, ${categoriaId})`).join(', ');
          await connection.query(
            `INSERT INTO clube_categorias (id_clube, id_categoria) VALUES ${valoresSQL}`
          );
        }
        
        await connection.commit();
        
        return { 
          id: clubeId, 
          nome, 
          descricao, 
          id_criador: idCriador,
          visibilidade,
          categorias
        };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Erro ao criar clube:', error);
      throw error;
    }
  }
  
  static async buscarPorCriador(idCriador) {
    try {
      const [rows] = await pool.query(
        'SELECT id, nome, descricao, visibilidade, data_criacao FROM clubes WHERE id_criador = ? ORDER BY data_criacao DESC',
        [idCriador]
      );
      return rows;
    } catch (error) {
      console.error('Erro ao buscar clubes por criador:', error);
      throw error;
    }
  }
  
  static async buscarParticipacoes(idUsuario) {
    try {
      const [rows] = await pool.query(
        `SELECT c.id, c.nome, c.descricao, c.visibilidade, c.data_criacao FROM clubes c
         INNER JOIN participacoes p ON c.id = p.id_clube
         WHERE p.id_usuario = ? AND c.id_criador != ?
         ORDER BY p.data_entrada DESC`,
        [idUsuario, idUsuario]
      );
      return rows;
    } catch (error) {
      console.error('Erro ao buscar participações em clubes:', error);
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
