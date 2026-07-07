/**
 * Payment Gateway API — PromptPay QR, Credit Card, E-Wallet
 * 
 * Flow:
 * 1. POS สร้าง payment request → ได้ QR/redirect URL
 * 2. ลูกค้าชำระ
 * 3. POS poll/webhook รับ status → ปิดบิล
 * 
 * รองรับ:
 * - PromptPay QR (BOT standard)
 * - Credit/Debit card (ผ่าน 2C2P / Omise / Stripe)
 * - E-Wallet (TrueMoney, Rabbit LINE Pay, ShopeePay)
 */
import { apiClient, ApiResponse } from '@/shared/infrastructure/api/client';
import { ENV } from '@/shared/config/env';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PaymentMethod = 'promptpay' | 'credit_card' | 'ewallet_truemoney' | 'ewallet_linepay' | 'ewallet_shopeepay' | 'bank_transfer';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'refunded';

export interface CreatePaymentRequest {
  orderId: string;        // billNo จาก POS
  amount: number;         // จำนวนเงิน (บาท)
  method: PaymentMethod;
  description?: string;   // รายละเอียดบิล
  customerId?: string;    // member ID (ถ้ามี)
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  qrCodeData?: string;      // PromptPay: payload สำหรับสร้าง QR image
  qrCodeImage?: string;     // Base64 QR image (ถ้า backend generate ให้)
  redirectUrl?: string;     // Credit card / E-Wallet redirect
  expiresAt: string;        // QR/link หมดอายุเมื่อไหร่
  paidAt?: string;
  ref?: string;             // transaction reference
}

export interface PaymentStatusResponse {
  paymentId: string;
  status: PaymentStatus;
  paidAt?: string;
  ref?: string;
  amount: number;
  fee?: number;            // ค่าธรรมเนียม
  netAmount?: number;      // ยอดสุทธิ
}

export interface RefundRequest {
  paymentId: string;
  amount: number;          // refund amount (partial/full)
  reason: string;
}

export interface RefundResponse {
  refundId: string;
  paymentId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  refundedAt?: string;
}

// ─── PromptPay QR Generation (Offline — ไม่ต้องเชื่อม server) ────────────────
// EMVCo standard payload สำหรับ PromptPay
// ใช้สร้าง QR ได้โดยไม่ต้อง API call (เหมาะสำหรับ offline mode)

function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * สร้าง PromptPay QR payload (EMVCo format)
 * ใช้ได้ offline — ไม่ต้อง API call
 * @param promptPayId - เบอร์โทร (10 หลัก) หรือ เลข National ID (13 หลัก)
 * @param amount - จำนวนเงิน (0 = ไม่กำหนดจำนวน)
 */
export function generatePromptPayQR(promptPayId: string, amount: number = 0): string {
  const cleanId = promptPayId.replace(/[-\s]/g, '');
  const isPhone = cleanId.length <= 10;

  // AID for PromptPay
  const aid = '0000000000000000'; // A000000677010111 simplified
  const merchantId = isPhone
    ? `0066${cleanId.slice(1)}` // phone: add country code 66, remove leading 0
    : cleanId;

  const merchantIdType = isPhone ? '01' : '02'; // 01=phone, 02=national ID

  // Build sub-TLV for merchant account info (tag 29)
  const merchantSubTlv =
    tlv('00', 'A000000677010111') +  // AID
    tlv(merchantIdType, merchantId);

  let payload =
    tlv('00', '01') +                      // Payload format indicator
    tlv('01', amount > 0 ? '12' : '11') +  // 11=static, 12=dynamic
    tlv('29', merchantSubTlv) +            // Merchant account
    tlv('53', '764') +                     // Currency THB
    tlv('58', 'TH') +                     // Country
    (amount > 0 ? tlv('54', amount.toFixed(2)) : '');  // Amount

  // Add CRC placeholder then calculate
  payload += '6304';
  const checksum = crc16(payload);
  payload = payload.slice(0, -4) + `6304${checksum}`;

  return payload;
}

// ─── API Methods ─────────────────────────────────────────────────────────────

export const paymentApi = {
  /**
   * สร้าง QR / payment link
   * Backend จะสร้าง transaction record + return QR data
   */
  create: async (data: CreatePaymentRequest): Promise<ApiResponse<PaymentResponse>> => {
    const res = await apiClient.post<ApiResponse<PaymentResponse>>('/payment/create', data);
    return res.data;
  },

  /**
   * เช็คสถานะ payment (polling)
   * POS เรียกทุก 3 วินาทีจนกว่าจะ completed/failed/expired
   */
  checkStatus: async (paymentId: string): Promise<ApiResponse<PaymentStatusResponse>> => {
    const res = await apiClient.get<ApiResponse<PaymentStatusResponse>>(`/payment/${paymentId}/status`);
    return res.data;
  },

  /**
   * ยืนยัน payment สำเร็จ (สำหรับ manual confirm เช่น เงินสด/โอน)
   */
  confirm: async (paymentId: string, ref?: string): Promise<ApiResponse<PaymentStatusResponse>> => {
    const res = await apiClient.post<ApiResponse<PaymentStatusResponse>>(`/payment/${paymentId}/confirm`, { ref });
    return res.data;
  },

  /**
   * Refund / คืนเงิน
   */
  refund: async (data: RefundRequest): Promise<ApiResponse<RefundResponse>> => {
    const res = await apiClient.post<ApiResponse<RefundResponse>>('/payment/refund', data);
    return res.data;
  },

  /**
   * ดึง payment history (สำหรับ reconcile)
   */
  getHistory: async (params: {
    dateFrom: string;
    dateTo: string;
    status?: PaymentStatus;
  }): Promise<ApiResponse<PaymentResponse[]>> => {
    const res = await apiClient.get<ApiResponse<PaymentResponse[]>>('/payment/history', { params });
    return res.data;
  },

  // ─── Offline PromptPay ─────────────────────────────────────────────────────
  /**
   * สร้าง PromptPay QR offline (ไม่ต้อง API)
   * ใช้ library QR code generator แสดงผลจาก payload นี้
   */
  generateOfflineQR: (amount: number): string => {
    return generatePromptPayQR(ENV.PROMPTPAY_ID, amount);
  },
};
