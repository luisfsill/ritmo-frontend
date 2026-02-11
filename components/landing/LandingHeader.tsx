'use client';

import Link from 'next/link';
import { Menu, Moon, Sun, X } from 'lucide-react';
import styles from './LandingHeader.module.css';

type LandingHeaderProps = {
  resolvedTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
};

export function LandingHeader({
  resolvedTheme,
  onToggleTheme,
  mobileMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu,
}: LandingHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.mark}>RT</span>
          <span className={styles.name}>Ritmo</span>
        </div>

        <nav className={styles.nav} aria-label="Navegacao principal">
          <a href="#demo" className={styles.navLink}>Demonstracao</a>
          <a href="#features" className={styles.navLink}>Funcionalidades</a>
          <a href="#how-it-works" className={styles.navLink}>Como funciona</a>
          <a href="#benefits" className={styles.navLink}>Beneficios</a>
        </nav>

        <div className={styles.actions}>
          <button onClick={onToggleTheme} className={styles.iconButton} aria-label="Alternar tema">
            {resolvedTheme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link href="/login" className={styles.loginButton}>Entrar</Link>
          <Link href="/register" className={styles.ctaButton}>Comecar gratis</Link>
          <button
            className={styles.mobileButton}
            onClick={onToggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNav} aria-label="Navegacao mobile">
            <a href="#demo" className={styles.mobileLink} onClick={onCloseMobileMenu}>Demonstracao</a>
            <a href="#features" className={styles.mobileLink} onClick={onCloseMobileMenu}>Funcionalidades</a>
            <a href="#how-it-works" className={styles.mobileLink} onClick={onCloseMobileMenu}>Como funciona</a>
            <a href="#benefits" className={styles.mobileLink} onClick={onCloseMobileMenu}>Beneficios</a>
          </nav>
          <div className={styles.mobileActions}>
            <Link href="/login" className={styles.mobileLogin} onClick={onCloseMobileMenu}>Entrar</Link>
            <Link href="/register" className={styles.mobileCta} onClick={onCloseMobileMenu}>Comecar gratis</Link>
          </div>
        </div>
      )}
    </header>
  );
}

