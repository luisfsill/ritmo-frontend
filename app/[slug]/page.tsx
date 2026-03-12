'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Sun,
  Moon,
  Home,
  MapPin,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import styles from './page.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_RITMO_API_URL;

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
}

interface AvailabilitySlot {
  start_at: string;
  end_at: string;
  staff_id: string;
}

interface BookingFormData {
  client_name: string;
  client_phone: string;
  client_email: string;
}

type BookingStep = 'services' | 'date' | 'time' | 'form' | 'confirmation';

export default function PublicBookingPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const { resolvedTheme, toggleTheme } = useTheme();

  // State
  const [step, setStep] = useState<BookingStep>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    client_name: '',
    client_phone: '',
    client_email: '',
  });
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantNotFound, setTenantNotFound] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch services on mount
  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/v1/public/${slug}/services`);
        
        if (response.status === 404) {
          setTenantNotFound(true);
          return;
        }
        
        if (!response.ok) {
          throw new Error('Erro ao carregar serviços');
        }
        
        const data = await response.json();
        setServices(data);
      } catch {
        setError('Não foi possível carregar os serviços. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchServices();
    }
  }, [slug]);

  // Fetch availability when date is selected
  const fetchAvailability = useCallback(async (date: Date) => {
    if (!selectedService) return;
    
    try {
      setSlotsLoading(true);
      setError(null);
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(
        `${API_BASE_URL}/api/v1/public/${slug}/availability?service_id=${selectedService.id}&date=${dateStr}`
      );
      
      if (!response.ok) {
        throw new Error('Erro ao carregar horários');
      }
      
      const data = await response.json();
      setAvailableSlots(data.slots || []);
    } catch {
      setError('Não foi possível carregar os horários disponíveis.');
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedService, slug]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate, selectedService, fetchAvailability]);

  // Book appointment
  const handleBooking = async () => {
    if (!selectedService || !selectedSlot) return;
    
    try {
      setBookingLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/public/${slug}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          staff_id: selectedSlot.staff_id,
          start_at: selectedSlot.start_at,
          client_name: formData.client_name,
          client_phone: formData.client_phone,
          client_email: formData.client_email || null,
        }),
      });
      
      if (response.status === 409) {
        setError('Este horário não está mais disponível. Por favor, escolha outro.');
        setStep('time');
        if (selectedDate) {
          fetchAvailability(selectedDate);
        }
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Erro ao realizar agendamento');
      }
      
      const data = await response.json();
      setAppointmentId(data.appointment_id);
      setStep('confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar agendamento. Tente novamente.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Format price
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  // Format time
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty slots for days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSameDay = (date1: Date, date2: Date | null) => {
    if (!date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  // Go back handler
  const handleBack = () => {
    switch (step) {
      case 'date':
        setStep('services');
        setSelectedService(null);
        break;
      case 'time':
        setStep('date');
        setSelectedSlot(null);
        break;
      case 'form':
        setStep('time');
        break;
    }
  };

  // Render tenant not found
  if (tenantNotFound) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <AlertCircle size={64} />
            <h1>Estabelecimento não encontrado</h1>
            <p>O link que você acessou não corresponde a nenhum estabelecimento cadastrado.</p>
            <Link href="/" className={styles.homeLink}>
              <Home size={20} />
              Ir para a página inicial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render loading
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <Loader2 className={styles.spinner} size={48} />
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logoLink}>
          <MapPin size={24} />
          <span className={styles.slug}>@{slug}</span>
        </Link>
        <button 
          onClick={toggleTheme} 
          className={styles.themeToggle}
          aria-label="Alternar tema"
        >
          {resolvedTheme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </header>

      <main className={styles.container}>
        {/* Progress indicator */}
        {step !== 'confirmation' && (
          <div className={styles.progress}>
            <div className={`${styles.progressStep} ${step === 'services' ? styles.active : ''} ${['date', 'time', 'form'].includes(step) ? styles.completed : ''}`}>
              <span className={styles.progressNumber}>1</span>
              <span className={styles.progressLabel}>Serviço</span>
            </div>
            <div className={styles.progressLine} />
            <div className={`${styles.progressStep} ${step === 'date' ? styles.active : ''} ${['time', 'form'].includes(step) ? styles.completed : ''}`}>
              <span className={styles.progressNumber}>2</span>
              <span className={styles.progressLabel}>Data</span>
            </div>
            <div className={styles.progressLine} />
            <div className={`${styles.progressStep} ${step === 'time' ? styles.active : ''} ${step === 'form' ? styles.completed : ''}`}>
              <span className={styles.progressNumber}>3</span>
              <span className={styles.progressLabel}>Horário</span>
            </div>
            <div className={styles.progressLine} />
            <div className={`${styles.progressStep} ${step === 'form' ? styles.active : ''}`}>
              <span className={styles.progressNumber}>4</span>
              <span className={styles.progressLabel}>Dados</span>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className={styles.errorClose}>×</button>
          </div>
        )}

        {/* Back button */}
        {step !== 'services' && step !== 'confirmation' && (
          <button onClick={handleBack} className={styles.backButton}>
            <ArrowLeft size={20} />
            Voltar
          </button>
        )}

        {/* Step: Services */}
        {step === 'services' && (
          <div className={styles.stepContent}>
            <h1 className={styles.title}>Escolha um serviço</h1>
            <p className={styles.subtitle}>Selecione o serviço que deseja agendar</p>

            {services.length === 0 ? (
              <div className={styles.emptyState}>
                <Calendar size={48} />
                <p>Nenhum serviço disponível no momento.</p>
              </div>
            ) : (
              <div className={styles.servicesList}>
                {services.map((service) => (
                  <button
                    key={service.id}
                    className={styles.serviceCard}
                    onClick={() => {
                      setSelectedService(service);
                      setStep('date');
                    }}
                  >
                    <div className={styles.serviceInfo}>
                      <h3 className={styles.serviceName}>{service.name}</h3>
                      <div className={styles.serviceMeta}>
                        <span className={styles.serviceDuration}>
                          <Clock size={16} />
                          {service.duration_minutes} min
                        </span>
                        <span className={styles.servicePrice}>
                          {formatPrice(service.price_cents)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={24} className={styles.serviceArrow} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Date */}
        {step === 'date' && selectedService && (
          <div className={styles.stepContent}>
            <h1 className={styles.title}>Escolha uma data</h1>
            <p className={styles.subtitle}>
              {selectedService.name} • {selectedService.duration_minutes} min • {formatPrice(selectedService.price_cents)}
            </p>

            <div className={styles.calendar}>
              <div className={styles.calendarHeader}>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className={styles.calendarNav}
                  disabled={currentMonth <= new Date()}
                >
                  <ChevronLeft size={24} />
                </button>
                <span className={styles.calendarMonth}>
                  {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className={styles.calendarNav}
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className={styles.calendarWeekdays}>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <span key={day} className={styles.weekday}>{day}</span>
                ))}
              </div>

              <div className={styles.calendarDays}>
                {getDaysInMonth(currentMonth).map((day, index) => (
                  <button
                    key={index}
                    className={`${styles.calendarDay} ${
                      day === null ? styles.empty : ''
                    } ${
                      day && isToday(day) ? styles.today : ''
                    } ${
                      day && isPastDate(day) ? styles.past : ''
                    } ${
                      day && isSameDay(day, selectedDate) ? styles.selected : ''
                    }`}
                    disabled={!day || isPastDate(day)}
                    onClick={() => {
                      if (day && !isPastDate(day)) {
                        setSelectedDate(day);
                        setStep('time');
                      }
                    }}
                  >
                    {day?.getDate()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Time */}
        {step === 'time' && selectedService && selectedDate && (
          <div className={styles.stepContent}>
            <h1 className={styles.title}>Escolha um horário</h1>
            <p className={styles.subtitle}>
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            {slotsLoading ? (
              <div className={styles.loading}>
                <Loader2 className={styles.spinner} size={32} />
                <p>Carregando horários...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className={styles.emptyState}>
                <Clock size={48} />
                <p>Nenhum horário disponível para esta data.</p>
                <button onClick={() => setStep('date')} className={styles.linkButton}>
                  Escolher outra data
                </button>
              </div>
            ) : (
              <div className={styles.slotsGrid}>
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    className={`${styles.slotButton} ${
                      selectedSlot === slot ? styles.selected : ''
                    }`}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep('form');
                    }}
                  >
                    {formatTime(slot.start_at)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Form */}
        {step === 'form' && selectedService && selectedDate && selectedSlot && (
          <div className={styles.stepContent}>
            <h1 className={styles.title}>Seus dados</h1>
            <p className={styles.subtitle}>Preencha suas informações para confirmar o agendamento</p>

            {/* Booking summary */}
            <div className={styles.bookingSummary}>
              <div className={styles.summaryRow}>
                <Calendar size={18} />
                <span>{selectedService.name}</span>
              </div>
              <div className={styles.summaryRow}>
                <Clock size={18} />
                <span>
                  {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} às {formatTime(selectedSlot.start_at)}
                </span>
              </div>
            </div>

            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                handleBooking();
              }}
            >
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  <User size={18} />
                  Nome completo *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className={styles.input}
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  <Phone size={18} />
                  WhatsApp *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  className={styles.input}
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  <Mail size={18} />
                  E-mail (opcional)
                </label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  placeholder="seu@email.com"
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={bookingLoading || !formData.client_name || !formData.client_phone}
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className={styles.spinner} size={20} />
                    Agendando...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Confirmar Agendamento
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step: Confirmation */}
        {step === 'confirmation' && selectedService && selectedDate && selectedSlot && (
          <div className={styles.stepContent}>
            <div className={styles.confirmation}>
              <div className={styles.confirmationIcon}>
                <Check size={48} />
              </div>
              <h1 className={styles.confirmationTitle}>Agendamento Confirmado!</h1>
              <p className={styles.confirmationText}>
                Seu agendamento foi realizado com sucesso. Você receberá uma confirmação via WhatsApp.
              </p>

              <div className={styles.confirmationDetails}>
                <div className={styles.confirmationRow}>
                  <span className={styles.confirmationLabel}>Serviço:</span>
                  <span className={styles.confirmationValue}>{selectedService.name}</span>
                </div>
                <div className={styles.confirmationRow}>
                  <span className={styles.confirmationLabel}>Data:</span>
                  <span className={styles.confirmationValue}>
                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <div className={styles.confirmationRow}>
                  <span className={styles.confirmationLabel}>Horário:</span>
                  <span className={styles.confirmationValue}>{formatTime(selectedSlot.start_at)}</span>
                </div>
                <div className={styles.confirmationRow}>
                  <span className={styles.confirmationLabel}>Valor:</span>
                  <span className={styles.confirmationValue}>{formatPrice(selectedService.price_cents)}</span>
                </div>
                {appointmentId && (
                  <div className={styles.confirmationRow}>
                    <span className={styles.confirmationLabel}>Código:</span>
                    <span className={styles.confirmationValue}>{appointmentId.slice(0, 8).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setStep('services');
                  setSelectedService(null);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                  setFormData({ client_name: '', client_phone: '', client_email: '' });
                  setAppointmentId(null);
                }}
                className={styles.newBookingButton}
              >
                Fazer novo agendamento
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>
          Agendamento powered by{' '}
          <Link href="/" className={styles.footerLink}>
            Ritmo
          </Link>
        </p>
      </footer>
    </div>
  );
}
