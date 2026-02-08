'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Edit2 } from 'lucide-react';
import { Button, Input, SearchInput, Modal, ModalFooter, useConfirmDialog, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import styles from './staff.module.css';

interface StaffFormData {
    display_name: string;
    is_active: boolean;
}

interface Staff {
    id: string;
    display_name: string;
    is_active: boolean;
}

export default function StaffPage() {
    const { showToast } = useToast();
    const { confirm: confirmDialog } = useConfirmDialog();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<StaffFormData>({
        display_name: '',
        is_active: true,
    });

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.get<Staff[]>('/api/v1/staff');
            setStaff(data);
            setError(null);
        } catch (err) {
            const apiError = err as ApiError;
            
            if (apiError.status === 0) {
                setError('O serviço está fora do ar no momento. Contate o administrador.');
            } else {
                setError(apiError.message || 'Erro ao carregar equipe. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirmDialog({
            title: 'Excluir profissional',
            message: 'Tem certeza que deseja excluir este profissional?',
            confirmLabel: 'Excluir',
            cancelLabel: 'Cancelar',
            variant: 'danger',
        });
        if (!confirmed) return;
        try {
            await api.delete(`/api/v1/staff/${id}`);
            setStaff(staff.filter(s => s.id !== id));
            showToast('Profissional excluído com sucesso.', 'success');
        } catch (err) {
            const apiError = err as ApiError;
            showToast(apiError.message || 'Erro ao excluir profissional. Tente novamente.', 'error');
        }
    };

    const filteredStaff = staff.filter(member =>
        member.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const resetForm = () => {
        setFormData({
            display_name: '',
            is_active: true,
        });
    };

    const openCreateModal = () => {
        setEditingStaff(null);
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (member: Staff) => {
        setEditingStaff(member);
        setFormData({
            display_name: member.display_name,
            is_active: member.is_active,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStaff(null);
        resetForm();
    };

    const handleSave = async () => {
        if (!formData.display_name.trim()) {
            showToast('O nome do profissional é obrigatório.', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                display_name: formData.display_name.trim(),
                is_active: formData.is_active,
            };

            if (editingStaff) {
                const updated = await api.patch<Staff>(`/api/v1/staff/${editingStaff.id}`, payload);
                setStaff(staff.map(s => s.id === editingStaff.id ? updated : s));
                showToast('Profissional atualizado com sucesso.', 'success');
            } else {
                const created = await api.post<Staff>('/api/v1/staff', payload);
                setStaff([...staff, created]);
                showToast('Profissional criado com sucesso.', 'success');
            }

            closeModal();
        } catch (err) {
            const apiError = err as ApiError;
            showToast(apiError.message || 'Erro ao salvar profissional. Tente novamente.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Equipe</h1>
                    <p className={styles.subtitle}>Gerencie os profissionais do seu negócio</p>
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
                    <Button variant="secondary" onClick={loadStaff}>Tentar novamente</Button>
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>👥</div>
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
                                                    onClick={() => void handleDelete(member.id)}
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
                                        onClick={() => void handleDelete(member.id)}
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

            {/* Modal de Criar/Editar Profissional */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingStaff ? 'Editar Profissional' : 'Novo Profissional'}
                size="sm"
            >
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nome do Profissional *</label>
                        <Input
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            placeholder="Ex: Maria Silva"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            <span>Profissional ativo</span>
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
                            editingStaff ? 'Salvar' : 'Criar Profissional'
                        )}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
