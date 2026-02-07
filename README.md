# AVISO: Repositório Privado

Este projeto é um SaaS privado e **NÃO deve ser compartilhado publicamente**. O acesso ao código é restrito a desenvolvedores autorizados pela equipe do Ritmo Agendamento.

Se você recebeu acesso:
- **Não divulgue, compartilhe ou torne público este repositório.**
- Siga as políticas de segurança e privacidade da empresa.
- Dúvidas sobre permissões, onboarding ou uso do código? Fale com o responsável técnico do projeto.

---

# Agendamento SaaS

Sistema de agendamento online multi-tenant com painel administrativo, integração WhatsApp (UAZAPI), tema responsivo e arquitetura moderna com Next.js 15 (App Router).

## Funcionalidades
- Painel do cliente e painel administrativo
- Integração WhatsApp Business via UAZAPI (envio automático de mensagens)
- Configuração automática de Webhook
- Multi-empresa (multi-tenant)
- Responsivo (desktop, tablet, mobile)
- Tema claro/escuro
- Autenticação JWT
- Relatórios, agenda, clientes, serviços, equipe, configurações

## Tecnologias
- Next.js 15 (App Router)
- TypeScript
- CSS Modules + CSS Variables
- UAZAPI (https://lfsystem.uazapi.com)
- JWT Auth

## Instalação

1. **Clone o repositório:**
	```sh
	git clone https://github.com/luisfsill/SaaS-Agendamento.git
	cd SaaS-Agendamento/frontend
	```

2. **Instale as dependências:**
	```sh
	npm ci
	# ou
	yarn install
	```

3. **Configure o ambiente:**
	- Copie `.env.local.example` para `.env.local` e preencha as variáveis:
	  ```env
	  NEXT_PUBLIC_RITMO_API_URL=http://localhost:8000
	  NEXT_PUBLIC_UAZAPI_URL=https://lfsystem.uazapi.com
	  UAZAPI_ADMIN_TOKEN=SEU_TOKEN_ADMIN_UAZAPI
	  NEXT_PUBLIC_UAZAPI_WEBHOOK_URL=https://seu-backend.com/webhook/chatbot
	  ```

4. **Inicie o servidor de desenvolvimento:**
	```sh
	npm run dev
	```
	Acesse: [http://localhost:3000](http://localhost:3000)

## Integração WhatsApp (UAZAPI)
- O webhook é configurado automaticamente ao conectar o WhatsApp.
- Configure a variável `NEXT_PUBLIC_UAZAPI_WEBHOOK_URL` com a URL do seu backend/n8n.
- Para cada tenant, uma instância WhatsApp é criada e gerenciada.

## Scripts principais
- `npm run dev` — inicia o frontend em modo desenvolvimento
- `npm run build` — build de produção
- `npm run start` — inicia o frontend em produção

## Estrutura de Pastas
- `app/` — Páginas e rotas (Next.js App Router)
- `components/` — Componentes reutilizáveis (layout, UI, modais)
- `lib/` — Contextos, hooks e integrações (ex: uazapi.ts)
- `public/` — Assets estáticos

## 📚 Documentação

Documentação completa disponível em `docs/`:
- **[docs/README.md](./docs/README.md)** — Índice e quick start
- **[docs/development/setup.md](./docs/development/setup.md)** — Setup local detalhado
- **[docs/api/whatsapp.md](./docs/api/whatsapp.md)** — Integração WhatsApp (UAZAPI)
- **[docs/architecture/overview.md](./docs/architecture/overview.md)** — Arquitetura geral
- **[CHANGELOG.md](./CHANGELOG.md)** — Histórico de versões
- **[RELEASE_NOTES.md](./RELEASE_NOTES.md)** — Últimas mudanças (v1.1.0)

## Contribuição
Pull requests são bem-vindos! Abra uma issue para discutir melhorias ou bugs.

Consulte [CONTRIBUTING.md](./CONTRIBUTING.md) para guidelines de código e commits.

## Licença
MIT
