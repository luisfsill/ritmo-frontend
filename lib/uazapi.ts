import { api } from '@/lib/api';
import { isPendingResponse, PendingCommandResponse } from '@/lib/front-commands';

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

export interface ConnectResponse {
  connected: boolean;
  loggedIn: boolean;
  jid: object | null;
  instance: UazapiInstance;
}

export type WebhookEvent =
  | 'messages'
  | 'messages_update'
  | 'connection'
  | 'chats'
  | 'contacts'
  | 'groups'
  | 'calls'
  | 'labels';

export interface WebhookConfig {
  enabled: boolean;
  events: WebhookEvent[];
  url?: string;
  addUrlTypesMessages?: boolean;
  addUrlEvents?: boolean;
  excludeMessages?: string[];
}

export interface WebhookResponse {
  id: string;
  enabled: boolean;
  url: string;
  events: string[];
}

export type UazapiResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'pending'; pending: PendingCommandResponse };

export interface UazapiCreateInstanceData {
  instance: {
    instance?: UazapiInstance;
    token?: string;
  };
  saved: boolean;
}

export interface UazapiConnectData {
  connect: ConnectResponse;
}

export interface UazapiStatusData {
  status: UazapiStatus;
}

export interface UazapiWebhookData {
  webhook: WebhookResponse;
  url: string;
}

export interface UazapiDisconnectData {
  disconnect: {
    instance?: UazapiInstance;
    response?: string;
    info?: string;
  };
}

export interface UazapiDeleteData {
  deleted: boolean;
  result?: Record<string, unknown>;
}

export interface UazapiAdoptTokenData {
  adopted: boolean;
  status: UazapiStatus;
}

export interface UazapiCapabilitiesData {
  enabled: boolean;
  reason?: 'canary_disabled' | 'missing_webhook_secret' | 'ok' | string;
}

function asOperationResult<T>(payload: T | PendingCommandResponse): UazapiResult<T> {
  if (isPendingResponse(payload)) {
    return { kind: 'pending', pending: payload };
  }
  return { kind: 'ok', data: payload };
}

class UazapiClient {
  async getCapabilities(): Promise<UazapiCapabilitiesData> {
    return api.get<UazapiCapabilitiesData>('/api/v1/uazapi/capabilities');
  }

  async createInstance(name: string, tenantId: string): Promise<UazapiResult<UazapiCreateInstanceData>> {
    const payload = await api.post<UazapiCreateInstanceData | PendingCommandResponse>('/api/v1/uazapi/instance/init', {
      name,
      systemName: 'RitmoAgendamento',
      adminField01: tenantId,
    });
    return asOperationResult(payload);
  }

  async connect(phone?: string): Promise<UazapiResult<UazapiConnectData>> {
    const payload = await api.post<UazapiConnectData | PendingCommandResponse>('/api/v1/uazapi/instance/connect', {
      ...(phone ? { phone } : {}),
    });
    return asOperationResult(payload);
  }

  async getStatus(): Promise<UazapiResult<UazapiStatusData>> {
    const payload = await api.get<UazapiStatusData | PendingCommandResponse>('/api/v1/uazapi/instance/status');
    return asOperationResult(payload);
  }

  async setWebhook(config: WebhookConfig): Promise<UazapiResult<UazapiWebhookData>> {
    const payload = await api.post<UazapiWebhookData | PendingCommandResponse>('/api/v1/uazapi/webhook', config);
    return asOperationResult(payload);
  }

  async disconnect(): Promise<UazapiResult<UazapiDisconnectData>> {
    const payload = await api.post<UazapiDisconnectData | PendingCommandResponse>('/api/v1/uazapi/instance/disconnect', {});
    return asOperationResult(payload);
  }

  async deleteInstance(): Promise<UazapiResult<UazapiDeleteData>> {
    const payload = await api.delete<UazapiDeleteData | PendingCommandResponse>('/api/v1/uazapi/instance', {});
    return asOperationResult(payload);
  }

  async adoptToken(token: string, baseUrl?: string): Promise<UazapiResult<UazapiAdoptTokenData>> {
    const payload = await api.post<UazapiAdoptTokenData | PendingCommandResponse>('/api/v1/uazapi/instance/adopt-token', {
      token,
      ...(baseUrl ? { base_url: baseUrl } : {}),
    });
    return asOperationResult(payload);
  }
}

export const uazapi = new UazapiClient();

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
