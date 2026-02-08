# 🤖 WhatsApp Automation v2.0

**Data:** 7 de fevereiro de 2026  
**Status:** ✅ Implementado

---

## 📋 Resumo

O sistema agora implementa **automação completa do fluxo de QR code do WhatsApp**, seguindo as melhores práticas da [documentação UAZApi](https://docs.uazapi.com/).

## ✨ O que foi implementado

### 1. ✅ **Configuração Automática de Webhook**
- Após o usuário escanear o QR code, o webhook é configurado **automaticamente**
- **3 tentativas** com delay de 2 segundos entre cada uma
- Logs detalhados no console para debugging
- Retorna `boolean` para indicar sucesso/falha

```typescript
const configureWebhook = async (): Promise<boolean> => {
  // Retry automático 3x
  // Aguarda pending commands
  // Retorna true se sucesso, false se falha
}
```

### 2. ✅ **Validação Pós-Conexão**
- Detecta quando WhatsApp conecta (via polling a cada 3s)
- **Aguarda** a configuração do webhook antes de mostrar status "Conectado"
- Garante que o tenant está pronto para receber mensagens

### 3. ✅ **Feedback Visual Melhorado**
- Novo estado: `configuring-webhook` com badge visual
- Mensagens claras sobre o que está acontecendo
- Erros humanizados com mensagens específicas:
  - "Webhook não configurado: ..." (se falhar após 3 tentativas)
- "Integração temporariamente indisponível" (se webhook sem `connection`)
  - "Limite de instâncias atingido" (erro 429)

### 4. ✅ **Logging e Observabilidade**
```
🔧 Configurando webhook automaticamente (tentativa 1/3)...
✅ Webhook configurado com sucesso!
✅ Fluxo de conexão completo: WhatsApp conectado e webhook configurado
```

---

## 🔄 Fluxo Completo (Automático)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário clica "Conectar WhatsApp"                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend cria instância UAZAPI                            │
│    POST /api/v1/uazapi/instance/init                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend solicita QR Code                                 │
│    POST /api/v1/uazapi/instance/connect                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend exibe QR Code                                   │
│    Estado: "connecting" → QR renderizado                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Usuário escaneia QR no WhatsApp                          │
│    (Fora do sistema - ação manual)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 🤖 6. Polling detecta conexão (3 em 3 segundos)             │
│    GET /api/v1/uazapi/instance/status                       │
│    status.connected = true && status.loggedIn = true        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 🤖 7. Automação: Configura webhook (3 tentativas)           │
│    Estado: "configuring-webhook"                            │
│    POST /api/v1/uazapi/webhook                              │
│    ├─ events: ['messages', 'connection', 'messages_update']│
│    ├─ url: {BASE_URL}/webhooks/uazapi/{tenant_slug}?connection={TOKEN} │
│    └─ excludeMessages: ['wasSentByApi']                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ ✅ 8. Status final: "connected"                             │
│    - WhatsApp conectado                                     │
│    - Webhook ativo                                          │
│    - Tenant pronto para receber mensagens                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuração Necessária

### Backend (.env)

```bash
# ⚠️ Necessário para gerar URL do webhook
BASE_URL=https://seu-dominio.com

# Opcional (padrão: http://127.0.0.1:8090)
UAZAPI_BASE_URL=https://free.uazapi.com
UAZAPI_ADMIN_TOKEN=seu-admin-token
```

### Desenvolvimento Local

Para testar localmente, use ngrok:

```bash
# Terminal 1: Inicia backend com ngrok
cd ritmo-backend
make localdev-ngrok  # Expõe backend na internet

# Terminal 2: Frontend
cd ritmo-frontend
npm run dev
```

O Makefile configurará automaticamente `BASE_URL` com a URL do ngrok.

---

## 🐛 Troubleshooting

### ❌ "Webhook não configurado"

**Causa:** webhook não registrado com `connection` válido ou `BASE_URL` não acessível

**Solução:**
1. Verifique `.env` do backend
2. Certifique-se que `BASE_URL` não é localhost
3. Em dev, use `make localdev-ngrok`

### ❌ Webhook configurado mas mensagens não chegam

**Causa:** Firewall bloqueando ou URL incorreta

**Solução:**
```bash
# Teste acesso externo ao webhook
curl "https://seu-dominio.com/api/v1/webhooks/uazapi/seu-tenant?connection=TOKEN"

# Deve retornar 404 ou erro de método (POST esperado)
# Se timeout ou connection refused = problema de rede
```

### ❌ "Limite de instâncias atingido"

**Causa:** Servidor UAZAPI atingiu limite máximo (erro 429)

**Solução:**
- Exclua instâncias antigas: botão "Excluir integração" no modal
- Contate suporte UAZAPI para aumentar limite
- Em servidores gratuitos/demo, espere timeout das instâncias antigas

---

## 📊 Métricas e Logs

### Console do Navegador
```javascript
// Sucesso
🔧 Configurando webhook automaticamente (tentativa 1/3)...
✅ Webhook configurado com sucesso!
✅ Fluxo de conexão completo: WhatsApp conectado e webhook configurado

// Falha
🔧 Configurando webhook automaticamente (tentativa 1/3)...
❌ Erro ao configurar webhook (tentativa 1): missing webhook connection
🔧 Configurando webhook automaticamente (tentativa 2/3)...
❌ Erro ao configurar webhook (tentativa 2): invalid webhook connection
⚠️ WhatsApp conectado mas webhook não foi configurado automaticamente
```

### Backend Logs (Loguru)
```python
[INFO] Webhook uazapi registrado: tenant_id=xxx url=https://...
[INFO] Tenant settings atualizados: whatsapp_connected=True
```

---

## 🔐 Segurança

- ✅ `connection` por tenant validado em `/webhooks/uazapi/{slug}`
- ✅ Tenant isolado via RLS (Row Level Security)
- ✅ JWT necessário para todas chamadas ao backend
- ✅ Token da instância NUNCA exposto ao frontend (armazenado em `tenant.settings`)

---

## 📚 Referências

- [Documentação UAZApi](https://docs.uazapi.com/)
- [WhatsApp Integration Guide](./api/whatsapp.md)
- [Architecture Overview](./architecture/overview.md)
- [Backend: uazapi.py](../../ritmo-backend/src/api/routers/uazapi.py)
- [Frontend: WhatsAppModal.tsx](../components/ui/WhatsAppModal/WhatsAppModal.tsx)

---

## ✅ Checklist de Implementação

- [x] Configuração automática de webhook após QR scan
- [x] Retry automático (3 tentativas com delay)
- [x] Validação pós-conexão
- [x] Feedback visual durante configuração
- [x] Erros humanizados
- [x] Logging detalhado
- [x] Documentação atualizada
- [x] Tratamento de casos extremos (429, webhook connection inválida)
- [x] Testes em desenvolvimento local (ngrok)
- [ ] Testes em staging
- [ ] Testes em production

---

**🎉 Resultado:** O cliente agora tem uma experiência **zero-touch** após escanear o QR code - tudo acontece automaticamente em background!
