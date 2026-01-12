# 📱 WhatsApp Integration (UAZAPI)

Guia completo para integração com WhatsApp via UAZAPI na plataforma Ritmo.

---

## 📌 Overview

**UAZAPI** é um serviço que facilita a integração com WhatsApp Business:
- ✅ Conectar dispositivo WhatsApp
- ✅ Gerenciar instâncias (múltiplos números)
- ✅ Receber webhooks de mensagens/eventos
- ✅ Enviar mensagens via API

**Fluxo básico:**
```
WhatsApp Device
      ↓ (QR Code / Pair Code)
UAZAPI Instance
      ↓ (HTTP API)
Ritmo Frontend + Backend
      ↓ (Webhook)
Processa eventos (mensagens, status)
```

---

## 🔧 Configuração

### Variáveis de Ambiente

```env
# URL da API UAZAPI
NEXT_PUBLIC_UAZAPI_URL=https://lfsystem.uazapi.com

# Token de admin (para criar instâncias)
# ⚠️ NUNCA commit em git
UAZAPI_ADMIN_TOKEN=seu-token-secreto-aqui

# URL para receber webhooks
NEXT_PUBLIC_UAZAPI_WEBHOOK_URL=http://localhost:3001/webhook
```

### Em Produção

```env
# Staging
NEXT_PUBLIC_UAZAPI_URL=https://staging.uazapi.com
UAZAPI_ADMIN_TOKEN=staging-token

# Production
NEXT_PUBLIC_UAZAPI_URL=https://api.uazapi.com
UAZAPI_ADMIN_TOKEN=production-token
```

---

## 🔌 Client API (lib/uazapi.ts)

### Classes & Tipos

```typescript
export interface UazapiInstance {
  id: string;
  token: string;              // Token da instância (para requisições)
  name: string;               // Nome/descrição
  status: 'connected' | 'connecting' | 'disconnected';
  qrcode?: string;            // QR code (base64 ou URL)
  paircode?: string;          // Pair code (se não usar QR)
  profileName?: string;       // Nome do WhatsApp
  profilePicUrl?: string;     // Avatar
  isBusiness?: boolean;       // É conta business?
  owner?: string;             // Proprietário
  created?: string;           // Data de criação (ISO)
  updated?: string;           // Última atualização (ISO)
}

export interface WebhookConfig {
  id?: string;
  enabled: boolean;
  url: string;
  events: WebhookEvent[];     // Tipos de eventos
  addUrlTypesMessages?: boolean;
  addUrlEvents?: boolean;
  excludeMessages?: string[];
}

// Tipos de eventos que webhook pode receber
export type WebhookEvent = 
  | 'messages'           // Mensagens recebidas/enviadas
  | 'messages_update'    // Mudança de status de mensagem
  | 'connection'         // Mudanças de conexão
  | 'chats'              // Atualizações de chats
  | 'contacts'           // Atualizações de contatos
  | 'groups'             // Mudanças em grupos
  | 'calls'              // Chamadas recebidas
  | 'labels';            // Atualizações de labels
```

### Singleton Instance

```typescript
export const uazapi = new UazapiClient();
```

Use em qualquer lugar:
```tsx
import { uazapi } from '@/lib/uazapi';

const instance = await uazapi.connect(token);
```

### LocalStorage Helper

```typescript
export const WhatsAppStorage = {
  saveToken(token: string): void;   // Salva no localStorage
  getToken(): string | null;        // Recupera do localStorage
  clearToken(): void;               // Remove do localStorage
};
```

**Implementação:**
```typescript
const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY || 'whatsapp_instance_token';

export const WhatsAppStorage = {
  saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },
  
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },
  
  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
};
```

**Customizar a chave:**
```env
# .env.local
NEXT_PUBLIC_TOKEN_KEY=custom_key_dev

# Production
NEXT_PUBLIC_TOKEN_KEY=custom_key_prod
```

---

## 🔐 Autenticação UAZAPI

### Admin Token (Criar Instâncias)

```typescript
// Usar em server-side (backend) ou com cuidado no frontend
const adminToken = process.env.UAZAPI_ADMIN_TOKEN;

// Criar nova instância WhatsApp
POST https://lfsystem.uazapi.com/instance/init
Headers: {
  "admintoken": "{adminToken}"
}
Body: {
  "name": "Business Name",
  "number": "5511999999999"  // Opcional
}
```

### Instance Token (Usar Instância)

```typescript
// Token específico da instância (recebido ao criar)
const instanceToken = "instance_token_abc123";

// Conectar, enviar mensagens, etc
POST https://lfsystem.uazapi.com/send/text
Headers: {
  "token": "{instanceToken}"
}
Body: {
  "number": "5511999999999",
  "text": "Olá!"
}
```

---

## 🎯 Fluxo: Conectar WhatsApp

### 1. Criar Instância (Backend)

```typescript
// ritmo-backend POST /whatsapp/connect
const response = await fetch(
  'https://lfsystem.uazapi.com/instance/init',
  {
    method: 'POST',
    headers: {
      'admintoken': UAZAPI_ADMIN_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: user.business_name,
      // tenant_id, owner, etc
    }),
  }
);

const instance = await response.json();
// { id, token, qrcode, status, ... }
```

### 2. Gerar QR Code (Frontend)

```tsx
'use client';

import { uazapi, WhatsAppStorage } from '@/lib/uazapi';
import { useState } from 'react';

export function WhatsAppModal() {
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [status, setStatus] = useState('disconnected');

  const handleConnect = async () => {
    try {
      // 1. Chamada ao backend para criar instância
      const response = await fetch('/api/v1/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const { token, qrcode: qr } = await response.json();
      
      // 2. Salvar token localmente
      WhatsAppStorage.saveToken(token);
      
      // 3. Mostrar QR code
      setQrcode(qr);
      setStatus('connecting');
      
      // 4. Monitorar conexão
      const connected = await uazapi.waitForConnection(token, 60000);
      if (connected) {
        setStatus('connected');
        setQrcode(null);
      }
    } catch (err) {
      console.error('Erro ao conectar:', err);
      setStatus('error');
    }
  };

  return (
    <div>
      {status === 'disconnected' && (
        <button onClick={handleConnect}>Conectar WhatsApp</button>
      )}
      {status === 'connecting' && qrcode && (
        <div>
          <p>Escaneie o QR code:</p>
          <img src={qrcode} alt="QR Code" />
        </div>
      )}
      {status === 'connected' && (
        <p>✓ WhatsApp conectado com sucesso!</p>
      )}
    </div>
  );
}
```

### 3. Configurar Webhook (Backend)

```typescript
// Após conexão bem-sucedida
const instanceToken = instance.token;

await fetch(
  'https://lfsystem.uazapi.com/webhook',
  {
    method: 'POST',
    headers: {
      'token': instanceToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      enabled: true,
      url: 'https://seu-dominio.com/api/webhooks/uazapi',
      events: ['messages', 'messages_update', 'connection'],
    }),
  }
);
```

---

## 📨 Enviar Mensagens

### Texto

```typescript
const response = await fetch(
  'https://lfsystem.uazapi.com/send/text',
  {
    method: 'POST',
    headers: {
      'token': instanceToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: '5511999999999',
      text: 'Olá! Sua consulta foi confirmada para amanhã às 14h.',
    }),
  }
);

const result = await response.json();
// { id, status, timestamp, ... }
```

### Imagem / Mídia

```typescript
const response = await fetch(
  'https://lfsystem.uazapi.com/send/media',
  {
    method: 'POST',
    headers: {
      'token': instanceToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: '5511999999999',
      mediaUrl: 'https://exemplo.com/imagem.jpg',
      caption: 'Seu comprovante de agendamento',
    }),
  }
);
```

---

## 🔔 Webhooks

### Estrutura Geral

```json
{
  "event": "messages",
  "data": {
    "id": "msg_id",
    "number": "5511999999999",
    "message": "Texto da mensagem",
    "timestamp": 1705276800,
    "from_me": false,
    "status": "received"
  }
}
```

### Tipos de Eventos

**messages** - Mensagem recebida/enviada
```json
{
  "event": "messages",
  "data": {
    "number": "5511999999999",
    "message": "Texto",
    "from_me": false
  }
}
```

**connection** - Mudança de status
```json
{
  "event": "connection",
  "data": {
    "status": "connected",
    "timestamp": 1705276800
  }
}
```

**messages_update** - Status de entrega
```json
{
  "event": "messages_update",
  "data": {
    "message_id": "msg_123",
    "status": "delivered"  // sent, delivered, read, failed
  }
}
```

### Implementação do Endpoint

```typescript
// app/api/webhooks/uazapi/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event, data } = body;

  switch (event) {
    case 'messages':
      // Processar mensagem recebida
      await handleIncomingMessage(data);
      break;
    
    case 'connection':
      // Atualizar status da instância
      await updateConnectionStatus(data);
      break;
    
    case 'messages_update':
      // Atualizar status de entrega
      await updateMessageStatus(data);
      break;
  }

  // UAZAPI espera 200 OK
  return NextResponse.json({ success: true });
}

async function handleIncomingMessage(data: any) {
  // Salvar mensagem no banco de dados
  // Notificar suporte se necessário
  // Responder com IA, etc
}
```

---

## 🐛 Troubleshooting

### ❌ "QR Code não aparece"

**Causa**: Token inválido ou instância não criada

**Solução**:
```typescript
// Verificar se instância foi criada
const instance = await fetch('/api/whatsapp/status');
console.log(instance);

// Verificar token no localStorage
console.log(WhatsAppStorage.getToken());
```

### ❌ "Webhook não recebe eventos"

**Causa**: URL pública inválida ou firewall bloqueando

**Solução**:
```bash
# Testar acesso externo
curl https://seu-dominio.com/api/webhooks/uazapi

# Se localhost, usar ngrok:
ngrok http 3000
# Usar ngrok URL em NEXT_PUBLIC_UAZAPI_WEBHOOK_URL
```

### ❌ "Mensagens não enviam"

**Causa**: Instance token expirado ou número inválido

**Solução**:
```typescript
// Verificar formato do número (com país)
// ✅ 5511999999999 (correto)
// ❌ 11999999999 (falta país)

// Reconectar se necessário
WhatsAppStorage.clearToken();
// Fazer login novamente
```

---

## 🔗 Links Úteis

- [UAZAPI Documentation](https://lfsystem.uazapi.com/docs)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Webhook Testing Tools](https://webhook.site)

---

## 📋 Checklist de Integração

- [ ] `NEXT_PUBLIC_UAZAPI_URL` configurada
- [ ] `UAZAPI_ADMIN_TOKEN` setada (segura)
- [ ] Backend endpoint `/api/whatsapp/connect` implementado
- [ ] Webhook endpoint implementado
- [ ] WhatsAppModal renderizando
- [ ] QR code aparecendo corretamente
- [ ] Mensagens sendo recebidas
- [ ] Webhook recebendo eventos
- [ ] Testes em staging antes de prod

---

**Próximas:** [API Client Guide](./client.md) | [Authentication](./authentication.md)
