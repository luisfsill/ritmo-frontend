'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Mail, Phone, Loader2 } from 'lucide-react';
import { Button, SearchInput } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import styles from './clients.module.css';

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

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Clientes</h1>
                    <p className={styles.subtitle}>Gerencie seus clientes e histórico</p>
                </div>
                <Button leftIcon={<Plus size={18} />}>
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
                                            <button className={`${styles.actionButton} ${styles.danger}`} onClick={() => handleDelete(client.id)} title="Excluir"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
