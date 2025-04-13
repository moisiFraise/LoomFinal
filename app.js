const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Usuario = require('./models/Usuario');
require('dotenv').config();
const session = require('express-session');
const Categorias = require('./models/Categorias');
const Explorar = require('./models/explorar');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'sua_chave_secreta',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Rota página inicial
app.get('/', (req, res) => {
  res.render('index', { title: 'Loom - Home' });
});

app.get('/autenticacao', (req, res) => {
  res.render('autenticacao', { titulo: 'Loom - Login e Cadastro' });
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
    
    req.session.userId = usuario.id;
    
    res.status(200).json({ 
      mensagem: 'Login realizado com sucesso!',
      usuario: { 
        id: usuario.id, 
        nome: usuario.nome, 
        email: usuario.email,
        tipo: usuario.tipo
      }
    });
  } catch (error) {
    console.error('Erro detalhado no login:', error);
    res.status(500).json({ 
      erro: 'Erro ao processar o login. Tente novamente.',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
function verificarAutenticacao(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/autenticacao');
  }
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

const Clube = require('./models/Clube');

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


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
