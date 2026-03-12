'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/auth-context';
import { isSystemAdminOnlyRoute, isSystemAdminUser } from '@/lib/system-admin';
import styles from './AppShell.module.css';

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [apiBanner, setApiBanner] = useState<{ tone: 'warning' | 'error'; message: string } | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const protectedRoute = isSystemAdminOnlyRoute(pathname);
    const hasProtectedRouteAccess = isSystemAdminUser(user);
    const blockedRoute = protectedRoute && !isLoading && !hasProtectedRouteAccess;
    const holdProtectedRouteRender = protectedRoute && (isLoading || !hasProtectedRouteAccess);

    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    useEffect(() => {
        const onApiStatus = (event: Event) => {
            const customEvent = event as CustomEvent<{
                status?: string;
                message?: string;
                retryAfterSeconds?: number | null;
            }>;
            const detail = customEvent.detail || {};
            if (detail.status === 'ok') {
                setApiBanner(null);
                return;
            }
            if (detail.status === 'rate_limited') {
                setApiBanner({
                    tone: 'warning',
                    message:
                        detail.retryAfterSeconds && detail.retryAfterSeconds > 0
                            ? `Limite de uso temporario. Tente novamente em ${detail.retryAfterSeconds}s.`
                            : (detail.message || 'Limite de requisicoes atingido.'),
                });
                return;
            }
            if (detail.status === 'degraded') {
                setApiBanner({
                    tone: 'error',
                    message: detail.message || 'Servico em degradacao. Alguns recursos podem falhar.',
                });
            }
        };
        window.addEventListener('ritmo:api-status', onApiStatus as EventListener);
        return () => {
            window.removeEventListener('ritmo:api-status', onApiStatus as EventListener);
        };
    }, []);

    useEffect(() => {
        if (blockedRoute) {
            router.replace('/dashboard');
        }
    }, [blockedRoute, router]);

    let content = children;
    if (protectedRoute && isLoading) {
        content = (
            <div className={styles.blockedState}>
                <h2>Validando acesso</h2>
                <p>Carregando permissoes do usuario.</p>
            </div>
        );
    } else if (blockedRoute) {
        content = (
            <div className={styles.blockedState}>
                <h2>Acesso restrito</h2>
                <p>Este modulo esta disponivel apenas para administradores autorizados da plataforma.</p>
            </div>
        );
    } else if (holdProtectedRouteRender) {
        content = null;
    }

    return (
        <div className={styles.appShell}>
            {sidebarOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={styles.mainArea}>
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                {apiBanner && (
                    <div className={`${styles.apiBanner} ${apiBanner.tone === 'warning' ? styles.warning : styles.error}`}>
                        {apiBanner.message}
                    </div>
                )}
                <main className={styles.content}>{content}</main>
            </div>
        </div>
    );
}
