'use client';

import { memo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Scissors, Sparkles, Crown, Leaf } from 'lucide-react';
import { targetSegments } from './content';
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
import styles from './SocialProofSection.module.css';

const segmentIcons = [Scissors, Sparkles, Crown, Leaf];

export const SocialProofSection = memo(function SocialProofSection() {
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();

  return (
    <MotionSection
      id="social-proof"
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
            {renderEmphasis('Para quem é a **Ritmo**')}
          </h2>
          <p className={styles.subtitle}>
            {renderEmphasis(
              'Automação pensada para o dia a dia de quem **vive de agenda**.',
            )}
          </p>
        </MotionDiv>

        <MotionDiv
          className={styles.segments}
          initial="hidden"
          whileInView="visible"
          viewport={viewportRepeat}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.12, delayChildren: reduceMotion ? 0 : 0.06 } } }}
        >
          {targetSegments.map((seg, index) => {
            const Icon = segmentIcons[index] || Scissors;
            return (
              <MotionArticle
                key={seg.name}
                className={styles.segmentCard}
                variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}
              >
                <div className={styles.segmentIcon}>
                  <Icon size={22} />
                </div>
                <h3 className={styles.segmentName}>{seg.name}</h3>
                <p className={styles.segmentScenario}>{renderEmphasis(seg.scenario)}</p>
                <span className={styles.segmentOutcome}>{renderEmphasis(seg.outcome)}</span>
              </MotionArticle>
            );
          })}
        </MotionDiv>
      </div>
    </MotionSection>
  );
});
