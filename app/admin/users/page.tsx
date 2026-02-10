'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Eye, Shield, Users, Plus, Trash2 } from 'lucide-react';
import { SearchInput } from '@/components/ui';
import { adminApi, getAdminUser, PlatformUser } from '@/lib/admin-api';
import styles from './users.module.css';

interface CreatePlatformUserPayload {
  email: string;
  full_name: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT';
  temp_password: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createRole, setCreateRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT'>('ADMIN');
  const [createTempPassword, setCreateTempPassword] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!activeDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const currentAdmin = getAdminUser();
  const isSuperAdmin = String(currentAdmin?.role || '').toUpperCase() === 'SUPER_ADMIN';

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.get<PlatformUser[]>('/api/v1/platform-users/?include_inactive=true');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((err as Error).message || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      return (
        (user.full_name || '').toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        String(user.role || '').toLowerCase().includes(query)
      );
    });
  }, [searchQuery, users]);

  const getRoleBadge = (role: string) => {
    const normalized = String(role || '').toUpperCase();
    if (normalized === 'SUPER_ADMIN') return { label: 'Super Admin', className: styles.roleAdmin };
    if (normalized === 'ADMIN') return { label: 'Admin', className: styles.roleManager };
    return { label: 'Support', className: styles.roleStaff };
  };

  const formatLastLogin = (date: string | null) => {
    if (!date) return 'Nunca acessou';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return d.toLocaleDateString('pt-BR');
  };

  const handleDeactivate = async (id: string) => {
    if (!isSuperAdmin) return;
    if (!confirm('Tem certeza que deseja desativar este admin?')) return;
    try {
      await adminApi.post(`/api/v1/platform-users/${encodeURIComponent(id)}/deactivate`);
      await loadUsers();
    } catch (err) {
      setError((err as Error).message || 'Erro ao desativar admin.');
    } finally {
      setActiveDropdown(null);
    }
  };

  const handleCreate = async () => {
    if (!isSuperAdmin) return;
    const payload: CreatePlatformUserPayload = {
      email: createEmail.trim(),
      full_name: createFullName.trim() || null,
      role: createRole,
      temp_password: createTempPassword,
    };
    if (!payload.email || !payload.temp_password || payload.temp_password.length < 12) {
      setError('Preencha email e senha temporária com no mínimo 12 caracteres.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await adminApi.post<PlatformUser>('/api/v1/platform-users/', payload);
      setShowCreateForm(false);
      setCreateEmail('');
      setCreateFullName('');
      setCreateRole('ADMIN');
      setCreateTempPassword('');
      await loadUsers();
    } catch (err) {
      setError((err as Error).message || 'Erro ao criar admin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Platform Admins</h1>
          <p className={styles.subtitle}>Gerencie usuários administrativos da plataforma</p>
        </div>
        {isSuperAdmin && (
          <button className={styles.addButton} onClick={() => setShowCreateForm((v) => !v)}>
            <Plus size={18} />
            {showCreateForm ? 'Cancelar' : 'Novo Admin'}
          </button>
        )}
      </div>

      {showCreateForm && isSuperAdmin && (
        <div className={styles.tableContainer} style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <input
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--color-border)' }}
              placeholder="Email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
            />
            <input
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--color-border)' }}
              placeholder="Nome completo (opcional)"
              value={createFullName}
              onChange={(e) => setCreateFullName(e.target.value)}
            />
            <select
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--color-border)' }}
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as CreatePlatformUserPayload['role'])}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="SUPPORT">SUPPORT</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
            <input
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--color-border)' }}
              type="password"
              placeholder="Senha temporária (mín. 12)"
              value={createTempPassword}
              onChange={(e) => setCreateTempPassword(e.target.value)}
            />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <button className={styles.addButton} disabled={saving} onClick={handleCreate}>
              {saving ? 'Criando...' : 'Criar Admin'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.toolbar}>
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar por nome, email ou role..." />
        <div className={styles.filterInfo}>
          {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {error && (
        <div className={styles.tableContainer} style={{ padding: '1rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={48} />
            <h3>Nenhum usuário encontrado</h3>
            <p>Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Função</th>
                <th>Status</th>
                <th>Último Acesso</th>
                <th>Criado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const roleConfig = getRoleBadge(user.role);
                return (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.avatar}>
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className={styles.userName}>{user.full_name || '-'}</span>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${roleConfig.className}`}>
                        <Shield size={12} />
                        {roleConfig.label}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${user.is_active ? styles.statusActive : styles.statusInactive}`}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{formatLastLogin(user.last_login_at)}</td>
                    <td className={styles.dateCell}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          className={styles.moreButton}
                          onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {activeDropdown === user.id && (
                          <div ref={dropdownRef} className={styles.dropdown}>
                            <button className={styles.dropdownItem} onClick={() => router.push(`/admin/users/${user.id}`)}>
                              <Eye size={16} />
                              Visualizar
                            </button>
                            {isSuperAdmin && user.is_active && (
                              <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={() => handleDeactivate(user.id)}>
                                <Trash2 size={16} />
                                Desativar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
