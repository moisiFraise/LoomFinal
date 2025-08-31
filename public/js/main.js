document.addEventListener('DOMContentLoaded', () => {
  console.log('Loom está funcionando!');
});

function mostrarSecao(secao) {
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
      section.style.display = 'none';
  });
  
  if (secao === 'tela-principal') {
      document.getElementById('tela-principal').style.display = 'block';
  } else if (secao === 'explorar') {
      document.getElementById('explorar').style.display = 'block';
  } else {
      alert(`Funcionalidade "${secao}" a ser implementada`);
  }
}

async function sair() {
  // Limpeza total e agressiva
  try {
    // 1. Limpar todos os storages
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. Limpar todos os cookies manualmente
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // 3. Tentar logout no servidor
    await fetch('/logout', { method: 'POST' }).catch(() => {});
    
    // 4. Forçar redirecionamento com cache bust
    window.location.href = '/autenticacao?bust=' + Date.now();
    
  } catch (error) {
    // Se tudo falhar, forçar redirecionamento
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/autenticacao?bust=' + Date.now();
  }
}

// Função NUCLEAR para limpeza completa
window.limparTudo = async function() {
  try {
    // 1. Limpar storages
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. Limpar todos os cookies de forma mais agressiva
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
    }
    
    // 3. Desregistrar e limpar Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
    }
    
    // 4. Limpar todos os caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // 5. Limpar IndexedDB se existir
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      databases.forEach(db => {
        indexedDB.deleteDatabase(db.name);
      });
    }
    
    // 6. Limpar sessões no servidor
    await fetch('/api/emergency-cleanup', { method: 'POST' }).catch(() => {});
    
    // 7. Forçar reload SEM cache
    alert('LIMPEZA NUCLEAR COMPLETA! Forçando reload total...');
    window.location.replace('/autenticacao?nuclear=' + Date.now());
    
  } catch (error) {
    console.error('Erro na limpeza:', error);
    window.location.replace('/autenticacao?emergency=' + Date.now());
  }
};

// Service Worker DESABILITADO temporariamente para resolver cache
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registrado:', reg.scope))
      .catch(err => console.error('Erro ao registrar SW:', err));
  });
}
*/