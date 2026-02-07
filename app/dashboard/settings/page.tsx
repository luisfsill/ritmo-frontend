'use client';

import { useState, useEffect } from 'react';
import { User, Building2, Bell, Palette, Link2, Shield, Save, Loader2, MessageCircle, Calendar, Bot, RotateCcw, History, Check, X, Copy } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { WhatsAppModal } from '@/components/ui/WhatsAppModal';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { uazapi } from '@/lib/uazapi';
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
    address: { street?: string; city?: string } | null;
}

interface GoogleCalendarStatus {
    connected: boolean;
    email?: string;
}

interface TenantPrompt {
    id: string;
    compiled_prompt: string;
    prompt_version: number;
    knowledge_base: Record<string, unknown> | null;
    tone_settings: Record<string, unknown> | null;
    activated_at: string | null;
    created_at: string;
}

interface TenantPromptVersion {
    id: string;
    prompt_version: number;
    is_active: boolean;
    activated_at: string | null;
    created_at: string;
    created_by: string | null;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const { theme, setTheme } = useTheme();
    const { user, refreshUser } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState<
        'connected' | 'disconnected' | 'loading' | 'pending' | 'error' | 'rollout' | 'config_required'
    >('loading');
    const [whatsappStatusHint, setWhatsappStatusHint] = useState<string | null>(null);
    const [googleCalendarStatus, setGoogleCalendarStatus] = useState<GoogleCalendarStatus>({ connected: false });
    const [googleCalendarLoading, setGoogleCalendarLoading] = useState(false);
    
    // AI Prompt state
    const [activePrompt, setActivePrompt] = useState<TenantPrompt | null>(null);
    const [promptVersions, setPromptVersions] = useState<TenantPromptVersion[]>([]);
    const [promptLoading, setPromptLoading] = useState(false);
    const [promptSaving, setPromptSaving] = useState(false);
    const [promptForm, setPromptForm] = useState({
        compiled_prompt: '',
        knowledge_base: '',
        tone: 'friendly' as 'friendly' | 'professional' | 'casual',
    });
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [promptSaveSuccess, setPromptSaveSuccess] = useState(false);
    const [converterOpen, setConverterOpen] = useState(false);
    const [converterText, setConverterText] = useState('');
    const [converterJson, setConverterJson] = useState('');
    
    // Toast notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    
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
                        if (capabilities.reason === 'canary_disabled') {
                            setWhatsappStatus('rollout');
                            setWhatsappStatusHint('Disponível em rollout gradual para o seu tenant.');
                        } else if (capabilities.reason === 'missing_webhook_secret') {
                            setWhatsappStatus('disconnected');
                            setWhatsappStatusHint('Webhook pendente no servidor. Você pode conectar, mas eventos podem não chegar.');
                        } else {
                            setWhatsappStatus('rollout');
                            setWhatsappStatusHint('Integração temporariamente indisponível para este tenant.');
                        }
                    } else {
                        setWhatsappStatusHint(null);
                        const status = await uazapi.getStatus();
                        if (status.kind === 'pending') {
                            setWhatsappStatus('pending');
                        } else {
                            setWhatsappStatus(status.data.status.status.connected && status.data.status.status.loggedIn ? 'connected' : 'disconnected');
                        }
                    }
                } catch (err) {
                    const message = err instanceof Error ? err.message : '';
                    if (message.includes('uazapi_token_missing')) {
                        setWhatsappStatus('disconnected');
                        setWhatsappStatusHint(null);
                    } else if (message.includes('whatsapp_qr_feature_disabled')) {
                        setWhatsappStatus('rollout');
                        setWhatsappStatusHint('Disponível em rollout gradual para o seu tenant.');
                    } else if (message.includes('uazapi_webhook_secret_missing')) {
                        setWhatsappStatus('disconnected');
                        setWhatsappStatusHint('Webhook pendente no servidor. Você pode conectar, mas eventos podem não chegar.');
                    } else {
                        setWhatsappStatus('error');
                        setWhatsappStatusHint(null);
                    }
                }

                // Verifica status do Google Calendar
                try {
                    const calendarStatus = await api.get<GoogleCalendarStatus>('/api/v1/integrations/google-calendar/status');
                    setGoogleCalendarStatus(calendarStatus);
                } catch {
                    setGoogleCalendarStatus({ connected: false });
                }

                // Carrega prompt ativo de IA
                try {
                    const prompt = await api.get<TenantPrompt>('/api/v1/prompts/active');
                    setActivePrompt(prompt);
                    setPromptForm({
                        compiled_prompt: prompt.compiled_prompt,
                        knowledge_base: prompt.knowledge_base ? JSON.stringify(prompt.knowledge_base, null, 2) : '',
                        tone: (prompt.tone_settings?.tone as 'friendly' | 'professional' | 'casual') || 'friendly',
                    });
                } catch {
                    // Sem prompt ativo, usar valores padrão
                    setActivePrompt(null);
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
                    const calendarStatus = await api.get<GoogleCalendarStatus>('/api/v1/integrations/google-calendar/status');
                    setGoogleCalendarStatus(calendarStatus);
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
    }, [whatsappModalOpen]);

    const handleSaveBusiness = async () => {
        if (!tenantProfile) return;
        
        setIsSaving(true);
        try {
            await api.patch('/api/v1/tenants/profile', {
                business_name: tenantProfile.business_name,
                slug: tenantProfile.slug,
                phone: tenantProfile.phone,
                business_type: tenantProfile.business_type,
            });
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
        if (!confirm('Tem certeza que deseja desconectar o Google Calendar?')) return;
        
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

    // AI Prompt handlers
    const fetchPromptVersions = async () => {
        try {
            const versions = await api.get<TenantPromptVersion[]>('/api/v1/prompts');
            setPromptVersions(versions);
        } catch (err) {
            console.error('Erro ao carregar versões:', err);
        }
    };

    const handleSavePrompt = async () => {
        if (!promptForm.compiled_prompt.trim()) {
            showToast('O prompt não pode estar vazio.', 'error');
            return;
        }

        setPromptSaving(true);
        setPromptSaveSuccess(false);
        try {
            let knowledgeBase = null;
            if (promptForm.knowledge_base.trim()) {
                try {
                    knowledgeBase = JSON.parse(promptForm.knowledge_base);
                } catch {
                    showToast('A base de conhecimento deve ser um JSON válido.', 'error');
                    setPromptSaving(false);
                    return;
                }
            }

            const payload = {
                compiled_prompt: promptForm.compiled_prompt,
                prompt_version: (activePrompt?.prompt_version || 0) + 1,
                knowledge_base: knowledgeBase,
                tone_settings: { tone: promptForm.tone },
            };

            const result = await api.put<TenantPrompt>('/api/v1/prompts/active', payload);
            
            if ('status' in result && result.status === 'pending') {
                showToast('Configuração salva! Será processada em breve.', 'info');
            } else {
                setActivePrompt(result);
                setPromptSaveSuccess(true);
                showToast('Configuração de IA salva com sucesso!', 'success');
                setTimeout(() => setPromptSaveSuccess(false), 3000);
            }
        } catch (err) {
            const apiError = err as ApiError;
            showToast(apiError.message || 'Erro ao salvar configuração de IA.', 'error');
        } finally {
            setPromptSaving(false);
        }
    };

    const handleActivateVersion = async (promptId: string) => {
        if (!confirm('Deseja ativar esta versão do prompt?')) return;
        
        setPromptLoading(true);
        try {
            const result = await api.post<TenantPrompt>(`/api/v1/prompts/${promptId}/activate`, {});
            if (!('status' in result)) {
                setActivePrompt(result);
                setPromptForm({
                    compiled_prompt: result.compiled_prompt,
                    knowledge_base: result.knowledge_base ? JSON.stringify(result.knowledge_base, null, 2) : '',
                    tone: (result.tone_settings?.tone as 'friendly' | 'professional' | 'casual') || 'friendly',
                });
                showToast('Versão ativada com sucesso!', 'success');
            }
            fetchPromptVersions();
        } catch {
            showToast('Erro ao ativar versão.', 'error');
        } finally {
            setPromptLoading(false);
        }
    };

    const handleResetPrompt = async () => {
        if (!confirm('Tem certeza que deseja resetar o prompt para o padrão? Esta ação não pode ser desfeita.')) return;
        
        setPromptLoading(true);
        try {
            await api.delete('/api/v1/prompts/active');
            setActivePrompt(null);
            setPromptForm({
                compiled_prompt: '',
                knowledge_base: '',
                tone: 'friendly',
            });
            showToast('Prompt resetado para o padrão.', 'success');
        } catch {
            showToast('Erro ao resetar prompt.', 'error');
        } finally {
            setPromptLoading(false);
        }
    };

    const handleOpenVersionHistory = () => {
        fetchPromptVersions();
        setShowVersionHistory(true);
    };

    // Text to JSON converter
    const textToJson = (text: string) => {
        const lines = text.split('\n').filter(line => line.trim());
        const result: Record<string, Record<string, string> | string[]> = {};
        let currentCategory = 'geral';
        let currentContent: Record<string, string> = {};
        let itemCounter = 1;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('#')) {
                const categoryName = trimmedLine.replace(/^#+\s*/, '').toLowerCase().replace(/\s+/g, '_');
                if (Object.keys(currentContent).length > 0) {
                    result[currentCategory] = currentContent;
                    currentContent = {};
                    itemCounter = 1;
                }
                currentCategory = categoryName;
            } 
            else if (/^[A-ZÀ-ÚÇ\s]+:$/i.test(trimmedLine)) {
                const categoryName = trimmedLine.replace(/:$/, '').toLowerCase().replace(/\s+/g, '_');
                if (Object.keys(currentContent).length > 0) {
                    result[currentCategory] = currentContent;
                    currentContent = {};
                    itemCounter = 1;
                }
                currentCategory = categoryName;
            }
            else if (trimmedLine.includes(':')) {
                const colonIndex = trimmedLine.indexOf(':');
                const key = trimmedLine.substring(0, colonIndex).trim();
                const value = trimmedLine.substring(colonIndex + 1).trim();
                
                if (key && value) {
                    const formattedKey = key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_àáâãéêíóôõúç]/gi, '');
                    currentContent[formattedKey] = value;
                } else if (key && !value) {
                    const categoryName = key.toLowerCase().replace(/\s+/g, '_');
                    if (Object.keys(currentContent).length > 0) {
                        result[currentCategory] = currentContent;
                        currentContent = {};
                        itemCounter = 1;
                    }
                    currentCategory = categoryName;
                }
            }
            else if (trimmedLine) {
                const formattedKey = `info_${itemCounter}`;
                currentContent[formattedKey] = trimmedLine;
                itemCounter++;
            }
        });

        if (Object.keys(currentContent).length > 0) {
            result[currentCategory] = currentContent;
        }

        return result;
    };

    const handleConvertToJson = () => {
        if (!converterText.trim()) {
            showToast('Por favor, escreva algo para converter.', 'error');
            return;
        }
        try {
            const json = textToJson(converterText);
            setConverterJson(JSON.stringify(json, null, 2));
            showToast('Texto convertido com sucesso!', 'success');
        } catch {
            showToast('Erro ao converter texto para JSON.', 'error');
        }
    };

    const handleApplyJson = () => {
        try {
            JSON.parse(converterJson);
            setPromptForm(prev => ({ ...prev, knowledge_base: converterJson }));
            setConverterOpen(false);
            setConverterText('');
            setConverterJson('');
            showToast('Base de conhecimento atualizada!', 'success');
        } catch {
            showToast('JSON inválido. Por favor, corrija o formato.', 'error');
        }
    };

    const handleCopyJson = () => {
        navigator.clipboard.writeText(converterJson);
        showToast('JSON copiado para a área de transferência!', 'success');
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

    const whatsappCanConfigure = whatsappStatus !== 'loading' && whatsappStatus !== 'rollout' && whatsappStatus !== 'config_required';
    const whatsappButtonTitle = whatsappCanConfigure
        ? 'Configurar'
        : (whatsappStatusHint || 'Integração em rollout gradual');

    return (
        <div className={styles.page}>
            {/* Toast Notification */}
            {toast && (
                <div className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}>
                    <div className={styles.toastContent}>
                        {toast.type === 'success' && <Check size={18} />}
                        {toast.type === 'error' && <X size={18} />}
                        {toast.type === 'info' && <Bot size={18} />}
                        <span>{toast.message}</span>
                    </div>
                    <button className={styles.toastClose} onClick={() => setToast(null)}>
                        <X size={16} />
                    </button>
                </div>
            )}

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
                                    ) : whatsappStatus === 'rollout' ? (
                                        <span className={styles.integrationStatusLoading}>Em rollout</span>
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
                            <div className={styles.aiHeader}>
                                <div>
                                    <h2 className={styles.sectionTitle}>Configurar Agente de IA</h2>
                                    <p className={styles.aiDescription}>
                                        Personalize como seu assistente virtual interage com os clientes
                                    </p>
                                </div>
                                <div className={styles.aiHeaderActions}>
                                    <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        onClick={handleOpenVersionHistory}
                                    >
                                        <History size={16} /> Histórico
                                    </Button>
                                    {activePrompt && (
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            onClick={handleResetPrompt}
                                            disabled={promptLoading}
                                        >
                                            <RotateCcw size={16} /> Resetar
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {activePrompt && (
                                <div className={styles.promptStatus}>
                                    <div className={styles.promptStatusBadge}>
                                        <Check size={14} />
                                        <span>Versão {activePrompt.prompt_version} ativa</span>
                                    </div>
                                    <span className={styles.promptStatusDate}>
                                        Atualizado em {new Date(activePrompt.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            )}

                            <div className={styles.aiFormSection}>
                                <h3 className={styles.aiSubtitle}>Prompt Principal</h3>
                                <p className={styles.aiHelp}>
                                    Defina as instruções que guiam o comportamento do assistente. Seja específico sobre como ele deve responder, quais informações fornecer e qual tom usar.
                                </p>
                                <textarea
                                    className={styles.promptTextarea}
                                    value={promptForm.compiled_prompt}
                                    onChange={(e) => setPromptForm(prev => ({ ...prev, compiled_prompt: e.target.value }))}
                                    placeholder="Ex: Você é um assistente virtual de agendamento para [nome do negócio]. Seu objetivo é ajudar os clientes a agendar serviços de forma rápida e eficiente. Sempre seja educado e forneça informações claras sobre disponibilidade, preços e serviços oferecidos..."
                                    rows={10}
                                />
                                <div className={styles.charCount}>
                                    {promptForm.compiled_prompt.length} / 20.000 caracteres
                                </div>
                            </div>

                            <div className={styles.aiFormSection}>
                                <h3 className={styles.aiSubtitle}>Tom de Comunicação</h3>
                                <p className={styles.aiHelp}>
                                    Escolha o estilo de comunicação do assistente
                                </p>
                                <div className={styles.toneOptions}>
                                    <label className={`${styles.toneOption} ${promptForm.tone === 'friendly' ? styles.toneActive : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="tone" 
                                            value="friendly"
                                            checked={promptForm.tone === 'friendly'}
                                            onChange={() => setPromptForm(prev => ({ ...prev, tone: 'friendly' }))}
                                        />
                                        <div className={styles.toneContent}>
                                            <span className={styles.toneLabel}>😊 Amigável</span>
                                            <span className={styles.toneDesc}>Caloroso e acolhedor, usa linguagem informal</span>
                                        </div>
                                    </label>
                                    <label className={`${styles.toneOption} ${promptForm.tone === 'professional' ? styles.toneActive : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="tone" 
                                            value="professional"
                                            checked={promptForm.tone === 'professional'}
                                            onChange={() => setPromptForm(prev => ({ ...prev, tone: 'professional' }))}
                                        />
                                        <div className={styles.toneContent}>
                                            <span className={styles.toneLabel}>💼 Profissional</span>
                                            <span className={styles.toneDesc}>Formal e objetivo, linguagem corporativa</span>
                                        </div>
                                    </label>
                                    <label className={`${styles.toneOption} ${promptForm.tone === 'casual' ? styles.toneActive : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="tone" 
                                            value="casual"
                                            checked={promptForm.tone === 'casual'}
                                            onChange={() => setPromptForm(prev => ({ ...prev, tone: 'casual' }))}
                                        />
                                        <div className={styles.toneContent}>
                                            <span className={styles.toneLabel}>✌️ Casual</span>
                                            <span className={styles.toneDesc}>Descontraído e moderno, usa gírias</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className={styles.aiFormSection}>
                                <h3 className={styles.aiSubtitle}>Base de Conhecimento (Opcional)</h3>
                                <p className={styles.aiHelp}>
                                    Adicione informações extras em formato JSON que o assistente pode usar para responder perguntas específicas (FAQ, políticas, etc.). <br />
                                    Não sabe JSON? Use o botão de conversor de texto abaixo para converter seu texto comum em JSON automaticamente.
                                </p>
                                <div className={styles.aiFormAction}>
                                    <Button 
                                        variant="secondary" 
                                        size="sm"
                                        onClick={() => setConverterOpen(true)}
                                    >
                                        ✨ Conversor de Texto
                                    </Button>
                                </div>
                                <textarea
                                    className={styles.knowledgeTextarea}
                                    value={promptForm.knowledge_base}
                                    onChange={(e) => setPromptForm(prev => ({ ...prev, knowledge_base: e.target.value }))}
                                    placeholder={`{\n  "faq": {\n    "horario_funcionamento": "Segunda a sábado, das 9h às 19h",\n    "formas_pagamento": "Pix, cartão de crédito"\n  }\n}`}
                                    rows={6}
                                />
                            </div>

                            {promptSaveSuccess && (
                                <div className={styles.successMessage}>
                                    <Check size={18} />
                                    <span>Configuração salva com sucesso!</span>
                                </div>
                            )}

                            <div className={styles.actions}>
                                <Button onClick={handleSavePrompt} isLoading={promptSaving}>
                                    <Save size={18} /> Salvar Configuração
                                </Button>
                            </div>

                            {/* Version History Modal */}
                            {showVersionHistory && (
                                <div className={styles.modalOverlay} onClick={() => setShowVersionHistory(false)}>
                                    <div className={styles.versionModal} onClick={(e) => e.stopPropagation()}>
                                        <div className={styles.versionModalHeader}>
                                            <h3>Histórico de Versões</h3>
                                            <button 
                                                className={styles.closeButton}
                                                onClick={() => setShowVersionHistory(false)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <div className={styles.versionList}>
                                            {promptVersions.length === 0 ? (
                                                <p className={styles.emptyVersions}>Nenhuma versão encontrada</p>
                                            ) : (
                                                promptVersions.map((version) => (
                                                    <div key={version.id} className={styles.versionItem}>
                                                        <div className={styles.versionInfo}>
                                                            <span className={styles.versionNumber}>
                                                                Versão {version.prompt_version}
                                                            </span>
                                                            {version.is_active && (
                                                                <span className={styles.activeTag}>Ativa</span>
                                                            )}
                                                            <span className={styles.versionDate}>
                                                                {new Date(version.created_at).toLocaleDateString('pt-BR', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                        {!version.is_active && (
                                                            <Button 
                                                                variant="secondary" 
                                                                size="sm"
                                                                onClick={() => handleActivateVersion(version.id)}
                                                                disabled={promptLoading}
                                                            >
                                                                Ativar
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
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

            {/* Text to JSON Converter Modal */}
            {converterOpen && (
                <div className={styles.modalOverlay} onClick={() => setConverterOpen(false)}>
                    <div className={styles.converterModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.converterHeader}>
                            <h3>Conversor de Texto para JSON</h3>
                            <button 
                                className={styles.closeButton}
                                onClick={() => setConverterOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className={styles.converterContent}>
                            <div className={styles.converterColumn}>
                                <div className={styles.columnHeader}>
                                    <h4>Escreva em Texto Comum</h4>
                                    <span className={styles.columnHint}>Use # para categorias e &quot;chave: valor&quot; para dados</span>
                                </div>
                                <textarea
                                    className={styles.converterInput}
                                    value={converterText}
                                    onChange={(e) => setConverterText(e.target.value)}
                                    placeholder={`# FAQ\nhorario de atendimento: Segunda a sábado, 9h a 19h\nformas de pagamento: Pix, cartão de crédito\n\n# Políticas\ntempo de antecedência: 24 horas\ntaxa de cancelamento: 50%`}
                                    rows={20}
                                />
                            </div>

                            <div className={styles.converterColumn}>
                                <div className={styles.columnHeader}>
                                    <h4>JSON Gerado</h4>
                                    <span className={styles.columnHint}>Visualização do resultado</span>
                                </div>
                                <textarea
                                    className={styles.converterOutput}
                                    value={converterJson}
                                    readOnly
                                    placeholder="O JSON aparecerá aqui após converter"
                                    rows={20}
                                />
                            </div>
                        </div>

                        <div className={styles.converterActions}>
                            <Button 
                                variant="primary"
                                onClick={handleConvertToJson}
                            >
                                Transformar em JSON
                            </Button>
                            {converterJson && (
                                <>
                                    <Button 
                                        variant="secondary"
                                        onClick={handleCopyJson}
                                    >
                                        <Copy size={16} /> Copiar JSON
                                    </Button>
                                    <Button 
                                        variant="primary"
                                        onClick={handleApplyJson}
                                    >
                                        <Check size={16} /> Aplicar
                                    </Button>
                                </>
                            )}
                            <Button 
                                variant="secondary"
                                onClick={() => setConverterOpen(false)}
                            >
                                Fechar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Configuration Modal */}
            <WhatsAppModal 
                isOpen={whatsappModalOpen} 
                onClose={() => setWhatsappModalOpen(false)} 
            />
        </div>
    );
}
