'use client';

import { memo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { BellRing, CalendarClock, DollarSign, UserRoundSearch } from 'lucide-react';
import { revenueScenarios } from './content';
import { WhatsAppButton } from './WhatsAppButton';
import { renderEmphasis } from './text';
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
import styles from './RevenueSection.module.css';

const iconMap: Record<string, React.ReactNode> = {
  'user-round-search': <UserRoundSearch size={18} />,
  'bell-ring': <BellRing size={18} />,
  'calendar-clock': <CalendarClock size={18} />,
};

type RevenueSectionProps = {
  whatsappHref: string;
  onWhatsappClick: () => void;
};

export const RevenueSection = memo(function RevenueSection({
  whatsappHref,
  onWhatsappClick,
}: RevenueSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();
  const current = revenueScenarios[activeIndex];

  return (
    <MotionSection
      id="revenue"
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
            <DollarSign size={14} />
            Agenda mais cheia
          </span>
          <h2 className={styles.title}>
            {renderEmphasis('A Ritmo preenche horários vazios <strong>automaticamente</strong>')}
          </h2>
          <p className={styles.subtitle}>
            {renderEmphasis(
              'Enquanto você atende, a Ritmo trabalha: traz clientes de volta, avisa lista de espera quando cancela, e oferece horários ociosos. <strong>Zero esforço</strong>, <strong>mais dinheiro</strong>.',
            )}
          </p>
        </MotionDiv>

        <div className={styles.metricsGrid}>
          {revenueScenarios.map((scenario) => (
            <div key={scenario.id} className={styles.metricCard}>
              <span className={styles.metricCardIcon}>{iconMap[scenario.icon]}</span>
              <span className={styles.metricCardValue}>{scenario.metric}</span>
              <span className={styles.metricCardLabel}>{renderEmphasis(scenario.metricLabel)}</span>
            </div>
          ))}
        </div>

        <div className={styles.scenarioTabs} role="tablist" aria-label="Cenários de receita">
          {revenueScenarios.map((scenario, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={scenario.id}
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                onClick={() => setActiveIndex(index)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`revenue-panel-${scenario.id}`}
              >
                <span className={styles.tabIcon}>{iconMap[scenario.icon]}</span>
                <span className={styles.tabTitle}>{renderEmphasis(scenario.title)}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <MotionDiv
            key={current.id}
            className={styles.card}
            initial={reduceMotion ? { opacity: 1, y: 0 } : presenceSlideFade.initial}
            animate={presenceSlideFade.animate}
            exit={reduceMotion ? { opacity: 1, y: 0 } : presenceSlideFade.exit}
            transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
            id={`revenue-panel-${current.id}`}
            role="tabpanel"
          >
            <div className={styles.cardBody}>
              <div className={styles.descriptionCol}>
                <p className={styles.scenarioDescription}>{renderEmphasis(current.description)}</p>

                <div className={styles.metricBox}>
                  <span className={styles.metricValue}>{current.metric}</span>
                  <span className={styles.metricLabel}>{renderEmphasis(current.metricLabel)}</span>
                </div>

                <WhatsAppButton
                  href={whatsappHref}
                  onClick={onWhatsappClick}
                  variant="primary"
                  size="md"
                  showArrow
                  className={styles.cta}
                >
                  Quero essa automação
                </WhatsAppButton>
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
                        key={`${current.id}-${message.author}-${message.text.slice(0, 20)}`}
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
          </MotionDiv>
        </AnimatePresence>
      </div>
    </MotionSection>
  );
});
