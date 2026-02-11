/**
 * Analytics service for Landing V2
 * Handles event tracking with error handling and type safety
 */

import { LandingV2EventMap } from './types';

/**
 * Google Analytics gtag window interface
 */
interface GtagWindow extends Window {
  gtag?: (
    command: 'event',
    eventName: string,
    params: Record<string, unknown>
  ) => void;
  dataLayer?: unknown[];
}

/**
 * Check if analytics is available
 */
function isAnalyticsAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const gtagWindow = window as GtagWindow;
  return typeof gtagWindow.gtag === 'function';
}

/**
 * Track an event with type safety and error handling
 */
export function trackEvent<K extends keyof LandingV2EventMap>(
  name: K,
  params: LandingV2EventMap[K]
): void {
  try {
    if (!isAnalyticsAvailable()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Event tracked:', name, params);
      }
      return;
    }

    const gtagWindow = window as GtagWindow;
    gtagWindow.gtag!('event', name, params as Record<string, unknown>);
  } catch (error) {
    console.error('[Analytics] Failed to track event:', name, error);
  }
}

/**
 * Track page view (useful for SPA navigation)
 */
export function trackPageView(path: string, title?: string): void {
  try {
    if (!isAnalyticsAvailable()) return;

    const gtagWindow = window as GtagWindow;
    gtagWindow.gtag!('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  } catch (error) {
    console.error('[Analytics] Failed to track page view:', error);
  }
}
