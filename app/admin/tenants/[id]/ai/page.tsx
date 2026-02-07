'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import {
    ArrowLeft,
    Bot,
    Save,
    Loader2,
    RotateCcw,
    History,
    Check,
    X,
    Copy,
    Building2,
    AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { adminApi } from '@/lib/admin-api';
import styles from './ai.module.css';

interface AdminTenant {
    id: string;
    slug: string;
    business_name: string;
    status: string | null;
    created_at: string;
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

interface ImpersonationSession {
    session_id: string;
    access_token: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_RITMO_API_URL;

export default function AdminTenantAIPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: tenantId } = use(params);

    // Tenant info
    const [tenant, setTenant] = useState<AdminTenant | null>(null);
    const [loading, setLoading] = useState(true);

    // Impersonation state
    const [impersonationSession, setImpersonationSession] = useState<ImpersonationSession | null>(null);
    const [impersonationError, setImpersonationError] = useState<string | null>(null);
    const impersonationSessionRef = useRef<ImpersonationSession | null>(null);

    // AI Prompt state
    const [activePrompt, setActivePrompt] = useState<TenantPrompt | null>(null);
    const [promptVersions, setPromptVersions] = useState<TenantPromptVersion[]>([]);
    const [promptSaving, setPromptSaving] = useState(false);
    const [promptLoading, setPromptLoading] = useState(false);
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

    // Helper to make requests with impersonation token
    const impersonatedFetch = useCallback(async <T,>(
        endpoint: string,
        options: { method?: string; body?: unknown } = {}
    ): Promise<T> => {
        const session = impersonationSessionRef.current;
        if (!session) {
            throw new Error('No impersonation session');
        }

        const { method = 'GET', body } = options;

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }, []);

    // Fetch tenant data and start impersonation
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch tenant info
                const tenantData = await adminApi.get<AdminTenant>(`/api/v1/admin/tenants/${tenantId}`);
                setTenant(tenantData);

                // Start impersonation
                try {
                    const session = await adminApi.post<ImpersonationSession>('/api/v1/admin/impersonation/start', {
                        tenant_id: tenantId,
                        mode: 'READ_WRITE',
                        reason: 'Configuração de IA pelo admin',
                        ttl_minutes: 30,
                    });
                    setImpersonationSession(session);
                    impersonationSessionRef.current = session;
                    setImpersonationError(null);
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar sessão';
                    setImpersonationError(errorMessage);
                }
            } catch (err) {
                console.error('Erro ao carregar dados:', err);
                showToast('Erro ao carregar dados do tenant.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Cleanup: stop impersonation when leaving page
        return () => {
            const session = impersonationSessionRef.current;
            if (session) {
                adminApi.post('/api/v1/admin/impersonation/stop', {
                    session_id: session.session_id,
                }).catch(console.error);
            }
        };
    }, [tenantId]);

    // Fetch prompt data after impersonation is ready
    useEffect(() => {
        if (!impersonationSession) return;

        const fetchPromptData = async () => {
            try {
                const prompt = await impersonatedFetch<TenantPrompt>('/api/v1/prompts/active');
                setActivePrompt(prompt);
                setPromptForm({
                    compiled_prompt: prompt.compiled_prompt,
                    knowledge_base: prompt.knowledge_base ? JSON.stringify(prompt.knowledge_base, null, 2) : '',
                    tone: (prompt.tone_settings?.tone as 'friendly' | 'professional' | 'casual') || 'friendly',
                });
            } catch {
                // No active prompt
                setActivePrompt(null);
            }
        };

        fetchPromptData();
    }, [impersonationSession, impersonatedFetch]);

    // Fetch prompt versions
    const fetchPromptVersions = async () => {
        if (!impersonationSessionRef.current) return;

        try {
            const versions = await impersonatedFetch<TenantPromptVersion[]>('/api/v1/prompts');
            setPromptVersions(versions);
        } catch (err) {
            console.error('Erro ao carregar versões:', err);
        }
    };

    // Retry impersonation
    const retryImpersonation = async () => {
        setImpersonationError(null);
        try {
            const session = await adminApi.post<ImpersonationSession>('/api/v1/admin/impersonation/start', {
                tenant_id: tenantId,
                mode: 'READ_WRITE',
                reason: 'Configuração de IA pelo admin',
                ttl_minutes: 30,
            });
            setImpersonationSession(session);
            impersonationSessionRef.current = session;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar sessão';
            setImpersonationError(errorMessage);
        }
    };

    // Save prompt
    const handleSavePrompt = async () => {
        if (!impersonationSessionRef.current) {
            showToast('Sessão de admin expirada. Recarregue a página.', 'error');
            return;
        }

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

            const result = await impersonatedFetch<TenantPrompt>('/api/v1/prompts/active', {
                method: 'PUT',
                body: payload,
            });

            setActivePrompt(result);
            setPromptSaveSuccess(true);
            showToast('Configuração de IA salva com sucesso!', 'success');
            setTimeout(() => setPromptSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Erro ao salvar:', err);
            showToast('Erro ao salvar configuração de IA.', 'error');
        } finally {
            setPromptSaving(false);
        }
    };

    // Activate version
    const handleActivateVersion = async (promptId: string) => {
        if (!impersonationSessionRef.current) return;
        if (!confirm('Deseja ativar esta versão do prompt?')) return;

        setPromptLoading(true);
        try {
            const result = await impersonatedFetch<TenantPrompt>(`/api/v1/prompts/${promptId}/activate`, {
                method: 'POST',
                body: {},
            });

            setActivePrompt(result);
            setPromptForm({
                compiled_prompt: result.compiled_prompt,
                knowledge_base: result.knowledge_base ? JSON.stringify(result.knowledge_base, null, 2) : '',
                tone: (result.tone_settings?.tone as 'friendly' | 'professional' | 'casual') || 'friendly',
            });
            showToast('Versão ativada com sucesso!', 'success');
            fetchPromptVersions();
        } catch {
            showToast('Erro ao ativar versão.', 'error');
        } finally {
            setPromptLoading(false);
        }
    };

    // Reset prompt
    const handleResetPrompt = async () => {
        if (!impersonationSessionRef.current) return;
        if (!confirm('Tem certeza que deseja resetar o prompt para o padrão? Esta ação não pode ser desfeita.')) return;

        setPromptLoading(true);
        try {
            await impersonatedFetch('/api/v1/prompts/active', { method: 'DELETE' });
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
            <div className={styles.loadingContainer}>
                <Loader2 size={32} className={styles.spinner} />
                <p>Carregando dados...</p>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className={styles.loadingContainer}>
                <p>Tenant não encontrado.</p>
                <Link href="/admin/tenants" className={styles.backLink}>
                    Voltar para lista de empresas
                </Link>
            </div>
        );
    }

    if (impersonationError) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <Link href={`/admin/tenants/${tenantId}`} className={styles.backButton}>
                        <ArrowLeft size={20} />
                        Voltar
                    </Link>
                    <div className={styles.headerInfo}>
                        <h1 className={styles.title}>Configurar IA</h1>
                        <div className={styles.tenantBadge}>
                            <Building2 size={14} />
                            <span>{tenant.business_name}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.errorBox}>
                    <AlertTriangle size={24} />
                    <div>
                        <strong>Não foi possível acessar as configurações</strong>
                        <p>{impersonationError}</p>
                        <p className={styles.errorHint}>
                            Este tenant pode não ter usuários ativos ou pode estar suspenso.
                        </p>
                    </div>
                    <Button onClick={retryImpersonation} variant="secondary" size="sm">
                        Tentar novamente
                    </Button>
                </div>
            </div>
        );
    }

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
                <Link href={`/admin/tenants/${tenantId}`} className={styles.backButton}>
                    <ArrowLeft size={20} />
                    Voltar
                </Link>
                <div className={styles.headerInfo}>
                    <h1 className={styles.title}>Configurar IA</h1>
                    <div className={styles.tenantBadge}>
                        <Building2 size={14} />
                        <span>{tenant.business_name}</span>
                        <span className={styles.tenantSlug}>/{tenant.slug}</span>
                    </div>
                </div>
            </div>

            {/* Impersonation Notice */}
            <div className={styles.impersonationNotice}>
                <Bot size={18} />
                <span>Você está editando as configurações de IA como administrador da plataforma.</span>
            </div>

            <div className={styles.content}>
                <div className={styles.section}>
                    <div className={styles.aiHeader}>
                        <div>
                            <h2 className={styles.sectionTitle}>
                                <Bot size={20} />
                                Configurar Agente de IA
                            </h2>
                            <p className={styles.aiDescription}>
                                Personalize como o assistente virtual interage com os clientes deste negócio
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
                </div>
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
        </div>
    );
}
