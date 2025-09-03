const pool = require('../config/database');

class Atualizacoes {
    static async criar(idClube, idLeitura, idUsuario, conteudo, paginaAtual, totalPaginas, gifUrl = null, idEmocao = null) {
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
                `INSERT INTO atualizacoes (id_clube, id_leitura, id_usuario, conteudo, porcentagem_leitura, gif_url, id_emocao)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [idClube, idLeitura, idUsuario, conteudo, porcentagemLeitura, gifUrl, idEmocao]
            );
            
            return {
                id: result.insertId,
                idClube,
                idLeitura,
                idUsuario,
                conteudo,
                porcentagemLeitura,
                gifUrl,
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
                `SELECT a.*, u.nome as nome_usuario, u.foto_perfil, u.estado as estado_usuario,
                        e.nome as emocao_nome, e.emoji as emocao_emoji, e.cor as emocao_cor,
                        CASE 
                            WHEN p.id_usuario IS NULL THEN 1 
                            ELSE 0 
                        END as usuario_saiu_do_clube
                 FROM atualizacoes a
                 JOIN usuarios u ON a.id_usuario = u.id
                 LEFT JOIN emocoes e ON a.id_emocao = e.id
                 LEFT JOIN participacoes p ON u.id = p.id_usuario AND p.id_clube = ?
                 WHERE a.id_clube = ? AND a.id_leitura = ?
                 ORDER BY a.data_postagem DESC`,
                [idClube, idClube, idLeitura]
            );
            
            return rows;
        } catch (error) {
            console.error('Erro ao listar atualizações:', error);
            throw error;
        }
    }
        static async listarPorLeitura(idClube, idLeitura) {
        try {
            const [atualizacoes] = await pool.query(
                `SELECT a.*, u.nome as nome_usuario, u.foto_perfil, u.estado as estado_usuario,
                        e.nome as emocao_nome, e.emoji as emocao_emoji, e.cor as emocao_cor
                 FROM atualizacoes a
                 JOIN usuarios u ON a.id_usuario = u.id
                 LEFT JOIN emocoes e ON a.id_emocao = e.id
                 WHERE a.id_clube = ? AND a.id_leitura = ?
                 ORDER BY a.data_postagem DESC`,
                [idClube, idLeitura]
            );
            
            // Buscar estatísticas da leitura
            const [estatisticas] = await pool.query(
                `SELECT 
                    COUNT(DISTINCT a.id_usuario) as membros_participando,
                    AVG(a.porcentagem_leitura) as progresso_medio,
                    COUNT(a.id) as total_atualizacoes
                 FROM atualizacoes a
                 WHERE a.id_clube = ? AND a.id_leitura = ?`,
                [idClube, idLeitura]
            );
            
            return {
                atualizacoes,
                estatisticas: estatisticas[0] || {
                    membros_participando: 0,
                    progresso_medio: 0,
                    total_atualizacoes: 0
                }
            };
        } catch (error) {
            console.error('Erro ao listar atualizações por leitura:', error);
            throw error;
        }
    }
    
    static async obterPorId(id) {
        try {
            const [rows] = await pool.query(
                `SELECT a.*, u.nome as nome_usuario, u.foto_perfil, u.estado as estado_usuario,
                        e.nome as emocao_nome, e.emoji as emocao_emoji, e.cor as emocao_cor
                 FROM atualizacoes a
                 JOIN usuarios u ON a.id_usuario = u.id
                 LEFT JOIN emocoes e ON a.id_emocao = e.id
                 WHERE a.id = ?`,
                [id]
            );
            
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Erro ao obter atualização por ID:', error);
            throw error;
        }
    }
    
    static async atualizar(id, conteudo, paginaAtual, totalPaginas, gifUrl = null) {
        try {
            const porcentagemLeitura = Math.min(Math.round((paginaAtual / totalPaginas) * 100), 100);
            
            const [result] = await pool.query(
                `UPDATE atualizacoes 
                 SET conteudo = ?, porcentagem_leitura = ?, gif_url = ?, data_postagem = NOW()
                 WHERE id = ?`,
                [conteudo, porcentagemLeitura, gifUrl, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao atualizar atualização:', error);
            throw error;
        }
    }
    
    static async excluir(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM atualizacoes WHERE id = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao excluir atualização:', error);
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
    
    static async obterEstatisticasLeitura(idClube, idLeitura) {
        try {
            const [stats] = await pool.query(
                `SELECT 
                    COUNT(DISTINCT a.id_usuario) as membros_participando,
                    AVG(CASE WHEN a.porcentagem_leitura > 0 THEN a.porcentagem_leitura ELSE NULL END) as progresso_medio,
                    COUNT(a.id) as total_atualizacoes,
                    MAX(a.porcentagem_leitura) as maior_progresso,
                    MIN(CASE WHEN a.porcentagem_leitura > 0 THEN a.porcentagem_leitura ELSE NULL END) as menor_progresso
                 FROM atualizacoes a
                 WHERE a.id_clube = ? AND a.id_leitura = ?`,
                [idClube, idLeitura]
            );
            
            return stats[0] || {
                membros_participando: 0,
                progresso_medio: 0,
                total_atualizacoes: 0,
                maior_progresso: 0,
                menor_progresso: 0
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas da leitura:', error);
            throw error;
        }
    }
}

module.exports = Atualizacoes;

    
