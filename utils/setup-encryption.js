#!/usr/bin/env node

/**
 * Script para gerar chaves de criptografia
 * Execute: node utils/setup-encryption.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('\n🔐 Setup de Criptografia - Loom\n');
console.log('=' .repeat(50));

// Gerar ENCRYPTION_KEY (256 bits)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('\n✓ ENCRYPTION_KEY gerada (256 bits)');

// Gerar ENCRYPTION_IV (128 bits)
const encryptionIV = crypto.randomBytes(16).toString('hex');
console.log('✓ ENCRYPTION_IV gerada (128 bits)');

// Gerar SESSION_SECRET se não existir
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('✓ SESSION_SECRET gerada (256 bits)');

// Conteúdo para adicionar ao .env
const envContent = `# ============================================
# 🔐 CONFIGURAÇÕES DE CRIPTOGRAFIA
# ============================================
ENCRYPTION_KEY=${encryptionKey}
ENCRYPTION_IV=${encryptionIV}
SESSION_SECRET=${sessionSecret}

# Descomente a linha abaixo em PRODUÇÃO
# NODE_ENV=production
`;

// Verificar se .env existe
const envPath = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);

console.log('\n' + '='.repeat(50));
console.log('\n📋 Adicione as linhas abaixo ao seu arquivo .env:\n');
console.log(envContent);
console.log('='.repeat(50));

if (envExists) {
  console.log('\n⚠️  Arquivo .env já existe.');
  console.log('   Adicione manualmente as variáveis acima.');
} else {
  console.log('\n✅ Criar arquivo .env com o conteúdo acima');
}

console.log('\n🔑 Variáveis de Criptografia:\n');
console.log(`ENCRYPTION_KEY: ${encryptionKey}`);
console.log(`ENCRYPTION_IV:  ${encryptionIV}`);
console.log(`SESSION_SECRET: ${sessionSecret}`);

console.log('\n⚠️  IMPORTANTE:');
console.log('   1. Guarde essas chaves em local seguro');
console.log('   2. NUNCA commite .env no git');
console.log('   3. Use as mesmas chaves em todos os servidores');
console.log('   4. Faça backup das chaves');
console.log('   5. Se perder as chaves, dados criptografados ficarão inacessíveis');

console.log('\n✅ Setup concluído!\n');
