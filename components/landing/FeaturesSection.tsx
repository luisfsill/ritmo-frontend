'use client';

import { BarChart3, Bell, Calendar, MessageCircle, Sparkles, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { RevealOnScroll, StaggerContainer, staggerItemVariants } from './motion';
import styles from './FeaturesSection.module.css';

const features = [
  { icon: MessageCircle, title: 'Agendamento via WhatsApp', description: 'Conversas naturais com confirmacao automatica de horario.' },
  { icon: Sparkles, title: 'Assistente IA', description: 'Resposta contextual com foco em fechar agendamento.' },
  { icon: Calendar, title: 'Agenda central', description: 'Controle de horarios com visao clara para operacao.' },
  { icon: Users, title: 'Gestao de equipe', description: 'Distribuicao por profissional sem conflito.' },
  { icon: Bell, title: 'Lembretes automaticos', description: 'Mensagens em momentos chave para reduzir faltas.' },
  { icon: BarChart3, title: 'Indicadores de performance', description: 'Acompanhamento de ocupacao e receita em tempo real.' },
];

export function FeaturesSection() {
  return (
    <section id="features" className={styles.section}>
      <div className={styles.inner}>
        <RevealOnScroll>
          <h2 className={styles.title}>Funcionalidades para escalar sem perder qualidade</h2>
          <p className={styles.subtitle}>Arquitetura orientada a conversao com visibilidade operacional.</p>
        </RevealOnScroll>

        <StaggerContainer className={styles.grid}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.article key={feature.title} variants={staggerItemVariants} className={styles.card}>
                <div className={styles.icon}><Icon size={20} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.article>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}

