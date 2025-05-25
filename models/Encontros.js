const pool = require('../config/database');

class Encontros {
  static async criar(idClube, titulo, descricao, dataEncontro, horaInicio, horaFim, local, link, tipo) {
    try {
        const query = `INSERT INTO encontros 
            (id_clube, titulo, descricao, data_encontro, hora_inicio, hora_fim, local, link, tipo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            parseInt(idClube), 
            titulo, 
            descricao || '', 
            dataEncontro, 
            horaInicio, 
            horaFim || null, 
            local || null, 
            link || null, 
            tipo
        ];
        
        const [result] = await pool.query(query, params);
        
        return { 
            id: result.insertId, 
            id_clube: idClube, 
            titulo, 
            descricao, 
            data_encontro: dataEncontro, 
            hora_inicio: horaInicio, 
            hora_fim: horaFim, 
            local, 
            link, 
            tipo 
        };
    } catch (error) {
        throw error;
    }
}

    static async listarPorClube(idClube) {
        try {
            const [rows] = await pool.query(
                `SELECT * FROM encontros 
                WHERE id_clube = ? 
                ORDER BY data_encontro ASC, hora_inicio ASC`,
                [idClube]
            );
            
            return rows;
        } catch (error) {
            console.error('Erro ao listar encontros do clube:', error);
            throw error;
        }
    }

    static async listarProximos(idClube) {
        try {
            const [rows] = await pool.query(
                `SELECT * FROM encontros 
                WHERE id_clube = ? AND data_encontro >= CURDATE() 
                ORDER BY data_encontro ASC, hora_inicio ASC 
                LIMIT 5`,
                [idClube]
            );
            
            return rows;
        } catch (error) {
            console.error('Erro ao listar próximos encontros:', error);
            throw error;
        }
    }

    static async buscarPorId(id) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM encontros WHERE id = ?',
                [id]
            );
            
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Erro ao buscar encontro por ID:', error);
            throw error;
        }
    }

    static async atualizar(id, titulo, descricao, dataEncontro, horaInicio, horaFim, local, link, tipo) {
        try {
            await pool.query(
                `UPDATE encontros SET 
                titulo = ?, descricao = ?, data_encontro = ?, 
                hora_inicio = ?, hora_fim = ?, local = ?, 
                link = ?, tipo = ? 
                WHERE id = ?`,
                [titulo, descricao, dataEncontro, horaInicio, horaFim, local, link, tipo, id]
            );
            
            return { id, titulo, descricao, dataEncontro, horaInicio, horaFim, local, link, tipo };
        } catch (error) {
            console.error('Erro ao atualizar encontro:', error);
            throw error;
        }
    }

    static async excluir(id) {
        try {
            await pool.query('DELETE FROM encontros WHERE id = ?', [id]);
            return true;
        } catch (error) {
            console.error('Erro ao excluir encontro:', error);
            throw error;
        }
    }

    static async confirmarParticipacao(idEncontro, idUsuario, status) {
        try {
            const [existente] = await pool.query(
                'SELECT * FROM participantes_encontro WHERE id_encontro = ? AND id_usuario = ?',
                [idEncontro, idUsuario]
            );
            
            if (existente.length > 0) {
                await pool.query(
                    'UPDATE participantes_encontro SET status = ? WHERE id_encontro = ? AND id_usuario = ?',
                    [status, idEncontro, idUsuario]
                );
            } else {
                await pool.query(
                    'INSERT INTO participantes_encontro (id_encontro, id_usuario, status) VALUES (?, ?, ?)',
                    [idEncontro, idUsuario, status]
                );
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao confirmar participação:', error);
            throw error;
        }
    }

    static async listarParticipantes(idEncontro) {
        try {
            const [rows] = await pool.query(
                `SELECT pe.*, u.nome, u.email 
                FROM participantes_encontro pe
                JOIN usuarios u ON pe.id_usuario = u.id
                WHERE pe.id_encontro = ?
                ORDER BY pe.status, u.nome`,
                [idEncontro]
            );
            
            return rows;
        } catch (error) {
            console.error('Erro ao listar participantes do encontro:', error);
            throw error;
        }
    }

    static async verificarParticipacao(idEncontro, idUsuario) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM participantes_encontro WHERE id_encontro = ? AND id_usuario = ?',
                [idEncontro, idUsuario]
            );
            
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Erro ao verificar participação:', error);
            throw error;
        }
    }
    static async debug() {
  try {
    const [result] = await pool.query('SELECT 1 as test');
    console.log('Conexão com o banco OK:', result);
    
    const [columns] = await pool.query('SHOW COLUMNS FROM encontros');
    console.log('Estrutura da tabela encontros:', columns);
    
    const [rows] = await pool.query('SELECT * FROM encontros LIMIT 5');
    console.log('Dados existentes na tabela encontros:', rows);
    
    return { success: true, message: 'Debug concluído com sucesso' };
  } catch (error) {
    console.error('Erro no debug de Encontros:', error);
    return { success: false, error: error.message };
  }
}
}

module.exports = Encontros;