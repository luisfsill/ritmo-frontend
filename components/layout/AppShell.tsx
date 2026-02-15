'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import styles from './AppShell.module.css';

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [apiBanner, setApiBanner] = useState<{ tone: 'warning' | 'error'; message: string } | null>(null);
    const pathname = usePathname();

    // Fecha o sidebar ao mudar de página (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Fecha o sidebar ao redimensionar para desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Previne scroll do body quando sidebar está aberto em mobile
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
                            : (detail.message || 'Limite de requisições atingido.'),
                });
                return;
            }
            if (detail.status === 'degraded') {
                setApiBanner({
                    tone: 'error',
                    message: detail.message || 'Serviço em degradação. Alguns recursos podem falhar.',
                });
            }
        };
        window.addEventListener('ritmo:api-status', onApiStatus as EventListener);
        return () => {
            window.removeEventListener('ritmo:api-status', onApiStatus as EventListener);
        };
    }, []);

    return (
        <div className={styles.appShell}>
            {/* Overlay para fechar sidebar em mobile */}
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
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
