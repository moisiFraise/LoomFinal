const pool = require('../config/database');

class Usuario {
  static async criar(nome, email, senha) {
    try {
      const [result] = await pool.query(
        'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
        [nome, email, senha]  // Senha em texto simples
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
}

module.exports = Usuario;
