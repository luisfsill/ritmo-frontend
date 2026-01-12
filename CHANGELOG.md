# 📝 CHANGELOG

Histórico de mudanças significativas no Ritmo Frontend.

---

## [1.1.0] - 2026-01-12

### 🎉 Novas Funcionalidades

- ✨ Documentação completa de WhatsApp Integration (docs/api/whatsapp.md)
- ✨ Configuração customizável para chave de localStorage do WhatsApp

### 🔄 Melhorias

- 🔧 **Refatoração**: `lib/uazapi.ts` - TOKEN_KEY agora é uma variável privada (não propriedade do objeto)
  - Antes: `WhatsAppStorage.TOKEN_KEY` (propriedade pública)
  - Depois: `TOKEN_KEY` (constante privada com suporte a env var)
  - Benefício: Configurável por ambiente via `NEXT_PUBLIC_TOKEN_KEY`

### 📚 Documentação

- 📖 Adicionado `docs/api/whatsapp.md` com guia completo de integração
- 📖 Atualizado `docs/README.md` com links para WhatsApp docs
- 📖 Adicionado `CHANGELOG.md` (este arquivo)

### ⚠️ Breaking Changes

- **Potencial**: Se código externo referencia `WhatsAppStorage.TOKEN_KEY`, precisará ser atualizado
  - Buscar: `grep -r "WhatsAppStorage.TOKEN_KEY"`
  - Nenhum uso encontrado no projeto atual ✅

### 🔐 Segurança

- Nenhuma mudança na segurança
- Token continua sendo armazenado no localStorage (mesmo behavior)

---

## [1.0.0] - 2026-01-11

### 🎉 Initial Release

- ✨ Frontend SaaS completo com Next.js 14
- ✨ Autenticação JWT com refresh automático
- ✨ Dark mode nativo com CSS Variables
- ✨ Integração WhatsApp via UAZAPI
- ✨ Painel administrativo multi-tenant
- 📚 Documentação completa (5+ arquivos)

### Componentes

- `Button`, `Input`, `Modal` - Componentes primitivos
- `ThemeToggle` - Alternador light/dark
- `WhatsAppModal` - Interface de conexão WhatsApp
- `LoadingSpinner`, `Skeleton` - Estados de loading

### Contextos

- `AuthContext` - Gerenciar autenticação (login, logout, user data)
- `ThemeContext` - Gerenciar tema (light/dark/system)

### APIs

- `lib/api.ts` - Cliente HTTP centralizado com auto-refresh
- `lib/auth-context.tsx` - Contexto de autenticação
- `lib/theme-context.tsx` - Contexto de tema
- `lib/admin-api.ts` - API para admin (JWT + Legacy token)
- `lib/uazapi.ts` - Cliente WhatsApp (UAZAPI)

### Documentação

- `docs/architecture/overview.md` - Arquitetura geral
- `docs/development/setup.md` - Setup local
- `docs/development/design-system.md` - Design tokens
- `docs/development/state-management.md` - Context API
- `docs/api/client.md` - HTTP client guide
- `docs/components/catalog.md` - Component reference
- `docs/deployment/build.md` - Build & deploy

---

## Formato das Entradas

Futuras entradas devem seguir este formato:

```markdown
## [VERSÃO] - YYYY-MM-DD

### 🎉 Novas Funcionalidades
- ✨ Descrição breve

### 🔄 Melhorias
- 🔧 Descrição breve

### 🐛 Correções
- 🔨 Descrição breve

### 📚 Documentação
- 📖 Arquivo ou seção atualizada

### ⚠️ Breaking Changes
- **O que mudou**: Como migrar

### 🔐 Segurança
- Atualizações de segurança
```

---

## 🔗 Versionamento

Usamos [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0) - Breaking changes
- **MINOR** (1.1.0) - Novas features (backward compatible)
- **PATCH** (1.0.1) - Bugfixes (backward compatible)

---

## 🏷️ Tags de Release

```bash
# Criar tag para versão
git tag -a v1.1.0 -m "Release 1.1.0"
git push origin v1.1.0

# Listar tags
git tag -l
```

---

**Últimas atualizações**: 12 de janeiro de 2026
