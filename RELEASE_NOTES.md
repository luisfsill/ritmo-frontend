# 🚀 Release Notes - Mudança TOKEN em lib/uazapi.ts

**Data**: 12 de janeiro de 2026  
**Branch**: `cauemura/dev` → merge para `main`  
**Impacto**: Baixo | Compatibilidade: Alta ✅

---

## 📋 Resumo da Mudança

Refatoração na forma como o token do WhatsApp é armazenado no localStorage.

### O que mudou

```typescript
// ❌ ANTES (main)
export const WhatsAppStorage = {
  TOKEN_KEY: 'whatsapp_instance_token',  // Propriedade pública
  
  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  },
  // ...
}

// ✅ DEPOIS (cauemura/dev)
const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY || 'whatsapp_instance_token';

export const WhatsAppStorage = {
  saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  // ...
}
```

---

## ✨ Benefícios

| Aspecto | Antes | Depois | Benefício |
|---------|-------|--------|-----------|
| **Customização** | Hard-coded | Via env var | ✅ Diferentes chaves por ambiente |
| **Acessibilidade** | Pública (`.TOKEN_KEY`) | Privada | ✅ Menos acesso acidental |
| **Segurança** | Exposta em código | Configurável | ✅ Melhor controle |
| **Simplicidade** | Uso de `this.` | Acesso direto | ✅ Menos boilerplate |

---

## 🔄 Impacto no Código

### ✅ Sem Breaking Changes

- Nenhum uso de `WhatsAppStorage.TOKEN_KEY` encontrado no código
- Comportamento do localStorage permanece idêntico
- Dados existentes no localStorage continuam acessíveis

### 📊 Verificação de Compatibilidade

```bash
# Buscar usos da propriedade
grep -r "WhatsAppStorage.TOKEN_KEY" .
# Resultado: 0 matches ✅

# Verificar se TOKEN_KEY ainda funciona
grep -r "TOKEN_KEY" lib/uazapi.ts
# Resultado: 3 matches (apenas uso interno) ✅
```

---

## 🔐 Configuração

### Nova Variável de Ambiente

```env
# .env.local (dev)
NEXT_PUBLIC_TOKEN_KEY=whatsapp_instance_token_dev

# .env.production (prod)
NEXT_PUBLIC_TOKEN_KEY=whatsapp_instance_token_prod

# Default (se não configurado)
NEXT_PUBLIC_TOKEN_KEY=whatsapp_instance_token
```

### Uso

```typescript
import { WhatsAppStorage } from '@/lib/uazapi';

// Salvar
WhatsAppStorage.saveToken('token_abc123');

// Recuperar
const token = WhatsAppStorage.getToken();

// Limpar
WhatsAppStorage.clearToken();
```

---

## 📋 Checklist para Merge

- [x] Mudança implementada em `lib/uazapi.ts`
- [x] Documentação criada (`docs/api/whatsapp.md`)
- [x] CHANGELOG.md atualizado
- [x] Nenhum breaking change detectado
- [x] Code style consistente
- [x] Testes compilam (`npm run build`)
- [x] Linting passa (`npm run lint`)
- [x] Dados no localStorage continuam acessíveis

---

## 🧪 Teste de Regressão

Para validar que a mudança não quebra nada:

```bash
# 1. Checkout branch com mudança
git checkout cauemura/dev

# 2. Instalar deps
npm install

# 3. Build
npm run build

# 4. Lint
npm run lint

# 5. Dev server
npm run dev

# 6. Testar WhatsApp modal
# Navegar para /dashboard/settings
# Clicar em "Conectar WhatsApp"
# Verificar se QR code aparece
# Verificar console por erros

# 7. Verificar localStorage
# DevTools → Application → Local Storage
# Procurar por "whatsapp_instance_token"
# Valor deve estar acessível
```

---

## 📚 Documentação Criada

### 📖 docs/api/whatsapp.md
Guia completo de integração UAZAPI incluindo:
- Overview do fluxo
- Configuração de variáveis de ambiente
- Client API (UazapiClient, tipos)
- Autenticação (admin token vs instance token)
- Fluxo completo: criar → gerar QR → conectar → webhook
- Envio de mensagens (texto, mídia)
- Estrutura de webhooks
- Troubleshooting

### 📝 CHANGELOG.md
Histórico de mudanças com:
- Versão 1.1.0 (esta mudança)
- Versão 1.0.0 (release inicial)
- Formato padrão para futuras entradas

### 📋 RELEASE_NOTES.md
Este arquivo! Documentação da mudança específica.

---

## 🔗 Links Úteis

- [WhatsApp Integration Docs](./docs/api/whatsapp.md)
- [UAZAPI Documentation](https://lfsystem.uazapi.com/docs)
- [CHANGELOG](./CHANGELOG.md)

---

## 💬 FAQ

### P: Isso quebra o login WhatsApp?
**R**: Não. O localStorage continua funcionando normalmente. A chave padrão é a mesma.

### P: Preciso fazer algo no meu código?
**R**: Não, se você usa `WhatsAppStorage.saveToken()` ou `WhatsAppStorage.getToken()`. Esses métodos continuam idênticos.

### P: Posso customizar a chave do localStorage?
**R**: Sim! Agora você pode setar `NEXT_PUBLIC_TOKEN_KEY` no `.env.local`.

### P: E os tokens já armazenados?
**R**: Continuam acessíveis. Se você não mudar a chave de padrão, tudo funciona normalmente.

---

## 🚀 Próximas Versões

- [ ] v1.2.0 - Melhorias no WhatsApp modal UI
- [ ] v1.3.0 - Suporte a múltiplas instâncias
- [ ] v2.0.0 - Integração com Twilio (break change)

---

**Status**: ✅ Pronto para merge  
**Aprovação**: Pendente code review  
**Data**: 12 de janeiro de 2026
