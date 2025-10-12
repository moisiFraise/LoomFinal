window.testarNotificacaoSimples = function() {
  navigator.serviceWorker.ready.then(registration => {
    registration.showNotification('Teste Loom', {
      body: 'Esta é uma notificação de teste local',
      icon: '/logo-192.png',
      badge: '/favicon-32x32.png'
    });
  });
};

console.log('💡 Execute: testarNotificacaoSimples()');
