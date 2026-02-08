import { Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import styles from '../../settings.module.css';
import type { AiWizardFaqItem } from '../types';

type FaqItemErrors = Record<
    string,
    {
        question?: string;
        answer?: string;
    }
>;

interface StepFaqPublishProps {
    faqs: AiWizardFaqItem[];
    faqErrors: FaqItemErrors;
    generalError?: string;
    previewText: string;
    status: { type: 'success' | 'error' | 'info'; message: string } | null;
    publishedAtLabel: string | null;
    saving: boolean;
    onFaqChange: (id: string, field: 'question' | 'answer', value: string) => void;
    onAddFaq: () => void;
    onRemoveFaq: (id: string) => void;
    onPublish: () => void;
}

export function StepFaqPublish({
    faqs,
    faqErrors,
    generalError,
    previewText,
    status,
    publishedAtLabel,
    saving,
    onFaqChange,
    onAddFaq,
    onRemoveFaq,
    onPublish,
}: StepFaqPublishProps) {
    return (
        <div className={styles.wizardStepContent}>
            <h3 className={styles.aiSubtitle}>FAQ e publicação</h3>
            <p className={styles.aiHelp}>
                Cadastre perguntas frequentes para respostas rápidas e publique quando estiver satisfeito.
            </p>

            <div className={styles.faqList}>
                {faqs.map((faq, index) => (
                    <div key={faq.id} className={styles.faqItem}>
                        <div className={styles.faqItemHeader}>
                            <strong>Pergunta {index + 1}</strong>
                            {faqs.length > 1 && (
                                <button type="button" className={styles.faqRemoveButton} onClick={() => onRemoveFaq(faq.id)}>
                                    <Trash2 size={14} /> Remover
                                </button>
                            )}
                        </div>

                        <input
                            className={styles.wizardInput}
                            value={faq.question}
                            onChange={(e) => onFaqChange(faq.id, 'question', e.target.value)}
                            placeholder="Ex: Vocês atendem por ordem de chegada?"
                        />
                        {faqErrors[faq.id]?.question && <p className={styles.wizardError}>{faqErrors[faq.id].question}</p>}

                        <textarea
                            className={styles.wizardTextarea}
                            value={faq.answer}
                            onChange={(e) => onFaqChange(faq.id, 'answer', e.target.value)}
                            placeholder="Ex: Trabalhamos com agendamento para garantir pontualidade."
                            rows={3}
                        />
                        {faqErrors[faq.id]?.answer && <p className={styles.wizardError}>{faqErrors[faq.id].answer}</p>}
                    </div>
                ))}
            </div>

            {generalError && <p className={styles.wizardError}>{generalError}</p>}

            <div className={styles.wizardInlineActions}>
                <Button variant="secondary" size="sm" onClick={onAddFaq}>
                    <Plus size={14} /> Adicionar pergunta
                </Button>
            </div>

            <div className={styles.wizardPreviewBox}>
                <h4>Prévia de instruções</h4>
                <p>{previewText}</p>
            </div>

            {publishedAtLabel && (
                <p className={styles.wizardPublished}>
                    <Check size={14} /> Última publicação: {publishedAtLabel}
                </p>
            )}

            {status && (
                <div
                    className={`${styles.wizardStatus} ${
                        status.type === 'success'
                            ? styles.wizardStatusSuccess
                            : status.type === 'error'
                                ? styles.wizardStatusError
                                : styles.wizardStatusInfo
                    }`}
                >
                    {status.message}
                </div>
            )}

            <div className={styles.actions}>
                <Button onClick={onPublish} isLoading={saving}>
                    Publicar agente
                </Button>
            </div>
        </div>
    );
}

