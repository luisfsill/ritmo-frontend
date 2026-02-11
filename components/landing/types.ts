export type LandingSectionId =
  | 'hero'
  | 'demo'
  | 'features'
  | 'how_it_works'
  | 'benefits'
  | 'final_cta';

export type CtaOrigin = 'hero' | 'final' | 'demo';

export type DemoCard = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  gradient: string;
};

export type LandingEventMap = {
  landing_cta_primary_click: { origin: CtaOrigin };
  landing_cta_secondary_click: { origin: 'hero'; target: '#demo' };
  landing_demo_card_viewed: { card_index: number; card_title: string; previous_card?: number };
  landing_section_view: { section: LandingSectionId };
};

