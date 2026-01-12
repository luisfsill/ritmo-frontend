# 🔐 Environment Variables Guide

Guia completo sobre as variáveis de ambiente do Ritmo Frontend.

---

## 📋 Visão Geral

Variáveis de ambiente são configurações que mudam entre **desenvolvimento**, **staging** e **produção**.

```
.env.local (seu computador)
    ↓
process.env (aplicação)
    ↓
Comportamento da app
```

---

## ✅ Variáveis Obrigatórias

Sem estas, a aplicação **não funciona**:

### `NEXT_PUBLIC_RITMO_API_URL`
- **Descrição**: URL do backend Ritmo
- **Formato**: URL completa com protocolo
- **Padrão**: Nenhum (obrigatório)
- **Exemplo**:
  ```env
  NEXT_PUBLIC_RITMO_API_URL=http://localhost:8000
  NEXT_PUBLIC_RITMO_API_URL=https://api.ritmo.com
  ```
- **Usado em**: `lib/api.ts` para requisições HTTP

### `NEXT_PUBLIC_UAZAPI_URL`
- **Descrição**: URL da API UAZAPI (WhatsApp)
- **Padrão**: `https://lfsystem.uazapi.com`
- **Exemplo**:
  ```env
  NEXT_PUBLIC_UAZAPI_URL=https://lfsystem.uazapi.com
  ```
- **Usado em**: `lib/uazapi.ts` para conectar WhatsApp

### `UAZAPI_ADMIN_TOKEN`
- **Descrição**: Token administrativo UAZAPI
- **⚠️ NUNCA COMMIT**: Use `.gitignore`
- **Onde obter**: https://lfsystem.uazapi.com
- **Exemplo**:
  ```env
  UAZAPI_ADMIN_TOKEN=seu-token-admin-uazapi
  ```
- **Escopo**: Server-side (não expor ao navegador)
- **Usado em**: Criar instâncias WhatsApp (backend)

### `NEXT_PUBLIC_UAZAPI_WEBHOOK_URL`
- **Descrição**: URL para receber webhooks do WhatsApp
- **Formato**: URL completa acessível externamente
- **Exemplo**:
  ```env
  # Desenvolvimento (localhost não funciona)
  NEXT_PUBLIC_UAZAPI_WEBHOOK_URL=https://seu-dominio.ngrok.io/api/webhooks/uazapi
  
  # Produção
  NEXT_PUBLIC_UAZAPI_WEBHOOK_URL=https://api.ritmo.com/api/webhooks/uazapi
  ```
- **Usado em**: Configuração de webhook ao conectar WhatsApp

---

## 🟡 Variáveis Opcionais

Estas têm valores padrão e não são obrigatórias:

### `NEXT_PUBLIC_TOKEN_KEY`
- **Descrição**: Chave para localStorage do token WhatsApp
- **Padrão**: `'whatsapp_instance_token'`
- **Tipo**: String
- **Quando usar**: Se quiser diferentes chaves por ambiente
- **Exemplo**:
  ```env
  # Desenvolvimento
  NEXT_PUBLIC_TOKEN_KEY=whatsapp_instance_token_dev
  
  # Staging
  NEXT_PUBLIC_TOKEN_KEY=whatsapp_instance_token_staging
  
  # Produção
  NEXT_PUBLIC_TOKEN_KEY=whatsapp_instance_token_prod
  ```
- **Nota**: Se não configurar, usa o padrão
- **Usado em**: `lib/uazapi.ts` → `WhatsAppStorage`

**Novo em v1.1.0**: Adicionado suporte a customização via env var

### `NEXT_PUBLIC_GA_ID`
- **Descrição**: Google Analytics tracking ID
- **Padrão**: Nenhum (analytics desativado)
- **Formato**: Começa com `G-`
- **Exemplo**:
  ```env
  NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
  ```
- **Onde obter**: Google Analytics Dashboard
- **Usado em**: Rastreamento de eventos (futuro)

### `NEXT_PUBLIC_ENVIRONMENT`
- **Descrição**: Identificar qual ambiente está rodando
- **Padrão**: `'development'`
- **Valores**: `development`, `staging`, `production`
- **Exemplo**:
  ```env
  NEXT_PUBLIC_ENVIRONMENT=development
  NEXT_PUBLIC_ENVIRONMENT=staging
  NEXT_PUBLIC_ENVIRONMENT=production
  ```
- **Usado em**: Lógica condicional, logs, analytics

---

## 📁 Arquivos de Configuração

### `.env.local` (Local - NUNCA commit)
Seu computador pessoal:
```env
NEXT_PUBLIC_RITMO_API_URL=http://localhost:8000
NEXT_PUBLIC_UAZAPI_URL=https://lfsystem.uazapi.com
UAZAPI_ADMIN_TOKEN=seu-token-secreto
NEXT_PUBLIC_UAZAPI_WEBHOOK_URL=https://seu-ngrok.ngrok.io/webhook
```

### `.env.local.example` (Template - COMMIT)
Modelo para outros desenvolvedores:
```env
# Sem valores secretos!
NEXT_PUBLIC_RITMO_API_URL=http://localhost:8000
NEXT_PUBLIC_UAZAPI_URL=https://lfsystem.uazapi.com
UAZAPI_ADMIN_TOKEN=seu_token_admin_aqui
NEXT_PUBLIC_UAZAPI_WEBHOOK_URL=https://seu-webhook-aqui.com/webhook
```

### `.env.production` (Produção)
Deploy automático (setado no Vercel/plataforma):
```env
NEXT_PUBLIC_RITMO_API_URL=https://api.ritmo.com
NEXT_PUBLIC_UAZAPI_URL=https://api.uazapi.com
UAZAPI_ADMIN_TOKEN=prod-token-aqui
NEXT_PUBLIC_UAZAPI_WEBHOOK_URL=https://api.ritmo.com/api/webhooks/uazapi
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## 🔍 Public vs Private

### `NEXT_PUBLIC_*` (Visível no Cliente)
Seguro expor no navegador:
- URLs públicas de API
- IDs de rastreamento (Analytics)
- Identificadores não-sensíveis
- Configurações de UI

```env
✅ NEXT_PUBLIC_RITMO_API_URL=https://api.ritmo.com
✅ NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
✅ NEXT_PUBLIC_ENVIRONMENT=production
```

**Acessível no browser:**
```javascript
// Qualquer lugar do código (frontend)
console.log(process.env.NEXT_PUBLIC_RITMO_API_URL);
// → https://api.ritmo.com
```

### Sem prefixo (Privado - Server Only)
Nunca exponha no navegador:
- Tokens secretos
- Chaves de API privadas
- Dados sensíveis

```env
🔐 UAZAPI_ADMIN_TOKEN=seu-token-secreto
🔐 DATABASE_PASSWORD=senha-123
🔐 JWT_SECRET=muito-secreto
```

**Acessível APENAS no servidor:**
```javascript
// Apenas em API routes ou server components
const token = process.env.UAZAPI_ADMIN_TOKEN;
```

---

## 🚀 Setup por Ambiente

### 1️⃣ Desenvolvimento Local

```bash
# 1. Copiar template
cp .env.local.example .env.local

# 2. Editar com suas credenciais
cat .env.local
```

**Arquivo `.env.local`:**
```env
# Backend local
NEXT_PUBLIC_RITMO_API_URL=http://localhost:8000

# UAZAPI
NEXT_PUBLIC_UAZAPI_URL=https://lfsystem.uazapi.com
UAZAPI_ADMIN_TOKEN=seu-token-admin

# Webhook (use ngrok para túnel local)
# npx ngrok http 3001
NEXT_PUBLIC_UAZAPI_WEBHOOK_URL=https://xxx.ngrok.io/api/webhooks/uazapi

# Opcional
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_TOKEN_KEY=whatsapp_token_dev
```

### 2️⃣ Staging (Vercel / AWS)

Configurar via dashboard da plataforma:
```
Settings → Environment Variables
+ Add Variable
Name: NEXT_PUBLIC_RITMO_API_URL
Value: https://api-staging.ritmo.com
Environment: Staging
```

### 3️⃣ Produção (Vercel / AWS)

```
Settings → Environment Variables
+ Add Variable
Name: NEXT_PUBLIC_RITMO_API_URL
Value: https://api.ritmo.com
Environment: Production
```

---

## ✅ Checklist de Setup

- [ ] Copiar `.env.local.example` → `.env.local`
- [ ] Preencher `NEXT_PUBLIC_RITMO_API_URL` (local ou remota)
- [ ] Preencher `UAZAPI_ADMIN_TOKEN` (solicitar ao tech lead)
- [ ] Preencher `NEXT_PUBLIC_UAZAPI_WEBHOOK_URL` (ngrok ou domain)
- [ ] Verificar `.gitignore` tem `.env.local` ✅
- [ ] Testar: `npm run dev`
- [ ] Verificar console: sem erros de API

---

## 🐛 Troubleshooting

### ❌ "Cannot find module '@/lib/api' - API URL undefined"

**Causa**: `NEXT_PUBLIC_RITMO_API_URL` não setada

**Solução**:
```bash
# Verificar
echo $NEXT_PUBLIC_RITMO_API_URL

# Se vazio, editar .env.local
NEXT_PUBLIC_RITMO_API_URL=http://localhost:8000

# Restart
npm run dev
```

### ❌ "Service offline" ao fazer login

**Causa**: API URL incorreta ou backend não rodando

**Solução**:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd ../ritmo-backend
make localdev

# Terminal 3: Verificar
curl http://localhost:8000/health
# Deve retornar 200 OK
```

### ❌ "WhatsApp webhook not receiving events"

**Causa**: `NEXT_PUBLIC_UAZAPI_WEBHOOK_URL` pública inacessível

**Solução**:
```bash
# Use ngrok para tunelar local
npx ngrok http 3001

# Copie a URL pública
NEXT_PUBLIC_UAZAPI_WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/uazapi

# Reiniciar
npm run dev
```

---

## 📚 Referência Rápida

| Variável | Obrigatória | Escopo | Padrão |
|----------|------------|--------|---------|
| `NEXT_PUBLIC_RITMO_API_URL` | ✅ | Client | Nenhum |
| `NEXT_PUBLIC_UAZAPI_URL` | ✅ | Client | `https://lfsystem.uazapi.com` |
| `UAZAPI_ADMIN_TOKEN` | ✅ | Server | Nenhum |
| `NEXT_PUBLIC_UAZAPI_WEBHOOK_URL` | ✅ | Client | Nenhum |
| `NEXT_PUBLIC_TOKEN_KEY` | ❌ | Client | `whatsapp_instance_token` |
| `NEXT_PUBLIC_GA_ID` | ❌ | Client | Nenhum |
| `NEXT_PUBLIC_ENVIRONMENT` | ❌ | Client | `development` |

---

## 🔗 Links Úteis

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [12 Factor App - Config](https://12factor.net/config)

---

**Última atualização:** 12 de janeiro de 2026 (v1.1.0)
