'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Users, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { adminApi, PlatformUser } from '@/lib/admin-api';
import styles from './page.module.css';

interface AdminTenant {
  id: string;
  status: string | null;
  created_at: string | null;
}

interface DashboardStats {
  totalTenants: number;
  totalUsers: number;
  activeTenants: number;
  recentSignups: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    totalUsers: 0,
    activeTenants: 0,
    recentSignups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [tenants, platformUsers] = await Promise.all([
          adminApi.get<AdminTenant[]>('/api/v1/admin/tenants?limit=200'),
          adminApi.get<PlatformUser[]>('/api/v1/platform-users/?include_inactive=true'),
        ]);

        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const activeTenants = (tenants || []).filter((t) => String(t.status || '').toUpperCase() === 'ACTIVE').length;
        const recentSignups = (tenants || []).filter((t) => {
          if (!t.created_at) return false;
          const createdAt = new Date(t.created_at).getTime();
          return Number.isFinite(createdAt) && createdAt >= sevenDaysAgo;
        }).length;

        if (!cancelled) {
          setStats({
            totalTenants: (tenants || []).length,
            totalUsers: (platformUsers || []).length,
            activeTenants,
            recentSignups,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || 'Erro ao carregar dashboard admin.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = useMemo(
    () => [
      {
        title: 'Total de Empresas',
        value: stats.totalTenants,
        icon: Building2,
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
      },
      {
        title: 'Total de Usuários',
        value: stats.totalUsers,
        icon: Users,
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
      },
      {
        title: 'Empresas Ativas',
        value: stats.activeTenants,
        icon: Activity,
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
      },
      {
        title: 'Novos (7 dias)',
        value: stats.recentSignups,
        icon: TrendingUp,
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
      },
    ],
    [stats]
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard Administrativo</h1>
        <p className={styles.subtitle}>Visão geral do sistema</p>
      </div>

      <div className={styles.statsGrid}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: stat.bgColor, color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{loading ? '...' : stat.value}</span>
                <span className={styles.statLabel}>{stat.title}</span>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className={styles.alertBox}>
          <AlertCircle size={20} />
          <div>
            <strong>Erro:</strong> {error}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Ações Rápidas</h2>
        <div className={styles.actionsGrid}>
          <Link href="/admin/tenants" className={styles.actionCard}>
            <Building2 size={24} />
            <span>Gerenciar Empresas</span>
          </Link>
          <Link href="/admin/users" className={styles.actionCard}>
            <Users size={24} />
            <span>Gerenciar Usuários</span>
          </Link>
          <Link href="/admin/settings" className={styles.actionCard}>
            <Activity size={24} />
            <span>Configurações Globais</span>
          </Link>
        </div>
      </div>

      <div className={styles.alertBox}>
        <AlertCircle size={20} />
        <div>
          <strong>Nota:</strong> Esta é a área administrativa do sistema. Alterações aqui afetam todas as contas do SaaS.
        </div>
      </div>
    </div>
  );
}
