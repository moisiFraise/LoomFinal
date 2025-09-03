const pool = require('../config/database');

class Denuncias {
  static async criar(idDenunciante, idDenunciado, idAtualizacao, motivo, descricao) {
    try {
      const [denunciaExistente] = await pool.query(
        'SELECT id FROM denuncias WHERE id_denunciante = ? AND id_atualizacao = ?',
        [idDenunciante, idAtualizacao]
      );

      if (denunciaExistente.length > 0) {
        throw new Error('Você já denunciou esta atualização');
      }

      const [result] = await pool.query(
        `INSERT INTO denuncias (id_denunciante, id_denunciado, id_atualizacao, motivo, descricao) 
         VALUES (?, ?, ?, ?, ?)`,
        [idDenunciante, idDenunciado, idAtualizacao, motivo, descricao]
      );

      return {
        id: result.insertId,
        id_denunciante: idDenunciante,
        id_denunciado: idDenunciado,
        id_atualizacao: idAtualizacao,
        motivo,
        descricao,
        status: 'pendente'
      };
    } catch (error) {
      console.error('Erro ao criar denúncia:', error);
      throw error;
    }
  }

  static async listarTodas() {
    try {
      const [denuncias] = await pool.query(`
        SELECT d.*, 
               denunciante.nome as nome_denunciante,
               denunciante.email as email_denunciante,
               denunciado.nome as nome_denunciado,
               denunciado.email as email_denunciado,
               denunciado.estado as estado_denunciado,
               a.conteudo as conteudo_atualizacao,
               a.data_postagem as data_atualizacao,
               c.nome as nome_clube,
               admin.nome as nome_admin_analise
        FROM denuncias d
        JOIN usuarios denunciante ON d.id_denunciante = denunciante.id
        JOIN usuarios denunciado ON d.id_denunciado = denunciado.id
        JOIN atualizacoes a ON d.id_atualizacao = a.id
        JOIN clubes c ON a.id_clube = c.id
        LEFT JOIN usuarios admin ON d.id_admin_analise = admin.id
        ORDER BY d.data_denuncia DESC
      `);

      return denuncias;
    } catch (error) {
      console.error('Erro ao listar denúncias:', error);
      throw error;
    }
  }

  static async buscarPorId(id) {
    try {
      const [denuncias] = await pool.query(`
        SELECT d.*, 
               denunciante.nome as nome_denunciante,
               denunciante.email as email_denunciante,
               denunciado.nome as nome_denunciado,
               denunciado.email as email_denunciado,
               denunciado.estado as estado_denunciado,
               a.conteudo as conteudo_atualizacao,
               a.data_postagem as data_atualizacao,
               a.id_clube as id_clube,
               c.nome as nome_clube,
               admin.nome as nome_admin_analise
        FROM denuncias d
        JOIN usuarios denunciante ON d.id_denunciante = denunciante.id
        JOIN usuarios denunciado ON d.id_denunciado = denunciado.id
        JOIN atualizacoes a ON d.id_atualizacao = a.id
        JOIN clubes c ON a.id_clube = c.id
        LEFT JOIN usuarios admin ON d.id_admin_analise = admin.id
        WHERE d.id = ?
      `, [id]);

      return denuncias[0] || null;
    } catch (error) {
      console.error('Erro ao buscar denúncia:', error);
      throw error;
    }
  }

  static async analisar(id, idAdmin, status, observacoes) {
    try {
      await pool.query(
        `UPDATE denuncias 
         SET status = ?, data_analise = NOW(), id_admin_analise = ?, observacoes_admin = ?
         WHERE id = ?`,
        [status, idAdmin, observacoes, id]
      );

      return await this.buscarPorId(id);
    } catch (error) {
      console.error('Erro ao analisar denúncia:', error);
      throw error;
    }
  }

  static async processarDenuncia(id, idAdmin, acao, observacoes) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const denuncia = await this.buscarPorId(id);
      if (!denuncia) {
        throw new Error('Denúncia não encontrada');
      }

      await connection.query(
        `UPDATE denuncias 
         SET status = 'analisada', data_analise = NOW(), id_admin_analise = ?, observacoes_admin = ?
         WHERE id = ?`,
        [idAdmin, observacoes, id]
      );

      if (acao === 'suspender_usuario') {
        await connection.query(
          'UPDATE usuarios SET estado = "inativo" WHERE id = ?',
          [denuncia.id_denunciado]
        );

        await connection.query(
          'DELETE FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
          [denuncia.id_denunciado, denuncia.id_clube]
        );

        await connection.query(
          'DELETE FROM atualizacoes WHERE id = ?',
          [denuncia.id_atualizacao]
        );
      } else if (acao === 'remover_atualizacao') {
        await connection.query(
          'DELETE FROM atualizacoes WHERE id = ?',
          [denuncia.id_atualizacao]
        );
      }

      await connection.commit();
      return await this.buscarPorId(id);
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao processar denúncia:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async contarPorStatus() {
    try {
      const [resultado] = await pool.query(`
        SELECT 
          status,
          COUNT(*) as total
        FROM denuncias 
        GROUP BY status
      `);

      const contadores = {
        pendente: 0,
        analisada: 0,
        rejeitada: 0
      };

      resultado.forEach(row => {
        contadores[row.status] = row.total;
      });

      return contadores;
    } catch (error) {
      console.error('Erro ao contar denúncias:', error);
      throw error;
    }
  }
}

module.exports = Denuncias;
