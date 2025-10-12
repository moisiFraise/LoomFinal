async function testarNotificacoes() {
  console.log('=== TESTE DE NOTIFICAÇÕES ===');
  
  console.log('1. Service Worker suportado?', 'serviceWorker' in navigator);
  console.log('2. Push Manager suportado?', 'PushManager' in window);
  console.log('3. Permissão atual:', Notification.permission);
  
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.ready;
      console.log('4. Service Worker está pronto ✅');
      
      const registration = await navigator.serviceWorker.getRegistration();
      console.log('5. Service Worker registrado?', !!registration);
      
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        console.log('6. Subscription ativa?', !!subscription);
        if (subscription) {
          console.log('7. Endpoint:', subscription.endpoint.substring(0, 50) + '...');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar Service Worker:', error);
    }
  }
  
  try {
    const response = await fetch('/api/push/vapid-public-key');
    const data = await response.json();
    console.log('8. VAPID Public Key:', data.publicKey ? 'Configurada ✓' : 'NÃO configurada ✗');
  } catch (error) {
    console.error('❌ Erro ao buscar VAPID key:', error);
  }
  
  console.log('=== FIM DO TESTE ===');
  console.log('💡 Para testar notificação visual: testarNotificacaoSimples()');
}

window.testarNotificacoes = testarNotificacoes;
console.log('Execute testarNotificacoes() no console para debugar');
