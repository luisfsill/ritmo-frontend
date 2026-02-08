'use client';

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import styles from './ConfirmDialogProvider.module.css';

type ConfirmVariant = 'default' | 'danger';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
}

interface ConfirmDialogState extends ConfirmOptions {
    resolve: (result: boolean) => void;
}

interface ConfirmDialogContextValue {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | undefined>(undefined);

interface ConfirmDialogProviderProps {
    children: ReactNode;
}

export function ConfirmDialogProvider({ children }: ConfirmDialogProviderProps) {
    const [dialog, setDialog] = useState<ConfirmDialogState | null>(null);

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setDialog({
                title: options.title || 'Confirmar ação',
                message: options.message,
                confirmLabel: options.confirmLabel || 'Confirmar',
                cancelLabel: options.cancelLabel || 'Cancelar',
                variant: options.variant || 'default',
                resolve,
            });
        });
    }, []);

    const closeWithResult = useCallback((result: boolean) => {
        setDialog((current) => {
            if (!current) return current;
            current.resolve(result);
            return null;
        });
    }, []);

    const value = useMemo<ConfirmDialogContextValue>(() => ({ confirm }), [confirm]);

    return (
        <ConfirmDialogContext.Provider value={value}>
            {children}
            <Modal
                isOpen={Boolean(dialog)}
                onClose={() => closeWithResult(false)}
                title={dialog?.title || 'Confirmar ação'}
                size="sm"
            >
                <p className={styles.message}>{dialog?.message}</p>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => closeWithResult(false)}>
                        {dialog?.cancelLabel || 'Cancelar'}
                    </Button>
                    <Button
                        variant={dialog?.variant === 'danger' ? 'destructive' : 'primary'}
                        onClick={() => closeWithResult(true)}
                    >
                        {dialog?.confirmLabel || 'Confirmar'}
                    </Button>
                </ModalFooter>
            </Modal>
        </ConfirmDialogContext.Provider>
    );
}

export function useConfirmDialog() {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
        throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
    }
    return context;
}
