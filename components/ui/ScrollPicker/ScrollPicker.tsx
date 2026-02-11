'use client';

import { useRef, useEffect, useCallback, useState, type CSSProperties } from 'react';
import styles from './ScrollPicker.module.css';

interface ScrollPickerColumnProps {
    values: number[];
    selected: number;
    onChange: (value: number) => void;
    label: string;
    formatValue?: (value: number) => string;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const SCROLL_DEBOUNCE = 120; // Reduced for snappier response
const MAX_ROTATION_DEG = 15; // Maximum rotation angle for 3D effect

function ScrollPickerColumn({ values, selected, onChange, label, formatValue }: ScrollPickerColumnProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const selectedIndex = values.indexOf(selected);
    const padCount = Math.floor(VISIBLE_ITEMS / 2);

    const scrollToIndex = useCallback((index: number, smooth = false) => {
        if (listRef.current) {
            const scrollTop = index * ITEM_HEIGHT;
            listRef.current.scrollTo({
                top: scrollTop,
                behavior: smooth ? 'smooth' : 'auto',
            });
        }
    }, []);

    // Initialize scroll position
    useEffect(() => {
        if (selectedIndex >= 0) {
            // Small delay to ensure DOM is ready
            requestAnimationFrame(() => {
                scrollToIndex(selectedIndex, false);
            });
        }
    }, [selectedIndex, scrollToIndex]);

    const handleScroll = useCallback(() => {
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        isScrollingRef.current = true;
        setIsAnimating(true);

        scrollTimeoutRef.current = setTimeout(() => {
            if (!listRef.current) return;
            isScrollingRef.current = false;

            const scrollTop = listRef.current.scrollTop;
            const nearestIndex = Math.round(scrollTop / ITEM_HEIGHT);
            const clampedIndex = Math.max(0, Math.min(nearestIndex, values.length - 1));
            const safeSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;
            const distance = Math.abs(clampedIndex - safeSelectedIndex);
            const shouldSmooth = distance <= 3; // Increased for smoother transitions

            // Snap to nearest item
            scrollToIndex(clampedIndex, shouldSmooth);

            if (values[clampedIndex] !== selected) {
                onChange(values[clampedIndex]);
            }
            
            setIsAnimating(false);
        }, SCROLL_DEBOUNCE);
    }, [values, selected, selectedIndex, onChange, scrollToIndex]);

    // Cleanup timeout
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    const handleItemClick = (index: number) => {
        scrollToIndex(index, true);
        onChange(values[index]);
    };

    const display = (v: number) => formatValue ? formatValue(v) : String(v).padStart(2, '0');

    return (
        <div className={styles.column}>
            <div className={styles.columnLabel}>{label}</div>
            <div className={`${styles.wheelWrapper} ${isAnimating ? styles.wheelWrapperAnimating : ''}`}>
                <div className={styles.highlight} />
                <div className={styles.fadeTop} />
                <div className={styles.fadeBottom} />
                <div
                    ref={listRef}
                    className={styles.wheelList}
                    onScroll={handleScroll}
                    style={{
                        height: ITEM_HEIGHT * VISIBLE_ITEMS,
                    }}
                >
                    {/* Top padding */}
                    <div style={{ height: ITEM_HEIGHT * padCount, flexShrink: 0 }} />
                    {values.map((v, i) => (
                        (() => {
                            const distance = Math.abs(i - selectedIndex);
                            
                            // Enhanced scale with smoother progression
                            const visualScale = distance === 0 ? 1.12 : 
                                              distance === 1 ? 0.98 : 
                                              distance === 2 ? 0.86 : 
                                              0.75;
                            
                            // Enhanced opacity with better contrast
                            const visualOpacity = distance === 0 ? 1 : 
                                                distance === 1 ? 0.85 : 
                                                distance === 2 ? 0.58 : 
                                                0.35;
                            
                            // Calculate 3D rotation based on distance from center
                            const centerOffset = i - selectedIndex;
                            const rotationX = -centerOffset * (MAX_ROTATION_DEG / 2.5);
                            
                            // Blur effect for distant items
                            const blurAmount = distance === 0 ? 0 : 
                                             distance === 1 ? 0 : 
                                             distance === 2 ? 0.5 : 
                                             1.2;

                            return (
                                <div
                                    key={v}
                                    className={`${styles.wheelItem} ${v === selected ? styles.wheelItemSelected : ''}`}
                                    style={{
                                        height: ITEM_HEIGHT,
                                        ['--item-scale' as string]: visualScale,
                                        ['--item-opacity' as string]: visualOpacity,
                                        ['--item-rotate-x' as string]: rotationX,
                                        ['--item-blur' as string]: blurAmount,
                                    } as CSSProperties}
                                    onClick={() => handleItemClick(i)}
                                >
                                    {display(v)}
                                </div>
                            );
                        })()
                    ))}
                    {/* Bottom padding */}
                    <div style={{ height: ITEM_HEIGHT * padCount, flexShrink: 0 }} />
                </div>
            </div>
        </div>
    );
}

export interface ScrollPickerProps {
    days: number;
    hours: number;
    minutes: number;
    onDaysChange: (v: number) => void;
    onHoursChange: (v: number) => void;
    onMinutesChange: (v: number) => void;
    maxDays?: number;
    onAdd: () => void;
    addLabel?: string;
}

const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

export default function ScrollPicker({
    days,
    hours,
    minutes,
    onDaysChange,
    onHoursChange,
    onMinutesChange,
    maxDays = 30,
    onAdd,
    addLabel = 'Adicionar',
}: ScrollPickerProps) {
    const dayValues = range(0, maxDays);
    const hourValues = range(0, 23);
    const minuteValues = range(0, 59);

    const [summary, setSummary] = useState('');

    useEffect(() => {
        const parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}min`);
        setSummary(parts.length > 0 ? parts.join(' ') : '0min');
    }, [days, hours, minutes]);

    const totalMinutes = (days * 24 * 60) + (hours * 60) + minutes;

    return (
        <div className={styles.picker}>
            <div className={styles.columns}>
                <ScrollPickerColumn
                    values={dayValues}
                    selected={days}
                    onChange={onDaysChange}
                    label="Dias"
                />
                <span className={styles.separator}>:</span>
                <ScrollPickerColumn
                    values={hourValues}
                    selected={hours}
                    onChange={onHoursChange}
                    label="Horas"
                />
                <span className={styles.separator}>:</span>
                <ScrollPickerColumn
                    values={minuteValues}
                    selected={minutes}
                    onChange={onMinutesChange}
                    label="Min"
                />
            </div>
            <div className={styles.pickerFooter}>
                <span className={styles.summaryText}>{summary} antes</span>
                <button
                    type="button"
                    className={styles.addBtn}
                    onClick={onAdd}
                    disabled={totalMinutes <= 0}
                >
                    + {addLabel}
                </button>
            </div>
        </div>
    );
}
