import styles from '../../settings.module.css';
import type { AiWizardVoiceStep } from '../types';

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
    { value: 'friendly', label: 'Amigável', description: 'Caloroso e acolhedor para atendimento próximo.' },
    { value: 'professional', label: 'Profissional', description: 'Formal e objetivo para comunicação corporativa.' },
    { value: 'casual', label: 'Casual', description: 'Leve e moderno para conversa descontraída.' },
];

const objectiveOptions: Array<{
    value: AiWizardVoiceStep['objectiveLevel'];
    label: string;
    description: string;
}> = [
    { value: 'short', label: 'Respostas curtas', description: 'Vai direto ao ponto em poucas linhas.' },
    { value: 'normal', label: 'Respostas completas', description: 'Explica com mais contexto quando necessário.' },
];

export function StepVoice({ voice, errors, onChange }: StepVoiceProps) {
    return (
        <div className={styles.wizardStepContent}>
            <h3 className={styles.aiSubtitle}>Como o agente responde</h3>
            <p className={styles.aiHelp}>
                Defina o estilo de comunicação para o agente manter consistência no atendimento.
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
                    className={styles.wizardTextarea}
                    value={voice.operationalRules}
                    onChange={(e) => onChange('operationalRules', e.target.value)}
                    placeholder="Ex: Confirmar disponibilidade antes de fechar o horário e pedir confirmação do serviço escolhido."
                    rows={5}
                />
                {errors.operationalRules && <p className={styles.wizardError}>{errors.operationalRules}</p>}
            </div>
        </div>
    );
}

