const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss');
const { mascarar } = require('./encryption');

/**
 * Middleware de headers de segurança (Helmet)
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "api.giphy.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});

/**
 * Rate limiter para login (mais restritivo)
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip para desenvolvimento
    return process.env.NODE_ENV === 'development';
  },
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit atingido para login: ${req.ip}`);
    res.status(429).json({
      erro: 'Muitas tentativas. Tente novamente em 15 minutos.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Rate limiter para API (moderado)
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: 'Muitas requisições. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * Rate limiter para reset de senha
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 tentativas
  message: 'Máximo de tentativas de reset atingido. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * Sanitizar entrada XSS
 * @param {string} input - String a sanitizar
 * @returns {string} String sanitizada
 */
function sanitizarXSS(input) {
  if (!input) return input;
  
  return xss(String(input), {
    whiteList: {
      b: [],
      i: [],
      em: [],
      strong: [],
      a: ['href', 'title'],
      p: [],
      br: [],
      ul: [],
      ol: [],
      li: []
    },
    onTag: (tag, html, options) => {
      // Remove tags perigosas
      if (['script', 'iframe', 'object', 'embed', 'form', 'input'].includes(tag)) {
        return '';
      }
    }
  });
}

/**
 * Validar SQL básico (prevent SQL injection)
 * @param {string} input - String a validar
 * @returns {boolean} True se parece seguro
 */
function validarSQL(input) {
  if (!input) return true;
  
  const str = String(input).toLowerCase();
  const padroesPerigosos = [
    /(\b(union|select|insert|update|delete|drop|exec|script|javascript)\b)/i,
    /(-{2}|\/\*|\*\/|;)/,
    /(0x[0-9a-f]+)/i
  ];
  
  for (const padrao of padroesPerigosos) {
    if (padrao.test(str)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Middleware para validar entrada básica
 */
const validarEntrada = (req, res, next) => {
  // Sanitizar corpo da requisição
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        // Validar contra SQL injection
        if (!validarSQL(value)) {
          console.warn(`⚠️ Possível SQL injection detectada em ${key}: ${mascarar(value)}`);
          return res.status(400).json({ 
            erro: 'Entrada inválida. Caracteres perigosos detectados.' 
          });
        }
        
        // Sanitizar XSS
        req.body[key] = sanitizarXSS(value);
      }
    }
  }
  
  // Sanitizar parâmetros da URL
  if (req.params && typeof req.params === 'object') {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string') {
        if (!validarSQL(value)) {
          console.warn(`⚠️ Possível SQL injection detectada em param ${key}`);
          return res.status(400).json({ 
            erro: 'Parâmetro inválido' 
          });
        }
      }
    }
  }
  
  next();
};

/**
 * Middleware para CSRF protection (se não usar token session)
 */
const crsfProtection = (req, res, next) => {
  // Métodos seguros
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Verificar origem
  const origin = req.get('origin');
  const referer = req.get('referer');
  const host = req.get('host');
  
  // Validação básica de origem
  if (origin || referer) {
    const origem = origin || referer;
    if (!origem.includes(host) && process.env.NODE_ENV === 'production') {
      console.warn(`⚠️ CSRF suspeito: origem ${origem}, host ${host}`);
      return res.status(403).json({ erro: 'Requisição inválida' });
    }
  }
  
  next();
};

/**
 * Middleware para logs de segurança
 */
const securityLogger = (req, res, next) => {
  const metodosPerigosos = ['DELETE', 'UPDATE', 'INSERT'];
  
  if (metodosPerigosos.includes(req.method)) {
    console.log(`[SEGURANÇA] ${req.method} ${req.path} - Usuário: ${req.session?.userId || 'anônimo'}`);
  }
  
  next();
};

/**
 * Verificar força da senha (middleware para rotas específicas)
 */
const verificarForcaSenha = (req, res, next) => {
  const { novaSenha, senha } = req.body;
  const senhaAVerificar = novaSenha || senha;
  
  if (!senhaAVerificar) {
    return next();
  }
  
  // Implementado no encryption.js
  next();
};

/**
 * Remover dados sensíveis da resposta
 */
function removerSensiveis(objeto) {
  if (!objeto) return objeto;
  
  const copia = { ...objeto };
  const camposSensiveis = [
    'senha_hash',
    'password_hash',
    'hash_senha',
    'token_reset',
    'encryption_key',
    'api_secret',
    'api_key',
    'secret'
  ];
  
  for (const campo of camposSensiveis) {
    if (copia.hasOwnProperty(campo)) {
      delete copia[campo];
    }
  }
  
  return copia;
}

/**
 * Headers adicionais de segurança personalizados
 */
const headersSeguranca = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

module.exports = {
  helmetConfig,
  loginLimiter,
  apiLimiter,
  passwordResetLimiter,
  sanitizarXSS,
  validarSQL,
  validarEntrada,
  crsfProtection,
  securityLogger,
  verificarForcaSenha,
  removerSensiveis,
  headersSeguranca
};
