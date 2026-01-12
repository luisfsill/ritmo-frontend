# 🔌 API Client Guide

Guia completo para usar o cliente HTTP `lib/api.ts` e integrar com backend.

## 📌 Overview

`lib/api.ts` é o **cliente HTTP centralizado** que:
- ✅ Gerencia tokens JWT (access + refresh)
- ✅ Faz auto-refresh em responses 401
- ✅ Trata erros de forma consistente
- ✅ Adiciona headers de auth automaticamente
- ✅ Suporta idempotency keys

---

## 🚀 Uso Básico

> Nota: o `api` exige endpoints versionados no formato `/api/v1/...` (ex.: `/api/v1/bookings`). Endpoints sem versão lançam `Error` em runtime.

### GET Request
```tsx
import { api } from '@/lib/api';

export default function MyComponent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/v1/bookings');
        setData(response);
      } catch (err) {
        setError((err as ApiError).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error}</p>;
  return <div>{JSON.stringify(data)}</div>;
}
```

### POST Request
```tsx
const handleSubmit = async (formData: BookingData) => {
  try {
    const response = await api.post('/api/v1/bookings', formData);
    console.log('Agendamento criado:', response);
    // Redirecionar ou atualizar UI
  } catch (err) {
    const apiErr = err as ApiError;
    console.error(`Erro ${apiErr.status}: ${apiErr.message}`);
  }
};
```

### PUT / PATCH Request
```tsx
// Atualizar agendamento
await api.put('/api/v1/bookings/123', { status: 'confirmed' });

// Aplicar patch parcial
await api.patch('/api/v1/user/settings', { theme: 'dark' });
```

### DELETE Request
```tsx
await api.delete('/api/v1/bookings/123');
```

---

## 🔐 Autenticação

### Token Storage
Tokens são armazenados em **dois lugares**:

1. **Memory (JS)**: Acesso rápido, perdido ao reload
2. **localStorage**: Persistência entre sessões
3. **Cookies**: Acessível para Middleware/SSR

```tsx
// lib/api.ts internamente:
export function setTokens(tokens: TokenPair) {
  accessToken = tokens.access_token;  // Memory
  
  localStorage.setItem('ritmo_access_token', tokens.access_token);
  localStorage.setItem('ritmo_refresh_token', tokens.refresh_token);
  
  // Cookies para Middleware
  document.cookie = `ritmo_access_token=${tokens.access_token}; path=/; max-age=86400; SameSite=Lax`;
  document.cookie = `ritmo_refresh_token=${tokens.refresh_token}; path=/; max-age=604800; SameSite=Lax`;
}
```

### Auto-Refresh em 401
```
Request com access_token expirado
  ↓
Response 401 (Unauthorized)
  ↓
api.ts detecta 401
  ↓
POST /api/v1/auth/refresh com refresh_token
  ↓
Novo access_token recebido
  ↓
Retry requisição original com novo token
  ↓
Success ✓ (ou erro se refresh falhar)
```

**Código:**
```typescript
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setTokens(data);  // Update tokens
    return true;
  } catch {
    return false;
  }
}
```

---

## 🛡️ Error Handling

### ApiError Interface
```typescript
export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, unknown>;
}
```

### Tratamento por Status Code

```tsx
import { api, ApiError } from '@/lib/api';

try {
  await api.post('/api/v1/bookings', formData);
} catch (err) {
  const error = err as ApiError;

  switch (error.status) {
    case 400:
      console.error('Bad request:', error.details);
      // Mostrar validação errors
      break;
    case 401:
      console.error('Não autenticado');
      // Redirecionar para login
      break;
    case 403:
      console.error('Sem permissão');
      // Mostrar "Acesso negado"
      break;
    case 404:
      console.error('Recurso não encontrado');
      break;
    case 422:
      console.error('Validação falhou:', error.details);
      // Mostrar erros de campo
      break;
    case 500:
      console.error('Erro interno do servidor');
      // Mostrar generic error + retry button
      break;
    default:
      console.error('Erro desconhecido:', error.message);
  }
}
```

### Status Code Meanings

| Code | Causa | Ação |
|------|-------|------|
| **200** | OK | Sucesso |
| **201** | Created | Recurso criado |
| **204** | No Content | Sucesso (sem body) |
| **400** | Bad Request | Validação falhou |
| **401** | Unauthorized | Token inválido/expirado |
| **403** | Forbidden | Sem permissão (tenant mismatch?) |
| **404** | Not Found | Recurso não existe |
| **422** | Unprocessable Entity | Dados inválidos |
| **500+** | Server Error | Erro interno do backend |

---

## 📋 Tipos & Interfaces

### TokenPair
```typescript
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type?: 'Bearer';
  expires_in?: number;
}
```

### RequestOptions
```typescript
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  requiresAuth?: boolean;           // Default: true
  idempotencyKey?: string;          // Para operações idempotentes
}
```

### Convenience Methods
```typescript
export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) 
    => apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) 
    => apiRequest<T>(endpoint, { ...options, method: 'POST', body }),
  
  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) 
    => apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),
  
  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) 
    => apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),
  
  delete: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) 
    => apiRequest<T>(endpoint, { ...options, method: 'DELETE', body }),
};
```

---

## 🔒 Casos Especiais

### Sem Autenticação (Login/Register)
```typescript
// Não requer token
const response = await api.post(
  '/api/v1/auth/login',
  { email, password },
  { requiresAuth: false }  // ← Key
);
```

### Idempotency (Evitar duplicação)
```typescript
// Mesma requisição 2x = mesmo resultado
const response = await api.post(
  '/api/v1/bookings',
  formData,
  { idempotencyKey: `booking-${Date.now()}` }
);
```

**Backend usa idempotency key para detectar retries e retornar mesmo resultado.**

### Headers Customizados
```typescript
await api.get(
  '/api/v1/report',
  { 
    headers: { 'X-Custom-Header': 'value' }
  }
);
```

---

## 📍 Endpoints Principais

### Authentication
```
POST /api/v1/auth/login
  Body: { email: string, password: string }
  Response: { access_token, refresh_token, user }

POST /api/v1/auth/refresh
  Body: { refresh_token: string }
  Response: { access_token, refresh_token }

POST /api/v1/auth/logout
  Response: {}
```

### User
```
GET /api/v1/user/me
  Response: { id, email, name, tenant_id, business_name }

PUT /api/v1/user/me
  Body: { name, email, business_name }
  Response: User

POST /api/v1/user/password
  Body: { current_password, new_password }
  Response: {}
```

### Bookings
```
GET /api/v1/bookings?skip=0&limit=10
  Response: { items: Booking[], total: number }

POST /api/v1/bookings
  Body: { service_id, time_slot, client_info }
  Response: { id, status, created_at }

GET /api/v1/bookings/:id
  Response: Booking

PUT /api/v1/bookings/:id
  Body: { status, notes }
  Response: Booking

DELETE /api/v1/bookings/:id
  Response: {}
```

### Schedule/Calendar
```
GET /api/v1/schedule?from=2024-01-15&to=2024-01-31
  Response: { [date]: TimeSlot[] }

GET /api/v1/schedule/:professional_id/availability
  Response: { slots: TimeSlot[] }
```

**Consultar [ritmo-backend/README.md](../../ritmo-backend/README.md) para lista completa.**

---

## 🧪 Exemplo Completo: Criar Agendamento

```tsx
'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Button, Input } from '@/components/ui';

interface BookingForm {
  service_id: string;
  time_slot: string;
  client_name: string;
  client_phone: string;
}

export function BookingForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<BookingForm>({
    service_id: '',
    time_slot: '',
    client_name: '',
    client_phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post('/api/v1/bookings', {
        ...formData,
        client_info: {
          name: formData.client_name,
          phone: formData.client_phone,
        },
      });

      console.log('Agendamento criado:', response);
      setSuccess(true);
      setFormData({
        service_id: '',
        time_slot: '',
        client_name: '',
        client_phone: '',
      });

      // Redirecionar após 2s
      setTimeout(() => {
        window.location.href = '/dashboard/bookings';
      }, 2000);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">✓ Agendamento criado!</div>}

      <Input
        type="text"
        placeholder="Nome do cliente"
        value={formData.client_name}
        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
        required
      />

      <Input
        type="tel"
        placeholder="Telefone"
        value={formData.client_phone}
        onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
        required
      />

      <Button type="submit" disabled={loading}>
        {loading ? 'Agendando...' : 'Agendar'}
      </Button>
    </form>
  );
}
```

---

## 🐛 Debugging

### Ver requisições no DevTools
```
DevTools → Network tab
→ Filtrar por "Fetch/XHR"
→ Clicar em requisição
→ Ver: Headers, Preview, Response
```

### Console logs
```typescript
// lib/api.ts - adicionar logs (remover em produção)
console.log('🔵 Request:', method, endpoint, headers);
console.log('🟢 Response:', response.status, data);
console.log('🔴 Error:', error);
```

### Verificar tokens
```javascript
// Browser console
localStorage.getItem('ritmo_access_token')
// Decodificar JWT: jwt.io
```

---

## 🔗 Links

- [JWT Debugger](https://jwt.io)
- [HTTP Status Codes](https://httpwg.org/specs/rfc7231.html#status.codes)
- [Fetch API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

**Próximas:** [Authentication Deep Dive](./authentication.md) | [Error Handling](./error-handling.md)
