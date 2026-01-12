'use client';

import { useEffect, useState } from 'react';
import { Calendar, Users, DollarSign, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getCatalog, type CatalogResponse } from '@/lib/catalog';
import styles from './dashboard.module.css';

interface DashboardSummary {
    bookings_last_days: number;
    upcoming: number;
    clients: number;
}

interface Appointment {
    id: string;
    staff_id: string;
    client_id: string;
    service_id: string;
    start_at: string;
    end_at: string;
    status: 'booked' | 'confirmed' | 'in_progress' | 'completed' | 'canceled' | 'no_show';
    price_cents: number;
    source: string;
}

interface RevenueReport {
    days: number;
    revenue_cents: number;
}

interface Client {
    id: string;
    full_name: string;
    phone: string | null;
}

export default function DashboardPage() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [revenue, setRevenue] = useState<RevenueReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const today = new Date().toISOString().split('T')[0];
                
                const [summaryData, appointmentsData, catalogData, clientsData, revenueData] = await Promise.all([
                    api.get<DashboardSummary>('/api/v1/dashboard/summary').catch(() => null),
                    api.get<Appointment[]>(`/api/v1/dashboard/day?date=${today}`).catch(() => []),
                    getCatalog().catch(() => null),
                    api.get<Client[]>('/api/v1/clients').catch(() => []),
                    api.get<RevenueReport>('/api/v1/dashboard/analytics/revenue?days=30').catch(() => null),
                ]);

                if (summaryData) {
                    setSummary(summaryData);
                }
                setTodayAppointments(appointmentsData || []);
                setCatalog(catalogData);
                setClients(clientsData || []);
                setRevenue(revenueData);
            } catch (err) {
                const error = err as { message?: string; status?: number };
                
                if (error.status === 0) {
                    setError('O serviço está fora do ar no momento. Contate o administrador.');
                } else {
                    setError(error.message || 'Erro ao carregar dados. Tente novamente.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getClientName = (clientId: string) => {
        return clients.find(c => c.id === clientId)?.full_name ?? 'Cliente';
    };

    const getServiceName = (serviceId: string) => {
        return catalog?.services.find(s => s.id === serviceId)?.name ?? 'Serviço';
    };

    const getStaffName = (staffId: string) => {
        return catalog?.staff.find(s => s.id === staffId)?.display_name ?? 'Profissional';
    };

    const getStatusLabel = (status: Appointment['status']) => {
        switch (status) {
            case 'booked': return 'Agendado';
            case 'confirmed': return 'Confirmado';
            case 'in_progress': return 'Em andamento';
            case 'completed': return 'Concluído';
            case 'canceled': return 'Cancelado';
            case 'no_show': return 'Não compareceu';
        }
    };

    const stats = summary ? [
        {
            label: 'Agendamentos (últimos 7 dias)',
            value: (summary.bookings_last_days ?? 0).toString(),
            icon: Calendar,
        },
        {
            label: 'Próximos agendamentos',
            value: (summary.upcoming ?? 0).toString(),
            icon: Calendar,
        },
        {
            label: 'Clientes',
            value: (summary.clients ?? 0).toString(),
            icon: Users,
        },
        {
            label: 'Receita (30 dias)',
            value: formatCurrency(((revenue?.revenue_cents ?? 0) / 100)),
            icon: DollarSign,
        },
    ] : [];

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p>Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.errorState}>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Tentar novamente</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Dashboard</h1>
                    <p className={styles.subtitle}>Visão geral do seu negócio</p>
                </div>
                <Link href="/dashboard/appointments/new" className={styles.newButton}>
                    <Calendar size={18} />
                    Novo Agendamento
                </Link>
            </div>

            {summary && (
                <div className={styles.statsGrid}>
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className={styles.statCard}>
                                <div className={styles.statHeader}>
                                    <div className={styles.statIconWrapper}>
                                        <Icon size={20} />
                                    </div>
                                </div>
                                <div className={styles.statValue}>{stat.value}</div>
                                <div className={styles.statLabel}>{stat.label}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className={styles.contentGrid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Agenda de Hoje</h2>
                        <Link href="/dashboard/calendar" className={styles.cardLink}>
                            Ver tudo
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                    {todayAppointments.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>Nenhum agendamento para hoje</p>
                        </div>
                    ) : (
                        <div className={styles.appointmentsList}>
                            {todayAppointments.map((apt) => (
                                <div key={apt.id} className={styles.appointmentItem}>
                                    <div className={styles.appointmentTime}>{formatTime(apt.start_at)}</div>
                                    <div className={styles.appointmentDetails}>
                                        <div className={styles.appointmentClient}>{getClientName(apt.client_id)}</div>
                                        <div className={styles.appointmentService}>
                                            {getServiceName(apt.service_id)} • {getStaffName(apt.staff_id)}
                                        </div>
                                    </div>
                                    <div className={styles.appointmentStatus}>
                                        <span className={`${styles.statusBadge} ${styles[apt.status]}`}>
                                            {getStatusLabel(apt.status)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Ações Rápidas</h2>
                    </div>
                    <div className={styles.quickActions}>
                        <Link href="/dashboard/services" className={styles.quickAction}>
                            <div className={styles.quickActionIcon}>✂️</div>
                            <span>Gerenciar Serviços</span>
                        </Link>
                        <Link href="/dashboard/staff" className={styles.quickAction}>
                            <div className={styles.quickActionIcon}>👥</div>
                            <span>Gerenciar Equipe</span>
                        </Link>
                        <Link href="/dashboard/clients" className={styles.quickAction}>
                            <div className={styles.quickActionIcon}>📋</div>
                            <span>Lista de Clientes</span>
                        </Link>
                        <Link href="/dashboard/settings" className={styles.quickAction}>
                            <div className={styles.quickActionIcon}>⚙️</div>
                            <span>Configurações</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
