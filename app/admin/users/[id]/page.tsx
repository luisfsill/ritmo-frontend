'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Calendar, Loader2, Shield, Building2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { adminApi, getAdminUser, PlatformUser } from '@/lib/admin-api';
import styles from './edit.module.css';

export default function ViewPlatformUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<PlatformUser | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentAdmin = getAdminUser();
  const isSuperAdmin = String(currentAdmin?.role || '').toUpperCase() === 'SUPER_ADMIN';

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const rows = await adminApi.get<PlatformUser[]>('/api/v1/platform-users/?include_inactive=true');
        const found = (rows || []).find((item) => item.id === id) || null;
        if (!cancelled) {
          setUserData(found);
          if (!found) {
            setMessage({ type: 'error', text: 'Usuário não encontrado.' });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setMessage({ type: 'error', text: (err as Error).message || 'Erro ao carregar usuário.' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDeactivate = async () => {
    if (!isSuperAdmin || !userData?.is_active) return;
    if (!confirm('Tem certeza que deseja desativar este admin?')) return;

    setSaving(true);
    setMessage(null);
    try {
      await adminApi.post(`/api/v1/platform-users/${encodeURIComponent(id)}/deactivate`);
      setUserData({ ...userData, is_active: false });
      setMessage({ type: 'success', text: 'Admin desativado com sucesso.' });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Erro ao desativar admin.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={32} className={styles.spinner} />
        <p>Carregando dados do usuário...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={styles.page}>
        <div className={styles.message + ' ' + styles.error}>Usuário não encontrado.</div>
        <button className={styles.saveButton} onClick={() => router.push('/admin/users')}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/admin/users" className={styles.backButton}>
          <ArrowLeft size={20} />
          Voltar
        </Link>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Platform Admin</h1>
          <p className={styles.subtitle}>ID: {userData.id}</p>
        </div>
        {isSuperAdmin && userData.is_active && (
          <div className={styles.headerActions}>
            <button className={styles.deleteButton} onClick={handleDeactivate} disabled={saving}>
              {saving ? <Loader2 size={18} className={styles.spinner} /> : <Trash2 size={18} />}
              {saving ? 'Processando...' : 'Desativar'}
            </button>
          </div>
        )}
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.content}>
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <Shield size={24} />
            <div>
              <span className={styles.infoValue}>{userData.role}</span>
              <span className={styles.infoLabel}>Role</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <Calendar size={24} />
            <div>
              <span className={styles.infoValue}>
                {userData.created_at ? new Date(userData.created_at).toLocaleDateString('pt-BR') : '-'}
              </span>
              <span className={styles.infoLabel}>Criado em</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <User size={24} />
            <div>
              <span className={styles.infoValue}>
                {userData.last_login_at ? new Date(userData.last_login_at).toLocaleDateString('pt-BR') : 'Nunca'}
              </span>
              <span className={styles.infoLabel}>Último acesso</span>
            </div>
          </div>
        </div>

        <div className={styles.formGrid}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <User size={20} />
              Informações
            </h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Nome</label>
                <input className={styles.input} value={userData.full_name || '-'} readOnly disabled />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  <Mail size={14} />
                  Email
                </label>
                <input className={styles.input} value={userData.email} readOnly disabled />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  <Shield size={14} />
                  Status
                </label>
                <input className={styles.input} value={userData.is_active ? 'Ativo' : 'Inativo'} readOnly disabled />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  <Building2 size={14} />
                  Troca de senha obrigatória
                </label>
                <input
                  className={styles.input}
                  value={userData.must_change_password ? 'Sim' : 'Não'}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
