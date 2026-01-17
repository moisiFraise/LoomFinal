# 🔐 Guia Completo de Implementação de Segurança

## Fase 1: Setup Inicial (30 min)

### 1.1 Instalar Dependências
```bash
npm install helmet express-rate-limit joi xss
```

### 1.2 Gerar Chaves de Criptografia
```bash
node utils/setup-encryption.js
```

Isso vai gerar:
- `ENCRYPTION_KEY` (256 bits)
- `ENCRYPTION_IV` (128 bits)
- `SESSION_SECRET` (256 bits)

**⚠️ IMPORTANTE**: Adicione as chaves ao arquivo `.env`:
```env
ENCRYPTION_KEY=<copie aqui>
ENCRYPTION_IV=<copie aqui>
SESSION_SECRET=<copie aqui>
NODE_ENV=production
```

### 1.3 Executar Migrations de Segurança
```bash
mysql -u seu_usuario -p sua_senha loom_db < database/migrations-seguranca.sql
```

Isso cria:
- `audit_logs` - Log de todas as ações
- `login_attempts` - Tentativas de login
- `security_blocks` - Bloqueios de segurança
- `suspicious_activity` - Atividades suspeitas
- `two_factor_auth` - Autenticação em 2 fatores
- E mais...

### 1.4 Verificar .env
```env
# Segurança
ENCRYPTION_KEY=seu_valor
ENCRYPTION_IV=seu_valor
SESSION_SECRET=seu_valor
NODE_ENV=production
```

---

## Fase 2: Implementar Headers de Segurança (15 min)

### 2.1 Modificar app.js - No início do arquivo
```javascript
// Adicionar depois dos require's
const { 
  helmetConfig, 
  headersSeguranca,
  validarEntrada,
  securityLogger,
  loginLimiter,
  apiLimiter
} = require('./utils/security');

// Adicionar logo após criar app
app.use(helmetConfig);
app.use(headersSeguranca);
app.use(validarEntrada);
app.use(securityLogger);

// Limiter para API
app.use('/api/', apiLimiter);

// Limiter específico para login
app.post('/api/login', loginLimiter, async (req, res) => {
  // ... seu código de login
});
```

### 2.2 Verificar HTTPS em Produção
```javascript
// No app.js, verificar se está usando HTTPS
if (process.env.NODE_ENV === 'production') {
  // Forçar HTTPS
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## Fase 3: Criptografar Dados Sensíveis (1-2 horas)

### 3.1 Modificar Modelo Usuario

**Opção A: Criptografia de Email (recomendado começar com isso)**

```javascript
// models/Usuario.js

const { criptografar, descriptografar, hashSenha, compararSenha } = require('../utils/encryption');

// Na função de criar:
static async criar(dados) {
  try {
    // 1. Hash da senha
    const hash = await hashSenha(dados.senha);
    
    // 2. Criptografar email
    const emailCriptografado = criptografar(dados.email);
    
    // 3. Inserir com dados criptografados
    const query = `
      INSERT INTO usuarios (nome, email, hash_senha, ...)
      VALUES (?, ?, ?, ...)
    `;
    
    const [resultado] = await pool.safeQuery(query, [
      dados.nome,
      emailCriptografado,  // Criptografado
      hash,               // Hash bcrypt
      // ... outros campos
    ]);
    
    return resultado;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}

// Na função de buscar:
static async buscarPorId(id) {
  const [usuarios] = await pool.safeQuery(
    'SELECT * FROM usuarios WHERE id = ?', 
    [id]
  );
  
  if (usuarios.length > 0) {
    // Descriptografar email
    usuarios[0].email = descriptografar(usuarios[0].email);
  }
  
  return usuarios[0];
}
```

**Opção B: Criptografia Completa (todos os campos sensíveis)**

```javascript
// Campos a criptografar
const camposSensiveis = [
  'email',
  'telefone', 
  'cpf',
  'descricao'
];

// Helper function
function criptografarDados(dados) {
  const resultado = { ...dados };
  for (const campo of camposSensiveis) {
    if (resultado[campo]) {
      resultado[campo] = criptografar(resultado[campo]);
    }
  }
  return resultado;
}

function descriptografarDados(dados) {
  const resultado = { ...dados };
  for (const campo of camposSensiveis) {
    if (resultado[campo]) {
      resultado[campo] = descriptografar(resultado[campo]);
    }
  }
  return resultado;
}
```

### 3.2 Adicionar Hash Determinístico para Buscas
```javascript
// No modelo, para buscar por email:

static async buscarPorEmail(email) {
  const crypto = require('crypto');
  // Hash determinístico (sempre igual para o mesmo email)
  const emailHash = crypto
    .createHash('sha256')
    .update(email.toLowerCase())
    .digest('hex');
  
  // Buscar usando hash
  const [usuarios] = await pool.safeQuery(
    'SELECT * FROM usuarios WHERE email_hash = ?',
    [emailHash]
  );
  
  // Descriptografar resultado
  if (usuarios.length > 0) {
    usuarios[0].email = descriptografar(usuarios[0].email);
  }
  
  return usuarios[0];
}
```

### 3.3 Adicionar Nova Coluna no Banco (se necessário)
```sql
-- Se você quer adicionar coluna para hash de email
ALTER TABLE usuarios ADD COLUMN email_hash VARCHAR(64);

-- Popular com dados existentes (em desenvolvimento)
UPDATE usuarios SET email_hash = SHA2(LOWER(email), 256);

-- Em produção, você precisará fazer isso com cuidado:
-- 1. Primeiro, descriptografar dados existentes
-- 2. Fazer hash dos emails
-- 3. Depois criptografar emails novamente
```

---

## Fase 4: Adicionar Auditoria (45 min)

### 4.1 Importar AuditLog no app.js
```javascript
const AuditLog = require('./models/AuditLog');
```

### 4.2 Registrar Ações Importantes
```javascript
// Exemplo: ao criar usuário
app.post('/api/usuarios', verificarAutenticacao, async (req, res) => {
  try {
    // ... seu código
    
    // Registrar na auditoria
    await AuditLog.registrar(
      req.user.id,           // Quem fez
      'CREATE',              // O quê
      'usuarios',            // Onde
      { novo_usuario_id: novoUsuario.id }, // Dados
      req.ip,                // De onde
      req.get('user-agent')  // Com quê (navegador)
    );
    
    res.json({ mensagem: 'Usuário criado' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
});

// Exemplo: ao deletar
app.delete('/api/usuarios/:id', verificarAutenticacao, async (req, res) => {
  try {
    // ... seu código
    
    await AuditLog.registrar(
      req.user.id,
      'DELETE',
      'usuarios',
      { usuario_deletado_id: req.params.id },
      req.ip,
      req.get('user-agent')
    );
    
    res.json({ mensagem: 'Usuário deletado' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro ao deletar usuário' });
  }
});
```

### 4.3 Rota para Ver Logs (Admin apenas)
```javascript
app.get('/api/admin/audit-logs', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.user.id);
    
    // Verificar se é admin
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const { userId, acao, tabela } = req.query;
    
    const logs = await AuditLog.buscar({
      userId: userId ? parseInt(userId) : undefined,
      acao,
      tabela
    });
    
    res.json(logs);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro ao buscar logs' });
  }
});

// Rota para relatório de segurança
app.get('/api/admin/relatorio-seguranca', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.user.id);
    if (!usuario || usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    const dataInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 dias atrás
    const dataFim = new Date();
    
    const relatorio = await AuditLog.gerarRelatoriSeguranca(dataInicio, dataFim);
    
    res.json(relatorio);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro ao gerar relatório' });
  }
});
```

---

## Fase 5: Implementar Rate Limiting em Login (30 min)

### 5.1 Modificar rota de login
```javascript
const { loginLimiter } = require('./utils/security');

app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // ... seu código de autenticação
    
    // Registrar tentativa bem-sucedida
    await AuditLog.registrar(
      usuario.id,
      'LOGIN_SUCESSO',
      'usuarios',
      null,
      req.ip,
      req.get('user-agent')
    );
    
  } catch (error) {
    // Registrar tentativa falhada
    await AuditLog.registrar(
      null,
      'LOGIN_FALHOU',
      'usuarios',
      { email: email },
      req.ip,
      req.get('user-agent')
    );
  }
});
```

### 5.2 Adicionar Detecção de Atividade Suspeita
```javascript
// Criar uma função para detectar tentativas suspeitas
async function verificarAtividadeSuspeita(email, ip) {
  const tentativasUltimaHora = await AuditLog.buscar({
    acao: 'LOGIN_FALHOU',
    dataInicio: new Date(Date.now() - 60 * 60 * 1000) // 1 hora
  });
  
  const tentativasDoIP = tentativasUltimaHora.filter(log => log.ip === ip);
  
  if (tentativasDoIP.length >= 5) {
    console.warn(`⚠️ Suspeito: ${ip} teve 5+ tentativas de login em 1 hora`);
    // Bloquear IP temporariamente
    // ... implementar bloqueio
  }
}
```

---

## Fase 6: Validação de Entrada (30 min)

### 6.1 Criar Schema de Validação com Joi
```javascript
// utils/schemas.js
const Joi = require('joi');

const schemaUsuario = Joi.object({
  nome: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  senha: Joi.string()
    .min(8)
    .pattern(/[A-Z]/)        // Letra maiúscula
    .pattern(/[a-z]/)        // Letra minúscula
    .pattern(/[0-9]/)        // Número
    .pattern(/[!@#$%^&*]/)   // Caractere especial
    .required(),
  telefone: Joi.string().pattern(/^\d{10,11}$/).optional(),
  cpf: Joi.string().pattern(/^\d{11}$/).optional()
});

module.exports = { schemaUsuario };
```

### 6.2 Usar Validação nas Rotas
```javascript
const { schemaUsuario } = require('./utils/schemas');

app.post('/api/usuarios', async (req, res) => {
  try {
    // Validar entrada
    const { error, value } = schemaUsuario.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        erro: 'Dados inválidos',
        detalhes: error.details.map(d => d.message)
      });
    }
    
    // Se chegou aqui, dados estão válidos
    const usuario = await Usuario.criar(value);
    
    res.status(201).json({ usuario });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
});
```

---

## Fase 7: Autenticação em 2 Fatores (2-3 horas)

### 7.1 Instalar dependência
```bash
npm install speakeasy qrcode
```

### 7.2 Criar serviço de 2FA
```javascript
// services/TwoFactorService.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class TwoFactorService {
  static gerarSegredo(usuario) {
    const secret = speakeasy.generateSecret({
      name: `Loom (${usuario.email})`,
      issuer: 'Loom',
      length: 32
    });
    
    return secret;
  }
  
  static async gerarQR(secret) {
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    return qrCode;
  }
  
  static verificarToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
  }
}

module.exports = TwoFactorService;
```

---

## Fase 8: LGPD e Direito ao Esquecimento (1-2 horas)

### 8.1 Implementar Soft Delete
```javascript
// models/Usuario.js

static async excluir(id, motivo = null) {
  try {
    // Soft delete - não deletar, apenas marcar
    const query = `
      UPDATE usuarios 
      SET 
        deletado_em = NOW(),
        motivo_delecao = ?,
        nome = CONCAT('Usuario_', id),
        email = NULL,
        telefone = NULL,
        cpf = NULL
      WHERE id = ?
    `;
    
    const [resultado] = await pool.safeQuery(query, [motivo, id]);
    
    return resultado.affectedRows > 0;
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    throw error;
  }
}

// Adicionar ao listar sempre:
// WHERE deletado_em IS NULL
```

### 8.2 Rota para LGPD
```javascript
app.post('/api/meus-dados', verificarAutenticacao, async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.user.id);
    
    // Retornar todos os dados do usuário
    res.json({
      usuario,
      dados_pessoais: usuario,
      atualizacoes: await Atualizacoes.buscarPorUsuario(usuario.id),
      comentarios: await Comentarios.buscarPorUsuario(usuario.id),
      logs: await AuditLog.buscarPorUsuario(usuario.id)
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar dados' });
  }
});

app.post('/api/deletar-conta', verificarAutenticacao, async (req, res) => {
  try {
    const { senha, confirmacao } = req.body;
    
    if (confirmacao !== 'SIM, DELETAR MINHA CONTA') {
      return res.status(400).json({ erro: 'Confirmação inválida' });
    }
    
    // Verificar senha
    const usuario = await Usuario.buscarPorId(req.user.id);
    const senhaValida = await compararSenha(senha, usuario.hash_senha);
    
    if (!senhaValida) {
      return res.status(403).json({ erro: 'Senha incorreta' });
    }
    
    // Deletar conta
    await Usuario.excluir(usuario.id, 'Deletado pelo usuário');
    
    // Logout
    req.session.destroy();
    
    res.json({ mensagem: 'Conta deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao deletar conta' });
  }
});
```

---

## Checklist Final de Segurança

- [ ] Headers de segurança implementados (Helmet)
- [ ] Chaves de criptografia geradas e no .env
- [ ] Migrations de segurança executadas
- [ ] Email criptografado no banco
- [ ] Senhas com bcrypt (já implementado)
- [ ] Rate limiting em login
- [ ] Auditoria de ações registrada
- [ ] Validação de entrada com Joi
- [ ] XSS protection ativa
- [ ] SQL injection protection
- [ ] CSRF protection (via session)
- [ ] HTTPS ativado em produção
- [ ] Soft delete para usuários
- [ ] Direito ao esquecimento implementado
- [ ] 2FA pronto (opcional)
- [ ] Logs criptografados
- [ ] Backup seguro de dados

---

## Teste de Segurança

```javascript
// tests/security.test.js
const request = require('supertest');
const app = require('../app');

describe('Segurança', () => {
  test('Deve bloquear SQL injection', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        email: "admin' OR '1'='1",
        senha: 'teste'
      });
    
    expect(res.status).toBe(400);
  });
  
  test('Deve bloquear XSS', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({
        nome: '<script>alert("XSS")</script>',
        email: 'teste@teste.com',
        senha: 'Senha123!@#'
      });
    
    expect(res.status).toBe(400);
  });
  
  test('Deve aplicar rate limiting', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/login')
        .send({
          email: 'teste@teste.com',
          senha: 'incorreta'
        });
    }
    
    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'teste@teste.com',
        senha: 'incorreta'
      });
    
    expect(res.status).toBe(429); // Too Many Requests
  });
});
```

---

## Suporte e Dúvidas

Se tiver dúvidas sobre qualquer etapa:
1. Consulte a documentação do módulo específico
2. Verifique os exemplos em `utils/exemplo-modelo-criptografado.js`
3. Revise o arquivo de segurança `SEGURANCA_CRIPTOGRAFIA.md`

## Próximas Etapas

1. **Certificado SSL/TLS** - Obtenha em https://letsencrypt.org
2. **Web Application Firewall** - Cloudflare ou AWS WAF
3. **Monitoramento** - Implement alertas para atividades suspeitas
4. **Testes de Penetração** - Contrate profissional para testar
5. **SIEM** - Implement Security Information and Event Management
