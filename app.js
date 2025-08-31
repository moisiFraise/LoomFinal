const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();
const session = require('express-session');
const pool = require('./config/database');
const MySQLStore = require('express-mysql-session')(session);
const fs = require('fs');
const multer = require('multer');
const streamifier = require('streamifier');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const Usuario = require('./models/Usuario');
const Categorias = require('./models/Categorias');
const Explorar = require('./models/Explorar');
const Clube = require('./models/Clube');
const Leituras = require('./models/Leituras');
const Atualizacoes = require('./models/Atualizacoes');
const Curtidas = require('./models/Curtidas');
const Encontros = require('./models/Encontros');
const Denuncias = require('./models/Denuncias');
const Votacao = require('./models/Votacao');
const Comentarios = require('./models/Comentarios');



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Configurar Content-Type para manifest.json
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('manifest.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

app.use(fileUpload({
  useTempFiles: false,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  abortOnLimit: true,
  createParentPath: true
}));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutos
  expiration: 86400000, // 24 horas
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
});

// Testar conexão do store
sessionStore.onReady(() => {
  console.log('MySQLStore conectado e pronto');
});

sessionStore.on('error', (error) => {
  console.error('Erro no MySQLStore:', error);
});

app.use(session({
  key: 'loom_session',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true, // Renovar cookie a cada requisição
  cookie: { 
    secure: false, // true apenas em HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: 'lax'
  }
}));

const requiredEnvVars = [
  'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 
  'SESSION_SECRET', 'CLOUDINARY_CLOUD_NAME', 
  'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'GIPHY_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Variáveis de ambiente ausentes:', missingEnvVars.join(', '));
}

function verificarAutenticacao(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/autenticacao');
  }
  
  // Verificar se a sessão ainda é válida (não expirada)
  if (req.session.cookie && req.session.cookie.expires) {
    const now = new Date();
    const expires = new Date(req.session.cookie.expires);
    
    if (expires <= now) {
      console.log('Sessão expirada detectada, forçando logout');
      req.session.destroy(() => {
        res.clearCookie('loom_session');
        return res.redirect('/autenticacao');
      });
      return;
    }
  }
  
  // Headers anti-cache extremamente agressivos
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toISOString(),
    'ETag': Date.now().toString()
  });
  
  next();
}

// Middleware para verificar se admin está tentando acessar página restrita
async function verificarRestricaoAdmin(req, res, next) {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    
    if (usuario && usuario.tipo === 'admin') {
      console.log('Admin tentando acessar página restrita, redirecionando para painel admin');
      return res.redirect('/painelAdmin');
    }
    
    next();
  } catch (error) {
    console.error('Erro ao verificar restrição de admin:', error);
    next();
  }
}

app.get('/', (req, res) => {
  res.render('index', { title: 'Loom - Home' });
});

app.get('/autenticacao', (req, res) => {
  // Sempre limpar tudo ao acessar página de login
  req.session.destroy(() => {
    res.clearCookie('loom_session');
    res.clearCookie('connect.sid');
    
    // Headers extremamente agressivos para evitar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toISOString(),
      'ETag': Date.now().toString(),
      'Vary': 'Cookie, Authorization'
    });
    
    res.render('autenticacao', { titulo: 'Loom - Login e Cadastro' });
  });
});

app.post('/logout', (req, res) => {
  // Logout simples e direto
  req.session.destroy(() => {
    // Limpar todos os cookies possíveis
    res.clearCookie('loom_session');
    res.clearCookie('connect.sid');
    
    // Headers para evitar cache da resposta
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({ success: true });
  });
});

app.get('/api/session-check', (req, res) => {
  res.json({
    sessionExists: !!req.session,
    userId: req.session.userId,
    authenticated: req.session.authenticated,
    sessionID: req.sessionID
  });
});

// Debug: verificar participação do usuário em um clube
app.get('/api/debug/clube/:id/participacao', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [userId, clubeId]
    );
    
    const [clube] = await pool.query('SELECT * FROM clubes WHERE id = ?', [clubeId]);
    
    res.json({
      userId: userId,
      clubeId: clubeId,
      clubeExists: clube.length > 0,
      isMember: participacoes.length > 0,
      participacao: participacoes[0] || null,
      clube: clube[0] || null
    });
  } catch (error) {
    console.error('Erro ao verificar participação:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// Debug: limpar participações órfãs
app.post('/api/debug/cleanup-participacoes', verificarAutenticacao, async (req, res) => {
  try {
    // Remover participações de clubes que não existem mais
    const [resultado1] = await pool.query(`
      DELETE p FROM participacoes p 
      LEFT JOIN clubes c ON p.id_clube = c.id 
      WHERE c.id IS NULL
    `);
    
    // Remover participações de usuários que não existem mais
    const [resultado2] = await pool.query(`
      DELETE p FROM participacoes p 
      LEFT JOIN usuarios u ON p.id_usuario = u.id 
      WHERE u.id IS NULL
    `);
    
    res.json({
      clubesOrfaosRemovidos: resultado1.affectedRows,
      usuariosOrfaosRemovidos: resultado2.affectedRows,
      success: true
    });
  } catch (error) {
    console.error('Erro ao limpar participações:', error);
    res.status(500).json({ erro: 'Erro ao limpar participações' });
  }
});

// Debug: investigar sessões no banco
app.get('/api/debug/sessions', async (req, res) => {
  try {
    const [sessions] = await pool.query('SELECT * FROM sessions ORDER BY expires DESC');
    
    // Extrair dados das sessões
    const sessionsData = sessions.map(session => {
      try {
        const data = JSON.parse(session.data);
        return {
          session_id: session.session_id,
          expires: session.expires,
          userId: data.userId || null,
          userType: data.userType || null,
          email: data.email || null,
          authenticated: data.authenticated || false,
          isExpired: new Date() > new Date(session.expires),
          raw: session.data
        };
      } catch (e) {
        return {
          session_id: session.session_id,
          expires: session.expires,
          error: 'Invalid JSON data',
          raw: session.data
        };
      }
    });
    
    // Contar sessões por usuário
    const userSessions = {};
    sessionsData.forEach(s => {
      if (s.userId) {
        if (!userSessions[s.userId]) userSessions[s.userId] = 0;
        userSessions[s.userId]++;
      }
    });
    
    res.json({
      totalSessions: sessions.length,
      activeSessions: sessionsData.filter(s => !s.isExpired).length,
      expiredSessions: sessionsData.filter(s => s.isExpired).length,
      userSessions,
      currentSessionId: req.sessionID,
      currentUserId: req.session.userId,
      sessions: sessionsData
    });
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    res.status(500).json({ erro: 'Erro ao buscar sessões' });
  }
});

// Debug: limpar sessões expiradas
app.post('/api/debug/cleanup-sessions', async (req, res) => {
  try {
    const [resultado] = await pool.query('DELETE FROM sessions WHERE expires < NOW()');
    
    res.json({
      sessionsRemovidas: resultado.affectedRows,
      success: true
    });
  } catch (error) {
    console.error('Erro ao limpar sessões:', error);
    res.status(500).json({ erro: 'Erro ao limpar sessões' });
  }
});

// Debug: limpar todas as sessões de um usuário específico (exceto a atual)
app.post('/api/debug/cleanup-user-sessions/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentSessionId = req.sessionID;
    
    // Buscar todas as sessões e filtrar as do usuário
    const [sessions] = await pool.query('SELECT * FROM sessions');
    const userSessions = [];
    
    for (const session of sessions) {
      try {
        const data = JSON.parse(session.data);
        if (data.userId == userId && session.session_id !== currentSessionId) {
          userSessions.push(session.session_id);
        }
      } catch (e) {
        // Ignorar sessões com dados inválidos
      }
    }
    
    if (userSessions.length > 0) {
      const placeholders = userSessions.map(() => '?').join(',');
      const [resultado] = await pool.query(
        `DELETE FROM sessions WHERE session_id IN (${placeholders})`,
        userSessions
      );
      
      res.json({
        userId: userId,
        sessionsRemovidas: resultado.affectedRows,
        sessionIdsRemovidos: userSessions,
        currentSessionId: currentSessionId,
        success: true
      });
    } else {
      res.json({
        userId: userId,
        sessionsRemovidas: 0,
        message: 'Nenhuma sessão adicional encontrada para este usuário',
        success: true
      });
    }
    
  } catch (error) {
    console.error('Erro ao limpar sessões do usuário:', error);
    res.status(500).json({ erro: 'Erro ao limpar sessões do usuário' });
  }
});

// Debug: rota para forçar refresh completo do usuário
app.get('/api/debug/force-refresh', verificarAutenticacao, (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toISOString(),
    'ETag': `"${Date.now()}-${Math.random()}"`
  });
  
  res.json({
    currentUser: {
      userId: req.session.userId,
      userType: req.session.userType,
      email: req.session.email,
      authenticated: req.session.authenticated
    },
    sessionId: req.sessionID,
    timestamp: new Date().toISOString(),
    message: 'Dados atuais do usuário - cache forçado a atualizar'
  });
});

app.get('/api/config/giphy', (req, res) => {
  res.json({
    apiKey: process.env.GIPHY_API_KEY
  });
});

// Rota simples para limpeza de emergência
app.post('/api/emergency-cleanup', async (req, res) => {
  try {
    // Limpar todas as sessões expiradas
    await pool.query('DELETE FROM sessions WHERE expires < NOW()');
    res.json({ success: true, message: 'Sessões expiradas removidas' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota temporária para curtidas (evitar erro 404)
app.get('/api/curtidas/:id/status', verificarAutenticacao, (req, res) => {
  // Retornar dados padrão para evitar erro
  res.json({ curtido: false, total: 0 });
});

app.get('/api/clube/:clubeId/atualizacoes/:id/curtidas', verificarAutenticacao, (req, res) => {
  // Retornar dados padrão para evitar erro
  res.json({ curtido: false, total: 0 });
});

app.get('/api/usuario/tipo', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    res.json({ tipo: usuario.tipo });
  } catch (error) {
    console.error('Erro ao buscar tipo do usuário:', error);
    res.status(500).json({ erro: 'Erro ao verificar tipo do usuário' });
  }
});

app.post('/api/cadastro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    
    const usuarioExistente = await Usuario.buscarPorEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ erro: 'Este email já está em uso.' });
    }
    
    const novoUsuario = await Usuario.criar(nome, email, senha);
    
    res.status(201).json({ 
      mensagem: 'Usuário cadastrado com sucesso!',
      usuario: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email }
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ erro: 'Erro ao processar o cadastro. Tente novamente.' });
  }
});
app.post('/api/login', async (req, res) => {
  try {
    console.log('Tentativa de login:', req.body.email);
    console.log('Sessão antes do login:', req.session);
    
    if (!req.body.email || !req.body.senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
    }
    
    const { email, senha } = req.body;
    
    const usuario = await Usuario.buscarPorEmail(email);
    console.log('Usuário encontrado:', usuario ? 'Sim' : 'Não');
    
    if (!usuario) {
      return res.status(401).json({ erro: 'Email ou senha incorretos.' });
    }
    
    const senhaCorreta = await Usuario.verificarSenha(senha, usuario.senha);
    console.log('Senha correta:', senhaCorreta ? 'Sim' : 'Não');
    
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Email ou senha incorretos.' });
    }
    
    req.session.regenerate(function(err) {
      if (err) {
        console.error('Erro ao regenerar sessão:', err);
        return res.status(500).json({ erro: 'Erro ao processar o login. Problema com a sessão.' });
      }
      
      req.session.userId = usuario.id;
      req.session.userType = usuario.tipo;
      req.session.authenticated = true;
      req.session.email = usuario.email; // Adicionar email também
      
      console.log('Dados definidos na sessão:', {
        userId: req.session.userId,
        userType: req.session.userType,
        authenticated: req.session.authenticated,
        email: req.session.email
      });
      
      req.session.save(function(err) {
        if (err) {
          console.error('Erro ao salvar sessão:', err);
          return res.status(500).json({ erro: 'Erro ao processar o login. Problema ao salvar a sessão.' });
        }
        
        console.log('Sessão salva com sucesso. Dados finais:', {
          sessionID: req.sessionID,
          userId: req.session.userId,
          userType: req.session.userType,
          authenticated: req.session.authenticated
        });
        
        res.status(200).json({ 
          mensagem: 'Login realizado com sucesso!',
          usuario: { 
            id: usuario.id, 
            nome: usuario.nome, 
            email: usuario.email,
            tipo: usuario.tipo
          },
          sessionId: req.sessionID // Para debug
        });
      });
    });
  } catch (error) {
    console.error('Erro detalhado no login:', error);
    res.status(500).json({ 
      erro: 'Erro ao processar o login. Tente novamente.',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
app.get('/dashboard', verificarAutenticacao, verificarRestricaoAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    
    res.render('dashboard', { 
      titulo: 'Loom - Meus Clubes',
      userId: req.session.userId,
      userType: usuario ? usuario.tipo : null
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    
    res.render('dashboard', { 
      titulo: 'Loom - Meus Clubes',
      userId: req.session.userId,
      userType: null
    });
  }
});
app.get('/meuPerfil', verificarAutenticacao, verificarRestricaoAdmin, async (req, res) => {
  try {
    // Headers anti-cache extremamente agressivos para meuPerfil
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0, s-maxage=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toISOString(),
      'ETag': `"profile-${req.session.userId}-${Date.now()}"`,
      'Vary': 'Cookie, Authorization, User-Agent',
      'X-Accel-Expires': '0'
    });
    
    const usuario = await Usuario.buscarPorId(req.session.userId);
    
    // Debug temporário para meuPerfil
    console.log(`=== MEUPERFIL DEBUG ===`);
    console.log(`SessionID: ${req.sessionID}`);
    console.log(`UserId na sessão: ${req.session.userId}`);
    console.log(`Usuário encontrado: ${usuario ? usuario.nome : 'null'} (${usuario ? usuario.email : 'null'})`);
    console.log(`========================`);
    
    if (!usuario) {
      return res.redirect('/autenticacao');
    }
      const [clubesCriados] = await pool.query(
      'SELECT id FROM clubes WHERE id_criador = ?',
      [req.session.userId]
    );
    
    const [clubesParticipando] = await pool.query(
      'SELECT id_clube FROM participacoes WHERE id_usuario = ?',
      [req.session.userId]
    );
    
    const clubesIds = [
      ...clubesCriados.map(c => c.id),
      ...clubesParticipando.map(c => c.id_clube)
    ];
      const [publicacoes] = await pool.query(`
      SELECT a.*, c.nome as nome_clube, c.visibilidade, 
             (SELECT COUNT(*) FROM curtidas WHERE id_atualizacao = a.id) as curtidas
      FROM atualizacoes a
      JOIN clubes c ON a.id_clube = c.id
      WHERE a.id_usuario = ?
      ORDER BY a.data_postagem DESC
    `, [req.session.userId]);
    
    res.render('meuPerfil', { 
      titulo: 'Loom - Meu Perfil',
      userId: req.session.userId,
      userType: usuario.tipo,
      usuario: usuario,
      clubes: clubesIds,
      publicacoes: publicacoes,
      timestamp: Date.now(),
      sessionId: req.sessionID
    });
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    res.redirect('/dashboard');
  }
});
app.get('/perfil/:id', verificarAutenticacao, verificarRestricaoAdmin, async (req, res) => {
  try {
    const perfilId = req.params.id;
    const usuarioLogado = await Usuario.buscarPorId(req.session.userId);
    
    // Se for o próprio usuário, redireciona para meuPerfil
    if (parseInt(perfilId) === parseInt(req.session.userId)) {
      return res.redirect('/meuPerfil');
    }
    
    const usuarioPerfil = await Usuario.buscarPorId(perfilId);
    
    if (!usuarioPerfil) {
      return res.redirect('/dashboard');
    }
    
    // Buscar clubes públicos do usuário
    const [clubesCriados] = await pool.query(
      'SELECT id, nome, descricao, modelo, visibilidade, (SELECT COUNT(*) FROM participacoes WHERE id_clube = clubes.id) as total_membros FROM clubes WHERE id_criador = ? AND visibilidade = "publico"',
      [perfilId]
    );
    
    const [clubesParticipando] = await pool.query(
      `SELECT c.id, c.nome, c.descricao, c.modelo, c.visibilidade, 
              (SELECT COUNT(*) FROM participacoes WHERE id_clube = c.id) as total_membros 
       FROM clubes c 
       JOIN participacoes p ON c.id = p.id_clube 
       WHERE p.id_usuario = ? AND c.visibilidade = "publico" AND c.id_criador != ?`,
      [perfilId, perfilId]
    );
    
    const clubes = [...clubesCriados, ...clubesParticipando];
    
    // Buscar publicações públicas do usuário
    const [publicacoes] = await pool.query(`
      SELECT a.*, c.nome as nome_clube, c.visibilidade, 
             (SELECT COUNT(*) FROM curtidas WHERE id_atualizacao = a.id) as curtidas
      FROM atualizacoes a
      JOIN clubes c ON a.id_clube = c.id
      WHERE a.id_usuario = ? AND c.visibilidade = "publico"
      ORDER BY a.data_postagem DESC
      LIMIT 50
    `, [perfilId]);
    
    res.render('perfilPublico', { 
      titulo: `Loom - Perfil de ${usuarioPerfil.nome}`,
      userId: req.session.userId,
      userType: usuarioLogado ? usuarioLogado.tipo : null,
      usuarioPerfil: usuarioPerfil,
      clubes: clubes,
      publicacoes: publicacoes
    });
  } catch (error) {
    console.error('Erro ao carregar perfil público:', error);
    res.redirect('/dashboard');
  }
});
app.get('/api/perfil/:id', verificarAutenticacao, async (req, res) => {
  try {
    const perfilId = req.params.id;
    
    if (parseInt(perfilId) === parseInt(req.session.userId)) {
      return res.status(400).json({ erro: 'Use a rota de perfil próprio' });
    }
    
    const usuarioPerfil = await Usuario.buscarPorId(perfilId);
    
    if (!usuarioPerfil) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    const perfilPublico = {
      id: usuarioPerfil.id,
      nome: usuarioPerfil.nome,
      biografia: usuarioPerfil.biografia,
      foto_perfil: usuarioPerfil.foto_perfil,
      data_criacao: usuarioPerfil.data_criacao
    };
    
    res.json(perfilPublico);
  } catch (error) {
    console.error('Erro ao buscar perfil público:', error);
    res.status(500).json({ erro: 'Erro ao buscar perfil' });
  }
});
app.put('/api/perfil', verificarAutenticacao, async (req, res) => {
  try {
    const { nome, email, biografia, senha } = req.body;
    
    if (!nome || !email) {
      return res.status(400).json({ erro: 'Nome e email são obrigatórios' });
    }
    
    if (email !== req.session.email) {
      const [usuariosExistentes] = await pool.query(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?',
        [email, req.session.userId]
      );
      
      if (usuariosExistentes.length > 0) {
        return res.status(400).json({ erro: 'Este email já está em uso por outro usuário' });
      }
    }
      const dadosAtualizacao = {
      nome,
      email,
      biografia: biografia || null
    };
      if (senha) {
      const bcrypt = require('bcrypt');
      dadosAtualizacao.senha = await bcrypt.hash(senha, 10);
    }
    const campos = Object.keys(dadosAtualizacao).map(campo => `${campo} = ?`).join(', ');
    const valores = Object.values(dadosAtualizacao);
    valores.push(req.session.userId);
    
    await pool.query(
      `UPDATE usuarios SET ${campos} WHERE id = ?`,
      valores
    );
        const [usuarioAtualizado] = await pool.query(
      'SELECT id, nome, email, biografia, foto_perfil FROM usuarios WHERE id = ?',
      [req.session.userId]
    );
    
    res.json(usuarioAtualizado[0]);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ erro: 'Erro ao atualizar perfil' });
  }
});
app.post('/api/upload-foto-perfil', verificarAutenticacao, (req, res) => {

  
  if (!req.files || !req.files.foto) {

    return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
  }
  try {
    const file = req.files.foto;
    
    console.log('Arquivo processado:', {
      name: file.name,
      mimetype: file.mimetype,
      size: file.size
    });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ erro: 'Tipo de arquivo não suportado' });
    }

    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ erro: 'Arquivo muito grande. Máximo 5MB.' });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.error('Cloudinary não configurado');
      return res.status(500).json({ erro: 'Serviço de upload não configurado' });
    }

    console.log('Iniciando upload para Cloudinary...');
    
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'loom_perfil',
          public_id: `user-${req.session.userId}-${Date.now()}`,
          transformation: [
            { width: 300, height: 300, crop: 'fill', quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Erro no Cloudinary:', error);
            reject(error);
          } else {
            console.log('Upload bem-sucedido:', result.secure_url);
            resolve(result);
          }
        }
      );
      
      streamifier.createReadStream(file.data).pipe(uploadStream);
    });

    uploadPromise
      .then(async (result) => {
        console.log('Atualizando banco de dados...');
        
        await pool.query(
          'UPDATE usuarios SET foto_perfil = ? WHERE id = ?',
          [result.secure_url, req.session.userId]
        );
        
        console.log('Banco atualizado com sucesso');

        res.json({
          mensagem: 'Foto atualizada com sucesso',
          fotoUrl: result.secure_url
        });
      })
      .catch((error) => {
        console.error('Erro detalhado:', error);
        res.status(500).json({ 
          erro: 'Erro ao processar upload',
          detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      });

  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({ 
      erro: 'Erro ao processar upload',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
app.delete('/api/perfil', verificarAutenticacao, async (req, res) => {
  try {
    const [clubesCriados] = await pool.query(
      'SELECT id FROM clubes WHERE id_criador = ?',
      [req.session.userId]
    );
    
    if (clubesCriados.length > 0) {
      return res.status(400).json({ 
        erro: 'Você não pode excluir sua conta porque é criador de um ou mais clubes. Transfira a propriedade ou exclua os clubes primeiro.' 
      });
    }
    
    await pool.query(
      'DELETE FROM participacoes WHERE id_usuario = ?',
      [req.session.userId]
    );
    
    await pool.query(
      'DELETE FROM curtidas WHERE id_usuario = ?',
      [req.session.userId]
    );
    
    await pool.query(
      'DELETE FROM participantes_encontro WHERE id_usuario = ?',
      [req.session.userId]
    );
    
    await pool.query(
      'DELETE FROM atualizacoes WHERE id_usuario = ?',
      [req.session.userId]
    );
    
    await pool.query(
      'DELETE FROM usuarios WHERE id = ?',
      [req.session.userId]
    );
    
    req.session.destroy();
    
    res.json({ mensagem: 'Conta excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    res.status(500).json({ erro: 'Erro ao excluir conta' });
  }
});
app.get('/api/clubes/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const clubesCriados = await Clube.buscarPorCriador(userId);
    const clubesParticipando = await Clube.buscarParticipacoes(userId);
    
    res.json({
      clubesCriados,
      clubesParticipando
    });
  } catch (error) {
    console.error('Erro ao buscar clubes:', error);
    res.status(500).json({ erro: 'Erro ao buscar informações dos clubes.' });
  }
});
app.post('/api/clubes', verificarAutenticacao, async (req, res) => {
  try {
    // Verificar se usuário é admin
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado.' });
    }
    
    if (usuario.tipo === 'admin') {
      return res.status(403).json({ erro: 'Administradores não podem criar clubes.' });
    }
    
    const { nome, descricao, idCriador, visibilidade, senha, categorias, modelo } = req.body;
    
    if (!nome || !idCriador) {
      return res.status(400).json({ erro: 'Nome do clube e ID do criador são obrigatórios.' });
    }
    
    if (visibilidade === 'privado' && !senha) {
      return res.status(400).json({ erro: 'Clubes privados precisam de uma senha de acesso.' });
    }
    
    const modelosValidos = ['online', 'presencial', 'hibrido'];
    if (modelo && !modelosValidos.includes(modelo)) {
      return res.status(400).json({ erro: 'Modalidade inválida. Deve ser online, presencial ou híbrido.' });
    }
    
    const novoClube = await Clube.criar(
      nome, 
      descricao || '', 
      idCriador, 
      visibilidade || 'publico', 
      senha,
      categorias || [],
      modelo || 'online'
    );
    
    res.status(201).json({
      mensagem: 'Clube criado com sucesso!',
      clube: novoClube
    });
  } catch (error) {
    console.error('Erro ao criar clube:', error);
    res.status(500).json({ erro: 'Erro ao criar clube. Tente novamente.' });
  }
});
app.get('/explorar', verificarAutenticacao, verificarRestricaoAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    
    res.render('explorar', { 
      titulo: 'Loom - Explorar Clubes',
      userId: req.session.userId,
      userType: usuario ? usuario.tipo : null
    });
  } catch (error) {
    console.error('Erro ao carregar página explorar:', error);
    res.render('explorar', { 
      titulo: 'Loom - Explorar Clubes',
      userId: req.session.userId,
      userType: null
    });
  }
});

app.get('/api/explorar/clubes', verificarAutenticacao, async (req, res) => {
  try {
    const clubes = await Explorar.listarTodosClubes();
    
    const participacoes = [];
    
    for (const clube of clubes) {
      const isParticipante = await Explorar.verificarParticipacao(req.session.userId, clube.id);
      if (isParticipante) {
        participacoes.push(clube.id);
      }
    }
    
    res.json({
      clubes,
      participacoes
    });
  } catch (error) {
    console.error('Erro ao listar clubes:', error);
    res.status(500).json({ erro: 'Erro ao buscar clubes. Tente novamente.' });
  }
});

app.post('/api/explorar/entrar', verificarAutenticacao, async (req, res) => {
  try {
    // Verificar se usuário é admin
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado.' });
    }
    
    if (usuario.tipo === 'admin') {
      return res.status(403).json({ erro: 'Administradores não podem entrar em clubes.' });
    }
    
    const { clubeId } = req.body;
    
    if (!clubeId) {
      return res.status(400).json({ erro: 'ID do clube é obrigatório.' });
    }
    
    const jaParticipa = await Explorar.verificarParticipacao(req.session.userId, clubeId);
    if (jaParticipa) {
      return res.status(400).json({ erro: 'Você já é membro deste clube.' });
    }
    
    await Explorar.entrarNoClube(req.session.userId, clubeId);
    
    res.json({ mensagem: 'Você entrou no clube com sucesso!' });
  } catch (error) {
    console.error('Erro ao entrar no clube:', error);
    res.status(500).json({ erro: 'Erro ao entrar no clube. Tente novamente.' });
  }
});

app.post('/api/explorar/entrar-privado', verificarAutenticacao, async (req, res) => {
  try {
    // Verificar se usuário é admin
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado.' });
    }
    
    if (usuario.tipo === 'admin') {
      return res.status(403).json({ erro: 'Administradores não podem entrar em clubes.' });
    }
    
    const { clubeId, senha } = req.body;
    
    if (!clubeId || !senha) {
      return res.status(400).json({ erro: 'ID do clube e senha são obrigatórios.' });
    }
    
    const jaParticipa = await Explorar.verificarParticipacao(req.session.userId, clubeId);
    if (jaParticipa) {
      return res.status(400).json({ erro: 'Você já é membro deste clube.' });
    }
    
    const senhaCorreta = await Clube.verificarSenha(clubeId, senha);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Senha incorreta para este clube.' });
    }
    
    await Explorar.entrarNoClube(req.session.userId, clubeId);
    
    res.json({ mensagem: 'Você entrou no clube com sucesso!' });
  } catch (error) {
    console.error('Erro ao entrar no clube privado:', error);
    res.status(500).json({ erro: 'Erro ao entrar no clube. Tente novamente.' });
  }
});

app.get('/painelAdmin', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    
    if (!usuario || usuario.tipo !== 'admin') { //if user = admin
      return res.redirect('/dashboard');
    }
    
    res.render('painelAdmin', { 
      titulo: 'Loom - Painel Administrativo',
      userId: req.session.userId,
      userType: usuario.tipo
    });
  } catch (error) {
    console.error('Erro ao carregar painel admin:', error);
    res.redirect('/dashboard');
  }
});
app.get('/gerenciarCategorias', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    
    if (!usuario || usuario.tipo !== 'admin') {
      return res.redirect('/dashboard');
    }
    
    res.render('categorias', { 
      titulo: 'Loom - Gerenciar Categorias',
      userId: req.session.userId,
      userType: usuario.tipo
    });
  } catch (error) {
    console.error('Erro ao carregar página de categorias:', error);
    res.redirect('/painelAdmin');
  }
});

app.get('/api/categorias', verificarAutenticacao, async (req, res) => {
  try {
    const categorias = await Categorias.contarClubesPorCategoria();
    res.json(categorias);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ erro: 'Erro ao listar categorias' });
  }
});

app.post('/api/categorias', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const { nome } = req.body;
    if (!nome) {
      return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
    }
    
    const novaCategoria = await Categorias.criar(nome);
    res.status(201).json(novaCategoria);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ erro: 'Erro ao criar categoria' });
  }
});

app.post('/api/categorias/:id', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const { id } = req.params;
    const { nome } = req.body;
    
    if (!nome) {
      return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
    }
    
    const categoriaAtualizada = await Categorias.atualizar(id, nome);
    res.json(categoriaAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ erro: 'Erro ao atualizar categoria' });
  }
});

app.delete('/api/categorias/:id', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const { id } = req.params;
    await Categorias.excluir(id);
    res.json({ mensagem: 'Categoria excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({ erro: 'Erro ao excluir categoria' });
  }
});

app.get('/api/categorias/:id/clubes', verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const clubes = await Categorias.listarClubesPorCategoria(id);
    res.json(clubes);
  } catch (error) {
    console.error('Erro ao listar clubes da categoria:', error);
    res.status(500).json({ erro: 'Erro ao listar clubes da categoria' });
  }
});

app.get('/gerenciarClubes', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    
    if (!usuario || usuario.tipo !== 'admin') {
      return res.redirect('/dashboard');
    }
    
    res.render('gerenciarClubes', { 
      titulo: 'Loom - Gerenciar Clubes',
      userId: req.session.userId,
      userType: usuario.tipo
    });
  } catch (error) {
    console.error('Erro ao carregar página de gerenciamento de clubes:', error);
    res.redirect('/painelAdmin');
  }
});

app.get('/api/admin/clubes', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const clubes = await Clube.listarTodos();
    res.json(clubes);
  } catch (error) {
    console.error('Erro ao listar clubes:', error);
    res.status(500).json({ erro: 'Erro ao listar clubes' });
  }
});

app.put('/api/admin/clubes/:id/visibilidade', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const { id } = req.params;
    const { visibilidade, senha } = req.body;
    
    if (!visibilidade) {
      return res.status(400).json({ erro: 'Visibilidade é obrigatória' });
    }
    
    if (visibilidade === 'privado' && !senha) {
      return res.status(400).json({ erro: 'Clubes privados precisam de uma senha de acesso' });
    }
    
    const senhaAcesso = visibilidade === 'privado' ? senha : null;
    const clubeAtualizado = await Clube.atualizarVisibilidade(id, visibilidade, senhaAcesso);
    res.json(clubeAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar visibilidade do clube:', error);
    res.status(500).json({ erro: 'Erro ao atualizar visibilidade do clube' });
  }
});

app.put('/api/admin/clubes/:id/modelo', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const { id } = req.params;
    const { modelo } = req.body;
    
    if (!modelo || !['presencial', 'online', 'hibrido'].includes(modelo)) {
      return res.status(400).json({ erro: 'Modelo inválido' });
    }
    
    const clubeAtualizado = await Clube.atualizarModelo(id, modelo);
    res.json(clubeAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar modelo do clube:', error);
    res.status(500).json({ erro: 'Erro ao atualizar modelo do clube' });
  }
});
app.get('/gerenciarUsuarios', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    
    if (!usuario || usuario.tipo !== 'admin') {
      return res.redirect('/dashboard');
    }
    
    res.render('gerenciarUsuarios', { 
      titulo: 'Loom - Gerenciar Usuários',
      userId: req.session.userId,
      userType: usuario.tipo
    });
  } catch (error) {
    console.error('Erro ao carregar página de gerenciamento de usuários:', error);
    res.redirect('/painelAdmin');
  }
});

app.get('/api/admin/usuarios', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const usuarios = await Usuario.listarTodos();
    res.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ erro: 'Erro ao listar usuários' });
  }
});

app.get('/api/admin/usuarios/:id', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const { id } = req.params;
    const usuarioAlvo = await Usuario.buscarPorId(id);
    
    if (!usuarioAlvo) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    res.json(usuarioAlvo);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ erro: 'Erro ao buscar usuário' });
  }
});

app.post('/api/admin/usuarios/:id', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const { id } = req.params;
    const { email, senha, estado } = req.body;
    
    if (!email) {
      return res.status(400).json({ erro: 'Email é obrigatório' });
    }
    
    const usuarioAtualizado = await Usuario.atualizar(id, { email, senha, estado });
    res.json(usuarioAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
});
app.get('/api/admin/usuarios/:id/clubes', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const { id } = req.params;
    const clubes = await Usuario.buscarClubes(id);
    res.json(clubes);
  } catch (error) {
    console.error('Erro ao listar clubes do usuário:', error);
    res.status(500).json({ erro: 'Erro ao listar clubes do usuário' });
  }
});
// Página de atualizações de leitura específica
app.get('/clube/:id/leitura/:leituraId/atualizacoes', verificarAutenticacao, verificarRestricaoAdmin, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const leituraId = req.params.leituraId;
    const userId = req.session.userId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.redirect('/dashboard');
    }
    
    // Verificar se a leitura existe no clube
    const [leituraRows] = await pool.query(
      'SELECT * FROM leituras WHERE id = ? AND id_clube = ?',
      [leituraId, clubeId]
    );
    
    if (leituraRows.length === 0) {
      return res.redirect(`/clube/${clubeId}`);
    }
    
    const usuario = await Usuario.buscarPorId(userId);
    
    res.render('atualizacoesLeitura', { 
      titulo: 'Loom - Atualizações de Leitura',
      userId: userId,
      clubeId: clubeId,
      idLeitura: leituraId,
      tituloLeitura: leituraRows[0].titulo,
      userType: usuario ? usuario.tipo : null
    });
  } catch (error) {
    console.error('Erro ao carregar página de atualizações de leitura:', error);
    res.redirect('/dashboard');
  }
});

/*clubePrincipal*/
app.get('/clube/:id', verificarAutenticacao, verificarRestricaoAdmin, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.redirect('/dashboard');
    }
    
    const usuario = await Usuario.buscarPorId(userId);
    
    res.render('clubePrincipal', { 
      titulo: 'Loom - Clube',
      userId: userId,
      clubeId: clubeId,
      userType: usuario ? usuario.tipo : null
    });
  } catch (error) {
    console.error('Erro ao carregar página do clube:', error);
    res.redirect('/dashboard');
  }
});

app.get('/api/clube/:id', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    
    const [clubeRows] = await pool.query(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM participacoes WHERE id_clube = c.id) as total_membros
      FROM clubes c
      WHERE c.id = ?
    `, [clubeId]);
    
    if (clubeRows.length === 0) {
      return res.status(404).json({ erro: 'Clube não encontrado' });
    }
    
    const clube = clubeRows[0];
    
    const [categoriasRows] = await pool.query(`
      SELECT cat.nome
      FROM categorias cat
      JOIN clube_categorias cc ON cat.id = cc.id_categoria
      WHERE cc.id_clube = ?
    `, [clubeId]);
    
    clube.categorias = categoriasRows.map(cat => cat.nome);
    
    try {
      const [leituraRows] = await pool.query(`
        SELECT * FROM leituras
        WHERE id_clube = ? AND status = 'atual'
        ORDER BY data_inicio DESC
        LIMIT 1
      `, [clubeId]);
      
      if (leituraRows.length > 0) {
        clube.leitura_atual = leituraRows[0];
      }
    } catch (leituraError) {
      console.error('Erro ao buscar leitura atual:', leituraError);
      if (leituraError.code !== 'ER_NO_SUCH_TABLE') {
        throw leituraError;
      }
    }
    
    res.json(clube);
  } catch (error) {
    console.error('Erro ao buscar informações do clube:', error);
    res.status(500).json({ erro: 'Erro ao buscar informações do clube' });
  }
});

app.get('/api/clube/:id/membros', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    
    const [clubeRows] = await pool.query('SELECT id_criador FROM clubes WHERE id = ?', [clubeId]);
    
    if (clubeRows.length === 0) {
      return res.status(404).json({ erro: 'Clube não encontrado' });
    }
    
    const idCriador = clubeRows[0].id_criador;
    
    const [membrosRows] = await pool.query(`
      SELECT u.id, u.nome, u.email, 
             (CASE WHEN u.id = ? THEN 1 ELSE 0 END) as is_criador
      FROM usuarios u
      JOIN participacoes p ON u.id = p.id_usuario
      WHERE p.id_clube = ?
      ORDER BY is_criador DESC, u.nome
    `, [idCriador, clubeId]);
    
    res.json({
      idCriador: idCriador,
      membros: membrosRows
    });
  } catch (error) {
    console.error('Erro ao buscar membros do clube:', error);
    res.status(500).json({ erro: 'Erro ao buscar membros do clube' });
  }
});

app.get('/api/clube/:id/permissoes', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    
    const [clubeRows] = await pool.query('SELECT * FROM clubes WHERE id = ?', [clubeId]);
    
    if (clubeRows.length === 0) {
      return res.status(404).json({ erro: 'Clube não encontrado' });
    }
    
    const clube = clubeRows[0];
    const isCriador = clube.id_criador === parseInt(userId);
    
    res.json({
      isCriador: isCriador,
      clube: clube
    });
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    res.status(500).json({ erro: 'Erro ao verificar permissões' });
  }
});
app.get('/api/livros/buscar', verificarAutenticacao, async (req, res) => {
  try {
      const termoBusca = req.query.q;
      if (!termoBusca) {
          return res.status(400).json({ erro: 'Termo de busca é obrigatório' });
      }
      
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(termoBusca)}&maxResults=12`;
      
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error('Erro na API do Google Books');
      }
      
      const data = await response.json();
      res.json(data);
  } catch (error) {
      console.error('Erro ao buscar livros:', error);
      res.status(500).json({ erro: 'Erro ao buscar livros na API do Google' });
  }
});
app.get('/api/clube/:id/leituras', verificarAutenticacao, async (req, res) => {
  try {
      const clubeId = req.params.id;
        const [participacoes] = await pool.query(
          'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
          [req.session.userId, clubeId]
      );
      
      if (participacoes.length === 0) {
        return res.status(403).json({ erro: 'Você não é membro deste clube' });
      }
      const leituraAtual = await Leituras.buscarAtual(clubeId);
      const leiturasAnteriores = await Leituras.buscarAnteriores(clubeId);
      
      res.json({
        leituraAtual,
        leiturasAnteriores
      });
  } catch (error) {
      console.error('Erro ao buscar leituras:', error);
      res.status(500).json({ erro: 'Erro ao buscar leituras do clube' });
  }
});
app.post('/api/clube/:id/leituras', verificarAutenticacao, async (req, res) => {
  try {
      const clubeId = req.params.id;
      const { titulo, autor, paginas, imagemUrl, dataInicio, dataFim } = req.body;
      
      const [clubeRows] = await pool.query(
          'SELECT id_criador FROM clubes WHERE id = ?',
          [clubeId]
      );
      
      if (clubeRows.length === 0) {
          return res.status(404).json({ erro: 'Clube não encontrado' });
      }
      
      if (clubeRows[0].id_criador !== parseInt(req.session.userId)) {
          return res.status(403).json({ erro: 'Apenas o criador do clube pode adicionar leituras' });
      }
      
      const novaLeitura = await Leituras.criar(
          clubeId, 
          titulo, 
          autor, 
          dataInicio, 
          dataFim, 
          paginas || null, 
          imagemUrl || null
      );
      
      res.status(201).json({
          mensagem: 'Leitura adicionada com sucesso',
          leitura: novaLeitura
      });
  } catch (error) {
      console.error('Erro ao adicionar leitura:', error);
      res.status(500).json({ erro: 'Erro ao adicionar nova leitura' });
  }
});
app.get('/api/clube/:id/atualizacoes', verificarAutenticacao, async (req, res) => {
  try {
      const clubeId = req.params.id;
      const userId = req.session.userId;
      
      const [participacoes] = await pool.query(
          'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
          [userId, clubeId]
      );
      
      if (participacoes.length === 0) {
          return res.status(403).json({ erro: 'Você não é membro deste clube' });
      }
      const [leituraRows] = await pool.query(
          'SELECT * FROM leituras WHERE id_clube = ? AND status = "atual" LIMIT 1',
          [clubeId]
      );
      
      if (leituraRows.length === 0) {
          return res.json({ atualizacoes: [], leituraAtual: null });
      }
      
      const leituraAtual = leituraRows[0];
      const atualizacoes = await Atualizacoes.listarPorClube(clubeId, leituraAtual.id);
      res.json({
          atualizacoes,
          leituraAtual
      });
  } catch (error) {
      console.error('Erro ao buscar atualizações:', error);
      res.status(500).json({ erro: 'Erro ao buscar atualizações do clube' });
  }
});
app.post('/api/clube/:id/atualizacoes', verificarAutenticacao, async (req, res) => {
  try {
      const clubeId = req.params.id;
      const { conteudo, paginaAtual, gifUrl } = req.body;
      
      if (!conteudo || !paginaAtual) {
          return res.status(400).json({ erro: 'Comentário e página atual são obrigatórios' });
      }
      
      const [participacoes] = await pool.query(
          'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
          [req.session.userId, clubeId]
      );
      
      if (participacoes.length === 0) {
          return res.status(403).json({ erro: 'Você não é membro deste clube' });
      }
      
      const [leituraRows] = await pool.query(
          'SELECT * FROM leituras WHERE id_clube = ? AND status = "atual" LIMIT 1',
          [clubeId]
      );
      
      if (leituraRows.length === 0) {
          return res.status(404).json({ erro: 'Não há leitura atual neste clube' });
      }
      
      const leituraAtual = leituraRows[0];
      
      if (paginaAtual <= 0 || (leituraAtual.paginas && paginaAtual > leituraAtual.paginas)) {
          return res.status(400).json({ 
              erro: `A página deve estar entre 1 e ${leituraAtual.paginas || '?'}` 
          });
      }
      
      const ultimaAtualizacao = await Atualizacoes.verificarUltimaAtualizacao(
          req.session.userId, 
          leituraAtual.id
      );
      
      if (ultimaAtualizacao && ultimaAtualizacao.porcentagem_leitura === 100) {
          return res.status(400).json({ erro: 'Você já completou esta leitura' });
      }
      
      const novaAtualizacao = await Atualizacoes.criar(
          clubeId,
          leituraAtual.id,
          req.session.userId,
          conteudo,
          paginaAtual,
          leituraAtual.paginas || 100,
          gifUrl || null
      );
      
      const [usuarioRows] = await pool.query(
          'SELECT nome FROM usuarios WHERE id = ?',
          [req.session.userId]
      );
      
      novaAtualizacao.nome_usuario = usuarioRows[0].nome;
      
      res.status(201).json({
          mensagem: 'Atualização publicada com sucesso',
          atualizacao: novaAtualizacao
      });
  } catch (error) {
      console.error('Erro ao criar atualização:', error);
      res.status(500).json({ 
          erro: 'Erro ao publicar atualização',
          mensagem: error.message 
      });
  }
});
app.get('/api/clube/:id/atualizacoes/:atualizacaoId', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const atualizacaoId = req.params.atualizacaoId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [req.session.userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    const [atualizacoes] = await pool.query(
      'SELECT * FROM atualizacoes WHERE id = ? AND id_clube = ?',
      [atualizacaoId, clubeId]
    );
    
    if (atualizacoes.length === 0) {
      return res.status(404).json({ erro: 'Atualização não encontrada' });
    }
    
    if (atualizacoes[0].id_usuario !== req.session.userId) {
      return res.status(403).json({ erro: 'Você não tem permissão para acessar esta atualização' });
    }
    
    res.json(atualizacoes[0]);
  } catch (error) {
    console.error('Erro ao buscar atualização:', error);
    res.status(500).json({ erro: 'Erro ao buscar atualização' });
  }
});
app.post('/api/clube/:id/atualizacoes/:atualizacaoId', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const atualizacaoId = req.params.atualizacaoId;
    const { conteudo, paginaAtual, gifUrl } = req.body;
    
    if (!conteudo || !paginaAtual) {
      return res.status(400).json({ erro: 'Comentário e página atual são obrigatórios' });
    }
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [req.session.userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    const [atualizacoes] = await pool.query(
      'SELECT * FROM atualizacoes WHERE id = ? AND id_clube = ?',
      [atualizacaoId, clubeId]
    );
    
    if (atualizacoes.length === 0) {
      return res.status(404).json({ erro: 'Atualização não encontrada' });
    }
    
    if (atualizacoes[0].id_usuario !== req.session.userId) {
      return res.status(403).json({ erro: 'Você não tem permissão para editar esta atualização' });
    }
    
    const [leituraRows] = await pool.query(
      'SELECT * FROM leituras WHERE id = ?',
      [atualizacoes[0].id_leitura]
    );
    
    if (leituraRows.length === 0) {
      return res.status(404).json({ erro: 'Leitura não encontrada' });
    }
    
    const leituraAtual = leituraRows[0];
    const porcentagemLeitura = Math.min(Math.round((paginaAtual / (leituraAtual.paginas || 100)) * 100), 100);
    
    await pool.query(
      'UPDATE atualizacoes SET conteudo = ?, porcentagem_leitura = ?, gif_url = ? WHERE id = ?',
      [conteudo, porcentagemLeitura, gifUrl || null, atualizacaoId]
    );
    
    const [atualizacaoAtualizada] = await pool.query(
      'SELECT a.*, u.nome as nome_usuario FROM atualizacoes a JOIN usuarios u ON a.id_usuario = u.id WHERE a.id = ?',
      [atualizacaoId]
    );
    
    res.json({
      mensagem: 'Atualização editada com sucesso',
      atualizacao: atualizacaoAtualizada[0]
    });
  } catch (error) {
    console.error('Erro ao editar atualização:', error);
    res.status(500).json({ erro: 'Erro ao editar atualização' });
  }
});

app.delete('/api/clube/:id/atualizacoes/:atualizacaoId', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const atualizacaoId = req.params.atualizacaoId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [req.session.userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    const [atualizacoes] = await pool.query(
      'SELECT * FROM atualizacoes WHERE id = ? AND id_clube = ?',
      [atualizacaoId, clubeId]
    );
    
    if (atualizacoes.length === 0) {
      return res.status(404).json({ erro: 'Atualização não encontrada' });
    }
    const [usuario] = await pool.query('SELECT tipo FROM usuarios WHERE id = ?', [req.session.userId]);
    const isAdmin = usuario.length > 0 && usuario[0].tipo === 'admin';
    
    if (atualizacoes[0].id_usuario !== req.session.userId && !isAdmin) {
      return res.status(403).json({ erro: 'Você não tem permissão para excluir esta atualização' });
    }    
await pool.query('DELETE FROM atualizacoes WHERE id = ?', [atualizacaoId]);
    
    res.json({ mensagem: 'Atualização excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir atualização:', error);
    res.status(500).json({ erro: 'Erro ao excluir atualização' });
  }
});
app.get('/api/clube/:id/atualizacoes/usuario/:userId/leitura/:leituraId', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const usuarioId = req.params.userId;
    const leituraId = req.params.leituraId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [req.session.userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    const ultimaAtualizacao = await Atualizacoes.verificarUltimaAtualizacao(usuarioId, leituraId);
    
    res.json({ ultimaAtualizacao });
  } catch (error) {
    console.error('Erro ao buscar última atualização:', error);
    res.status(500).json({ erro: 'Erro ao buscar última atualização' });
  }
});

// Rotas específicas para página de atualizações de leitura
app.get('/api/clube/:id/leitura/:leituraId', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const leituraId = req.params.leituraId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [req.session.userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    const [leituraRows] = await pool.query(
      'SELECT * FROM leituras WHERE id = ? AND id_clube = ?',
      [leituraId, clubeId]
    );
    
    if (leituraRows.length === 0) {
      return res.status(404).json({ erro: 'Leitura não encontrada' });
    }
    
    res.json(leituraRows[0]);
  } catch (error) {
    console.error('Erro ao buscar leitura:', error);
    res.status(500).json({ erro: 'Erro ao buscar informações da leitura' });
  }
});

app.get('/api/clube/:id/leitura/:leituraId/atualizacoes', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const leituraId = req.params.leituraId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [req.session.userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    const atualizacoes = await Atualizacoes.listarPorLeitura(clubeId, leituraId);
    
    res.json(atualizacoes);
  } catch (error) {
    console.error('Erro ao buscar atualizações da leitura:', error);
    res.status(500).json({ erro: 'Erro ao buscar atualizações da leitura' });
  }
});
app.post('/api/clube/:id/atualizacoes/:atualizacaoId/curtir', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const atualizacaoId = req.params.atualizacaoId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [req.session.userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    const resultado = await Curtidas.curtir(atualizacaoId, req.session.userId);
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao curtir atualização:', error);
    res.status(500).json({ erro: 'Erro ao processar curtida' });
  }
});
app.get('/api/clube/:id/atualizacoes/:atualizacaoId/curtidas', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const atualizacaoId = req.params.atualizacaoId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [req.session.userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'não é membro' });
    }
    
    const curtido = await Curtidas.verificarCurtida(atualizacaoId, req.session.userId);
    const total = await Curtidas.contarCurtidas(atualizacaoId);
    
    res.json({ curtido, total });
  } catch (error) {
    console.error('Erro ao verificar curtidas:', error);
    res.status(500).json({ erro: 'Erro ao verificar curtidas' });
  }
});
app.get('/clube/:clubeId/leitura/:idLeitura/atualizacoes', verificarAutenticacao, verificarRestricaoAdmin, async (req, res) => {
    try {
        const { clubeId, idLeitura } = req.params;
        const { titulo } = req.query;
        const userId = req.session.userId;
        
        const [participacoes] = await pool.query(
            'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
            [userId, clubeId]
        );
        
        if (participacoes.length === 0) {
            return res.redirect('/dashboard');
        }
        
        const [leitura] = await pool.query(
            'SELECT * FROM leituras WHERE id = ? AND id_clube = ?',
            [idLeitura, clubeId]
        );
        
        if (leitura.length === 0) {
            return res.redirect(`/clube/${clubeId}`);
        }
        
        const usuario = await Usuario.buscarPorId(userId);
        
        res.render('atualizacoesLeitura', {
            titulo: `Atualizações - ${titulo || leitura[0].titulo}`,
            clubeId,
            idLeitura,
            tituloLeitura: titulo || leitura[0].titulo,
            userId: userId,
            userType: usuario ? usuario.tipo : null
        });
        
    } catch (error) {
        console.error('Erro ao carregar página de atualizações:', error);
        res.redirect('/dashboard');
    }
});
app.get('/api/clube/:clubeId/leitura/:idLeitura', verificarAutenticacao, async (req, res) => {
    try {
        const { clubeId, idLeitura } = req.params;
        const userId = req.session.userId;
        
        const [participacoes] = await pool.query(
            'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
            [userId, clubeId]
        );
        
        if (participacoes.length === 0) {
            return res.status(403).json({ erro: 'Você não é membro deste clube' });
        }
        
        const [leitura] = await pool.query(
            'SELECT * FROM leituras WHERE id = ? AND id_clube = ?',
            [idLeitura, clubeId]
        );
        
        if (leitura.length === 0) {
            return res.status(404).json({ erro: 'Leitura não encontrada' });
        }
        
        res.json(leitura[0]);
        
    } catch (error) {
        console.error('Erro ao obter informações da leitura:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});
app.get('/api/clube/:clubeId/leitura/:idLeitura/atualizacoes', verificarAutenticacao, async (req, res) => {
    try {
        const { clubeId, idLeitura } = req.params;
        const userId = req.session.userId;
        
        const [participacoes] = await pool.query(
            'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
            [userId, clubeId]
        );
        
        if (participacoes.length === 0) {
            return res.status(403).json({ erro: 'Você não é membro deste clube' });
        }
        
        const [leitura] = await pool.query(
            'SELECT * FROM leituras WHERE id = ? AND id_clube = ?',
            [idLeitura, clubeId]
        );
        
        if (leitura.length === 0) {
            return res.status(404).json({ erro: 'Leitura não encontrada' });
        }
        
        const resultado = await Atualizacoes.listarPorLeitura(clubeId, idLeitura);
        
        res.json(resultado);
        
    } catch (error) {
        console.error('Erro ao obter atualizações da leitura:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});
app.get('/api/clube/:id/encontros', verificarAutenticacao, async (req, res) => {
    try {
        const clubeId = req.params.id;
        const userId = req.session.userId;
        
        const [participacoes] = await pool.query(
            'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
            [userId, clubeId]
        );
        
        if (participacoes.length === 0) {
            return res.status(403).json({ erro: 'Você não é membro deste clube' });
        }
        
        const [clubeRows] = await pool.query(
            'SELECT id_criador FROM clubes WHERE id = ?',
            [clubeId]
        );
        
        if (clubeRows.length === 0) {
            return res.status(404).json({ erro: 'Clube não encontrado' });
        }
        
        const isCriador = clubeRows[0].id_criador === parseInt(userId);
        
        const encontros = await Encontros.listarPorClube(clubeId);
        
        for (const encontro of encontros) {
            const participantes = await Encontros.listarParticipantes(encontro.id);
            encontro.participantes = participantes.filter(p => p.status === 'confirmado' || p.status === 'talvez');
        }
        
        const [participacoesEncontros] = await pool.query(
            'SELECT * FROM participantes_encontro WHERE id_usuario = ? AND id_encontro IN (?)',
            [userId, encontros.length > 0 ? encontros.map(e => e.id) : [0]]
        );
        
        res.json({
            encontros,
            isCriador,
            participacoes: participacoesEncontros
        });
    } catch (error) {
        console.error('Erro ao listar encontros:', error);
        res.status(500).json({ erro: 'Erro ao listar encontros do clube' });
    }
});

app.post('/api/clube/:id/encontros', verificarAutenticacao, async (req, res) => {
    try {
        const clubeId = req.params.id;
        const userId = req.session.userId;
        
        const [clubeRows] = await pool.query(
            'SELECT id_criador, modelo FROM clubes WHERE id = ?',
            [clubeId]
        );
        
        if (clubeRows.length === 0) {
            return res.status(404).json({ erro: 'Clube não encontrado' });
        }
        
        if (clubeRows[0].id_criador !== parseInt(userId)) {
            return res.status(403).json({ erro: 'Apenas o criador do clube pode agendar encontros' });
        }
        
        const modeloClube = clubeRows[0].modelo;
        const { tipo } = req.body;
        
        if ((modeloClube === 'online' && tipo === 'presencial') || 
            (modeloClube === 'presencial' && tipo === 'online')) {
            return res.status(400).json({ 
                erro: `O tipo de encontro deve ser compatível com o modelo do clube (${modeloClube})` 
            });
        }
        
        const { 
            titulo, descricao, dataEncontro, horaInicio, horaFim, local, link, tipo: tipoEncontro 
        } = req.body;
        
        if (!titulo || !dataEncontro || !horaInicio || !tipoEncontro) {
            return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
        }
        
        if ((tipoEncontro === 'presencial' || tipoEncontro === 'hibrido') && !local) {
            return res.status(400).json({ erro: 'Local é obrigatório para encontros presenciais ou híbridos' });
        }
        
        if ((tipoEncontro === 'online' || tipoEncontro === 'hibrido') && !link) {
            return res.status(400).json({ erro: 'Link é obrigatório para encontros online ou híbridos' });
        }
          try {
            const novoEncontro = await Encontros.criar(
                clubeId,
                titulo,
                descricao || '',
                dataEncontro,
                horaInicio,
                horaFim || null,
                local || null,
                link || null,
                tipoEncontro
            );
        await Encontros.confirmarParticipacao(novoEncontro.id, userId, 'confirmado');        
         res.status(201).json({
                mensagem: 'Encontro agendado com sucesso',
                encontro: novoEncontro
            });
        } catch (createError) {
            console.error('Erro detalhado ao criar encontro:', createError);
            return res.status(500).json({ 
                erro: 'Erro ao agendar encontro', 
                detalhes: createError.message 
            });
        }
    } catch (error) {
        console.error('Erro ao processar requisição de encontro:', error);
        res.status(500).json({ 
            erro: 'Erro ao agendar encontro',
            detalhes: error.message
        });
    }
});

app.get('/api/clube/:id/encontros/:encontroId', verificarAutenticacao, async (req, res) => {
    try {
        const clubeId = req.params.id;
        const encontroId = req.params.encontroId;
        const userId = req.session.userId;
        
        const [participacoes] = await pool.query(
            'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
            [userId, clubeId]
        );
        
        if (participacoes.length === 0) {
            return res.status(403).json({ erro: 'Você não é membro deste clube' });
        }
        
        const encontro = await Encontros.buscarPorId(encontroId);
        
        if (!encontro || encontro.id_clube !== parseInt(clubeId)) {
            return res.status(404).json({ erro: 'Encontro não encontrado' });
        }
        
        const participantes = await Encontros.listarParticipantes(encontroId);
        encontro.participantes = participantes;
        
        res.json(encontro);
    } catch (error) {
        console.error('Erro ao buscar encontro:', error);
        res.status(500).json({ erro: 'Erro ao buscar detalhes do encontro' });
    }
});
app.put('/api/clube/:id/encontros/:encontroId', verificarAutenticacao, async (req, res) => {
    try {
        const clubeId = req.params.id;
        const encontroId = req.params.encontroId;
        const userId = req.session.userId;
        
        const [clubeRows] = await pool.query(
            'SELECT id_criador, modelo FROM clubes WHERE id = ?',
            [clubeId]
        );
        
        if (clubeRows.length === 0) {
            return res.status(404).json({ erro: 'Clube não encontrado' });
        }
        
        if (clubeRows[0].id_criador !== parseInt(userId)) {
            return res.status(403).json({ erro: 'Apenas o criador do clube pode editar encontros' });
        }
        
        const encontro = await Encontros.buscarPorId(encontroId);
        
        if (!encontro || encontro.id_clube !== parseInt(clubeId)) {
            return res.status(404).json({ erro: 'Encontro não encontrado' });
        }
        
        const modeloClube = clubeRows[0].modelo;
        const { tipo } = req.body;
        
        if ((modeloClube === 'online' && tipo === 'presencial') || 
            (modeloClube === 'presencial' && tipo === 'online')) {
            return res.status(400).json({ 
                erro: `O tipo de encontro deve ser compatível com o modelo do clube (${modeloClube})` 
            });
        }
        
        const { 
            titulo, descricao, dataEncontro, horaInicio, horaFim, local, link, tipo: tipoEncontro 
        } = req.body;
        
        if (!titulo || !dataEncontro || !horaInicio || !tipoEncontro) {
            return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
        }
        
        if ((tipoEncontro === 'presencial' || tipoEncontro === 'hibrido') && !local) {
            return res.status(400).json({ erro: 'Local é obrigatório para encontros presenciais ou híbridos' });
        }
        
        if ((tipoEncontro === 'online' || tipoEncontro === 'hibrido') && !link) {
            return res.status(400).json({ erro: 'Link é obrigatório para encontros online ou híbridos' });
        }
        
        const encontroAtualizado = await Encontros.atualizar(
            encontroId,
            titulo,
            descricao || '',
            dataEncontro,
            horaInicio,
            horaFim || null,
            local || null,
            link || null,
            tipoEncontro
        );
        
        res.json({
            mensagem: 'Encontro atualizado com sucesso',
            encontro: encontroAtualizado
        });
    } catch (error) {
        console.error('Erro ao atualizar encontro:', error);
        res.status(500).json({ erro: 'Erro ao atualizar encontro' });
    }
});
app.delete('/api/clube/:id/encontros/:encontroId', verificarAutenticacao, async (req, res) => {
    try {
        const clubeId = req.params.id;
        const encontroId = req.params.encontroId;
        const userId = req.session.userId;
        
        const [clubeRows] = await pool.query(
            'SELECT id_criador FROM clubes WHERE id = ?',
            [clubeId]
        );
        
        if (clubeRows.length === 0) {
            return res.status(404).json({ erro: 'Clube não encontrado' });
        }
        
        if (clubeRows[0].id_criador !== parseInt(userId)) {
            return res.status(403).json({ erro: 'Apenas o criador do clube pode excluir encontros' });
        }
        
        const encontro = await Encontros.buscarPorId(encontroId);
        
        if (!encontro || encontro.id_clube !== parseInt(clubeId)) {
            return res.status(404).json({ erro: 'Encontro não encontrado' });
        }
        
        await Encontros.excluir(encontroId);
        
        res.json({ mensagem: 'Encontro excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir encontro:', error);
        res.status(500).json({ erro: 'Erro ao excluir encontro' });
    }
});
app.post('/api/clube/:id/encontros/:encontroId/participacao', verificarAutenticacao, async (req, res) => {
    try {
        const clubeId = req.params.id;
        const encontroId = req.params.encontroId;
        const userId = req.session.userId;
        const { status } = req.body;
        
        if (!status || !['confirmado', 'talvez', 'recusado'].includes(status)) {
            return res.status(400).json({ erro: 'Status de participação inválido' });
        }
        
        const [participacoes] = await pool.query(
            'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
            [userId, clubeId]
        );
        
        if (participacoes.length === 0) {
            return res.status(403).json({ erro: 'Você não é membro deste clube' });
        }
        
        const encontro = await Encontros.buscarPorId(encontroId);
        
        if (!encontro || encontro.id_clube !== parseInt(clubeId)) {
            return res.status(404).json({ erro: 'Encontro não encontrado' });
        }
        
        const dataEncontro = new Date(encontro.data_encontro);
        dataEncontro.setHours(0, 0, 0, 0);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        if (dataEncontro < hoje) {
            return res.status(400).json({ erro: 'Não é possível confirmar participação em encontros passados' });
        }
        
        await Encontros.confirmarParticipacao(encontroId, userId, status);
        
        res.json({ mensagem: 'Participação atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao confirmar participação:', error);
        res.status(500).json({ erro: 'Erro ao confirmar participação no encontro' });
    }
});
app.get('/api/clube/:id/encontros/:encontroId/participantes', verificarAutenticacao, async (req, res) => {
    try {
        const clubeId = req.params.id;
        const encontroId = req.params.encontroId;
        const userId = req.session.userId;
        
        const [participacoes] = await pool.query(
            'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
            [userId, clubeId]
        );
        
        if (participacoes.length === 0) {
            return res.status(403).json({ erro: 'Você não é membro deste clube' });
        }
        
        const encontro = await Encontros.buscarPorId(encontroId);
        
        if (!encontro || encontro.id_clube !== parseInt(clubeId)) {
            return res.status(404).json({ erro: 'Encontro não encontrado' });
        }
        
        const participantes = await Encontros.listarParticipantes(encontroId);
        
        res.json(participantes);
    } catch (error) {
        console.error('Erro ao listar participantes:', error);
        res.status(500).json({ erro: 'Erro ao listar participantes do encontro' });
    }
});
app.get('/api/debug/encontros', verificarAutenticacao, async (req, res) => {
  try {
    const Encontros = require('./models/Encontros');
    const resultado = await Encontros.debug();
    res.json(resultado);
  } catch (error) {
    console.error('Erro na rota de debug:', error);
    res.status(500).json({ erro: 'Erro na depuração', detalhes: error.message });
  }
});
app.get('/api/debug/encontros/criar', verificarAutenticacao, async (req, res) => {
  try {
    const Encontros = require('./models/Encontros');
    const hoje = new Date().toISOString().split('T')[0];
    
    const encontroTeste = await Encontros.criar(
      req.query.clubeId || 1,
      'Encontro de Teste API',
      'Descrição de teste via API',
      hoje,
      '15:00',
      '17:00',
      'Local de teste',
      'https://meet.google.com/test-api',
      'hibrido'
    );
    
    res.json({
      mensagem: 'Encontro de teste criado com sucesso',
      encontro: encontroTeste
    });
  } catch (error) {
    console.error('Erro ao criar encontro de teste:', error);
    res.status(500).json({ 
      erro: 'Erro ao criar encontro de teste', 
      detalhes: error.message,
      stack: error.stack
    });
  }
});

app.get('/api/clube/:id/sugestoes', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    // Buscar sugestões do clube
    const [sugestoes] = await pool.query(`
      SELECT s.*, u.nome as nome_usuario, u.foto_perfil
      FROM sugestoes s
      JOIN usuarios u ON s.id_usuario = u.id
      WHERE s.id_clube = ?
      ORDER BY s.data_sugestao DESC
    `, [clubeId]);
    
    res.json(sugestoes);
  } catch (error) {
    console.error('Erro ao listar sugestões:', error);
    res.status(500).json({ erro: 'Erro ao listar sugestões do clube' });
  }
});

app.post('/api/clube/:id/sugestoes', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    const { titulo, autor, justificativa, imagemUrl, paginas } = req.body;
    
    console.log('Dados recebidos para sugestão:', {
      titulo, autor, justificativa, imagemUrl, paginas
    });
    
    if (!titulo) {
      return res.status(400).json({ erro: 'Título do livro é obrigatório' });
    }
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    const Sugestoes = require('./models/Sugestoes');
    const novaSugestao = await Sugestoes.criar(
      clubeId, 
      userId, 
      titulo, 
      autor || null, 
      justificativa || null, 
      imagemUrl || null, 
      paginas || null
    );
    
    console.log('Sugestão criada:', novaSugestao);
    
    res.status(201).json({
      mensagem: 'Sugestão criada com sucesso',
      sugestao: novaSugestao
    });
  } catch (error) {
    console.error('Erro ao criar sugestão:', error);
    res.status(500).json({ erro: 'Erro ao criar sugestão' });
  }
});
app.delete('/api/clube/:id/sugestoes/:sugestaoId', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const sugestaoId = req.params.sugestaoId;
    const userId = req.session.userId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    const [sugestoes] = await pool.query(
      'SELECT * FROM sugestoes WHERE id = ? AND id_clube = ?',
      [sugestaoId, clubeId]
    );
    
    if (sugestoes.length === 0) {
      return res.status(404).json({ erro: 'Sugestão não encontrada' });
    }
    
    const [clubes] = await pool.query(
      'SELECT id_criador FROM clubes WHERE id = ?',
      [clubeId]
    );
    
    const isCriador = clubes.length > 0 && clubes[0].id_criador === userId;
    const isAutor = sugestoes[0].id_usuario === userId;
    
    if (!isCriador && !isAutor) {
      return res.status(403).json({ erro: 'Você não tem permissão para excluir esta sugestão' });
    }
    
    await pool.query('DELETE FROM sugestoes WHERE id = ?', [sugestaoId]);
    
    res.json({ mensagem: 'Sugestão excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir sugestão:', error);
    res.status(500).json({ erro: 'Erro ao excluir sugestão' });
  }
});
app.get('/api/clube/:id/votacao', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    
    // Verificar se é membro do clube
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    const votacao = await Votacao.buscarVotacaoAtiva(clubeId);
    
    if (!votacao) {
      return res.json({ votacao: null, meuVoto: null });
    }
    
    // Verificar se o usuário já votou
    const meuVoto = await Votacao.verificarVotoUsuario(votacao.id, userId);
    
    res.json({
      votacao,
      meuVoto
    });
  } catch (error) {
    console.error('Erro ao buscar votação:', error);
    res.status(500).json({ erro: 'Erro ao buscar votação do clube' });
  }
});
app.post('/api/clube/:id/votacao', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    const { titulo, descricao, dataFim, sugestoes } = req.body;
    
    if (!titulo || !sugestoes || sugestoes.length < 2) {
      return res.status(400).json({ 
        erro: 'Título e pelo menos 2 sugestões são obrigatórios' 
      });
    }
    
    // Verificar se é o criador do clube
    const [clubeRows] = await pool.query(
      'SELECT id_criador FROM clubes WHERE id = ?',
      [clubeId]
    );
    
    if (clubeRows.length === 0) {
      return res.status(404).json({ erro: 'Clube não encontrado' });
    }
    
    if (clubeRows[0].id_criador !== parseInt(userId)) {
      return res.status(403).json({ 
        erro: 'Apenas o criador do clube pode criar votações' 
      });
    }
    
    // Verificar se já existe uma votação ativa
    const votacaoExistente = await Votacao.buscarVotacaoAtiva(clubeId);
    if (votacaoExistente) {
      return res.status(400).json({ 
        erro: 'Já existe uma votação ativa neste clube' 
      });
    }
    
    // Validar data de fim se fornecida
    if (dataFim) {
      const dataFimDate = new Date(dataFim);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      if (dataFimDate <= hoje) {
        return res.status(400).json({ 
          erro: 'A data de encerramento deve ser posterior a hoje' 
        });
      }
    }
    
    // Verificar se todas as sugestões existem e pertencem ao clube
    const placeholders = sugestoes.map(() => '?').join(',');
    const [sugestoesValidas] = await pool.query(
      `SELECT id FROM sugestoes WHERE id IN (${placeholders}) AND id_clube = ?`,
      [...sugestoes, clubeId]
    );
    
    if (sugestoesValidas.length !== sugestoes.length) {
      return res.status(400).json({ 
        erro: 'Uma ou mais sugestões são inválidas' 
      });
    }
    
    const novaVotacao = await Votacao.criarVotacao(
      clubeId,
      titulo,
      descricao || '',
      dataFim || null,
      sugestoes
    );
    
    res.status(201).json({
      mensagem: 'Votação criada com sucesso',
      votacao: novaVotacao
    });
  } catch (error) {
    console.error('Erro ao criar votação:', error);
    res.status(500).json({ erro: 'Erro ao criar votação' });
  }
});
app.post('/api/clube/:id/votacao/votar', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    const { idOpcao } = req.body;
    
    if (!idOpcao) {
      return res.status(400).json({ erro: 'ID da opção é obrigatório' });
    }
    
    // Verificar se é membro do clube
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    // Buscar votação ativa
    const votacao = await Votacao.buscarVotacaoAtiva(clubeId);
    if (!votacao) {
      return res.status(404).json({ erro: 'Nenhuma votação ativa encontrada' });
    }
    
    // Verificar se a opção pertence à votação
    const opcaoValida = votacao.opcoes.find(opcao => opcao.opcao_id === parseInt(idOpcao));
    if (!opcaoValida) {
      return res.status(400).json({ erro: 'Opção de voto inválida' });
    }
    
    // Verificar se a votação ainda está dentro do prazo (se houver)
    if (votacao.data_fim) {
      const agora = new Date();
      const dataFim = new Date(votacao.data_fim);
      if (agora > dataFim) {
        return res.status(400).json({ erro: 'O prazo para votação já expirou' });
      }
    }
    
    await Votacao.votar(votacao.id, userId, idOpcao);
    
    res.json({ mensagem: 'Voto registrado com sucesso' });
  } catch (error) {
    console.error('Erro ao votar:', error);
    res.status(500).json({ erro: error.message || 'Erro ao registrar voto' });
  }
});

// Endpoint para buscar votantes de uma opção específica
app.get('/api/clube/:id/votacao/opcao/:opcaoId/votantes', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const opcaoId = req.params.opcaoId;
    const userId = req.session.userId;
    
    // Verificar se é membro do clube
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    // Buscar votantes da opção
    const [votantes] = await pool.query(
      `SELECT u.id, u.nome, u.foto_perfil, v.data_voto
       FROM votos v
       JOIN usuarios u ON v.id_usuario = u.id
       JOIN opcoes_votacao ov ON v.id_opcao = ov.id
       JOIN votacoes vot ON ov.id_votacao = vot.id
       WHERE ov.id = ? AND vot.id_clube = ?
       ORDER BY v.data_voto ASC`,
      [opcaoId, clubeId]
    );
    
    res.json(votantes);
  } catch (error) {
    console.error('Erro ao buscar votantes:', error);
    res.status(500).json({ erro: 'Erro ao buscar votantes' });
  }
});
app.post('/api/clube/:id/votacao/encerrar', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    
    // Verificar se é o criador do clube
    const [clubeRows] = await pool.query(
      'SELECT id_criador FROM clubes WHERE id = ?',
      [clubeId]
    );
    
    if (clubeRows.length === 0) {
      return res.status(404).json({ erro: 'Clube não encontrado' });
    }
    
    if (clubeRows[0].id_criador !== parseInt(userId)) {
      return res.status(403).json({ 
        erro: 'Apenas o criador do clube pode encerrar votações' 
      });
    }
    const votacao = await Votacao.buscarVotacaoAtiva(clubeId);
    if (!votacao) {
      return res.status(404).json({ erro: 'Nenhuma votação ativa encontrada' });
    }
    
    const resultado = await Votacao.encerrarVotacao(votacao.id);
    
    res.json({
      mensagem: 'Votação encerrada com sucesso',
      resultado
    });
  } catch (error) {
    console.error('Erro ao encerrar votação:', error);
    res.status(500).json({ erro: 'Erro ao encerrar votação' });
  }
});
app.get('/api/clube/:id/votacao/:votacaoId/resultado', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const votacaoId = req.params.votacaoId;
    const userId = req.session.userId;

    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    const [votacaoRows] = await pool.query(
      'SELECT * FROM votacoes WHERE id = ? AND id_clube = ?',
      [votacaoId, clubeId]
    );
    
    if (votacaoRows.length === 0) {
      return res.status(404).json({ erro: 'Votação não encontrada' });
    }
    
    const resultado = await Votacao.buscarResultadoVotacao(votacaoId);
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar resultado:', error);
    res.status(500).json({ erro: 'Erro ao buscar resultado da votação' });
  }
});

app.get('/denuncias', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    
    if (!usuario || usuario.tipo !== 'admin') {
      return res.redirect('/dashboard');
    }
    
    res.render('denuncias', { 
      titulo: 'Loom - Gerenciar Denúncias',
      userId: req.session.userId,
      userType: usuario.tipo
    });
  } catch (error) {
    console.error('Erro ao carregar página de denúncias:', error);
    res.redirect('/painelAdmin');
  }
});
app.get('/api/clube/:id/votacoes/historico', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    
    const [participacoes] = await pool.query(
      'SELECT * FROM participacoes WHERE id_usuario = ? AND id_clube = ?',
      [userId, clubeId]
    );
    
    if (participacoes.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste clube' });
    }
    
    const historico = await Votacao.buscarHistoricoVotacoes(clubeId);
    
    res.json(historico);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ erro: 'Erro ao buscar histórico de votações' });
  }
});
app.get('/api/clube/:id/configuracoes', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    
    const [clubeRows] = await pool.query(
      'SELECT * FROM clubes WHERE id = ? AND id_criador = ?',
      [clubeId, userId]
    );
    
    if (clubeRows.length === 0) {
      return res.status(403).json({ erro: 'Apenas o criador do clube pode acessar as configurações' });
    }
    
    const clube = clubeRows[0];
    
    const [categoriasClube] = await pool.query(`
      SELECT c.id, c.nome
      FROM categorias c
      JOIN clube_categorias cc ON c.id = cc.id_categoria
      WHERE cc.id_clube = ?
    `, [clubeId]);
    
    const [todasCategorias] = await pool.query('SELECT id, nome FROM categorias ORDER BY nome');
    
    res.json({
      clube,
      categoriasClube,
      todasCategorias
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ erro: 'Erro ao buscar configurações do clube' });
  }
});
app.put('/api/clube/:id/configuracoes', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    const { nome, descricao, visibilidade, senha, modelo, cidade, estado } = req.body;
    
    const [clubeRows] = await pool.query(
      'SELECT * FROM clubes WHERE id = ? AND id_criador = ?',
      [clubeId, userId]
    );
    
    if (clubeRows.length === 0) {
      return res.status(403).json({ erro: 'Apenas o criador do clube pode editar as configurações' });
    }
    
    if (!nome || nome.trim().length === 0) {
      return res.status(400).json({ erro: 'Nome do clube é obrigatório' });
    }
    
    if (visibilidade === 'privado' && (!senha || senha.trim().length === 0)) {
      return res.status(400).json({ erro: 'Clubes privados precisam de uma senha de acesso' });
    }
    
    const modelosValidos = ['online', 'presencial', 'hibrido'];
    if (modelo && !modelosValidos.includes(modelo)) {
      return res.status(400).json({ erro: 'Modalidade inválida' });
    }
    
    const senhaAcesso = visibilidade === 'privado' ? senha : null;
    
    await pool.query(`
      UPDATE clubes 
      SET nome = ?, descricao = ?, visibilidade = ?, senha_acesso = ?, 
          modelo = ?, cidade = ?, estado = ?
      WHERE id = ?
    `, [nome, descricao || '', visibilidade, senhaAcesso, modelo, cidade || null, estado || null, clubeId]);
    
    const [clubeAtualizado] = await pool.query('SELECT * FROM clubes WHERE id = ?', [clubeId]);
    
    res.json({
      mensagem: 'Configurações atualizadas com sucesso',
      clube: clubeAtualizado[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ erro: 'Erro ao atualizar configurações do clube' });
  }
});

app.put('/api/clube/:id/categorias', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    const { categorias } = req.body;
    
    const [clubeRows] = await pool.query(
      'SELECT * FROM clubes WHERE id = ? AND id_criador = ?',
      [clubeId, userId]
    );
    
    if (clubeRows.length === 0) {
      return res.status(403).json({ erro: 'Apenas o criador do clube pode editar as categorias' });
    }
    
    await pool.query('DELETE FROM clube_categorias WHERE id_clube = ?', [clubeId]);
    
    if (categorias && categorias.length > 0) {
      const values = categorias.map(catId => [clubeId, catId]);
      const placeholders = values.map(() => '(?, ?)').join(', ');
      const flatValues = values.flat();
      
      await pool.query(
        `INSERT INTO clube_categorias (id_clube, id_categoria) VALUES ${placeholders}`,
        flatValues
      );
    }
    
    const [categoriasAtualizadas] = await pool.query(`
      SELECT c.id, c.nome
      FROM categorias c
      JOIN clube_categorias cc ON c.id = cc.id_categoria
      WHERE cc.id_clube = ?
    `, [clubeId]);
    
    res.json({
      mensagem: 'Categorias atualizadas com sucesso',
      categorias: categoriasAtualizadas
    });
  } catch (error) {
    console.error('Erro ao atualizar categorias:', error);
    res.status(500).json({ erro: 'Erro ao atualizar categorias do clube' });
  }
});
app.delete('/api/clube/:id', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const userId = req.session.userId;
    
    const [clubeRows] = await pool.query(
      'SELECT * FROM clubes WHERE id = ? AND id_criador = ?',
      [clubeId, userId]
    );
    
    if (clubeRows.length === 0) {
      return res.status(403).json({ erro: 'Apenas o criador do clube pode excluí-lo' });
    }
    
    const [result] = await pool.query('DELETE FROM clubes WHERE id = ?', [clubeId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Clube não encontrado' });
    }
    
    res.json({ mensagem: 'Clube excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir clube:', error);
    res.status(500).json({ erro: 'Erro ao excluir clube' });
  }
});
app.delete('/api/clube/:id/membros/:membroId', verificarAutenticacao, async (req, res) => {
  try {
    const clubeId = req.params.id;
    const membroId = req.params.membroId;
    const userId = req.session.userId;
    
    const [clubeRows] = await pool.query(
      'SELECT * FROM clubes WHERE id = ? AND id_criador = ?',
      [clubeId, userId]
    );
    
    if (clubeRows.length === 0) {
      return res.status(403).json({ erro: 'Apenas o criador do clube pode remover membros' });
    }
    
    if (parseInt(membroId) === parseInt(userId)) {
      return res.status(400).json({ erro: 'Você não pode se remover do próprio clube' });
    }
    
    const [result] = await pool.query(
      'DELETE FROM participacoes WHERE id_clube = ? AND id_usuario = ?',
      [clubeId, membroId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Membro não encontrado no clube' });
    }
    
    res.json({ mensagem: 'Membro removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    res.status(500).json({ erro: 'Erro ao remover membro do clube' });
  }
});
app.get('/api/admin/denuncias', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const denuncias = await Denuncias.listarTodas();
    const contadores = await Denuncias.contarPorStatus();
    
    res.json({ denuncias, contadores });
  } catch (error) {
    console.error('Erro ao listar denúncias:', error);
    res.status(500).json({ erro: 'Erro ao listar denúncias' });
  }
});
app.get('/api/admin/denuncias/:id', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const { id } = req.params;
    const denuncia = await Denuncias.buscarPorId(id);
    
    if (!denuncia) {
      return res.status(404).json({ erro: 'Denúncia não encontrada' });
    }
    
    res.json(denuncia);
  } catch (error) {
    console.error('Erro ao buscar denúncia:', error);
    res.status(500).json({ erro: 'Erro ao buscar denúncia' });
  }
});
app.post('/api/admin/denuncias/:id/processar', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.session.userId);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const { id } = req.params;
    const { acao, observacoes } = req.body;
    
    if (!acao || !['suspender_usuario', 'remover_atualizacao', 'rejeitar'].includes(acao)) {
      return res.status(400).json({ erro: 'Ação inválida' });
    }
    
    let denunciaAtualizada;
    
    if (acao === 'rejeitar') {
      denunciaAtualizada = await Denuncias.analisar(id, req.session.userId, 'rejeitada', observacoes);
    } else {
      denunciaAtualizada = await Denuncias.processarDenuncia(id, req.session.userId, acao, observacoes);
    }
    
    res.json({
      mensagem: 'Denúncia processada com sucesso',
      denuncia: denunciaAtualizada
    });
  } catch (error) {
    console.error('Erro ao processar denúncia:', error);
    res.status(500).json({ erro: error.message || 'Erro ao processar denúncia' });
  }
});
app.post('/api/denuncias', verificarAutenticacao, async (req, res) => {
  try {
    const { idAtualizacao, motivo, descricao } = req.body;
    
    if (!idAtualizacao || !motivo) {
      return res.status(400).json({ erro: 'ID da atualização e motivo são obrigatórios' });
    }
    
    const [atualizacoes] = await pool.query(
      'SELECT id_usuario FROM atualizacoes WHERE id = ?',
      [idAtualizacao]
    );
    
    if (atualizacoes.length === 0) {
      return res.status(404).json({ erro: 'Atualização não encontrada' });
    }
    
    const idDenunciado = atualizacoes[0].id_usuario;
    
    if (idDenunciado === req.session.userId) {
      return res.status(400).json({ erro: 'Você não pode denunciar sua própria atualização' });
    }
    
    const novaDenuncia = await Denuncias.criar(
      req.session.userId,
      idDenunciado,
      idAtualizacao,
      motivo,
      descricao
    );
    
    res.status(201).json({
      mensagem: 'Denúncia enviada com sucesso',
      denuncia: novaDenuncia
    });
  } catch (error) {
    console.error('Erro ao criar denúncia:', error);
    res.status(500).json({ erro: error.message || 'Erro ao enviar denúncia' });
  }
});

// Rotas de comentários
app.post('/api/comentarios', verificarAutenticacao, async (req, res) => {
  try {
    console.log('POST /api/comentarios - Dados recebidos:', req.body);
    console.log('Usuário da sessão:', req.session.userId);
    
    const { idAtualizacao, conteudo, gifUrl } = req.body;
    
    if (!idAtualizacao || !conteudo) {
      console.log('Erro: Dados obrigatórios ausentes', { idAtualizacao, conteudo });
      return res.status(400).json({ erro: 'ID da atualização e conteúdo são obrigatórios' });
    }
    
    if (conteudo.trim().length === 0) {
      console.log('Erro: Comentário vazio');
      return res.status(400).json({ erro: 'Comentário não pode estar vazio' });
    }
    
    // Verificar se a atualização existe
    console.log('Verificando se atualização existe:', idAtualizacao);
    const [atualizacao] = await pool.query(
      'SELECT id FROM atualizacoes WHERE id = ?',
      [idAtualizacao]
    );
    
    if (atualizacao.length === 0) {
      console.log('Erro: Atualização não encontrada', idAtualizacao);
      return res.status(404).json({ erro: 'Atualização não encontrada' });
    }
    
    console.log('Criando comentário...', { idAtualizacao, userId: req.session.userId, conteudo, gifUrl });
    const novoComentario = await Comentarios.criar(idAtualizacao, req.session.userId, conteudo, gifUrl || null);
    console.log('Comentário criado com sucesso:', novoComentario);
    
    res.status(201).json({
      mensagem: 'Comentário criado com sucesso',
      comentario: novoComentario
    });
  } catch (error) {
    console.error('Erro detalhado ao criar comentário:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ erro: 'Erro ao criar comentário', detalhes: error.message });
  }
});

app.get('/api/comentarios/:idAtualizacao', verificarAutenticacao, async (req, res) => {
  try {
    const { idAtualizacao } = req.params;
    
    const comentarios = await Comentarios.listarPorAtualizacao(idAtualizacao);
    
    res.json(comentarios);
  } catch (error) {
    console.error('Erro ao listar comentários:', error);
    res.status(500).json({ erro: 'Erro ao listar comentários' });
  }
});

app.put('/api/comentarios/:id', verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { conteudo, gifUrl } = req.body;
    
    if (!conteudo || conteudo.trim().length === 0) {
      return res.status(400).json({ erro: 'Conteúdo do comentário é obrigatório' });
    }
    
    // Verificar se o usuário pode editar este comentário
    const permissao = await Comentarios.verificarPermissao(id, req.session.userId);
    
    if (!permissao) {
      return res.status(403).json({ erro: 'Você não tem permissão para editar este comentário' });
    }
    
    const sucesso = await Comentarios.atualizar(id, conteudo, gifUrl || null);
    
    if (!sucesso) {
      return res.status(404).json({ erro: 'Comentário não encontrado' });
    }
    
    res.json({ mensagem: 'Comentário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar comentário:', error);
    res.status(500).json({ erro: 'Erro ao atualizar comentário' });
  }
});

app.delete('/api/comentarios/:id', verificarAutenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário pode excluir este comentário
    const permissao = await Comentarios.verificarPermissao(id, req.session.userId);
    
    if (!permissao) {
      return res.status(403).json({ erro: 'Você não tem permissão para excluir este comentário' });
    }
    
    const sucesso = await Comentarios.excluir(id);
    
    if (!sucesso) {
      return res.status(404).json({ erro: 'Comentário não encontrado' });
    }
    
    res.json({ mensagem: 'Comentário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    res.status(500).json({ erro: 'Erro ao excluir comentário' });
  }
});

app.get('/api/comentarios/:idAtualizacao/count', verificarAutenticacao, async (req, res) => {
  try {
    const { idAtualizacao } = req.params;
    
    const total = await Comentarios.contarPorAtualizacao(idAtualizacao);
    
    res.json({ total });
  } catch (error) {
    console.error('Erro ao contar comentários:', error);
    res.status(500).json({ erro: 'Erro ao contar comentários' });
  }
});

app.use((err, req, res, next) => {
  console.error('Erro global:', err);
  res.status(500).json({ 
    erro: 'Erro interno do servidor', 
    mensagem: process.env.NODE_ENV === 'production' ? 'Ocorreu um erro ao processar sua solicitação.' : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Loom Server running on http://localhost:${PORT}`);
  console.log(`📱 PWA available for installation!`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is busy. Trying alternative port...`);
    const altPort = PORT + 1;
    const altServer = app.listen(altPort, () => {
      console.log(`🚀 Loom Server running on http://localhost:${altPort}`);
      console.log(`📱 PWA available for installation!`);
    });
    
    altServer.on('error', (altErr) => {
      console.error(`❌ Failed to start server on ports ${PORT} and ${altPort}`);
      console.error('Please stop other Node.js processes and try again.');
      process.exit(1);
    });
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});
