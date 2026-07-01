/**
 * Analytics Service — Phase 2
 * Placeholder สำหรับ track usage events
 * เตรียมไว้เชื่อม Firebase Analytics / Mixpanel / Amplitude
 */
import { ENV } from '../config/env';

export type AnalyticsEvent =
  | 'screen_view'
  | 'sale_completed'
  | 'sale_voided'
  | 'member_created'
  | 'member_points_earned'
  | 'member_points_redeemed'
  | 'coupon_used'
  | 'promotion_applied'
  | 'shift_opened'
  | 'shift_closed'
  | 'stock_received'
  | 'stock_adjusted'
  | 'product_created'
  | 'product_updated'
  | 'sync_completed'
  | 'sync_failed'
  | 'login_success'
  | 'login_failed'
  | 'report_exported';

interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

class AnalyticsService {
  private enabled = ENV.APP_ENV === 'production';
  private userId: string | null = null;

  /**
   * Track an event
   */
  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    if (ENV.LOG_LEVEL === 'debug') {
      console.log('[Analytics]', event, properties);
    }

    if (!this.enabled) return;

    // TODO: Firebase Analytics / Mixpanel
    // analytics().logEvent(event, { ...properties, userId: this.userId });
  }

  /**
   * Track screen view
   */
  screenView(screenName: string, screenClass?: string): void {
    this.track('screen_view', { screen_name: screenName, screen_class: screenClass });
  }

  /**
   * Set user ID for attribution
   */
  identify(userId: string, traits?: AnalyticsProperties): void {
    this.userId = userId;
    if (ENV.LOG_LEVEL === 'debug') {
      console.log('[Analytics] Identify:', userId, traits);
    }
    // analytics().setUserId(userId);
    // if (traits) analytics().setUserProperties(traits);
  }

  /**
   * Clear user on logout
   */
  reset(): void {
    this.userId = null;
    // analytics().setUserId(null);
  }
}

export const analytics = new AnalyticsService();
