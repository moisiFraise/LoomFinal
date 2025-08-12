const CACHE_NAME = 'loom-cache-v2';
const STATIC_CACHE = 'loom-static-v2';
const DYNAMIC_CACHE = 'loom-dynamic-v2';

const STATIC_URLS = [
  '/',
  '/autenticacao',
  '/manifest.json',
  '/logo-192.png',
  '/logo-512.png',
  '/favicon.ico',
  '/css/landingPage.css',
  '/js/landingPage.js',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Instalar service worker e cache recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Cacheando recursos estáticos...');
        return cache.addAll(STATIC_URLS);
      })
      .catch(err => console.log('Erro ao cachear recursos:', err))
  );
  self.skipWaiting(); // Força ativação imediata
});

// Ativar service worker e limpar caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Controla páginas imediatamente
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Estratégia Cache First para recursos estáticos
  if (STATIC_URLS.includes(request.url) || request.url.includes('css') || request.url.includes('js') || request.url.includes('font')) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          return caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
  // Estratégia Network First para API e páginas dinâmicas
  else if (request.url.includes('/api/') || request.method === 'POST') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
  }
  // Estratégia Cache First com fallback para outras requisições
  else {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          return caches.open(DYNAMIC_CACHE).then(cache => {
            if (request.url.startsWith('http') && !request.url.includes('chrome-extension')) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        }).catch(() => {
          // Fallback para página offline se necessário
          if (request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
    );
  }
});

// Mostrar notificação quando app for atualizado
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
