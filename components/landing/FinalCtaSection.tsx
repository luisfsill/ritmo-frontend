'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { RevealOnScroll } from './motion';
import styles from './FinalCtaSection.module.css';

type FinalCtaSectionProps = {
  onPrimaryCta: () => void;
};

export function FinalCtaSection({ onPrimaryCta }: FinalCtaSectionProps) {
  return (
    <section id="final-cta" className={styles.section}>
      <RevealOnScroll className={styles.inner}>
        <h2>Pronto para automatizar seu agendamento?</h2>
        <p>Comece gratis hoje e valide o impacto em poucos dias.</p>
        <Link href="/register" className={styles.cta} onClick={onPrimaryCta}>
          Criar conta gratis
          <ArrowRight size={18} />
        </Link>
      </RevealOnScroll>
    </section>
  );
}

