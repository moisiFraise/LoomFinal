// Debug de subscriptions
const pool = require('./config/database');
const PushSubscription = require('./models/PushSubscription');
require('dotenv').config();

async function debugSubscriptions() {
  console.log('\n🔍 DEBUG DE SUBSCRIPTIONS\n');
  console.log('=' .repeat(60));
  
  // 1. Buscar todas as subscriptions direto no banco
  console.log('\n1️⃣ Subscriptions direto no banco:');
  const [allSubs] = await pool.safeQuery(`
    SELECT id, id_usuario, ativo, criado_em 
    FROM inscricoes_push 
    ORDER BY id DESC
  `);
  
  console.log(`   Total de registros: ${allSubs.length}`);
  allSubs.forEach(sub => {
    console.log(`   - ID: ${sub.id} | User ID: ${sub.id_usuario} | Ativo: ${sub.ativo} | Criado: ${sub.criado_em}`);
  });
  
  // 2. Testar modelo PushSubscription para cada usuário
  console.log('\n2️⃣ Testando modelo PushSubscription.findByUserId():');
  const uniqueUserIds = [...new Set(allSubs.map(s => s.id_usuario))];
  
  for (const userId of uniqueUserIds) {
    console.log(`\n   User ID ${userId}:`);
    const result = await PushSubscription.findByUserId(userId);
    console.log(`   - Resultado: ${result.length} subscription(s) encontrada(s)`);
    if (result.length > 0) {
      result.forEach((sub, i) => {
        console.log(`   - [${i}] ID: ${sub.id} | Ativo: ${sub.ativo}`);
      });
    }
  }
  
  // 3. Verificar estrutura de uma subscription
  console.log('\n3️⃣ Estrutura de uma subscription:');
  if (allSubs.length > 0) {
    const [firstSub] = await pool.safeQuery(
      'SELECT * FROM inscricoes_push WHERE id = ? LIMIT 1',
      [allSubs[0].id]
    );
    console.log('   Subscription completa:', JSON.stringify(firstSub[0], null, 2));
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  process.exit(0);
}

debugSubscriptions().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
