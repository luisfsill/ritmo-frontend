'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Edit2, Trash2, Eye, MessageCircle, Plus, Building2 } from 'lucide-react';
import { SearchInput } from '@/components/ui';
import styles from './tenants.module.css';

interface Tenant {
  id: string;
  slug: string;
  business_name: string;
  business_type: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  whatsapp_connected: boolean;
  created_at: string;
  users_count: number;
}

// Dados mock - em produção viriam da API
const mockTenants: Tenant[] = [
  {
    id: '1',
    slug: 'salao-beleza',
    business_name: 'Salão Beleza Total',
    business_type: 'Salão de Beleza',
    phone: '(11) 99999-1111',
    email: 'contato@belezatotal.com',
    status: 'active',
    whatsapp_connected: true,
    created_at: '2025-01-15',
    users_count: 3,
  },
  {
    id: '2',
    slug: 'clinica-estetica',
    business_name: 'Clínica Estética Premium',
    business_type: 'Clínica',
    phone: '(11) 99999-2222',
    email: 'contato@clinicapremium.com',
    status: 'active',
    whatsapp_connected: false,
    created_at: '2025-01-10',
    users_count: 5,
  },
  {
    id: '3',
    slug: 'barbearia-style',
    business_name: 'Barbearia Style',
    business_type: 'Barbearia',
    phone: '(11) 99999-3333',
    email: 'contato@barbeariastyle.com',
    status: 'inactive',
    whatsapp_connected: false,
    created_at: '2025-01-05',
    users_count: 2,
  },
];

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    // Simula carregamento
    setTimeout(() => {
      setTenants(mockTenants);
      setLoading(false);
    }, 500);
  }, []);

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Tenant['status']) => {
    const config = {
      active: { label: 'Ativo', className: styles.statusActive },
      inactive: { label: 'Inativo', className: styles.statusInactive },
      suspended: { label: 'Suspenso', className: styles.statusSuspended },
    };
    return config[status];
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')) {
      setTenants(tenants.filter((t) => t.id !== id));
    }
    setActiveDropdown(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Empresas</h1>
          <p className={styles.subtitle}>Gerencie as empresas cadastradas no sistema</p>
        </div>
        <button className={styles.addButton}>
          <Plus size={18} />
          Nova Empresa
        </button>
      </div>

      {/* Search and Filters */}
      <div className={styles.toolbar}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por nome, email ou slug..."
        />
        <div className={styles.filterInfo}>
          {filteredTenants.length} empresa{filteredTenants.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : filteredTenants.length === 0 ? (
          <div className={styles.emptyState}>
            <Building2 size={48} />
            <h3>Nenhuma empresa encontrada</h3>
            <p>Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Contato</th>
                <th>WhatsApp</th>
                <th>Usuários</th>
                <th>Status</th>
                <th>Criado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => {
                const statusConfig = getStatusBadge(tenant.status);
                return (
                  <tr key={tenant.id}>
                    <td>
                      <div className={styles.tenantInfo}>
                        <span className={styles.tenantName}>{tenant.business_name}</span>
                        <span className={styles.tenantSlug}>/{tenant.slug}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.contactInfo}>
                        <span>{tenant.email}</span>
                        <span className={styles.phone}>{tenant.phone}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.whatsappBadge} ${
                          tenant.whatsapp_connected ? styles.connected : ''
                        }`}
                      >
                        <MessageCircle size={14} />
                        {tenant.whatsapp_connected ? 'Conectado' : 'Desconectado'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.usersCount}>{tenant.users_count}</span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          className={styles.moreButton}
                          onClick={() =>
                            setActiveDropdown(activeDropdown === tenant.id ? null : tenant.id)
                          }
                        >
                          <MoreVertical size={18} />
                        </button>
                        {activeDropdown === tenant.id && (
                          <div className={styles.dropdown}>
                            <button 
                              className={styles.dropdownItem}
                              onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                            >
                              <Eye size={16} />
                              Visualizar
                            </button>
                            <button 
                              className={styles.dropdownItem}
                              onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                            >
                              <Edit2 size={16} />
                              Editar
                            </button>
                            <button
                              className={`${styles.dropdownItem} ${styles.danger}`}
                              onClick={() => handleDelete(tenant.id)}
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
