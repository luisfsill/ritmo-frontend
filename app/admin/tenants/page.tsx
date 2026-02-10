'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Eye, Edit2, MessageCircle, Building2 } from 'lucide-react';
import { SearchInput } from '@/components/ui';
import { adminApi } from '@/lib/admin-api';
import styles from './tenants.module.css';

interface AdminTenant {
  id: string;
  slug: string;
  business_name: string;
  owner_email: string | null;
  owner_name: string | null;
  status: string | null;
  created_at: string | null;
}

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: '200' });
        const data = await adminApi.get<AdminTenant[]>(`/api/v1/admin/tenants?${params.toString()}`);
        if (!cancelled) {
          setTenants(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || 'Erro ao carregar empresas.');
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

  const filteredTenants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tenants;
    return tenants.filter((tenant) => {
      return (
        tenant.business_name.toLowerCase().includes(query) ||
        tenant.slug.toLowerCase().includes(query) ||
        (tenant.owner_email || '').toLowerCase().includes(query) ||
        (tenant.owner_name || '').toLowerCase().includes(query)
      );
    });
  }, [searchQuery, tenants]);

  const getStatusBadge = (status: string | null) => {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'ACTIVE') return { label: 'Ativo', className: styles.statusActive };
    if (normalized === 'SUSPENDED') return { label: 'Suspenso', className: styles.statusSuspended };
    return { label: 'Inativo', className: styles.statusInactive };
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Empresas</h1>
          <p className={styles.subtitle}>Gerencie as empresas cadastradas no sistema</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por nome, email do owner ou slug..."
        />
        <div className={styles.filterInfo}>
          {filteredTenants.length} empresa{filteredTenants.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : error ? (
          <div className={styles.emptyState}>
            <Building2 size={48} />
            <h3>Falha ao carregar empresas</h3>
            <p>{error}</p>
          </div>
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
                        <span>{tenant.owner_email || '-'}</span>
                        <span className={styles.phone}>{tenant.owner_name || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.whatsappBadge}>
                        <MessageCircle size={14} />
                        N/D
                      </span>
                    </td>
                    <td>
                      <span className={styles.usersCount}>-</span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('pt-BR') : '-'}
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
                          <div ref={dropdownRef} className={styles.dropdown}>
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
                              Gerenciar
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
