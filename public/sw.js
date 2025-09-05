const CACHE_NAME = 'loom-static-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/landingPage.css',
  '/js/landingPage.js',
  '/manifest.json'
];

// Instalação: limpar caches antigos e adicionar arquivos estáticos
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

// Ativação: limpar caches antigos
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

// Fetch: intercepta apenas arquivos estáticos, deixa requisições de sessão passarem
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(resp => resp || fetch(event.request))
    );
  }
});
//pwa causando problemas de sessão