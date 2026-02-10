'use client';

import { useEffect, useId, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg';
    showCloseButton?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const lastFocusedElementRef = useRef<HTMLElement | null>(null);
    const titleId = useId();

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
            }
            if (e.key !== 'Tab') return;
            const container = dialogRef.current;
            if (!container) return;
            const focusable = Array.from(
                container.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
            ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
            if (focusable.length === 0) {
                e.preventDefault();
                container.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement as HTMLElement | null;
            if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };

        lastFocusedElementRef.current = document.activeElement as HTMLElement | null;
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        
        // Delay focus to next frame to avoid interfering with initial render
        const focusTimeoutId = window.requestAnimationFrame(() => {
            const container = dialogRef.current;
            if (!container) return;
            const focusable = container.querySelector<HTMLElement>(
                'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'
            );
            if (focusable && focusable instanceof HTMLInputElement) {
                focusable.focus();
                focusable.select?.();
            } else if (focusable) {
                focusable.focus();
            }
        });

        return () => {
            cancelAnimationFrame(focusTimeoutId as unknown as number);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
            const previous = lastFocusedElementRef.current;
            if (previous && typeof previous.focus === 'function') {
                previous.focus();
            }
        };
    }, [isOpen, onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };

    if (!isOpen) return null;

    const modal = (
        <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
            <div
                ref={dialogRef}
                className={`${styles.modal} ${styles[size]}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
            >
                <div className={styles.header}>
                    <h2 id={titleId} className={styles.title}>{title}</h2>
                    {showCloseButton && (
                        <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
                            <X size={20} />
                        </button>
                    )}
                </div>
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );

    return typeof window !== 'undefined' ? createPortal(modal, document.body) : null;
}

interface ModalFooterProps {
    children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
    return <div className={styles.footer}>{children}</div>;
}
