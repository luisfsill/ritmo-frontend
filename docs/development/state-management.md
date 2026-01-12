# 🧠 State Management & Context Providers

Guia sobre como gerenciar estado global usando Context API + React Hooks.

## 📊 Estado Global

Ritmo usa **Context API** (não Redux/Zustand) para manter simplicidade:

```
App (root)
  ├─ ThemeProvider
  │  ├─ State: theme, resolvedTheme, mounted
  │  └─ Actions: setTheme(), toggleTheme()
  │
  └─ AuthProvider
     ├─ State: user, isLoading, error
     └─ Actions: login(), logout()
```

---

## 🎨 ThemeContext

### Setup
```tsx
// lib/theme-context.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';  // Computed theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  mounted: boolean;  // Para evitar hydration mismatch
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = 'system' }: PropsType) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // 1. Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('ritmo_theme') as Theme | null;
    if (saved) setThemeState(saved);
  }, []);

  // 2. Apply theme to DOM when it changes
  useEffect(() => {
    if (!mounted) return;
    
    const applyTheme = (effectiveTheme: 'light' | 'dark') => {
      document.documentElement.setAttribute('data-theme', effectiveTheme);
      setResolvedTheme(effectiveTheme);
    };

    if (theme === 'system') {
      // Detect OS preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
      
      // Listen for changes
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('ritmo_theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Usando useTheme
```tsx
'use client';

import { useTheme } from '@/lib/theme-context';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme, mounted } = useTheme();

  // Evitar hydration mismatch
  if (!mounted) return null;

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {resolvedTheme === 'light' ? '☀️' : '🌙'}
    </button>
  );
}
```

### CSS Responde Automaticamente
```css
/* app/globals.css */
:root {
  --color-bg-primary: #ffffff;
}

[data-theme='dark'] {
  --color-bg-primary: #1c1c1e;
}

/* Qualquer componente que usa CSS Variables muda automaticamente */
.container {
  background: var(--color-bg-primary);  /* Muda com o tema */
}
```

---

## 🔐 AuthContext

### Setup
```tsx
// lib/auth-context.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setTokens, clearTokens, isAuthenticated, TokenPair, ApiError } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  business_name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Check if already logged in (on mount)
  useEffect(() => {
    if (isAuthenticated()) {
      const userData = getUserFromToken();
      if (userData) setUser(userData);
    }
    setIsLoading(false);
  }, []);

  // 2. Login with email + password
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const tokens = await api.post<TokenPair>(
        '/auth/login',
        { email, password },
        { requiresAuth: false }
      );
      
      setTokens(tokens);
      
      const userData = getUserFromToken();
      if (userData) {
        setUser(userData);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao fazer login');
      throw err;  // Re-throw for component handling
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Logout
  const logout = () => {
    clearTokens();
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Helper: Extract user data from JWT payload
function getUserFromToken(): User | null {
  const token = localStorage.getItem('ritmo_access_token');
  if (!token) return null;

  try {
    const payload = JSON.parse(
      atob(token.split('.')[1])
    );
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.full_name,
      tenant_id: payload.tenant_id,
      business_name: payload.business_name,
    };
  } catch {
    return null;
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Usando useAuth
```tsx
'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await login(
        formData.get('email') as string,
        formData.get('password') as string
      );
      router.push('/dashboard');  // Redirect after login
    } catch (err) {
      // Error already set in context
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name=\"email\" type=\"email\" required />
      <input name=\"password\" type=\"password\" required />
      <button disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </button>
      {error && <p className=\"error\">{error}</p>}
    </form>
  );
}
```

### Protegendo Rotas
```tsx
// app/dashboard/layout.tsx
'use client';

import { useAuth } from '@/lib/auth-context';
import { redirect } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <p>Carregando...</p>;

  if (!isAuthenticated) {
    redirect('/login');
  }

  return <div>{children}</div>;
}
```

---

## 📦 Providers Setup

```tsx
// app/providers.tsx
'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/lib/theme-context';
import { AuthProvider } from '@/lib/auth-context';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme=\"system\">
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang=\"pt-BR\" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

---

## 🔄 Padrões Comuns

### 1. Redirecionar Não Autenticados
```tsx
const { isAuthenticated } = useAuth();

if (!isAuthenticated) {
  return <Navigate to=\"/login\" />;
}
```

### 2. Mostrar dados do usuário
```tsx
const { user } = useAuth();

return (
  <div>
    <h1>Olá, {user?.name}!</h1>
    <p>Tenant: {user?.business_name}</p>
  </div>
);
```

### 3. Logout
```tsx
const { logout } = useAuth();
const router = useRouter();

const handleLogout = () => {
  logout();
  router.push('/login');
};
```

### 4. Condicional por Tenant
```tsx
const { user } = useAuth();

if (user?.tenant_id === 'admin-tenant') {
  return <AdminPanel />;
}
return <UserDashboard />;
```

### 5. Toggle tema
```tsx
const { resolvedTheme, setTheme } = useTheme();

<button onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}>
  Alternar tema
</button>
```

---

## ⚠️ Gotchas (Armadilhas)

### Hydration Mismatch
**Problema**: SSR renderiza componente diferente que client

**Solução**: Usar `mounted` flag
```tsx
const { mounted, theme } = useTheme();
if (!mounted) return null;  // ← Importante!
return <div>{theme}</div>;
```

### Context fora de Provider
**Problema**: \"useAuth must be used within AuthProvider\"

**Solução**: Garantir que componente está dentro de `Providers`
```tsx
// ✅ Correto
<Providers>
  <LoginPage />  {/* Pode usar useAuth */}
</Providers>

// ❌ Errado
<LoginPage />  {/* useAuth falha */}
<Providers>...</Providers>
```

### Estado não persiste ao reload
**Problema**: User é null após refresh da página

**Solução**: Certificar que `localStorage` está sendo usado
```tsx
// lib/auth-context.tsx
useEffect(() => {
  if (isAuthenticated()) {  // ← Checa localStorage
    const userData = getUserFromToken();
    setUser(userData);
  }
}, []);
```

---

## 🧪 Testando Context

```tsx
// __tests__/auth-context.test.tsx (futuro)
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/auth-context';

test('login sets user', async () => {
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  });

  await act(async () => {
    await result.current.login('user@example.com', 'password');
  });

  expect(result.current.user).not.toBeNull();
  expect(result.current.isAuthenticated).toBe(true);
});
```

---

**Próximas:** [API Client](../api/client.md) | [Debugging](./debugging.md)
"