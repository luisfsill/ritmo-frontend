/**
 * Custom hooks for Landing V2
 * Encapsulates complex logic for better reusability and testing
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { trackEvent } from './analytics';
import { LandingV2SectionId, LandingV2CtaOrigin, LandingV2RegisterOrigin } from './types';

/**
 * Hook for tracking analytics events with type safety
 */
export function useAnalytics() {
  const trackWhatsappClick = useCallback((origin: LandingV2CtaOrigin, buttonId: string, href: string, isFallback: boolean) => {
    trackEvent('landing_v2_whatsapp_click', {
      origin,
      button_id: buttonId,
      target: href,
      is_fallback: isFallback,
    });
  }, []);

  const trackNavClick = useCallback((target: LandingV2SectionId) => {
    trackEvent('landing_v2_nav_click', { target_section: target });
  }, []);

  const trackThemeToggle = useCallback((from: 'light' | 'dark', to: 'light' | 'dark') => {
    trackEvent('landing_v2_theme_toggle', { from, to });
  }, []);

  const trackPlanClick = useCallback((planId: string, buttonId: string, isFallback: boolean) => {
    trackEvent('landing_v2_pricing_plan_click', {
      plan_id: planId,
      button_id: buttonId,
      origin: 'pricing',
      is_fallback: isFallback,
    });
  }, []);

  const trackRegisterClick = useCallback((origin: LandingV2RegisterOrigin, buttonId: string, target: string) => {
    trackEvent('landing_v2_register_click', {
      origin,
      button_id: buttonId,
      target,
    });
  }, []);

  const trackFaqToggle = useCallback((questionId: string, isOpen: boolean) => {
    trackEvent('landing_v2_faq_toggle', {
      question_id: questionId,
      is_open: isOpen,
    });
  }, []);

  const trackDemoInteraction = useCallback(
    (
      action:
        | 'step_view'
        | 'step_cta_click',
      stepId?: string,
      stepIndex?: number
    ) => {
      trackEvent('landing_v2_demo_interaction', {
        action,
        step_id: stepId,
        step_index: stepIndex,
      });
    },
    []
  );

  return {
    trackWhatsappClick,
    trackNavClick,
    trackThemeToggle,
    trackPlanClick,
    trackRegisterClick,
    trackFaqToggle,
    trackDemoInteraction,
  };
}

/**
 * Hook for tracking section visibility with IntersectionObserver
 */
export function useSectionTracking(
  sectionTargets: Array<{ domId: string; section: LandingV2SectionId }>
) {
  const seenSectionsRef = useRef<Set<LandingV2SectionId>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          
          const meta = sectionTargets.find((item) => item.domId === entry.target.id);
          if (!meta || seenSectionsRef.current.has(meta.section)) return;
          
          seenSectionsRef.current.add(meta.section);
          trackEvent('landing_v2_section_view', { section: meta.section });
        });
      },
      { threshold: 0.3 }
    );

    sectionTargets.forEach(({ domId }) => {
      const node = document.getElementById(domId);
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [sectionTargets]);
}

/**
 * Hook for tracking scroll depth
 */
export function useScrollDepthTracking() {
  const seenDepthRef = useRef<Set<25 | 50 | 75 | 100>>(new Set());

  useEffect(() => {
    const milestones: Array<25 | 50 | 75 | 100> = [25, 50, 75, 100];
    
    const handleDepth = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const depth = scrollable <= 0 ? 100 : Math.min(100, Math.round((scrollTop / scrollable) * 100));

      milestones.forEach((milestone) => {
        if (depth < milestone || seenDepthRef.current.has(milestone)) return;
        seenDepthRef.current.add(milestone);
        trackEvent('landing_v2_scroll_depth', { depth_pct: milestone });
      });
    };

    handleDepth();
    window.addEventListener('scroll', handleDepth, { passive: true });
    window.addEventListener('resize', handleDepth);

    return () => {
      window.removeEventListener('scroll', handleDepth);
      window.removeEventListener('resize', handleDepth);
    };
  }, []);
}

/**
 * Hook for handling mobile menu state and body overflow
 */
export function useMobileMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 920) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle body overflow
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const toggleMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return {
    mobileMenuOpen,
    toggleMenu,
    closeMenu,
  };
}
