'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Users, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

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

  useEffect(() => {
    // Simula carregamento de dados
    // Em produção, isso viria de uma API admin
    setTimeout(() => {
      setStats({
        totalTenants: 12,
        totalUsers: 45,
        activeTenants: 10,
        recentSignups: 3,
      });
      setLoading(false);
    }, 500);
  }, []);

  const statCards = [
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
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard Administrativo</h1>
        <p className={styles.subtitle}>Visão geral do sistema</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={styles.statCard}>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: stat.bgColor, color: stat.color }}
              >
                <Icon size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>
                  {loading ? '...' : stat.value}
                </span>
                <span className={styles.statLabel}>{stat.title}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
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

      {/* Alert */}
      <div className={styles.alertBox}>
        <AlertCircle size={20} />
        <div>
          <strong>Nota:</strong> Esta é a área administrativa do sistema. 
          Alterações aqui afetam todas as contas do SaaS.
        </div>
      </div>
    </div>
  );
}
