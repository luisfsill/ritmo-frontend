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
// Use CSS Modules for scoped component styles; global styles in app/globals.css
```

### 2. TypeScript & Data Models
- **No Enums**: Use string literal union types (e.g., `status: 'scheduled' | 'confirmed'`).
- **Opaque IDs**: Always use `string` (UUID) for IDs to prevent enumeration attacks.
- **Interfaces**: Co-locate with components or features in `app/dashboard/feature/page.tsx`.
- **Avoid implicit `any`**: Strict TypeScript enforced; always type function parameters.

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
  setError(msg);  // Always use Portuguese for user-facing messages
}
```

### 4. Forms & Data Fetching
- **Forms**: React Hook Form + Zod validation. Validate on client (UX only); backend is authority.
- **Fetching**: Manual `useEffect` + `useState` pattern for critical operations.
- **SWR Note**: Avoid SWR for write operations and sensitive data; use manual fetch for appointments/personal data.
- **Token Refresh**: `api.ts` automatically handles 401 -> refresh token flow.

### 5. Multi-Tenant Context & Authorization
```tsx
// ✅ CORRECT: Use context from auth provider (backend-validated)
const { tenant, user } = useAuth();  // tenant comes from JWT

// ❌ WRONG: Don't construct URLs with tenant_id from state
// The backend validates tenant_id from JWT; never trust client state
```

### 6. API Communication Pattern
```tsx
// lib/api.ts handles:
// 1. JWT token from localStorage/cookies
// 2. Authorization header injection
// 3. CORS/credentials
// 4. 401 refresh token flow
// Just use: await api.get('/endpoint')
// Error handling catches 0 (unreachable) + normal HTTP errors
```

## Security Requirements

**Read `AGENTS.md` in repo root first** - comprehensive security guidelines for both frontend and backend.
- **PII**: Never log names/phones. Mask in UI (e.g., `+55 11 9****-1234`).
- **XSS**: Prefer `textContent` or React default escaping. Use `DOMPurify` for WhatsApp messages.
- **Tenancy**: Never trust `tenant_id` from client. Backend extracts it from JWT.
- **Token Storage**: JWT stored in localStorage; sensitive operations use cookies (backend sets HttpOnly)

## Development Workflow

**Environment**: Define `NEXT_PUBLIC_RITMO_API_URL` and `UAZAPI_ADMIN_TOKEN` in `.env.local`.

**Demo Mode**: 
- Local dev can emulate demo via `localStorage.setItem('ritmo_access_token', 'demo-token')`.
- See `lib/auth-context.tsx` for demo user provisioning.

**Scripts**:
```bash
npm run dev              # Dev server on :3000 (fast refresh)
npm run build           # Optimize build
npm run lint            # ESLint check
npm run dev:network     # Dev on 0.0.0.0 (for external testing)
```

## File Organization & Component Checklist

**New Components Checklist**:
1. Create folder in `components/ui/` or `app/dashboard/feature/`.
2. Add `ComponentName.tsx` + `ComponentName.module.css`.
3. Add `index.ts` for clean re-exports.
4. Export interface `ComponentNameProps`.
5. Use CSS Modules for scoped styles; avoid global styles in components.

**Directory Structure**:
- `app/`: Routes (dashboard, admin, auth pages) following Next.js conventions
- `components/`: Reusable UI components (Input, Button, etc.) and Layout blocks
- `lib/`: API clients (api.ts, admin-api.ts), Auth context, UAZAPI logic, utilities
- `public/`: Static assets

**API Client Pattern** (`lib/api.ts` and `lib/admin-api.ts`):
- Automatically injects `Authorization: Bearer {token}` header
- Handles 401 errors by refreshing tokens
- Status 0 = backend unreachable; other statuses = HTTP errors
- Use for all communication with Ritmo backend

## Key Files to Reference
- `middleware.ts` - Route protection via JWT cookie validation
- `app/globals.css` - Design tokens (colors, spacing, typography)
- `lib/api.ts` - HTTP client with token handling
- `lib/admin-api.ts` - Admin routes (dual auth support)
- `app/auth-context.tsx` - Auth state and user context
