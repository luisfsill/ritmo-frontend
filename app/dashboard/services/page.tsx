'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, DollarSign, Loader2 } from 'lucide-react';
import { Button, Input, SearchInput, Modal, ModalFooter, useConfirmDialog, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import styles from './services.module.css';

interface ServiceFormData {
    name: string;
    description: string;
    duration_minutes: number;
    buffer_before_minutes: number;
    buffer_after_minutes: number;
    price_cents: number;
    requires_deposit: boolean;
    deposit_cents: number;
    is_active: boolean;
}

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
    const { showToast } = useToast();
    const { confirm: confirmDialog } = useConfirmDialog();
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<ServiceFormData>({
        name: '',
        description: '',
        duration_minutes: 60,
        buffer_before_minutes: 0,
        buffer_after_minutes: 0,
        price_cents: 0,
        requires_deposit: false,
        deposit_cents: 0,
        is_active: true,
    });

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
        const confirmed = await confirmDialog({
            title: 'Excluir serviço',
            message: 'Tem certeza que deseja excluir este serviço?',
            confirmLabel: 'Excluir',
            cancelLabel: 'Cancelar',
            variant: 'danger',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/api/v1/services/${id}`);
            setServices(services.filter(s => s.id !== id));
            showToast('Serviço excluído com sucesso.', 'success');
        } catch (err) {
            const apiError = err as ApiError;
            showToast(apiError.message || 'Erro ao excluir serviço. Tente novamente.', 'error');
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

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            duration_minutes: 60,
            buffer_before_minutes: 0,
            buffer_after_minutes: 0,
            price_cents: 0,
            requires_deposit: false,
            deposit_cents: 0,
            is_active: true,
        });
    };

    const openCreateModal = () => {
        setEditingService(null);
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (service: Service) => {
        setEditingService(service);
        setFormData({
            name: service.name,
            description: service.description || '',
            duration_minutes: service.duration_minutes,
            buffer_before_minutes: service.buffer_before_minutes,
            buffer_after_minutes: service.buffer_after_minutes,
            price_cents: service.price_cents,
            requires_deposit: service.requires_deposit,
            deposit_cents: service.deposit_cents || 0,
            is_active: service.is_active,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingService(null);
        resetForm();
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showToast('O nome do serviço é obrigatório.', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                duration_minutes: formData.duration_minutes,
                buffer_before_minutes: formData.buffer_before_minutes,
                buffer_after_minutes: formData.buffer_after_minutes,
                price_cents: formData.price_cents,
                requires_deposit: formData.requires_deposit,
                deposit_cents: formData.requires_deposit ? formData.deposit_cents : null,
                is_active: formData.is_active,
            };

            if (editingService) {
                const updated = await api.patch<Service>(`/api/v1/services/${editingService.id}`, payload);
                setServices(services.map(s => s.id === editingService.id ? updated : s));
                showToast('Serviço atualizado com sucesso.', 'success');
            } else {
                const created = await api.post<Service>('/api/v1/services', payload);
                setServices([...services, created]);
                showToast('Serviço criado com sucesso.', 'success');
            }

            closeModal();
        } catch (err) {
            const apiError = err as ApiError;
            showToast(apiError.message || 'Erro ao salvar serviço. Tente novamente.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePriceChange = (value: string) => {
        // Remove tudo exceto números
        const numericValue = value.replace(/\D/g, '');
        const cents = parseInt(numericValue, 10) || 0;
        setFormData({ ...formData, price_cents: cents });
    };

    const handleDepositChange = (value: string) => {
        const numericValue = value.replace(/\D/g, '');
        const cents = parseInt(numericValue, 10) || 0;
        setFormData({ ...formData, deposit_cents: cents });
    };

    const formatInputPrice = (cents: number) => {
        if (cents === 0) return '';
        return (cents / 100).toFixed(2).replace('.', ',');
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
                    onClick={openCreateModal}
                >
                    Novo Serviço
                </Button>
            </div>

            <div className={styles.toolbar}>
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar serviço..."
                />
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
                        <Button onClick={openCreateModal}>
                            <Plus size={18} />
                            Adicionar Serviço
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Serviço</th>
                                    <th>Duração</th>
                                    <th>Preço</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredServices.map((service) => (
                                    <tr key={service.id}>
                                        <td>
                                            <div className={styles.tableName}>
                                                <strong>{service.name}</strong>
                                                {service.description ? <span>{service.description}</span> : null}
                                            </div>
                                        </td>
                                        <td>{formatDuration(service.duration_minutes)}</td>
                                        <td>{formatPriceFromCents(service.price_cents)}</td>
                                        <td>
                                            <span className={`${styles.status} ${service.is_active ? styles.active : styles.inactive}`}>
                                                {service.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={() => openEditModal(service)}
                                                    title="Editar"
                                                    aria-label={`Editar ${service.name}`}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.actionButton} ${styles.danger}`}
                                                    onClick={() => void handleDelete(service.id)}
                                                    title="Excluir"
                                                    aria-label={`Excluir ${service.name}`}
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
                        {filteredServices.map((service) => (
                            <article key={`mobile-${service.id}`} className={styles.card}>
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
                                        onClick={() => openEditModal(service)}
                                        title="Editar"
                                        aria-label={`Editar ${service.name}`}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.danger}`}
                                        onClick={() => void handleDelete(service.id)}
                                        title="Excluir"
                                        aria-label={`Excluir ${service.name}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </>
            )}

            {/* Modal de Criar/Editar Serviço */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingService ? 'Editar Serviço' : 'Novo Serviço'}
                size="md"
                showCloseButton={false}
                closeOnOverlayClick={false}
                closeOnEscape={false}
            >
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nome do Serviço *</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Corte de cabelo"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Descrição</label>
                        <textarea
                            className={styles.textarea}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descreva o serviço (opcional)"
                            rows={3}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Duração (minutos) *</label>
                            <Input
                                type="number"
                                min={5}
                                step={5}
                                value={formData.duration_minutes}
                                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Preço (R$) *</label>
                            <Input
                                type="text"
                                value={formatInputPrice(formData.price_cents)}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Intervalo antes (min)</label>
                            <Input
                                type="number"
                                min={0}
                                step={5}
                                value={formData.buffer_before_minutes}
                                onChange={(e) => setFormData({ ...formData, buffer_before_minutes: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Intervalo depois (min)</label>
                            <Input
                                type="number"
                                min={0}
                                step={5}
                                value={formData.buffer_after_minutes}
                                onChange={(e) => setFormData({ ...formData, buffer_after_minutes: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.requires_deposit}
                                onChange={(e) => setFormData({ ...formData, requires_deposit: e.target.checked })}
                            />
                            <span>Requer depósito/sinal</span>
                        </label>
                    </div>

                    {formData.requires_deposit && (
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Valor do depósito (R$)</label>
                            <Input
                                type="text"
                                value={formatInputPrice(formData.deposit_cents)}
                                onChange={(e) => handleDepositChange(e.target.value)}
                                placeholder="0,00"
                            />
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            <span>Serviço ativo</span>
                        </label>
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
                            editingService ? 'Salvar' : 'Criar Serviço'
                        )}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
