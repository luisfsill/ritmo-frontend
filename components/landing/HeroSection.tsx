'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FadeInUp, MotionDiv } from './motion';
import styles from './HeroSection.module.css';

type HeroSectionProps = {
  onPrimaryCta: () => void;
  onSecondaryCta: () => void;
};

export function HeroSection({ onPrimaryCta, onSecondaryCta }: HeroSectionProps) {
  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.backdrop} aria-hidden />
      <div className={styles.inner}>
        <FadeInUp>
          <div className={styles.badge}>
            <Sparkles size={14} />
            <span>Assistente IA para agenda no WhatsApp</span>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.08}>
          <h1 className={styles.title}>
            Agendamento inteligente com
            <span className={styles.highlight}> conversao real</span>
          </h1>
        </FadeInUp>

        <FadeInUp delay={0.14}>
          <p className={styles.subtitle}>
            Seus clientes agendam 24/7, sua equipe ganha tempo e voce reduz faltas com lembretes automáticos.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.2}>
          <div className={styles.ctas}>
            <Link href="/register" className={styles.primaryCta} onClick={onPrimaryCta}>
              Comecar gratis
              <ArrowRight size={18} />
            </Link>
            <a href="#demo" className={styles.secondaryCta} onClick={onSecondaryCta}>
              Ver demonstracao
            </a>
          </div>
        </FadeInUp>

        <MotionDiv className={styles.metrics} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.28, ease: 'easeOut' }}>
          <div><strong>60%</strong><span>Menos no-shows</span></div>
          <div><strong>24/7</strong><span>Atendimento</span></div>
          <div><strong>3min</strong><span>Setup inicial</span></div>
        </MotionDiv>
      </div>
    </section>
  );
}

