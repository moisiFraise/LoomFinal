const pool = require('../config/database');
const bcrypt = require('bcrypt');

class Usuario {
  static async criar(nome, email, senha) { //Crud
    try {
      // Hash da senha antes de armazenar
      const senhaHash = await bcrypt.hash(senha, 10);
      
      const [result] = await pool.safeQuery(
        'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
        [nome, email, senhaHash]  
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
      const [rows] = await pool.safeQuery(
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

  static async verificarSenha(senha, senhaBanco, usuarioId = null) {
    try {
      // Verifica se a senha no banco já está hasheada (inicia com $2b$)
      if (senhaBanco.startsWith('$2b$')) {
        // Senha já está hasheada, usa bcrypt
        return await bcrypt.compare(senha, senhaBanco);
      } else {
        // Senha antiga em texto plano, compara diretamente
        if (senha === senhaBanco) {
          // Senha correta - aproveita para atualizar com hash se tivermos o ID
          if (usuarioId) {
            try {
              const senhaHash = await bcrypt.hash(senha, 10);
              await pool.safeQuery('UPDATE usuarios SET senha = ? WHERE id = ?', [senhaHash, usuarioId]);
              console.log(`Senha do usuário ${usuarioId} migrada para hash`);
            } catch (updateError) {
              console.error('Erro ao atualizar senha para hash:', updateError);
            }
          }
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      return false;
    }
  }
  static async buscarPorId(id) {
    try {
      const [rows] = await pool.safeQuery(
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
      const [rows] = await pool.safeQuery(`
        SELECT u.* FROM usuarios u ORDER BY u.id
      `);
      
      for (let i = 0; i < rows.length; i++) {
        const [result] = await pool.safeQuery(`
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
      // Hash da senha antes de atualizar
      const senhaHash = await bcrypt.hash(dados.senha, 10);
      valores.push(senhaHash);
    }
    
    if (dados.estado) {
      campos.push('estado = ?');
      valores.push(dados.estado);
    }
    
    if (campos.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }
    
    valores.push(id);
    
    const [result] = await pool.safeQuery(
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
      const [clubesCriados] = await pool.safeQuery(
        'SELECT id, nome FROM clubes WHERE id_criador = ?',
        [userId]
      );
      
      const [clubesParticipando] = await pool.safeQuery(`
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
    
    const [result] = await pool.safeQuery(
      'UPDATE usuarios SET foto_perfil = ? WHERE id = ?',
      [fotoUrl, userId]
    );
    
    console.log('Resultado da atualização:', result);
    
    if (result.affectedRows === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    const [rows] = await pool.safeQuery(
      'SELECT id, nome, email, foto_perfil FROM usuarios WHERE id = ?',
      [userId]
    );
    
    return rows[0];
  } catch (error) {
    console.error('Erro ao atualizar foto de perfil no banco:', error);
    throw error;
  }
}

  // Métodos para reset de senha
  static async salvarTokenReset(email, token) {
    try {
      const agora = new Date();
      const [result] = await pool.safeQuery(
        'UPDATE usuarios SET reset_token = ?, reset_token_expira = ? WHERE email = ?',
        [token, agora, email]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erro ao salvar token de reset:', error);
      throw error;
    }
  }

  static async buscarPorTokenReset(token) {
    try {
      const [rows] = await pool.safeQuery(
        'SELECT * FROM usuarios WHERE reset_token = ?',
        [token]
      );
      
      return rows[0];
    } catch (error) {
      console.error('Erro ao buscar usuário por token:', error);
      throw error;
    }
  }

  static async atualizarSenhaPorToken(token, novaSenha) {
    try {
      // Verificar se o token existe e não expirou
      const usuario = await this.buscarPorTokenReset(token);
      if (!usuario) {
        throw new Error('Token inválido');
      }

      // Verificar se não expirou (1 hora)
      const agora = new Date();
      const expiracao = new Date(usuario.reset_token_expira);
      expiracao.setHours(expiracao.getHours() + 1);

      if (agora > expiracao) {
        throw new Error('Token expirado');
      }

      // Hash da nova senha
      const senhaHash = await bcrypt.hash(novaSenha, 10);

      // Atualizar senha e limpar token
      const [result] = await pool.safeQuery(
        'UPDATE usuarios SET senha = ?, reset_token = NULL, reset_token_expira = NULL WHERE reset_token = ?',
        [senhaHash, token]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erro ao atualizar senha por token:', error);
      throw error;
    }
  }

  static async limparTokenReset(email) {
    try {
      const [result] = await pool.safeQuery(
        'UPDATE usuarios SET reset_token = NULL, reset_token_expira = NULL WHERE email = ?',
        [email]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erro ao limpar token de reset:', error);
      throw error;
    }
  }
}
module.exports = Usuario;
