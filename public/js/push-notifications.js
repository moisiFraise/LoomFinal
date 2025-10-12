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
    console.log('Service Worker não suportado');
    return;
  }

  if (!('PushManager' in window)) {
    console.log('Push não suportado');
    return;
  }

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registrado');

    const subscription = await swRegistration.pushManager.getSubscription();
    isSubscribed = !(subscription === null);

    if (!isSubscribed) {
      console.log('Usuário não está inscrito em push notifications');
    } else {
      console.log('Usuário já está inscrito em push notifications');
    }
  } catch (error) {
    console.error('Erro ao registrar Service Worker:', error);
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
    const response = await fetch('/api/push/vapid-public-key');
    const { publicKey } = await response.json();

    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    const subscribeResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    });

    const result = await subscribeResponse.json();
    if (result.success) {
      console.log('Inscrito em push notifications com sucesso');
      isSubscribed = true;
      return true;
    }
  } catch (error) {
    console.error('Erro ao inscrever em push notifications:', error);
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
