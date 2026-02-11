'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, User, Scissors } from 'lucide-react';
import Link from 'next/link';
import { Button, Input, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { getCatalog, type CatalogService, type CatalogStaff } from '@/lib/catalog';
import styles from './new.module.css';

interface ClientAddress {
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country_code?: string | null;
}

interface Client {
    id: string;
    full_name: string;
    phone: string | null;
    address?: ClientAddress | null;
}

interface AvailableSlot {
    start_at: string;
    end_at: string;
    staff_id: string;
}

interface AvailabilityResponse {
    service_id: string;
    date: string;
    slots: AvailableSlot[];
}

const emptyAddress = (): ClientAddress => ({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: '',
});

// Formata telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const extractPhoneDigits = (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 11);
};

// Formata CEP brasileiro: XXXXX-XXX
const formatPostalCode = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length === 0) return '';
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const extractPostalCodeDigits = (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 8);
};

const normalizeAddressForApi = (address: ClientAddress): ClientAddress | null => {
    const normalized: ClientAddress = {
        street: address.street?.trim() || null,
        number: address.number?.trim() || null,
        complement: address.complement?.trim() || null,
        neighborhood: address.neighborhood?.trim() || null,
        city: address.city?.trim() || null,
        state: address.state?.trim() || null,
        postal_code: address.postal_code?.trim() || null,
        country_code: address.country_code?.trim().toUpperCase() || null,
    };
    const hasAnyValue = Object.values(normalized).some((value) => Boolean(value));
    return hasAnyValue ? normalized : null;
};

const validateAddress = (address: ClientAddress | null): string | null => {
    if (!address) return null;
    const countryCode = address.country_code || '';
    if (countryCode && countryCode.length !== 2) {
        return 'País deve ter 2 letras (ex: BR).';
    }
    const postalCode = address.postal_code || '';
    const postalDigits = postalCode.replace(/\D/g, '');
    if (postalCode && postalDigits.length > 0 && postalDigits.length < 5) {
        return 'CEP parece inválido.';
    }
    return null;
};

export default function NewAppointmentPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data
    const [services, setServices] = useState<CatalogService[]>([]);
    const [staff, setStaff] = useState<CatalogStaff[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);

    // Selection
    const [selectedService, setSelectedService] = useState<CatalogService | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<CatalogStaff | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // New client form
    const [isNewClient, setIsNewClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');
    const [newClientAddress, setNewClientAddress] = useState<ClientAddress>(emptyAddress());

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [catalog, clientsData] = await Promise.all([
                    getCatalog().catch(() => null),
                    api.get<Client[]>('/api/v1/clients').catch(() => [])
                ]);

                if (catalog) {
                    setServices((catalog.services || []).filter(s => s.is_active));
                    setStaff((catalog.staff || []).filter(s => s.is_active));
                } else {
                    setServices([]);
                    setStaff([]);
                }

                setClients(clientsData || []);
            } catch (err) {
                console.error('Erro ao carregar dados:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // Load availability when service, staff or date changes
    useEffect(() => {
        const loadAvailability = async () => {
            if (!selectedService || !selectedDate) {
                setAvailableSlots([]);
                return;
            }

            try {
                const params = new URLSearchParams({
                    service_id: selectedService.id,
                    date: selectedDate
                });
                if (selectedStaff) {
                    params.append('staff_id', selectedStaff.id);
                }

                const availability = await api.get<AvailabilityResponse>(`/api/v1/availability?${params.toString()}`);
                setAvailableSlots(availability?.slots || []);
            } catch (err) {
                console.error('Erro ao carregar disponibilidade:', err);
                setAvailableSlots([]);
            }
        };

        loadAvailability();
    }, [selectedService, selectedStaff, selectedDate]);

    const handleSubmit = async () => {
        if (!selectedService || !selectedSlot) return;

        setIsSubmitting(true);
        try {
            let clientId = selectedClient?.id;

            // Create new client if needed
            if (isNewClient && newClientName && newClientPhone) {
                const normalizedAddress = normalizeAddressForApi(newClientAddress);
                const addressError = validateAddress(normalizedAddress);
                if (addressError) {
                    showToast(addressError, 'error');
                    setIsSubmitting(false);
                    return;
                }
                const newClient = await api.post<Client>('/api/v1/clients', {
                    full_name: newClientName.trim(),
                    phone: newClientPhone.trim(),
                    address: normalizedAddress,
                });
                clientId = newClient.id;
            }

            if (!clientId) {
                showToast('Selecione ou crie um cliente.', 'error');
                setIsSubmitting(false);
                return;
            }

            // Create appointment
            await api.post('/api/v1/appointments', {
                client_id: clientId,
                service_id: selectedService.id,
                staff_id: selectedSlot.staff_id,
                start_at: selectedSlot.start_at
            });

            showToast('Agendamento criado com sucesso!', 'success');
            router.push('/dashboard/appointments');
        } catch (err) {
            const apiError = err as ApiError;
            
            if (apiError.status === 0) {
                showToast('O serviço está fora do ar no momento. Contate o administrador.', 'error');
            } else if (apiError.status === 409) {
                showToast('Este horário já está ocupado. Escolha outro horário.', 'error');
            } else {
                showToast(apiError.message || 'Erro ao criar agendamento. Tente novamente.', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const formatPriceFromCents = (priceCents: number) => {
        return formatPrice(priceCents / 100);
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    };

    const getStaffDisplayName = (staffId: string) => {
        return staff.find(s => s.id === staffId)?.display_name ?? '—';
    };

    const canProceed = () => {
        switch (step) {
            case 1: return !!selectedService;
            case 2: return !!selectedDate && !!selectedSlot;
            case 3: return !!selectedClient || (isNewClient && newClientName && newClientPhone);
            default: return false;
        }
    };

    if (isLoading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Carregando...</div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link href="/dashboard/appointments" className={styles.backLink}>
                    <ArrowLeft size={20} />
                    Voltar
                </Link>
                <h1 className={styles.title}>Novo Agendamento</h1>
            </div>

            {/* Steps indicator */}
            <div className={styles.steps}>
                <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
                    <span className={styles.stepNumber}>1</span>
                    <span className={styles.stepLabel}>Serviço</span>
                </div>
                <div className={styles.stepLine} />
                <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
                    <span className={styles.stepNumber}>2</span>
                    <span className={styles.stepLabel}>Data e Hora</span>
                </div>
                <div className={styles.stepLine} />
                <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
                    <span className={styles.stepNumber}>3</span>
                    <span className={styles.stepLabel}>Cliente</span>
                </div>
            </div>

            <div className={styles.content}>
                {/* Step 1: Select Service */}
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>
                            <Scissors size={20} />
                            Selecione o serviço
                        </h2>
                        
                        {services.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>Nenhum serviço cadastrado</p>
                                <Link href="/dashboard/services">Cadastrar serviço</Link>
                            </div>
                        ) : (
                            <div className={styles.serviceGrid}>
                                {services.map(service => (
                                    <button
                                        key={service.id}
                                        className={`${styles.serviceCard} ${selectedService?.id === service.id ? styles.selected : ''}`}
                                        onClick={() => setSelectedService(service)}
                                    >
                                        <div className={styles.serviceName}>{service.name}</div>
                                        <div className={styles.serviceMeta}>
                                            <span><Clock size={14} /> {formatDuration(service.duration_minutes)}</span>
                                            <span>{formatPriceFromCents(service.price_cents)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Optional: Select staff */}
                        {staff.length > 0 && (
                            <>
                                <h3 className={styles.subTitle}>
                                    <User size={18} />
                                    Profissional (opcional)
                                </h3>
                                <div className={styles.staffGrid}>
                                    <button
                                        className={`${styles.staffCard} ${!selectedStaff ? styles.selected : ''}`}
                                        onClick={() => setSelectedStaff(null)}
                                    >
                                        Qualquer profissional
                                    </button>
                                    {staff.map(member => (
                                        <button
                                            key={member.id}
                                            className={`${styles.staffCard} ${selectedStaff?.id === member.id ? styles.selected : ''}`}
                                            onClick={() => setSelectedStaff(member)}
                                        >
                                            {member.display_name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 2: Select Date and Time */}
                {step === 2 && (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>
                            <Calendar size={20} />
                            Selecione a data e horário
                        </h2>

                        <div className={styles.datePickerWrapper}>
                            <label className={styles.label}>Data</label>
                            <input
                                type="date"
                                value={selectedDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setSelectedSlot(null);
                                }}
                                className={styles.dateInput}
                            />
                        </div>

                        {selectedDate && (
                            <>
                                <h3 className={styles.subTitle}>
                                    <Clock size={18} />
                                    Horários disponíveis
                                </h3>
                                {availableSlots.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <p>Nenhum horário disponível nesta data</p>
                                    </div>
                                ) : (
                                    <div className={styles.slotsGrid}>
                                        {availableSlots.map((slot, index) => (
                                            <button
                                                key={index}
                                                className={`${styles.slotCard} ${selectedSlot === slot ? styles.selected : ''}`}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                <span className={styles.slotTime}>{formatTime(slot.start_at)}</span>
                                                <span className={styles.slotStaff}>{getStaffDisplayName(slot.staff_id)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Step 3: Select or Create Client */}
                {step === 3 && (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>
                            <User size={20} />
                            Cliente
                        </h2>

                        <div className={styles.clientToggle}>
                            <button
                                className={`${styles.toggleBtn} ${!isNewClient ? styles.active : ''}`}
                                onClick={() => setIsNewClient(false)}
                            >
                                Cliente existente
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${isNewClient ? styles.active : ''}`}
                                onClick={() => setIsNewClient(true)}
                            >
                                Novo cliente
                            </button>
                        </div>

                        {!isNewClient ? (
                            <div className={styles.clientList}>
                                {clients.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <p>Nenhum cliente cadastrado</p>
                                        <button onClick={() => setIsNewClient(true)}>Cadastrar cliente</button>
                                    </div>
                                ) : (
                                    clients.map(client => (
                                        <button
                                            key={client.id}
                                            className={`${styles.clientCard} ${selectedClient?.id === client.id ? styles.selected : ''}`}
                                            onClick={() => setSelectedClient(client)}
                                        >
                                            <span className={styles.clientName}>{client.full_name}</span>
                                            <span className={styles.clientPhone}>{client.phone ?? '-'}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className={styles.newClientForm}>
                                <Input
                                    label="Nome do cliente"
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    placeholder="Nome completo"
                                />
                                <Input
                                    label="Telefone"
                                    value={formatPhoneNumber(newClientPhone)}
                                    onChange={(e) => setNewClientPhone(extractPhoneDigits(e.target.value))}
                                    placeholder="(00) 00000-0000"
                                />
                                <Input
                                    label="Logradouro"
                                    value={newClientAddress.street || ''}
                                    onChange={(e) =>
                                        setNewClientAddress((prev) => ({ ...prev, street: e.target.value }))
                                    }
                                    placeholder="Rua, avenida, etc."
                                />
                                <Input
                                    label="Número"
                                    value={newClientAddress.number || ''}
                                    onChange={(e) =>
                                        setNewClientAddress((prev) => ({ ...prev, number: e.target.value }))
                                    }
                                    placeholder="123"
                                />
                                <Input
                                    label="Complemento"
                                    value={newClientAddress.complement || ''}
                                    onChange={(e) =>
                                        setNewClientAddress((prev) => ({ ...prev, complement: e.target.value }))
                                    }
                                    placeholder="Apto, sala, bloco"
                                />
                                <Input
                                    label="Bairro"
                                    value={newClientAddress.neighborhood || ''}
                                    onChange={(e) =>
                                        setNewClientAddress((prev) => ({ ...prev, neighborhood: e.target.value }))
                                    }
                                    placeholder="Bairro"
                                />
                                <Input
                                    label="Cidade"
                                    value={newClientAddress.city || ''}
                                    onChange={(e) =>
                                        setNewClientAddress((prev) => ({ ...prev, city: e.target.value }))
                                    }
                                    placeholder="Cidade"
                                />
                                <Input
                                    label="Estado"
                                    value={newClientAddress.state || ''}
                                    onChange={(e) =>
                                        setNewClientAddress((prev) => ({ ...prev, state: e.target.value }))
                                    }
                                    placeholder="SP"
                                />
                                <Input
                                    label="CEP"
                                    value={formatPostalCode(newClientAddress.postal_code || '')}
                                    onChange={(e) =>
                                        setNewClientAddress((prev) => ({ ...prev, postal_code: extractPostalCodeDigits(e.target.value) }))
                                    }
                                    placeholder="00000-000"
                                />
                                <Input
                                    label="País"
                                    value={newClientAddress.country_code || ''}
                                    onChange={(e) =>
                                        setNewClientAddress((prev) => ({
                                            ...prev,
                                            country_code: e.target.value.toUpperCase(),
                                        }))
                                    }
                                    placeholder="BR"
                                />
                            </div>
                        )}

                        {/* Summary */}
                        <div className={styles.summary}>
                            <h3>Resumo do agendamento</h3>
                            <div className={styles.summaryItem}>
                                <span>Serviço:</span>
                                <strong>{selectedService?.name}</strong>
                            </div>
                            <div className={styles.summaryItem}>
                                <span>Data:</span>
                                <strong>{selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
                            </div>
                            <div className={styles.summaryItem}>
                                <span>Horário:</span>
                                <strong>{selectedSlot && formatTime(selectedSlot.start_at)}</strong>
                            </div>
                            <div className={styles.summaryItem}>
                                <span>Profissional:</span>
                                <strong>{selectedSlot ? getStaffDisplayName(selectedSlot.staff_id) : '—'}</strong>
                            </div>
                            <div className={styles.summaryItem}>
                                <span>Valor:</span>
                                <strong>{selectedService && formatPriceFromCents(selectedService.price_cents)}</strong>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation buttons */}
            <div className={styles.actions}>
                {step > 1 && (
                    <Button variant="secondary" onClick={() => setStep(step - 1)}>
                        Voltar
                    </Button>
                )}
                {step < 3 ? (
                    <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                        Próximo
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!canProceed()}>
                        Confirmar Agendamento
                    </Button>
                )}
            </div>
        </div>
    );
}
