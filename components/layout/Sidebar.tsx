'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Scissors,
    Users,
    UserCircle,
    Clock,
    Settings,
    BarChart3,
    DollarSign,
    AlertTriangle,
    Settings2,
    MessageSquare,
    LogOut,
    Shield,
    X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getConversationStats } from '@/lib/conversations';
import styles from './Sidebar.module.css';

const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/calendar', label: 'Agenda', icon: Calendar },
    { href: '/dashboard/appointments', label: 'Agendamentos', icon: Clock },
    { href: '/dashboard/services', label: 'Serviços', icon: Scissors },
    { href: '/dashboard/staff', label: 'Equipe', icon: Users },
    { href: '/dashboard/clients', label: 'Clientes', icon: UserCircle },
    { href: '/dashboard/conversations', label: 'Conversas', icon: MessageSquare },
    { href: '/dashboard/analytics', label: 'Relatórios', icon: BarChart3 },
    { href: '/dashboard/pricing', label: 'Preço Dinâmico', icon: DollarSign },
    { href: '/dashboard/emergency', label: 'Emergência', icon: AlertTriangle },
    { href: '/dashboard/operations', label: 'Operações', icon: Settings2 },
];

const bottomMenuItems = [
    { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
];

const SYSTEM_ADMINS = ['admin@admin.com', 'admin@ritmo.com'];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [waitingHumanCount, setWaitingHumanCount] = useState(0);

    const isDev = typeof window !== 'undefined' && (
        process.env.NODE_ENV === 'development' ||
        window.location.port === '3000'
    );

    const isSystemAdmin = isDev || SYSTEM_ADMINS.includes(user?.email || '');

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    useEffect(() => {
        let disposed = false;

        const loadStats = async () => {
            try {
                const stats = await getConversationStats();
                if (!disposed) {
                    setWaitingHumanCount(Math.max(0, stats.waiting_human || 0));
                }
            } catch {
                if (!disposed) {
                    setWaitingHumanCount(0);
                }
            }
        };

        void loadStats();
        const interval = window.setInterval(() => {
            void loadStats();
        }, 30000);

        return () => {
            disposed = true;
            window.clearInterval(interval);
        };
    }, []);

    return (
        <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
            <div className={styles.sidebarHeader}>
                <Link href="/dashboard" className={styles.logo}>
                    <span className={styles.logoIcon}>📅</span>
                    <span className={styles.logoText}>Ritmo</span>
                </Link>
                {onClose && (
                    <button className={styles.closeButton} onClick={onClose} aria-label="Fechar menu">
                        <X size={24} />
                    </button>
                )}
            </div>

            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        const showBadge = item.href === '/dashboard/conversations' && waitingHumanCount > 0;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                    onClick={onClose}
                                >
                                    <Icon size={20} className={styles.navIcon} />
                                    <span className={styles.navLabel}>{item.label}</span>
                                    {showBadge && (
                                        <span className={styles.navBadge}>
                                            {waitingHumanCount > 99 ? '99+' : waitingHumanCount}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className={styles.sidebarFooter}>
                <ul className={styles.navList}>
                    {isSystemAdmin && (
                        <li>
                            <Link
                                href="/admin"
                                className={`${styles.navItem} ${styles.adminLink}`}
                                onClick={onClose}
                            >
                                <Shield size={20} className={styles.navIcon} />
                                <span className={styles.navLabel}>Admin</span>
                            </Link>
                        </li>
                    )}
                    {bottomMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                    onClick={onClose}
                                >
                                    <Icon size={20} className={styles.navIcon} />
                                    <span className={styles.navLabel}>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                    <li>
                        <button onClick={handleLogout} className={styles.navItem}>
                            <LogOut size={20} className={styles.navIcon} />
                            <span className={styles.navLabel}>Sair</span>
                        </button>
                    </li>
                </ul>
            </div>
        </aside>
    );
}
