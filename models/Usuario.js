const pool = require('../config/database');

class Usuario {
  static async criar(nome, email, senha) { //Crud
    try {
      const [result] = await pool.query(
        'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
        [nome, email, senha]  
      );
      
      return { id: result.insertId, nome, email };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  static async buscarPorEmail(email) {
    try {
      console.log('Buscando usuário por email:', email);
      const [rows] = await pool.query(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
      );
      
      console.log('Resultado da busca:', rows.length > 0 ? 'Usuário encontrado' : 'Usuário não encontrado');
      return rows[0];
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  static async verificarSenha(senha, senhaBanco) {
    return senha === senhaBanco;
  }
  static async buscarPorId(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM usuarios WHERE id = ?',
        [id]
      );
      
      return rows[0];
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw error;
    }
  }
// Modificar o método listarTodos para incluir o estado
static async listarTodos() {
  try {
    const [rows] = await pool.query(`
      SELECT u.*, 
        (SELECT COUNT(*) FROM participacoes WHERE id_usuario = u.id) +
        (SELECT COUNT(*) FROM clubes WHERE id_criador = u.id) as total_clubes
      FROM usuarios u
      ORDER BY u.id
    `);
    
    return rows;
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    throw error;
  }
}

// Modificar o método atualizar para permitir atualizar o estado
static async atualizar(id, dados) {
  try {
    const campos = [];
    const valores = [];
    
    if (dados.email) {
      campos.push('email = ?');
      valores.push(dados.email);
    }
    
    if (dados.senha) {
      campos.push('senha = ?');
      valores.push(dados.senha);
    }
    
    if (dados.estado) {
      campos.push('estado = ?');
      valores.push(dados.estado);
    }
    
    if (campos.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }
    
    valores.push(id);
    
    const [result] = await pool.query(
      `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`,
      valores
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    return { id, ...dados };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
}

  
  static async buscarClubes(userId) {
    try {
      const [clubesCriados] = await pool.query(
        'SELECT id, nome FROM clubes WHERE id_criador = ?',
        [userId]
      );
      
      const [clubesParticipando] = await pool.query(`
        SELECT c.id, c.nome 
        FROM clubes c
        JOIN participacoes p ON c.id = p.id_clube
        WHERE p.id_usuario = ? AND c.id_criador != ?
      `, [userId, userId]);
      
      return {
        clubesCriados,
        clubesParticipando
      };
    } catch (error) {
      console.error('Erro ao buscar clubes do usuário:', error);
      throw error;
    }
  }
}

module.exports = Usuario;
