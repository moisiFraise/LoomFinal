// Script para testar envio de notificação push
const NotificationService = require('./services/notificationService');
require('dotenv').config();

async function testarEnvio() {
  console.log('\n📤 TESTE DE ENVIO DE NOTIFICAÇÃO PUSH\n');
  console.log('=' .repeat(50));
  
  // ID do usuário que tem subscription (pegar do banco)
  const userId = 14; // User ID com subscription ativa
  
  console.log(`\n🎯 Enviando notificação de teste para usuário ID: ${userId}\n`);
  
  try {
    const result = await NotificationService.sendToUser(userId, {
      title: '🧪 Teste de Notificação',
      body: 'Esta é uma notificação de teste enviada pelo servidor!',
      icon: '/logo-192.png',
      badge: '/favicon-32x32.png',
      url: '/feed',
      tag: 'test-notification'
    });
    
    console.log('✅ Resultado do envio:', result);
    
    if (result.sent > 0) {
      console.log(`\n🎉 Sucesso! ${result.sent} notificação(ões) enviada(s)`);
      console.log('\n📱 Verifique seu navegador/dispositivo para ver a notificação!');
    } else {
      console.log('\n⚠️ Nenhuma notificação foi enviada');
      console.log('Motivo:', result.message || 'Desconhecido');
    }
  } catch (err) {
    console.error('\n❌ Erro ao enviar notificação:', err.message);
    console.error('Stack:', err.stack);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  process.exit(0);
}

testarEnvio();
