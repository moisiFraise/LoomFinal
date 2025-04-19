const pool = require('../config/database');

class Atualizacoes {
    static async criar(idClube, idLeitura, idUsuario, conteudo, paginaAtual, totalPaginas) {
        try {
            const [ultimaAtualizacao] = await pool.query(
                `SELECT * FROM atualizacoes 
                 WHERE id_clube = ? AND id_leitura = ? AND id_usuario = ?
                 ORDER BY data_postagem DESC LIMIT 1`,
                [idClube, idLeitura, idUsuario]
            );
            
            const porcentagemLeitura = Math.min(Math.round((paginaAtual / totalPaginas) * 100), 100);
            
            if (ultimaAtualizacao.length > 0 && ultimaAtualizacao[0].porcentagem_leitura === 100) {
                throw new Error('Você já completou esta leitura');
            }
            
            const [result] = await pool.query(
                `INSERT INTO atualizacoes (id_clube, id_leitura, id_usuario, conteudo, porcentagem_leitura)
                 VALUES (?, ?, ?, ?, ?)`,
                [idClube, idLeitura, idUsuario, conteudo, porcentagemLeitura]
            );
            
            return {
                id: result.insertId,
                idClube,
                idLeitura,
                idUsuario,
                conteudo,
                porcentagemLeitura,
                dataPostagem: new Date()
            };
        } catch (error) {
            console.error('Erro ao criar atualização:', error);
            throw error;
        }
    }
    
    static async listarPorClube(idClube, idLeitura) {
        try {
            const [rows] = await pool.query(
                `SELECT a.*, u.nome as nome_usuario
                 FROM atualizacoes a
                 JOIN usuarios u ON a.id_usuario = u.id
                 WHERE a.id_clube = ? AND a.id_leitura = ?
                 ORDER BY a.data_postagem DESC`,
                [idClube, idLeitura]
            );
            
            return rows;
        } catch (error) {
            console.error('Erro ao listar atualizações:', error);
            throw error;
        }
    }
    
    static async verificarUltimaAtualizacao(idUsuario, idLeitura) {
        try {
            const [rows] = await pool.query(
                `SELECT * FROM atualizacoes
                 WHERE id_usuario = ? AND id_leitura = ?
                 ORDER BY data_postagem DESC LIMIT 1`,
                [idUsuario, idLeitura]
            );
            
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Erro ao verificar última atualização:', error);
            throw error;
        }
    }
}

module.exports = Atualizacoes;
