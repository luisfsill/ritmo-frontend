'use client';

import { memo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { AlertCircle, Bell, CalendarRange, Clock3, LifeBuoy, LineChart, TrendingDown } from 'lucide-react';
import { problemItems, solutionItems } from './content';
import { renderEmphasis } from './text';
import {
  MotionArticle,
  MotionDiv,
  MotionSection,
  RevealOnScroll,
  cardRevealVariantsStrong,
  getDirectionalOffset,
  sectionRevealVariantsStrong,
  staggerItemVariants,
  useScrollDirection,
} from './motion';

const viewportOnce = { once: true, amount: 0.15 } as const;
import styles from './ChallengesSection.module.css';

const problemIcons = [Clock3, AlertCircle, TrendingDown];
const solutionIcons = [CalendarRange, Bell, LifeBuoy, LineChart];

export const ChallengesSection = memo(function ChallengesSection() {
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();

  return (
    <MotionSection
      id="challenges"
      className={styles.section}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      custom={scrollDirection}
      variants={reduceMotion ? undefined : sectionRevealVariantsStrong}
    >
      <div className={styles.inner}>
        <MotionDiv
          className={styles.copy}
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: getDirectionalOffset(scrollDirection, 26) }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className={styles.title}>
            {renderEmphasis('O que **trava** sua agenda — e como a Ritmo **resolve**')}
          </h2>
          <p className={styles.subtitle}>
            {renderEmphasis('Problemas comuns no dia a dia de salões e clínicas, com a solução aplicada em cada etapa.')}
          </p>
        </MotionDiv>

        <div className={styles.columns}>
          {/* Coluna de problemas */}
          <MotionDiv
            className={styles.problemsCol}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: reduceMotion ? 0 : 0.1, delayChildren: reduceMotion ? 0 : 0.06 },
              },
            }}
          >
            <div className={styles.colHeader}>
              <span className={styles.colBadge} data-type="problem">Desafios</span>
            </div>
            {problemItems.map((item, index) => {
              const Icon = problemIcons[index] || AlertCircle;
              return (
                <MotionArticle
                  key={item.title}
                  className={`${styles.card} ${styles.problemCard}`}
                  variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}
                >
                  <div className={`${styles.iconWrap} ${styles.problemIcon}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3>{renderEmphasis(item.title)}</h3>
                    <p>{renderEmphasis(item.description)}</p>
                  </div>
                </MotionArticle>
              );
            })}
          </MotionDiv>

          {/* Conector visual */}
          <div className={styles.connector} aria-hidden="true">
            <svg viewBox="0 0 40 200" className={styles.connectorSvg}>
              <path d="M20 0 L20 80 L30 100 L20 120 L20 200" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="6 4" />
              <polygon points="15,100 25,100 20,110" fill="currentColor" />
            </svg>
          </div>

          {/* Coluna de soluções */}
          <MotionDiv
            className={styles.solutionsCol}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: reduceMotion ? 0 : 0.12, delayChildren: reduceMotion ? 0 : 0.14 },
              },
            }}
          >
            <div className={styles.colHeader}>
              <span className={styles.colBadge} data-type="solution">Soluções</span>
            </div>
            {solutionItems.map((item, index) => {
              const Icon = solutionIcons[index] || CalendarRange;
              return (
                <MotionArticle
                  key={item.title}
                  className={`${styles.card} ${styles.solutionCard}`}
                  variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}
                >
                  <div className={`${styles.iconWrap} ${styles.solutionIcon}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3>{renderEmphasis(item.title)}</h3>
                    <p>{renderEmphasis(item.description)}</p>
                  </div>
                </MotionArticle>
              );
            })}
          </MotionDiv>
        </div>
      </div>
    </MotionSection>
  );
});
