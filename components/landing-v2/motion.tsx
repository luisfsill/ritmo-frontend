'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform, type Variants } from 'framer-motion';

const strongEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
const bounceEase: [number, number, number, number] = [0.34, 1.56, 0.64, 1];
const smoothEase: [number, number, number, number] = [0.4, 0, 0.2, 1];

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
  hidden: (direction: ScrollDirection = 'down') => ({ opacity: 0, y: getDirectionalOffset(direction, 60) }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: strongEase },
  },
};

export const cardRevealVariantsStrong: Variants = {
  hidden: (direction: ScrollDirection = 'down') => ({ opacity: 0, y: getDirectionalOffset(direction, 30), scale: 0.95 }),
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: strongEase },
  },
};

/* New animation variants for enhanced scroll experience */
export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: strongEase },
  },
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: strongEase },
  },
};

export const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: bounceEase },
  },
};

export const rotateInVariants: Variants = {
  hidden: { opacity: 0, rotate: -8, scale: 0.9 },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: { duration: 0.7, ease: strongEase },
  },
};

export const blurRevealVariants: Variants = {
  hidden: { opacity: 0, filter: 'blur(12px)', y: 30 },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: { duration: 0.8, ease: smoothEase },
  },
};

export const bounceInVariants: Variants = {
  hidden: { opacity: 0, y: 80 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: bounceEase },
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
  x?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
  scale?: number;
  rotate?: number;
  blur?: boolean;
};

export function RevealOnScroll({
  children,
  className,
  y = 40,
  x = 0,
  duration = 0.6,
  delay = 0,
  once = false,
  scale = 1,
  rotate = 0,
  blur = false,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once, margin: '-10% 0px -10% 0px' });
  const reduceMotion = useReducedMotion();
  const scrollDirection = useScrollDirection();

  const initialState = reduceMotion
    ? { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0, filter: 'blur(0px)' }
    : {
        opacity: 0,
        y: getDirectionalOffset(scrollDirection, y),
        x,
        scale: scale < 1 ? scale : 1,
        rotate,
        filter: blur ? 'blur(10px)' : 'blur(0px)',
      };

  const animateState = inView || reduceMotion
    ? { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0, filter: 'blur(0px)' }
    : initialState;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initialState}
      animate={animateState}
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
  delayChildren = 0.08,
  staggerChildren = 0.12,
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
  hidden: (direction: ScrollDirection = 'down') => ({ opacity: 0, y: getDirectionalOffset(direction, 24), scale: 0.96 }),
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: strongEase },
  },
};

/* Parallax scroll component */
type ParallaxProps = {
  children: ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down';
};

export function Parallax({ children, className, speed = 0.3, direction = 'up' }: ParallaxProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const reduceMotion = useReducedMotion();

  const yOffset = direction === 'up' ? -100 * speed : 100 * speed;
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [yOffset, -yOffset]);

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}

/* Float animation component */
type FloatProps = {
  children: ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
};

export function Float({ children, className, duration = 4, distance = 10 }: FloatProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      animate={
        reduceMotion
          ? {}
          : {
              y: [0, -distance, 0],
            }
      }
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

/* Glow pulse component for CTAs */
type GlowPulseProps = {
  children: ReactNode;
  className?: string;
  color?: string;
};

export function GlowPulse({ children, className, color = 'rgba(0, 102, 255, 0.4)' }: GlowPulseProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      animate={
        reduceMotion
          ? {}
          : {
              boxShadow: [
                `0 0 20px ${color}`,
                `0 0 40px ${color}`,
                `0 0 20px ${color}`,
              ],
            }
      }
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

export { AnimatePresence };
export const MotionDiv = motion.div;
export const MotionArticle = motion.article;
export const MotionSection = motion.section;
export const MotionButton = motion.button;
