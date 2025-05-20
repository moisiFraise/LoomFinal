const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Usuario = require('./models/Usuario');
require('dotenv').config();
const session = require('express-session');
const Categorias = require('./models/Categorias');
const Explorar = require('./models/Explorar');
const pool = require('./config/database');
const Clube = require('./models/Clube');
const Leituras = require('./models/Leituras');
const Atualizacoes = require('./models/Atualizacoes');
const Curtidas = require('./models/Curtidas');
const MySQLStore = require('express-mysql-session')(session);;


const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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
app.use(session({
  key: 'loom_session',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: 'lax'
  }
}));
app.use((req, res, next) => {
  console.log('Sessão atual:', req.session);
  console.log('ID do usuário na sessão:', req.session.userId);
  next();
});
// Rota página inicial
app.get('/', (req, res) => {
  res.render('index', { title: 'Loom - Home' });
});

app.get('/autenticacao', (req, res) => {
  res.render('autenticacao', { titulo: 'Loom - Login e Cadastro' });
});
app.get('/api/session-check', (req, res) => {
  res.json({
    sessionExists: !!req.session,
    userId: req.session.userId,
    authenticated: req.session.authenticated,
    sessionID: req.sessionID
  });
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
    
    // Limpar a sessão existente
    req.session.regenerate(function(err) {
      if (err) {
        console.error('Erro ao regenerar sessão:', err);
        return res.status(500).json({ erro: 'Erro ao processar o login. Problema com a sessão.' });
      }
      
      // Definir dados da sessão
      req.session.userId = usuario.id;
      req.session.userType = usuario.tipo;
      req.session.authenticated = true;
      
      // Salvar a sessão
      req.session.save(function(err) {
        if (err) {
          console.error('Erro ao salvar sessão:', err);
          return res.status(500).json({ erro: 'Erro ao processar o login. Problema ao salvar a sessão.' });
        }
        
        console.log('Sessão salva com sucesso. ID do usuário:', req.session.userId);
        
        res.status(200).json({ 
          mensagem: 'Login realizado com sucesso!',
          usuario: { 
            id: usuario.id, 
            nome: usuario.nome, 
            email: usuario.email,
            tipo: usuario.tipo
          }
        });
      });
    });
  } catch (error) {
    console.error('Erro detalhado no login:', error);
    res.status(500).json({ 
      erro: 'Erro ao processar o login. Tente novamente.',
      detalhes: process.env.NODE_ENV === 'production' ? error.message : undefined
    });
  }
});
function verificarAutenticacao(req, res, next) {
  console.log('Verificando autenticação, sessão:', req.session);
  console.log('userId na sessão:', req.session.userId);
  
  if (!req.session.userId) {
    console.log('Usuário não autenticado, redirecionando para /autenticacao');
    return res.redirect('/autenticacao');
  }
  
  console.log('Usuário autenticado, continuando...');
  next();
}
app.get('/dashboard', verificarAutenticacao, async (req, res) => {
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

app.post('/api/clubes', async (req, res) => {
  try {
    const { nome, descricao, idCriador, visibilidade, senha, categorias } = req.body;
    
    if (!nome || !idCriador) {
      return res.status(400).json({ erro: 'Nome do clube e ID do criador são obrigatórios.' });
    }
    
    if (visibilidade === 'privado' && !senha) {
      return res.status(400).json({ erro: 'Clubes privados precisam de uma senha de acesso.' });
    }
    
    const novoClube = await Clube.criar(
      nome, 
      descricao || '', 
      idCriador, 
      visibilidade || 'publico', 
      senha,
      categorias || []
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

app.get('/explorar', verificarAutenticacao, async (req, res) => {
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
/*clubePrincipal*/
app.get('/clube/:id', verificarAutenticacao, async (req, res) => {
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
      const { conteudo, paginaAtual } = req.body;
      
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
          leituraAtual.paginas || 100
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
    const { conteudo, paginaAtual } = req.body;
    
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
      'UPDATE atualizacoes SET conteudo = ?, porcentagem_leitura = ? WHERE id = ?',
      [conteudo, porcentagemLeitura, atualizacaoId]
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
//curtir/recurtir atualizaxcao
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
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
