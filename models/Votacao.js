const pool = require('../config/database');

class Votacao {
    static async criarVotacao(idClube, titulo, descricao, dataFim, sugestoes) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const [resultVotacao] = await connection.query(
                'INSERT INTO votacoes (id_clube, titulo, descricao, data_inicio, data_fim) VALUES (?, ?, ?, NOW(), ?)',
                [idClube, titulo, descricao, dataFim]
            );
            
            const votacaoId = resultVotacao.insertId;
            
            for (const sugestaoId of sugestoes) {
                await connection.query(
                    'INSERT INTO opcoes_votacao (id_votacao, id_sugestao) VALUES (?, ?)',
                    [votacaoId, sugestaoId]
                );
            }
            
            await connection.commit();
            
            return await this.buscarVotacaoPorId(votacaoId);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    static async buscarVotacaoAtiva(idClube) {
        try {
            const [votacoes] = await pool.query(
                'SELECT * FROM votacoes WHERE id_clube = ? AND encerrada = FALSE ORDER BY data_inicio DESC LIMIT 1',
                [idClube]
            );
            
            if (votacoes.length === 0) {
                return null;
            }
            
            const votacao = votacoes[0];
            
            const [opcoes] = await pool.query(`
                SELECT 
                    ov.id as opcao_id,
                    ov.id_sugestao as sugestao_id,
                    s.titulo,
                    s.autor,
                    s.imagemUrl,
                    s.paginas,
                    u.nome as nome_usuario,
                    COUNT(v.id) as votos
                FROM opcoes_votacao ov
                JOIN sugestoes s ON ov.id_sugestao = s.id
                JOIN usuarios u ON s.id_usuario = u.id
                LEFT JOIN votos v ON ov.id = v.id_opcao
                WHERE ov.id_votacao = ?
                GROUP BY ov.id, ov.id_sugestao, s.titulo, s.autor, s.imagemUrl, s.paginas, u.nome
                ORDER BY votos DESC, s.titulo
            `, [votacao.id]);
            
            const [totalVotos] = await pool.query(
                'SELECT COUNT(*) as total FROM votos WHERE id_votacao = ?',
                [votacao.id]
            );
            
            votacao.opcoes = opcoes;
            votacao.total_votos = totalVotos[0].total;
            
            return votacao;
        } catch (error) {
            throw error;
        }
    }
    
    static async buscarVotacaoPorId(id) {
        try {
            const [votacoes] = await pool.query(
                'SELECT * FROM votacoes WHERE id = ?',
                [id]
            );
            
            if (votacoes.length === 0) {
                return null;
            }
            
            const votacao = votacoes[0];
            
            const [opcoes] = await pool.query(`
                SELECT 
                    ov.id as opcao_id,
                    ov.id_sugestao as sugestao_id,
                    s.titulo,
                    s.autor,
                    s.imagemUrl,
                    s.paginas,
                    u.nome as nome_usuario,
                    COUNT(v.id) as votos
                FROM opcoes_votacao ov
                JOIN sugestoes s ON ov.id_sugestao = s.id
                JOIN usuarios u ON s.id_usuario = u.id
                LEFT JOIN votos v ON ov.id = v.id_opcao
                WHERE ov.id_votacao = ?
                GROUP BY ov.id, ov.id_sugestao, s.titulo, s.autor, s.imagemUrl, s.paginas, u.nome
                ORDER BY votos DESC, s.titulo
            `, [id]);
            
            const [totalVotos] = await pool.query(
                'SELECT COUNT(*) as total FROM votos WHERE id_votacao = ?',
                [id]
            );
            
            votacao.opcoes = opcoes;
            votacao.total_votos = totalVotos[0].total;
            
            return votacao;
        } catch (error) {
            throw error;
        }
    }
    
    static async verificarVotoUsuario(idVotacao, idUsuario) {
        try {
            const [votos] = await pool.query(
                'SELECT id_opcao FROM votos WHERE id_votacao = ? AND id_usuario = ?',
                [idVotacao, idUsuario]
            );
            
            return votos.length > 0 ? votos[0].id_opcao : null;
        } catch (error) {
            throw error;
        }
    }
    
    static async votar(idVotacao, idUsuario, idOpcao) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const [votacoes] = await connection.query(
                'SELECT * FROM votacoes WHERE id = ? AND encerrada = FALSE',
                [idVotacao]
            );
            
            if (votacoes.length === 0) {
                throw new Error('Votação não encontrada ou já encerrada');
            }
            
            const [opcoes] = await connection.query(
                'SELECT * FROM opcoes_votacao WHERE id = ? AND id_votacao = ?',
                [idOpcao, idVotacao]
            );
            
            if (opcoes.length === 0) {
                throw new Error('Opção de voto inválida');
            }
            
            await connection.query(
                'DELETE FROM votos WHERE id_votacao = ? AND id_usuario = ?',
                [idVotacao, idUsuario]
            );
            
            await connection.query(
                'INSERT INTO votos (id_votacao, id_usuario, id_opcao) VALUES (?, ?, ?)',
                [idVotacao, idUsuario, idOpcao]
            );
            
            await connection.commit();
            
            return { sucesso: true };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    static async encerrarVotacao(idVotacao) {
        try {
            await pool.query(
                'UPDATE votacoes SET encerrada = TRUE WHERE id = ?',
                [idVotacao]
            );
            
            return await this.buscarResultadoVotacao(idVotacao);
        } catch (error) {
            throw error;
        }
    }
    
    static async buscarResultadoVotacao(idVotacao) {
        try {
            const [votacao] = await pool.query(
                'SELECT * FROM votacoes WHERE id = ?',
                [idVotacao]
            );
            
            if (votacao.length === 0) {
                throw new Error('Votação não encontrada');
            }
            
            const [opcoes] = await pool.query(`
                SELECT 
                    ov.id as opcao_id,
                    ov.id_sugestao as sugestao_id,
                    s.titulo,
                    s.autor,
                    s.imagemUrl,
                    s.paginas,
                    u.nome as nome_usuario,
                    COUNT(v.id) as votos
                FROM opcoes_votacao ov
                JOIN sugestoes s ON ov.id_sugestao = s.id
                JOIN usuarios u ON s.id_usuario = u.id
                LEFT JOIN votos v ON ov.id = v.id_opcao
                WHERE ov.id_votacao = ?
                GROUP BY ov.id, ov.id_sugestao, s.titulo, s.autor, s.imagemUrl, s.paginas, u.nome
                ORDER BY votos DESC, s.titulo
            `, [idVotacao]);
            
            const [totalVotos] = await pool.query(
                'SELECT COUNT(*) as total FROM votos WHERE id_votacao = ?',
                [idVotacao]
            );
            
            return {
                votacao: votacao[0],
                opcoes,
                total_votos: totalVotos[0].total,
                vencedora: opcoes.length > 0 ? opcoes[0] : null
            };
        } catch (error) {
            throw error;
        }
    }
    
    static async buscarHistoricoVotacoes(idClube) {
        try {
            const [votacoes] = await pool.query(
                'SELECT * FROM votacoes WHERE id_clube = ? ORDER BY data_inicio DESC',
                [idClube]
            );
            
            for (let votacao of votacoes) {
                const [opcaoVencedora] = await pool.query(`
                    SELECT 
                        s.titulo,
                        s.autor,
                        COUNT(v.id) as votos
                    FROM opcoes_votacao ov
                    JOIN sugestoes s ON ov.id_sugestao = s.id
                    LEFT JOIN votos v ON ov.id = v.id_opcao
                    WHERE ov.id_votacao = ?
                    GROUP BY ov.id, s.titulo, s.autor
                    ORDER BY votos DESC
                    LIMIT 1
                `, [votacao.id]);
                
                votacao.vencedora = opcaoVencedora.length > 0 ? opcaoVencedora[0] : null;
            }
            
            return votacoes;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Votacao;
