'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Settings, Users, Building2, LayoutDashboard, LogOut, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { isAdminAuthenticated, logoutAdmin, getAdminUser, getAdminSession } from '@/lib/admin-api';
import styles from './admin.module.css';

const adminMenuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/tenants', icon: Building2, label: 'Empresas' },
  { href: '/admin/users', icon: Users, label: 'Usuários' },
  { href: '/admin/settings', icon: Settings, label: 'Configurações' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userDisplay, setUserDisplay] = useState('');

  // Se estiver na página de login, renderiza sem verificação
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      setIsAuthorized(true);
      return;
    }

    // Verifica se tem sessão de admin
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    // Define o display do usuário
    const session = getAdminSession();
    const user = getAdminUser();
    if (user) {
      setUserDisplay(user.email);
    } else if (session?.type === 'jwt') {
      setUserDisplay('Admin');
    }

    setIsAuthorized(true);
    setIsLoading(false);
  }, [pathname, router, isLoginPage]);

  const handleLogout = async () => {
    await logoutAdmin();
    router.push('/admin/login');
  };

  // Se estiver na página de login, renderiza apenas o children
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.logo}>🔧 Admin</h1>
          <span className={styles.badge}>Sistema</span>
        </div>

        <nav className={styles.nav}>
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/dashboard" className={styles.backLink}>
            <ChevronLeft size={18} />
            Voltar ao SaaS
          </Link>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut size={18} />
            Sair do Admin
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <span className={styles.welcomeText}>Painel Administrativo</span>
            <span className={styles.userEmail}>{userDisplay}</span>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
