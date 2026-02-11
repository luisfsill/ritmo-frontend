import styles from './LandingFooter.module.css';

export function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.mark}>RT</span>
          <span className={styles.name}>Ritmo</span>
        </div>
        <p>© 2026 Ritmo. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

