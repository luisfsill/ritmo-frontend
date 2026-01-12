# 📦 Component Catalog

Guia de componentes reutilizáveis com exemplos de uso.

---

## 🎯 Componentes Primitivos

### Button
**Arquivo**: `components/ui/Button/Button.tsx`

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}
```

**Exemplo**:
```tsx
import { Button } from '@/components/ui';

<Button variant=\"primary\" onClick={() => console.log('Clicked')}>
  Click me
</Button>

<Button variant=\"secondary\" size=\"lg\">
  Large button
</Button>

<Button loading disabled>
  Loading...
</Button>
```

---

### Input
**Arquivo**: `components/ui/Input/Input.tsx`

**Props**:
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}
```

**Exemplo**:
```tsx
import { Input } from '@/components/ui';

<Input
  type=\"email\"
  placeholder=\"seu@email.com\"
  label=\"Email\"
  error=\"Email inválido\"
  helperText=\"Use um email válido\"
/>

<Input
  type=\"password\"
  placeholder=\"Sua senha\"
  icon={<Lock size={18} />}
/>
```

---

### Modal
**Arquivo**: `components/ui/Modal/Modal.tsx`

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showCloseButton?: boolean;
}
```

**Exemplo**:
```tsx
import { Modal, ModalFooter } from '@/components/ui';
import { useState } from 'react';

export function MyModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Modal</button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title=\"Confirmar ação\"
        size=\"md\"
      >
        <p>Deseja realmente fazer isso?</p>
        <ModalFooter>
          <button onClick={() => setOpen(false)}>Cancelar</button>
          <button onClick={() => { /* ação */ setOpen(false); }}>Confirmar</button>
        </ModalFooter>
      </Modal>
    </>
  );
}
```

---

### ThemeToggle
**Arquivo**: `components/ui/ThemeToggle/ThemeToggle.tsx`

**Props**: Nenhuma

**Exemplo**:
```tsx
import { ThemeToggle } from '@/components/ui';

export function Header() {
  return (
    <header>
      <h1>Meu App</h1>
      <ThemeToggle />
    </header>
  );
}
```

---

### Loading States
**Arquivo**: `components/ui/Loading/`

#### LoadingSpinner
```tsx
import { LoadingSpinner } from '@/components/ui';

<LoadingSpinner size=\"md\" />
```

#### LoadingOverlay
```tsx
import { LoadingOverlay } from '@/components/ui';

<LoadingOverlay isVisible={isLoading} message=\"Processando...\" />
```

#### Skeleton
```tsx
import { Skeleton } from '@/components/ui';

<div>
  {loading ? (
    <Skeleton count={3} height={20} />
  ) : (
    <Content />
  )}
</div>
```

---

### WhatsAppModal
**Arquivo**: `components/ui/WhatsAppModal/WhatsAppModal.tsx`

**Funcionalidades**:
- Conectar WhatsApp com QR code
- Mostrar status da conexão
- Gerenciar webhook

**Exemplo**:
```tsx
import { WhatsAppModal } from '@/components/ui';
import { useState } from 'react';

export function Settings() {
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  return (
    <>
      <button onClick={() => setWhatsappOpen(true)}>
        Configurar WhatsApp
      </button>
      <WhatsAppModal
        isOpen={whatsappOpen}
        onClose={() => setWhatsappOpen(false)}
      />
    </>
  );
}
```

---

## 🏗️ Component Patterns

### Layout Padrão
```tsx
'use client';  // Se usar hooks do cliente

import styles from './Component.module.css';
import { ComponentProps } from './Component.types';  // (opcional)

interface ComponentProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export function Component({ children, variant = 'primary', onClick }: ComponentProps) {
  return (
    <div className={`${styles.container} ${styles[variant]}`} onClick={onClick}>
      {children}
    </div>
  );
}
```

### Usando CSS Modules
```css
/* Component.module.css */
.container {
  padding: var(--space-4);
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.primary {
  background: var(--color-accent);
  color: white;
}

.secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.container:hover {
  box-shadow: var(--shadow-md);
}
```

### Com Contextos
```tsx
'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

export function ProfileCard() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();

  if (!user) return <p>Não autenticado</p>;

  return (
    <div className={`card ${resolvedTheme}`}>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### Com API Calls
```tsx
'use client';

import { api, ApiError } from '@/lib/api';
import { useState, useEffect } from 'react';

export function DataList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await api.get('/data');
        setData(response);
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message);
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

---

## ✅ Checklist de Componente

Ao criar novo componente:

- [ ] Criar pasta em `components/ui/ComponentName/`
- [ ] Criar `ComponentName.tsx` com lógica
- [ ] Criar `ComponentName.module.css` com estilos
- [ ] Criar `index.ts` para export
- [ ] Adicionar ao `components/ui/index.ts` (barrel export)
- [ ] Usar CSS Variables (não hard-code cores)
- [ ] Testar em light + dark mode
- [ ] TypeScript com tipos explícitos
- [ ] Documentar props principais
- [ ] Adicionar ao catálogo (este arquivo)

---

## 🎨 Common Issues

### Estilo não aplica
**Causa**: Importou `.css` em vez de `.module.css`

**Solução**: Usar `import styles from './Component.module.css'` + `className={styles.class}`

### Componente não renderiza
**Causa**: Faltou `export` na função

**Solução**: `export function Component() { ... }`

### useAuth fora de AuthProvider
**Causa**: Componente não está dentro de `<Providers>`

**Solução**: Verificar que `layout.tsx` root tem `<Providers>{children}</Providers>`

### Tema não muda
**Causa**: `mounted` é false (hydration)

**Solução**: 
```tsx
const { mounted } = useTheme();
if (!mounted) return null;
```

---

**Próximas:** [API Integration](../api/client.md) | [Development Setup](./setup.md)
"