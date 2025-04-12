const pool = require('../config/database');

class Explorar {
  static async listarTodosClubes() {
    try {
      const [rows] = await pool.query(`
        SELECT c.id, c.nome, c.descricao, c.visibilidade, c.data_criacao,
               u.nome as nome_criador,
               (SELECT COUNT(*) FROM participacoes WHERE id_clube = c.id) as total_membros
        FROM clubes c
        JOIN usuarios u ON c.id_criador = u.id
        ORDER BY c.data_criacao DESC
      `);
      

      return rows.map(clube => ({
        ...clube,
        modelo: 'online',  
        leitura_atual: null 
      }));
    } catch (error) {
      console.error('Erro ao listar todos os clubes:', error);
      throw error;
    }
  }

  static async verificarParticipacao(idUsuario, idClube) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
        [idUsuario, idClube]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Erro ao verificar participação:', error);
      throw error;
    }
  }

  static async entrarNoClube(idUsuario, idClube) {
    try {
      await pool.query(
        'INSERT INTO participacoes (id_usuario, id_clube) VALUES (?, ?)',
        [idUsuario, idClube]
      );
      return true;
    } catch (error) {
      console.error('Erro ao entrar no clube:', error);
      throw error;
    }
  }
}

module.exports = Explorar;
