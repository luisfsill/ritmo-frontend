'use client';

import { useCallback, useMemo } from 'react';
import { buildLandingWhatsappUrl, type LandingWhatsappResult } from '@/lib/landing-whatsapp';
import { defaultWhatsappMessage, demoSteps, pricingPlans } from './content';
import { ChallengesSection } from './ChallengesSection';
import { DemoSection } from './DemoSection';
import { FaqSection } from './FaqSection';
import { FinalCtaSection } from './FinalCtaSection';
import { HeroSection } from './HeroSection';
import { LandingV2Footer } from './LandingV2Footer';
import { LandingV2Header } from './LandingV2Header';
import { OfferSection } from './OfferSection';
import { PricingSection } from './PricingSection';
import { RevenueSection } from './RevenueSection';
import { SectionDivider } from './SectionDivider';
import { SocialProofSection } from './SocialProofSection';
import { LandingV2SectionId } from './types';
import { useAnalytics, useSectionTracking, useScrollDepthTracking, useMobileMenu } from './hooks';
import { SkipLink } from './SkipLink';
import styles from './LandingV2Client.module.css';

type LandingWhatsappButtonConfig = {
  buttonConfigs: Record<string, LandingWhatsappResult>;
  demoWhatsappHrefByStepId: Record<string, string>;
  pricingWhatsappHrefByPlanId: Record<string, string>;
};

function composeWhatsappMessage(baseMessage: string, contextMessage: string): string {
  return `${baseMessage.trim()}\n\n${contextMessage.trim()}`;
}

export function LandingV2Client() {
  const { mobileMenuOpen, toggleMenu, closeMenu } = useMobileMenu();
  const {
    trackWhatsappClick,
    trackNavClick,
    trackPlanClick,
    trackRegisterClick,
    trackFaqToggle,
    trackDemoInteraction,
  } = useAnalytics();

  const registerHref = '/register';

  const whatsappConfig = useMemo<LandingWhatsappButtonConfig>(() => {
    const configuredNumber = process.env.NEXT_PUBLIC_LANDING_WHATSAPP_NUMBER;
    const baseMessage = (process.env.NEXT_PUBLIC_LANDING_WHATSAPP_MESSAGE || defaultWhatsappMessage).trim();

    const buildConfig = (contextMessage: string) =>
      buildLandingWhatsappUrl(configuredNumber, composeWhatsappMessage(baseMessage, contextMessage));

    const buttonConfigs: Record<string, LandingWhatsappResult> = {
      header_desktop_whatsapp: buildConfig('Vim pelo botao do topo.'),
      header_mobile_whatsapp: buildConfig('Vim pelo botao do menu mobile.'),
      hero_whatsapp: buildConfig('Vim do botao principal da secao inicial.'),
      revenue_whatsapp: buildConfig('Vim da secao de receita e agenda cheia.'),
      offer_whatsapp: buildConfig('Vim da secao de implantacao guiada.'),
      faq_whatsapp: buildConfig('Vim da secao de perguntas frequentes.'),
      final_whatsapp: buildConfig('Vim do botao final da pagina.'),
    };

    const demoWhatsappHrefByStepId: Record<string, string> = {};
    demoSteps.forEach((step, index) => {
      const buttonId = `demo_${step.id}_whatsapp`;
      const config = buildConfig(`Vim da simulacao da etapa ${index + 1}.`);
      buttonConfigs[buttonId] = config;
      demoWhatsappHrefByStepId[step.id] = config.href;
    });

    const pricingWhatsappHrefByPlanId: Record<string, string> = {};
    pricingPlans.forEach((plan) => {
      const buttonId = `pricing_${plan.id}_whatsapp`;
      const planName = plan.id === 'scale' ? 'Scale' : plan.name;
      const config = buildConfig(`Tenho interesse no plano ${planName}.`);
      buttonConfigs[buttonId] = config;
      pricingWhatsappHrefByPlanId[plan.id] = config.href;
    });

    return {
      buttonConfigs,
      demoWhatsappHrefByStepId,
      pricingWhatsappHrefByPlanId,
    };
  }, []);

  const sectionTargets = useMemo(
    () => [
      { domId: 'hero', section: 'hero' as const },
      { domId: 'challenges', section: 'challenges' as const },
      { domId: 'demo', section: 'demo' as const },
      { domId: 'social-proof', section: 'social_proof' as const },
      { domId: 'revenue', section: 'revenue' as const },
      { domId: 'offer', section: 'offer' as const },
      { domId: 'pricing', section: 'pricing' as const },
      { domId: 'faq', section: 'faq' as const },
      { domId: 'final-cta', section: 'final_cta' as const },
    ],
    [],
  );

  useSectionTracking(sectionTargets);
  useScrollDepthTracking();

  const getWhatsappConfig = useCallback(
    (buttonId: string) =>
      whatsappConfig.buttonConfigs[buttonId] ?? whatsappConfig.buttonConfigs.hero_whatsapp,
    [whatsappConfig.buttonConfigs],
  );

  const handleNavClick = useCallback((target: LandingV2SectionId) => {
    trackNavClick(target);
  }, [trackNavClick]);

  const handleHeroWhatsappClick = useCallback(() => {
    const buttonId = 'hero_whatsapp';
    const target = getWhatsappConfig(buttonId);
    trackWhatsappClick('hero_primary', buttonId, target.href, target.isFallback);
  }, [getWhatsappConfig, trackWhatsappClick]);

  const handleHeroRegisterClick = useCallback(() => {
    trackRegisterClick('hero_secondary', 'hero_register', registerHref);
  }, [trackRegisterClick]);

  const handleDemoWhatsappClick = useCallback((stepId: string) => {
    const buttonId = `demo_${stepId}_whatsapp`;
    const target = getWhatsappConfig(buttonId);
    trackWhatsappClick('demo_step', buttonId, target.href, target.isFallback);
  }, [getWhatsappConfig, trackWhatsappClick]);

  const handleDemoStepViewed = useCallback((stepId: string, index: number) =>
    trackDemoInteraction('step_view', stepId, index),
    [trackDemoInteraction]
  );

  const handleDemoStepCtaClick = useCallback((stepId: string, index: number) =>
    trackDemoInteraction('step_cta_click', stepId, index),
    [trackDemoInteraction]
  );

  const handleDemoRegisterClick = useCallback(() => {
    trackRegisterClick('demo_secondary', 'demo_register', registerHref);
  }, [trackRegisterClick]);

  const handleOfferClick = useCallback(() => {
    const buttonId = 'offer_whatsapp';
    const target = getWhatsappConfig(buttonId);
    trackWhatsappClick('offer', buttonId, target.href, target.isFallback);
  }, [getWhatsappConfig, trackWhatsappClick]);

  const handleRevenueWhatsappClick = useCallback(() => {
    const buttonId = 'revenue_whatsapp';
    const target = getWhatsappConfig(buttonId);
    trackWhatsappClick('revenue', buttonId, target.href, target.isFallback);
  }, [getWhatsappConfig, trackWhatsappClick]);

  const handlePlanClick = useCallback((planId: string) => {
    const buttonId = `pricing_${planId}_whatsapp`;
    const target = getWhatsappConfig(buttonId);
    trackPlanClick(planId, buttonId, target.isFallback);
    trackWhatsappClick('pricing', buttonId, target.href, target.isFallback);
  }, [getWhatsappConfig, trackPlanClick, trackWhatsappClick]);

  const handleFaqWhatsappClick = useCallback(() => {
    const buttonId = 'faq_whatsapp';
    const target = getWhatsappConfig(buttonId);
    trackWhatsappClick('faq', buttonId, target.href, target.isFallback);
  }, [getWhatsappConfig, trackWhatsappClick]);

  const handleFinalCtaClick = useCallback(() => {
    const buttonId = 'final_whatsapp';
    const target = getWhatsappConfig(buttonId);
    trackWhatsappClick('final_cta', buttonId, target.href, target.isFallback);
  }, [getWhatsappConfig, trackWhatsappClick]);

  const handleFinalRegisterClick = useCallback(() => {
    trackRegisterClick('final_secondary', 'final_register', registerHref);
  }, [trackRegisterClick]);

  const handleHeaderDesktopWhatsappClick = useCallback(() => {
    const buttonId = 'header_desktop_whatsapp';
    const target = getWhatsappConfig(buttonId);
    trackWhatsappClick('header', buttonId, target.href, target.isFallback);
  }, [getWhatsappConfig, trackWhatsappClick]);

  const handleHeaderMobileWhatsappClick = useCallback(() => {
    const buttonId = 'header_mobile_whatsapp';
    const target = getWhatsappConfig(buttonId);
    trackWhatsappClick('header', buttonId, target.href, target.isFallback);
  }, [getWhatsappConfig, trackWhatsappClick]);

  const handleHeaderDesktopRegisterClick = useCallback(() => {
    trackRegisterClick('header', 'header_desktop_register', registerHref);
  }, [trackRegisterClick]);

  const handleHeaderMobileRegisterClick = useCallback(() => {
    trackRegisterClick('header', 'header_mobile_register', registerHref);
  }, [trackRegisterClick]);

  return (
    <div className={styles.page}>
      <SkipLink targetId="main-content" />

      <LandingV2Header
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={toggleMenu}
        onCloseMobileMenu={closeMenu}
        onNavClick={handleNavClick}
        desktopWhatsappHref={getWhatsappConfig('header_desktop_whatsapp').href}
        mobileWhatsappHref={getWhatsappConfig('header_mobile_whatsapp').href}
        onDesktopWhatsappClick={handleHeaderDesktopWhatsappClick}
        onMobileWhatsappClick={handleHeaderMobileWhatsappClick}
        registerHref={registerHref}
        onDesktopRegisterClick={handleHeaderDesktopRegisterClick}
        onMobileRegisterClick={handleHeaderMobileRegisterClick}
      />

      <main id="main-content" tabIndex={-1}>
        <div className={`${styles.storyBlock} ${styles.storyBlockIntro}`}>
          <HeroSection
            whatsappHref={getWhatsappConfig('hero_whatsapp').href}
            registerHref={registerHref}
            onWhatsappClick={handleHeroWhatsappClick}
            onRegisterClick={handleHeroRegisterClick}
          />
          <ChallengesSection />
        </div>

        <SectionDivider />

        <div className={`${styles.storyBlock} ${styles.storyBlockProof}`}>
          <DemoSection
            whatsappHrefByStep={whatsappConfig.demoWhatsappHrefByStepId}
            registerHref={registerHref}
            onWhatsappClick={handleDemoWhatsappClick}
            onRegisterClick={handleDemoRegisterClick}
            onStepViewed={handleDemoStepViewed}
            onStepCtaClick={handleDemoStepCtaClick}
          />
          <SocialProofSection />
          <RevenueSection
            whatsappHref={getWhatsappConfig('revenue_whatsapp').href}
            onWhatsappClick={handleRevenueWhatsappClick}
          />
        </div>

        <SectionDivider />

        <div className={`${styles.storyBlock} ${styles.storyBlockDecision}`}>
          <OfferSection
            whatsappHref={getWhatsappConfig('offer_whatsapp').href}
            onWhatsappClick={handleOfferClick}
          />

          <PricingSection
            whatsappHrefByPlanId={whatsappConfig.pricingWhatsappHrefByPlanId}
            onPlanClick={handlePlanClick}
          />

          <FaqSection
            whatsappHref={getWhatsappConfig('faq_whatsapp').href}
            onWhatsappClick={handleFaqWhatsappClick}
            onToggleQuestion={trackFaqToggle}
          />

          <FinalCtaSection
            whatsappHref={getWhatsappConfig('final_whatsapp').href}
            registerHref={registerHref}
            onWhatsappClick={handleFinalCtaClick}
            onRegisterClick={handleFinalRegisterClick}
          />
        </div>
      </main>

      <LandingV2Footer />
    </div>
  );
}

