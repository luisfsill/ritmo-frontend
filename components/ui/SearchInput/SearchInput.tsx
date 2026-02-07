'use client';

import { Search, X, ArrowRight } from 'lucide-react';
import styles from './SearchInput.module.css';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className }: SearchInputProps) {
    return (
        <form 
            className={`${styles.searchWrapper} ${className || ''}`} 
            onSubmit={(e) => e.preventDefault()} 
            autoComplete="off"
        >
            <Search size={18} className={styles.searchIcon} />
            <input
                type="text"
                placeholder={placeholder}
                className={styles.searchInput}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete="off"
            />
            {value && (
                <button 
                    className={styles.searchClearButton} 
                    type="button" 
                    aria-label="Limpar busca"
                    onClick={() => onChange('')}
                >
                    <X size={16} />
                </button>
            )}
            <button className={styles.searchButton} type="submit" aria-label="Buscar">
                <ArrowRight size={18} />
            </button>
        </form>
    );
}
