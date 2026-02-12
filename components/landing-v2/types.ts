export type LandingV2SectionId =
  | 'hero'
  | 'challenges'
  | 'problem'
  | 'solution'
  | 'demo'
  | 'revenue'
  | 'social_proof'
  | 'pricing'
  | 'faq'
  | 'final_cta';

export type LandingV2CtaOrigin =
  | 'header'
  | 'hero_primary'
  | 'demo_step'
  | 'revenue'
  | 'pricing'
  | 'faq'
  | 'final_cta';

export type LandingV2RegisterOrigin =
  | 'header'
  | 'hero_secondary'
  | 'demo_secondary'
  | 'final_secondary';

export type LandingV2EventMap = {
  landing_v2_section_view: { section: LandingV2SectionId };
  landing_v2_nav_click: { target_section: LandingV2SectionId };
  landing_v2_theme_toggle: { from: 'light' | 'dark'; to: 'light' | 'dark' };
  landing_v2_scroll_depth: { depth_pct: 25 | 50 | 75 | 100 };
  landing_v2_whatsapp_click: {
    origin: LandingV2CtaOrigin;
    button_id: string;
    target: string;
    is_fallback: boolean;
  };
  landing_v2_pricing_plan_click: {
    plan_id: string;
    button_id: string;
    origin: 'pricing';
    is_fallback: boolean;
  };
  landing_v2_register_click: {
    origin: LandingV2RegisterOrigin;
    button_id: string;
    target: string;
  };
  landing_v2_demo_interaction: {
    action: 'step_view' | 'step_cta_click';
    step_id?: string;
    step_index?: number;
  };
  landing_v2_faq_toggle: {
    question_id: string;
    is_open: boolean;
  };
};

export type HeroMetric = {
  value: string;
  label: string;
  delta: string;
  context: string;
};

export type ProblemItem = {
  title: string;
  description: string;
};

export type SolutionItem = {
  title: string;
  description: string;
};

export type SocialStat = {
  value: string;
  metric: string;
  baselineLabel: string;
  confidenceNote?: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  result?: string;
};

export type DemoPreviewMessage = {
  author: 'Cliente' | 'Ritmo';
  text: string;
};

export type DemoStepSimple = {
  id: 'entrada' | 'oferta' | 'confirmacao';
  title: string;
  userSituation: string;
  ritmoAction: string;
  outcome: string;
  preview: DemoPreviewMessage[];
  ctaLabel: string;
};

export type RevenueScenario = {
  id: string;
  icon: string;
  title: string;
  description: string;
  preview: DemoPreviewMessage[];
  metric: string;
  metricLabel: string;
};

export type PricingPlan = {
  id: string;
  name: string;
  price?: string;
  currentPrice?: string;
  originalPrice?: string;
  pricePrefix?: string;
  promoLabel?: string;
  promoEndsAt?: string;
  billing: string;
  description: string;
  fitLabel: string;
  features: string[];
  ctaLabel: string;
  isRecommended?: boolean;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqData = {
  kicker: string;
  title: string;
  description: string;
  items: FaqItem[];
  ctaLabel: string;
  ctaSupport: string;
};
