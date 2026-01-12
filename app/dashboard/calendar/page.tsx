'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { getCatalog, type CatalogResponse } from '@/lib/catalog';
import styles from './calendar.module.css';

interface Appointment {
    id: string;
    start_at: string;
    end_at: string;
    staff_id: string;
    client_id: string;
    service_id: string;
    status: 'booked' | 'confirmed' | 'in_progress' | 'completed' | 'canceled' | 'no_show';
    price_cents: number;
    source: string;
}

interface Client {
    id: string;
    full_name: string;
    phone: string | null;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [appointments, setAppointments] = useState<Record<string, Appointment[]>>({});
    const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const formatDateKey = (date: Date) => date.toISOString().split('T')[0];
    const selectedDateKey = selectedDate ? formatDateKey(selectedDate) : null;
    const selectedAppointments = selectedDateKey ? appointments[selectedDateKey] || [] : [];

    useEffect(() => {
        const loadLookups = async () => {
            const [catalogData, clientsData] = await Promise.all([
                getCatalog().catch(() => null),
                api.get<Client[]>('/api/v1/clients').catch(() => []),
            ]);
            setCatalog(catalogData);
            setClients(clientsData || []);
        };
        loadLookups();
    }, []);

    // Buscar agendamentos do dia selecionado
    useEffect(() => {
        const fetchAppointments = async () => {
            if (!selectedDate) return;

            const dateKey = formatDateKey(selectedDate);
            
            // Se já tem os dados, não busca novamente
            if (appointments[dateKey]) return;

            setLoading(true);
            try {
                const data = await api.get<Appointment[]>(`/api/v1/dashboard/day?date=${dateKey}`);
                setAppointments(prev => ({
                    ...prev,
                    [dateKey]: data || []
                }));
            } catch (err) {
                const error = err as { message?: string; status?: number };
                console.error('Erro ao buscar agendamentos:', error.status === 0 ? 'Serviço fora do ar' : err);
                setAppointments(prev => ({
                    ...prev,
                    [dateKey]: []
                }));
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [selectedDate, appointments]);

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

    const renderCalendarDays = () => {
        const days = [];
        const today = new Date();
        const todayKey = formatDateKey(today);

        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className={styles.dayEmpty} />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = formatDateKey(date);
            const isToday = dateKey === todayKey;
            const isSelected = selectedDate && dateKey === formatDateKey(selectedDate);
            const hasAppointments = appointments[dateKey]?.length > 0;

            days.push(
                <button
                    key={day}
                    className={`${styles.day} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
                    onClick={() => setSelectedDate(date)}
                >
                    <span className={styles.dayNumber}>{day}</span>
                    {hasAppointments && <span className={styles.dot} />}
                </button>
            );
        }

        return days;
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Agenda</h1>
                    <p className={styles.subtitle}>Visualize e gerencie agendamentos</p>
                </div>
                <Button leftIcon={<Plus size={18} />}>
                    Novo Agendamento
                </Button>
            </div>

            <div className={styles.content}>
                <div className={styles.calendarCard}>
                    <div className={styles.calendarHeader}>
                        <button className={styles.navButton} onClick={goToPrevMonth}>
                            <ChevronLeft size={20} />
                        </button>
                        <div className={styles.monthYear}>
                            <span className={styles.month}>{monthNames[month]}</span>
                            <span className={styles.year}>{year}</span>
                        </div>
                        <button className={styles.navButton} onClick={goToNextMonth}>
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <button className={styles.todayButton} onClick={goToToday}>Hoje</button>

                    <div className={styles.weekDays}>
                        {dayNames.map(day => (
                            <div key={day} className={styles.weekDay}>{day}</div>
                        ))}
                    </div>

                    <div className={styles.daysGrid}>
                        {renderCalendarDays()}
                    </div>
                </div>

                <div className={styles.appointmentsCard}>
                    <div className={styles.appointmentsHeader}>
                        <h2 className={styles.appointmentsTitle}>
                            {selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h2>
                        <span className={styles.appointmentsCount}>
                            {loading ? '...' : `${selectedAppointments.length} agendamento${selectedAppointments.length !== 1 ? 's' : ''}`}
                        </span>
                    </div>

                    {loading ? (
                        <div className={styles.emptyState}>
                            <Loader2 size={24} className={styles.spinner} />
                            <p>Carregando...</p>
                        </div>
                    ) : selectedAppointments.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>Nenhum agendamento para este dia</p>
                        </div>
                    ) : (
                        <div className={styles.appointmentsList}>
                            {selectedAppointments.map(apt => (
                                <div key={apt.id} className={styles.appointmentItem}>
                                    <div className={styles.appointmentTime}>{formatTime(apt.start_at)}</div>
                                    <div className={styles.appointmentInfo}>
                                        <div className={styles.appointmentClient}>{getClientName(apt.client_id)}</div>
                                        <div className={styles.appointmentService}>
                                            {getServiceName(apt.service_id)} • {getStaffName(apt.staff_id)}
                                        </div>
                                    </div>
                                    <span className={`${styles.statusBadge} ${styles[apt.status]}`}>
                                        {getStatusLabel(apt.status)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
