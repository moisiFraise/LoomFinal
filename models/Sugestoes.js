const pool = require('../config/database');

class Sugestoes {
    static async criar(idClube, idUsuario, titulo, autor = null, justificativa = null, imagemUrl = null, paginas = null) {
        try {
            const [result] = await pool.query(
                'INSERT INTO sugestoes (id_clube, id_usuario, titulo, autor, justificativa, imagemUrl, paginas) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [idClube, idUsuario, titulo, autor, justificativa, imagemUrl, paginas]
            );
            
            const [novaSugestao] = await pool.query(
                'SELECT s.*, u.nome as nome_usuario FROM sugestoes s JOIN usuarios u ON s.id_usuario = u.id WHERE s.id = ?',
                [result.insertId]
            );
            
            return novaSugestao[0];
        } catch (error) {
            console.error('Erro ao criar sugestão:', error);
            throw error;
        }
    }
    
    static async listarPorClube(idClube) {
        try {
            const [sugestoes] = await pool.query(`
                SELECT s.*, u.nome as nome_usuario, u.foto_perfil
                FROM sugestoes s
                JOIN usuarios u ON s.id_usuario = u.id
                WHERE s.id_clube = ?
                ORDER BY s.data_sugestao DESC
            `, [idClube]);
            
            return sugestoes;
        } catch (error) {
            console.error('Erro ao listar sugestões:', error);
            throw error;
        }
    }
    
    static async buscarPorId(id) {
        try {
            const [sugestoes] = await pool.query(
                'SELECT s.*, u.nome as nome_usuario FROM sugestoes s JOIN usuarios u ON s.id_usuario = u.id WHERE s.id = ?',
                [id]
            );
            
            return sugestoes[0] || null;
        } catch (error) {
            console.error('Erro ao buscar sugestão:', error);
            throw error;
        }
    }
    
    static async excluir(id) {
        try {
            await pool.query('DELETE FROM sugestoes WHERE id = ?', [id]);
            return true;
        } catch (error) {
            console.error('Erro ao excluir sugestão:', error);
            throw error;
        }
    }
    
    static async atualizar(id, titulo, autor = null, justificativa = null, imagemUrl = null, paginas = null) {
        try {
            await pool.query(
                'UPDATE sugestoes SET titulo = ?, autor = ?, justificativa = ?, imagemUrl = ?, paginas = ? WHERE id = ?',
                [titulo, autor, justificativa, imagemUrl, paginas, id]
            );
            
            return await this.buscarPorId(id);
        } catch (error) {
            console.error('Erro ao atualizar sugestão:', error);
            throw error;
        }
    }
}

module.exports = Sugestoes;
