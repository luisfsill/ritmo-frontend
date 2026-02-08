import { AI_WIZARD_MARKER_KEY } from './types';
import type {
    AiObjectiveLevel,
    AiTone,
    AiWizardDraftV1,
    AiWizardFaqItem,
    AiWizardMarkerV1,
    HydrateWizardResult,
    TenantProfileForWizard,
    TenantPromptForWizard,
} from './types';
import type { CatalogResponse } from '@/lib/catalog';

function createFaqId(index: number): string {
    return `faq_${index + 1}`;
}

function isTone(value: unknown): value is AiTone {
    return value === 'friendly' || value === 'professional' || value === 'casual';
}

function isObjectiveLevel(value: unknown): value is AiObjectiveLevel {
    return value === 'short' || value === 'normal';
}

function safeString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function cloneDraft(draft: AiWizardDraftV1): AiWizardDraftV1 {
    return JSON.parse(JSON.stringify(draft)) as AiWizardDraftV1;
}

function parseFaqsFromKnowledgeBase(knowledgeBase: Record<string, unknown> | null | undefined): AiWizardFaqItem[] {
    if (!knowledgeBase) return [];
    const faq = knowledgeBase.faq;
    if (!Array.isArray(faq)) return [];
    return faq
        .map((entry, index) => {
            const candidate = entry as { question?: unknown; answer?: unknown };
            const question = safeString(candidate.question).trim();
            const answer = safeString(candidate.answer).trim();
            if (!question || !answer) return null;
            return {
                id: createFaqId(index),
                question,
                answer,
            };
        })
        .filter((entry): entry is AiWizardFaqItem => !!entry);
}

function parsePaymentMethods(knowledgeBase: Record<string, unknown> | null | undefined): string {
    if (!knowledgeBase) return '';
    const businessInfo = knowledgeBase.business_info as { payment_methods?: unknown } | undefined;
    if (businessInfo && Array.isArray(businessInfo.payment_methods)) {
        return businessInfo.payment_methods.filter((item) => typeof item === 'string').join(', ');
    }
    return '';
}

function summarizeServices(catalog: CatalogResponse): string {
    const activeServices = catalog.services.filter((service) => service.is_active);
    if (activeServices.length === 0) {
        return 'Nenhum serviço ativo encontrado. Cadastre serviços para melhorar as respostas do agente.';
    }
    return activeServices
        .slice(0, 12)
        .map((service) => `${service.name} (${service.duration_minutes} min)`)
        .join(', ');
}

export function createDefaultWizardDraft(
    profile: TenantProfileForWizard,
    catalog: CatalogResponse,
    prompt: TenantPromptForWizard | null
): AiWizardDraftV1 {
    const toneValue = prompt?.tone_settings ? (prompt.tone_settings.tone as unknown) : null;
    const tone: AiTone = isTone(toneValue) ? toneValue : 'friendly';
    const objectiveValue = prompt?.tone_settings ? (prompt.tone_settings.objective_level as unknown) : null;
    const objectiveLevel: AiObjectiveLevel = isObjectiveLevel(objectiveValue) ? objectiveValue : 'normal';
    const faqs = parseFaqsFromKnowledgeBase(prompt?.knowledge_base ?? null);
    const paymentMethodsFromPrompt = parsePaymentMethods(prompt?.knowledge_base ?? null);

    return {
        version: 1,
        business: {
            businessName: profile.business_name || catalog.tenant.business_name || '',
            businessType: profile.business_type || '',
            city: profile.address?.city || '',
            neighborhood: profile.address?.street || '',
            workingHoursSummary: 'Segunda a sábado, horário comercial.',
            paymentMethodsSummary: paymentMethodsFromPrompt || 'Pix, cartão e dinheiro.',
            servicesSummary: summarizeServices(catalog),
        },
        voice: {
            tone,
            objectiveLevel,
            operationalRules:
                'Confirmar dados antes de concluir agendamentos e não prometer horários sem validar disponibilidade.',
        },
        faqs: faqs.length > 0 ? faqs : [{ id: createFaqId(0), question: '', answer: '' }],
    };
}

function isWizardMarker(value: unknown): value is AiWizardMarkerV1 {
    if (!value || typeof value !== 'object') return false;
    const marker = value as Partial<AiWizardMarkerV1>;
    if (marker.version !== 1 || !marker.draft || typeof marker.draft !== 'object') return false;
    const draft = marker.draft as Partial<AiWizardDraftV1>;
    return draft.version === 1 && !!draft.business && !!draft.voice && Array.isArray(draft.faqs);
}

export function hydrateWizardFromPrompt(
    prompt: TenantPromptForWizard | null,
    profile: TenantProfileForWizard,
    catalog: CatalogResponse
): HydrateWizardResult {
    const defaultDraft = createDefaultWizardDraft(profile, catalog, prompt);
    if (!prompt || !prompt.knowledge_base) {
        return {
            draft: defaultDraft,
            isLegacyPrompt: false,
        };
    }

    const marker = prompt.knowledge_base[AI_WIZARD_MARKER_KEY];
    if (!isWizardMarker(marker)) {
        return {
            draft: defaultDraft,
            isLegacyPrompt: true,
        };
    }

    const draftFromMarker = cloneDraft(marker.draft);
    if (!draftFromMarker.faqs.length) {
        draftFromMarker.faqs = [{ id: createFaqId(0), question: '', answer: '' }];
    }
    return {
        draft: draftFromMarker,
        isLegacyPrompt: false,
    };
}

