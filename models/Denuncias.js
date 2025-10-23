const pool = require('../config/database');

class Denuncias {
  static async criar(idDenunciante, idDenunciado, idAtualizacao, motivo, descricao) {
    try {
      const [denunciaExistente] = await pool.safeQuery(
        'SELECT id FROM denuncias WHERE id_denunciante = ? AND id_atualizacao = ?',
        [idDenunciante, idAtualizacao]
      );

      if (denunciaExistente.length > 0) {
        throw new Error('Você já denunciou esta atualização');
      }

      const [result] = await pool.safeQuery(
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
      const [denuncias] = await pool.safeQuery(`
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
      const [denuncias] = await pool.safeQuery(`
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
    console.log('🔄 Iniciando analisar - Denúncia:', id, 'Admin:', idAdmin, 'Status:', status);
    return await pool.safeTransaction(async (connection) => {
      // Buscar status anterior
      const [denunciaAtual] = await connection.query(
        'SELECT status FROM denuncias WHERE id = ?',
        [id]
      );
      const statusAnterior = denunciaAtual[0]?.status || 'pendente';
      console.log('📊 Status anterior:', statusAnterior, '→ Novo status:', status);

      // Atualizar denúncia
      await connection.query(
        `UPDATE denuncias 
         SET status = ?, data_analise = NOW(), id_admin_analise = ?, observacoes_admin = ?
         WHERE id = ?`,
        [status, idAdmin, observacoes, id]
      );
      console.log('✅ Denúncia atualizada');

      // Registrar no histórico
      try {
        console.log('📝 Tentando inserir no histórico...');
        const [resultHistorico] = await connection.query(
          `INSERT INTO historico_denuncias 
           (id_denuncia, id_admin, acao, status_anterior, status_novo, observacoes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, idAdmin, 'análise', statusAnterior, status, observacoes]
        );
        console.log('✅ Histórico registrado - ID:', resultHistorico.insertId, 'Denúncia:', id, 'Ação: análise');
      } catch (error) {
        console.error('❌ Erro ao registrar histórico:', error.message);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ SQL State:', error.sqlState);
        throw error;
      }

      return await this.buscarPorId(id);
    });
  }

  static async processarDenuncia(id, idAdmin, acao, observacoes) {
    console.log('🔄 Iniciando processarDenuncia - Denúncia:', id, 'Admin:', idAdmin, 'Ação:', acao);
    return await pool.safeTransaction(async (connection) => {
      // Buscar denúncia DENTRO da transação
      const [denuncias] = await connection.query(`
        SELECT d.*, 
               denunciado.id as id_denunciado,
               a.id_clube as id_clube,
               d.id_atualizacao
        FROM denuncias d
        JOIN usuarios denunciado ON d.id_denunciado = denunciado.id
        JOIN atualizacoes a ON d.id_atualizacao = a.id
        WHERE d.id = ?
      `, [id]);

      const denuncia = denuncias[0];
      if (!denuncia) {
        throw new Error('Denúncia não encontrada');
      }

      // Buscar status anterior
      const statusAnterior = denuncia.status;
      console.log('📊 Status anterior:', statusAnterior, '→ Novo status: analisada');

      // Atualizar denúncia
      await connection.query(
        `UPDATE denuncias 
         SET status = 'analisada', data_analise = NOW(), id_admin_analise = ?, observacoes_admin = ?
         WHERE id = ?`,
        [idAdmin, observacoes, id]
      );
      console.log('✅ Denúncia atualizada');

      // Registrar no histórico
      try {
        console.log('📝 Tentando inserir no histórico...');
        const [resultHistorico] = await connection.query(
          `INSERT INTO historico_denuncias 
           (id_denuncia, id_admin, acao, status_anterior, status_novo, observacoes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, idAdmin, acao, statusAnterior, 'analisada', observacoes]
        );
        console.log('✅ Histórico registrado - ID:', resultHistorico.insertId, 'Denúncia:', id, 'Ação:', acao);
      } catch (error) {
        console.error('❌ Erro ao registrar histórico:', error.message);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ SQL State:', error.sqlState);
        console.error('❌ Stack:', error.stack);
        throw error;
      }

      // Executar ações específicas
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

      // Buscar denúncia atualizada DENTRO da transação
      const [denunciasAtualizadas] = await connection.query(`
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

      return denunciasAtualizadas[0] || null;
    });
  }

  static async contarPorStatus() {
    try {
      const [resultado] = await pool.safeQuery(`
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

  static async buscarHistorico(idDenuncia) {
    try {
      const [historico] = await pool.safeQuery(`
        SELECT h.*, 
               u.nome as nome_admin,
               u.email as email_admin
        FROM historico_denuncias h
        JOIN usuarios u ON h.id_admin = u.id
        WHERE h.id_denuncia = ?
        ORDER BY h.data_acao DESC
      `, [idDenuncia]);

      return historico;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
  }
}

module.exports = Denuncias;
