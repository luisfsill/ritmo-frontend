'use client';

import { ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

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
  duration = 0.42,
  delay = 0,
  once = true,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once, margin: '-10% 0px -10% 0px' });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : reduceMotion ? { opacity: 1 } : { opacity: 0, y }}
      transition={{ duration: reduceMotion ? 0 : duration, delay: reduceMotion ? 0 : delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

type FadeInUpProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function FadeInUp({ children, className, delay = 0 }: FadeInUpProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

type StaggerContainerProps = {
  children: ReactNode;
  className?: string;
};

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduceMotion ? 0 : 0.08,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: 'easeOut' as const },
  },
};

export const MotionButton = motion.button;
export const MotionLink = motion.a;
export const MotionDiv = motion.div;

