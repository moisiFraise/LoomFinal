# Como Testar o PWA do Loom

## ✅ Status Atual: PWA Configurado e Funcional

O servidor está rodando em: **http://localhost:3000**

## Como Testar o Botão de Instalação PWA

### Pré-requisitos
1. **Servidor deve estar rodando** na porta 3000 ✅
2. **Navegador deve suportar PWA** (Chrome, Firefox, Edge) ✅  
3. **Manifest.json acessível** em `/manifest.json` ✅
4. **Service Worker funcionando** em `/sw.js` ✅

### Passos para Testar:

#### 1. **Abra o Chrome/Edge**
   - Vá para `http://localhost:3000`
   - Abra o DevTools (F12)

#### 2. **Verifique o Console**
   - Deve aparecer:
     ```
     PWA Script carregado
     Install button encontrado: <button...>
     Service Worker suportado
     Manifest carregado: {...}
     Service Worker registrado com sucesso
     ```

#### 3. **Verificar Critérios PWA no DevTools**
   - Aba **Application** → **Manifest** (deve mostrar o manifest)
   - Aba **Application** → **Service Workers** (deve mostrar sw.js ativo)

#### 4. **Testar Instalação**
   - **Opção 1**: Aguardar 3 segundos para ver o botão debug
   - **Opção 2**: Forçar evento com DevTools:
     ```javascript
     window.dispatchEvent(new Event('beforeinstallprompt'));
     ```

#### 5. **Para Navegadores Compatíveis com PWA:**
   - Chrome: Botão "Instalar" aparecerá na barra de endereços
   - Edge: Botão "Instalar aplicativo" na barra de endereços

### Debug Mode
Se o botão PWA não aparecer automaticamente, após 3 segundos aparecerá um botão "Debug: Testar PWA" que mostra o status de todos os critérios PWA.

### Problemas Comuns:

1. **Botão não aparece**: 
   - Verifique se está usando HTTPS (ou localhost)
   - Limpe o cache do navegador
   - Verifique console por erros

2. **Service Worker não registra**:
   - Verifique se `/sw.js` está acessível
   - Limpe Service Workers antigos no DevTools

3. **Manifest inválido**:
   - Verifique se `/manifest.json` carrega corretamente
   - Validar JSON em DevTools

### Teste de Instalação Completo:
1. Clique no botão "Instalar App"
2. Confirme a instalação no navegador
3. O app será instalado como aplicativo nativo
4. Verifique na lista de aplicativos do sistema

---

**Status dos Recursos PWA:**
- ✅ Manifest.json configurado
- ✅ Service Worker com cache inteligente  
- ✅ Ícones 192x192 e 512x512
- ✅ Botão de instalação dinâmico
- ✅ Suporte iOS com instruções
- ✅ Debug mode para diagnóstico
- ✅ Servidor configurado corretamente
