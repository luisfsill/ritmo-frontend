'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion, type Variants } from 'framer-motion';

const strongEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
export type ScrollDirection = 'up' | 'down';

export function getDirectionalOffset(direction: ScrollDirection, distance: number) {
  return direction === 'down' ? distance : -distance;
}

export function useScrollDirection() {
  const [direction, setDirection] = useState<ScrollDirection>('down');
  const lastY = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    lastY.current = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      const nextDirection: ScrollDirection = currentY >= lastY.current ? 'down' : 'up';
      if (nextDirection !== direction) setDirection(nextDirection);
      lastY.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [direction]);

  return direction;
}

export const viewportRepeat = {
  once: false,
  amount: 0.2,
} as const;

export const sectionRevealVariantsStrong: Variants = {
  hidden: (direction: ScrollDirection = 'down') => ({ opacity: 0, y: getDirectionalOffset(direction, 40) }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: strongEase },
  },
};

export const cardRevealVariantsStrong: Variants = {
  hidden: (direction: ScrollDirection = 'down') => ({ opacity: 0, y: getDirectionalOffset(direction, 16) }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: strongEase },
  },
};

export const presenceSlideFade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
  y?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
};

export function RevealOnScroll({
  children,
  className,
  y = 24,
  duration = 0.38,
  delay = 0,
  once = false,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once, margin: '-8% 0px -8% 0px' });
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: getDirectionalOffset(scrollDirection, y) }}
      animate={
        inView
          ? { opacity: 1, y: 0 }
          : reduceMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: getDirectionalOffset(scrollDirection, y) }
      }
      transition={{
        duration: reduceMotion ? 0 : duration,
        delay: reduceMotion ? 0 : delay,
        ease: strongEase,
      }}
    >
      {children}
    </motion.div>
  );
}

type StaggerContainerProps = {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
};

export function StaggerContainer({
  children,
  className,
  delayChildren = 0.04,
  staggerChildren = 0.1,
}: StaggerContainerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportRepeat}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: reduceMotion ? 0 : delayChildren,
            staggerChildren: reduceMotion ? 0 : staggerChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export const staggerItemVariants: Variants = {
  hidden: (direction: ScrollDirection = 'down') => ({ opacity: 0, y: getDirectionalOffset(direction, 12) }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: strongEase },
  },
};

export { AnimatePresence };
export const MotionDiv = motion.div;
export const MotionArticle = motion.article;
export const MotionSection = motion.section;
export const MotionButton = motion.button;
