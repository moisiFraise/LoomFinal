const pool = require('../config/database');
const Categorias = require('./Categorias');

class Clube {
static async criar(nome, descricao, idCriador, visibilidade, senha, categorias = [], modelo = 'online') {
  try {
    return await pool.safeTransaction(async (connection) => {
      const senhaAcesso = visibilidade === 'privado' ? senha : null;
      
      const [result] = await connection.query(
        'INSERT INTO clubes (nome, descricao, id_criador, visibilidade, senha_acesso, modelo) VALUES (?, ?, ?, ?, ?, ?)',
        [nome, descricao, idCriador, visibilidade, senhaAcesso, modelo]
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
      } else {
        const categoriaGeralId = await Categorias.obterOuCriarCategoriaPadrao();
        await connection.query(
          'INSERT INTO clube_categorias (id_clube, id_categoria) VALUES (?, ?)',
          [clubeId, categoriaGeralId]
        );
      }
      
      return { 
        id: clubeId, 
        nome, 
        descricao, 
        id_criador: idCriador,
        visibilidade,
        modelo,
        categorias
      };
    });
  } catch (error) {
    console.error('Erro ao criar clube:', error);
    throw error;
  }
}
  static async buscarPorCriador(idCriador) {
    try {
      const [rows] = await pool.safeQuery(
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
      const [rows] = await pool.safeQuery(
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
      const [rows] = await pool.safeQuery(
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

static async listarTodos() { //get all clubes usado no painelAdmin
  try {
    const [rows] = await pool.safeQuery(`
      SELECT c.id, c.nome, c.descricao, c.visibilidade, c.senha_acesso, 
             c.data_criacao, c.id_criador, c.modelo,
             u.nome as nome_criador,
             (SELECT COUNT(*) FROM participacoes WHERE id_clube = c.id) as total_participantes
      FROM clubes c
      JOIN usuarios u ON c.id_criador = u.id
      ORDER BY c.data_criacao DESC
    `);
    return rows;
  } catch (error) {
    console.error('Erro ao listar todos os clubes:', error);
    throw error;
  }
}

static async atualizarVisibilidade(id, visibilidade, senha = null) {
  try {
    return await pool.safeTransaction(async (connection) => {
      await connection.query(
        'UPDATE clubes SET visibilidade = ?, senha_acesso = ? WHERE id = ?',
        [visibilidade, senha, id]
      );
      
      return { id, visibilidade, senha_acesso: senha };
    });
  } catch (error) {
    console.error('Erro ao atualizar visibilidade do clube:', error);
    throw error;
  }
}

static async atualizarModelo(id, modelo) {
  try {
    await pool.safeQuery(
      'UPDATE clubes SET modelo = ? WHERE id = ?',
      [modelo, id]
    );
    return { id, modelo };
  } catch (error) {
    console.error('Erro ao atualizar modelo do clube:', error);
    throw error;
  }
}

}

module.exports = Clube;
