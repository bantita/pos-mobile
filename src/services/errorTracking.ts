/**
 * Error Tracking Service — Phase 2
 * Lightweight wrapper — เตรียมไว้สำหรับเชื่อม Sentry/Bugsnag ในอนาคต
 * ตอนนี้ log ลง console + audit log
 */
import { ENV } from '../config/env';
import { logAction } from '../store/auditLogStore';

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export interface ErrorContext {
  screen?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

class ErrorTracker {
  private enabled = ENV.APP_ENV !== 'development';

  /**
   * รายงาน error
   */
  captureError(error: Error, severity: ErrorSeverity = 'error', context?: ErrorContext): void {
    // Always log to console
    const prefix = `[${severity.toUpperCase()}]`;
    if (severity === 'fatal' || severity === 'error') {
      console.error(prefix, error.message, context, error.stack);
    } else {
      console.warn(prefix, error.message, context);
    }

    // Log to audit store
    logAction({
      action: `ERROR_${severity.toUpperCase()}`,
      module: (context?.screen ?? 'app') as any,
      description: `${error.name}: ${error.message}`,
      beforeValue: context?.action,
      afterValue: error.stack?.split('\n').slice(0, 3).join(' | '),
    });

    // TODO: ส่งไป Sentry/Bugsnag เมื่อ enabled
    if (this.enabled) {
      // Sentry.captureException(error, { extra: context });
    }
  }

  /**
   * รายงาน message (ไม่ใช่ exception)
   */
  captureMessage(message: string, severity: ErrorSeverity = 'info', context?: ErrorContext): void {
    if (ENV.LOG_LEVEL === 'debug' || severity !== 'info') {
      console.log(`[${severity.toUpperCase()}]`, message, context);
    }

    if (this.enabled && (severity === 'error' || severity === 'fatal')) {
      // Sentry.captureMessage(message, severity);
    }
  }

  /**
   * Set user context (เรียกตอน login)
   */
  setUser(userId: string, username: string, role: string): void {
    // Sentry.setUser({ id: userId, username, role });
    if (ENV.LOG_LEVEL === 'debug') {
      console.log('[ErrorTracker] User set:', { userId, username, role });
    }
  }

  /**
   * Clear user context (เรียกตอน logout)
   */
  clearUser(): void {
    // Sentry.setUser(null);
  }
}

export const errorTracker = new ErrorTracker();
