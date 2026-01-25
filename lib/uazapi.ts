// UAZAPI WhatsApp Integration Client

const UAZAPI_BASE_URL = process.env.NEXT_PUBLIC_UAZAPI_URL || 'https://lfsystem.uazapi.com';
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN || '';

// URL do webhook para receber eventos (configure com sua URL real)
const WEBHOOK_URL = process.env.NEXT_PUBLIC_UAZAPI_WEBHOOK_URL || '';

export interface UazapiInstance {
  id: string;
  token: string;
  name: string;
  status: 'disconnected' | 'connecting' | 'connected';
  qrcode?: string;
  paircode?: string;
  profileName?: string;
  profilePicUrl?: string;
  isBusiness?: boolean;
  owner?: string;
  lastDisconnect?: string;
  lastDisconnectReason?: string;
  created?: string;
  updated?: string;
  adminField01?: string;
  adminField02?: string;
}

export interface UazapiStatus {
  instance: UazapiInstance;
  status: {
    connected: boolean;
    loggedIn: boolean;
    jid?: {
      user: string;
      agent: number;
      device: number;
      server: string;
    };
  };
}

export interface CreateInstanceResponse {
  response: string;
  instance: UazapiInstance;
  connected: boolean;
  loggedIn: boolean;
  name: string;
  token: string;
  info?: string;
}

export interface ConnectResponse {
  connected: boolean;
  loggedIn: boolean;
  jid: object | null;
  instance: UazapiInstance;
}

// Tipos de eventos do webhook
export type WebhookEvent = 
  | 'messages'           // Mensagens recebidas/enviadas
  | 'messages_update'    // Atualizações de status de mensagem
  | 'connection'         // Mudanças de conexão
  | 'chats'              // Atualizações de chats
  | 'contacts'           // Atualizações de contatos
  | 'groups'             // Atualizações de grupos
  | 'calls'              // Chamadas recebidas
  | 'labels';            // Atualizações de labels

export interface WebhookConfig {
  id?: string;
  enabled: boolean;
  url: string;
  events: WebhookEvent[];
  addUrlTypesMessages?: boolean;  // Adiciona tipo de mensagem na URL
  addUrlEvents?: boolean;         // Adiciona tipo de evento na URL
  excludeMessages?: string[];     // Filtros para excluir tipos de mensagens
}

export interface WebhookResponse {
  id: string;
  enabled: boolean;
  url: string;
  events: string[];
}

class UazapiClient {
  private baseUrl: string;
  private adminToken: string;

  constructor() {
    this.baseUrl = UAZAPI_BASE_URL;
    this.adminToken = UAZAPI_ADMIN_TOKEN;
  }

  // ==================== ADMIN ENDPOINTS ====================
  // NOTA: Essas funções abaixo NÃO devem ser chamadas do frontend!
  // Elas expõem o admintoken e chamam a API Uazapi diretamente.
  // Use as rotas do backend em vez disso:
  // - POST /api/v1/uazapi/instance/init para criar instância
  // - GET /api/v1/uazapi/instance/status para obter status

  /**
   * @deprecated Use o backend: POST /api/v1/uazapi/instance/init
   * Lista todas as instâncias (requer admintoken)
   */
  async listAllInstances(): Promise<UazapiInstance[]> {
    const response = await fetch(`${this.baseUrl}/instance/all`, {
      method: 'GET',
      headers: {
        'admintoken': this.adminToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * @deprecated Use o backend: POST /api/v1/uazapi/instance/init
   * Cria uma nova instância (requer admintoken)
   * @param name Nome da instância
   * @param tenantId ID do tenant (será salvo em adminField01)
   */
  async createInstance(name: string, tenantId: string): Promise<CreateInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instance/init`, {
      method: 'POST',
      headers: {
        'admintoken': this.adminToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        systemName: 'RitmoAgendamento',
        adminField01: tenantId, // Associa a instância ao tenant
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * @deprecated Use o backend: GET /api/v1/uazapi/instance/status
   * Busca instância por tenant ID
   */
  async findInstanceByTenant(tenantId: string): Promise<UazapiInstance | null> {
    try {
      const instances = await this.listAllInstances();
      return instances.find(inst => inst.adminField01 === tenantId) || null;
    } catch {
      return null;
    }
  }

  // ==================== INSTANCE ENDPOINTS ====================

  /**
   * Verifica o status de uma instância
   */
  async getStatus(instanceToken: string): Promise<UazapiStatus> {
    const response = await fetch(`${this.baseUrl}/instance/status`, {
      method: 'GET',
      headers: {
        'token': instanceToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Conecta uma instância (gera QR code ou código de pareamento)
   * @param instanceToken Token da instância
   * @param phone Número de telefone (opcional - se não informado, gera QR code)
   */
  async connect(instanceToken: string, phone?: string): Promise<ConnectResponse> {
    const response = await fetch(`${this.baseUrl}/instance/connect`, {
      method: 'POST',
      headers: {
        'token': instanceToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(phone ? { phone } : {}),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Desconecta uma instância
   */
  async disconnect(instanceToken: string): Promise<{ instance: UazapiInstance; response: string; info: string }> {
    const response = await fetch(`${this.baseUrl}/instance/disconnect`, {
      method: 'POST',
      headers: {
        'token': instanceToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Deleta uma instância
   */
  async deleteInstance(instanceToken: string): Promise<{ response: string }> {
    const response = await fetch(`${this.baseUrl}/instance`, {
      method: 'DELETE',
      headers: {
        'token': instanceToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ==================== WEBHOOK ENDPOINTS ====================

  /**
   * Obtém a configuração atual do webhook
   */
  async getWebhook(instanceToken: string): Promise<WebhookResponse[]> {
    const response = await fetch(`${this.baseUrl}/webhook`, {
      method: 'GET',
      headers: {
        'token': instanceToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Configura o webhook da instância
   * @param instanceToken Token da instância
   * @param config Configuração do webhook
   */
  async setWebhook(instanceToken: string, config: WebhookConfig): Promise<WebhookResponse> {
    const response = await fetch(`${this.baseUrl}/webhook`, {
      method: 'POST',
      headers: {
        'token': instanceToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Configura webhook com URL padrão do sistema
   * Usa a URL configurada em NEXT_PUBLIC_UAZAPI_WEBHOOK_URL
   */
  async setupDefaultWebhook(instanceToken: string, webhookUrl?: string): Promise<WebhookResponse | null> {
    const url = webhookUrl || WEBHOOK_URL;
    
    if (!url) {
      console.warn('Webhook URL não configurada. Configure NEXT_PUBLIC_UAZAPI_WEBHOOK_URL');
      return null;
    }

    return this.setWebhook(instanceToken, {
      enabled: true,
      url: url,
      events: ['messages', 'connection'],
      addUrlTypesMessages: false,
      addUrlEvents: false,
      excludeMessages: ['wasSentByApi'], // Evita loop de mensagens enviadas pela API
    });
  }

  // ==================== MESSAGING ENDPOINTS ====================

  /**
   * Envia uma mensagem de texto
   */
  async sendText(
    instanceToken: string,
    number: string,
    text: string,
    options?: {
      delay?: number;
      linkPreview?: boolean;
    }
  ): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/send/text`, {
      method: 'POST',
      headers: {
        'token': instanceToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number,
        text,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Verifica se um número está no WhatsApp
   */
  async checkNumber(instanceToken: string, numbers: string[]): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/chat/check`, {
      method: 'POST',
      headers: {
        'token': instanceToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ numbers }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

// Singleton instance
export const uazapi = new UazapiClient();

// Helper para armazenar/recuperar token da instância no localStorage
const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY || 'whatsapp_instance_token';

export const WhatsAppStorage = {
  saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },
  
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },
  
  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
};
