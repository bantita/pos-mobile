/**
 * Notification Service — Phase 2
 * Push + Local notifications
 * เตรียม interface สำหรับ expo-notifications (ยังไม่ add dependency)
 */
import { Platform } from 'react-native';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
}

export type NotificationType =
  | 'low_stock'
  | 'shift_reminder'
  | 'sync_failed'
  | 'points_expiring'
  | 'promotion_start'
  | 'new_member'
  | 'daily_summary';

class NotificationService {
  private pushToken: string | null = null;

  /**
   * ขอ permission และ register push token
   */
  async register(): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Web push ยังไม่ implement
      return null;
    }

    try {
      // TODO: เพิ่ม expo-notifications dependency
      // const { status } = await Notifications.requestPermissionsAsync();
      // if (status !== 'granted') return null;
      // const tokenData = await Notifications.getExpoPushTokenAsync();
      // this.pushToken = tokenData.data;
      // return this.pushToken;
      console.log('[Notifications] Register placeholder — add expo-notifications');
      return null;
    } catch (error) {
      console.warn('[Notifications] Registration failed:', error);
      return null;
    }
  }

  /**
   * แสดง local notification
   */
  async showLocal(payload: NotificationPayload): Promise<void> {
    if (Platform.OS === 'web') {
      // Use browser Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.title, { body: payload.body });
      }
      return;
    }

    // TODO: Notifications.scheduleNotificationAsync({ content: payload, trigger: null });
    console.log('[Notifications] Local:', payload.title, payload.body);
  }

  /**
   * ตั้ง scheduled notification (เช่น แจ้งเตือนแต้มใกล้หมดอายุ)
   */
  async scheduleLocal(payload: NotificationPayload, triggerDate: Date): Promise<string | null> {
    // TODO: Notifications.scheduleNotificationAsync({ content: payload, trigger: { date: triggerDate } });
    console.log('[Notifications] Scheduled:', payload.title, 'at', triggerDate);
    return null;
  }

  /**
   * ยกเลิก notification ที่ตั้งไว้
   */
  async cancel(notificationId: string): Promise<void> {
    // TODO: Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * ยกเลิกทั้งหมด
   */
  async cancelAll(): Promise<void> {
    // TODO: Notifications.cancelAllScheduledNotificationsAsync();
  }

  getPushToken(): string | null {
    return this.pushToken;
  }
}

export const notifications = new NotificationService();
