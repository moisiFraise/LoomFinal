const pool = require('../config/database');

class Comentarios {
    static async criar(idAtualizacao, idUsuario, conteudo, gifUrl = null) {
        try {
            const [result] = await pool.query(
                `INSERT INTO comentarios (id_atualizacao, id_usuario, conteudo, gif_url)
                 VALUES (?, ?, ?, ?)`,
                [idAtualizacao, idUsuario, conteudo, gifUrl]
            );
            
            return {
                id: result.insertId,
                idAtualizacao,
                idUsuario,
                conteudo,
                gifUrl,
                dataComentario: new Date()
            };
        } catch (error) {
            console.error('Erro ao criar comentário:', error);
            throw error;
        }
    }
    
    static async listarPorAtualizacao(idAtualizacao) {
        try {
            const [rows] = await pool.query(
                `SELECT c.*, u.nome as nome_usuario, u.foto_perfil
                 FROM comentarios c
                 JOIN usuarios u ON c.id_usuario = u.id
                 WHERE c.id_atualizacao = ?
                 ORDER BY c.data_comentario ASC`,
                [idAtualizacao]
            );
            
            return rows;
        } catch (error) {
            console.error('Erro ao listar comentários:', error);
            throw error;
        }
    }
    
    static async obterPorId(id) {
        try {
            const [rows] = await pool.query(
                `SELECT c.*, u.nome as nome_usuario, u.foto_perfil
                 FROM comentarios c
                 JOIN usuarios u ON c.id_usuario = u.id
                 WHERE c.id = ?`,
                [id]
            );
            
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Erro ao obter comentário por ID:', error);
            throw error;
        }
    }
    
    static async atualizar(id, conteudo, gifUrl = null) {
        try {
            const [result] = await pool.query(
                `UPDATE comentarios 
                 SET conteudo = ?, gif_url = ?, data_comentario = NOW()
                 WHERE id = ?`,
                [conteudo, gifUrl, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao atualizar comentário:', error);
            throw error;
        }
    }
    
    static async excluir(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM comentarios WHERE id = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao excluir comentário:', error);
            throw error;
        }
    }
    
    static async contarPorAtualizacao(idAtualizacao) {
        try {
            const [rows] = await pool.query(
                'SELECT COUNT(*) as total FROM comentarios WHERE id_atualizacao = ?',
                [idAtualizacao]
            );
            
            return rows[0].total;
        } catch (error) {
            console.error('Erro ao contar comentários:', error);
            throw error;
        }
    }
    
    static async verificarPermissao(idComentario, idUsuario) {
        try {
            const [rows] = await pool.query(
                'SELECT id_usuario FROM comentarios WHERE id = ?',
                [idComentario]
            );
            
            if (rows.length === 0) {
                return false;
            }
            
            return rows[0].id_usuario === idUsuario;
        } catch (error) {
            console.error('Erro ao verificar permissão do comentário:', error);
            throw error;
        }
    }
}

module.exports = Comentarios;
