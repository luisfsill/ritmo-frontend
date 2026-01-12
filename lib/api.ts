/**
 * API Client for Ritmo Backend
 * Handles all HTTP requests with authentication, error handling, and token refresh
 */

// Fatal error check for missing API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_RITMO_API_URL;

export class ApiConfigError extends Error {
  constructor() {
    super('ERRO FATAL: Variável de ambiente NEXT_PUBLIC_RITMO_API_URL não está configurada. Configure o arquivo .env.local com a URL da API.');
    this.name = 'ApiConfigError';
  }
}

export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(tokens: TokenPair) {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;

  // Store in localStorage for client-side persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('ritmo_access_token', tokens.access_token);
    localStorage.setItem('ritmo_refresh_token', tokens.refresh_token);

    // Store in cookies for Middleware access
    document.cookie = `ritmo_access_token=${tokens.access_token}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `ritmo_refresh_token=${tokens.refresh_token}; path=/; max-age=604800; SameSite=Lax`;
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;

  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('ritmo_access_token');
  }

  return accessToken;
}

export function getRefreshToken(): string | null {
  if (refreshToken) return refreshToken;

  if (typeof window !== 'undefined') {
    refreshToken = localStorage.getItem('ritmo_refresh_token');
  }

  return refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;

  if (typeof window !== 'undefined') {
    localStorage.removeItem('ritmo_access_token');
    localStorage.removeItem('ritmo_refresh_token');

    // Remove cookies
    document.cookie = 'ritmo_access_token=; path=/; max-age=0';
    document.cookie = 'ritmo_refresh_token=; path=/; max-age=0';
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// Helper para verificar se está em modo demo
function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('ritmo_access_token');
  return process.env.NODE_ENV === 'development' && !!token?.includes('demo');
}

function assertV1Endpoint(endpoint: string): void {
  const trimmed = endpoint.trim();
  if (!trimmed.startsWith('/')) {
    throw new Error(`Endpoint inválido: "${endpoint}"`);
  }
  if (trimmed === '/api/v1' || trimmed.startsWith('/api/v1/')) {
    return;
  }
  throw new Error(`Endpoint não-versionado (use /api/v1/...): "${endpoint}"`);
}

// Error handling
function handleApiError(status: number, data: unknown): never {
  let message = 'Ocorreu um erro inesperado';
  let details: Record<string, unknown> | undefined;

  if (typeof data === 'object' && data !== null) {
    const errorData = data as Record<string, unknown>;
    if ('detail' in errorData) {
      if (typeof errorData.detail === 'string') {
        message = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        // Validation errors
        details = { validationErrors: errorData.detail };
        message = 'Erro de validação';
      }
    } else if ('message' in errorData && typeof errorData.message === 'string') {
      message = errorData.message;
    }
  }

  switch (status) {
    case 400:
      message = message || 'Dados inválidos';
      break;
    case 401:
      message = 'Sessão expirada. Faça login novamente.';
      // Não limpar tokens em modo demo
      if (!isDemoMode()) {
        clearTokens();
      }
      break;
    case 403:
      message = 'Você não tem permissão para esta ação';
      break;
    case 404:
      message = message || 'Recurso não encontrado';
      break;
    case 409:
      message = message || 'Conflito: o recurso já existe ou não está disponível';
      break;
    case 422:
      message = message || 'Erro de validação dos dados';
      break;
    case 500:
      message = 'Erro interno do servidor. Tente novamente.';
      break;
    case 502:
    case 503:
    case 504:
      message = 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.';
      break;
  }

  const error: ApiError = { status, message, details };
  throw error;
}

// Refresh token logic
async function refreshAccessToken(): Promise<boolean> {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: currentRefreshToken }),
    });

    if (!response.ok) {
      // Não limpar tokens em modo demo
      if (!isDemoMode()) {
        clearTokens();
      }
      return false;
    }

    const tokens: TokenPair = await response.json();
    setTokens(tokens);
    return true;
  } catch {
    // Não limpar tokens em modo demo
    if (!isDemoMode()) {
      clearTokens();
    }
    return false;
  }
}

// Main API request function
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  idempotencyKey?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  // Check for API URL configuration
  if (!API_BASE_URL) {
    throw new ApiConfigError();
  }

  assertV1Endpoint(endpoint);

  const {
    method = 'GET',
    body,
    headers = {},
    requiresAuth = true,
    idempotencyKey,
  } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth header if required
  if (requiresAuth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Add idempotency key if provided
  if (idempotencyKey) {
    requestHeaders['Idempotency-Key'] = idempotencyKey;
  }

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    // Handle 401 - try to refresh token
    if (response.status === 401 && requiresAuth) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the request with new token
        requestHeaders['Authorization'] = `Bearer ${getAccessToken()}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...requestOptions,
          headers: requestHeaders,
        });
      }
    }

    // Handle non-OK responses
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      handleApiError(response.status, data);
    }

    // Handle 202 (Accepted - offline mode)
    if (response.status === 202) {
      const data = await response.json();
      return data as T;
    }

    // Handle 204 (No Content)
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json() as T;
  } catch (error) {
    // Re-throw API errors
    if (error && typeof error === 'object' && 'status' in error) {
      throw error;
    }

    // Re-throw config errors
    if (error instanceof ApiConfigError) {
      throw error;
    }

    // Detect CORS errors
    if (error instanceof TypeError) {
      const errorMessage = (error as Error).message;
      
      // CORS error
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network request failed')) {
        const corsError: ApiError = {
          status: 0,
          message: 'Erro de configuração: não foi possível conectar ao servidor. Verifique se a API está acessível e as configurações de CORS estão corretas. Contate o administrador.',
        };
        throw corsError;
      }
    }

    // Network or connection error - could be database offline or timeout
    const networkError: ApiError = {
      status: 0,
      message: 'O serviço está fora do ar no momento. Contate o administrador.',
    };
    throw networkError;
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE', body }),
};
