// SERVICE WORKER DESABILITADO - CAUSANDO PROBLEMAS DE CACHE DE SESSÃO
console.log('Service Worker desabilitado para resolver problemas de cache');

// Limpar todos os caches existentes ao instalar
self.addEventListener('install', event => {
  console.log('SW: Instalando e limpando caches...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('SW: Removendo cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.skipWaiting();
});

// Limpar todos os caches ao ativar
self.addEventListener('activate', event => {
  console.log('SW: Ativando e limpando caches...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('SW: Removendo cache na ativação:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('SW: Todos os caches removidos');
      return self.clients.claim();
    })
  );
});

// NÃO interceptar requisições - deixar ir direto para a rede
self.addEventListener('fetch', event => {
  // Não fazer nada - deixar requisições passarem normalmente sem cache
  console.log('SW: Não interceptando requisição para:', event.request.url);
});

// Auto-desinstalar este Service Worker após limpeza
setTimeout(() => {
  self.registration.unregister().then(() => {
    console.log('SW: Service Worker desregistrado com sucesso');
  });
}, 5000); // 5 segundos após carregamento
