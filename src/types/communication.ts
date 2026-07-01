// Types สำหรับ Communication Features — LINE Broadcast, SMS, Push Notification

/** ช่องทางการส่ง */
export type CommChannel = 'line' | 'sms' | 'push' | 'email';

/** สถานะการส่ง */
export type SendStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';

/** ประเภทข้อความ LINE */
export type LineMessageType = 'text' | 'image' | 'rich_message' | 'card' | 'coupon' | 'flex';

/** สถานะ LINE OA Contact */
export type LineContactStatus = 'friend' | 'blocked' | 'unfollowed';

// ─── LINE OA Contact ──────────────────────────────────────────────────────────

/** ผู้ติดต่อจาก LINE Official Account */
export interface LineOAContact {
  id: string;
  /** LINE User ID */
  lineUserId: string;
  /** ชื่อแสดง LINE */
  displayName: string;
  /** รูปโปรไฟล์ */
  pictureUrl?: string;
  /** สถานะเพื่อน */
  status: LineContactStatus;
  /** เบอร์โทร (ถ้ามี จาก OA form หรือ mapping กับสมาชิก) */
  phone?: string;
  /** รหัสสมาชิกที่ผูก (link กับ Member ในระบบ) */
  linkedMemberId?: string;
  /** วันที่เพิ่มเพื่อน */
  followedAt: string;
  /** วันที่ interaction ล่าสุด */
  lastInteractionAt?: string;
  /** Tags */
  tags: string[];
}

// ─── Message Template ─────────────────────────────────────────────────────────

/** Template ข้อความที่ใช้ซ้ำได้ */
export interface MessageTemplate {
  id: string;
  /** ชื่อ Template */
  name: string;
  /** ช่องทาง */
  channel: CommChannel;
  /** ประเภทข้อความ (LINE) */
  lineMessageType?: LineMessageType;
  /** เนื้อหาข้อความ (รองรับ variables เช่น {{name}}, {{points}}) */
  content: string;
  /** รูปภาพประกอบ (URL) */
  imageUrl?: string;
  /** Flex Message JSON (สำหรับ LINE Flex) */
  flexJson?: string;
  /** คูปองที่แนบ (promotionId) */
  attachedCouponId?: string;
  /** วันที่สร้าง */
  createdAt: string;
  /** ผู้สร้าง */
  createdBy: string;
}

// ─── Broadcast / Campaign ─────────────────────────────────────────────────────

/** กลุ่มเป้าหมาย */
export type TargetAudience =
  | { type: 'all' }
  | { type: 'segment'; segmentId: string; segmentName: string }
  | { type: 'level'; levels: string[] }
  | { type: 'tag'; tags: string[] }
  | { type: 'manual'; contactIds: string[] };

/** Broadcast Message (LINE, SMS, Push) */
export interface BroadcastMessage {
  id: string;
  /** ชื่อ Campaign */
  name: string;
  /** ช่องทาง */
  channel: CommChannel;
  /** ประเภทข้อความ (LINE) */
  lineMessageType?: LineMessageType;
  /** เนื้อหาข้อความ */
  content: string;
  /** รูปภาพ (URL) */
  imageUrl?: string;
  /** Flex Message JSON */
  flexJson?: string;
  /** คูปองที่แนบส่ง (promotionId) */
  attachedCouponId?: string;
  /** ชื่อโปรโมชั่นที่แนบ */
  attachedCouponName?: string;
  /** กลุ่มเป้าหมาย */
  target: TargetAudience;
  /** สถานะ */
  status: SendStatus;
  /** กำหนดส่ง (ISO datetime) */
  scheduledAt?: string;
  /** วันที่ส่งจริง */
  sentAt?: string;
  /** จำนวนเป้าหมาย */
  targetCount: number;
  /** จำนวนส่งสำเร็จ */
  sentCount: number;
  /** จำนวนเปิดอ่าน */
  openCount: number;
  /** จำนวนคลิก */
  clickCount: number;
  /** จำนวนคูปองที่ถูกใช้ */
  couponUsedCount: number;
  /** วันที่สร้าง */
  createdAt: string;
  /** ผู้สร้าง */
  createdBy: string;
}

// ─── Send Log ─────────────────────────────────────────────────────────────────

/** ประวัติส่งข้อความรายบุคคล */
export interface SendLog {
  id: string;
  /** รหัส Broadcast */
  broadcastId: string;
  /** รหัสผู้ติดต่อ */
  contactId: string;
  /** ช่องทาง */
  channel: CommChannel;
  /** สถานะ */
  status: 'sent' | 'delivered' | 'read' | 'failed';
  /** Error message (กรณี failed) */
  errorMessage?: string;
  /** วันที่ส่ง */
  sentAt: string;
  /** วันที่อ่าน */
  readAt?: string;
}

// ─── Push Notification ────────────────────────────────────────────────────────

/** Push Notification Config */
export interface PushConfig {
  /** เปิดใช้งาน Push */
  enabled: boolean;
  /** FCM Server Key */
  fcmServerKey?: string;
  /** APN Certificate */
  apnsCert?: string;
}

// ─── LINE OA Config ───────────────────────────────────────────────────────────

/** LINE Official Account Config */
export interface LineOAConfig {
  /** Channel ID */
  channelId: string;
  /** Channel Secret */
  channelSecret: string;
  /** Channel Access Token */
  accessToken: string;
  /** OA Basic ID (เช่น @shopname) */
  basicId: string;
  /** ชื่อ OA */
  oaName: string;
  /** จำนวนเพื่อนทั้งหมด */
  friendCount: number;
  /** จำนวน Broadcast ที่เหลือ/เดือน (Free plan 500/เดือน) */
  broadcastQuota: number;
  /** ใช้ไปแล้วเดือนนี้ */
  broadcastUsed: number;
}

// ─── SMS Config ───────────────────────────────────────────────────────────────

/** SMS Provider Config */
export interface SMSConfig {
  /** ผู้ให้บริการ */
  provider: 'thaibulksms' | 'twilio' | 'custom';
  /** API Key */
  apiKey: string;
  /** Sender Name */
  senderName: string;
  /** เครดิต SMS คงเหลือ */
  creditBalance: number;
  /** ราคาต่อข้อความ (บาท) */
  costPerMessage: number;
}

// ─── Communication Dashboard Stats ───────────────────────────────────────────

export interface CommDashboardStats {
  /** จำนวน LINE Friends ทั้งหมด */
  totalLineFriends: number;
  /** LINE Friends ที่ active */
  activeLineFriends: number;
  /** จำนวน Broadcast ส่งเดือนนี้ */
  broadcastThisMonth: number;
  /** Broadcast Quota ที่เหลือ */
  broadcastQuotaLeft: number;
  /** SMS Credit คงเหลือ */
  smsCredits: number;
  /** Open Rate เฉลี่ย (%) */
  avgOpenRate: number;
  /** Click Rate เฉลี่ย (%) */
  avgClickRate: number;
  /** คูปองที่ส่งออกไปเดือนนี้ */
  couponsSentThisMonth: number;
}
