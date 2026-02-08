'use client';

import { Search, X } from 'lucide-react';
import styles from './SearchInput.module.css';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className }: SearchInputProps) {
    return (
        <div
            className={`${styles.searchWrapper} ${className || ''}`}
            role="search"
            aria-label="Campo de busca"
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
        </div>
    );
}
