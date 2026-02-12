'use client';

import { useState, useEffect } from 'react';
import { User, Building2, Bell, Palette, Link2, Shield, Save, Loader2, MessageCircle, Calendar, Bot } from 'lucide-react';
import { Button, Input, useConfirmDialog, useToast } from '@/components/ui';
import { WhatsAppModal } from '@/components/ui/WhatsAppModal';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { uazapi } from '@/lib/uazapi';
import { AiWizard } from './ai-wizard/components/AiWizard';
import styles from './settings.module.css';

type Tab = 'profile' | 'business' | 'notifications' | 'appearance' | 'integrations' | 'ai' | 'security';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'business', label: 'Negócio', icon: Building2 },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'integrations', label: 'Integrações', icon: Link2 },
    { id: 'ai', label: 'Configurar IA', icon: Bot },
    { id: 'security', label: 'Segurança', icon: Shield },
];

interface TenantProfile {
    id: string;
    slug: string;
    business_name: string;
    business_type: string | null;
    phone: string | null;
    address: TenantAddress | null;
}

interface GoogleCalendarStatus {
    connected: boolean;
    email?: string;
}

interface TenantAddress {
    formatted?: string | null;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    place_id?: string | null;
    geocoded_at?: string | null;
    geocode_source?: string | null;
}

interface TenantAddressCandidate extends TenantAddress {
    relevance: number;
}

interface GeocodeResponse {
    candidates: TenantAddressCandidate[];
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const { theme, setTheme } = useTheme();
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();
    const { confirm: confirmDialog } = useConfirmDialog();
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState<
        'connected' | 'disconnected' | 'loading' | 'pending' | 'error' | 'config_required' | 'rollout'
    >('loading');
    const [whatsappWebhookEnabled, setWhatsappWebhookEnabled] = useState<boolean | null>(null);
    const [whatsappStatusHint, setWhatsappStatusHint] = useState<string | null>(null);
    const [googleCalendarStatus, setGoogleCalendarStatus] = useState<GoogleCalendarStatus>({ connected: false });
    const [googleCalendarLoading, setGoogleCalendarLoading] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeCandidates, setGeocodeCandidates] = useState<TenantAddressCandidate[]>([]);
    
    // Business state (from /tenants/profile)
    const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
    
    // Profile state (editable)
    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Sync profile state when user changes
    useEffect(() => {
        if (user) {
            setProfileName(user.name || '');
            setProfileEmail(user.email || '');
        }
    }, [user]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const profileData = await api.get<TenantProfile>('/api/v1/tenants/profile').catch(() => null);
                if (profileData) {
                    setTenantProfile(profileData);
                }
                
                // Verifica status do WhatsApp via backend (fonte de verdade do tenant)
                try {
                    const capabilities = await uazapi.getCapabilities();
                    if (!capabilities.enabled) {
                        setWhatsappWebhookEnabled(null);
                        if (capabilities.reason === 'canary_disabled') {
                            setWhatsappStatus('rollout');
                            setWhatsappStatusHint('Disponível em rollout gradual para o seu tenant.');
                        } else {
                            setWhatsappStatus('error');
                            setWhatsappStatusHint('Integração temporariamente indisponível.');
                        }
                    } else {
                        const integrationStatus = await uazapi.getIntegrationStatus();
                        setWhatsappWebhookEnabled(integrationStatus.webhook_enabled ?? null);
                        if (!integrationStatus.has_token) {
                            setWhatsappStatus('disconnected');
                            setWhatsappStatusHint(null);
                        } else if (integrationStatus.instance_connected) {
                            setWhatsappStatus('connected');
                            if (integrationStatus.ready_for_inbound) {
                                setWhatsappStatusHint(null);
                            } else {
                                setWhatsappStatusHint('WhatsApp conectado, mas o recebimento de mensagens ainda não está pronto.');
                            }
                        } else {
                            setWhatsappStatus('disconnected');
                            setWhatsappStatusHint(null);
                        }
                    }
                } catch (err) {
                    const message =
                        (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
                            ? (err as { message: string }).message
                            : err instanceof Error
                                ? err.message
                                : '');
                    if (message.includes('uazapi_token_missing')) {
                        setWhatsappStatus('disconnected');
                        setWhatsappWebhookEnabled(null);
                        setWhatsappStatusHint(null);
                    } else if (
                        message.includes('missing webhook connection') ||
                        message.includes('invalid webhook connection') ||
                        message.includes('uazapi_connection_not_configured')
                    ) {
                        setWhatsappStatus('config_required');
                        setWhatsappWebhookEnabled(null);
                        setWhatsappStatusHint('A autenticação do webhook está inválida. Registre o webhook novamente.');
                    } else {
                        setWhatsappStatus('error');
                        setWhatsappWebhookEnabled(null);
                        setWhatsappStatusHint(null);
                    }
                }

                // Verifica status do Google Calendar
                try {
                    if (!user?.staff_id) {
                        setGoogleCalendarStatus({ connected: false });
                    } else {
                        const calendarStatus = await api.get<GoogleCalendarStatus>('/api/v1/integrations/google-calendar/status');
                        setGoogleCalendarStatus(calendarStatus);
                    }
                } catch {
                    setGoogleCalendarStatus({ connected: false });
                }
            } catch (err) {
                console.error('Erro ao carregar configurações:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Verifica se voltou do OAuth do Google
        const urlParams = new URLSearchParams(window.location.search);
        const googleCallback = urlParams.get('google_calendar');
        if (googleCallback === 'success') {
            void (async () => {
                try {
                    if (user?.staff_id) {
                        const calendarStatus = await api.get<GoogleCalendarStatus>('/api/v1/integrations/google-calendar/status');
                        setGoogleCalendarStatus(calendarStatus);
                    } else {
                        setGoogleCalendarStatus({ connected: false });
                    }
                } catch {
                    setGoogleCalendarStatus({ connected: true });
                } finally {
                    setActiveTab('integrations');
                    // Limpa o parâmetro da URL
                    window.history.replaceState({}, '', window.location.pathname);
                }
            })();
        } else if (googleCallback === 'error') {
            showToast('Erro ao conectar com Google Calendar. Tente novamente.', 'error');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [showToast, whatsappModalOpen, user?.staff_id]);

    const handleSaveBusiness = async () => {
        if (!tenantProfile) return;
        
        setIsSaving(true);
        try {
            await api.patch('/api/v1/tenants/profile', {
                business_name: tenantProfile.business_name,
                slug: tenantProfile.slug,
                phone: tenantProfile.phone,
                business_type: tenantProfile.business_type,
                address: tenantProfile.address || null,
            });
            setGeocodeCandidates([]);
            showToast('Dados do negócio atualizados com sucesso!', 'success');
        } catch (err) {
            const apiError = err as ApiError;
            
            if (apiError.status === 0) {
                showToast('O serviço está fora do ar no momento. Contate o administrador.', 'error');
            } else {
                showToast(apiError.message || 'Erro ao salvar dados do negócio. Tente novamente.', 'error');
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Formatar telefone para (XX) X XXXX-XXXX
    const formatPhone = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setTenantProfile(prev => prev ? { ...prev, phone: formatted } : null);
    };

    const updateAddressField = (field: keyof TenantAddress, value: string) => {
        setTenantProfile((prev) => {
            if (!prev) return prev;
            const normalizedValue = value || null;
            const isGeoDerivedField = [
                'street',
                'number',
                'complement',
                'neighborhood',
                'city',
                'state',
                'postal_code',
                'country_code',
            ].includes(field);
            return {
                ...prev,
                address: {
                    ...(prev.address || {}),
                    [field]: normalizedValue,
                    ...(isGeoDerivedField
                        ? {
                              formatted: null,
                              latitude: null,
                              longitude: null,
                              place_id: null,
                              geocoded_at: null,
                              geocode_source: null,
                          }
                        : {}),
                },
            };
        });
        setGeocodeCandidates([]);
    };

    const buildAddressQuery = (address: TenantAddress | null): string => {
        if (!address) return '';
        const parts = [
            address.street,
            address.number,
            address.neighborhood,
            address.city,
            address.state,
            address.postal_code,
            address.country_code || 'BR',
        ]
            .map((part) => String(part || '').trim())
            .filter(Boolean);
        return parts.join(', ');
    };

    const handleGeocodeAddress = async () => {
        const query = buildAddressQuery(tenantProfile?.address || null);
        if (query.length < 5) {
            showToast('Preencha mais campos do endereço antes de buscar coordenadas.', 'error');
            return;
        }

        setIsGeocoding(true);
        try {
            const response = await api.post<GeocodeResponse>('/api/v1/tenants/profile/geocode', { query });
            const candidates = response.candidates || [];
            setGeocodeCandidates(candidates);
            if (candidates.length === 0) {
                showToast('Nenhum endereço encontrado para geolocalização.', 'info');
            } else {
                showToast(`${candidates.length} endereço(s) sugerido(s). Selecione o correto.`, 'success');
            }
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.status === 400) {
                showToast('Endereço inválido para geolocalização.', 'error');
            } else {
                showToast('Geolocalização indisponível no momento. Tente novamente.', 'error');
            }
        } finally {
            setIsGeocoding(false);
        }
    };

    const applyGeocodeCandidate = (candidate: TenantAddressCandidate) => {
        setTenantProfile((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                address: {
                    formatted: candidate.formatted || null,
                    street: candidate.street || null,
                    number: candidate.number || null,
                    complement: candidate.complement || null,
                    neighborhood: candidate.neighborhood || null,
                    city: candidate.city || null,
                    state: candidate.state || null,
                    postal_code: candidate.postal_code || null,
                    country_code: candidate.country_code || null,
                    latitude: candidate.latitude ?? null,
                    longitude: candidate.longitude ?? null,
                    place_id: candidate.place_id || null,
                    geocoded_at: candidate.geocoded_at || null,
                    geocode_source: candidate.geocode_source || 'google_maps',
                },
            };
        });
        setGeocodeCandidates([]);
        showToast('Endereço geocodificado aplicado com sucesso.', 'success');
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            await api.patch('/api/v1/users/me', {
                full_name: profileName,
                email: profileEmail,
            });
            await refreshUser();
            showToast('Perfil atualizado com sucesso!', 'success');
        } catch (err) {
            const apiError = err as ApiError;
            
            if (apiError.status === 0) {
                showToast('O serviço está fora do ar no momento. Contate o administrador.', 'error');
            } else {
                showToast(apiError.message || 'Erro ao salvar perfil. Tente novamente.', 'error');
            }
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleConnectGoogleCalendar = async () => {
        setGoogleCalendarLoading(true);
        try {
            const nextPath = '/dashboard/settings?google_calendar=success';
            const response = await api.get<{ auth_url: string }>(
                `/api/v1/integrations/google-calendar/auth-url?next=${encodeURIComponent(nextPath)}`
            );
            window.location.href = response.auth_url;
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.status === 404) {
                showToast('Integração com Google Calendar ainda não está configurada no servidor.', 'error');
            } else {
                showToast('Erro ao iniciar conexão com Google Calendar. Tente novamente.', 'error');
            }
            setGoogleCalendarLoading(false);
        }
    };

    const handleDisconnectGoogleCalendar = async () => {
        const confirmed = await confirmDialog({
            title: 'Desconectar Google Calendar',
            message: 'Tem certeza que deseja desconectar o Google Calendar?',
            confirmLabel: 'Desconectar',
            cancelLabel: 'Cancelar',
            variant: 'danger',
        });
        if (!confirmed) return;
        
        setGoogleCalendarLoading(true);
        try {
            await api.post('/api/v1/integrations/google-calendar/disconnect', {});
            setGoogleCalendarStatus({ connected: false });
            showToast('Google Calendar desconectado com sucesso!', 'success');
        } catch {
            showToast('Erro ao desconectar Google Calendar. Tente novamente.', 'error');
        } finally {
            setGoogleCalendarLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p>Carregando configurações...</p>
                </div>
            </div>
        );
    }

    const whatsappCanConfigure = whatsappStatus !== 'loading' && whatsappStatus !== 'config_required';
    const whatsappButtonTitle = whatsappCanConfigure
        ? 'Configurar'
        : (whatsappStatusHint || 'Integração temporariamente indisponível');

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Configurações</h1>
                <p className={styles.subtitle}>Gerencie suas preferências e configurações</p>
            </div>

            <div className={styles.content}>
                <nav className={styles.tabList}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className={styles.tabContent}>
                    {activeTab === 'profile' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Informações Pessoais</h2>
                            <div className={styles.form}>
                                <Input 
                                    label="Nome" 
                                    value={profileName} 
                                    onChange={(e) => setProfileName(e.target.value)}
                                />
                                <Input 
                                    label="Email" 
                                    type="email" 
                                    value={profileEmail}
                                    onChange={(e) => setProfileEmail(e.target.value)}
                                />
                            </div>
                            <div className={styles.actions}>
                                <Button onClick={handleSaveProfile} isLoading={isSavingProfile}>
                                    <Save size={18} /> Salvar Alterações
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'business' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Dados do Negócio</h2>
                            <div className={styles.form}>
                                <Input 
                                    label="Nome do negócio" 
                                    value={tenantProfile?.business_name || ''}
                                    onChange={(e) => setTenantProfile(prev => prev ? { ...prev, business_name: e.target.value } : null)}
                                />
                                <Input 
                                    label="Slug (URL)" 
                                    value={tenantProfile?.slug || ''}
                                    onChange={(e) => setTenantProfile(prev => prev ? { ...prev, slug: e.target.value } : null)}
                                />
                                <Input 
                                    label="Telefone" 
                                    value={tenantProfile?.phone || ''}
                                    onChange={handlePhoneChange}
                                    placeholder="(00) 0 0000-0000"
                                />
                                <Input 
                                    label="Tipo de Negócio" 
                                    value={tenantProfile?.business_type || ''}
                                    onChange={(e) => setTenantProfile(prev => prev ? { ...prev, business_type: e.target.value } : null)}
                                />

                                <h3 className={styles.addressTitle}>Endereço da unidade</h3>
                                <div className={styles.addressGrid}>
                                    <Input
                                        label="Logradouro"
                                        value={tenantProfile?.address?.street || ''}
                                        onChange={(e) => updateAddressField('street', e.target.value)}
                                        placeholder="Rua, avenida, etc."
                                    />
                                    <Input
                                        label="Número"
                                        value={tenantProfile?.address?.number || ''}
                                        onChange={(e) => updateAddressField('number', e.target.value)}
                                        placeholder="123"
                                    />
                                    <Input
                                        label="Complemento"
                                        value={tenantProfile?.address?.complement || ''}
                                        onChange={(e) => updateAddressField('complement', e.target.value)}
                                        placeholder="Sala, loja, bloco"
                                    />
                                    <Input
                                        label="Bairro"
                                        value={tenantProfile?.address?.neighborhood || ''}
                                        onChange={(e) => updateAddressField('neighborhood', e.target.value)}
                                        placeholder="Bairro"
                                    />
                                    <Input
                                        label="Cidade"
                                        value={tenantProfile?.address?.city || ''}
                                        onChange={(e) => updateAddressField('city', e.target.value)}
                                        placeholder="Cidade"
                                    />
                                    <Input
                                        label="Estado"
                                        value={tenantProfile?.address?.state || ''}
                                        onChange={(e) => updateAddressField('state', e.target.value)}
                                        placeholder="SP"
                                    />
                                    <Input
                                        label="CEP"
                                        value={tenantProfile?.address?.postal_code || ''}
                                        onChange={(e) => updateAddressField('postal_code', e.target.value)}
                                        placeholder="00000-000"
                                    />
                                    <Input
                                        label="País"
                                        value={tenantProfile?.address?.country_code || 'BR'}
                                        onChange={(e) => updateAddressField('country_code', e.target.value.toUpperCase())}
                                        placeholder="BR"
                                    />
                                </div>

                                <div className={styles.geocodeActions}>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleGeocodeAddress}
                                        isLoading={isGeocoding}
                                    >
                                        Buscar coordenadas
                                    </Button>
                                </div>

                                {geocodeCandidates.length > 0 && (
                                    <div className={styles.geocodeCandidates}>
                                        <p className={styles.geocodeHint}>Selecione o endereço correto:</p>
                                        {geocodeCandidates.map((candidate, index) => (
                                            <button
                                                key={`${candidate.place_id || 'candidate'}-${index}`}
                                                type="button"
                                                className={styles.candidateButton}
                                                onClick={() => applyGeocodeCandidate(candidate)}
                                            >
                                                <span>{candidate.formatted || 'Endereço sugerido'}</span>
                                                <small>
                                                    {typeof candidate.latitude === 'number' && typeof candidate.longitude === 'number'
                                                        ? `${candidate.latitude.toFixed(6)}, ${candidate.longitude.toFixed(6)}`
                                                        : 'Sem coordenadas'}
                                                </small>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {tenantProfile?.address?.formatted && (
                                    <div className={styles.addressPreview}>
                                        <strong>Endereço confirmado:</strong>
                                        <span>{tenantProfile.address.formatted}</span>
                                        {typeof tenantProfile.address.latitude === 'number' &&
                                            typeof tenantProfile.address.longitude === 'number' && (
                                                <span>
                                                    Lat/Lng: {tenantProfile.address.latitude.toFixed(6)},{' '}
                                                    {tenantProfile.address.longitude.toFixed(6)}
                                                </span>
                                            )}
                                    </div>
                                )}
                            </div>
                            <div className={styles.actions}>
                                <Button onClick={handleSaveBusiness} isLoading={isSaving}>
                                    <Save size={18} /> Salvar Alterações
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Preferências de Notificação</h2>
                            <div className={styles.toggleList}>
                                <label className={styles.toggleItem}>
                                    <input type="checkbox" defaultChecked />
                                    <div>
                                        <span className={styles.toggleLabel}>Novos agendamentos</span>
                                        <p className={styles.toggleDesc}>Receber notificação quando um cliente agendar</p>
                                    </div>
                                </label>
                                <label className={styles.toggleItem}>
                                    <input type="checkbox" defaultChecked />
                                    <div>
                                        <span className={styles.toggleLabel}>Cancelamentos</span>
                                        <p className={styles.toggleDesc}>Receber notificação quando um agendamento for cancelado</p>
                                    </div>
                                </label>
                                <label className={styles.toggleItem}>
                                    <input type="checkbox" defaultChecked />
                                    <div>
                                        <span className={styles.toggleLabel}>Lembretes diários</span>
                                        <p className={styles.toggleDesc}>Receber resumo da agenda do dia pela manhã</p>
                                    </div>
                                </label>
                                <label className={styles.toggleItem}>
                                    <input type="checkbox" />
                                    <div>
                                        <span className={styles.toggleLabel}>Relatórios semanais</span>
                                        <p className={styles.toggleDesc}>Receber relatório de desempenho semanal</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Tema</h2>
                            <div className={styles.themeOptions}>
                                <button
                                    className={`${styles.themeOption} ${theme === 'light' ? styles.active : ''}`}
                                    onClick={() => setTheme('light')}
                                >
                                    <div className={styles.themePreview} data-theme="light" />
                                    <span>Claro</span>
                                </button>
                                <button
                                    className={`${styles.themeOption} ${theme === 'dark' ? styles.active : ''}`}
                                    onClick={() => setTheme('dark')}
                                >
                                    <div className={`${styles.themePreview} ${styles.dark}`} />
                                    <span>Escuro</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'integrations' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>WhatsApp</h2>
                            <div className={styles.integrationCard}>
                                <div className={`${styles.integrationIcon} ${styles.whatsappIcon}`}>
                                    <MessageCircle size={24} />
                                </div>
                                <div className={styles.integrationInfo}>
                                    <span className={styles.integrationName}>WhatsApp Business</span>
                                    {whatsappStatus === 'loading' ? (
                                        <span className={styles.integrationStatusLoading}>Verificando...</span>
                                    ) : whatsappStatus === 'pending' ? (
                                        <span className={styles.integrationStatusLoading}>Sincronizando...</span>
                                    ) : whatsappStatus === 'config_required' ? (
                                        <span className={styles.integrationStatusDisconnected}>Configuração pendente</span>
                                    ) : whatsappStatus === 'connected' ? (
                                        <span className={styles.integrationStatus}>Conectado</span>
                                    ) : whatsappStatus === 'error' ? (
                                        <span className={styles.integrationStatusDisconnected}>Erro ao verificar</span>
                                    ) : (
                                        <span className={styles.integrationStatusDisconnected}>Não conectado</span>
                                    )}
                                    {whatsappStatusHint && (
                                        <span className={styles.integrationStatusLoading}>{whatsappStatusHint}</span>
                                    )}
                                    <span
                                        className={
                                            whatsappWebhookEnabled === true
                                                ? styles.integrationStatus
                                                : whatsappWebhookEnabled === false
                                                    ? styles.integrationStatusDisconnected
                                                    : styles.integrationStatusLoading
                                        }
                                    >
                                        Webhook: {whatsappWebhookEnabled === true ? 'Habilitado' : whatsappWebhookEnabled === false ? 'Desabilitado' : 'Desconhecido'}
                                    </span>
                                </div>
                                <Button 
                                    variant={whatsappStatus === 'connected' ? 'secondary' : 'primary'} 
                                    size="sm"
                                    disabled={!whatsappCanConfigure}
                                    onClick={() => setWhatsappModalOpen(true)}
                                    title={whatsappButtonTitle}
                                >
                                    Configurar
                                </Button>
                            </div>
                            <h2 className={styles.sectionTitle}>Calendário</h2>
                            <div className={styles.integrationCard}>
                                <div className={`${styles.integrationIcon} ${styles.googleIcon}`}>
                                    <Calendar size={24} />
                                </div>
                                <div className={styles.integrationInfo}>
                                    <span className={styles.integrationName}>Google Calendar</span>
                                    {googleCalendarStatus.connected ? (
                                        <span className={styles.integrationStatus}>
                                            Conectado {googleCalendarStatus.email && `(${googleCalendarStatus.email})`}
                                        </span>
                                    ) : (
                                        <span className={styles.integrationStatusDisconnected}>Não conectado</span>
                                    )}
                                </div>
                                {googleCalendarStatus.connected ? (
                                    <Button 
                                        variant="secondary" 
                                        size="sm"
                                        onClick={handleDisconnectGoogleCalendar}
                                        isLoading={googleCalendarLoading}
                                    >
                                        Desconectar
                                    </Button>
                                ) : (
                                    <Button 
                                        variant="primary" 
                                        size="sm"
                                        onClick={handleConnectGoogleCalendar}
                                        isLoading={googleCalendarLoading}
                                    >
                                        Conectar
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className={styles.section}>
                            <AiWizard />
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Alterar Senha</h2>
                            <div className={styles.form}>
                                <Input label="Senha atual" type="password" autoComplete="new-password" />
                                <Input label="Nova senha" type="password" autoComplete="new-password" />
                                <Input label="Confirmar nova senha" type="password" autoComplete="new-password" />
                            </div>
                            <div className={styles.actions}>
                                <Button isLoading={isSaving}>
                                    <Save size={18} /> Alterar Senha
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* WhatsApp Configuration Modal */}
            <WhatsAppModal 
                isOpen={whatsappModalOpen} 
                onClose={() => setWhatsappModalOpen(false)} 
            />
        </div>
    );
}




