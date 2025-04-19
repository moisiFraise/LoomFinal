const pool = require('../config/database');

class Leituras {
  static async criar(idClube, titulo, autor, dataInicio, dataFim = null) {
    try {
      await pool.query(
        'UPDATE leituras SET status = "anterior" WHERE id_clube = ? AND status = "atual"',
        [idClube]
      );
      
      const [result] = await pool.query(
        'INSERT INTO leituras (id_clube, titulo, autor, status, data_inicio, data_fim) VALUES (?, ?, ?, "atual", ?, ?)',
        [idClube, titulo, autor, dataInicio, dataFim]
      );
      
      return { id: result.insertId, idClube, titulo, autor, status: 'atual', dataInicio, dataFim };
    } catch (error) {
      console.error('Erro ao criar leitura:', error);
      throw error;
    }
  }
  
  static async buscarAtual(idClube) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM leituras WHERE id_clube = ? AND status = "atual" LIMIT 1',
        [idClube]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Erro ao buscar leitura atual:', error);
      throw error;
    }
  }
  
  static async buscarAnteriores(idClube) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM leituras WHERE id_clube = ? AND status = "anterior" ORDER BY data_inicio DESC',
        [idClube]
      );
      
      return rows;
    } catch (error) {
      console.error('Erro ao buscar leituras anteriores:', error);
      throw error;
    }
  }
  
  static async atualizar(id, dados) {
    try {
      const { titulo, autor, dataInicio, dataFim } = dados;
      
      await pool.query(
        'UPDATE leituras SET titulo = ?, autor = ?, data_inicio = ?, data_fim = ? WHERE id = ?',
        [titulo, autor, dataInicio, dataFim, id]
      );
      
      return { id, ...dados };
    } catch (error) {
      console.error('Erro ao atualizar leitura:', error);
      throw error;
    }
  }
  
  static async finalizar(id, dataFim) {
    try {
      await pool.query(
        'UPDATE leituras SET status = "anterior", data_fim = ? WHERE id = ?',
        [dataFim, id]
      );
      
      return { id, dataFim, status: 'anterior' };
    } catch (error) {
      console.error('Erro ao finalizar leitura:', error);
      throw error;
    }
  }
}
module.exports = Leituras;
