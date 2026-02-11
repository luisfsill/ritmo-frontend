'use client';

import { memo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { AlertCircle, Clock3, TrendingDown } from 'lucide-react';
import { problemItems } from './content';
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
import styles from './ProblemSection.module.css';

const icons = [Clock3, AlertCircle, TrendingDown];

export const ProblemSection = memo(function ProblemSection() {
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();

  return (
    <MotionSection
      id="problem"
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
            {renderEmphasis('Quando a agenda **perde ritmo**, o faturamento sente primeiro')}
          </h2>
          <p className={styles.subtitle}>
            {renderEmphasis('Tres frentes criticas que travam **operacao** e crescimento no dia a dia.')}
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
              transition: { staggerChildren: reduceMotion ? 0 : 0.11, delayChildren: reduceMotion ? 0 : 0.06 },
            },
          }}
        >
          {problemItems.map((item, index) => {
            const Icon = icons[index] || AlertCircle;
            return (
              <MotionArticle
                key={item.title}
                className={styles.card}
                variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}
              >
                <div className={styles.iconWrap}><Icon size={20} /></div>
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
