'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import styles from './staff.module.css';

interface Staff {
    id: string;
    display_name: string;
    is_active: boolean;
}

export default function StaffPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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
        if (!confirm('Tem certeza que deseja excluir este profissional?')) return;
        try {
            await api.delete(`/api/v1/staff/${id}`);
            setStaff(staff.filter(s => s.id !== id));
        } catch (err) {
            const apiError = err as ApiError;
            
            if (apiError.status === 0) {
                alert('O serviço está fora do ar no momento. Contate o administrador.');
            } else {
                alert(apiError.message || 'Erro ao excluir profissional. Tente novamente.');
            }
        }
    };

    const filteredStaff = staff.filter(member =>
        member.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Equipe</h1>
                    <p className={styles.subtitle}>Gerencie os profissionais do seu negócio</p>
                </div>
                <Button leftIcon={<Plus size={18} />}>
                    Novo Profissional
                </Button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
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
                <div className={styles.grid}>
                    {filteredStaff.map((member) => (
                        <div key={member.id} className={styles.card}>
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
                                <button className={`${styles.actionButton} ${styles.danger}`} onClick={() => handleDelete(member.id)} title="Excluir">
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
