/**
 * Focus Trap Hook
 * Traps keyboard focus within a container for better accessibility
 * Used for modals, mobile menus, and other overlay components
 */

'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface UseFocusTrapOptions {
  /**
   * Whether the focus trap is active
   */
  active: boolean;
  /**
   * Initial element to focus when trap activates
   */
  initialFocus?: HTMLElement | null;
  /**
   * Callback when escape key is pressed
   */
  onEscape?: () => void;
}

/**
 * Hook to trap focus within a container element
 * @param containerRef - Ref to the container element
 * @param options - Focus trap options
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options: UseFocusTrapOptions
) {
  const { active, initialFocus, onEscape } = options;
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus initial element or first focusable element
    if (initialFocus) {
      initialFocus.focus();
    } else if (firstFocusable) {
      firstFocusable.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      // Handle Tab key
      if (event.key === 'Tab') {
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        // Shift + Tab (backwards)
        if (event.shiftKey) {
          if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable?.focus();
          }
        } 
        // Tab (forwards)
        else {
          if (document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: restore focus to previous element
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, containerRef, initialFocus, onEscape]);
}
