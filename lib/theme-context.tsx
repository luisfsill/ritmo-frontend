'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
        defaultTheme === 'dark' ? 'dark' : 'light'
    );
    const [mounted, setMounted] = useState(false);

    // Load saved theme from localStorage
    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('ritmo_theme') as Theme | null;
        const nextTheme: Theme =
            savedTheme && ['light', 'dark', 'system'].includes(savedTheme)
                ? savedTheme
                : defaultTheme;
        setThemeState(nextTheme);
        localStorage.setItem('ritmo_theme', nextTheme);
    }, [defaultTheme]);

    // Handle theme changes and system preference
    useEffect(() => {
        if (!mounted) return;
        
        const root = document.documentElement;

        const applyTheme = (effectiveTheme: 'light' | 'dark') => {
            root.setAttribute('data-theme', effectiveTheme);
            setResolvedTheme(effectiveTheme);
        };

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mediaQuery.matches ? 'dark' : 'light');

            const handler = (e: MediaQueryListEvent) => {
                applyTheme(e.matches ? 'dark' : 'light');
            };

            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }

        applyTheme(theme);
    }, [theme, mounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('ritmo_theme', newTheme);
    };

    const toggleTheme = () => {
        const nextTheme = resolvedTheme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
