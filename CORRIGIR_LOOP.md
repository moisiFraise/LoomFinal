# 🚨 COMO CORRIGIR O LOOP INFINITO

## Para Usuários Afetados

Se o Loom estiver travando ou em loop infinito:

### Opção 1: Página de Correção Automática

1. **Acesse:** `https://seu-dominio.vercel.app/fix-sw`
2. **Clique:** "🧹 LIMPAR TUDO"
3. **Feche** todas as abas do Loom
4. **Feche** o navegador completamente
5. **Reabra** e entre no Loom

### Opção 2: Manual (DevTools)

1. Pressione **F12** (ou Ctrl+Shift+I)
2. Vá em **Application** (ou "Aplicativo")
3. Na barra lateral, clique em **Service Workers**
4. Clique em **Unregister** em todos os workers
5. Clique em **Clear Storage** na barra lateral
6. Marque tudo e clique **Clear site data**
7. Feche e reabra o navegador

### Opção 3: Limpar Cache do Navegador

**Chrome/Edge:**
- Ctrl+Shift+Del
- Selecione "Imagens e arquivos em cache"
- Selecione "Cookies e outros dados do site"
- Clique "Limpar dados"

**Firefox:**
- Ctrl+Shift+Del
- Selecione "Cache"
- Selecione "Cookies"
- Clique "Limpar agora"

**Safari:**
- Cmd+Option+E (limpar cache)
- Safari → Preferências → Privacidade → Gerenciar dados do site → Remover tudo

## O Que Foi Feito

### Problema
O sistema de notificações tinha um bug que causava:
- ❌ Auto-reload infinito ao detectar nova versão do service worker
- ❌ Heartbeat a cada 30s sobrecarregando o servidor
- ❌ Keep-alive iniciando automaticamente

### Correção (Deploy Automático)
- ✅ Removido auto-reload que causava loop
- ✅ Heartbeat aumentado para 5 minutos
- ✅ Keep-alive desabilitado por padrão
- ✅ Criada página de emergência `/fix-sw`

### Status do Deploy
O Vercel já está fazendo redeploy automático das correções.
Aguarde ~2 minutos após o push.

## Verificar se Está Corrigido

Após limpar e recarregar, verifique no console (F12):

```
✅ Service Worker registrado
✅ Service Worker pronto e ATIVO
⚠️ Keep-alive desabilitado por padrão
```

**NÃO deve aparecer:**
```
🔄 Nova versão do Service Worker encontrada
✅ Nova versão ativada - recarregando...
(loop infinito)
```

## Para Desenvolvedores

### Testar Localmente

```bash
# Já está no main, apenas pull
git pull origin main

# Verificar mudanças
git log --oneline -3
```

Deve mostrar:
```
befc8ad feat: adiciona página de emergência /fix-sw
920ac97 fix: corrige loop infinito no service worker
```

### Arquivos Modificados

- `public/sw.js` - Versão 2.0 com background sync
- `public/js/push-notifications.js` - Removido auto-reload
- `public/js/notification-keepalive.js` - Keep-alive desabilitado
- `views/dashboard.ejs` - Versão bumped para v5
- `views/fix-sw.ejs` - Nova página de emergência
- `app.js` - Rota `/fix-sw` e endpoint `/api/heartbeat`
- `services/notificationService.js` - Logs detalhados + TTL

### O Que Ficou das Melhorias

✅ **Mantido (funcionais):**
- Logs detalhados com emojis
- TTL de 24h e urgência alta
- Limpeza de subscriptions inválidas
- Background sync no service worker (se suportado)
- Endpoint de heartbeat (5min)

❌ **Removido (problemáticos):**
- Auto-reload ao detectar nova versão
- Keep-alive automático
- Heartbeat agressivo (30s)

## Comunicar aos Usuários

**Mensagem Sugerida:**

> 🔧 **Manutenção Emergencial**
> 
> Identificamos um bug no sistema de notificações que causava travamento.
> 
> **Se o Loom estiver travando:**
> 1. Acesse: https://[seu-dominio]/fix-sw
> 2. Clique em "LIMPAR TUDO"
> 3. Feche e reabra o navegador
> 
> Desculpe o transtorno! O problema já foi corrigido.

## Monitoramento

Após o deploy, verifique nos logs do Vercel:

```bash
vercel logs [seu-projeto] --follow
```

Procure por:
- ❌ Muitos requests para `/api/heartbeat` (não deve ter explosão)
- ❌ Loops de requests
- ✅ Logs normais de notificação: 📤 📱 ✅ 📊

## Prevenção Futura

**Checklist antes de deploy de Service Worker:**

- [ ] Testar em aba anônima antes de commit
- [ ] Verificar se não causa auto-reload
- [ ] Testar com service worker antigo ativo
- [ ] Verificar console por loops
- [ ] Fazer deploy gradual (canary)
- [ ] Sempre ter rota `/fix-sw` disponível

## Contato

Se o problema persistir após seguir os passos:
1. Abrir issue no GitHub com screenshot do console
2. Incluir navegador e sistema operacional
3. Incluir mensagens de erro completas
