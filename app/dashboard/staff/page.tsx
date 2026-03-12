'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Modal, ModalFooter, SearchInput, useConfirmDialog, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { getCatalog, type CatalogResponse, type CatalogService } from '@/lib/catalog';
import styles from './staff.module.css';

interface StaffFormData {
    display_name: string;
    is_active: boolean;
    service_ids: string[];
}

interface StaffApiItem {
    id: string;
    display_name: string;
    is_active: boolean;
}

interface StaffItem extends StaffApiItem {
    service_ids: string[];
}

interface StaffServiceOption extends CatalogService {
    isLinkedInactive?: boolean;
}

const emptyForm = (): StaffFormData => ({
    display_name: '',
    is_active: true,
    service_ids: [],
});

export default function StaffPage() {
    const { showToast } = useToast();
    const { confirm: confirmDialog } = useConfirmDialog();
    const [staff, setStaff] = useState<StaffItem[]>([]);
    const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<StaffFormData>(emptyForm);

    const selectableServices = useMemo<StaffServiceOption[]>(() => {
        const services = catalog?.services || [];
        if (!editingStaff) {
            return services.filter((service) => service.is_active);
        }
        const linkedServiceIds = new Set(editingStaff.service_ids);
        return services.filter((service) => service.is_active || linkedServiceIds.has(service.id)).map((service) => ({
            ...service,
            isLinkedInactive: !service.is_active && linkedServiceIds.has(service.id),
        }));
    }, [catalog, editingStaff]);

    const loadStaff = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [staffRows, catalogSnapshot] = await Promise.all([
                api.get<StaffApiItem[]>('/api/v1/staff'),
                getCatalog({ force: true }),
            ]);

            const serviceIdsByStaffId = new Map<string, string[]>();
            for (const link of catalogSnapshot.staff_service_links || []) {
                const current = serviceIdsByStaffId.get(link.staff_id) || [];
                current.push(link.service_id);
                serviceIdsByStaffId.set(link.staff_id, current);
            }

            setCatalog(catalogSnapshot);
            setStaff(
                staffRows.map((member) => ({
                    ...member,
                    service_ids: serviceIdsByStaffId.get(member.id) || [],
                })),
            );
            setError(null);
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.status === 0) {
                setError('O servico esta fora do ar no momento. Contate o administrador.');
            } else {
                setError(apiError.message || 'Erro ao carregar equipe. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadStaff();
    }, [loadStaff]);

    const filteredStaff = useMemo(
        () =>
            staff.filter((member) =>
                member.display_name.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
        [searchQuery, staff],
    );

    const getServiceNames = useCallback(
        (serviceIds: string[]) => {
            const names = serviceIds
                .map((serviceId) => catalog?.services.find((service) => service.id === serviceId)?.name)
                .filter((value): value is string => Boolean(value));
            return names.length > 0 ? names.join(', ') : 'Nenhum servico vinculado';
        },
        [catalog],
    );

    const resetForm = () => {
        setFormData(emptyForm());
    };

    const openCreateModal = () => {
        setEditingStaff(null);
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (member: StaffItem) => {
        setEditingStaff(member);
        setFormData({
            display_name: member.display_name,
            is_active: member.is_active,
            service_ids: [...member.service_ids],
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStaff(null);
        resetForm();
    };

    const toggleService = (serviceId: string) => {
        setFormData((current) => ({
            ...current,
            service_ids: current.service_ids.includes(serviceId)
                ? current.service_ids.filter((value) => value !== serviceId)
                : [...current.service_ids, serviceId],
        }));
    };

    const handleDelete = async (id: string, displayName: string) => {
        const confirmed = await confirmDialog({
            title: 'Excluir profissional',
            message: `Tem certeza que deseja excluir ${displayName}? O profissional sera desativado.`,
            confirmLabel: 'Excluir',
            cancelLabel: 'Cancelar',
            variant: 'danger',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/api/v1/staff/${id}`);
            showToast('Profissional excluido com sucesso.', 'success');
            await loadStaff();
        } catch (err) {
            const apiError = err as ApiError;
            showToast(apiError.message || 'Erro ao excluir profissional. Tente novamente.', 'error');
        }
    };

    const handleSave = async () => {
        if (!formData.display_name.trim()) {
            showToast('O nome do profissional e obrigatorio.', 'error');
            return;
        }
        if (formData.service_ids.length === 0) {
            showToast('Selecione pelo menos um servico para o profissional.', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                display_name: formData.display_name.trim(),
                is_active: formData.is_active,
                service_ids: formData.service_ids,
            };

            if (editingStaff) {
                await api.patch(`/api/v1/staff/${editingStaff.id}`, payload);
                showToast('Profissional atualizado com sucesso.', 'success');
            } else {
                await api.post('/api/v1/staff', payload);
                showToast('Profissional criado com sucesso.', 'success');
            }

            closeModal();
            await loadStaff();
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.message.includes('staff_services_required')) {
                showToast('Selecione ao menos um servico antes de salvar.', 'error');
            } else if (apiError.message.includes('invalid_service_ids')) {
                showToast('Ha servicos invalidos ou inativos na selecao. Atualize a pagina.', 'error');
            } else {
                showToast(apiError.message || 'Erro ao salvar profissional. Tente novamente.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Equipe</h1>
                    <p className={styles.subtitle}>Gerencie os profissionais e os servicos vinculados.</p>
                </div>
                <Button leftIcon={<Plus size={18} />} onClick={openCreateModal}>
                    Novo Profissional
                </Button>
            </div>

            <div className={styles.toolbar}>
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar por nome..."
                />
                <div className={styles.count}>
                    {filteredStaff.length} profissiona{filteredStaff.length !== 1 ? 'is' : 'l'}
                </div>
            </div>

            {isLoading ? (
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <span>Carregando equipe...</span>
                </div>
            ) : error ? (
                <div className={styles.errorState}>
                    <p>{error}</p>
                    <Button variant="secondary" onClick={() => void loadStaff()}>Tentar novamente</Button>
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>EQ</div>
                    <h3>Nenhum profissional encontrado</h3>
                    <p>{searchQuery ? 'Tente uma busca diferente' : 'Adicione seu primeiro profissional'}</p>
                </div>
            ) : (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Profissional</th>
                                    <th>Servicos</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStaff.map((member) => (
                                    <tr key={member.id}>
                                        <td>
                                            <div className={styles.tableName}>
                                                <div className={styles.avatar}>
                                                    {member.display_name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className={styles.name}>{member.display_name}</span>
                                            </div>
                                        </td>
                                        <td className={styles.serviceCell}>{getServiceNames(member.service_ids)}</td>
                                        <td>
                                            <span className={`${styles.status} ${member.is_active ? styles.active : styles.inactive}`}>
                                                {member.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={() => openEditModal(member)}
                                                    title="Editar"
                                                    aria-label={`Editar ${member.display_name}`}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.actionButton} ${styles.danger}`}
                                                    onClick={() => void handleDelete(member.id, member.display_name)}
                                                    title="Excluir"
                                                    aria-label={`Excluir ${member.display_name}`}
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
                        {filteredStaff.map((member) => (
                            <article key={`mobile-${member.id}`} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.avatar}>
                                        {member.display_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.info}>
                                        <h3 className={styles.name}>{member.display_name}</h3>
                                        <p className={styles.servicesPreview}>{getServiceNames(member.service_ids)}</p>
                                    </div>
                                    <span className={`${styles.status} ${member.is_active ? styles.active : styles.inactive}`}>
                                        {member.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>

                                <div className={styles.cardFooter}>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => openEditModal(member)}
                                        title="Editar"
                                        aria-label={`Editar ${member.display_name}`}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.danger}`}
                                        onClick={() => void handleDelete(member.id, member.display_name)}
                                        title="Excluir"
                                        aria-label={`Excluir ${member.display_name}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </>
            )}

            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingStaff ? 'Editar Profissional' : 'Novo Profissional'}
                size="sm"
                showCloseButton={false}
                closeOnOverlayClick={false}
                closeOnEscape={false}
            >
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nome do Profissional *</label>
                        <Input
                            value={formData.display_name}
                            onChange={(e) => setFormData((current) => ({ ...current, display_name: e.target.value }))}
                            placeholder="Ex: Maria Silva"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Servicos atendidos *</label>
                        <div className={styles.serviceChecklist}>
                            {selectableServices.length === 0 ? (
                                <p className={styles.serviceEmpty}>Cadastre um servico ativo antes de criar profissionais.</p>
                            ) : (
                                selectableServices.map((service: StaffServiceOption) => (
                                    <label key={service.id} className={styles.serviceOption}>
                                        <input
                                            type="checkbox"
                                            checked={formData.service_ids.includes(service.id)}
                                            onChange={() => toggleService(service.id)}
                                        />
                                        <span className={styles.serviceOptionText}>
                                            {service.name}
                                            {service.isLinkedInactive ? (
                                                <span className={styles.serviceOptionMeta}>Inativo vinculado</span>
                                            ) : null}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData((current) => ({ ...current, is_active: e.target.checked }))}
                            />
                            <span>Profissional ativo</span>
                        </label>
                    </div>
                </div>

                <ModalFooter>
                    <Button variant="secondary" onClick={closeModal} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving || selectableServices.length === 0}>
                        {saving ? (
                            <>
                                <Loader2 size={16} className={styles.spinner} />
                                Salvando...
                            </>
                        ) : editingStaff ? 'Salvar' : 'Criar Profissional'}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
