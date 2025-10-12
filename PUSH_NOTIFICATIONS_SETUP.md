# Configuração de Push Notifications PWA - Loom

## 📋 Pré-requisitos

Este projeto já possui as dependências instaladas, mas para referência:
- `web-push` instalado via npm

## 🔧 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# VAPID Keys para Push Notifications
VAPID_PUBLIC_KEY=BGb_AML9SeVq9x1PiRKAvwtpdcqte4NWCLRg3Oi2TfnzHZcT9pA0ebEo28mzLqeuRCplZJIxp9aEjAZVfv2dUvo
VAPID_PRIVATE_KEY=yKq0YITBy-qTr36mBv9GXEYchu_opDkq4W7ukUz8JFI
VAPID_EMAIL=admin@loom.com
```

**IMPORTANTE**: As chaves acima são de exemplo. Para produção, gere novas chaves com:
```bash
npx web-push generate-vapid-keys
```

### 2. Executar Migration do Banco de Dados

Execute o script SQL localizado em `database/migration_push_subscriptions.sql`:

```sql
CREATE TABLE IF NOT EXISTS inscricoes_push (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  dados_inscricao TEXT NOT NULL,
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario_ativo (id_usuario, ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Para executar:
```bash
# Via MySQL CLI
mysql -u seu_usuario -p seu_banco < database/migration_push_subscriptions.sql

# Ou via ferramenta gráfica (PHPMyAdmin, MySQL Workbench, etc)
```

## 📱 Funcionalidades Implementadas

### Tipos de Notificações

O sistema envia notificações push automaticamente para os seguintes eventos:

1. **Nova mensagem no chat** - Quando alguém envia uma mensagem no chat do clube
2. **Nova leitura adicionada** - Quando o criador adiciona uma nova leitura ao clube
3. **Encontro agendado** - Quando o criador agenda um novo encontro
4. **Votação criada** - Quando o criador inicia uma nova votação
5. **Votação encerrada** - Quando uma votação é finalizada e há um vencedor
6. **Atualizações do clube** - Notificações gerais sobre o clube

### Comportamento das Notificações

- ✅ Apenas membros do clube recebem notificações
- ✅ O autor da ação (ex: quem enviou a mensagem) NÃO recebe notificação própria
- ✅ Notificações incluem vibração no dispositivo
- ✅ Ao clicar na notificação, o usuário é direcionado para a página relevante
- ✅ Notificações de encontros são marcadas como "requireInteraction" (não desaparecem automaticamente)

## 🔐 Segurança

- As subscription keys são armazenadas de forma segura no banco de dados
- Apenas usuários autenticados podem se inscrever em notificações
- Subscriptions expiradas (erro 410) são automaticamente removidas do banco
- Foreign key com CASCADE garante limpeza automática quando usuário é deletado

## 📲 Fluxo do Usuário

1. **Primeira visita ao site**: Após 3 segundos no dashboard, aparece um prompt perguntando se quer ativar notificações
2. **Permissão concedida**: O navegador solicita permissão de notificação
3. **Subscription criada**: Após aceitar, uma subscription é criada e salva no servidor
4. **Notificações ativas**: Usuário começa a receber notificações de eventos dos clubes

## 🛠️ Arquivos Criados/Modificados

### Novos Arquivos
- `models/PushSubscription.js` - Modelo para gerenciar subscriptions no banco
- `services/notificationService.js` - Serviço para enviar notificações
- `services/pushRoutes.js` - Rotas da API para gerenciar subscriptions
- `public/js/push-notifications.js` - JavaScript client-side para PWA
- `public/css/notifications.css` - Estilos do prompt de permissão
- `database/migration_push_subscriptions.sql` - Script de criação da tabela

### Arquivos Modificados
- `app.js` - Integração das rotas e notificações nos eventos
- `public/sw.js` - Service Worker com suporte a push notifications
- `views/dashboard.ejs` - UI para solicitar permissão de notificações

## 🧪 Testando

### 1. Teste Local

Para testar localmente, você precisa:
- Usar HTTPS (ou localhost)
- Navegador compatível (Chrome, Firefox, Edge, Safari 16+)

### 2. Teste de Notificação Manual

Você pode testar enviando uma notificação manualmente via código:

```javascript
const NotificationService = require('./services/notificationService');

NotificationService.sendToUser(userId, {
  title: 'Teste de Notificação',
  body: 'Esta é uma notificação de teste',
  icon: '/logo-192.png',
  url: '/feed'
});
```

### 3. Verificar Subscription

Acesse no console do navegador:
```javascript
navigator.serviceWorker.ready.then(registration => {
  return registration.pushManager.getSubscription();
}).then(subscription => {
  console.log('Subscription:', subscription);
});
```

## 🐛 Troubleshooting

### Notificações não aparecem
1. Verifique se as permissões estão concedidas no navegador
2. Verifique se as VAPID keys estão corretas no .env
3. Verifique os logs do servidor para erros de envio
4. Certifique-se que o Service Worker está registrado

### Erro 401/403 ao subscrever
- Verifique se o usuário está autenticado
- Verifique se a sessão está ativa

### Erro 410 (Gone)
- A subscription expirou ou foi removida pelo navegador
- O sistema remove automaticamente estas subscriptions

## 📚 Referências

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [web-push library](https://github.com/web-push-libs/web-push)

## ✅ Checklist de Produção

- [ ] Gerar novas VAPID keys (não usar as de exemplo)
- [ ] Atualizar VAPID_EMAIL com email real
- [ ] Executar migration do banco de dados
- [ ] Testar notificações em diferentes navegadores
- [ ] Verificar HTTPS está configurado (obrigatório para PWA)
- [ ] Testar no mobile (Android/iOS)
- [ ] Configurar rate limiting para evitar spam de notificações
