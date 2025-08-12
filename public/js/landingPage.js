// Animação de estrelas
function stars() {
    let e = document.createElement("div");
    e.setAttribute("class", "star");
    document.body.appendChild(e);
    e.style.left = Math.random() * +innerWidth + "px";
  
    let size = Math.random() * 12;
    let duration = Math.random() * 3;
  
    e.style.fontSize = 12 + "px";
    e.style.animationDuration = 2 + duration + "s";
    setTimeout(function () {
      document.body.removeChild(e);
    }, 5000);
  }
  
  setInterval(function () {
    stars();
  }, 50);

// PWA - Instalação do App
let deferredPrompt;
const installButton = document.getElementById('installButton');

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration);
        
        // Verificar se há atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão disponível
                if (confirm('Nova versão disponível! Deseja atualizar?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(error => {
        console.error('Erro ao registrar Service Worker:', error);
      });
  });
}

// Capturar evento de instalação PWA
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA pode ser instalado');
  e.preventDefault();
  deferredPrompt = e;
  
  // Mostrar botão de instalação
  installButton.style.display = 'inline-block';
});

// Evento de clique no botão de instalação
installButton.addEventListener('click', async () => {
  if (deferredPrompt) {
    console.log('Iniciando instalação PWA...');
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Resultado da instalação: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('PWA instalado com sucesso!');
      installButton.style.display = 'none';
    }
    
    deferredPrompt = null;
  }
});

// Verificar se já está instalado
window.addEventListener('appinstalled', () => {
  console.log('PWA foi instalado');
  installButton.style.display = 'none';
});

// Para iOS - detectar se está sendo executado como PWA
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = window.navigator.standalone;

if (isIOS && !isStandalone) {
  // Mostrar instruções para iOS
  installButton.style.display = 'inline-block';
  installButton.innerHTML = '<i class="fas fa-share"></i> Adicionar à Tela Inicial';
  installButton.addEventListener('click', () => {
    alert('Para instalar no iOS:\n1. Toque no botão Compartilhar\n2. Role para baixo e toque em "Adicionar à Tela de Início"\n3. Toque em "Adicionar"');
  });
}
  