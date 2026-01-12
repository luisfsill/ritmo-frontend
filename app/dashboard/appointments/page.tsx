'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, XCircle, AlertCircle, Loader2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { getCatalog, type CatalogResponse } from '@/lib/catalog';
import styles from './appointments.module.css';

interface Appointment {
    id: string;
    staff_id: string;
    client_id: string;
    service_id: string;
    start_at: string;
    end_at: string;
    status: string;
    price_cents: number;
    source: string;
}

type StatusConfig = {
    label: string;
    icon: LucideIcon;
    color: 'success' | 'warning' | 'error';
};

const statusConfig = {
    booked: { label: 'Agendado', icon: Clock, color: 'warning' },
    confirmed: { label: 'Confirmado', icon: CheckCircle, color: 'success' },
    in_progress: { label: 'Em andamento', icon: Clock, color: 'warning' },
    completed: { label: 'Concluído', icon: CheckCircle, color: 'success' },
    canceled: { label: 'Cancelado', icon: XCircle, color: 'error' },
    no_show: { label: 'Não compareceu', icon: AlertCircle, color: 'error' },
} satisfies Record<string, StatusConfig>;

type KnownAppointmentStatus = keyof typeof statusConfig;

const statusAliases: Record<string, KnownAppointmentStatus> = {
    scheduled: 'booked',
    cancelled: 'canceled',
};

const getStatusPresentation = (rawStatus: string): StatusConfig => {
    const normalized = statusAliases[rawStatus] ?? rawStatus;

    if (normalized in statusConfig) {
        return statusConfig[normalized as KnownAppointmentStatus];
    }

    return { label: rawStatus || 'Desconhecido', icon: AlertCircle, color: 'warning' };
};

interface Client {
    id: string;
    full_name: string;
    phone: string | null;
}

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadAppointments();
    }, [selectedDate]);

    const loadAppointments = async () => {
        setIsLoading(true);
        try {
            const [data, catalogData, clientsData] = await Promise.all([
                api.get<Appointment[]>(`/api/v1/dashboard/day?date=${selectedDate}`),
                getCatalog().catch(() => null),
                api.get<Client[]>('/api/v1/clients').catch(() => []),
            ]);

            setAppointments(data);
            setCatalog(catalogData);
            setClients(clientsData || []);
            setError(null);
        } catch (err) {
            const apiError = err as ApiError;
            
            if (apiError.status === 0) {
                setError('O serviço está fora do ar no momento. Contate o administrador.');
            } else {
                setError(apiError.message || 'Erro ao carregar agendamentos. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
        try {
            await api.post(`/api/v1/appointments/${id}/cancel`);
            setAppointments(appointments.map(a => a.id === id ? { ...a, status: 'canceled' } : a));
        } catch (err) {
            const apiError = err as ApiError;
            
            if (apiError.status === 0) {
                alert('O serviço está fora do ar no momento. Contate o administrador.');
            } else {
                alert(apiError.message || 'Erro ao cancelar agendamento. Tente novamente.');
            }
        }
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const getServiceName = (serviceId: string) => {
        return catalog?.services.find(s => s.id === serviceId)?.name ?? serviceId;
    };

    const getStaffName = (staffId: string) => {
        return catalog?.staff.find(s => s.id === staffId)?.display_name ?? staffId;
    };

    const getClientInfo = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return {
            name: client?.full_name ?? clientId,
            phone: client?.phone ?? '-',
        };
    };

    const filteredAppointments = appointments.filter(apt => {
        const clientName = getClientInfo(apt.client_id).name;
        const serviceName = getServiceName(apt.service_id);
        const matchesSearch = clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            serviceName.toLowerCase().includes(searchQuery.toLowerCase());
        const normalizedStatus = statusAliases[apt.status] ?? apt.status;
        const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Agendamentos</h1>
                    <p className={styles.subtitle}>Gerencie todos os agendamentos</p>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar cliente ou serviço..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={styles.dateInput}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="all">Todos os status</option>
                    <option value="booked">Agendado</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="completed">Concluído</option>
                    <option value="canceled">Cancelado</option>
                    <option value="no_show">Não compareceu</option>
                </select>
            </div>

            {isLoading ? (
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <span>Carregando agendamentos...</span>
                </div>
            ) : error ? (
                <div className={styles.errorState}>
                    <p>{error}</p>
                    <Button variant="secondary" onClick={loadAppointments}>Tentar novamente</Button>
                </div>
            ) : filteredAppointments.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📅</div>
                    <h3>Nenhum agendamento encontrado</h3>
                    <p>{searchQuery || statusFilter !== 'all' ? 'Tente filtros diferentes' : 'Os agendamentos aparecerão aqui'}</p>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>Cliente</th>
                                <th>Serviço</th>
                                <th>Profissional</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.map((apt) => {
                                const { date, time } = formatDateTime(apt.start_at);
                                const normalizedStatus = statusAliases[apt.status] ?? apt.status;
                                const status = getStatusPresentation(apt.status);
                                const StatusIcon = status.icon;
                                const client = getClientInfo(apt.client_id);

                                return (
                                    <tr key={apt.id}>
                                        <td>
                                            <div className={styles.dateTime}>
                                                <span className={styles.date}>{date}</span>
                                                <span className={styles.time}>{time}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.client}>
                                                <span className={styles.clientName}>{client.name}</span>
                                                <span className={styles.clientPhone}>{client.phone}</span>
                                            </div>
                                        </td>
                                        <td>{getServiceName(apt.service_id)}</td>
                                        <td>{getStaffName(apt.staff_id)}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[status.color]}`}>
                                                <StatusIcon size={14} />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td>
                                            {normalizedStatus === 'booked' || normalizedStatus === 'confirmed' ? (
                                                <button className={styles.actionButton} onClick={() => handleCancel(apt.id)}>
                                                    <XCircle size={16} />
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
