# ⚙️ Configuração para Deploy (Vercel)

## 🌐 URLs Automáticas

O sistema agora detecta automaticamente o ambiente:

- **Desenvolvimento**: `http://localhost:3000` (ou porta configurada)
- **Produção**: `https://loom-final.vercel.app` (automático)

## 📧 Sistema de Email em Produção

### Variáveis de Ambiente no Vercel:

1. **EMAIL_PASSWORD** - Senha de app do Gmail (OBRIGATÓRIO)
2. **NODE_ENV** - Definido como "production" no vercel.json
3. **Outras variáveis** - Mesmo que em desenvolvimento

### Como configurar no Vercel:

1. Acesse o painel do Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as variáveis necessárias:

```
EMAIL_PASSWORD=sua_senha_de_app_gmail
DB_HOST=seu_host_de_producao
DB_USER=seu_usuario_db
DB_PASSWORD=sua_senha_db
DB_NAME=seu_banco_producao
SESSION_SECRET=sua_chave_secreta_producao
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
GIPHY_API_KEY=sua_chave_giphy
```

## 🔍 Logs de Debug

O sistema agora mostra nos logs:
```
🌐 Ambiente: production
🔗 URL de reset gerada: https://loom-final.vercel.app/reset-senha?token=...
```

## ✅ Verificação

Para testar se está funcionando:
1. Deploy no Vercel
2. Teste "Esqueci minha senha"
3. Verifique os logs no painel do Vercel
4. Confirme se o email contém a URL correta

## 🛠️ Troubleshooting

### URL ainda aparece como localhost:
- Verifique se NODE_ENV=production no Vercel
- Verifique os logs da aplicação
- Force um novo deploy

### Email não funciona em produção:
- Confirme EMAIL_PASSWORD nas variáveis de ambiente
- Verifique se a conta Gmail tem verificação em 2 etapas
- Teste a rota `/api/test-email-config` em produção
