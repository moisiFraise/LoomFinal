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
  

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
