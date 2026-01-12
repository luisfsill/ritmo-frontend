# 📚 Ritmo Frontend - Documentação Completa

Bem-vindo à documentação técnica do **Ritmo Frontend**, um SaaS moderno de agendamento com IA, construído com Next.js 14, TypeScript e design system inovador.

## 🗂️ Índice de Navegação

| Seção | Descrição | Para quem |
|-------|-----------|-----------|
| **[Arquitetura](./architecture/)** | App Router, estrutura de pastas, fluxo de dados | Arquitetos, senior engineers |
| **[Desenvolvimento](./development/)** | Setup local, padrões, CSS Variables, debugging | Desenvolvedores frontend |
| **[Componentes](./components/)** | Catálogo de UI, exemplos, patterns reutilizáveis | Frontend developers, designers |
| **[API & Integração](./api/)** | Cliente HTTP, auth JWT, endpoints backend, UAZAPI | Full-stack, integrações |
| **[Deployment](./deployment/)** | Build, variáveis, CI/CD, produção | DevOps, leads |

---

## 🚀 Quick Links

### ⚡ Comece Rapidinho
- **Nunca usou o projeto?** → [Development Guide - Setup Rápido](./development/setup.md)
- **Quer entender a estrutura?** → [Architecture Overview](./architecture/overview.md)
- **Precisa usar a API?** → [API Client Guide](./api/client.md)

### 🎨 Desenvolvimento
- [Design System & CSS Variables](./development/design-system.md)
- [Padrões de Componentes](./components/patterns.md)
- [Estado & Context Providers](./development/state-management.md)
- [Debugging & Troubleshooting](./development/debugging.md)

### 🔌 Integrações
- [Autenticação JWT](./api/authentication.md)
- [WhatsApp Integration (UAZAPI)](./api/whatsapp.md)
- [Error Handling](./api/error-handling.md)

### 🏗️ Infraestrutura
- [Build & Deploy](./deployment/build.md)
- [Environment Variables](./deployment/environment.md)
- [CI/CD Pipeline](./deployment/cicd.md)

---

## 📋 Estrutura do Repositório

```
ritmo-frontend/
├── app/                      # Next.js 14 App Router
│   ├── (pages raíz)         # Landing, login, register, demo
│   ├── admin/               # Área de administrador
│   ├── dashboard/           # Painel do usuário
│   ├── globals.css          # Design tokens CSS
│   ├── layout.tsx           # Root layout com providers
│   └── providers.tsx        # Theme + Auth context
├── components/              # Componentes React reutilizáveis
│   └── ui/                  # Componentes primitivos
├── lib/                     # Lógica compartilhada
│   ├── api.ts              # Cliente HTTP
│   ├── auth-context.tsx    # Context de autenticação
│   ├── theme-context.tsx   # Context de tema
│   ├── admin-api.ts        # API para admin
│   └── uazapi.ts           # Cliente UAZAPI (WhatsApp)
├── docs/                    # Esta documentação
└── public/                  # Assets estáticos
```

---

## 🎯 Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Framework** | Next.js | 14.2.21 |
| **Runtime** | React | 18.3.1 |
| **Linguagem** | TypeScript | 5.x |
| **Styling** | CSS Modules + CSS Variables | Native |
| **Forms** | React Hook Form + Zod | Latest |
| **Icons** | Lucide React | 0.468.0 |
| **HTTP Client** | Fetch API | Native |
| **State** | Context API + React Hooks | Native |

---

## 🔐 Autenticação & Multi-Tenancy

### Fluxo de Auth
1. **Login** → `loginWithCredentials()` em `lib/auth-context.tsx`
2. **Tokens JWT** armazenados em `localStorage` + cookies
3. **Auto-refresh** em requisições 401
4. **Tenant Isolation** via `tenant_id` no JWT payload

### Dois Modos de Autenticação
- **JWT** (Padrão): Email + Password → `access_token` + `refresh_token`
- **Legacy Token** (Admin): `X-Admin-Token` header (suporte retrospectivo)

---

## 🎨 Design System

Ritmo segue design tokens macOS-inspired com suporte full dark mode:

```css
/* Light mode (default) */
:root {
  --color-accent: #007aff;      /* iOS Blue */
  --color-success: #34c759;     /* iOS Green */
  --color-warning: #ff9f0a;     /* iOS Orange */
  --color-error: #ff3b30;       /* iOS Red */
}

/* Dark mode (data-theme="dark") */
[data-theme="dark"] {
  --color-accent: #0a84ff;      /* Brighter blue for contrast */
}
```

**CSS Variables disponíveis:**
- Colors: `--color-bg-*`, `--color-text-*`, `--color-*` (100+ tokens)
- Spacing: `--space-1` até `--space-8`
- Tipografia: `--text-xs` até `--text-4xl`
- Transições: `--transition-fast`, `--transition-normal`, `--transition-slow`
- Shadows: `--shadow-xs` até `--shadow-xl`
- Z-index scale: `--z-dropdown` até `--z-toast`

**Uso em componentes:**
```tsx
<div style={{ color: 'var(--color-text-primary)' }}>
  Texto com cor dinâmica (segue tema)
</div>
```

---

## 🔄 Fluxo de Dados

```
User Input
    ↓
React Component
    ↓
Event Handler (onClick, onChange, onSubmit)
    ↓
API Client (lib/api.ts)
    ↓
Backend (ritmo-backend)
    ↓
Response + Token Refresh (se 401)
    ↓
Context Update (AuthContext, ThemeContext)
    ↓
Component Re-render
```

---

## 📦 Convenções de Código

### Nomes de Arquivos
- **Componentes**: PascalCase (`Button.tsx`, `ThemeToggle.tsx`)
- **Hooks customizados**: camelCase com prefixo `use` (`useAuth.ts`)
- **Utilitários**: camelCase (`formatDate.ts`, `validateEmail.ts`)
- **Estilos**: `.module.css` (CSS Modules)

### Estrutura de Componente
```tsx
'use client';  // Marcar se usar hooks do cliente

import { useState } from 'react';
import styles from './Component.module.css';

interface ComponentProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function Component({ children, onClick }: ComponentProps) {
  const [state, setState] = useState(false);
  
  return <div className={styles.container}>{children}</div>;
}
```

### Estilos em CSS Modules
```css
.container {
  display: flex;
  gap: var(--space-4);
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.container:hover {
  background-color: var(--color-bg-secondary);
  box-shadow: var(--shadow-md);
}
```

---

## ✅ Checklist para Contribuidores

- [ ] Li [Development Setup](./development/setup.md)
- [ ] Entendi [Padrões de Componentes](./components/patterns.md)
- [ ] Vou usar [CSS Variables](./development/design-system.md)
- [ ] Vou testar em light + dark mode
- [ ] Vou checar [Error Handling](./api/error-handling.md)
- [ ] Vou fazer commit em [Conventional Commits](../CONTRIBUTING.md)

---

## 🐛 Precisa de Ajuda?

| Problema | Solução |
|----------|---------|
| **Não consegue fazer login** | [Auth Troubleshooting](./api/authentication.md#troubleshooting) |
| **Componente não renderiza** | [Component Patterns](./components/patterns.md#common-issues) |
| **Requisição falha com 401** | [Token Refresh Logic](./api/client.md#token-refresh) |
| **Tema não muda ao alternar** | [Theme Context](./development/state-management.md#theme) |
| **UAZAPI não conecta** | [WhatsApp Integration](./api/whatsapp.md#troubleshooting) |

---

## 📞 Contato & Suporte

- **Dúvidas técnicas?** → Abra uma issue no repositório
- **Bug encontrado?** → [Bug Report Template](../CONTRIBUTING.md#bug-reports)
- **Feature request?** → [Feature Request Template](../CONTRIBUTING.md#feature-requests)

---

**Última atualização:** 12 de janeiro de 2026  
**Documentação versão:** 1.0.0
