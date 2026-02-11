'use client';

import { motion } from 'framer-motion';
import { RevealOnScroll, StaggerContainer, staggerItemVariants } from './motion';
import styles from './HowItWorksSection.module.css';

const steps = [
  { n: '1', title: 'Configure a operacao', text: 'Cadastre servicos, profissionais e regras de agenda.' },
  { n: '2', title: 'Conecte seu WhatsApp', text: 'Ative o canal e valide atendimento automatizado.' },
  { n: '3', title: 'Publique e acompanhe', text: 'Monitore indicadores e otimize conversao continuamente.' },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.inner}>
        <RevealOnScroll>
          <h2 className={styles.title}>Como funciona</h2>
          <p className={styles.subtitle}>Implementacao simples em tres etapas.</p>
        </RevealOnScroll>

        <StaggerContainer className={styles.steps}>
          {steps.map((step) => (
            <motion.article key={step.n} variants={staggerItemVariants} className={styles.step}>
              <span className={styles.badge}>{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </motion.article>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

