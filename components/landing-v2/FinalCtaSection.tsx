'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { UserCheck, Route, Target } from 'lucide-react';
import { finalCtaData } from './content';
import { WhatsAppButton } from './WhatsAppButton';
import { renderEmphasis } from './text';
import {
  MotionDiv,
  MotionSection,
  getDirectionalOffset,
  sectionRevealVariantsStrong,
  useScrollDirection,
  viewportRepeat,
} from './motion';
import styles from './FinalCtaSection.module.css';

type FinalCtaSectionProps = {
  whatsappHref: string;
  registerHref: string;
  onWhatsappClick: () => void;
  onRegisterClick: () => void;
};

export const FinalCtaSection = memo(function FinalCtaSection({
  whatsappHref,
  registerHref,
  onWhatsappClick,
  onRegisterClick,
}: FinalCtaSectionProps) {
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();

  return (
    <MotionSection
      id="final-cta"
      className={styles.section}
      initial="hidden"
      whileInView="visible"
      viewport={viewportRepeat}
      custom={scrollDirection}
      variants={reduceMotion ? undefined : sectionRevealVariantsStrong}
    >
      <MotionDiv
        className={styles.inner}
        initial={
          reduceMotion
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: getDirectionalOffset(scrollDirection, 26), scale: 0.985 }
        }
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={viewportRepeat}
        transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2>{renderEmphasis(finalCtaData.title)}</h2>
        <p className={styles.subtitle}>{renderEmphasis(finalCtaData.subtitle)}</p>
        <p className={styles.supporting}>{renderEmphasis(finalCtaData.supportingText)}</p>
        <MotionDiv
          className={styles.assurances}
          initial="hidden"
          whileInView="visible"
          viewport={viewportRepeat}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08, delayChildren: reduceMotion ? 0 : 0.04 } } }}
        >
          <MotionDiv className={styles.assuranceItem} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <UserCheck size={15} />
            Acompanhamento de especialista
          </MotionDiv>
          <MotionDiv className={styles.assuranceItem} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <Route size={15} />
            Implantação passo a passo
          </MotionDiv>
          <MotionDiv className={styles.assuranceItem} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <Target size={15} />
            Metas definidas desde o início
          </MotionDiv>
        </MotionDiv>
        <div className={styles.actions}>
          <WhatsAppButton
            href={whatsappHref}
            onClick={onWhatsappClick}
            variant="primary"
            size="lg"
            showArrow
            className={styles.cta}
          >
            Falar no WhatsApp agora
          </WhatsAppButton>
          <Link href={registerHref} className={styles.secondaryCta} onClick={onRegisterClick}>
            {finalCtaData.secondaryCtaLabel}
          </Link>
        </div>
      </MotionDiv>
    </MotionSection>
  );
});
