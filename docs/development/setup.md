# 🛠️ Development Setup

Guia completo para configurar seu ambiente local de desenvolvimento.

## 📋 Pré-requisitos

- **Node.js**: v18.17+ (verificar com `node -v`)
- **npm**: v9+ (vem com Node.js)
- **Git**: Para clonar e sincronizar
- **Backend rodando**: `localhost:8000` (ver [ritmo-backend/README.md](../../ritmo-backend/README.md))

## 🚀 Instalação Rápida (5 minutos)

### 1. Clone o repositório
```bash
git clone https://github.com/luisfsill/ritmo-frontend.git
cd ritmo-frontend
```

### 2. Instale dependências
```bash
npm ci
```

### 3. Configure variáveis de ambiente
```bash
cp .env.local.example .env.local
```

Edite `.env.local`:
```env
# Backend API
NEXT_PUBLIC_RITMO_API_URL=http://localhost:8000

# WhatsApp (UAZAPI)
NEXT_PUBLIC_UAZAPI_URL=https://lfsystem.uazapi.com
UAZAPI_ADMIN_TOKEN=<seu-token-admin>      # Pedir ao tech lead
NEXT_PUBLIC_UAZAPI_WEBHOOK_URL=http://localhost:3001/webhook

# Analytics (opcional)
NEXT_PUBLIC_GA_ID=UA-XXXXXXXXX-X
```

### 4. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

🎉 Acesse **http://localhost:3000**

---

## 🔧 Detalhamento das Variáveis

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `NEXT_PUBLIC_RITMO_API_URL` | ✅ | URL do backend | `http://localhost:8000` |
| `NEXT_PUBLIC_UAZAPI_URL` | ✅ | URL da API WhatsApp | `https://lfsystem.uazapi.com` |
| `UAZAPI_ADMIN_TOKEN` | ✅ | Token admin UAZAPI | `NnW4QS2PhG1vahBk23Zw...` |
| `NEXT_PUBLIC_UAZAPI_WEBHOOK_URL` | ✅ | URL webhook (recebe eventos) | `http://localhost:3001/webhook` |
| `NEXT_PUBLIC_GA_ID` | ❌ | Google Analytics | `G-XXXXXXXXXX` |

**⚠️ Nota sobre `UAZAPI_ADMIN_TOKEN`:**
- Nunca commit em git
- Solicitar ao responsável do projeto
- Diferentes tokens para dev/staging/prod

---

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                    # Start dev server (http://localhost:3000)
npm run dev:network           # Dev server acessível na rede (0.0.0.0:3000)

# Build
npm run build                 # Build otimizado para produção
npm start                     # Inicia servidor de produção (pós-build)

# Linting
npm run lint                  # ESLint check
npm run lint --fix           # Fixar erros automaticamente
npm run typecheck            # TypeScript sem cache incremental
npm run verify               # lint + typecheck + build

# Análise (em breve)
# npm test                    # Jest + React Testing Library
# npm run test:e2e           # Playwright E2E tests
```

---

## 🐛 Troubleshooting Comum

### ❌ "Cannot find module '@/lib/api'"

**Causa**: TypeScript paths não configurados corretamente

**Solução**:
```bash
npm ci
npm run build  # Regenera tipos
# Ou force reload VSCode: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### ❌ "ECONNREFUSED localhost:8000"

**Causa**: Backend não está rodando

**Solução**:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (em ritmo-backend/)
make localdev
```

### ❌ "Module not found: 'next/image'" ou incompatibilidade de versão do Next.js

**Causa**: Next.js versão incompatível

**Solução**:
```bash
rm -rf node_modules .next tsconfig.tsbuildinfo
npm ci
npm run verify
```
```

### ❌ Tema não aplica (modo dark)

**Causa**: Componentes renderizam antes de ThemeProvider

**Solução**: Verificar que `mounted` é true antes de renderizar theme-specific UI:
```tsx
const { mounted, theme } = useTheme();
if (!mounted) return null;  // Evita mismatch
return <div>{theme === 'dark' ? '🌙' : '☀️'}</div>;
```

### ❌ Login falha com "Service offline"

**Causa**: Variável de ambiente não setada corretamente

**Solução**:
```bash
echo $NEXT_PUBLIC_RITMO_API_URL  # Verificar se está vazio
# Atualizar .env.local e restart
npm run dev
```

---

## 🎯 Workflow Típico

### 1. Criar branch feature
```bash
git checkout -b feat/novo-componente
git branch -u origin/feat/novo-componente
```

### 2. Desenvolver
```bash
npm run dev
# Editar arquivos
# Navegador faz hot-reload automaticamente
```

### 3. Testar em dark mode
```
Ctrl+Shift+I (DevTools)
→ Comando palette (Ctrl+Shift+P)
→ "Render with media feature prefers-color-scheme: dark"
```

### 4. Lint antes de commit
```bash
npm run lint --fix
git add .
```

### 5. Commit com Conventional Commits
```bash
git commit -m "feat: adiciona novo componente Button customizado"
# Formato: <type>(<scope>): <subject>
# Tipos: feat, fix, docs, style, refactor, test, chore
```

### 6. Push e abrir PR
```bash
git push origin feat/novo-componente
# GitHub: Abrir PR contra branch `develop` ou `main`
```

---

## 🎨 Configurando o VSCode

### Extensões Recomendadas
```
ES7+ React/Redux/React-Native snippets (dsznajder.es7-react-js-snippets)
ES Lint (dbaeumer.vscode-eslint)
Prettier - Code formatter (esbenp.prettier-vscode)
TypeScript Vue Plugin (Vue) (Vue.volar)
Thunder Client (rangav.vscode-thunder-client)
```

### Settings (`.vscode/settings.json`)
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  }
}
```

---

## 🧪 Testing (Futuro)

```bash
# Unit tests
npm test -- --watch

# E2E tests (Playwright)
npm run test:e2e

# Coverage report
npm test -- --coverage
```

---

## 🌐 Acessando de Outro Computador

Se quiser acessar o dev server da sua máquina em outro PC:

```bash
npm run dev:network
# Agora disponível em http://<seu-ip>:3000
# (ex: http://192.168.1.100:3000)
```

---

## 📝 Dica de Desenvolvimento

### Hot Reload
Next.js 15 tem hot reload automático:
- Muda em `.tsx`? → Component atualiza
- Muda em `.module.css`? → Estilos atualizam
- Muda em variável de ambiente? → Restart necessário (`npm run dev`)

### React DevTools
```bash
# Instalar extensão Chrome: "React Developer Tools"
# Usar para inspecionar componentes, props, hooks state
```

### Network Tab
```
DevTools → Network
→ Filtrar por "Fetch/XHR"
→ Ver requisições à API, responses, headers
```

---

## 🔗 Links Úteis

- [Next.js Docs](https://nextjs.org/docs)
- [React 18 Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [CSS Variables Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [UAZAPI Docs](https://lfsystem.uazapi.com/docs)

---

**Próximas:** [Design System](./design-system.md) | [State Management](./state-management.md)
