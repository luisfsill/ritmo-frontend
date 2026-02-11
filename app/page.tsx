'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@/lib/theme-context';
import {
  BenefitsSection,
  CtaOrigin,
  DemoSection,
  FeaturesSection,
  FinalCtaSection,
  HeroSection,
  HowItWorksSection,
  LandingEventMap,
  LandingFooter,
  LandingHeader,
  LandingSectionId,
} from '@/components/landing';
import styles from './page.module.css';

type GtagWindow = Window & typeof globalThis & {
  gtag?: (...args: unknown[]) => void;
};

function trackEvent<K extends keyof LandingEventMap>(name: K, params: LandingEventMap[K]): void {
  if (typeof window === 'undefined') return;
  const trackedWindow = window as GtagWindow;
  if (trackedWindow.gtag) {
    trackedWindow.gtag('event', name, params);
  }
}

export default function LandingPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const seenSectionsRef = useRef<Set<LandingSectionId>>(new Set());

  const sectionTargets = useMemo(
    () => [
      { domId: 'hero', section: 'hero' as const },
      { domId: 'demo', section: 'demo' as const },
      { domId: 'features', section: 'features' as const },
      { domId: 'how-it-works', section: 'how_it_works' as const },
      { domId: 'benefits', section: 'benefits' as const },
      { domId: 'final-cta', section: 'final_cta' as const },
    ],
    [],
  );

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const trackPrimaryCta = (origin: CtaOrigin) => {
    trackEvent('landing_cta_primary_click', { origin });
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 820) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const meta = sectionTargets.find((item) => item.domId === entry.target.id);
          if (!meta) return;
          if (seenSectionsRef.current.has(meta.section)) return;
          seenSectionsRef.current.add(meta.section);
          trackEvent('landing_section_view', { section: meta.section });
        });
      },
      { threshold: 0.3 },
    );

    sectionTargets.forEach(({ domId }) => {
      const node = document.getElementById(domId);
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [sectionTargets]);

  return (
    <div className={styles.page}>
      <LandingHeader
        resolvedTheme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        onToggleTheme={toggleTheme}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        onCloseMobileMenu={closeMobileMenu}
      />

      <main>
        <HeroSection
          onPrimaryCta={() => trackPrimaryCta('hero')}
          onSecondaryCta={() => trackEvent('landing_cta_secondary_click', { origin: 'hero', target: '#demo' })}
        />

        <DemoSection
          onPrimaryCta={() => trackPrimaryCta('demo')}
          onCardViewed={(index, title, previousIndex) =>
            trackEvent('landing_demo_card_viewed', {
              card_index: index,
              card_title: title,
              previous_card: previousIndex,
            })
          }
        />

        <FeaturesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <FinalCtaSection onPrimaryCta={() => trackPrimaryCta('final')} />
      </main>

      <LandingFooter />
    </div>
  );
}

