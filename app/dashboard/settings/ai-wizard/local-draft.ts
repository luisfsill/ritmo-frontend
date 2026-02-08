import type { AiWizardDraftV1 } from './types';

function isWizardDraft(value: unknown): value is AiWizardDraftV1 {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<AiWizardDraftV1>;
    return candidate.version === 1 && !!candidate.business && !!candidate.voice && Array.isArray(candidate.faqs);
}

function getDraftStorageKey(tenantId: string): string {
    return `ritmo_ai_wizard_draft_v1:${tenantId}`;
}

export function loadLocalAiWizardDraft(tenantId: string): AiWizardDraftV1 | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(getDraftStorageKey(tenantId));
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!isWizardDraft(parsed)) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function saveLocalAiWizardDraft(tenantId: string, draft: AiWizardDraftV1): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(getDraftStorageKey(tenantId), JSON.stringify(draft));
    } catch {
        // Ignore storage quota/runtime errors.
    }
}

export function clearLocalAiWizardDraft(tenantId: string): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(getDraftStorageKey(tenantId));
    } catch {
        // Ignore storage runtime errors.
    }
}

