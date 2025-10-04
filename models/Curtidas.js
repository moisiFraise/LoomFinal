const pool = require('../config/database');

class Curtidas {
    static async curtir(idAtualizacao, idUsuario) {
        try {
            // Verificar se já curtiu
            const [existente] = await pool.safeQuery(
                'SELECT * FROM curtidas WHERE id_atualizacao = ? AND id_usuario = ?',
                [idAtualizacao, idUsuario]
            );
            
            if (existente.length > 0) {
                // Se já curtiu, remove a curtida (descurtir)
                await pool.safeQuery(
                    'DELETE FROM curtidas WHERE id_atualizacao = ? AND id_usuario = ?',
                    [idAtualizacao, idUsuario]
                );
                return { curtido: false, total: await this.contarCurtidas(idAtualizacao) };
            } else {
                // Se não curtiu, adiciona a curtida
                await pool.safeQuery(
                    'INSERT INTO curtidas (id_atualizacao, id_usuario) VALUES (?, ?)',
                    [idAtualizacao, idUsuario]
                );
                return { curtido: true, total: await this.contarCurtidas(idAtualizacao) };
            }
        } catch (error) {
            console.error('Erro ao curtir/descurtir:', error);
            throw error;
        }
    }
    
    static async contarCurtidas(idAtualizacao) {
        try {
            const [result] = await pool.safeQuery(
                'SELECT COUNT(*) as total FROM curtidas WHERE id_atualizacao = ?',
                [idAtualizacao]
            );
            return result[0].total;
        } catch (error) {
            console.error('Erro ao contar curtidas:', error);
            throw error;
        }
    }
    
    static async verificarCurtida(idAtualizacao, idUsuario) {
        try {
            const [rows] = await pool.safeQuery(
                'SELECT * FROM curtidas WHERE id_atualizacao = ? AND id_usuario = ?',
                [idAtualizacao, idUsuario]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('Erro ao verificar curtida:', error);
            throw error;
        }
    }
    
    static async listarCurtidasPorAtualizacao(idAtualizacao) {
        try {
            const [rows] = await pool.safeQuery(
                `SELECT c.*, u.nome as nome_usuario 
                 FROM curtidas c
                 JOIN usuarios u ON c.id_usuario = u.id
                 WHERE c.id_atualizacao = ?
                 ORDER BY c.data_curtida DESC`,
                [idAtualizacao]
            );
            return rows;
        } catch (error) {
            console.error('Erro ao listar curtidas por atualização:', error);
            throw error;
        }
    }
    
    static async listarTodasCurtidas() {
        try {
            const [rows] = await pool.safeQuery(
                `SELECT c.*, 
                 u.nome as nome_usuario,
                 a.id_clube,
                 a.conteudo as conteudo_atualizacao
                 FROM curtidas c
                 JOIN usuarios u ON c.id_usuario = u.id
                 JOIN atualizacoes a ON c.id_atualizacao = a.id
                 ORDER BY c.data_curtida DESC`
            );
            return rows;
        } catch (error) {
            console.error('Erro ao listar todas as curtidas:', error);
            throw error;
        }
    }
    
    static async listarCurtidasPorUsuario(idUsuario) {
        try {
            const [rows] = await pool.safeQuery(
                `SELECT c.*, 
                 a.conteudo as conteudo_atualizacao,
                 a.id_clube,
                 cl.nome as nome_clube
                 FROM curtidas c
                 JOIN atualizacoes a ON c.id_atualizacao = a.id
                 JOIN clubes cl ON a.id_clube = cl.id
                 WHERE c.id_usuario = ?
                 ORDER BY c.data_curtida DESC`,
                [idUsuario]
            );
            return rows;
        } catch (error) {
            console.error('Erro ao listar curtidas por usuário:', error);
            throw error;
        }
    }
    
    static async listarCurtidasPorClube(idClube) {
        try {
            const [rows] = await pool.safeQuery(
                `SELECT c.*, 
                 u.nome as nome_usuario,
                 a.conteudo as conteudo_atualizacao
                 FROM curtidas c
                 JOIN usuarios u ON c.id_usuario = u.id
                 JOIN atualizacoes a ON c.id_atualizacao = a.id
                 WHERE a.id_clube = ?
                 ORDER BY c.data_curtida DESC`,
                [idClube]
            );
            return rows;
        } catch (error) {
            console.error('Erro ao listar curtidas por clube:', error);
            throw error;
        }
    }
}

module.exports = Curtidas;
