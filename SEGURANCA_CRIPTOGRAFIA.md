# Plano de Criptografia Abrangente - Loom

## Camadas de Segurança

### 1. VARIÁVEIS DE AMBIENTE E SECRETS
- [x] Usar `.env` com variáveis sensíveis
- [ ] Implementar validação de variáveis obrigatórias
- [ ] Adicionar criptografia de `.env` em produção

### 2. AUTENTICAÇÃO
- [x] bcrypt para hash de senhas
- [x] JWT/Sessions para autenticação
- [ ] Implementar rate limiting em login
- [ ] Implementar 2FA (autenticação em dois fatores)

### 3. DADOS EM TRÂNSITO
- [ ] HTTPS obrigatório em produção
- [ ] HSTS (HTTP Strict Transport Security)
- [ ] CSP (Content Security Policy)
- [ ] Certificado SSL/TLS

### 4. DADOS EM REPOUSO
- [ ] Criptografar campos sensíveis no banco
  - Email
  - CPF/Documentos
  - Telefone
  - Dados pessoais
  - Tokens

### 5. SESSÕES E COOKIES
- [x] Cookies HttpOnly
- [x] SameSite
- [ ] Implementar CSRF tokens
- [ ] Proteger contra XSS

### 6. BANCO DE DADOS
- [ ] Criptografia de coluna para dados sensíveis
- [ ] Implementar soft deletes (não deletar, marcar como deletado)
- [ ] Auditoria de acessos
- [ ] Backup criptografado

### 7. UPLOADS DE ARQUIVO
- [x] Limitar tamanho (5MB)
- [ ] Validar tipo de arquivo
- [ ] Verificar conteúdo (magic bytes)
- [ ] Criptografar arquivos armazenados
- [ ] Usar nomes aleatórios

### 8. LOGS E MONITORAMENTO
- [ ] Não logar dados sensíveis
- [ ] Criptografar logs
- [ ] Manter registro de acesso a dados sensíveis

### 9. VALIDAÇÃO E SANITIZAÇÃO
- [ ] Validar entrada em todos os endpoints
- [ ] Sanitizar para evitar SQL injection
- [ ] Escapar output para evitar XSS
- [ ] Validar type checking

### 10. PERMISSÕES E AUTORIZAÇÃO
- [ ] Implementar RBAC (Role-based Access Control)
- [ ] Verificar permissões em cada rota
- [ ] Implementar auditoria de ações administrativas

## Implementação

### Fase 1: Setup de Segurança Básica (IMEDIATO)
1. Implementar headers de segurança
2. Adicionar validação de entrada
3. Proteger contra SQL injection com prepared statements
4. Rate limiting em endpoints críticos

### Fase 2: Criptografia de Dados Sensíveis (SEMANA 1)
1. Criptografar email no banco
2. Criptografar telefone
3. Criptografar dados pessoais
4. Criptografar tokens de reset

### Fase 3: Autenticação Avançada (SEMANA 2)
1. Implementar 2FA
2. Rate limiting em login
3. Detecção de atividade suspeita
4. Expiração de sessão melhorada

### Fase 4: Compliance e Auditoria (SEMANA 3)
1. Auditoria de ações
2. Logs seguros
3. LGPD compliance
4. Direito ao esquecimento

## Arquivos para Criar/Modificar

1. `/utils/encryption.js` - Funções de criptografia
2. `/utils/security.js` - Middleware de segurança
3. `/utils/validation.js` - Validação de entrada
4. `/models/AuditLog.js` - Registro de auditoria
5. Modificar modelos para criptografar dados
6. Modificar app.js para adicionar headers de segurança

## Dependências Adicionais

```json
{
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5",
  "joi": "^17.11.0",
  "xss": "^1.0.14",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.1.2",
  "argon2": "^0.31.2",
  "crypto-js": "^4.2.0",
  "sanitize-html": "^2.11.0"
}
```

## Checklist de Segurança
- [ ] Headers de segurança implementados
- [ ] Validação de entrada em todas as rotas
- [ ] SQL injection prevenido
- [ ] XSS prevenido
- [ ] CSRF prevenido
- [ ] Dados sensíveis criptografados
- [ ] Senhas com bcrypt/Argon2
- [ ] Logs seguros
- [ ] Rate limiting implementado
- [ ] 2FA implementado
- [ ] Auditoria implementada
- [ ] HTTPS em produção
- [ ] Testes de segurança realizados
- [ ] Documentação atualizada
