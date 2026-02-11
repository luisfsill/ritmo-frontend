'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { MotionDiv, RevealOnScroll } from './motion';
import { DemoCard } from './types';
import styles from './DemoSection.module.css';

type DemoSectionProps = {
  onPrimaryCta: () => void;
  onCardViewed: (index: number, title: string, previousIndex?: number) => void;
};

export function DemoSection({ onPrimaryCta, onCardViewed }: DemoSectionProps) {
  const reduceMotion = useReducedMotion();
  const cards = useMemo<DemoCard[]>(() => [
    {
      id: 0,
      title: 'Resposta imediata',
      subtitle: 'Sem perder clientes fora do horario',
      description: 'A IA responde em segundos e oferece os horarios disponiveis.',
      bullets: ['Atendimento 24/7', 'Qualificacao automatica', 'Menos mensagens perdidas'],
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
    },
    {
      id: 1,
      title: 'Agenda organizada',
      subtitle: 'Fluxo de marcacao sem friccao',
      description: 'Cliente escolhe servico, profissional e horario em um fluxo guiado.',
      bullets: ['Sem conflito de horario', 'Confirmacao automatica', 'Status de agendamento claro'],
      gradient: 'linear-gradient(135deg, #1f2937 0%, #0f766e 100%)',
    },
    {
      id: 2,
      title: 'Lembretes que convertem',
      subtitle: 'Queda real de no-show',
      description: 'Disparo de lembretes em momentos criticos para aumentar comparecimento.',
      bullets: ['Mensagem 24h antes', 'Mensagem 1h antes', 'Confirmacao em um toque'],
      gradient: 'linear-gradient(135deg, #3f1d2e 0%, #7c2d12 100%)',
    },
    {
      id: 3,
      title: 'Comece hoje',
      subtitle: 'Teste gratuito sem cartao',
      description: 'Configuracao rapida para sua operacao iniciar no mesmo dia.',
      bullets: ['Onboarding em minutos', 'Sem contrato longo', 'Suporte em portugues'],
      gradient: 'linear-gradient(135deg, #312e81 0%, #7e22ce 100%)',
    },
  ], []);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const goTo = (next: number) => {
    if (next < 0 || next >= cards.length || next === index) return;
    setDirection(next > index ? 'next' : 'prev');
    onCardViewed(next, cards[next].title, index);
    setIndex(next);
  };

  const current = cards[index];

  return (
    <section id="demo" className={styles.section}>
      <div className={styles.inner}>
        <RevealOnScroll>
          <h2 className={styles.title}>Veja o fluxo da landing em acao</h2>
          <p className={styles.subtitle}>Cada passo reforca valor, urgencia e confianca sem sobrecarregar a tela.</p>
        </RevealOnScroll>

        <div className={styles.carousel}>
          <button onClick={() => goTo(index - 1)} disabled={index === 0} className={styles.navButton} aria-label="Card anterior">
            <ArrowLeft size={20} />
          </button>

          <div className={styles.cardViewport}>
            <AnimatePresence mode="wait" initial={false}>
              <MotionDiv
                key={current.id}
                className={styles.card}
                style={{ background: current.gradient }}
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: direction === 'next' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction === 'next' ? -20 : 20 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.34, ease: 'easeInOut' }}
              >
                <h3>{current.title}</h3>
                <p className={styles.cardSubtitle}>{current.subtitle}</p>
                <p className={styles.cardDescription}>{current.description}</p>
                <ul>
                  {current.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {index === cards.length - 1 && (
                  <Link href="/register" className={styles.cardCta} onClick={onPrimaryCta}>
                    Comecar meu teste
                    <ArrowRight size={16} />
                  </Link>
                )}
              </MotionDiv>
            </AnimatePresence>
          </div>

          <button onClick={() => goTo(index + 1)} disabled={index === cards.length - 1} className={styles.navButton} aria-label="Proximo card">
            <ArrowRight size={20} />
          </button>
        </div>

        <div className={styles.dots}>
          {cards.map((card, cardIndex) => (
            <button
              key={card.id}
              className={`${styles.dot} ${cardIndex === index ? styles.dotActive : ''}`}
              onClick={() => goTo(cardIndex)}
              aria-label={`Ir para card ${cardIndex + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

