const pool = require('../config/database');

class Leituras {
  static async criar(idClube, titulo, autor, dataInicio, dataFim = null, paginas = null, imagemUrl = null) {
    try {
      // Marcar leitura atual como anterior
      await pool.safeQuery(
        'UPDATE leituras SET status = "anterior" WHERE id_clube = ? AND status = "atual"',
        [idClube]
      );
      
      const [result] = await pool.safeQuery(
        'INSERT INTO leituras (id_clube, titulo, autor, status, data_inicio, data_fim, paginas, imagemUrl) VALUES (?, ?, ?, "atual", ?, ?, ?, ?)',
        [idClube, titulo, autor, dataInicio, dataFim, paginas, imagemUrl]
      );
      
      return {
        id: result.insertId,
        id_clube: idClube,
        titulo,
        autor,
        data_inicio: dataInicio,
        data_fim: dataFim,
        paginas,
        imagemUrl,
        status: 'atual'
      };
    } catch (error) {
      console.error('Erro ao criar leitura:', error);
      throw error;
    }
  }

  static async criarDeSugestao(idClube, sugestaoId, dataInicio, dataFim = null) {
    try {
      // Buscar dados da sugestão
      const [sugestaoRows] = await pool.safeQuery(
        'SELECT titulo, autor, paginas, imagemUrl FROM sugestoes WHERE id = ? AND id_clube = ?',
        [sugestaoId, idClube]
      );
      
      if (sugestaoRows.length === 0) {
        throw new Error('Sugestão não encontrada');
      }
      
      const sugestao = sugestaoRows[0];
      
      // Criar leitura baseada na sugestão
      const novaLeitura = await this.criar(
        idClube,
        sugestao.titulo,
        sugestao.autor,
        dataInicio,
        dataFim,
        sugestao.paginas,
        sugestao.imagemUrl
      );
      
      return novaLeitura;
    } catch (error) {
      console.error('Erro ao criar leitura de sugestão:', error);
      throw error;
    }
  }
  
  static async buscarAtual(idClube) {
    try {
      const [rows] = await pool.safeQuery(
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
      const [rows] = await pool.safeQuery(
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
      
      await pool.safeQuery(
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
      await pool.safeQuery(
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
