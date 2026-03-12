import styles from '../../settings.module.css';
import type { AiWizardVoiceStep } from '../types';

const OPERATIONAL_RULES_MAX_LENGTH = 300;

interface StepVoiceProps {
    voice: AiWizardVoiceStep;
    errors: {
        operationalRules?: string;
    };
    onChange: <K extends keyof AiWizardVoiceStep>(field: K, value: AiWizardVoiceStep[K]) => void;
}

const toneOptions: Array<{
    value: AiWizardVoiceStep['tone'];
    label: string;
    description: string;
}> = [
    { value: 'friendly', label: 'Amigavel', description: 'Caloroso e acolhedor para atendimento proximo.' },
    { value: 'professional', label: 'Profissional', description: 'Formal e objetivo para comunicacao corporativa.' },
    { value: 'casual', label: 'Casual', description: 'Leve e moderno para conversa descontraida.' },
];

const objectiveOptions: Array<{
    value: AiWizardVoiceStep['objectiveLevel'];
    label: string;
    description: string;
}> = [
    { value: 'short', label: 'Respostas curtas', description: 'Vai direto ao ponto em poucas linhas.' },
    { value: 'normal', label: 'Respostas completas', description: 'Explica com mais contexto quando necessario.' },
];

export function StepVoice({ voice, errors, onChange }: StepVoiceProps) {
    const operationalRulesLength = voice.operationalRules.length;
    const isNearLimit = operationalRulesLength >= OPERATIONAL_RULES_MAX_LENGTH - 30;
    const isAtLimit = operationalRulesLength >= OPERATIONAL_RULES_MAX_LENGTH;

    return (
        <div className={styles.wizardStepContent}>
            <h3 className={styles.aiSubtitle}>Como o agente responde</h3>
            <p className={styles.aiHelp}>
                Defina o estilo de comunicacao para o agente manter consistencia no atendimento.
            </p>

            <div className={styles.wizardToneGrid}>
                {toneOptions.map((tone) => (
                    <button
                        key={tone.value}
                        type="button"
                        className={`${styles.wizardChoiceCard} ${voice.tone === tone.value ? styles.wizardChoiceCardActive : ''}`}
                        onClick={() => onChange('tone', tone.value)}
                    >
                        <span className={styles.wizardChoiceTitle}>{tone.label}</span>
                        <span className={styles.wizardChoiceDescription}>{tone.description}</span>
                    </button>
                ))}
            </div>

            <div className={styles.wizardObjectiveRow}>
                {objectiveOptions.map((objective) => (
                    <button
                        key={objective.value}
                        type="button"
                        className={`${styles.wizardChoiceCard} ${voice.objectiveLevel === objective.value ? styles.wizardChoiceCardActive : ''}`}
                        onClick={() => onChange('objectiveLevel', objective.value)}
                    >
                        <span className={styles.wizardChoiceTitle}>{objective.label}</span>
                        <span className={styles.wizardChoiceDescription}>{objective.description}</span>
                    </button>
                ))}
            </div>

            <div className={styles.wizardFieldBlock}>
                <label className={styles.wizardFieldLabel} htmlFor="wizard-operational-rules">
                    Regras operacionais
                </label>
                <textarea
                    id="wizard-operational-rules"
                    className={`${styles.wizardTextarea} ${isAtLimit ? styles.wizardTextareaError : ''}`}
                    value={voice.operationalRules}
                    onChange={(e) => onChange('operationalRules', e.target.value)}
                    placeholder="Ex: Confirmar disponibilidade antes de fechar o horario e pedir confirmacao do servico escolhido."
                    rows={5}
                    maxLength={OPERATIONAL_RULES_MAX_LENGTH}
                />
                <div className={styles.wizardFieldMeta}>
                    <p className={styles.wizardHint}>
                        Escreva instrucoes simples. O limite evita prompts longos e dificeis de manter.
                    </p>
                    <span
                        className={`${styles.wizardCounter} ${isNearLimit ? styles.wizardCounterWarning : ''} ${isAtLimit ? styles.wizardCounterError : ''}`}
                    >
                        {operationalRulesLength}/{OPERATIONAL_RULES_MAX_LENGTH}
                    </span>
                </div>
                {errors.operationalRules && <p className={styles.wizardError}>{errors.operationalRules}</p>}
            </div>
        </div>
    );
}
