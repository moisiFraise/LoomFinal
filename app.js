const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Usuario = require('./models/Usuario');
require('dotenv').config();
const session = require('express-session');


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

// Rota da página inicial
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

app.get('/dashboard', verificarAutenticacao, (req, res) => {
  res.render('dashboard', { 
    titulo: 'Loom - Meus Clubes',
    userId: req.session.userId  // userID da sessão
  });
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
      const { nome, descricao, idCriador, visibilidade, senha } = req.body;
      
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
        senha
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

const Explorar = require('./models/explorar');

app.get('/explorar', verificarAutenticacao, (req, res) => {
  res.render('explorar', { 
    titulo: 'Loom - Explorar Clubes',
    userId: req.session.userId
  });
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


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
