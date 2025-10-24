// Mantém o Service Worker ativo para receber notificações em background

let wakeLock = null;

// Tentar manter o dispositivo acordado quando o app está em uso
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('🔋 Wake Lock ativado');
      
      wakeLock.addEventListener('release', () => {
        console.log('🔋 Wake Lock liberado');
      });
      
      return true;
    } catch (err) {
      console.log('⚠️ Wake Lock não disponível:', err.message);
      return false;
    }
  }
  return false;
}

// Liberar wake lock quando sair
async function releaseWakeLock() {
  if (wakeLock !== null) {
    await wakeLock.release();
    wakeLock = null;
  }
}

// Tentar manter conexão com servidor através de heartbeat
let heartbeatInterval = null;

function startHeartbeat() {
  // Enviar ping a cada 30 segundos para manter conexão viva
  heartbeatInterval = setInterval(async () => {
    try {
      // Ping silencioso para manter sessão ativa
      await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('💓 Heartbeat enviado');
    } catch (err) {
      console.error('❌ Erro no heartbeat:', err);
    }
  }, 30000); // 30 segundos
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Inicializar quando o app estiver visível
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('👁️ App visível - iniciando keep-alive');
    requestWakeLock();
    startHeartbeat();
  } else {
    console.log('🌙 App em background - liberando wake lock');
    releaseWakeLock();
    // Manter heartbeat mesmo em background
  }
});

// Iniciar quando carregar
if (document.visibilityState === 'visible') {
  requestWakeLock();
}
startHeartbeat();

// Limpar ao fechar
window.addEventListener('beforeunload', () => {
  releaseWakeLock();
  stopHeartbeat();
});
