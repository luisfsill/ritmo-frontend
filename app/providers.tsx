'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/lib/theme-context';
import { AuthProvider } from '@/lib/auth-context';
import { ConfirmDialogProvider, ToastProvider } from '@/components/ui';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider defaultTheme="system">
            <AuthProvider>
                <ToastProvider>
                    <ConfirmDialogProvider>
                        {children}
                    </ConfirmDialogProvider>
                </ToastProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
