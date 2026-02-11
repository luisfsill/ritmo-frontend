'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { CheckCircle2, Sparkles, User, Zap } from 'lucide-react';
import { demoSteps } from './content';
import { WhatsAppButton } from './WhatsAppButton';
import {
  AnimatePresence,
  MotionDiv,
  MotionSection,
  getDirectionalOffset,
  presenceSlideFade,
  sectionRevealVariantsStrong,
  useScrollDirection,
  viewportRepeat,
} from './motion';
import styles from './DemoSection.module.css';

type DemoSectionProps = {
  whatsappHrefByStep: Record<string, string>;
  registerHref: string;
  onWhatsappClick: (stepId: string, index: number) => void;
  onRegisterClick: () => void;
  onStepViewed: (stepId: string, index: number) => void;
  onStepCtaClick: (stepId: string, index: number) => void;
};

export const DemoSection = memo(function DemoSection({
  whatsappHrefByStep,
  registerHref,
  onWhatsappClick,
  onRegisterClick,
  onStepViewed,
  onStepCtaClick,
}: DemoSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();
  const current = demoSteps[activeIndex];
  const fallbackWhatsappHref = whatsappHrefByStep[demoSteps[0].id] || Object.values(whatsappHrefByStep)[0] || '#';
  const currentWhatsappHref = whatsappHrefByStep[current.id] || fallbackWhatsappHref;
  const progressWidth = useMemo(() => ((activeIndex + 1) / demoSteps.length) * 100, [activeIndex]);

  useEffect(() => {
    onStepViewed(current.id, activeIndex);
  }, [activeIndex, current.id, onStepViewed]);

  return (
    <MotionSection
      id="demo"
      className={styles.section}
      initial="hidden"
      whileInView="visible"
      viewport={viewportRepeat}
      custom={scrollDirection}
      variants={reduceMotion ? undefined : sectionRevealVariantsStrong}
    >
      <div className={styles.inner}>
        <MotionDiv
          className={styles.copy}
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: getDirectionalOffset(scrollDirection, 26) }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportRepeat}
          transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={styles.eyebrow}>
            <Sparkles size={14} />
            Velocidade no atendimento
          </span>
          <h2 className={styles.title}>Cliente agenda em <strong>1 minuto</strong>, você <strong>não faz nada</strong></h2>
          <p className={styles.subtitle}>Veja como a conversa flui <strong>sozinha</strong>: da primeira mensagem até a confirmação, <strong>sem sua equipe parar</strong> o que está fazendo.</p>
        </MotionDiv>

        <div className={styles.stepRail} role="tablist" aria-label="Etapas da demonstração">
          {demoSteps.map((step, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={step.id}
                className={`${styles.stepButton} ${isActive ? styles.stepButtonActive : ''}`}
                onClick={() => setActiveIndex(index)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`demo-step-panel-${step.id}`}
              >
                <span className={styles.stepDot} aria-hidden>{index + 1}</span>
                <span className={styles.stepLabel}>Etapa {index + 1}</span>
                <span className={styles.stepTitle}>{step.title.replace(/^\d+\.\s*/, '')}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.progressTrack} aria-hidden>
          <MotionDiv
            className={styles.progressBar}
            animate={{ width: `${progressWidth}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <AnimatePresence mode="wait">
          <MotionDiv
            key={current.id}
            className={styles.card}
            initial={reduceMotion ? { opacity: 1, y: 0 } : presenceSlideFade.initial}
            animate={presenceSlideFade.animate}
            exit={reduceMotion ? { opacity: 1, y: 0 } : presenceSlideFade.exit}
            transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
            id={`demo-step-panel-${current.id}`}
            role="tabpanel"
          >
            <div className={styles.cardBody}>
              <div className={styles.summaryCol}>
                <article className={`${styles.summaryItem} ${styles.summaryUser}`}>
                  <div className={styles.summaryHeader}>
                    <span className={styles.summaryIcon}><User size={15} /></span>
                    <h3>Situação do cliente</h3>
                  </div>
                  <p dangerouslySetInnerHTML={{ __html: current.userSituation }} />
                </article>
                <article className={`${styles.summaryItem} ${styles.summaryRitmo}`}>
                  <div className={styles.summaryHeader}>
                    <span className={styles.summaryIcon}><Zap size={15} /></span>
                    <h3>O que a Ritmo faz</h3>
                  </div>
                  <p dangerouslySetInnerHTML={{ __html: current.ritmoAction }} />
                </article>
                <article className={`${styles.summaryItem} ${styles.summaryOutcome}`}>
                  <div className={styles.summaryHeader}>
                    <span className={styles.summaryIcon}><CheckCircle2 size={15} /></span>
                    <h3>Resultado prático</h3>
                  </div>
                  <p dangerouslySetInnerHTML={{ __html: current.outcome }} />
                </article>
              </div>

              <div className={styles.previewCol}>
                <div className={styles.phoneFrame}>
                  <div className={styles.phoneHeader}>
                    <span className={styles.phoneDot} />
                    <span className={styles.phoneBar}>WhatsApp</span>
                    <span className={styles.phoneDot} />
                  </div>
                  <div className={styles.previewList}>
                    {current.preview.map((message) => (
                      <article
                        key={`${current.id}-${message.author}-${message.text}`}
                        className={`${styles.messageBubble} ${
                          message.author === 'Cliente' ? styles.messageCustomer : styles.messageRitmo
                        }`}
                      >
                        <span className={styles.author}>{message.author}</span>
                        <p>{message.text}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.cardActions}>
              <WhatsAppButton
                href={currentWhatsappHref}
                onClick={() => {
                  onStepCtaClick(current.id, activeIndex);
                  onWhatsappClick(current.id, activeIndex);
                }}
                variant="primary"
                size="md"
                showArrow
                className={styles.primaryCta}
              >
                {current.ctaLabel}
              </WhatsAppButton>
              <Link href={registerHref} className={styles.secondaryCta} onClick={onRegisterClick}>
                Criar conta grátis
              </Link>
            </div>
          </MotionDiv>
        </AnimatePresence>
      </div>
    </MotionSection>
  );
});
