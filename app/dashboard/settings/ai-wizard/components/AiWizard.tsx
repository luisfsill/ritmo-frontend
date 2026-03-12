'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { getCatalog } from '@/lib/catalog';
import { clearLocalAiWizardDraft, loadLocalAiWizardDraft, saveLocalAiWizardDraft } from '../local-draft';
import { hydrateWizardFromPrompt } from '../mapper';
import { buildCompiledPromptFromWizard, buildKnowledgeBaseFromWizard } from '../prompt-builder';
import { StepBusiness } from './StepBusiness';
import { StepFaqPublish } from './StepFaqPublish';
import { StepVoice } from './StepVoice';
import type { AiWizardDraftV1, PendingCommandResponse, TenantProfileForWizard, TenantPromptForWizard } from '../types';
import styles from '../../settings.module.css';

type WizardStep = 1 | 2 | 3;

type WizardStatus = {
    type: 'success' | 'error' | 'info';
    message: string;
};

type FaqErrors = Record<
    string,
    {
        question?: string;
        answer?: string;
    }
>;

type PromptUpdateResponse = TenantPromptForWizard | PendingCommandResponse;

const STEP_LABELS: Record<WizardStep, string> = {
    1: 'Sobre seu negócio',
    2: 'Como o agente responde',
    3: 'FAQ e Publicação',
};

const WIZARD_STEPS: WizardStep[] = [1, 2, 3];
const OPERATIONAL_RULES_MAX_LENGTH = 300;

function cloneDraft(draft: AiWizardDraftV1): AiWizardDraftV1 {
    return JSON.parse(JSON.stringify(draft)) as AiWizardDraftV1;
}

function isPendingResponse(value: PromptUpdateResponse): value is PendingCommandResponse {
    return 'status' in value && value.status === 'pending';
}

function createFaqId(): string {
    return `faq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function AiWizard() {
    const [step, setStep] = useState<WizardStep>(1);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<AiWizardDraftV1 | null>(null);
    const [activePrompt, setActivePrompt] = useState<TenantPromptForWizard | null>(null);
    const [legacyBlocked, setLegacyBlocked] = useState(false);
    const [status, setStatus] = useState<WizardStatus | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [localRecovered, setLocalRecovered] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const [businessErrors, setBusinessErrors] = useState<{
        businessName?: string;
        workingHoursSummary?: string;
        paymentMethodsSummary?: string;
    }>({});
    const [voiceErrors, setVoiceErrors] = useState<{
        operationalRules?: string;
    }>({});
    const [faqErrors, setFaqErrors] = useState<FaqErrors>({});
    const [faqGeneralError, setFaqGeneralError] = useState<string | undefined>(undefined);

    const baselineDraftRef = useRef<AiWizardDraftV1 | null>(null);

    useEffect(() => {
        const loadWizard = async () => {
            setLoading(true);
            setLoadError(null);
            try {
                const [profile, catalog, prompt] = await Promise.all([
                    api.get<TenantProfileForWizard>('/api/v1/tenants/profile'),
                    getCatalog({ force: true }),
                    api.get<TenantPromptForWizard>('/api/v1/prompts/active').catch(() => null),
                ]);

                const hydrated = hydrateWizardFromPrompt(prompt, profile, catalog);
                const baseDraft = cloneDraft(hydrated.draft);
                const localDraft = loadLocalAiWizardDraft(profile.id);

                baselineDraftRef.current = baseDraft;
                setTenantId(profile.id);
                setActivePrompt(prompt);
                setLegacyBlocked(hydrated.isLegacyPrompt && !localDraft);
                setDraft(localDraft ? cloneDraft(localDraft) : baseDraft);
                setLocalRecovered(Boolean(localDraft));
                setHasUnsavedChanges(Boolean(localDraft));

                if (localDraft) {
                    setStatus({
                        type: 'info',
                        message: 'Rascunho local recuperado. Revise e publique quando estiver pronto.',
                    });
                } else if (hydrated.isLegacyPrompt) {
                    setStatus({
                        type: 'info',
                        message: 'Configuração legada detectada. Clique em "Migrar para modo simples" para continuar.',
                    });
                } else {
                    setStatus(null);
                }
            } catch (err) {
                const apiError = err as ApiError;
                setLoadError(apiError.message || 'Não foi possível carregar a configuração de IA.');
            } finally {
                setLoading(false);
            }
        };

        void loadWizard();
    }, []);

    useEffect(() => {
        if (!tenantId || !draft || !hasUnsavedChanges) return;
        saveLocalAiWizardDraft(tenantId, draft);
    }, [tenantId, draft, hasUnsavedChanges]);

    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [hasUnsavedChanges]);

    const previewText = useMemo(() => {
        if (!draft) return '';
        const prompt = buildCompiledPromptFromWizard(draft);
        return prompt.split('\n').slice(0, 4).join(' ');
    }, [draft]);

    const publishedAtLabel = useMemo(() => {
        if (!activePrompt) return null;
        return new Date(activePrompt.created_at).toLocaleString('pt-BR');
    }, [activePrompt]);

    const clearStepErrors = () => {
        setBusinessErrors({});
        setVoiceErrors({});
        setFaqErrors({});
        setFaqGeneralError(undefined);
    };

    const updateBusinessField = <K extends keyof AiWizardDraftV1['business']>(field: K, value: AiWizardDraftV1['business'][K]) => {
        setDraft((current) => (current ? { ...current, business: { ...current.business, [field]: value } } : current));
        setHasUnsavedChanges(true);
        setStatus(null);
        setBusinessErrors((current) => ({ ...current, [field]: undefined }));
    };

    const updateVoiceField = <K extends keyof AiWizardDraftV1['voice']>(field: K, value: AiWizardDraftV1['voice'][K]) => {
        setDraft((current) => (current ? { ...current, voice: { ...current.voice, [field]: value } } : current));
        setHasUnsavedChanges(true);
        setStatus(null);
        setVoiceErrors((current) => ({ ...current, [field]: undefined }));
    };

    const updateFaqField = (faqId: string, field: 'question' | 'answer', value: string) => {
        setDraft((current) => {
            if (!current) return current;
            return {
                ...current,
                faqs: current.faqs.map((faq) => (faq.id === faqId ? { ...faq, [field]: value } : faq)),
            };
        });
        setHasUnsavedChanges(true);
        setStatus(null);
        setFaqErrors((current) => {
            const next = { ...current };
            if (next[faqId]) {
                next[faqId] = { ...next[faqId], [field]: undefined };
            }
            return next;
        });
    };

    const addFaq = () => {
        setDraft((current) => {
            if (!current) return current;
            return {
                ...current,
                faqs: [...current.faqs, { id: createFaqId(), question: '', answer: '' }],
            };
        });
        setHasUnsavedChanges(true);
    };

    const removeFaq = (faqId: string) => {
        setDraft((current) => {
            if (!current) return current;
            const remaining = current.faqs.filter((faq) => faq.id !== faqId);
            return {
                ...current,
                faqs: remaining.length > 0 ? remaining : [{ id: createFaqId(), question: '', answer: '' }],
            };
        });
        setHasUnsavedChanges(true);
        setFaqErrors((current) => {
            const next = { ...current };
            delete next[faqId];
            return next;
        });
    };

    const validateBusinessStep = (source: AiWizardDraftV1): boolean => {
        const errors: typeof businessErrors = {};
        if (!source.business.businessName.trim()) {
            errors.businessName = 'Informe o nome do negócio.';
        }
        if (!source.business.workingHoursSummary.trim()) {
            errors.workingHoursSummary = 'Informe os horários de atendimento.';
        }
        if (!source.business.paymentMethodsSummary.trim()) {
            errors.paymentMethodsSummary = 'Informe as formas de pagamento.';
        }
        setBusinessErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateVoiceStep = (source: AiWizardDraftV1): boolean => {
        const errors: typeof voiceErrors = {};
        if (source.voice.operationalRules.trim().length < 12) {
            errors.operationalRules = 'Descreva regras com pelo menos 12 caracteres.';
        } else if (source.voice.operationalRules.trim().length > OPERATIONAL_RULES_MAX_LENGTH) {
            errors.operationalRules = `Use no maximo ${OPERATIONAL_RULES_MAX_LENGTH} caracteres nas regras operacionais.`;
        }
        setVoiceErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateFaqStep = (source: AiWizardDraftV1): boolean => {
        const errors: FaqErrors = {};
        source.faqs.forEach((faq) => {
            const question = faq.question.trim();
            const answer = faq.answer.trim();
            if (!question && !answer) return;
            const itemErrors: { question?: string; answer?: string } = {};
            if (!question) itemErrors.question = 'Preencha a pergunta ou remova este item.';
            if (!answer) itemErrors.answer = 'Preencha a resposta ou remova este item.';
            if (itemErrors.question || itemErrors.answer) {
                errors[faq.id] = itemErrors;
            }
        });
        setFaqErrors(errors);
        setFaqGeneralError(Object.keys(errors).length > 0 ? 'Revise os itens de FAQ com erro.' : undefined);
        return Object.keys(errors).length === 0;
    };

    const goNext = () => {
        if (!draft) return;
        let valid = true;
        if (step === 1) valid = validateBusinessStep(draft);
        if (step === 2) valid = validateVoiceStep(draft);
        if (!valid) return;
        setStep((current) => (current < 3 ? ((current + 1) as WizardStep) : current));
    };

    const goBack = () => {
        setStep((current) => (current > 1 ? ((current - 1) as WizardStep) : current));
    };

    const validateAll = (source: AiWizardDraftV1): boolean => {
        const businessValid = validateBusinessStep(source);
        const voiceValid = validateVoiceStep(source);
        const faqValid = validateFaqStep(source);
        if (!businessValid) setStep(1);
        else if (!voiceValid) setStep(2);
        else if (!faqValid) setStep(3);
        return businessValid && voiceValid && faqValid;
    };

    const publish = async () => {
        if (!draft) return;
        if (legacyBlocked) {
            setStatus({ type: 'error', message: 'Migre a configuração legada antes de publicar no modo simples.' });
            return;
        }
        if (!validateAll(draft)) return;

        setSaving(true);
        setStatus(null);
        try {
            const payload = {
                compiled_prompt: buildCompiledPromptFromWizard(draft),
                prompt_version: (activePrompt?.prompt_version || 0) + 1,
                knowledge_base: buildKnowledgeBaseFromWizard(draft),
                tone_settings: {
                    tone: draft.voice.tone,
                    objective_level: draft.voice.objectiveLevel,
                },
            };

            const result = await api.put<PromptUpdateResponse>('/api/v1/prompts/active', payload);
            if (isPendingResponse(result)) {
                setStatus({
                    type: 'info',
                    message: 'Publicação recebida. A configuração está sendo processada e será aplicada em breve.',
                });
                return;
            }

            setActivePrompt(result);
            setStatus({
                type: 'success',
                message: 'Agente publicado com sucesso.',
            });
            baselineDraftRef.current = cloneDraft(draft);
            if (tenantId) {
                clearLocalAiWizardDraft(tenantId);
            }
            setHasUnsavedChanges(false);
            setLocalRecovered(false);
            clearStepErrors();
        } catch (err) {
            const apiError = err as ApiError;
            setStatus({
                type: 'error',
                message: apiError.message || 'Não foi possível publicar o agente. Tente novamente.',
            });
        } finally {
            setSaving(false);
        }
    };

    const migrateLegacyPrompt = () => {
        setLegacyBlocked(false);
        setHasUnsavedChanges(true);
        setStatus({
            type: 'info',
            message: 'Modo simples ativado. Revise os dados e publique para concluir a migração.',
        });
    };

    const discardDraft = () => {
        if (!baselineDraftRef.current) return;
        setDraft(cloneDraft(baselineDraftRef.current));
        if (tenantId) {
            clearLocalAiWizardDraft(tenantId);
        }
        clearStepErrors();
        setStatus({
            type: 'info',
            message: 'Rascunho descartado. Voltamos para a última configuração publicada.',
        });
        setHasUnsavedChanges(false);
        setLocalRecovered(false);
    };

    if (loading) {
        return (
            <div className={styles.wizardLoading}>
                <Loader2 size={20} className={styles.spinner} />
                <span>Carregando configuração do agente...</span>
            </div>
        );
    }

    if (loadError || !draft) {
        return (
            <div className={styles.wizardLoadError}>
                <AlertTriangle size={18} />
                <p>{loadError || 'Não foi possível carregar o wizard de IA.'}</p>
            </div>
        );
    }

    if (legacyBlocked) {
        return (
            <div className={styles.legacyBlock}>
                <h3 className={styles.aiSubtitle}>Configuração legada detectada</h3>
                <p className={styles.aiHelp}>
                    Sua configuração atual foi criada no formato antigo. Para evitar sobrescrita automática, a migração para o modo simples
                    precisa ser confirmada manualmente.
                </p>
                <div className={styles.actions}>
                    <Button onClick={migrateLegacyPrompt}>Migrar para modo simples</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.aiWizard}>
            <div className={styles.aiHeader}>
                <div>
                    <h2 className={styles.sectionTitle}>Configurar Agente de IA</h2>
                    <p className={styles.aiDescription}>Fluxo rápido em 3 passos para publicar um agente pronto para atendimento.</p>
                </div>
                <div className={styles.wizardHeaderActions}>
                    {localRecovered && <span className={styles.wizardLocalTag}>Rascunho recuperado</span>}
                    {hasUnsavedChanges && (
                        <Button variant="secondary" size="sm" onClick={discardDraft}>
                            Descartar rascunho
                        </Button>
                    )}
                </div>
            </div>

            <div className={styles.wizardSteps}>
                {WIZARD_STEPS.map((stepNumber) => {
                    return (
                        <button
                            key={stepNumber}
                            type="button"
                            className={`${styles.wizardStepChip} ${step === stepNumber ? styles.wizardStepChipActive : ''}`}
                            onClick={() => setStep(stepNumber)}
                        >
                            <span className={styles.wizardStepNumber}>{stepNumber}</span>
                            <span>{STEP_LABELS[stepNumber]}</span>
                        </button>
                    );
                })}
            </div>

            {step === 1 && (
                <StepBusiness
                    business={draft.business}
                    errors={businessErrors}
                    onChange={updateBusinessField}
                />
            )}
            {step === 2 && (
                <StepVoice
                    voice={draft.voice}
                    errors={voiceErrors}
                    onChange={updateVoiceField}
                />
            )}
            {step === 3 && (
                <StepFaqPublish
                    faqs={draft.faqs}
                    faqErrors={faqErrors}
                    generalError={faqGeneralError}
                    previewText={previewText}
                    status={status}
                    publishedAtLabel={publishedAtLabel}
                    saving={saving}
                    onFaqChange={updateFaqField}
                    onAddFaq={addFaq}
                    onRemoveFaq={removeFaq}
                    onPublish={publish}
                />
            )}

            {step !== 3 && (
                <div className={styles.wizardFooter}>
                    {step > 1 && (
                        <Button variant="secondary" onClick={goBack}>
                            Voltar
                        </Button>
                    )}
                    <Button onClick={goNext}>Continuar</Button>
                </div>
            )}
        </div>
    );
}
