/**
 * LINE OA Service — Messaging API
 * 
 * ใช้สำหรับ:
 * - ส่งข้อความหาสมาชิก (text, flex message, rich menu)
 * - ส่งคูปอง/โปรโมชั่น
 * - Broadcast ข่าวสาร
 * - ดึงข้อมูลโปรไฟล์จาก LINE userId
 * 
 * NOTE: LINE API calls ควรผ่าน backend (ไม่ควร expose token ที่ client)
 * Client → Backend → LINE API
 */
import { apiClient, ApiResponse } from '@/shared/infrastructure/api/client';

// ─── Types ───────────────────────────────────────────────────────────────────

export type LineMessageType = 'text' | 'flex' | 'image' | 'template';

export interface LineTextMessage {
  type: 'text';
  text: string;
}

export interface LineFlexMessage {
  type: 'flex';
  altText: string;
  contents: Record<string, any>; // Flex Message JSON
}

export interface LineImageMessage {
  type: 'image';
  originalContentUrl: string;
  previewImageUrl: string;
}

export type LineMessage = LineTextMessage | LineFlexMessage | LineImageMessage;

export interface SendMessageRequest {
  to: string;           // LINE userId ของสมาชิก
  messages: LineMessage[];
}

export interface BroadcastRequest {
  messages: LineMessage[];
  targetAudience?: {
    segmentId?: string;       // ส่งเฉพาะกลุ่ม
    memberLevel?: string;     // ส่งเฉพาะระดับ
    memberIds?: string[];     // ส่งเฉพาะ ID list
  };
}

export interface SendCouponRequest {
  memberId: string;
  couponCode: string;
  couponName: string;
  discount: string;          // เช่น "ลด 20%" หรือ "ลด 50 บาท"
  expiryDate: string;
  imageUrl?: string;
}

export interface LineProfileDTO {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface RichMenuDTO {
  richMenuId: string;
  name: string;
  size: { width: number; height: number };
  areas: { bounds: any; action: any }[];
}

export interface LineDeliveryResult {
  messageId: string;
  status: 'sent' | 'failed';
  sentAt: string;
  errorMessage?: string;
}

export interface LineLinkRequest {
  memberId: string;     // member ID ในระบบ
  lineUserId: string;   // LINE userId ที่ได้จาก LIFF/webhook
}

// ─── Flex Message Templates ──────────────────────────────────────────────────

/**
 * สร้าง Flex Message สำหรับคูปอง
 */
export function buildCouponFlexMessage(params: {
  shopName: string;
  couponCode: string;
  discount: string;
  description?: string;
  expiryDate: string;
}): LineFlexMessage {
  return {
    type: 'flex',
    altText: `🎫 คูปอง ${params.discount} จาก ${params.shopName}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '🎫 คูปองส่วนลด', weight: 'bold', size: 'md', color: '#f87171' },
          { type: 'text', text: params.shopName, size: 'xs', color: '#a3a3a3' },
        ],
        paddingAll: '16px',
        backgroundColor: '#fef2f2',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: params.discount, weight: 'bold', size: 'xxl', color: '#f87171', align: 'center' },
          { type: 'text', text: params.description || 'ใช้ได้ทุกรายการ', size: 'sm', color: '#78716c', align: 'center', margin: 'md' },
          { type: 'separator', margin: 'lg' },
          {
            type: 'box', layout: 'horizontal', margin: 'lg', contents: [
              { type: 'text', text: 'รหัส:', size: 'sm', color: '#a3a3a3', flex: 1 },
              { type: 'text', text: params.couponCode, size: 'sm', weight: 'bold', color: '#27272a', flex: 2 },
            ],
          },
          {
            type: 'box', layout: 'horizontal', margin: 'sm', contents: [
              { type: 'text', text: 'หมดอายุ:', size: 'sm', color: '#a3a3a3', flex: 1 },
              { type: 'text', text: params.expiryDate, size: 'sm', color: '#f87171', flex: 2 },
            ],
          },
        ],
        paddingAll: '16px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#f87171',
            action: { type: 'message', label: 'ใช้คูปอง', text: `ใช้คูปอง ${params.couponCode}` },
          },
        ],
        paddingAll: '12px',
      },
    },
  };
}

/**
 * สร้าง Flex Message สำหรับแจ้งคะแนน
 */
export function buildPointNotifyFlexMessage(params: {
  shopName: string;
  memberName: string;
  pointsEarned: number;
  totalPoints: number;
  level: string;
}): LineFlexMessage {
  return {
    type: 'flex',
    altText: `⭐ ได้รับ ${params.pointsEarned} คะแนนจาก ${params.shopName}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: `⭐ +${params.pointsEarned} คะแนน`, weight: 'bold', size: 'lg', color: '#f59e0b' },
          { type: 'text', text: `สวัสดีคุณ ${params.memberName}`, size: 'sm', color: '#78716c', margin: 'sm' },
          { type: 'separator', margin: 'lg' },
          {
            type: 'box', layout: 'horizontal', margin: 'lg', contents: [
              { type: 'text', text: 'คะแนนรวม:', size: 'sm', color: '#a3a3a3' },
              { type: 'text', text: `${params.totalPoints.toLocaleString()} pts`, size: 'sm', weight: 'bold', align: 'end' },
            ],
          },
          {
            type: 'box', layout: 'horizontal', margin: 'sm', contents: [
              { type: 'text', text: 'ระดับ:', size: 'sm', color: '#a3a3a3' },
              { type: 'text', text: params.level, size: 'sm', weight: 'bold', align: 'end', color: '#f59e0b' },
            ],
          },
        ],
        paddingAll: '16px',
      },
    },
  };
}

// ─── API Methods (ผ่าน Backend) ──────────────────────────────────────────────

export const lineApi = {
  /**
   * ส่งข้อความหาสมาชิกคนเดียว (push message)
   */
  sendMessage: async (data: SendMessageRequest): Promise<ApiResponse<LineDeliveryResult>> => {
    const res = await apiClient.post<ApiResponse<LineDeliveryResult>>('/line/send', data);
    return res.data;
  },

  /**
   * Broadcast ข้อความหาทุกคน / กลุ่มเป้าหมาย
   */
  broadcast: async (data: BroadcastRequest): Promise<ApiResponse<{ messageId: string; targetCount: number }>> => {
    const res = await apiClient.post<ApiResponse<any>>('/line/broadcast', data);
    return res.data;
  },

  /**
   * ส่งคูปองให้สมาชิกผ่าน LINE (สร้าง flex message อัตโนมัติ)
   */
  sendCoupon: async (data: SendCouponRequest): Promise<ApiResponse<LineDeliveryResult>> => {
    const res = await apiClient.post<ApiResponse<LineDeliveryResult>>('/line/send-coupon', data);
    return res.data;
  },

  /**
   * ดึงโปรไฟล์ LINE ของสมาชิก
   */
  getProfile: async (lineUserId: string): Promise<ApiResponse<LineProfileDTO>> => {
    const res = await apiClient.get<ApiResponse<LineProfileDTO>>(`/line/profile/${lineUserId}`);
    return res.data;
  },

  /**
   * ลิงก์ LINE userId กับสมาชิกในระบบ
   * (เรียกหลังจาก LIFF login สำเร็จ)
   */
  linkMember: async (data: LineLinkRequest): Promise<ApiResponse<{ linked: boolean }>> => {
    const res = await apiClient.post<ApiResponse<{ linked: boolean }>>('/line/link-member', data);
    return res.data;
  },

  /**
   * ดึง Rich Menu ที่ตั้งค่าไว้
   */
  getRichMenus: async (): Promise<ApiResponse<RichMenuDTO[]>> => {
    const res = await apiClient.get<ApiResponse<RichMenuDTO[]>>('/line/rich-menus');
    return res.data;
  },

  /**
   * ส่งแจ้งเตือนคะแนนหลังซื้อ
   */
  notifyPointsEarned: async (memberId: string, data: {
    pointsEarned: number;
    totalPoints: number;
    level: string;
    saleId: string;
  }): Promise<ApiResponse<LineDeliveryResult>> => {
    const res = await apiClient.post<ApiResponse<LineDeliveryResult>>(`/line/notify-points/${memberId}`, data);
    return res.data;
  },

  /**
   * ดึงจำนวน followers / สถิติ
   */
  getStats: async (): Promise<ApiResponse<{
    followers: number;
    targetReach: number;
    messagesUsed: number;
    messagesLimit: number;
  }>> => {
    const res = await apiClient.get<ApiResponse<any>>('/line/stats');
    return res.data;
  },
};
