'use client';

import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { RevealOnScroll, StaggerContainer, staggerItemVariants } from './motion';
import styles from './BenefitsSection.module.css';

const benefits = [
  'Reduza no-shows em ate 60%',
  'Economize 10+ horas por semana',
  'Atendimento automatico 24/7',
  'Trial gratuito de 14 dias',
  'Sem taxa de setup',
  'Suporte em portugues',
];

export function BenefitsSection() {
  return (
    <section id="benefits" className={styles.section}>
      <div className={styles.inner}>
        <RevealOnScroll>
          <h2 className={styles.title}>Beneficios diretos para sua operacao</h2>
        </RevealOnScroll>

        <StaggerContainer className={styles.grid}>
          {benefits.map((benefit) => (
            <motion.div key={benefit} variants={staggerItemVariants} className={styles.item}>
              <CheckCircle size={18} className={styles.icon} />
              <span>{benefit}</span>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

