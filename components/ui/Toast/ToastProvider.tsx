'use client';

import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import styles from './ToastProvider.module.css';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
    children: ReactNode;
}

function toastIcon(type: ToastType) {
    if (type === 'success') return <CheckCircle2 size={18} />;
    if (type === 'error') return <XCircle size={18} />;
    return <Info size={18} />;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const dismissToast = useCallback((id: string) => {
        setToasts((previous) => previous.filter((item) => item.id !== id));
    }, []);

    const showToast = useCallback(
        (message: string, type: ToastType = 'info', durationMs = 3500) => {
            const id =
                typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const toast: ToastItem = { id, message, type };
            setToasts((previous) => [...previous, toast]);
            window.setTimeout(() => dismissToast(id), Math.max(1200, durationMs));
        },
        [dismissToast]
    );

    const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className={styles.container} aria-live="polite" aria-atomic="true">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`} role="status">
                        <div className={styles.content}>
                            {toastIcon(toast.type)}
                            <span>{toast.message}</span>
                        </div>
                        <button
                            className={styles.close}
                            type="button"
                            onClick={() => dismissToast(toast.id)}
                            aria-label="Fechar notificação"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
