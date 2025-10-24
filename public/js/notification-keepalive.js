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
  // Enviar ping a cada 5 minutos para manter sessão ativa
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
  }, 5 * 60 * 1000); // 5 minutos
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// NÃO iniciar automaticamente - apenas quando explicitamente necessário
// Desabilitado por padrão para evitar problemas
console.log('⚠️ Keep-alive desabilitado por padrão');

// Limpar ao fechar
window.addEventListener('beforeunload', () => {
  releaseWakeLock();
  stopHeartbeat();
});
