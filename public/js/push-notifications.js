let swRegistration = null;
let isSubscribed = false;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function initializePushNotifications() {
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker não suportado');
    return;
  }

  if (!('PushManager' in window)) {
    console.log('❌ Push não suportado');
    return;
  }

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', {
      updateViaCache: 'none' // Sempre buscar nova versão
    });
    console.log('✅ Service Worker registrado');

    // Forçar atualização se houver nova versão
    swRegistration.addEventListener('updatefound', () => {
      console.log('🔄 Nova versão do Service Worker encontrada');
      const newWorker = swRegistration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          console.log('✅ Nova versão ativada - recarregando...');
          window.location.reload();
        }
      });
    });

    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker pronto e ATIVO');

    const subscription = await swRegistration.pushManager.getSubscription();
    isSubscribed = !(subscription === null);

    if (!isSubscribed) {
      console.log('ℹ️ Usuário não está inscrito em push notifications');
    } else {
      console.log('✅ Usuário já está inscrito em push notifications');
      console.log('📍 Endpoint:', subscription.endpoint);
    }
  } catch (error) {
    console.error('❌ Erro ao registrar Service Worker:', error);
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações');
    return false;
  }

  if (Notification.permission === 'granted') {
    subscribeUser();
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      subscribeUser();
      return true;
    }
  }

  return false;
}

async function subscribeUser() {
  try {
    console.log('🔔 Iniciando subscription...');
    
    if (!swRegistration) {
      console.error('❌ Service Worker não registrado');
      return false;
    }
    
    console.log('📡 Buscando VAPID Public Key...');
    const response = await fetch('/api/push/vapid-public-key');
    
    if (!response.ok) {
      console.error('❌ Erro ao buscar VAPID key. Status:', response.status);
      const errorText = await response.text();
      console.error('❌ Resposta:', errorText);
      return false;
    }
    
    const { publicKey } = await response.json();
    console.log('✅ VAPID Public Key obtida:', publicKey ? 'OK' : 'VAZIA');

    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    console.log('🔑 Criando subscription no Push Manager...');
    
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });
    console.log('✅ Push Manager subscription criada');
    console.log('📍 Endpoint:', subscription.endpoint);

    console.log('💾 Salvando subscription no servidor...');
    const subscribeResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    });

    if (!subscribeResponse.ok) {
      console.error('❌ Erro ao salvar subscription. Status:', subscribeResponse.status);
      const errorText = await subscribeResponse.text();
      console.error('❌ Resposta:', errorText);
      return false;
    }

    const result = await subscribeResponse.json();
    console.log('📡 Resposta do servidor:', result);
    
    if (result.success) {
      console.log('✅ Inscrito em push notifications com sucesso');
      isSubscribed = true;
      return true;
    } else {
      console.error('❌ Falha ao salvar subscription:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao inscrever em push notifications:', error);
    console.error('❌ Tipo de erro:', error.name);
    console.error('❌ Mensagem:', error.message);
    console.error('❌ Stack:', error.stack);
    return false;
  }
}

async function unsubscribeUser() {
  try {
    const subscription = await swRegistration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      console.log('Desinscrito de push notifications');
      isSubscribed = false;
    }
  } catch (error) {
    console.error('Erro ao desinscrever:', error);
  }
}

if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', initializePushNotifications);
}
