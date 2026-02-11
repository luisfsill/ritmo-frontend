'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { heroData } from './content';
import { WhatsAppButton } from './WhatsAppButton';
import { renderEmphasis } from './text';
import {
  MotionArticle,
  MotionDiv,
  RevealOnScroll,
  StaggerContainer,
  cardRevealVariantsStrong,
  getDirectionalOffset,
  staggerItemVariants,
  useScrollDirection,
} from './motion';
import styles from './HeroSection.module.css';

type HeroSectionProps = {
  whatsappHref: string;
  registerHref: string;
  onWhatsappClick: () => void;
  onRegisterClick: () => void;
};

export const HeroSection = memo(function HeroSection({
  whatsappHref,
  registerHref,
  onWhatsappClick,
  onRegisterClick,
}: HeroSectionProps) {
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();

  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.inner}>
        <RevealOnScroll className={styles.copy} y={50} duration={0.7} blur>
          <span className={styles.badge}>{heroData.badge}</span>
          <h1 className={styles.title}>{renderEmphasis(heroData.title)}</h1>
          <p className={styles.subtitle}>{renderEmphasis(heroData.subtitle)}</p>

          <MotionDiv
            className={styles.actions}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: getDirectionalOffset(scrollDirection, 30) }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <WhatsAppButton
              href={whatsappHref}
              onClick={onWhatsappClick}
              variant="primary"
              size="lg"
              className={styles.primaryCta}
            >
              Falar no WhatsApp
            </WhatsAppButton>
            <Link href={registerHref} className={styles.secondaryCta} onClick={onRegisterClick}>
              Criar conta gratis
              <ArrowRight size={18} />
            </Link>
          </MotionDiv>
        </RevealOnScroll>

        <RevealOnScroll className={styles.metricsWrap} y={60} x={30} duration={0.8} delay={0.1} scale={0.95}>
          <p className={styles.metricsLabel}>Indicadores de impacto para leitura em poucos segundos</p>
          <StaggerContainer className={styles.metrics}>
            {heroData.metrics.map((metric) => (
              <MotionArticle
                key={`${metric.label}-${metric.delta}`}
                className={styles.metricCard}
                variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}
              >
                <strong>{metric.value}</strong>
                <span className={styles.metricLabelItem}>{renderEmphasis(metric.label)}</span>
                <span className={styles.metricDelta}>{renderEmphasis(metric.delta)}</span>
                <small className={styles.metricContext}>{renderEmphasis(metric.context)}</small>
              </MotionArticle>
            ))}
          </StaggerContainer>
        </RevealOnScroll>
      </div>
    </section>
  );
});
