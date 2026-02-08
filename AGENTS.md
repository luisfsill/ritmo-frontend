# Frontend Security - AI Agent Instructions

**Security-first guidelines for AI agents developing frontend code for Ritmo's multi-tenant scheduling system.**

## Critical Security Principles

### 1. Never Trust Client-Side Data
All validation and authorization MUST happen server-side. Frontend validation is only for UX - never for security.

```javascript
// ❌ WRONG - Client-side tenant switching
localStorage.setItem('tenant_id', userInput);  // NEVER DO THIS

// ✅ CORRECT - Tenant comes from server JWT
const token = getAuthToken();
// Backend extracts tenant_id from verified JWT token
```

### 2. Multi-Tenancy Security (Defense in Depth)
- **Never expose tenant_id in URLs** unless necessary - prefer JWT-based identification
- **Never allow tenant_id manipulation** in forms, localStorage, or client state
- **Always validate** that API responses match expected tenant context
- **Use opaque identifiers** (UUIDs) instead of sequential IDs in URLs

```javascript
// ❌ WRONG - Sequential IDs expose data
GET /api/v1/appointments/1  // Easy to enumerate

// ✅ CORRECT - UUIDs prevent enumeration
GET /api/v1/appointments/550e8400-e29b-41d4-a716-446655440000
```

### 3. Authentication & Authorization

#### Token Storage
```javascript
// ❌ WRONG - XSS-vulnerable
localStorage.setItem('token', jwt);  // Accessible to any script

// ✅ CORRECT - HttpOnly cookies (backend sets)
// No JavaScript access, sent automatically with requests
// Backend: Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict
```

#### Token Handling
```javascript
// ✅ CORRECT - Authorization header pattern
async function apiCall(endpoint, options = {}) {
    const token = getSecureToken();  // From memory or secure storage
    return fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        credentials: 'include'  // Include HttpOnly cookies
    });
}
```

#### Session Management
- **Short-lived access tokens** (60 min default, see `ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Refresh tokens** in HttpOnly cookies (30 days default)
- **Logout** must invalidate tokens server-side AND clear client state
- **Idle timeout** should redirect to login after inactivity

### 4. Personal Identifiable Information (PII)

#### Never Log PII
```javascript
// ❌ WRONG
console.log('User data:', { name, phone, email });

// ✅ CORRECT - Redact or use IDs only
console.log('User updated:', { user_id: userId });
```

#### Minimize PII Exposure
```javascript
// ❌ WRONG - Exposing full phone in UI unnecessarily
<div>Client: {client.phone}</div>  // +55 11 98765-4321

// ✅ CORRECT - Mask sensitive data
<div>Client: {maskPhone(client.phone)}</div>  // +55 11 9****-4321
```

#### Secure PII Transmission
- **Always use HTTPS** in production (`ENVIRONMENT=production`)
- **Never embed PII in URLs** (query params, path params)
- **Use POST for sensitive data** instead of GET

```javascript
// ❌ WRONG - PII in URL (logged in access logs)
GET /api/v1/search?phone=5511987654321&name=João

// ✅ CORRECT - PII in POST body
POST /api/v1/clients/search
Body: { "phone": "5511987654321", "name": "João" }
```

### 5. Cross-Site Scripting (XSS) Prevention

#### Always Escape User Input
```javascript
// ❌ WRONG - Direct HTML insertion
element.innerHTML = userInput;  // XSS vulnerability

// ✅ CORRECT - Use textContent or framework escaping
element.textContent = userInput;  // Escaped automatically

// ✅ React automatically escapes
<div>{userMessage}</div>  // Safe with JSX
```

#### Content Security Policy (CSP)
Backend should set CSP headers. Frontend must not violate them:
```javascript
// ❌ WRONG - Inline scripts (CSP violation)
<button onclick="doSomething()">Click</button>

// ✅ CORRECT - Event listeners in JS
button.addEventListener('click', doSomething);
```

#### Sanitize Rich Content
If displaying user-generated HTML (e.g., WhatsApp formatted messages):
```javascript
import DOMPurify from 'dompurify';

// ✅ CORRECT - Sanitize before rendering
const cleanHTML = DOMPurify.sanitize(userHTML, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: []
});
```

### 6. Cross-Site Request Forgery (CSRF)

#### SameSite Cookies
Backend sets `SameSite=Strict` or `SameSite=Lax` on cookies. Frontend implications:
- **Don't rely on cookies alone** for state-changing operations
- **Include CSRF tokens** in forms if required by backend

#### CORS Configuration
```javascript
// Frontend must respect CORS
// Backend sets: Access-Control-Allow-Origin (from CORS_ORIGINS config)
// Frontend cannot bypass CORS - don't try proxy workarounds
```

### 7. Secure Communication Patterns

#### API Error Handling (Security-Aware)
```javascript
// ❌ WRONG - Exposing internal errors
catch (error) {
    alert(error.message);  // May contain stack traces, DB errors
}

// ✅ CORRECT - Generic user messages, log details securely
catch (error) {
    console.error('API error', { endpoint, status: error.status });
    showToast('Something went wrong. Please try again.');
}
```

#### Rate Limiting Awareness
- Backend enforces rate limits; frontend should handle `429 Too Many Requests`
- **Don't retry aggressively** - respect `Retry-After` header
- **Debounce user actions** (search, autocomplete) to avoid hitting limits

```javascript
// ✅ CORRECT - Debounced search
const debouncedSearch = debounce(async (query) => {
    try {
        const results = await apiCall(`/search?q=${encodeURIComponent(query)}`);
        setResults(results);
    } catch (error) {
        if (error.status === 429) {
            showToast('Too many requests. Please wait a moment.');
        }
    }
}, 300);
```

### 8. WhatsApp Integration Security

#### Webhook Validation
If frontend displays webhook data:
- **Assume webhooks are untrusted** until backend validates signature
- **Never process unverified webhooks** in UI
- Backend validates Uazapi webhooks with tenant `connection` token (query param) or WhatsApp API signature

#### Message Content
```javascript
// ❌ WRONG - Direct rendering of WhatsApp messages
<div>{whatsappMessage.body}</div>  // Could contain XSS

// ✅ CORRECT - Sanitize and escape
<div>{escapeHtml(whatsappMessage.body)}</div>
```

#### Media Handling
```javascript
// ❌ WRONG - Direct media URL display
<img src={message.media_url} />  // Unverified external URL

// ✅ CORRECT - Proxy through backend or validate
<img src={`/api/v1/media/${message.media_id}`} />  // Backend validates
```

### 9. Environment Variables & Secrets

#### Never Expose Secrets
```javascript
// ❌ WRONG - Secrets in frontend code
const API_KEY = 'sk-proj-abc123...';  // NEVER DO THIS

// ✅ CORRECT - Public config only
const API_BASE_URL = import.meta.env.VITE_API_URL;  // Public URL only
// Secrets stay server-side
```

#### Build-Time Configuration
```bash
# .env (NOT committed to git)
VITE_API_URL=http://localhost:8000
VITE_ENVIRONMENT=development

# ❌ NEVER include:
# VITE_SECRET_KEY=...
# VITE_DATABASE_URL=...
# VITE_OPENAI_API_KEY=...
```

### 10. Client-Side Storage Security

#### localStorage/sessionStorage
```javascript
// ❌ WRONG - Sensitive data in localStorage
localStorage.setItem('jwt', token);  // XSS accessible

// ✅ CORRECT - Non-sensitive UI state only
localStorage.setItem('theme', 'dark');
localStorage.setItem('language', 'pt-BR');
```

#### IndexedDB
- Use only for **non-sensitive caching** (e.g., appointment list for offline view)
- **Encrypt sensitive data** if storage is required (use Web Crypto API)
- **Clear on logout** to prevent data leakage

### 11. Dependency Security

#### Regular Updates
```bash
# Check for vulnerabilities
npm audit
npm audit fix

# Keep dependencies updated
npm outdated
npm update
```

#### Minimize Dependencies
- **Audit before adding** new packages (check npm security, popularity, maintenance)
- **Prefer built-in APIs** over libraries when possible
- **Pin versions** in package.json to avoid supply chain attacks

### 12. Webchat-Specific Security

#### Input Validation
```javascript
// ✅ CORRECT - Validate before sending
function sendMessage(text) {
    if (!text || text.trim().length === 0) return;
    if (text.length > 4000) {  // Match backend limit
        showToast('Message too long');
        return;
    }
    apiCall('/chat/message', {
        method: 'POST',
        body: JSON.stringify({ text: text.trim() })
    });
}
```

#### Connection Security
```javascript
// ✅ CORRECT - Secure WebSocket (if using)
const ws = new WebSocket('wss://api.ritmo.com/ws');  // WSS, not WS
ws.onopen = () => {
    // Authenticate immediately
    ws.send(JSON.stringify({ type: 'auth', token: getSecureToken() }));
};
```

## Security Checklist for Every PR

Before submitting code, verify:

- [ ] **No secrets** in code or environment variables
- [ ] **All user input** is escaped/sanitized before rendering
- [ ] **No PII** in console logs, URLs, or localStorage
- [ ] **Authentication required** for sensitive operations
- [ ] **HTTPS only** for API calls (no mixed content)
- [ ] **Error messages** are user-friendly (no stack traces/internals)
- [ ] **Dependencies** have no high/critical vulnerabilities (`npm audit`)
- [ ] **Rate limiting** is handled gracefully (429 errors)
- [ ] **Tenant isolation** is respected (no hardcoded tenant IDs)
- [ ] **Session timeout** redirects to login after inactivity

## Project-Specific Security Context

### Backend Security Relies On
- **PostgreSQL RLS** - Tenant isolation at database level
- **JWT tokens** - Contain tenant_id claim; validated server-side
- **Redis streams** - Agent message queue; not exposed to frontend
- **Rate limiting** - API endpoints throttled per tenant

### Frontend Must Not
- **Bypass authentication** - All API calls require valid JWT
- **Manipulate tenant context** - Tenant determined by backend from JWT
- **Cache sensitive data** - Use in-memory state; clear on logout
- **Trust client state** - Server is source of truth for appointments, availability, etc.

## Common Vulnerabilities in This Project

### 1. Appointment Enumeration
```javascript
// ❌ WRONG - Sequential iteration
for (let id = 1; id < 1000; id++) {
    fetch(`/api/v1/appointments/${id}`);  // Tenant isolation bypass attempt
}
// Backend RLS prevents this, but don't try it!
```

### 2. Client Search Leakage
```javascript
// ❌ WRONG - Search without tenant context
fetch(`/api/v1/clients?phone=${phone}`);  // Could leak cross-tenant
// Backend enforces RLS, but frontend should validate response
```

### 3. Calendar Link Spoofing
```javascript
// ❌ WRONG - User-provided calendar URL
<a href={userInput}>Add to calendar</a>  // XSS vector

// ✅ CORRECT - Only backend-generated URLs
<a href={appointment.calendar_url}>Add to calendar</a>  // From GET /appointments/{id}/calendar.ics
```

## Resources

- [OWASP Frontend Security](https://owasp.org/www-project-web-security-testing-guide/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [SameSite Cookies](https://web.dev/samesite-cookies-explained/)
- Backend multi-tenancy: [docs/architecture/MULTITENANCY.md](docs/architecture/MULTITENANCY.md)
- API authentication: [docs/reference/API.md](docs/reference/API.md)

---

**Remember**: Security is not just about preventing attacks - it's about protecting user data and maintaining trust. Every line of frontend code must assume hostile input and treat user data as sacred.
