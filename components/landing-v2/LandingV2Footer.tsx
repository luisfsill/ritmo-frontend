import Link from 'next/link';
import styles from './LandingV2Footer.module.css';

export function LandingV2Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.mark}>RT</span>
          <span className={styles.name}>Ritmo</span>
        </div>
        <p className={styles.copy}>Agendamento inteligente via WhatsApp para equipes que buscam previsibilidade.</p>
        <nav className={styles.links} aria-label="Links institucionais">
          <Link href="/terms">Termos</Link>
          <Link href="/privacy">Privacidade</Link>
        </nav>
      </div>
    </footer>
  );
}
