'use client';

import { memo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { customerSegments, socialStats, testimonials } from './content';
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
            {renderEmphasis('Resultados **observaveis** com leitura **rapida**')}
          </h2>
          <p className={styles.subtitle}>
            {renderEmphasis(
              'Primeiro a visao executiva, depois os **casos reais** de aplicacao em operacoes de servicos.',
            )}
          </p>
        </MotionDiv>

        <MotionDiv
          className={styles.stats}
          initial="hidden"
          whileInView="visible"
          viewport={viewportRepeat}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.1, delayChildren: reduceMotion ? 0 : 0.06 } } }}
        >
          {socialStats.map((stat) => (
            <MotionArticle
              key={stat.metric}
              className={styles.statCard}
              variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}
            >
              <span className={styles.metricName}>{renderEmphasis(stat.metric)}</span>
              <strong>{stat.value}</strong>
              <span className={styles.baseline}>{renderEmphasis(stat.baselineLabel)}</span>
              {stat.confidenceNote && <small>{renderEmphasis(stat.confidenceNote)}</small>}
            </MotionArticle>
          ))}
        </MotionDiv>

        {testimonials.length > 0 && (
          <MotionDiv
            className={styles.testimonials}
            initial="hidden"
            whileInView="visible"
            viewport={viewportRepeat}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.1, delayChildren: reduceMotion ? 0 : 0.05 } } }}
          >
            {testimonials.map((testimonial) => (
              <MotionArticle
                key={testimonial.name}
                className={styles.testimonial}
                variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}
              >
                <p>{renderEmphasis(testimonial.quote)}</p>
                <div className={styles.author}>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                  {testimonial.result && <small>{renderEmphasis(testimonial.result)}</small>}
                </div>
              </MotionArticle>
            ))}
          </MotionDiv>
        )}

        <MotionDiv
          className={styles.logos}
          aria-label="Segmentos de clientes atendidos"
          initial="hidden"
          whileInView="visible"
          viewport={viewportRepeat}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08, delayChildren: reduceMotion ? 0 : 0.04 } } }}
        >
          {customerSegments.map((item) => (
            <MotionDiv key={item} className={styles.logo} variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}>
              {item}
            </MotionDiv>
          ))}
        </MotionDiv>
      </div>
    </MotionSection>
  );
});
