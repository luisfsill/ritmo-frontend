import { Input } from '@/components/ui';
import styles from '../../settings.module.css';
import type { AiWizardBusinessStep } from '../types';

interface StepBusinessProps {
    business: AiWizardBusinessStep;
    errors: {
        businessName?: string;
        workingHoursSummary?: string;
        paymentMethodsSummary?: string;
    };
    onChange: <K extends keyof AiWizardBusinessStep>(field: K, value: AiWizardBusinessStep[K]) => void;
}

export function StepBusiness({ business, errors, onChange }: StepBusinessProps) {
    return (
        <div className={styles.wizardStepContent}>
            <h3 className={styles.aiSubtitle}>Sobre seu negócio</h3>
            <p className={styles.aiHelp}>
                Preencha informações básicas para o agente responder de forma mais precisa.
            </p>

            <div className={styles.wizardFieldGrid}>
                <Input
                    label="Nome do negócio"
                    value={business.businessName}
                    onChange={(e) => onChange('businessName', e.target.value)}
                    error={errors.businessName}
                    placeholder="Ex: Studio Bela Forma"
                />
                <Input
                    label="Tipo de negócio"
                    value={business.businessType}
                    onChange={(e) => onChange('businessType', e.target.value)}
                    placeholder="Ex: Salão de beleza"
                />
                <Input
                    label="Cidade"
                    value={business.city}
                    onChange={(e) => onChange('city', e.target.value)}
                    placeholder="Ex: São Paulo"
                />
                <Input
                    label="Bairro ou região"
                    value={business.neighborhood}
                    onChange={(e) => onChange('neighborhood', e.target.value)}
                    placeholder="Ex: Vila Mariana"
                />
            </div>

            <div className={styles.wizardFieldBlock}>
                <label className={styles.wizardFieldLabel} htmlFor="wizard-working-hours">
                    Horários de atendimento
                </label>
                <textarea
                    id="wizard-working-hours"
                    className={styles.wizardTextarea}
                    value={business.workingHoursSummary}
                    onChange={(e) => onChange('workingHoursSummary', e.target.value)}
                    placeholder="Ex: Segunda a sábado, das 9h às 19h"
                    rows={3}
                />
                {errors.workingHoursSummary && <p className={styles.wizardError}>{errors.workingHoursSummary}</p>}
            </div>

            <div className={styles.wizardFieldBlock}>
                <label className={styles.wizardFieldLabel} htmlFor="wizard-payment-methods">
                    Formas de pagamento
                </label>
                <textarea
                    id="wizard-payment-methods"
                    className={styles.wizardTextarea}
                    value={business.paymentMethodsSummary}
                    onChange={(e) => onChange('paymentMethodsSummary', e.target.value)}
                    placeholder="Ex: Pix, cartão de crédito e débito"
                    rows={3}
                />
                {errors.paymentMethodsSummary && <p className={styles.wizardError}>{errors.paymentMethodsSummary}</p>}
            </div>

            <div className={styles.wizardFieldBlock}>
                <label className={styles.wizardFieldLabel} htmlFor="wizard-services-summary">
                    Serviços ativos encontrados
                </label>
                <textarea
                    id="wizard-services-summary"
                    className={`${styles.wizardTextarea} ${styles.wizardReadonly}`}
                    value={business.servicesSummary}
                    readOnly
                    rows={4}
                />
                <p className={styles.wizardHint}>Esse resumo é gerado automaticamente a partir do seu catálogo.</p>
            </div>
        </div>
    );
}
