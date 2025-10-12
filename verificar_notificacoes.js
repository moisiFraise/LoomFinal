// Script para verificar configuração de notificações push
const pool = require('./config/database');
require('dotenv').config();

async function verificarNotificacoes() {
  console.log('\n🔍 VERIFICAÇÃO DE NOTIFICAÇÕES PUSH\n');
  console.log('=' .repeat(50));
  
  // 1. Verificar VAPID Keys
  console.log('\n1️⃣ VAPID Keys:');
  console.log('   Public Key:', process.env.VAPID_PUBLIC_KEY ? '✅ Configurada' : '❌ NÃO configurada');
  console.log('   Private Key:', process.env.VAPID_PRIVATE_KEY ? '✅ Configurada' : '❌ NÃO configurada');
  console.log('   Email:', process.env.VAPID_EMAIL || '❌ NÃO configurado');
  
  // 2. Verificar tabela inscricoes_push
  console.log('\n2️⃣ Verificando tabela inscricoes_push:');
  try {
    const [tables] = await pool.safeQuery("SHOW TABLES LIKE 'inscricoes_push'");
    if (tables.length > 0) {
      console.log('   ✅ Tabela existe');
      
      // Verificar estrutura
      const [columns] = await pool.safeQuery("DESCRIBE inscricoes_push");
      console.log('   Colunas:', columns.map(c => c.Field).join(', '));
      
      // Contar registros
      const [count] = await pool.safeQuery("SELECT COUNT(*) as total FROM inscricoes_push WHERE ativo = 1");
      console.log('   Total de subscriptions ativas:', count[0].total);
      
      // Mostrar subscriptions
      if (count[0].total > 0) {
        const [subs] = await pool.safeQuery(`
          SELECT ip.id, ip.id_usuario, u.nome, u.email, ip.criado_em 
          FROM inscricoes_push ip 
          JOIN usuarios u ON ip.id_usuario = u.id 
          WHERE ip.ativo = 1
        `);
        console.log('\n   Subscriptions ativas:');
        subs.forEach(sub => {
          console.log(`   - ID: ${sub.id} | Usuário: ${sub.nome} (${sub.email}) | Criado em: ${sub.criado_em}`);
        });
      }
    } else {
      console.log('   ❌ Tabela NÃO existe - Execute a migration!');
      console.log('   Execute: mysql -u root -p loomdb < database/migration_push_subscriptions.sql');
    }
  } catch (err) {
    console.error('   ❌ Erro ao verificar tabela:', err.message);
  }
  
  // 3. Verificar módulo web-push
  console.log('\n3️⃣ Verificando módulo web-push:');
  try {
    const webpush = require('web-push');
    console.log('   ✅ web-push instalado');
    
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:' + (process.env.VAPID_EMAIL || 'admin@loom.com'),
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      console.log('   ✅ VAPID configurado no web-push');
    } else {
      console.log('   ⚠️ VAPID não configurado - notificações não funcionarão');
    }
  } catch (err) {
    console.error('   ❌ web-push NÃO instalado:', err.message);
  }
  
  // 4. Verificar rotas da API
  console.log('\n4️⃣ Verificando rotas da API:');
  try {
    const pushRoutes = require('./services/pushRoutes');
    console.log('   ✅ Rotas /api/push carregadas');
  } catch (err) {
    console.error('   ❌ Erro ao carregar rotas:', err.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✨ Verificação concluída!\n');
  
  process.exit(0);
}

verificarNotificacoes().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
