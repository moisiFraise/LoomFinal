const pool = require('../config/database');

class AuditLog {
  /**
   * Registrar ação na auditoria
   * @param {number} userId - ID do usuário que realizou a ação
   * @param {string} acao - Tipo de ação (CREATE, READ, UPDATE, DELETE, etc)
   * @param {string} tabela - Tabela afetada
   * @param {object} dados - Dados envolvidos na ação
   * @param {string} ip - IP do cliente
   * @param {string} userAgent - User agent do navegador
   */
  static async registrar(userId, acao, tabela, dados = null, ip = null, userAgent = null) {
    try {
      const query = `
        INSERT INTO audit_logs 
        (id_usuario, acao, tabela, dados, ip, user_agent, criado_em)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      
      const dadosJSON = dados ? JSON.stringify(dados) : null;
      
      const [resultado] = await pool.safeQuery(query, [
        userId,
        acao,
        tabela,
        dadosJSON,
        ip,
        userAgent
      ]);
      
      return resultado;
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error);
      // Não lançar erro para não interromper a operação principal
      return null;
    }
  }

  /**
   * Buscar logs de auditoria
   * @param {object} filtros - Filtros de busca
   * @returns {Promise<Array>}
   */
  static async buscar(filtros = {}) {
    try {
      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const params = [];
      
      if (filtros.userId) {
        query += ' AND id_usuario = ?';
        params.push(filtros.userId);
      }
      
      if (filtros.acao) {
        query += ' AND acao = ?';
        params.push(filtros.acao);
      }
      
      if (filtros.tabela) {
        query += ' AND tabela = ?';
        params.push(filtros.tabela);
      }
      
      if (filtros.dataInicio) {
        query += ' AND criado_em >= ?';
        params.push(filtros.dataInicio);
      }
      
      if (filtros.dataFim) {
        query += ' AND criado_em <= ?';
        params.push(filtros.dataFim);
      }
      
      query += ' ORDER BY criado_em DESC LIMIT 1000';
      
      const [logs] = await pool.safeQuery(query, params);
      
      return logs.map(log => {
        if (log.dados) {
          try {
            log.dados = JSON.parse(log.dados);
          } catch (e) {
            // Deixar como string se falhar parsing
          }
        }
        return log;
      });
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      return [];
    }
  }

  /**
   * Buscar logs de um usuário específico
   */
  static async buscarPorUsuario(userId, limite = 100) {
    try {
      const query = `
        SELECT * FROM audit_logs 
        WHERE id_usuario = ?
        ORDER BY criado_em DESC
        LIMIT ?
      `;
      
      const [logs] = await pool.safeQuery(query, [userId, limite]);
      
      return logs.map(log => {
        if (log.dados) {
          try {
            log.dados = JSON.parse(log.dados);
          } catch (e) {}
        }
        return log;
      });
    } catch (error) {
      console.error('Erro ao buscar logs do usuário:', error);
      return [];
    }
  }

  /**
   * Buscar atividade suspeita
   */
  static async buscarAtividadeSuspeita(horas = 24) {
    try {
      const query = `
        SELECT 
          id_usuario,
          acao,
          COUNT(*) as tentativas,
          GROUP_CONCAT(DISTINCT ip) as ips
        FROM audit_logs
        WHERE 
          criado_em >= DATE_SUB(NOW(), INTERVAL ? HOUR)
          AND acao IN ('DELETE', 'UPDATE_SENSITIVE', 'LOGIN_FALHOU')
        GROUP BY id_usuario, acao
        HAVING tentativas > 5
        ORDER BY tentativas DESC
      `;
      
      const [logs] = await pool.safeQuery(query, [horas]);
      return logs;
    } catch (error) {
      console.error('Erro ao buscar atividade suspeita:', error);
      return [];
    }
  }

  /**
   * Limpar logs antigos (mais de X dias)
   */
  static async limparAntigos(dias = 90) {
    try {
      const query = `
        DELETE FROM audit_logs
        WHERE criado_em < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      
      const [resultado] = await pool.safeQuery(query, [dias]);
      return resultado.affectedRows;
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
      return 0;
    }
  }

  /**
   * Exportar logs para arquivo
   */
  static async exportar(filtros = {}) {
    const logs = await this.buscar(filtros);
    
    return {
      exportado_em: new Date().toISOString(),
      total: logs.length,
      logs: logs
    };
  }

  /**
   * Gerar relatório de segurança
   */
  static async gerarRelatoriSeguranca(dataInicio, dataFim) {
    try {
      const query = `
        SELECT 
          acao,
          COUNT(*) as total,
          COUNT(DISTINCT id_usuario) as usuarios_unicos,
          COUNT(DISTINCT ip) as ips_unicos
        FROM audit_logs
        WHERE criado_em BETWEEN ? AND ?
        GROUP BY acao
        ORDER BY total DESC
      `;
      
      const [estatisticas] = await pool.safeQuery(query, [dataInicio, dataFim]);
      
      // Buscar atividade suspeita
      const atividadeSuspeita = await this.buscarAtividadeSuspeita(
        Math.ceil((new Date() - new Date(dataInicio)) / (1000 * 60 * 60))
      );
      
      return {
        periodo: {
          inicio: dataInicio,
          fim: dataFim
        },
        estatisticas,
        atividadeSuspeita,
        gerado_em: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de segurança:', error);
      return null;
    }
  }
}

module.exports = AuditLog;
