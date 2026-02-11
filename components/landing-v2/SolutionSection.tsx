'use client';

import { memo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Bell, CalendarRange, LifeBuoy, LineChart } from 'lucide-react';
import { solutionItems } from './content';
import { renderEmphasis } from './text';
import {
  MotionArticle,
  MotionDiv,
  MotionSection,
  cardRevealVariantsStrong,
  getDirectionalOffset,
  sectionRevealVariantsStrong,
  staggerItemVariants,
  useScrollDirection,
  viewportRepeat,
} from './motion';
import styles from './SolutionSection.module.css';

const icons = [CalendarRange, Bell, LifeBuoy, LineChart];

export const SolutionSection = memo(function SolutionSection() {
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();

  return (
    <MotionSection
      id="solution"
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
          transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className={styles.title}>
            {renderEmphasis('Um fluxo unico para **captar**, **confirmar** e **reter**')}
          </h2>
          <p className={styles.subtitle}>
            {renderEmphasis('A operacao segue uma sequencia previsivel para **reduzir ruido** e **aumentar conversao**.')}
          </p>
        </MotionDiv>

        <MotionDiv
          className={styles.grid}
          initial="hidden"
          whileInView="visible"
          viewport={viewportRepeat}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: reduceMotion ? 0 : 0.12, delayChildren: reduceMotion ? 0 : 0.08 },
            },
          }}
        >
          {solutionItems.map((item, index) => {
            const Icon = icons[index] || CalendarRange;
            return (
              <MotionArticle
                key={item.title}
                className={styles.card}
                variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.34, delay: index * 0.02, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <div className={styles.cardHeader}>
                  <span className={styles.step}>Etapa {index + 1}</span>
                  <div className={styles.iconWrap}><Icon size={20} /></div>
                </div>
                <h3>{renderEmphasis(item.title)}</h3>
                <p>{renderEmphasis(item.description)}</p>
              </MotionArticle>
            );
          })}
        </MotionDiv>
      </div>
    </MotionSection>
  );
});
