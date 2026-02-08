import type { CatalogResponse } from '@/lib/catalog';

export const AI_WIZARD_MARKER_KEY = '__ritmo_wizard_v1';

export type AiTone = 'friendly' | 'professional' | 'casual';
export type AiObjectiveLevel = 'short' | 'normal';

export interface AiWizardBusinessStep {
    businessName: string;
    businessType: string;
    city: string;
    neighborhood: string;
    workingHoursSummary: string;
    paymentMethodsSummary: string;
    servicesSummary: string;
}

export interface AiWizardVoiceStep {
    tone: AiTone;
    objectiveLevel: AiObjectiveLevel;
    operationalRules: string;
}

export interface AiWizardFaqItem {
    id: string;
    question: string;
    answer: string;
}

export interface AiWizardDraftV1 {
    version: 1;
    business: AiWizardBusinessStep;
    voice: AiWizardVoiceStep;
    faqs: AiWizardFaqItem[];
}

export interface AiWizardMarkerV1 {
    version: 1;
    saved_at: string;
    draft: AiWizardDraftV1;
}

export interface TenantProfileForWizard {
    id: string;
    slug: string;
    business_name: string;
    business_type: string | null;
    phone: string | null;
    address: { street?: string; city?: string } | null;
}

export interface TenantPromptForWizard {
    id: string;
    compiled_prompt: string;
    prompt_version: number;
    knowledge_base: Record<string, unknown> | null;
    tone_settings: Record<string, unknown> | null;
    activated_at: string | null;
    created_at: string;
}

export interface PendingCommandResponse {
    status: 'pending';
    command_id: string;
    message: string;
}

export interface HydrateWizardResult {
    draft: AiWizardDraftV1;
    isLegacyPrompt: boolean;
}

export interface WizardBootstrapData {
    profile: TenantProfileForWizard;
    catalog: CatalogResponse;
    prompt: TenantPromptForWizard | null;
}

