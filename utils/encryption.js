const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Chave de criptografia do arquivo .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_IV = process.env.ENCRYPTION_IV;

if (!ENCRYPTION_KEY || !ENCRYPTION_IV) {
  throw new Error('ENCRYPTION_KEY e ENCRYPTION_IV devem ser definidos no .env');
}

/**
 * Criptografar texto com AES-256-CBC
 * @param {string} text - Texto a criptografar
 * @returns {string} Texto criptografado em base64
 */
function criptografar(text) {
  if (!text) return null;
  
  try {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      Buffer.from(ENCRYPTION_IV, 'hex')
    );
    
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    throw error;
  }
}

/**
 * Descriptografar texto com AES-256-CBC
 * @param {string} encrypted - Texto criptografado em hex
 * @returns {string} Texto descriptografado
 */
function descriptografar(encrypted) {
  if (!encrypted) return null;
  
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      Buffer.from(ENCRYPTION_IV, 'hex')
    );
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    throw error;
  }
}

/**
 * Hash de senha com bcrypt
 * @param {string} senha - Senha em texto plano
 * @returns {Promise<string>} Hash da senha
 */
async function hashSenha(senha) {
  if (!senha) throw new Error('Senha é obrigatória');
  
  try {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(senha, salt);
  } catch (error) {
    console.error('Erro ao fazer hash da senha:', error);
    throw error;
  }
}

/**
 * Comparar senha com hash
 * @param {string} senha - Senha em texto plano
 * @param {string} hash - Hash armazenado
 * @returns {Promise<boolean>} True se a senha corresponde
 */
async function compararSenha(senha, hash) {
  if (!senha || !hash) return false;
  
  try {
    return await bcrypt.compare(senha, hash);
  } catch (error) {
    console.error('Erro ao comparar senha:', error);
    return false;
  }
}

/**
 * Gerar hash SHA256 para verificação de integridade
 * @param {string} data - Dados a hashear
 * @returns {string} Hash SHA256 em hex
 */
function hashSHA256(data) {
  return crypto
    .createHash('sha256')
    .update(String(data))
    .digest('hex');
}

/**
 * Gerar token aleatório seguro
 * @param {number} length - Comprimento do token (padrão: 32)
 * @returns {string} Token em base64
 */
function gerarToken(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Gerar token aleatório seguro (versão hex)
 * @param {number} length - Comprimento em bytes (padrão: 32)
 * @returns {string} Token em hex
 */
function gerarTokenHex(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Gerar chave de criptografia (para setup inicial)
 * @returns {object} Objeto com ENCRYPTION_KEY e ENCRYPTION_IV
 */
function gerarChaveCriptografia() {
  const key = crypto.randomBytes(32).toString('hex'); // 256 bits
  const iv = crypto.randomBytes(16).toString('hex');  // 128 bits
  
  return {
    ENCRYPTION_KEY: key,
    ENCRYPTION_IV: iv,
    instrucoes: 'Adicione essas variáveis ao arquivo .env'
  };
}

/**
 * Validar força da senha
 * @param {string} senha - Senha a validar
 * @returns {object} Objeto com validação detalhada
 */
function validarForcaSenha(senha) {
  if (!senha) {
    return {
      valida: false,
      forca: 'muito_fraca',
      erros: ['Senha não pode estar vazia'],
      score: 0
    };
  }

  let score = 0;
  const erros = [];

  // Comprimento mínimo
  if (senha.length < 8) {
    erros.push('Senha deve ter pelo menos 8 caracteres');
  } else {
    score += 1;
    if (senha.length >= 12) score += 1;
    if (senha.length >= 16) score += 1;
  }

  // Letras maiúsculas
  if (!/[A-Z]/.test(senha)) {
    erros.push('Deve conter letras maiúsculas');
  } else {
    score += 1;
  }

  // Letras minúsculas
  if (!/[a-z]/.test(senha)) {
    erros.push('Deve conter letras minúsculas');
  } else {
    score += 1;
  }

  // Números
  if (!/[0-9]/.test(senha)) {
    erros.push('Deve conter números');
  } else {
    score += 1;
  }

  // Caracteres especiais
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
    erros.push('Deve conter caracteres especiais (!@#$%^&* etc)');
  } else {
    score += 1;
  }

  // Sequências comuns
  const sequenciasComuns = ['123', 'abc', 'qwerty', 'password', '111', '000'];
  const temSequencia = sequenciasComuns.some(seq => 
    senha.toLowerCase().includes(seq)
  );
  
  if (temSequencia) {
    erros.push('Evite sequências óbvias');
    score -= 1;
  }

  let forca = 'muito_fraca';
  if (score >= 6) forca = 'muito_forte';
  else if (score >= 5) forca = 'forte';
  else if (score >= 3) forca = 'media';
  else if (score >= 1) forca = 'fraca';

  return {
    valida: erros.length === 0,
    forca,
    erros,
    score: Math.max(0, Math.min(7, score))
  };
}

/**
 * Mascarar dados sensíveis para logging
 * @param {string} dado - Dado a mascarar
 * @param {number} visivel - Quantidade de caracteres visíveis
 * @returns {string} Dado mascarado
 */
function mascarar(dado, visivel = 2) {
  if (!dado) return null;
  
  const str = String(dado);
  if (str.length <= visivel) return '*'.repeat(str.length);
  
  const parte = str.slice(0, visivel);
  const asteriscos = '*'.repeat(str.length - visivel);
  
  return parte + asteriscos;
}

/**
 * Verificar integridade de dados
 * @param {string} dados - Dados originais
 * @param {string} hash - Hash para comparar
 * @returns {boolean} True se intacto
 */
function verificarIntegridade(dados, hash) {
  const novoHash = hashSHA256(dados);
  return novoHash === hash;
}

module.exports = {
  criptografar,
  descriptografar,
  hashSenha,
  compararSenha,
  hashSHA256,
  gerarToken,
  gerarTokenHex,
  gerarChaveCriptografia,
  validarForcaSenha,
  mascarar,
  verificarIntegridade
};
