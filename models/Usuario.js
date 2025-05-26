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
  static async listarTodos() {
    try {
      const [rows] = await pool.query(`
        SELECT u.* FROM usuarios u ORDER BY u.id
      `);
      
      for (let i = 0; i < rows.length; i++) {
        const [result] = await pool.query(`
          SELECT COUNT(DISTINCT clube_id) as total FROM (
            SELECT id as clube_id FROM clubes WHERE id_criador = ?
            UNION
            SELECT id_clube as clube_id FROM participacoes WHERE id_usuario = ?
          ) as combined_clubs
        `, [rows[i].id, rows[i].id]);
        
        rows[i].total_clubes = result[0].total;
      }
      
      return rows;
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw error;
    }
  }
  
static async atualizar(id, dados) { //crUd
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
  static async atualizarFotoPerfil(userId, fotoUrl) {
  try {
    console.log('Atualizando foto no banco para usuário:', userId, 'URL:', fotoUrl);
    
    const [result] = await pool.query(
      'UPDATE usuarios SET foto_perfil = ? WHERE id = ?',
      [fotoUrl, userId]
    );
    
    console.log('Resultado da atualização:', result);
    
    if (result.affectedRows === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    const [rows] = await pool.query(
      'SELECT id, nome, email, foto_perfil FROM usuarios WHERE id = ?',
      [userId]
    );
    
    return rows[0];
  } catch (error) {
    console.error('Erro ao atualizar foto de perfil no banco:', error);
    throw error;
  }
}
}
module.exports = Usuario;
