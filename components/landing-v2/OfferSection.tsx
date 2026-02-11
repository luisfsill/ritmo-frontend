'use client';

import { memo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Layers3, Clock, CalendarCheck, Zap, Building2 } from 'lucide-react';
import { offerData } from './content';
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
import styles from './OfferSection.module.css';

type OfferSectionProps = {
  whatsappHref: string;
  onWhatsappClick: () => void;
};

export const OfferSection = memo(function OfferSection({ whatsappHref, onWhatsappClick }: OfferSectionProps) {
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();

  return (
    <MotionSection
      id="offer"
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
          <span className={styles.kicker}>{renderEmphasis(offerData.kicker)}</span>
          <h2 className={styles.title}>{renderEmphasis(offerData.title)}</h2>
          <p className={styles.subtitle}>{renderEmphasis(offerData.description)}</p>
        </MotionDiv>

        <MotionDiv
          className={styles.layout}
          initial="hidden"
          whileInView="visible"
          viewport={viewportRepeat}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.12, delayChildren: reduceMotion ? 0 : 0.08 } } }}
        >
          <MotionDiv className={styles.benefitsGrid} variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}>
            {[
              { icon: Clock, text: offerData.benefits[0] },
              { icon: CalendarCheck, text: offerData.benefits[1] },
              { icon: Zap, text: offerData.benefits[2] },
              { icon: Building2, text: offerData.benefits[3] },
            ].map(({ icon: Icon, text }) => (
              <MotionArticle key={text} className={styles.benefitCard} variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}>
                <div className={styles.benefitIcon}><Icon size={20} /></div>
                <p>{renderEmphasis(text)}</p>
              </MotionArticle>
            ))}
          </MotionDiv>

          <MotionDiv className={styles.phasesWrap} variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}>
            <div className={styles.blockHeader}>
              <Layers3 size={18} />
              <h3>Plano por fases</h3>
            </div>
            <MotionDiv
              className={styles.phases}
              initial="hidden"
              whileInView="visible"
              viewport={viewportRepeat}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.1, delayChildren: reduceMotion ? 0 : 0.04 } } }}
            >
              {offerData.phases.map((phase) => (
                <MotionArticle
                  key={phase.phase}
                  className={styles.phaseCard}
                  variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}
                >
                  <p className={styles.phase}>{phase.phase}</p>
                  <h4>{renderEmphasis(phase.title)}</h4>
                  <p>{renderEmphasis(phase.description)}</p>
                </MotionArticle>
              ))}
            </MotionDiv>
          </MotionDiv>
        </MotionDiv>

        <MotionDiv
          className={styles.ctaWrap}
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: getDirectionalOffset(scrollDirection, 18), scale: 0.99 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={viewportRepeat}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <WhatsAppButton
            href={whatsappHref}
            onClick={onWhatsappClick}
            variant="secondary"
            size="lg"
            className={styles.cta}
          >
            {offerData.ctaLabel}
          </WhatsAppButton>
          <p>{renderEmphasis(offerData.ctaSupport)}</p>
        </MotionDiv>
      </div>
    </MotionSection>
  );
});
