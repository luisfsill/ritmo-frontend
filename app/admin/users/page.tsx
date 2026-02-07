'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Edit2, Trash2, Eye, Shield, Users, Plus } from 'lucide-react';
import { SearchInput } from '@/components/ui';
import styles from './users.module.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  tenant_name: string;
  tenant_id: string;
  status: 'active' | 'inactive';
  last_login: string | null;
  created_at: string;
}

// Dados mock
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin Sistema',
    email: 'admin@admin.com',
    role: 'admin',
    tenant_name: 'Sistema',
    tenant_id: 'system',
    status: 'active',
    last_login: '2025-12-27T10:30:00',
    created_at: '2025-01-01',
  },
  {
    id: '2',
    name: 'Maria Silva',
    email: 'maria@salaobeleza.com',
    role: 'manager',
    tenant_name: 'Salão Beleza Total',
    tenant_id: '1',
    status: 'active',
    last_login: '2025-12-26T15:00:00',
    created_at: '2025-01-15',
  },
  {
    id: '3',
    name: 'João Santos',
    email: 'joao@clinicapremium.com',
    role: 'staff',
    tenant_name: 'Clínica Estética Premium',
    tenant_id: '2',
    status: 'active',
    last_login: '2025-12-25T09:00:00',
    created_at: '2025-01-10',
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana@barbearia.com',
    role: 'manager',
    tenant_name: 'Barbearia Style',
    tenant_id: '3',
    status: 'inactive',
    last_login: null,
    created_at: '2025-01-05',
  },
];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 500);
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.tenant_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: User['role']) => {
    const config = {
      admin: { label: 'Admin', className: styles.roleAdmin },
      manager: { label: 'Gerente', className: styles.roleManager },
      staff: { label: 'Equipe', className: styles.roleStaff },
    };
    return config[role];
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(users.filter((u) => u.id !== id));
    }
    setActiveDropdown(null);
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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Usuários</h1>
          <p className={styles.subtitle}>Gerencie todos os usuários do sistema</p>
        </div>
        <button className={styles.addButton}>
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      {/* Search */}
      <div className={styles.toolbar}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por nome, email ou empresa..."
        />
        <div className={styles.filterInfo}>
          {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
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
                <th>Empresa</th>
                <th>Função</th>
                <th>Status</th>
                <th>Último Acesso</th>
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
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className={styles.userName}>{user.name}</span>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.tenantName}>{user.tenant_name}</span>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${roleConfig.className}`}>
                        {user.role === 'admin' && <Shield size={12} />}
                        {roleConfig.label}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          user.status === 'active' ? styles.statusActive : styles.statusInactive
                        }`}
                      >
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {formatLastLogin(user.last_login)}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          className={styles.moreButton}
                          onClick={() =>
                            setActiveDropdown(activeDropdown === user.id ? null : user.id)
                          }
                        >
                          <MoreVertical size={18} />
                        </button>
                        {activeDropdown === user.id && (
                          <div className={styles.dropdown}>
                            <button 
                              className={styles.dropdownItem}
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                            >
                              <Eye size={16} />
                              Visualizar
                            </button>
                            <button 
                              className={styles.dropdownItem}
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                            >
                              <Edit2 size={16} />
                              Editar
                            </button>
                            <button
                              className={`${styles.dropdownItem} ${styles.danger}`}
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 size={16} />
                              Excluir
                            </button>
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
