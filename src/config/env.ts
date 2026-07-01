/**
 * Environment Configuration
 * ค่า default ชี้ไป localhost สำหรับ development
 * Production ให้ set ผ่าน app.json > extra หรือ EAS environment variables
 */
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const ENV = {
  // ─── API Backend ──────────────────────────────────────────────────────────
  API_BASE_URL: (extra.API_BASE_URL as string) || 'http://localhost:3000/api/v1',
  API_TIMEOUT: 15000,

  // ─── Payment Gateway (PromptPay / 2C2P / etc.) ────────────────────────────
  PAYMENT_API_URL: (extra.PAYMENT_API_URL as string) || 'http://localhost:3000/api/v1/payment',
  PAYMENT_MERCHANT_ID: (extra.PAYMENT_MERCHANT_ID as string) || 'MERCHANT_DEV_001',
  PROMPTPAY_ID: (extra.PROMPTPAY_ID as string) || '0812345678', // เบอร์โทร/เลข PromptPay

  // ─── LINE OA ──────────────────────────────────────────────────────────────
  LINE_CHANNEL_ACCESS_TOKEN: (extra.LINE_CHANNEL_ACCESS_TOKEN as string) || '',
  LINE_CHANNEL_SECRET: (extra.LINE_CHANNEL_SECRET as string) || '',
  LINE_LIFF_ID: (extra.LINE_LIFF_ID as string) || '',
  LINE_API_URL: 'https://api.line.me/v2/bot',

  // ─── App Config ───────────────────────────────────────────────────────────
  APP_ENV: (extra.APP_ENV as string) || 'development', // development | staging | production
  ENABLE_MOCK: (extra.ENABLE_MOCK as string) !== 'false', // true by default (dev uses mock)
  LOG_LEVEL: (extra.LOG_LEVEL as string) || 'debug',
} as const;

export type AppEnv = 'development' | 'staging' | 'production';
