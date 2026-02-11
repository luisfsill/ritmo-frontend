'use client';

import { useCallback, useEffect, useState } from 'react';
import { Edit2, Loader2, Mail, Phone, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Modal, ModalFooter, SearchInput, useConfirmDialog, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import styles from './clients.module.css';

interface ClientAddress {
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country_code?: string | null;
}

interface ClientFormData {
    full_name: string;
    phone: string;
    email: string;
    address: ClientAddress;
}

interface Client {
    id: string;
    full_name: string;
    status: string;
    whatsapp_handle: string | null;
    tags: string[] | null;
    email: string | null;
    phone: string | null;
    address: ClientAddress | null;
}

interface ClientQueryResponse {
    items: Client[];
    next_cursor: string | null;
    total: number;
}

const PAGE_SIZE = 30;

// Formata telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
const formatPhoneNumber = (value: string): string => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = digits.slice(0, 11);
    
    if (limited.length === 0) return '';
    if (limited.length <= 2) return `(${limited}`;
    if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    if (limited.length <= 10) {
        // Telefone fixo: (XX) XXXX-XXXX
        return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
    }
    // Celular: (XX) XXXXX-XXXX
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
};

// Extrai apenas os dígitos do telefone formatado
const extractPhoneDigits = (value: string): string => {
    return value.replace(/\D/g, '');
};

// Formata CEP brasileiro: XXXXX-XXX
const formatPostalCode = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length === 0) return '';
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

// Extrai apenas os dígitos do CEP formatado
const extractPostalCodeDigits = (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 8);
};

const emptyAddress = (): ClientAddress => ({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: '',
});

const normalizeAddressForApi = (address: ClientAddress): ClientAddress | null => {
    const normalized: ClientAddress = {
        street: address.street?.trim() || null,
        number: address.number?.trim() || null,
        complement: address.complement?.trim() || null,
        neighborhood: address.neighborhood?.trim() || null,
        city: address.city?.trim() || null,
        state: address.state?.trim() || null,
        postal_code: address.postal_code?.trim() || null,
        country_code: address.country_code?.trim().toUpperCase() || null,
    };
    const hasAnyValue = Object.values(normalized).some((value) => Boolean(value));
    return hasAnyValue ? normalized : null;
};

const validateAddress = (address: ClientAddress | null): string | null => {
    if (!address) return null;
    const countryCode = address.country_code || '';
    if (countryCode && countryCode.length !== 2) {
        return 'País deve ter 2 letras (ex: BR).';
    }
    const postalCode = address.postal_code || '';
    const postalDigits = postalCode.replace(/\D/g, '');
    if (postalCode && postalDigits.length > 0 && postalDigits.length < 5) {
        return 'CEP parece inválido.';
    }
    return null;
};

export default function ClientsPage() {
    const { showToast } = useToast();
    const { confirm: confirmDialog } = useConfirmDialog();
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<ClientFormData>({
        full_name: '',
        phone: '',
        email: '',
        address: emptyAddress(),
    });

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedQuery(searchQuery.trim());
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [searchQuery]);

    const loadClients = useCallback(async (reset: boolean, cursor: string | null, query: string) => {
        if (reset) {
            setIsLoading(true);
        } else {
            if (!cursor) return;
            setIsLoadingMore(true);
        }
        setError(null);

        try {
            const params = new URLSearchParams();
            params.set('limit', String(PAGE_SIZE));
            if (query) params.set('q', query);
            if (!reset && cursor) params.set('cursor', cursor);
            const endpoint = `/api/v1/clients/query?${params.toString()}`;
            const data = await api.get<ClientQueryResponse>(endpoint);

            setClients((previous) => {
                if (reset) return data.items;
                const known = new Set(previous.map((item) => item.id));
                const additions = data.items.filter((item) => !known.has(item.id));
                return [...previous, ...additions];
            });
            setNextCursor(data.next_cursor);
            setTotalCount(data.total || 0);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Erro ao carregar clientes. Tente novamente.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        void loadClients(true, null, debouncedQuery);
    }, [debouncedQuery, loadClients]);

    const handleDelete = async (id: string) => {
        const confirmed = await confirmDialog({
            title: 'Excluir cliente',
            message: 'Tem certeza que deseja excluir este cliente? Esta ação é irreversível.',
            confirmLabel: 'Excluir',
            cancelLabel: 'Cancelar',
            variant: 'danger',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/api/v1/clients/${id}`, { confirm: true });
            showToast('Cliente excluído com sucesso.', 'success');
            await loadClients(true, null, debouncedQuery);
        } catch (err) {
            const apiError = err as ApiError;
            showToast(apiError.message || 'Erro ao excluir cliente. Tente novamente.', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            phone: '',
            email: '',
            address: emptyAddress(),
        });
    };

    const openCreateModal = () => {
        setEditingClient(null);
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setFormData({
            full_name: client.full_name,
            phone: client.phone || '',
            email: client.email || '',
            address: {
                street: client.address?.street || '',
                number: client.address?.number || '',
                complement: client.address?.complement || '',
                neighborhood: client.address?.neighborhood || '',
                city: client.address?.city || '',
                state: client.address?.state || '',
                postal_code: client.address?.postal_code || '',
                country_code: client.address?.country_code || '',
            },
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingClient(null);
        resetForm();
    };

    const handleSave = async () => {
        if (!formData.full_name.trim()) {
            showToast('O nome do cliente é obrigatório.', 'error');
            return;
        }

        setSaving(true);
        try {
            const normalizedAddress = normalizeAddressForApi(formData.address);
            const addressError = validateAddress(normalizedAddress);
            if (addressError) {
                showToast(addressError, 'error');
                return;
            }
            const payload = {
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim() || null,
                email: formData.email.trim() || null,
                address: normalizedAddress,
            };

            if (editingClient) {
                await api.patch<Client>(`/api/v1/clients/${editingClient.id}`, payload);
                showToast('Cliente atualizado com sucesso.', 'success');
            } else {
                await api.post<Client>('/api/v1/clients', payload);
                showToast('Cliente criado com sucesso.', 'success');
            }

            closeModal();
            await loadClients(true, null, debouncedQuery);
        } catch (err) {
            const apiError = err as ApiError;
            showToast(apiError.message || 'Erro ao salvar cliente. Tente novamente.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const hasNoResults = !isLoading && !error && clients.length === 0;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Clientes</h1>
                    <p className={styles.subtitle}>Gerencie seus clientes e histórico</p>
                </div>
                <Button leftIcon={<Plus size={18} />} onClick={openCreateModal}>
                    Novo Cliente
                </Button>
            </div>

            <div className={styles.toolbar}>
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar por nome, telefone, e-mail ou WhatsApp..."
                />
                <div className={styles.count}>
                    {clients.length} de {totalCount} cliente{totalCount !== 1 ? 's' : ''}
                </div>
            </div>

            {isLoading ? (
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <span>Carregando clientes...</span>
                </div>
            ) : error ? (
                <div className={styles.errorState}>
                    <p>{error}</p>
                    <Button variant="secondary" onClick={() => void loadClients(true, null, debouncedQuery)}>
                        Tentar novamente
                    </Button>
                </div>
            ) : hasNoResults ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📋</div>
                    <h3>Nenhum cliente encontrado</h3>
                    <p>{debouncedQuery ? 'Tente uma busca diferente' : 'Clientes serão adicionados automaticamente ao agendar'}</p>
                    {!debouncedQuery && (
                        <Button onClick={openCreateModal}>
                            <Plus size={18} />
                            Adicionar cliente
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Contato</th>
                                    <th>Status</th>
                                    <th>Tags</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map((client) => (
                                    <tr key={client.id}>
                                        <td>
                                            <div className={styles.clientName}>
                                                <div className={styles.avatar}>{client.full_name.charAt(0).toUpperCase()}</div>
                                                <span>{client.full_name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.contact}>
                                                {client.phone && (
                                                    <div>
                                                        <Phone size={14} /> {client.phone}
                                                    </div>
                                                )}
                                                {client.email && (
                                                    <div>
                                                        <Mail size={14} /> {client.email}
                                                    </div>
                                                )}
                                                {client.whatsapp_handle && (
                                                    <div>WhatsApp: {client.whatsapp_handle}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.badge}>{client.status}</span>
                                        </td>
                                        <td>{(client.tags ?? []).join(', ') || '-'}</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={() => openEditModal(client)}
                                                    title="Editar"
                                                    aria-label={`Editar ${client.full_name}`}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.actionButton} ${styles.danger}`}
                                                    onClick={() => void handleDelete(client.id)}
                                                    title="Excluir"
                                                    aria-label={`Excluir ${client.full_name}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.mobileList}>
                        {clients.map((client) => (
                            <article key={client.id} className={styles.mobileCard}>
                                <div className={styles.mobileHeader}>
                                    <div className={styles.clientName}>
                                        <div className={styles.avatar}>{client.full_name.charAt(0).toUpperCase()}</div>
                                        <span>{client.full_name}</span>
                                    </div>
                                    <span className={styles.badge}>{client.status}</span>
                                </div>
                                <div className={styles.contact}>
                                    {client.phone && (
                                        <div>
                                            <Phone size={14} /> {client.phone}
                                        </div>
                                    )}
                                    {client.email && (
                                        <div>
                                            <Mail size={14} /> {client.email}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.mobileMeta}>Tags: {(client.tags ?? []).join(', ') || '-'}</div>
                                <div className={styles.actions}>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => openEditModal(client)}
                                        aria-label={`Editar ${client.full_name}`}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.danger}`}
                                        onClick={() => void handleDelete(client.id)}
                                        aria-label={`Excluir ${client.full_name}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>

                    {nextCursor && (
                        <div className={styles.loadMore}>
                            <Button
                                variant="secondary"
                                onClick={() => void loadClients(false, nextCursor, debouncedQuery)}
                                isLoading={isLoadingMore}
                            >
                                Carregar mais
                            </Button>
                        </div>
                    )}
                </>
            )}

            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                size="md"
                showCloseButton={false}
                closeOnOverlayClick={false}
                closeOnEscape={false}
            >
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nome completo *</label>
                        <Input
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Nome do cliente"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Telefone / WhatsApp</label>
                        <Input
                            type="tel"
                            value={formatPhoneNumber(formData.phone)}
                            onChange={(e) => setFormData({ ...formData, phone: extractPhoneDigits(e.target.value) })}
                            placeholder="(11) 99999-9999"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>E-mail</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@exemplo.com"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Endereço (opcional)</label>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Logradouro</label>
                        <Input
                            value={formData.address.street || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    address: { ...formData.address, street: e.target.value },
                                })
                            }
                            placeholder="Rua, avenida, etc."
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Número</label>
                        <Input
                            value={formData.address.number || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    address: { ...formData.address, number: e.target.value },
                                })
                            }
                            placeholder="123"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Complemento</label>
                        <Input
                            value={formData.address.complement || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    address: { ...formData.address, complement: e.target.value },
                                })
                            }
                            placeholder="Apto, sala, bloco"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Bairro</label>
                        <Input
                            value={formData.address.neighborhood || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    address: { ...formData.address, neighborhood: e.target.value },
                                })
                            }
                            placeholder="Bairro"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Cidade</label>
                        <Input
                            value={formData.address.city || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    address: { ...formData.address, city: e.target.value },
                                })
                            }
                            placeholder="Cidade"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Estado</label>
                        <Input
                            value={formData.address.state || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    address: { ...formData.address, state: e.target.value },
                                })
                            }
                            placeholder="SP"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>CEP</label>
                        <Input
                            value={formatPostalCode(formData.address.postal_code || '')}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    address: { ...formData.address, postal_code: extractPostalCodeDigits(e.target.value) },
                                })
                            }
                            placeholder="00000-000"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>País</label>
                        <Input
                            value={formData.address.country_code || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    address: { ...formData.address, country_code: e.target.value.toUpperCase() },
                                })
                            }
                            placeholder="BR"
                        />
                    </div>
                </div>

                <ModalFooter>
                    <Button variant="secondary" onClick={closeModal} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 size={16} className={styles.spinner} />
                                Salvando...
                            </>
                        ) : editingClient ? (
                            'Salvar'
                        ) : (
                            'Criar Cliente'
                        )}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
