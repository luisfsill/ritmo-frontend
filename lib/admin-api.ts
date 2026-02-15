/**
 * Admin API Client
 * JWT-based auth (email/password)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_RITMO_API_URL;
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

// Types
export interface PlatformUser {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    must_change_password: boolean;
    password_changed_at: string | null;
    last_login_at: string | null;
    created_at: string | null;
    created_by_user_id?: string | null;
}

export interface PlatformSettings {
    uazapi_url: string | null;
    uazapi_admin_token_masked: string | null;
    default_webhook_url: string | null;
    webhook_events: string[];
    updated_at: string | null;
    updated_by_user_id: string | null;
}

export interface PlatformSettingsPatch {
    uazapi_url?: string | null;
    uazapi_admin_token?: string | null;
    default_webhook_url?: string | null;
    webhook_events?: string[];
}

export interface LoginResponse {
    must_change_password: boolean;
    user: PlatformUser;
    access_token?: string;
    refresh_token?: string;
    password_change_token?: string;
}

export interface JwtAdminSession {
    type: 'jwt';
    accessToken: string;
    refreshToken: string;
    user?: PlatformUser;
}

export interface LegacyAdminSession {
    type: 'legacy';
    adminToken: string;
    user?: PlatformUser;
}

export type AdminSession = JwtAdminSession | LegacyAdminSession;

// Session management
const ADMIN_SESSION_KEY = 'ritmo_admin_session';

export function getAdminSession(): AdminSession | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!data) return null;
    try {
        return JSON.parse(data) as AdminSession;
    } catch {
        return null;
    }
}

export function setAdminSession(session: AdminSession): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    }
}

export function clearAdminSession(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(ADMIN_SESSION_KEY);
    }
}

export function isAdminAuthenticated(): boolean {
    const session = getAdminSession();
    if (!session) return false;
    if (session.type === 'jwt') {
        return !!session.accessToken;
    }
    return !!session.adminToken;
}

export function getAdminUser(): PlatformUser | null {
    const session = getAdminSession();
    return session?.user || null;
}

export function setLegacyAdminSession(adminToken: string): void {
    const token = String(adminToken || '').trim();
    if (!token) return;
    setAdminSession({ type: 'legacy', adminToken: token });
}

// Auth functions
export async function loginWithCredentials(email: string, password: string): Promise<LoginResponse> {
    if (!API_BASE_URL) throw new Error('API URL not configured');

    const response = await fetch(`${API_BASE_URL}/api/v1/platform-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
            throw new Error('Email ou senha inválidos');
        }
        if (response.status === 429) {
            throw new Error('Muitas tentativas. Aguarde alguns minutos.');
        }
        throw new Error(data.detail || 'Erro ao fazer login');
    }

    const data: LoginResponse = await response.json();

    // If must_change_password, don't set session yet - let the caller handle it
    if (!data.must_change_password && data.access_token && data.refresh_token) {
        setAdminSession({
            type: 'jwt',
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: data.user,
        });
    }

    return data;
}

export async function changePasswordForced(passwordChangeToken: string, newPassword: string): Promise<void> {
    if (!API_BASE_URL) throw new Error('API URL not configured');

    const response = await fetch(`${API_BASE_URL}/api/v1/platform-auth/change-password/forced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password_change_token: passwordChangeToken, new_password: newPassword }),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Erro ao alterar senha');
    }

    const tokens = await response.json();
    // After forced password change, we get new tokens - need to fetch user info
    setAdminSession({
        type: 'jwt',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
    });

    // Fetch user info
    try {
        const user = await fetchCurrentUser();
        const session = getAdminSession();
        if (session) {
            setAdminSession({ ...session, user });
        }
    } catch {
        // Continue without user info
    }
}

async function fetchCurrentUser(): Promise<PlatformUser> {
    const session = getAdminSession();
    if (!session || session.type !== 'jwt' || !session.accessToken) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/v1/platform-auth/me`, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
        },
    });

    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
}

export async function refreshTokens(): Promise<boolean> {
    const session = getAdminSession();
    if (!session || session.type !== 'jwt' || !session.refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/platform-auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: session.refreshToken }),
        });

        if (!response.ok) {
            clearAdminSession();
            return false;
        }

        const tokens = await response.json();
        setAdminSession({
            ...session,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
        });
        return true;
    } catch {
        clearAdminSession();
        return false;
    }
}

export async function logoutAdmin(): Promise<void> {
    const session = getAdminSession();
    if (session?.type === 'jwt' && session.refreshToken) {
        try {
            await fetch(`${API_BASE_URL}/api/v1/platform-auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: session.refreshToken }),
            });
        } catch {
            // Ignore errors on logout
        }
    }
    clearAdminSession();
}

// Admin API request function
export async function adminRequest<T>(
    endpoint: string,
    options: {
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        body?: unknown;
    } = {}
): Promise<T> {
    const { method = 'GET', body } = options;
    const session = getAdminSession();

    if (!session) {
        throw new Error('Not authenticated');
    }

    if (!API_BASE_URL) {
        throw new Error('API URL not configured');
    }

    assertV1Endpoint(endpoint);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (session.type === 'jwt') {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
    } else {
        headers['X-Admin-Token'] = session.adminToken;
    }

    const requestOptions: RequestInit = {
        method,
        headers,
    };

    if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    // Try token refresh on 401
    if (response.status === 401 && session.type === 'jwt') {
        const refreshed = await refreshTokens();
        if (refreshed) {
            const newSession = getAdminSession();
            if (newSession?.type === 'jwt' && newSession.accessToken) {
                headers['Authorization'] = `Bearer ${newSession.accessToken}`;
                response = await fetch(`${API_BASE_URL}${endpoint}`, { ...requestOptions, headers });
            }
        }
    }

    if (!response.ok) {
        if (response.status === 401) {
            clearAdminSession();
            throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (response.status === 503) {
            throw new Error('Área admin desabilitada no servidor');
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Erro na requisição admin');
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

// Convenience methods
export const adminApi = {
    get: <T>(endpoint: string) => adminRequest<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body?: unknown) => adminRequest<T>(endpoint, { method: 'POST', body }),
    put: <T>(endpoint: string, body?: unknown) => adminRequest<T>(endpoint, { method: 'PUT', body }),
    patch: <T>(endpoint: string, body?: unknown) => adminRequest<T>(endpoint, { method: 'PATCH', body }),
    delete: <T>(endpoint: string, body?: unknown) => adminRequest<T>(endpoint, { method: 'DELETE', body }),
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
    return adminApi.get<PlatformSettings>('/api/v1/platform-settings/');
}

export async function updatePlatformSettings(payload: PlatformSettingsPatch): Promise<PlatformSettings> {
    return adminApi.patch<PlatformSettings>('/api/v1/platform-settings/', payload);
}
