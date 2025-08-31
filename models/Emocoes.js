const pool = require('../config/database');

class Emocoes {
    static async listarTodas() {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM emocoes WHERE ativo = TRUE ORDER BY nome ASC'
            );
            return rows;
        } catch (error) {
            console.error('Erro ao listar emoções:', error);
            throw error;
        }
    }

    static async listarTodasAdmin() {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM emocoes ORDER BY data_criacao DESC'
            );
            return rows;
        } catch (error) {
            console.error('Erro ao listar emoções (admin):', error);
            throw error;
        }
    }

    static async buscarPorId(id) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM emocoes WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Erro ao buscar emoção por ID:', error);
            throw error;
        }
    }

    static async criar(nome, emoji, cor = '#6c5ce7') {
        try {
            const [result] = await pool.query(
                'INSERT INTO emocoes (nome, emoji, cor) VALUES (?, ?, ?)',
                [nome, emoji, cor]
            );
            
            return {
                id: result.insertId,
                nome,
                emoji,
                cor,
                ativo: true
            };
        } catch (error) {
            console.error('Erro ao criar emoção:', error);
            throw error;
        }
    }

    static async atualizar(id, dados) {
        try {
            const { nome, emoji, cor, ativo } = dados;
            
            await pool.query(
                'UPDATE emocoes SET nome = ?, emoji = ?, cor = ?, ativo = ? WHERE id = ?',
                [nome, emoji, cor, ativo, id]
            );
            
            return await this.buscarPorId(id);
        } catch (error) {
            console.error('Erro ao atualizar emoção:', error);
            throw error;
        }
    }

    static async remover(id) {
        try {
            await pool.query('DELETE FROM emocoes WHERE id = ?', [id]);
            return true;
        } catch (error) {
            console.error('Erro ao remover emoção:', error);
            throw error;
        }
    }

    static async ativarDesativar(id, ativo) {
        try {
            await pool.query(
                'UPDATE emocoes SET ativo = ? WHERE id = ?',
                [ativo, id]
            );
            return await this.buscarPorId(id);
        } catch (error) {
            console.error('Erro ao ativar/desativar emoção:', error);
            throw error;
        }
    }
}

module.exports = Emocoes;
