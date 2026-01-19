# Requisitos de Backend para Funcionalidades do Frontend

Este documento lista as funcionalidades do frontend que dependem de endpoints/modelos que precisam ser criados ou alterados no backend.

---

## 1. Sistema de Notificações In-App (Sininho na Navbar)

### Descrição
O frontend possui um ícone de notificações (sininho) na navbar que atualmente não funciona. O objetivo é mostrar notificações em tempo real quando:
- Um cliente faz um novo agendamento
- Um cliente cancela um agendamento
- Outras ações relevantes do sistema

### O que precisa ser criado no Backend:

#### 1.1 Modelo de Notificação In-App
Criar tabela `user_notifications` com os campos:
```python
class UserNotification(Base):
    __tablename__ = "user_notifications"
    
    id: UUID
    tenant_id: UUID  # FK para tenants
    user_id: UUID    # FK para users (quem recebe a notificação)
    type: str        # 'new_appointment', 'cancelled_appointment', 'rescheduled', etc.
    title: str       # Título da notificação
    message: str     # Mensagem/corpo da notificação
    data: JSON       # Dados extras (appointment_id, client_name, etc.)
    read_at: datetime | None  # NULL = não lida
    created_at: datetime
```

#### 1.2 Endpoints necessários

**GET /api/v1/notifications**
- Retorna lista de notificações do usuário logado
- Query params: `?unread_only=true&limit=20&offset=0`
- Resposta:
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "new_appointment",
      "title": "Novo Agendamento",
      "message": "João Silva agendou Corte de Cabelo para 20/01 às 14:00",
      "data": { "appointment_id": "uuid", "client_name": "João Silva" },
      "read_at": null,
      "created_at": "2026-01-18T10:30:00Z"
    }
  ],
  "unread_count": 5,
  "total": 15
}
```

**PATCH /api/v1/notifications/{id}/read**
- Marca uma notificação como lida
- Resposta: `{ "success": true }`

**POST /api/v1/notifications/read-all**
- Marca todas as notificações como lidas
- Resposta: `{ "success": true, "count": 5 }`

**GET /api/v1/notifications/unread-count**
- Retorna apenas a contagem de não lidas (para o badge)
- Resposta: `{ "count": 5 }`

#### 1.3 Criação automática de notificações
Ao criar/cancelar/reagendar appointments, criar automaticamente uma notificação para os owners/staff do tenant.

Locais para adicionar criação de notificações:
- `src/api/routers/appointments.py` - ao criar appointment
- `src/application/appointment_service.py` - ao cancelar/reagendar
- Ou usar eventos/signals para desacoplar

#### 1.4 (Opcional) WebSocket/SSE para tempo real
Para notificações em tempo real sem polling:
- Endpoint WebSocket: `ws://api/v1/notifications/stream`
- Ou Server-Sent Events: `GET /api/v1/notifications/stream`

---

## 2. Edição de Perfil do Usuário

### Descrição
Na página de configurações, o usuário pode editar nome e email, mas precisa de um endpoint para salvar.

### O que precisa ser criado no Backend:

**PATCH /api/v1/users/me** (ou **PATCH /api/v1/me**)
- Body:
```json
{
  "full_name": "Novo Nome",
  "email": "novo@email.com"
}
```
- Validações:
  - Email deve ser único (verificar se não existe outro usuário com mesmo email)
- Resposta: retornar o objeto MeOut atualizado

---

## 3. Edição de Slug do Tenant

### Descrição
Na página de configurações do negócio, o usuário pode editar o slug (URL).

### O que precisa ser verificado/alterado no Backend:

**PATCH /api/v1/tenants/profile**
- Verificar se aceita o campo `slug` no body
- Validar que o novo slug é único
- Validar formato do slug (apenas letras minúsculas, números e hífens)

---

## 4. Edição de Tipo de Negócio

### Descrição
O campo "Tipo de Negócio" precisa ser editável.

### O que precisa ser verificado no Backend:

**PATCH /api/v1/tenants/profile**
- Verificar se aceita o campo `business_type` no body

---

*Última atualização: 18 de janeiro de 2026*
