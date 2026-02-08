import { AI_WIZARD_MARKER_KEY } from './types';
import type { AiWizardDraftV1, AiWizardFaqItem, AiWizardMarkerV1 } from './types';

function normalizeFaqs(faqs: AiWizardFaqItem[]): AiWizardFaqItem[] {
    return faqs
        .map((item) => ({
            ...item,
            question: item.question.trim(),
            answer: item.answer.trim(),
        }))
        .filter((item) => item.question && item.answer);
}

export function buildCompiledPromptFromWizard(draft: AiWizardDraftV1): string {
    const normalizedFaqs = normalizeFaqs(draft.faqs);
    const faqBlock =
        normalizedFaqs.length === 0
            ? '- Não há perguntas frequentes cadastradas.'
            : normalizedFaqs.map((item, index) => `${index + 1}. ${item.question}: ${item.answer}`).join('\n');

    const objectiveInstruction =
        draft.voice.objectiveLevel === 'short'
            ? 'Responda de forma curta, direta e sem rodeios.'
            : 'Responda de forma clara, com contexto suficiente para o cliente decidir.';

    return [
        `Você é o assistente virtual de ${draft.business.businessName || 'um negócio de serviços'}.`,
        'Seu objetivo é atender clientes, esclarecer dúvidas e conduzir para o agendamento de forma segura.',
        '',
        'Contexto do negócio:',
        `- Tipo de negócio: ${draft.business.businessType || 'Não informado'}.`,
        `- Região de atendimento: ${[draft.business.city, draft.business.neighborhood].filter(Boolean).join(' - ') || 'Não informado'}.`,
        `- Horários de atendimento: ${draft.business.workingHoursSummary || 'Não informado'}.`,
        `- Formas de pagamento: ${draft.business.paymentMethodsSummary || 'Não informado'}.`,
        `- Serviços ativos: ${draft.business.servicesSummary || 'Não informado'}.`,
        '',
        'Estilo de resposta:',
        `- Tom: ${draft.voice.tone}.`,
        `- Objetividade: ${draft.voice.objectiveLevel}.`,
        `- Regra de objetividade: ${objectiveInstruction}`,
        `- Regras operacionais: ${draft.voice.operationalRules || 'Não há regras adicionais.'}`,
        '',
        'Perguntas frequentes (FAQ):',
        faqBlock,
        '',
        'Diretrizes obrigatórias:',
        '- Nunca invente horários, preços ou políticas.',
        '- Em caso de dúvida, peça confirmação de forma educada.',
        '- Mantenha foco no atendimento e no agendamento.',
    ].join('\n');
}

export function buildKnowledgeBaseFromWizard(draft: AiWizardDraftV1): Record<string, unknown> {
    const normalizedFaqs = normalizeFaqs(draft.faqs);
    const marker: AiWizardMarkerV1 = {
        version: 1,
        saved_at: new Date().toISOString(),
        draft,
    };

    return {
        [AI_WIZARD_MARKER_KEY]: marker,
        faq: normalizedFaqs,
        business_info: {
            business_name: draft.business.businessName,
            business_type: draft.business.businessType,
            city: draft.business.city,
            neighborhood: draft.business.neighborhood,
            working_hours: draft.business.workingHoursSummary,
            payment_methods: draft.business.paymentMethodsSummary,
            services_summary: draft.business.servicesSummary,
        },
        assistant_style: {
            tone: draft.voice.tone,
            objective_level: draft.voice.objectiveLevel,
            operational_rules: draft.voice.operationalRules,
        },
    };
}

