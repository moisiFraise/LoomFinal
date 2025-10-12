const CACHE_NAME = 'loom-static-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/landingPage.css',
  '/js/landingPage.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  console.log('SW: Instalando e atualizando caches...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('SW: Ativando...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(resp => resp || fetch(event.request))
    );
  }
});

self.addEventListener('push', event => {
  console.log('SW: Push recebido:', event);
  
  const data = event.data ? event.data.json() : {};
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
  );
});

self.addEventListener('notificationclick', event => {
  console.log('SW: Notificação clicada:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/feed';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (let client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});