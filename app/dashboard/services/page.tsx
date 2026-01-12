'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Clock, DollarSign, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import styles from './services.module.css';

interface Service {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    buffer_before_minutes: number;
    buffer_after_minutes: number;
    price_cents: number;
    requires_deposit: boolean;
    deposit_cents: number | null;
    is_active: boolean;
}

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.get<Service[]>('/api/v1/services');
            setServices(data);
            setError(null);
        } catch (err) {
            const apiError = err as ApiError;
            
            if (apiError.status === 0) {
                setError('O serviço está fora do ar no momento. Contate o administrador.');
            } else {
                setError(apiError.message || 'Erro ao carregar serviços. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

        try {
            await api.delete(`/api/v1/services/${id}`);
            setServices(services.filter(s => s.id !== id));
        } catch (err) {
            const apiError = err as ApiError;
            
            if (apiError.status === 0) {
                alert('O serviço está fora do ar no momento. Contate o administrador.');
            } else {
                alert(apiError.message || 'Erro ao excluir serviço. Tente novamente.');
            }
        }
    };

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    const formatPriceFromCents = (priceCents: number) => {
        return formatPrice(priceCents / 100);
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Serviços</h1>
                    <p className={styles.subtitle}>Gerencie os serviços oferecidos</p>
                </div>
                <Button
                    leftIcon={<Plus size={18} />}
                    onClick={() => {
                        setEditingService(null);
                        setShowModal(true);
                    }}
                >
                    Novo Serviço
                </Button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar serviço..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.count}>
                    {filteredServices.length} serviço{filteredServices.length !== 1 ? 's' : ''}
                </div>
            </div>

            {isLoading ? (
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <span>Carregando serviços...</span>
                </div>
            ) : error ? (
                <div className={styles.errorState}>
                    <p>{error}</p>
                    <Button variant="secondary" onClick={loadServices}>
                        Tentar novamente
                    </Button>
                </div>
            ) : filteredServices.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>✂️</div>
                    <h3>Nenhum serviço encontrado</h3>
                    <p>
                        {searchQuery
                            ? 'Tente uma busca diferente'
                            : 'Adicione seu primeiro serviço para começar'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={() => setShowModal(true)}>
                            <Plus size={18} />
                            Adicionar Serviço
                        </Button>
                    )}
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredServices.map((service) => (
                        <div key={service.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>{service.name}</h3>
                                <span className={`${styles.status} ${service.is_active ? styles.active : styles.inactive}`}>
                                    {service.is_active ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>

                            {service.description && (
                                <p className={styles.cardDescription}>{service.description}</p>
                            )}

                            <div className={styles.cardMeta}>
                                <div className={styles.metaItem}>
                                    <Clock size={16} />
                                    <span>{formatDuration(service.duration_minutes)}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <DollarSign size={16} />
                                    <span>{formatPriceFromCents(service.price_cents)}</span>
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <button
                                    className={styles.actionButton}
                                    onClick={() => {
                                        setEditingService(service);
                                        setShowModal(true);
                                    }}
                                    title="Editar"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    className={`${styles.actionButton} ${styles.danger}`}
                                    onClick={() => handleDelete(service.id)}
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
