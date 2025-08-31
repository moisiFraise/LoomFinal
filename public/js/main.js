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
  try {
    // Limpar qualquer storage local primeiro
    if (typeof(Storage) !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    const response = await fetch('/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      // Forçar reload da página para limpar qualquer cache
      window.location.replace('/autenticacao');
    } else {
      console.error('Erro no logout');
      window.location.replace('/autenticacao');
    }
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    window.location.replace('/autenticacao');
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registrado:', reg.scope))
      .catch(err => console.error('Erro ao registrar SW:', err));
  });
}