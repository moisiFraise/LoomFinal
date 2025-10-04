const pool = require('../config/database');

class Chat {
  static async criarMensagem(idClube, idUsuario, mensagem) {
    const [result] = await pool.safeQuery(
      'INSERT INTO mensagens_chat (id_clube, id_usuario, mensagem) VALUES (?, ?, ?)',
      [idClube, idUsuario, mensagem]
    );
    
    return this.buscarPorId(result.insertId);
  }

  static async buscarPorId(id) {
    const [rows] = await pool.safeQuery(`
      SELECT 
        mc.id,
        mc.id_clube,
        mc.id_usuario,
        mc.mensagem,
        mc.data_envio,
        mc.editada,
        mc.data_edicao,
        mc.excluida,
        u.nome AS nome_usuario,
        u.foto_perfil AS foto_usuario
      FROM mensagens_chat mc
      JOIN usuarios u ON mc.id_usuario = u.id
      WHERE mc.id = ?
    `, [id]);
    
    return rows[0] || null;
  }

  static async listarPorClube(idClube, limite = 100, offset = 0) {
    const [rows] = await pool.safeQuery(`
      SELECT 
        mc.id,
        mc.id_clube,
        mc.id_usuario,
        mc.mensagem,
        mc.data_envio,
        mc.editada,
        mc.data_edicao,
        mc.excluida,
        u.nome AS nome_usuario,
        u.foto_perfil AS foto_usuario
      FROM mensagens_chat mc
      JOIN usuarios u ON mc.id_usuario = u.id
      WHERE mc.id_clube = ?
      ORDER BY mc.data_envio DESC
      LIMIT ? OFFSET ?
    `, [idClube, limite, offset]);
    
    return rows.reverse();
  }

  static async editarMensagem(id, mensagem) {
    const [result] = await pool.safeQuery(
      'UPDATE mensagens_chat SET mensagem = ?, editada = TRUE, data_edicao = NOW() WHERE id = ?',
      [mensagem, id]
    );
    
    return result.affectedRows > 0;
  }

  static async excluirMensagem(id) {
    const [result] = await pool.safeQuery(
      'UPDATE mensagens_chat SET excluida = TRUE WHERE id = ?',
      [id]
    );
    
    return result.affectedRows > 0;
  }

  static async verificarPermissao(idMensagem, idUsuario) {
    const [rows] = await pool.safeQuery(
      'SELECT id_usuario FROM mensagens_chat WHERE id = ?',
      [idMensagem]
    );
    
    if (rows.length === 0) return false;
    return rows[0].id_usuario === idUsuario;
  }
}

module.exports = Chat;
