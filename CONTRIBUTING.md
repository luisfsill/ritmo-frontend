# 🤝 Contributing Guide

Guia para contribuir ao projeto Ritmo Frontend de forma consistente e profissional.

---

## 📋 Antes de Começar

- Leia o [README.md](../../README.md)
- Configure seu [Development Environment](./docs/development/setup.md)
- Familiarize-se com a [Arquitetura](./docs/architecture/overview.md)

---

## 🎯 Workflow de Desenvolvimento

### 1. Criar Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Criar feature branch com prefixo
git checkout -b feat/nome-da-feature
# ou: fix/nome-do-bug, docs/documentacao, etc
```

**Convenção de Branch**:
- `feat/*` - Nova funcionalidade
- `fix/*` - Correção de bug
- `refactor/*` - Refatoração de código
- `docs/*` - Documentação
- `style/*` - Formatação, sem lógica
- `chore/*` - Dependências, setup, etc

### 2. Fazer Mudanças

```bash
# Verificar arquivos modificados
git status

# Ver diffs
git diff

# Adicionar arquivos
git add src/
git add docs/
```

### 3. Commit com Conventional Commits

**Formato**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Tipos**:
- `feat` - Nova funcionalidade
- `fix` - Correção de bug
- `docs` - Mudanças na documentação
- `style` - Formatting (não muda lógica)
- `refactor` - Refatoração de código
- `perf` - Melhorias de performance
- `test` - Testes (quando implementados)
- `chore` - Tarefas, dependências

**Exemplos**:

```bash
# Simples
git commit -m \"feat(auth): adiciona login com Google\"

# Com escopo e corpo
git commit -m \"fix(modal): corrige z-index em dark mode

O z-index da modal era menor que backdrop,
fazendo a modal ficar atrás do fundo.

Fix: aumentar --z-modal para 500.\"

# Com breaking change
git commit -m \"feat!: muda estrutura de CSS Variables

BREAKING CHANGE: --color-primary renomeado para --color-accent\"
```

### 4. Push e Abrir Pull Request

```bash
# Push para remote
git push origin feat/nome-da-feature

# Abrir PR no GitHub
# GitHub detecta novo branch e sugere PR
```

**Template de PR**:

```markdown
## Descrição
Breve descrição do que foi feito.

## Tipo de Mudança
- [ ] Nova funcionalidade (feat)
- [ ] Correção de bug (fix)
- [ ] Breaking change (feat!)

## Checklist
- [ ] Código segue style guide
- [ ] Testei em light + dark mode
- [ ] Sem console warnings/errors
- [ ] Responsivo (mobile/tablet/desktop)
- [ ] Documentação atualizada (se necessário)

## Screenshots (se aplicável)
[Adicionar screenshots]

## Relacionado
Fix #123
Related to #456
```

### 5. Code Review & Merge

Após aprovação do reviewer:

```bash
# Localmente, fazer rebase no main
git fetch origin
git rebase origin/main

# Ou merge via GitHub UI (mais seguro)
# GitHub → \"Merge pull request\" → \"Squash and merge\"
```

---

## ✅ Code Style

### TypeScript

```typescript
// ✅ Bom
interface UserProps {
  id: string;
  name: string;
  email: string;
}

export function UserCard({ id, name, email }: UserProps) {
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}

// ❌ Ruim
function UserCard(props: any) {
  const { user } = props;
  return <div>{user.name}</div>;
}
```

### Components

```tsx
// ✅ Bom: Componente funcional com tipos explícitos
'use client';

import { useState } from 'react';
import styles from './Component.module.css';

interface ComponentProps {
  title: string;
  onClick: () => void;
}

export function Component({ title, onClick }: ComponentProps) {
  const [open, setOpen] = useState(false);
  return <div className={styles.container}>{title}</div>;
}

// ❌ Ruim: Props sem tipos, lógica complexa sem separação
function Component(props) {
  const [open, setOpen] = useState(false);
  // 50 linhas de lógica misturada com JSX
  return <div>{props.title}</div>;
}
```

### CSS Modules

```css
/* ✅ Bom: Usar CSS Variables, nomes descritivos */
.container {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.container:hover {
  background: var(--color-bg-secondary);
  box-shadow: var(--shadow-md);
}

/* ❌ Ruim: Hard-coded colors, nomes genéricos */
.box {
  background: #ffffff;
  padding: 16px;
  font-size: 14px;
}

.text {
  color: #333333;
}
```

### API Calls

```tsx
// ✅ Bom: Error handling, types explícitos
import { api, ApiError } from '@/lib/api';

const response = await api.post<UserData>('/users', userData);
try {
  const data = await api.get<User[]>('/users');
  setUsers(data);
} catch (err) {
  const error = err as ApiError;
  showError(error.message);
}

// ❌ Ruim: Sem error handling, sem tipos
const response = fetch('/api/users');
const data = await response.json();
setUsers(data);
```

---

## 🧪 Testing (Futuro)

Quando testes forem implementados:

```bash
# Rodar testes
npm test

# Com coverage
npm test -- --coverage

# E2E
npm run test:e2e
```

**Padrão de teste**:
```typescript
describe('Component', () => {
  it('deve renderizar com props', () => {
    render(<Component title=\"Test\" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('deve chamar onClick ao clicar', () => {
    const onClick = jest.fn();
    render(<Component onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

---

## 🔍 Code Review Checklist

Antes de fazer PR:

- [ ] Código segue TypeScript types
- [ ] Sem `any` types (use generics se necessário)
- [ ] Nomes de variáveis descritivos
- [ ] Funções fazem UMA coisa
- [ ] Sem código duplicado
- [ ] Comentários apenas para \"por quê\", não \"o quê\"
- [ ] `npm run lint` passa
- [ ] Testado em light + dark mode
- [ ] Testado em mobile (DevTools)
- [ ] Sem console.log ou debugger deixados
- [ ] Sem comentários de código

```bash
# Verificar antes de push
npm run lint
npm run build
npm start  # Testar localmente
```

---

## 📚 Documentação

Updates de documentação são encorajadas!

**Ao adicionar feature**:
- [ ] Atualizar [docs/](./docs/)
- [ ] Adicionar exemplo de uso
- [ ] Documentar props/interfaces
- [ ] Mencionar breaking changes

```bash
# Exemplo: adicionar novo componente
feat(components): adiciona novo component Button

Doc:
- Adiciona Button ao catálogo em docs/components/catalog.md
- Documenta props e exemplos
```

---

## 🐛 Reportando Bugs

**Criar Issue com template**:

```markdown
## Descrição
Descrever o bug de forma clara.

## Passos para Reproduzir
1. Fazer login
2. Ir para /dashboard
3. Clicar em \"Novo\"
4. Bug ocorre

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Real
O que realmente acontece.

## Informações
- Browser: Chrome 120
- OS: macOS 14
- Node: 18.17

## Screenshots
[Adicionar se possível]

## Logs
```
Erro do console aqui
```
```

---

## 💡 Feature Requests

```markdown
## Descrição
Descrever o que deveria ser adicionado.

## Caso de Uso
Por que isso seria útil?

## Solução Proposta
Como implementar (opcional).

## Alternativas
Outras formas de resolver (opcional).
```

---

## 🚫 Commits NÃO Permitidos

```bash
# ❌ Sem mensagem
git commit -m \".\"
git commit -m \"fix\"

# ❌ Sem escopo
git commit -m \"feat: adiciona coisa\"

# ❌ UpperCase no início
git commit -m \"Feat: adiciona coisa\"

# ❌ Credentials expostas
git add .env.local

# ❌ Console.logs
console.log('debug');

# ❌ Código comentado
// const oldFunction = () => {...}
```

---

## 📞 Precisa de Ajuda?

- Dúvidas sobre setup? → [Development Setup](./docs/development/setup.md)
- Dúvidas sobre arquitetura? → [Architecture](./docs/architecture/overview.md)
- Dúvidas sobre components? → [Component Catalog](./docs/components/catalog.md)
- Problema com API? → [API Client Guide](./docs/api/client.md)
- Abrir issue no GitHub

---

## 📋 Checklist Final

Antes de fazer PR:

```bash
# 1. Verificar linting
npm run lint

# 2. Fazer build
npm run build

# 3. Testar localmente
npm start

# 4. Testar em mobile
# DevTools → Toggle device toolbar (Ctrl+Shift+M)

# 5. Testar dark mode
# DevTools → Render with media feature prefers-color-scheme: dark

# 6. Verificar git status
git status

# 7. Fazer commits com Conventional Commits
git commit -m \"feat(scope): descrição\"

# 8. Push
git push origin feat/nome-da-feature
```

---

**Obrigado por contribuir ao Ritmo! 🎉**

Sua contribuição ajuda a tornar o projeto melhor para todos.
"