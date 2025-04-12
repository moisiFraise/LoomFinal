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

function sair() {
  window.location.href = '/autenticacao';
}
