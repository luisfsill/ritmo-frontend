'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { Button, Input, Modal, ModalFooter, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { getCatalog, type CatalogResponse } from '@/lib/catalog';
import styles from './calendar.module.css';

interface AppointmentFormData {
    client_name: string;
    client_phone: string;
    service_id: string;
    staff_id: string;
    date: string;
    time: string;
}

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
    const { showToast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [appointments, setAppointments] = useState<Record<string, Appointment[]>>({});
    const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<AppointmentFormData>({
        client_name: '',
        client_phone: '',
        service_id: '',
        staff_id: '',
        date: '',
        time: '',
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const monthNames = ['Janeiro', 'Fevereiro', 'Mar√ßo', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'S√°b'];

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
            
            // Se j√° tem os dados, n√£o busca novamente
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
                console.error('Erro ao buscar agendamentos:', error.status === 0 ? 'Servi√ßo fora do ar' : err);
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
        return catalog?.services.find(s => s.id === serviceId)?.name ?? 'Servi√ßo';
    };

    const getStaffName = (staffId: string) => {
        return catalog?.staff.find(s => s.id === staffId)?.display_name ?? 'Profissional';
    };

    const getStatusLabel = (status: Appointment['status']) => {
        switch (status) {
            case 'booked': return 'Agendado';
            case 'confirmed': return 'Confirmado';
            case 'in_progress': return 'Em andamento';
            case 'completed': return 'Conclu√≠do';
            case 'canceled': return 'Cancelado';
            case 'no_show': return 'N√£o compareceu';
        }
    };

    const resetForm = () => {
        const today = selectedDate || new Date();
        setFormData({
            client_name: '',
            client_phone: '',
            service_id: catalog?.services[0]?.id || '',
            staff_id: catalog?.staff[0]?.id || '',
            date: formatDateKey(today),
            time: '09:00',
        });
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    const handleSave = async () => {
        if (!formData.client_name.trim() || !formData.client_phone.trim()) {
            showToast('Nome e telefone do cliente s„o obrigatÛrios.', 'error');
            return;
        }
        if (!formData.service_id || !formData.staff_id) {
            showToast('Selecione o serviÁo e o profissional.', 'error');
            return;
        }

        setSaving(true);
        try {
            const startAt = new Date(`${formData.date}T${formData.time}:00`);

            const payload = {
                client_name: formData.client_name.trim(),
                client_phone: formData.client_phone.trim(),
                service_id: formData.service_id,
                staff_id: formData.staff_id,
                start_at: startAt.toISOString(),
            };

            await api.post('/api/v1/appointments', payload);

            // Limpa o cache para recarregar os agendamentos
            setAppointments({});
            closeModal();
            showToast('Agendamento criado com sucesso.', 'success');
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.status === 0) {
                showToast('O serviÁo est· fora do ar no momento. Contate o administrador.', 'error');
            } else if (apiError.status === 409) {
                showToast('Este hor·rio j· est· ocupado. Escolha outro hor·rio.', 'error');
            } else {
                showToast(apiError.message || 'Erro ao criar agendamento. Tente novamente.', 'error');
            }
        } finally {
            setSaving(false);
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
                <Button leftIcon={<Plus size={18} />} onClick={openCreateModal}>
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
                                            {getServiceName(apt.service_id)} ‚Ä¢ {getStaffName(apt.staff_id)}
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

            {/* Modal de Novo Agendamento */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title="Novo Agendamento"
                size="md"
            >
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nome do Cliente *</label>
                        <Input
                            value={formData.client_name}
                            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                            placeholder="Nome completo"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Telefone / WhatsApp *</label>
                        <Input
                            type="tel"
                            value={formData.client_phone}
                            onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                            placeholder="(11) 99999-9999"
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Servi√ßo *</label>
                            <select
                                className={styles.select}
                                value={formData.service_id}
                                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {catalog?.services.map(service => (
                                    <option key={service.id} value={service.id}>{service.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Profissional *</label>
                            <select
                                className={styles.select}
                                value={formData.staff_id}
                                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {catalog?.staff.map(member => (
                                    <option key={member.id} value={member.id}>{member.display_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Data *</label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Hor√°rio *</label>
                            <Input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
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
                            'Criar Agendamento'
                        )}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}

