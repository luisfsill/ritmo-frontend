# Ritmo Frontend - AI Agent Instructions

Multi-tenant WhatsApp scheduling SaaS built with Next.js 14 (App Router), TypeScript, and UAZAPI integration.

## Architecture Overview

**Multi-Tenant System**: PostgreSQL RLS enforces tenant isolation. JWT tokens contain `tenant_id` - never manipulate tenant context client-side.

**Authentication & API Context**:
- **Dashboard (/dashboard)**: Uses `api.ts`. JWT in localStorage + cookies.
- **Admin (/admin)**: MUST use `admin-api.ts`. Supports dual auth (JWT or legacy `X-Admin-Token`).
- **Middleware**: [middleware.ts](middleware.ts) - manages route protection via `ritmo_access_token` cookie.

**Integration Points**:
- **Backend**: `NEXT_PUBLIC_RITMO_API_URL` (REST API).
- **WhatsApp**: UAZAPI via [lib/uazapi.ts](lib/uazapi.ts) - instance management and auto-webhooks.

## Critical Patterns

### 1. Styling - CSS Modules + CSS Variables
```tsx
import styles from './Component.module.css';
// Access tokens from app/globals.css (macOS-inspired palette)
// Example: var(--color-accent), var(--spacing-md)
```

### 2. TypeScript & Data Models
- **No Enums**: Use string literal union types (e.g., `status: 'scheduled' | 'confirmed'`).
- **Opaque IDs**: Always use `string` (UUID) for IDs to prevent enumeration attacks.
- **Interfaces**: Co-locate with components or features in [app/dashboard/feature/page.tsx](app/dashboard/feature/page.tsx).

### 3. Error Handling - Portuguese & Status 0
```tsx
try {
  await api.get('/path');
} catch (err) {
  const apiError = err as ApiError;
  // Status 0 indicates backend is unreachable
  const msg = apiError.status === 0 
    ? 'O serviço está fora do ar. Contate o suporte.' 
    : apiError.message;
  setError(msg);
}
```

### 4. Forms & Data Fetching
- **Forms**: React Hook Form + Zod (see [components/ui/Input](components/ui/Input)).
- **Fetching**: Manual `useEffect` + `useState` pattern. **Avoid SWR** for write operations/sensitive data.

## Security Requirements

**Read [AGENTS.md](AGENTS.md) first**.
- **PII**: Never log names/phones. Mask in UI (e.g., `+55 11 9****-1234`).
- **XSS**: Prefer `textContent` or React default escaping. Use `DOMPurify` for WhatsApp messages.
- **Tenancy**: Never trust `tenant_id` from client. Backend extracts it from JWT.

## Development Workflow

**Environment**: Define `NEXT_PUBLIC_RITMO_API_URL` and `UAZAPI_ADMIN_TOKEN` in `.env.local`.

**Demo Mode**: 
- Local dev can emulate demo via `localStorage.setItem('ritmo_access_token', 'demo-token')`.
- See [lib/auth-context.tsx](lib/auth-context.tsx) for demo user provisioning.

**Scripts**: `npm run dev` (3000), `npm run build`, `npm run lint`.

## File Organization & Component Checklist

**New Components Checklist**:
1. Create folder in `components/ui/` or `app/dashboard/feature/`.
2. Add `ComponentName.tsx` + `ComponentName.module.css`.
3. Add `index.ts` for clean re-exports.
4. Export interface `ComponentNameProps`.

**Directory Structure**:
- `app/`: Routes and page layouts.
- `components/`: Reusable UI and Layout blocks.
- `lib/`: API clients, Auth/Theme contexts, and UAZAPI logic.

## Path Aliases
```typescript
import { api } from '@/lib/api'; // Always use @/ for absolute imports
```
