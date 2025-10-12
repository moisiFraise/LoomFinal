# Debug de Notificações Push

## Passo a passo para testar:

### 1. Verificar Console do Navegador
Abra o dashboard e execute no console:
```javascript
testarNotificacoes()
```

Você deve ver:
- ✅ Service Worker suportado: true
- ✅ Push Manager suportado: true  
- ✅ Permissão atual: "granted"
- ✅ Service Worker registrado: true
- ✅ Subscription ativa: true
- ✅ VAPID Public Key: Configurada ✓

### 2. Verificar Banco de Dados
Execute no MySQL:
```sql
SELECT * FROM inscricoes_push;
```

Deve ter pelo menos 1 registro com seus dados.

### 3. Testar Notificação Manual

#### No console do navegador, copie e cole APENAS o código abaixo (sem os backticks):

```javascript
navigator.serviceWorker.ready.then(registration => {
  registration.showNotification('Teste Loom', {
    body: 'Esta é uma notificação de teste local',
    icon: '/logo-192.png',
    badge: '/favicon-32x32.png'
  });
});
```

**IMPORTANTE:** Cole apenas as linhas entre as cercas de código (```), não copie os backticks!

Se aparecer a notificação = Service Worker está OK ✅

### 4. Testar Envio do Servidor

#### No terminal do servidor Node.js (abra um novo terminal):
```bash
node
```

Depois cole no REPL do Node:
```javascript
const NotificationService = require('./services/notificationService');

// Substitua 4 pelo seu ID de usuário
NotificationService.sendToUser(4, {
  title: 'Teste do Servidor',
  body: 'Notificação enviada pelo backend',
  icon: '/logo-192.png',
  url: '/feed'
}).then(result => {
  console.log('✅ Resultado:', result);
}).catch(err => {
  console.error('❌ Erro:', err);
});
```

### 5. Testar Evento Real

Entre em um clube e envie uma mensagem no chat. Você deve receber notificação.

---

## Checklist de Problemas Comuns

### ❌ Subscription não está sendo criada
**Verificar:**
- [ ] VAPID_PUBLIC_KEY está no .env
- [ ] Service Worker está registrado
- [ ] Permissão foi concedida

### ❌ Subscription criada mas não salva no banco
**Verificar:**
- [ ] Tabela `inscricoes_push` existe
- [ ] Usuário está autenticado (req.session.userId)
- [ ] Endpoint `/api/push/subscribe` está respondendo

**Teste:**
```bash
curl -X POST http://localhost:3000/api/push/subscribe \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"test"}'
```

### ❌ Notificação não chega
**Verificar:**
- [ ] VAPID_PRIVATE_KEY está no .env
- [ ] web-push está configurado corretamente
- [ ] Logs do servidor mostram envio

### ❌ Erro 410 (Gone)
Subscription expirou. Deletar do banco e criar nova:
```sql
DELETE FROM inscricoes_push WHERE id_usuario = SEU_ID;
```
Depois recarregar página e aceitar notificações novamente.

---

## Logs Importantes

### No navegador (Console):
```
✅ Service Worker registrado
✅ Service Worker pronto
✅ VAPID Public Key obtida
✅ Push Manager subscription criada
📡 Resposta do servidor: {success: true}
✅ Inscrito em push notifications com sucesso
```

### No servidor (Terminal):
Ao enviar mensagem, deve aparecer:
```
Enviando notificação para clube X...
Notificação enviada: {sent: 2}
```

---

## Comandos Úteis

### Ver todas subscriptions ativas:
```sql
SELECT 
  ip.id,
  ip.id_usuario,
  u.nome,
  u.email,
  ip.criado_em,
  ip.ativo
FROM inscricoes_push ip
JOIN usuarios u ON ip.id_usuario = u.id
WHERE ip.ativo = 1;
```

### Limpar subscriptions antigas:
```sql
DELETE FROM inscricoes_push WHERE criado_em < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### Ver quantas subscriptions por usuário:
```sql
SELECT 
  u.nome,
  COUNT(*) as total_subscriptions
FROM inscricoes_push ip
JOIN usuarios u ON ip.id_usuario = u.id
WHERE ip.ativo = 1
GROUP BY u.id;
```
