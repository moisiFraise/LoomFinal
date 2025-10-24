# 🔔 Notificações em Background - Como Funcionam

## ⚠️ IMPORTANTE: Limitações Técnicas

### PWA Completamente Fechado

**Notificações NÃO funcionam quando:**
- ❌ Usuário "força-fechou" o app (deslizou para cima no Android)
- ❌ App foi fechado manualmente no gerenciador de tarefas
- ❌ Navegador foi completamente fechado
- ❌ iOS sem PWA instalado via "Add to Home Screen"
- ❌ Modo economia de bateria extrema (Deep Sleep)
- ❌ Sistema operacional matou o processo por falta de memória

**Notificações FUNCIONAM quando:**
- ✅ App minimizado (em background)
- ✅ Navegador aberto mas em outra aba
- ✅ PWA instalado e minimizado (Android)
- ✅ iOS 16.4+ com PWA instalado

### Por Que Essa Limitação?

Push notifications dependem do **Service Worker** estar ativo. Quando o app/navegador é completamente fechado:

1. O sistema operacional **mata todos os processos** do navegador
2. O Service Worker **para de executar**
3. O servidor push (FCM/VAPID) **não consegue entregar** a mensagem
4. A notificação fica **pendente** até o app abrir novamente

### Comparação com Apps Nativos

| Recurso | App Nativo | PWA |
|---------|-----------|-----|
| Notificação com app fechado | ✅ Sim | ❌ Não (limitado) |
| Background tasks ilimitado | ✅ Sim | ❌ Não |
| Acesso total ao sistema | ✅ Sim | ⚠️ Limitado |
| Instalação via loja | ✅ Obrigatório | ⚠️ Opcional |
| Funciona offline | ✅ Sim | ✅ Sim |
| Atualização automática | ⚠️ Precisa loja | ✅ Instantânea |

## 🎯 Tipos de Notificações Implementadas

### 1. Nova Mensagem no Chat
```javascript
// Enviada quando alguém manda mensagem
NotificationService.notifyNewMessage(clubeId, senderName, messagePreview, senderId)
```

**Quando dispara:** Imediatamente ao enviar mensagem  
**Quem recebe:** Todos os membros do clube (exceto quem enviou)  
**URL:** `/clube/{id}/chat`

### 2. Curtida em Atualização
```javascript
// Enviada quando alguém curte sua atualização
NotificationService.notifyLike(userId, likerName, updatePreview)
```

**Quando dispara:** Ao clicar no botão de curtir  
**Quem recebe:** Autor da atualização (se não for você mesmo)  
**URL:** `/feed`

### 3. Comentário em Atualização
```javascript
// Enviada quando alguém comenta sua atualização
NotificationService.notifyComment(userId, commenterName, commentPreview, clubeId)
```

**Quando dispara:** Ao criar um novo comentário  
**Quem recebe:** Autor da atualização (se não for você mesmo)  
**URL:** `/clube/{id}`

### 4. Nova Sugestão de Livro
```javascript
// Enviada quando alguém sugere um livro
NotificationService.notifySuggestion(clubeId, suggestorName, bookTitle)
```

**Quando dispara:** Ao criar uma nova sugestão  
**Quem recebe:** Todos os membros do clube  
**URL:** `/clube/{id}/sugestoes`

### 5. Nova Leitura Adicionada
```javascript
// Enviada quando uma nova leitura é criada
NotificationService.notifyNewReading(clubeId, bookTitle)
```

**Quando dispara:** Ao adicionar nova leitura ao clube  
**Quem recebe:** Todos os membros do clube  
**URL:** `/clube/{id}/leituras`

### 6. Novo Encontro Agendado
```javascript
// Enviada quando um encontro é marcado
NotificationService.notifyNewMeeting(clubeId, meetingTitle, meetingDate)
```

**Quando dispara:** Ao criar um novo encontro  
**Quem recebe:** Todos os membros do clube  
**URL:** `/clube/{id}/encontros`

### 7. Nova Votação
```javascript
// Enviada quando uma votação é criada
NotificationService.notifyVotingCreated(clubeId, votingTitle)
```

**Quando dispara:** Ao criar votação  
**Quem recebe:** Todos os membros do clube  
**URL:** `/clube/{id}/votacoes`

## 📱 Como Melhorar a Experiência

### Para Usuários Android

1. **Instalar como PWA:**
   - Chrome → Menu (⋮) → "Instalar app"
   - Abre como app independente
   - Melhor chance de receber notificações

2. **Desativar economia de bateria para o Chrome:**
   - Configurações → Apps → Chrome
   - Bateria → Sem restrições

3. **Manter app minimizado (não fechar completamente):**
   - Use botão Home em vez de fechar
   - Não deslize para cima no gerenciador de tarefas

### Para Usuários iOS (16.4+)

1. **Adicionar à Tela Inicial:**
   - Safari → Compartilhar → "Adicionar à Tela de Início"
   - **Essencial** para push notifications no iOS

2. **Permitir notificações:**
   - Configurações → Safari → Notificações
   - Ou Configurações → [Nome do App] → Notificações

3. **Manter app minimizado:**
   - Não feche completamente o Safari/PWA

### Para Administradores

**Aviso aos usuários sobre limitações:**

> **💡 Dica para receber notificações:**
> 
> Para melhor experiência com notificações:
> 
> **Android:**
> - Instale o Loom como app (Chrome → ⋮ → Instalar)
> - Mantenha o app minimizado
> 
> **iPhone (iOS 16.4+):**
> - Safari → Compartilhar → Adicionar à Tela Inicial
> - Permita notificações quando solicitado
> 
> ⚠️ **Importante:** Notificações não chegam se você fechar completamente o app.

## 🔧 Configurações do Service Worker

### Background Sync (Quando Disponível)

```javascript
// Verifica notificações periodicamente (5 minutos)
if ('periodicSync' in self.registration) {
  self.registration.periodicSync.register('check-notifications', {
    minInterval: 5 * 60 * 1000 // 5 minutos
  });
}
```

**Suporte:**
- ✅ Chrome/Edge Android (com PWA instalado)
- ❌ Firefox (não implementado)
- ❌ Safari/iOS (não implementado)

### TTL (Time To Live)

```javascript
await webpush.sendNotification(subscription, payload, {
  TTL: 86400,      // 24 horas
  urgency: 'high'  // Prioridade alta
});
```

**Significado:**
- Notificação fica **válida por 24 horas**
- Se dispositivo estiver offline, será entregue quando voltar online (dentro de 24h)
- Após 24h, a notificação expira e não é mais entregue

## 📊 Cenários Práticos

### Cenário 1: Usuário com App Minimizado
1. João abre o Loom PWA
2. Minimiza (botão Home)
3. Maria envia mensagem no clube
4. ✅ **João recebe notificação imediatamente**
5. João clica e vai direto para o chat

### Cenário 2: Usuário com App Fechado
1. João fecha completamente o Loom
2. Maria envia mensagem no clube
3. ❌ **João NÃO recebe notificação**
4. João abre o Loom novamente
5. ⚠️ Vê mensagem não lida (mas não recebeu push)

### Cenário 3: Usuário Offline
1. João fica sem internet por 2 horas
2. Maria envia mensagem (com TTL de 24h)
3. João volta online após 2 horas
4. ✅ **João recebe notificação atrasada**

### Cenário 4: Notificação Expirada
1. João fica offline por 25 horas
2. Maria envia mensagem (TTL de 24h)
3. João volta online após 25 horas
4. ❌ **Notificação expirou, não recebe push**
5. Mas vê mensagem não lida ao abrir app

## 🚀 Futuras Melhorias Possíveis

### 1. WebSocket para Tempo Real
```javascript
// Conexão permanente quando app está aberto
const ws = new WebSocket('wss://loom.com/ws');
ws.onmessage = (event) => {
  showInAppNotification(event.data);
};
```

**Vantagens:**
- Notificação instantânea quando app está aberto
- Não depende de push notifications
- Pode mostrar notificação in-app

**Desvantagens:**
- Só funciona com app aberto
- Consome mais bateria
- Precisa servidor WebSocket

### 2. Badge API
```javascript
// Mostrar contador de não lidas no ícone
navigator.setAppBadge(unreadCount);
```

**Status:** Experimental, só Chrome/Edge

### 3. App Nativo Híbrido
Converter para **Capacitor** ou **Cordova** para:
- ✅ Push notifications mesmo com app fechado
- ✅ Background tasks ilimitado
- ❌ Mas precisa publicar na loja

## 📱 Testando Notificações

### Teste 1: App Aberto
1. Abra o Loom
2. Peça alguém enviar mensagem
3. ✅ Deve receber imediatamente

### Teste 2: App Minimizado
1. Abra o Loom
2. Minimize (botão Home)
3. Peça alguém enviar mensagem
4. ✅ Deve receber em até 30 segundos

### Teste 3: App em Outra Aba
1. Abra o Loom
2. Troque para outra aba
3. Peça alguém enviar mensagem
4. ✅ Deve receber notificação do navegador

### Teste 4: App Fechado (Limitação)
1. Feche completamente o navegador/app
2. Peça alguém enviar mensagem
3. ❌ NÃO receberá (limitação técnica)
4. Abra o Loom novamente
5. ✅ Verá mensagem não lida

## 🔍 Debug e Monitoramento

### Verificar Subscription Ativa

```javascript
// Console do navegador
navigator.serviceWorker.ready.then(reg => 
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription ativa:', !!sub);
    if (sub) {
      console.log('Endpoint:', sub.endpoint);
      console.log('Expira em:', sub.expirationTime);
    }
  })
);
```

### Logs do Backend

Ao enviar notificação, você verá:

```
📤 Enviando notificação para clube 123: Nova mensagem - João
📱 Enviando para 3 membro(s) do clube
🔔 Enviando para usuário 456
✅ Enviado para usuário 456
🔔 Enviando para usuário 789
❌ Falha para usuário 789: endpoint não existe
🗑️ Removendo subscription inválida do usuário 789
📊 Clube 123: 1 sucesso, 1 falhas
```

### Testar Envio Manual

```javascript
// Console do backend (Node.js)
const NotificationService = require('./services/notificationService');
NotificationService.notifyNewMessage(123, 'Teste', 'Mensagem de teste', 1);
```

## 📚 Referências

- [MDN - Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Can I Use - Push API](https://caniuse.com/push-api)
- [iOS Web Push Support](https://webkit.org/blog/12824/news-from-wwdc-webkit-features-in-safari-16-beta/)
