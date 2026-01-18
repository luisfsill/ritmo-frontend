'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Search, Menu, Home, Settings, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import styles from './Header.module.css';

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fecha o menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    const handleLogout = async () => {
        setMenuOpen(false);
        await logout();
        router.push('/login');
    };

    const handleSettings = () => {
        setMenuOpen(false);
        router.push('/dashboard/settings');
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                {onMenuClick && (
                    <button 
                        className={styles.menuButton} 
                        onClick={onMenuClick}
                        aria-label="Abrir menu"
                    >
                        <Menu size={24} />
                    </button>
                )}
                <Link href="/" className={styles.homeButton} title="Home" aria-label="Ir para Home">
                    <Home size={20} />
                </Link>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className={styles.searchInput}
                    />
                    <span className={styles.searchShortcut}>⌘K</span>
                </div>
            </div>

            <div className={styles.actions}>
                <button className={styles.iconButton} title="Notificações">
                    <Bell size={20} />
                    <span className={styles.notificationBadge} />
                </button>

                <ThemeToggle />

                <div className={styles.userMenu} ref={menuRef}>
                    <button 
                        className={styles.avatar}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Menu do usuário"
                        aria-expanded={menuOpen}
                    >
                        {user?.business_name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
                    </button>

                    {menuOpen && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <span className={styles.dropdownName}>{user?.business_name || 'Meu Negócio'}</span>
                                <span className={styles.dropdownEmail}>{user?.email || ''}</span>
                            </div>
                            <div className={styles.dropdownDivider} />
                            <button className={styles.dropdownItem} onClick={handleSettings}>
                                <Settings size={16} />
                                <span>Configurações</span>
                            </button>
                            <button className={styles.dropdownItem} onClick={handleLogout}>
                                <LogOut size={16} />
                                <span>Sair</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
