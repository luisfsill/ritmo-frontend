'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setTokens, clearTokens, isAuthenticated, TokenPair, ApiError } from '@/lib/api';

interface User {
    id: string;
    email: string;
    name: string;
    tenant_id: string;
    business_name?: string;
}

interface MeResponse {
    user_id: string;
    tenant_id: string;
    role: string;
    email: string;
    full_name: string | null;
    tenant_slug: string;
    business_name: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

// Helper para extrair dados do JWT
const parseJwt = (token: string): { sub: string; tenant_id: string; email?: string; name?: string; full_name?: string; business_name?: string } | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Buscar dados completos do usuário do endpoint /me
    const fetchUserFromApi = async (): Promise<User | null> => {
        try {
            const response = await api.get<MeResponse>('/api/v1/me');
            return {
                id: response.user_id,
                email: response.email,
                name: response.full_name || response.email.split('@')[0],
                tenant_id: response.tenant_id,
                business_name: response.business_name,
            };
        } catch {
            return null;
        }
    };

    // Extrair dados do usuário a partir do token (fallback)
    const getUserFromToken = (): User | null => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('ritmo_access_token') : null;
        if (!token) return null;

        const payload = parseJwt(token);
        if (!payload) return null;

        // Tenta pegar o nome de várias fontes: name, full_name, ou extrai do email
        const userName = payload.name || payload.full_name || payload.email?.split('@')[0] || 'Usuário';

        return {
            id: payload.sub,
            email: payload.email || '',
            name: userName,
            tenant_id: payload.tenant_id,
            business_name: payload.business_name,
        };
    };

    // Check for existing auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            if (isAuthenticated()) {
                // Primeiro tenta buscar dados da API
                const apiUser = await fetchUserFromApi();
                if (apiUser) {
                    setUser(apiUser);
                    setIsLoading(false);
                    return;
                }
                
                // Fallback: extrair do token
                const userData = getUserFromToken();
                if (userData) {
                    setUser(userData);
                } else {
                    // Em modo desenvolvimento, não limpar tokens se parecer ser demo
                    const token = typeof window !== 'undefined' ? localStorage.getItem('ritmo_access_token') : null;
                    const isDemoMode = process.env.NODE_ENV === 'development' && token?.includes('demo');
                    
                    if (!isDemoMode) {
                        // Token inválido, limpar
                        clearTokens();
                    } else {
                        // Modo demo - criar usuário fake
                        setUser({
                            id: 'demo-admin',
                            email: 'admin@admin.com',
                            name: 'Admin',
                            tenant_id: 'demo-tenant',
                            business_name: 'Meu Negócio Demo',
                        });
                    }
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // Fazer login e obter tokens
            const tokens = await api.post<TokenPair>('/api/v1/auth/login', { email, password }, { requiresAuth: false });
            setTokens(tokens);
            
            // Buscar dados completos do usuário da API
            const apiUser = await fetchUserFromApi();
            if (apiUser) {
                setUser(apiUser);
            } else {
                // Fallback: extrair dados do token
                const userData = getUserFromToken();
                if (userData) {
                    setUser(userData);
                } else {
                    // Último fallback: usar dados básicos do email
                    setUser({ id: '', email, name: email.split('@')[0], tenant_id: '' });
                }
            }
        } catch (err) {
            const apiError = err as ApiError;
            let errorMessage = apiError.message || 'Erro ao fazer login';
            
            // Mensagem específica para serviço offline
            if (apiError.status === 0) {
                errorMessage = 'O serviço está fora do ar no momento. Contate o administrador.';
            }
            
            setError(errorMessage);
            setIsLoading(false);
            
            // Re-throw com status preservado
            const errorToThrow = new Error(errorMessage) as Error & { status?: number };
            errorToThrow.status = apiError.status;
            throw errorToThrow;
        }
        setIsLoading(false);
    };

    const logout = () => {
        clearTokens();
        setUser(null);
        setError(null);
    };

    const refreshUser = async () => {
        const apiUser = await fetchUserFromApi();
        if (apiUser) {
            setUser(apiUser);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isLoggedIn: !!user,
                login,
                logout,
                refreshUser,
                error,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
