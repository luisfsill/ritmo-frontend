'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, MotionButton, MotionDiv } from './motion';
import { WhatsAppButton } from './WhatsAppButton';
import { LandingV2SectionId } from './types';
import { useFocusTrap } from './use-focus-trap';
import styles from './LandingV2Header.module.css';

type LandingV2HeaderProps = {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
  onNavClick: (target: LandingV2SectionId) => void;
  desktopWhatsappHref: string;
  mobileWhatsappHref: string;
  onDesktopWhatsappClick: () => void;
  onMobileWhatsappClick: () => void;
  registerHref: string;
  onDesktopRegisterClick: () => void;
  onMobileRegisterClick: () => void;
};

export function LandingV2Header({
  mobileMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu,
  onNavClick,
  desktopWhatsappHref,
  mobileWhatsappHref,
  onDesktopWhatsappClick,
  onMobileWhatsappClick,
  registerHref,
  onDesktopRegisterClick,
  onMobileRegisterClick,
}: LandingV2HeaderProps) {
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useFocusTrap(mobileMenuRef, {
    active: mobileMenuOpen,
    onEscape: onCloseMobileMenu,
  });

  const handleDesktopNavClick = (target: LandingV2SectionId) => () => onNavClick(target);
  const handleMobileNavClick = (target: LandingV2SectionId) => () => {
    onNavClick(target);
    onCloseMobileMenu();
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.mark}>RT</span>
          <span className={styles.name}>Ritmo</span>
        </div>

        <nav className={styles.nav} aria-label="Navegacao principal">
          <a href="#demo" className={styles.navLink} onClick={handleDesktopNavClick('demo')}>Como funciona</a>
          <a href="#social-proof" className={styles.navLink} onClick={handleDesktopNavClick('social_proof')}>Resultados</a>
          <a href="#pricing" className={styles.navLink} onClick={handleDesktopNavClick('pricing')}>Planos</a>
          <a href="#faq" className={styles.navLink} onClick={handleDesktopNavClick('faq')}>FAQ</a>
        </nav>

        <div className={styles.actions}>
          <Link href={registerHref} className={styles.registerButton} onClick={onDesktopRegisterClick}>
            Criar conta
          </Link>
          <WhatsAppButton
            href={desktopWhatsappHref}
            onClick={onDesktopWhatsappClick}
            className={styles.ctaButton}
            variant="secondary"
            size="sm"
            showArrow
          >
            Falar no WhatsApp
          </WhatsAppButton>
          <Link href="/login" className={styles.loginButton}>
            Entrar
          </Link>
          <MotionButton
            className={styles.mobileButton}
            onClick={onToggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-v2-mobile-menu"
            animate={mobileMenuOpen ? { rotate: 90 } : { rotate: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </MotionButton>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <MotionDiv
            ref={mobileMenuRef}
            key="mobile-menu"
            className={styles.mobileMenu}
            id="landing-v2-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegacao"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav className={styles.mobileNav} aria-label="Navegacao mobile">
              <a href="#demo" className={styles.mobileLink} onClick={handleMobileNavClick('demo')}>Como funciona</a>
              <a href="#social-proof" className={styles.mobileLink} onClick={handleMobileNavClick('social_proof')}>Resultados</a>
              <a href="#pricing" className={styles.mobileLink} onClick={handleMobileNavClick('pricing')}>Planos</a>
              <a href="#faq" className={styles.mobileLink} onClick={handleMobileNavClick('faq')}>FAQ</a>
            </nav>
            <div className={styles.mobileActions}>
              <Link href={registerHref} className={styles.mobileRegister} onClick={onMobileRegisterClick}>
                Criar conta
              </Link>
              <WhatsAppButton
                href={mobileWhatsappHref}
                onClick={onMobileWhatsappClick}
                className={styles.mobileCta}
                variant="secondary"
                showArrow
              >
                Falar no WhatsApp
              </WhatsAppButton>
              <Link href="/login" className={styles.mobileLogin} onClick={onCloseMobileMenu}>
                Entrar
              </Link>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </header>
  );
}
