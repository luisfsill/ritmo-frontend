# 🚀 Getting Started - Ritmo Frontend

> 👋 Bem-vindo ao Ritmo Frontend! Este guia vai te colocar operacional em **5 minutos**.

---

## ⚡ Quick Start (5 minutos)

### 1️⃣ Clone & Install
```bash
cd /path/to/ritmo-frontend
npm install
```

### 2️⃣ Configure Variáveis
Crie `.env.local` na raiz:
```env
NEXT_PUBLIC_RITMO_API_URL=http://localhost:8000
```

### 3️⃣ Inicie o Servidor
```bash
npm run dev
```

### 4️⃣ Acesse
Abra [http://localhost:3000](http://localhost:3000)

✅ **Pronto!** Você está rodando o frontend localmente.

---

## 📚 Próximos Passos

### Entender a Arquitetura (10 min)
Leia [docs/architecture/overview.md](./architecture/overview.md) para entender:
- Estrutura de pastas
- Como funciona o App Router
- Fluxo de autenticação
- Integração com API

### Configurar o Dev Environment (5 min)
Siga [docs/development/setup.md](./development/setup.md) para:
- Configurar VSCode
- Entender os scripts
- Resolver problemas comuns

### Aprender sobre Componentes (5 min)
Consulte [docs/components/catalog.md](./components/catalog.md) para:
- Lista de componentes disponíveis
- Como usar cada um
- Padrões de estilo

### Fazer sua Primeira Contribuição
Leia [CONTRIBUTING.md](../CONTRIBUTING.md) para aprender:
- Workflow (branch → commit → PR)
- Code style
- Checklist antes de push

---

## 🎯 Cenários Comuns

### 📱 \"Quero criar um novo componente\"
1. Leia [docs/development/design-system.md](./development/design-system.md) (cores, spacing)
2. Copie um componente similar de [components/](../components/)
3. Siga padrão em [docs/components/catalog.md](./components/catalog.md)
4. Teste em light + dark mode

### 🔌 \"Quero fazer uma requisição API\"
1. Leia [docs/api/client.md](./api/client.md)
2. Use `api.post<ResponseType>('/endpoint', data)`
3. Trate erros com `ApiError`
4. Veja exemplo em [docs/api/client.md](./api/client.md#exemplo-completo)

### 🔐 \"Quero entender autenticação\"
1. Leia [docs/api/authentication.md](./api/authentication.md)
2. Veja como funciona `AuthContext` em [docs/development/state-management.md](./development/state-management.md)
3. Inspecione localStorage em DevTools → Application

### 🌙 \"Quero suportar dark mode\"
1. Use `useTheme()` hook de [docs/development/state-management.md](./development/state-management.md)
2. Teste com `npm run dev:dark`
3. Use CSS Variables em vez de hard-coded colors

### 🚀 \"Quero fazer deploy\"
1. Siga [docs/deployment/build.md](./deployment/build.md)
2. Verifique env vars em [docs/deployment/environment.md](./deployment/environment.md)
3. Execute checklist pré-deploy

### ❌ \"Estou com erro\"
1. Procure em [docs/api/error-handling.md](./api/error-handling.md)
2. Veja troubleshooting em [docs/development/setup.md](./development/setup.md)
3. Consulte seção relevante do [docs/README.md](./README.md)

---

## 🗺️ Mapa da Documentação

```
📚 Documentação
├── 🚀 [README.md](./README.md) - Índice principal
├── 🗺️  [NAVIGATION.md](./NAVIGATION.md) - Este arquivo!
├── 🏗️  architecture/
│   └── [overview.md](./architecture/overview.md) - Arquitetura completa
├── 💻 development/
│   ├── [setup.md](./development/setup.md) - Setup local
│   ├── [design-system.md](./development/design-system.md) - CSS/Design
│   └── [state-management.md](./development/state-management.md) - Context API
├── 📦 components/
│   └── [catalog.md](./components/catalog.md) - UI components
├── 🔌 api/
│   ├── [client.md](./api/client.md) - HTTP Client
│   ├── [authentication.md](./api/authentication.md) - JWT/Login
│   ├── [whatsapp.md](./api/whatsapp.md) - WhatsApp integration
│   └── [error-handling.md](./api/error-handling.md) - Erros
└── 🚀 deployment/
    ├── [build.md](./deployment/build.md) - Build & deploy
    └── [environment.md](./deployment/environment.md) - Env vars
```

---

## 🛠️ Comandos Úteis

### Desenvolvimento
```bash
npm run dev              # Inicia servidor com hot reload
npm run dev:dark        # Inicia em dark mode
npm run dev:network     # Acessa via rede (para teste em celular)
```

### Build & Test
```bash
npm run lint            # Verifica code style
npm run build           # Build para produção
npm start               # Inicia servidor de produção
```

---

## ❓ FAQ Rápido

**P: Qual versão de Node devo usar?**
A: Node 18+ (verifique package.json)

**P: Como funciona autenticação?**
A: JWT tokens. Leia [docs/api/authentication.md](./api/authentication.md)

**P: Como faço requisições para a API?**
A: Use `api.post()`. Veja [docs/api/client.md](./api/client.md)

**P: Como crio um novo componente?**
A: Copie um existente, siga padrão em [docs/components/catalog.md](./components/catalog.md)

**P: Qual port é usado?**
A: 3000 (Backend usa 8000)

**P: Como faço dark mode?**
A: Use `useTheme()`. Veja [docs/development/state-management.md](./development/state-management.md)

**P: Devo usar CSS-in-JS ou CSS Modules?**
A: CSS Modules! Veja [docs/development/design-system.md](./development/design-system.md)

**P: Como debugo um problema?**
A: Leia [docs/development/setup.md](./development/setup.md#troubleshooting)

---

## 📞 Precisa de Ajuda?

1. **Consulte [docs/README.md](./README.md)** para índice completo
2. **Use [docs/NAVIGATION.md](./NAVIGATION.md)** para buscar por tópico
3. **Procure em troubleshooting** do documento relevante
4. **Abra uma issue** no GitHub com detalhes

---

## ✅ Checklist: Você está Pronto Para:

- [ ] Setup local funcionando (`npm run dev`)
- [ ] Entende App Router estrutura
- [ ] Sabe como fazer requisições API
- [ ] Conhece como funciona autenticação
- [ ] Sabe usar componentes existentes
- [ ] Está familiarizado com design system
- [ ] Pode fazer deploy
- [ ] Pode contribuir seguindo CONTRIBUTING.md

Se marcou tudo ☑️, você está pronto!

---

**Bem-vindo ao Ritmo Frontend! 🚀**

_Última atualização: 12 de janeiro de 2026_
"