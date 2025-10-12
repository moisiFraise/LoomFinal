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
  console.log('SW: URL para abrir:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then(clientList => {
      console.log('SW: Clientes encontrados:', clientList.length);
      
      // Construir URL completa
      const urlObj = new URL(urlToOpen, self.location.origin);
      const targetUrl = urlObj.href;
      console.log('SW: URL completa:', targetUrl);
      
      // Procurar cliente com URL exata ou similar
      for (let client of clientList) {
        const clientUrl = new URL(client.url);
        const targetPath = urlObj.pathname;
        
        console.log('SW: Comparando', clientUrl.pathname, 'com', targetPath);
        
        // Se encontrar cliente na mesma URL, focar nele
        if (clientUrl.pathname === targetPath && 'focus' in client) {
          console.log('SW: Focando cliente existente');
          return client.focus();
        }
      }
      
      // Se não encontrou, procurar qualquer cliente aberto e navegar
      if (clientList.length > 0) {
        const client = clientList[0];
        console.log('SW: Navegando cliente existente para:', targetUrl);
        if ('navigate' in client) {
          return client.navigate(targetUrl).then(client => client.focus());
        } else if ('focus' in client) {
          // Fallback: focar e tentar abrir
          client.focus();
          return clients.openWindow(targetUrl);
        }
      }
      
      // Se não há clientes, abrir nova janela/aba
      console.log('SW: Abrindo nova janela:', targetUrl);
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
    .catch(err => console.error('SW: Erro ao processar clique:', err))
  );
});

console.log('SW: Service worker simplificado carregado!');
