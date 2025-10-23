const pool = require('../config/database');
const Categorias = require('./Categorias');

class Explorar {
static async listarTodosClubes() {
  try {
    const [rows] = await pool.safeQuery(`
      SELECT c.id, c.nome, c.descricao, c.visibilidade, c.modelo, c.data_criacao,
             u.nome as nome_criador,
             (SELECT COUNT(*) FROM participacoes WHERE id_clube = c.id) as total_membros
      FROM clubes c
      JOIN usuarios u ON c.id_criador = u.id
      ORDER BY c.data_criacao DESC
    `);
    
    const clubesComLeituras = [];
    for (const clube of rows) {
      const [leituras] = await pool.safeQuery(
        'SELECT titulo, autor FROM leituras WHERE id_clube = ? AND status = "atual" LIMIT 1',
        [clube.id]
      );
      
      const [categorias] = await pool.safeQuery(`
        SELECT cat.nome
        FROM categorias cat
        JOIN clube_categorias cc ON cat.id = cc.id_categoria
        WHERE cc.id_clube = ?
      `, [clube.id]);
      
      if (categorias.length === 0) {
        const categoriaGeralId = await Categorias.obterOuCriarCategoriaPadrao();
        await pool.safeQuery(
          'INSERT INTO clube_categorias (id_clube, id_categoria) VALUES (?, ?)',
          [clube.id, categoriaGeralId]
        );
        categorias.push({ nome: 'Geral' });
      }
      
      clubesComLeituras.push({
        ...clube,
        modelo: clube.modelo || 'online',
        leitura_atual: leituras.length > 0 ? `${leituras[0].titulo} - ${leituras[0].autor}` : null,
        categorias: categorias.map(cat => cat.nome)
      });
    }

    return clubesComLeituras;
  } catch (error) {
    console.error('Erro ao listar todos os clubes:', error);
    throw error;
  }
}
  static async verificarParticipacao(idUsuario, idClube) {
    try {
      const [rows] = await pool.safeQuery(
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
      await pool.safeQuery(
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
