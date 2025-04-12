const pool = require('../config/database');

class Categorias {
  static async listarTodas() { //get all
    try {
      const [rows] = await pool.query(
        'SELECT * FROM categorias ORDER BY nome'
      );
      return rows;
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      throw error;
    }
  }

  static async buscarPorId(id) { //get por id
    try {
      const [rows] = await pool.query(
        'SELECT * FROM categorias WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Erro ao buscar categoria por ID:', error);
      throw error;
    }
  }

  static async criar(nome) { //criar categoria
    try {
      const [result] = await pool.query(
        'INSERT INTO categorias (nome) VALUES (?)',
        [nome]
      );
      return { id: result.insertId, nome };
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  }

  static async atualizar(id, nome) { //update
    try {
      await pool.query(
        'UPDATE categorias SET nome = ? WHERE id = ?',
        [nome, id]
      );
      return { id, nome };
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  }

  static async excluir(id) { //delete
    try {
      await pool.query(
        'DELETE FROM categorias WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      throw error;
    }
  }

  static async contarClubesPorCategoria() {
    try {
      const [rows] = await pool.query(`
        SELECT c.id, c.nome, COUNT(cc.id_clube) as total_clubes
        FROM categorias c
        LEFT JOIN clube_categorias cc ON c.id = cc.id_categoria
        GROUP BY c.id
        ORDER BY c.nome
      `);
      return rows;
    } catch (error) {
      console.error('Erro ao contar clubes por categoria:', error);
      throw error;
    }
  }

  static async listarClubesPorCategoria(categoriaId) {
    try {
      const [rows] = await pool.query(`
        SELECT cl.id, cl.nome, cl.descricao
        FROM clubes cl
        JOIN clube_categorias cc ON cl.id = cc.id_clube
        WHERE cc.id_categoria = ?
        ORDER BY cl.nome
      `, [categoriaId]);
      return rows;
    } catch (error) {
      console.error('Erro ao listar clubes por categoria:', error);
      throw error;
    }
  }
}

module.exports = Categorias;
