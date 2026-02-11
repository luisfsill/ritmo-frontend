'use client';

import { memo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { pricingPlans } from './content';
import { WhatsAppButton } from './WhatsAppButton';
import { renderEmphasis } from './text';
import {
  MotionArticle,
  MotionDiv,
  MotionSection,
  cardRevealVariantsStrong,
  getDirectionalOffset,
  sectionRevealVariantsStrong,
  staggerItemVariants,
  useScrollDirection,
  viewportRepeat,
} from './motion';
import styles from './PricingSection.module.css';

type PricingSectionProps = {
  whatsappHrefByPlanId: Record<string, string>;
  onPlanClick: (planId: string) => void;
};

export const PricingSection = memo(function PricingSection({ whatsappHrefByPlanId, onPlanClick }: PricingSectionProps) {
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();
  const fallbackPlanHref = whatsappHrefByPlanId[pricingPlans[0].id] || Object.values(whatsappHrefByPlanId)[0] || '#';

  return (
    <MotionSection
      id="pricing"
      className={styles.section}
      initial="hidden"
      whileInView="visible"
      viewport={viewportRepeat}
      custom={scrollDirection}
      variants={reduceMotion ? undefined : sectionRevealVariantsStrong}
    >
      <div className={styles.inner}>
        <MotionDiv
          className={styles.copy}
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: getDirectionalOffset(scrollDirection, 26) }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportRepeat}
          transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className={styles.title}>{renderEmphasis('Planos simples para **escolher rápido**')}</h2>
          <p className={styles.subtitle}>
            {renderEmphasis('Compare recursos, escolha o plano e fale com o time no WhatsApp para **ativar**.')}
          </p>
        </MotionDiv>

        <MotionDiv
          className={styles.grid}
          initial="hidden"
          whileInView="visible"
          viewport={viewportRepeat}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.11, delayChildren: reduceMotion ? 0 : 0.08 } } }}
        >
          {pricingPlans.map((plan, index) => {
            const currentPrice = plan.currentPrice ?? plan.price;
            const hasPromotion = Boolean(plan.originalPrice && currentPrice);
            const hasPrice = Boolean(currentPrice);

            return (
              <MotionArticle
                key={plan.id}
                className={`${styles.card} ${plan.isRecommended ? styles.cardRecommended : ''}`}
                variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}
                whileInView={
                  reduceMotion || !plan.isRecommended
                    ? undefined
                    : { scale: [0.99, 1.01, 1], opacity: [0.98, 1, 1] }
                }
                viewport={viewportRepeat}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: plan.isRecommended ? 0.4 : 0.32,
                        delay: index * 0.02,
                        ease: [0.22, 1, 0.36, 1],
                      }
                }
              >
                {plan.isRecommended && <span className={styles.recommended}>Mais recomendado</span>}
                {plan.promoLabel && plan.isRecommended && <span className={styles.promoChip}>{plan.promoLabel}</span>}
                <h3>{plan.name}</h3>

                {hasPrice && (
                  <div className={styles.priceWrap}>
                    {plan.pricePrefix && <span className={styles.pricePrefix}>{plan.pricePrefix}</span>}
                    {hasPromotion && (
                      <p className={styles.priceTransition}>
                        <span className={styles.priceFrom}>de</span>
                        <span className={styles.originalPrice}>{plan.originalPrice}</span>
                        <span className={styles.priceFrom}>por</span>
                      </p>
                    )}
                    <p className={styles.price}>
                      <span className={styles.currentPrice}>{currentPrice}</span>
                      {plan.billing && <span className={styles.billing}>{plan.billing}</span>}
                    </p>
                    {plan.promoEndsAt && <span className={styles.promoMeta}>{plan.promoEndsAt}</span>}
                  </div>
                )}

                <p className={styles.description}>{renderEmphasis(plan.description)}</p>
                <p className={styles.fitLabel}>{renderEmphasis(plan.fitLabel)}</p>

                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle size={16} />
                      <span>{renderEmphasis(feature)}</span>
                    </li>
                  ))}
                </ul>

                <WhatsAppButton
                  href={whatsappHrefByPlanId[plan.id] || fallbackPlanHref}
                  onClick={() => onPlanClick(plan.id)}
                  variant={plan.isRecommended ? 'primary' : 'secondary'}
                  size="md"
                  className={styles.cta}
                >
                  {plan.ctaLabel}
                </WhatsAppButton>
              </MotionArticle>
            );
          })}
        </MotionDiv>
      </div>
    </MotionSection>
  );
});
