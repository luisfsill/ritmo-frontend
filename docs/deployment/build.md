# 🚀 Build & Deployment

Guia de build, otimização e deploy para produção.

---

## 📦 Build para Produção

### 1. Build Local
```bash
# Instalar dependências (se necessário)
npm install

# Fazer build
npm run build

# Resultado: pasta .next/ com app otimizado
```

**Tempo típico**: 1-2 minutos

### 2. Testar Build
```bash
# Iniciar servidor de produção
npm start

# Acesse http://localhost:3000
# Verificar performance, funcionalidades críticas
```

### 3. Checklist Pré-Deploy
- [ ] `npm run lint` sem erros
- [ ] Todas as env vars setadas
- [ ] Backend acessível
- [ ] UAZAPI conectando
- [ ] Login funciona
- [ ] Responsive (mobile/tablet/desktop)
- [ ] Dark mode funciona
- [ ] Sem console errors/warnings

---

## 🌍 Environment Variables

### Arquivo `.env.local`
```env
# Obrigatórias
NEXT_PUBLIC_RITMO_API_URL=http://localhost:8000
NEXT_PUBLIC_UAZAPI_URL=https://lfsystem.uazapi.com
UAZAPI_ADMIN_TOKEN=seu-token-aqui
NEXT_PUBLIC_UAZAPI_WEBHOOK_URL=http://localhost:3001/webhook

# Opcionais
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ENVIRONMENT=development
```

### Por Ambiente

**Development**
```env
NEXT_PUBLIC_RITMO_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
```

**Staging**
```env
NEXT_PUBLIC_RITMO_API_URL=https://api-staging.ritmo.com
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_GA_ID=G-STAGING-ID
```

**Production**
```env
NEXT_PUBLIC_RITMO_API_URL=https://api.ritmo.com
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_GA_ID=G-PROD-ID
```

### Variáveis Públicas vs Privadas

| Variável | Escopo | Uso |
|----------|--------|-----|
| `NEXT_PUBLIC_*` | Browser + Servidor | URLs, IDs públicos |
| Sem prefixo | Servidor apenas | Tokens secretos, chaves API privadas |

**⚠️ NUNCA commit .env.local em git**
```bash
# .gitignore deve ter:
.env.local
.env*.local
```

---

## 🐳 Docker (Futuro)

```dockerfile
# Dockerfile (próxima versão)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD [\"npm\", \"start\"]
```

```bash
# Build imagem
docker build -t ritmo-frontend:1.0.0 .

# Rodar container
docker run -p 3000:3000 -e NEXT_PUBLIC_RITMO_API_URL=... ritmo-frontend:1.0.0
```

---

## 📊 Performance Tips

### 1. Code Splitting
Next.js 14 faz automático:
- Cada página = bundle separado
- Lazy loading de componentes dinâmicos

### 2. Image Optimization
Usar `next/image` (não `<img>`):
```tsx
import Image from 'next/image';

<Image
  src=\"/logo.png\"
  alt=\"Logo\"
  width={200}
  height={200}
  priority  // Para above-the-fold
/>
```

### 3. Font Optimization
System fonts (não Google Fonts pesadas):
```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### 4. CSS Modules
Já usado no projeto - sem style injection overhead.

### 5. Prefetch Routes
Next.js prefetch automaticamente links visíveis:
```tsx
<Link href=\"/dashboard\">  {/* Prefetch automático */}
  Dashboard
</Link>
```

---

## 🔐 Security Checklist

- [ ] HTTPS em produção (forçar em `next.config.js`)
- [ ] Headers de segurança (CSP, X-Frame-Options, etc)
- [ ] Validação de tokens JWT (backend)
- [ ] CORS configurado corretamente
- [ ] Sem credentials expostas em .env.local
- [ ] Dependencies sem vulnerabilidades (`npm audit`)
- [ ] Rate limiting no backend
- [ ] Input sanitization (Zod no frontend)

---

## 🚀 Deployment Providers

### Vercel (Recomendado para Next.js)

1. **Conectar repositório**
```bash
# Fazer login
npm i -g vercel
vercel login

# Deploy
vercel
```

2. **Configurar env vars**
```
Vercel Dashboard → Settings → Environment Variables
Adicionar:
- NEXT_PUBLIC_RITMO_API_URL
- NEXT_PUBLIC_UAZAPI_URL
- UAZAPI_ADMIN_TOKEN
```

3. **Deploy automático**
```
Qualquer push para main → Deploy automático
```

### AWS / GCP / DigitalOcean

```bash
# Build
npm run build

# Deploy pasta .next/ como Node app
# Certificar que env vars estão setadas no servidor
```

---

## 📈 Monitoring

### Web Vitals (Google Analytics)
```tsx
// lib/analytics.ts (setup básico)
if (typeof window !== 'undefined') {
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA_ID);
}
```

### Error Tracking (Futuro: Sentry)
```typescript
import * as Sentry from \"@sentry/nextjs\";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
});
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml (futuro)
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run lint
      - run: npm run build
      
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 📋 Release Checklist

1. **Preparação**
   - [ ] Feature branch testada localmente
   - [ ] Code review aprovado
   - [ ] Testes passam (`npm run lint`)

2. **Build**
   - [ ] `npm run build` sem erros
   - [ ] `npm start` funciona
   - [ ] Sem warnings no console

3. **Deploy**
   - [ ] Env vars corretas em produção
   - [ ] Backend acessível
   - [ ] UAZAPI conectando
   - [ ] Smoke tests (login, dashboard, etc)

4. **Post-Deploy**
   - [ ] Monitorar error logs
   - [ ] Verificar Google Analytics
   - [ ] Estar disponível para rollback rápido

---

## 🔄 Rollback

```bash
# Se deploy falhar, reverter para versão anterior
vercel rollback

# Ou redeploy versão anterior
vercel --prod --target=production
```

---

**Próximas:** [Setup Development](../development/setup.md) | [Architecture](../architecture/overview.md)
"