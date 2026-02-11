'use client';

import { memo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { faqData } from './content';
import { WhatsAppButton } from './WhatsAppButton';
import { renderEmphasis } from './text';
import {
  AnimatePresence,
  MotionButton,
  MotionDiv,
  MotionSection,
  cardRevealVariantsStrong,
  getDirectionalOffset,
  sectionRevealVariantsStrong,
  staggerItemVariants,
  useScrollDirection,
  viewportRepeat,
} from './motion';
import styles from './FaqSection.module.css';

type FaqSectionProps = {
  whatsappHref: string;
  onWhatsappClick: () => void;
  onToggleQuestion: (questionId: string, isOpen: boolean) => void;
};

export const FaqSection = memo(function FaqSection({ whatsappHref, onWhatsappClick, onToggleQuestion }: FaqSectionProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();

  const toggleItem = (questionId: string) => {
    setOpenItems((prev) => {
      const isOpen = !prev[questionId];
      onToggleQuestion(questionId, isOpen);
      return { ...prev, [questionId]: isOpen };
    });
  };

  return (
    <MotionSection
      id="faq"
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
          <span className={styles.kicker}>{renderEmphasis(faqData.kicker)}</span>
          <h2 className={styles.title}>{renderEmphasis(faqData.title)}</h2>
          <p className={styles.subtitle}>{renderEmphasis(faqData.description)}</p>
        </MotionDiv>

        <MotionDiv
          className={styles.items}
          initial="hidden"
          whileInView="visible"
          viewport={viewportRepeat}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.1, delayChildren: reduceMotion ? 0 : 0.06 } } }}
        >
          {faqData.items.map((item) => {
            const isOpen = Boolean(openItems[item.id]);
            return (
              <MotionDiv
                key={item.id}
                className={styles.item}
                variants={reduceMotion ? staggerItemVariants : cardRevealVariantsStrong}
              >
                <MotionButton
                  type="button"
                  className={styles.summary}
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                >
                  <span>{renderEmphasis(item.question)}</span>
                  <MotionDiv animate={isOpen ? { rotate: 180 } : { rotate: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }}>
                    <ChevronDown size={18} />
                  </MotionDiv>
                </MotionButton>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <MotionDiv
                      key={`faq-answer-${item.id}`}
                      id={`faq-answer-${item.id}`}
                      className={styles.answerWrap}
                      initial={reduceMotion ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={reduceMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p>{renderEmphasis(item.answer)}</p>
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </MotionDiv>
            );
          })}
        </MotionDiv>

        <MotionDiv
          className={styles.support}
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: getDirectionalOffset(scrollDirection, 14) }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportRepeat}
          transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <WhatsAppButton
            href={whatsappHref}
            onClick={onWhatsappClick}
            variant="secondary"
            size="md"
            className={styles.cta}
          >
            {faqData.ctaLabel}
          </WhatsAppButton>
          <p>{renderEmphasis(faqData.ctaSupport)}</p>
        </MotionDiv>
      </div>
    </MotionSection>
  );
});
