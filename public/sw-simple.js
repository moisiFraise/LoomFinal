// Service Worker SIMPLIFICADO para Push Notifications
// Sem cache para evitar erros de instalação

console.log('SW: Carregando service worker simplificado...');

// Install - não faz cache, só ativa
self.addEventListener('install', event => {
  console.log('SW: Instalando...');
  self.skipWaiting(); // Ativa imediatamente
});

// Activate - toma controle imediatamente
self.addEventListener('activate', event => {
  console.log('SW: Ativando...');
  event.waitUntil(self.clients.claim());
});

// Push - recebe e mostra notificação
self.addEventListener('push', event => {
  console.log('SW: Push recebido!', event);
  
  let data = {};
  
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    console.error('SW: Erro ao parsear push data:', err);
  }
  
  const title = data.title || 'Loom';
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/logo-192.png',
    badge: '/favicon-32x32.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'loom-notification',
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/feed',
      ...data.data
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('SW: Notificação mostrada com sucesso'))
      .catch(err => console.error('SW: Erro ao mostrar notificação:', err))
  );
});

// Notification click - abre URL
self.addEventListener('notificationclick', event => {
  console.log('SW: Notificação clicada!', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/feed';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Tenta focar em uma janela já aberta
        for (let client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não encontrou, abre nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch(err => console.error('SW: Erro ao processar clique:', err))
  );
});

console.log('SW: Service worker simplificado carregado!');
