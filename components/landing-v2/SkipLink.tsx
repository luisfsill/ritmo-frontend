/**
 * SkipLink Component
 * Provides keyboard users with a way to skip navigation and go directly to main content
 */

'use client';

import { useEffect, useState } from 'react';
import styles from './SkipLink.module.css';

export interface SkipLinkProps {
  targetId?: string;
  text?: string;
}

/**
 * Skip link component for accessibility
 * Appears when focused with keyboard navigation (Tab key)
 */
export function SkipLink({ targetId = 'main-content', text = 'Pular para o conteúdo principal' }: SkipLinkProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a 
      href={`#${targetId}`} 
      className={styles.skipLink}
      onClick={handleClick}
    >
      {text}
    </a>
  );
}
