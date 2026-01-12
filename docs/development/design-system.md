# 🎨 Design System & CSS Variables

Guia visual e técnico do design system macOS-inspired do Ritmo.

## 🎯 Princípios de Design

### Filosofia
1. **Minimalismo**: Apenas o essencial
2. **Clareza**: Hierarquia visual clara
3. **Acessibilidade**: WCAG 2.1 AA compliance
4. **Dark Mode**: Native support (não é afterthought)
5. **Performance**: CSS Modules, zero runtime overhead

---

## 🌈 Paleta de Cores

### Cores Funcionais

#### Light Mode (`:root`)
```css
/* Primárias */
--color-accent: #007aff;              /* iOS Blue - CTAs, links */
--color-accent-hover: #0066d6;        /* Hover state */
--color-accent-active: #0055b3;       /* Active state */
--color-accent-subtle: rgba(0, 122, 255, 0.1);  /* Backgrounds */

/* Estados */
--color-success: #34c759;             /* Verde - OK, confirmado */
--color-warning: #ff9f0a;             /* Laranja - Aviso */
--color-error: #ff3b30;               /* Vermelho - Erro */
--color-info: #5ac8fa;                /* Ciano - Informação */

/* Backgrounds */
--color-bg-primary: #ffffff;          /* Superfície principal */
--color-bg-secondary: #f5f5f7;        /* Superfície secundária */
--color-bg-elevated: #ffffff;         /* Modals, popovers */
--color-bg-tertiary: #fafafa;         /* Inputs, fields */

/* Texto */
--color-text-primary: #1d1d1f;        /* Texto principal */
--color-text-secondary: #86868b;      /* Texto secondary */
--color-text-tertiary: #aeaeb2;       /* Texto disabled */
--color-text-inverse: #ffffff;        /* Texto em bg dark */

/* Borders & Dividers */
--color-border: rgba(0, 0, 0, 0.1);
--color-border-subtle: rgba(0, 0, 0, 0.06);
--color-divider: rgba(0, 0, 0, 0.08);
```

#### Dark Mode (`[data-theme=\"dark\"]`)
```css
[data-theme=\"dark\"] {
  --color-accent: #0a84ff;            /* Brighter blue */
  --color-accent-hover: #0079e0;
  --color-accent-active: #0066cc;
  --color-accent-subtle: rgba(10, 132, 255, 0.15);
  
  --color-bg-primary: #1c1c1e;
  --color-bg-secondary: #2c2c2e;
  --color-bg-elevated: #3a3a3c;
  --color-bg-tertiary: #242426;
  
  --color-text-primary: #f5f5f7;
  --color-text-secondary: #98989d;
  --color-text-tertiary: #636366;
  
  --color-border: rgba(255, 255, 255, 0.1);
  /* ... */
}
```

### Contrast Ratios
Todas as combinações text + background atendem **WCAG AA (4.5:1)** ou melhor.

---

## 📐 Spacing Scale

```css
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-7:  1.75rem;   /* 28px */
--space-8:  2rem;      /* 32px */
```

**Uso:**
```tsx
<div style={{ padding: 'var(--space-4)', gap: 'var(--space-3)' }}>
  Conteúdo com spacing consistente
</div>
```

---

## 📝 Tipografia

### Font Stack
```css
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### Text Sizes
```css
--text-xs:    0.75rem;  /* 12px */
--text-sm:    0.875rem; /* 14px */
--text-base:  1rem;     /* 16px */
--text-lg:    1.125rem; /* 18px */
--text-xl:    1.25rem;  /* 20px */
--text-2xl:   1.5rem;   /* 24px */
--text-3xl:   1.875rem; /* 30px */
--text-4xl:   2.25rem;  /* 36px */
```

### Font Weights
```css
--font-normal:    400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
```

**Usar para hierarquia:**
```tsx
<h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>
  Título
</h1>
<p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-normal)' }}>
  Body text
</p>
```

---

## 🎭 Border Radius

```css
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   12px;
--radius-xl:   16px;
--radius-2xl:  20px;
--radius-full: 9999px;  /* Pills, badges */
```

**Hierarquia:**
- Buttons: `--radius-lg`
- Inputs: `--radius-md`
- Cards: `--radius-xl`
- Badges/Pills: `--radius-full`

---

## 🌑 Shadows

```css
/* Light shadows (elevação sutil) */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04);
--shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04);
--shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.05);

/* Inner shadow (depressão) */
--shadow-inner: inset 0 1px 2px rgba(0, 0, 0, 0.06);
```

**Uso:**
```css
.card {
  box-shadow: var(--shadow-md);  /* Elevado sutilmente */
}

.card:hover {
  box-shadow: var(--shadow-lg);  /* Mais elevado ao hover */
}
```

---

## ⚡ Transições

```css
--transition-fast:   150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow:   350ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-theme:  300ms ease-in-out;  /* Theme change */
```

**Regras:**
- Interactions rápidas (botões): `--transition-fast`
- Animações UI (modals): `--transition-normal`
- Animações longas: `--transition-slow`
- Mudança de tema: `--transition-theme`

**Exemplo:**
```css
.button {
  background: var(--color-accent);
  transition: all var(--transition-fast);
}

.button:hover {
  background: var(--color-accent-hover);
  transform: translateY(-2px);  /* Lift effect */
}
```

---

## 📦 Z-Index Scale

```css
--z-dropdown:      100;   /* Dropdowns, tooltips */
--z-sticky:        200;   /* Sticky headers */
--z-fixed:         300;   /* Fixed navbars */
--z-modal-backdrop: 400;  /* Modal background */
--z-modal:         500;   /* Modal dialog */
--z-popover:       600;   /* Popovers, menus */
--z-tooltip:       700;   /* Tooltips */
--z-toast:         800;   /* Notifications */
```

---

## 🖼️ Componentes com CSS Variables

### Button
```tsx
// components/ui/Button/Button.tsx
import styles from './Button.module.css';

export function Button({ children, variant = 'primary' }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

```css
/* components/ui/Button/Button.module.css */
.button {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-lg);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.primary {
  background: var(--color-accent);
  color: white;
}

.primary:hover {
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-md);
}

.secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.secondary:hover {
  background: var(--color-bg-tertiary);
}

.danger {
  background: var(--color-error);
  color: white;
}

.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

### Card
```css
.card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border);
}
```

### Input
```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}

.input::placeholder {
  color: var(--color-text-tertiary);
}
```

---

## 🎨 Color Stories

### Feedback States
```css
/* Success */
.success {
  background: var(--color-success-subtle);
  border-color: var(--color-success);
  color: var(--color-success);
}

/* Warning */
.warning {
  background: var(--color-warning-subtle);
  border-color: var(--color-warning);
  color: var(--color-warning);
}

/* Error */
.error {
  background: var(--color-error-subtle);
  border-color: var(--color-error);
  color: var(--color-error);
}

/* Info */
.info {
  background: var(--color-info-subtle);
  border-color: var(--color-info);
  color: var(--color-info);
}
```

---

## 📱 Responsive Adjustments

```css
/* Media query para mobile */
@media (max-width: 480px) {
  --space-6: 1rem;   /* Reduzir spacing */
  --text-2xl: 1.25rem;  /* Reduzir tipografia */
}
```

---

## 🌍 Suporte a Dark Mode

### Automático
```tsx
// lib/theme-context.tsx detecta preferência do SO
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
// Aplica [data-theme=\"dark\"] automaticamente
```

### Manual
```tsx
const { setTheme } = useTheme();
setTheme('dark');  // Força dark mode
setTheme('light'); // Força light mode
setTheme('system'); // Usa preferência do SO
```

---

## ✅ Checklist Design

- [ ] Usar CSS Variables para todas as cores
- [ ] Usar spacing scale consistente
- [ ] Shadows para elevação (não borders)
- [ ] Transições smooth (não abruptas)
- [ ] Testar em light + dark mode
- [ ] Contrast ratio >= WCAG AA
- [ ] Mobile-first responsive
- [ ] Ícones com `lucide-react` (24px padrão)

---

## 🔗 Links

- [CSS Variables MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [WCAG Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)
- [Lucide Icons](https://lucide.dev)

---

**Próximas:** [State Management](./state-management.md) | [Debugging](./debugging.md)
"