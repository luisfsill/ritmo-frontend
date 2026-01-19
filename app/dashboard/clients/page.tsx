'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Mail, Phone, Loader2, Edit2 } from 'lucide-react';
import { Button, Input, SearchInput, Modal, ModalFooter } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import styles from './clients.module.css';

interface ClientFormData {
    full_name: string;
    phone: string;
    email: string;
}

interface Client {
    id: string;
    full_name: string;
    status: string;
    whatsapp_handle: string | null;
    tags: string[] | null;
    email: string | null;
    phone: string | null;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<ClientFormData>({
        full_name: '',
        phone: '',
        email: '',
    });

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.get<Client[]>('/api/v1/clients');
            setClients(data);
            setError(null);
        } catch (err) {
            const apiError = err as ApiError;
            
            if (apiError.status === 0) {
                setError('O serviço está fora do ar no momento. Contate o administrador.');
            } else {
                setError(apiError.message || 'Erro ao carregar clientes. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação é irreversível.')) return;
        try {
            await api.delete(`/api/v1/clients/${id}`, { confirm: true });
            setClients(clients.filter(c => c.id !== id));
        } catch (err) {
            const apiError = err as ApiError;
            
            if (apiError.status === 0) {
                alert('O serviço está fora do ar no momento. Contate o administrador.');
            } else {
                alert(apiError.message || 'Erro ao excluir cliente. Tente novamente.');
            }
        }
    };

    const filteredClients = clients.filter(client =>
        client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.phone ?? '').includes(searchQuery) ||
        (client.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.whatsapp_handle ?? '').includes(searchQuery)
    );

    const resetForm = () => {
        setFormData({
            full_name: '',
            phone: '',
            email: '',
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
            alert('O nome do cliente é obrigatório');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim() || null,
                email: formData.email.trim() || null,
            };

            if (editingClient) {
                const updated = await api.patch<Client>(`/api/v1/clients/${editingClient.id}`, payload);
                setClients(clients.map(c => c.id === editingClient.id ? updated : c));
            } else {
                const created = await api.post<Client>('/api/v1/clients', payload);
                setClients([...clients, created]);
            }

            closeModal();
        } catch (err) {
            const apiError = err as ApiError;
            alert(apiError.message || 'Erro ao salvar cliente. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

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
                    placeholder="Buscar por nome, telefone ou email..."
                />
                <div className={styles.count}>
                    {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
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
                    <Button variant="secondary" onClick={loadClients}>Tentar novamente</Button>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📋</div>
                    <h3>Nenhum cliente encontrado</h3>
                    <p>{searchQuery ? 'Tente uma busca diferente' : 'Clientes serão adicionados automaticamente ao agendar'}</p>
                </div>
            ) : (
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
                            {filteredClients.map((client) => (
                                <tr key={client.id}>
                                    <td>
                                        <div className={styles.clientName}>
                                            <div className={styles.avatar}>{client.full_name.charAt(0).toUpperCase()}</div>
                                            <span>{client.full_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.contact}>
                                            {client.phone && <div><Phone size={14} /> {client.phone}</div>}
                                            {client.email && <div><Mail size={14} /> {client.email}</div>}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.badge}>{client.status}</span>
                                    </td>
                                    <td>
                                        {(client.tags ?? []).join(', ') || '-'}
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionButton} onClick={() => openEditModal(client)} title="Editar"><Edit2 size={16} /></button>
                                            <button className={`${styles.actionButton} ${styles.danger}`} onClick={() => handleDelete(client.id)} title="Excluir"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Criar/Editar Cliente */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                size="sm"
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
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                        ) : (
                            editingClient ? 'Salvar' : 'Criar Cliente'
                        )}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
