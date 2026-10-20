/**
 * Communication Store — Zustand
 * จัดการ LINE OA Contacts, Broadcast, SMS, Push Notification
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  LineOAContact,
  MessageTemplate,
  BroadcastMessage,
  SendLog,
  LineOAConfig,
  SMSConfig,
  CommDashboardStats,
  CommChannel,
  SendStatus,
  TargetAudience,
  LineMessageType,
} from '../types/communication';
import { persistStorage } from './persistStorage';
import { FEATURE_FLAGS } from '../config/featureFlags';
// import { lineApi } from '../services/api/lineApi'; // ใช้เมื่อ MOCK_LINE = false (ต่อ LINE Messaging API จริง)
import {
  MOCK_LINE_CONTACTS,
  MOCK_MESSAGE_TEMPLATES,
  MOCK_BROADCASTS,
  MOCK_SEND_LOGS,
  MOCK_LINE_OA_CONFIG,
  MOCK_SMS_CONFIG,
  MOCK_COMM_STATS,
} from '../data/mockCommunication';

// ─── Helper ───────────────────────────────────────────────────────────────────
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ─── Store Interface ──────────────────────────────────────────────────────────
interface CommunicationStore {
  // State
  contacts: LineOAContact[];
  templates: MessageTemplate[];
  broadcasts: BroadcastMessage[];
  sendLogs: SendLog[];
  lineConfig: LineOAConfig;
  smsConfig: SMSConfig;
  stats: CommDashboardStats;

  // ── Contact Actions ─────────────────────────────────────────────────────────
  searchContacts: (keyword: string) => LineOAContact[];
  getContactsByTag: (tag: string) => LineOAContact[];
  getLinkedContacts: () => LineOAContact[];
  linkContactToMember: (contactId: string, memberId: string) => void;
  unlinkContact: (contactId: string) => void;
  addTagToContact: (contactId: string, tag: string) => void;
  removeTagFromContact: (contactId: string, tag: string) => void;

  // ── Template Actions ────────────────────────────────────────────────────────
  getTemplatesByChannel: (channel: CommChannel) => MessageTemplate[];
  createTemplate: (data: Omit<MessageTemplate, 'id' | 'createdAt'>) => MessageTemplate;
  updateTemplate: (id: string, data: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // ── Broadcast Actions ───────────────────────────────────────────────────────
  getBroadcastsByChannel: (channel: CommChannel) => BroadcastMessage[];
  getBroadcastsByStatus: (status: SendStatus) => BroadcastMessage[];
  createBroadcast: (data: {
    name: string;
    channel: CommChannel;
    content: string;
    lineMessageType?: LineMessageType;
    imageUrl?: string;
    attachedCouponId?: string;
    attachedCouponName?: string;
    target: TargetAudience;
    scheduledAt?: string;
  }) => BroadcastMessage;
  sendBroadcast: (broadcastId: string) => void;
  cancelBroadcast: (broadcastId: string) => void;
  deleteBroadcast: (broadcastId: string) => void;

  // ── Single Push (2A/2D) ─────────────────────────────────────────────────────
  /** ส่งข้อความเดี่ยว (push) หา contact 1 คน — บันทึกลง outbox (sendLogs) */
  sendSingleMessage: (data: {
    contactId: string;
    channel: CommChannel;
    content: string;
    lineMessageType?: LineMessageType;
  }) => SendLog;

  // ── Outbox / Log ────────────────────────────────────────────────────────────
  /** กล่องส่งออก: log การส่งทั้งหมด เรียงใหม่→เก่า */
  getOutbox: () => SendLog[];

  // ── Stats ───────────────────────────────────────────────────────────────────
  refreshStats: () => void;

  // ── Send Coupon via Campaign ────────────────────────────────────────────────
  sendCouponCampaign: (data: {
    name: string;
    channel: CommChannel;
    couponId: string;
    couponName: string;
    couponCode: string;
    message: string;
    target: TargetAudience;
  }) => BroadcastMessage;
}

// ─── Store Implementation ─────────────────────────────────────────────────────
export const useCommunicationStore = create<CommunicationStore>()(
  persist(
    (set, get) => ({
  contacts: MOCK_LINE_CONTACTS,
  templates: MOCK_MESSAGE_TEMPLATES,
  broadcasts: MOCK_BROADCASTS,
  sendLogs: MOCK_SEND_LOGS,
  lineConfig: MOCK_LINE_OA_CONFIG,
  smsConfig: MOCK_SMS_CONFIG,
  stats: MOCK_COMM_STATS,

  // ── Contact Actions ─────────────────────────────────────────────────────────

  searchContacts: (keyword) => {
    const k = keyword.toLowerCase().trim();
    if (!k) return get().contacts.filter(c => c.status === 'friend');
    return get().contacts.filter(c =>
      c.status === 'friend' && (
        c.displayName.toLowerCase().includes(k) ||
        c.phone?.includes(k) ||
        c.lineUserId.toLowerCase().includes(k) ||
        c.tags.some(t => t.toLowerCase().includes(k))
      )
    );
  },

  getContactsByTag: (tag) => {
    return get().contacts.filter(c =>
      c.status === 'friend' && c.tags.includes(tag)
    );
  },

  getLinkedContacts: () => {
    return get().contacts.filter(c => c.linkedMemberId && c.status === 'friend');
  },

  linkContactToMember: (contactId, memberId) => {
    set(s => ({
      contacts: s.contacts.map(c =>
        c.id === contactId ? { ...c, linkedMemberId: memberId } : c
      ),
    }));
  },

  unlinkContact: (contactId) => {
    set(s => ({
      contacts: s.contacts.map(c =>
        c.id === contactId ? { ...c, linkedMemberId: undefined } : c
      ),
    }));
  },

  addTagToContact: (contactId, tag) => {
    set(s => ({
      contacts: s.contacts.map(c =>
        c.id === contactId && !c.tags.includes(tag)
          ? { ...c, tags: [...c.tags, tag] }
          : c
      ),
    }));
  },

  removeTagFromContact: (contactId, tag) => {
    set(s => ({
      contacts: s.contacts.map(c =>
        c.id === contactId
          ? { ...c, tags: c.tags.filter(t => t !== tag) }
          : c
      ),
    }));
  },

  // ── Template Actions ────────────────────────────────────────────────────────

  getTemplatesByChannel: (channel) => {
    return get().templates.filter(t => t.channel === channel);
  },

  createTemplate: (data) => {
    const newTemplate: MessageTemplate = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    set(s => ({ templates: [...s.templates, newTemplate] }));
    return newTemplate;
  },

  updateTemplate: (id, data) => {
    set(s => ({
      templates: s.templates.map(t => t.id === id ? { ...t, ...data } : t),
    }));
  },

  deleteTemplate: (id) => {
    set(s => ({ templates: s.templates.filter(t => t.id !== id) }));
  },

  // ── Broadcast Actions ───────────────────────────────────────────────────────

  getBroadcastsByChannel: (channel) => {
    return get().broadcasts.filter(b => b.channel === channel);
  },

  getBroadcastsByStatus: (status) => {
    return get().broadcasts.filter(b => b.status === status);
  },

  createBroadcast: (data) => {
    const { contacts } = get();
    // คำนวณ targetCount จากกลุ่มเป้าหมาย
    let targetCount = 0;
    const activeContacts = contacts.filter(c => c.status === 'friend');

    switch (data.target.type) {
      case 'all':
        targetCount = activeContacts.length;
        break;
      case 'tag':
        targetCount = activeContacts.filter(c =>
          c.tags.some(t => data.target.type === 'tag' && (data.target as any).tags.includes(t))
        ).length;
        break;
      case 'manual':
        targetCount = (data.target as any).contactIds?.length ?? 0;
        break;
      default:
        targetCount = activeContacts.length;
    }

    const newBroadcast: BroadcastMessage = {
      id: genId(),
      name: data.name,
      channel: data.channel,
      lineMessageType: data.lineMessageType,
      content: data.content,
      imageUrl: data.imageUrl,
      attachedCouponId: data.attachedCouponId,
      attachedCouponName: data.attachedCouponName,
      target: data.target,
      status: data.scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: data.scheduledAt,
      targetCount,
      sentCount: 0,
      openCount: 0,
      clickCount: 0,
      couponUsedCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
    };
    set(s => ({ broadcasts: [newBroadcast, ...s.broadcasts] }));
    return newBroadcast;
  },

  sendBroadcast: (broadcastId) => {
    const target = get().broadcasts.find(b => b.id === broadcastId);
    // MOCK: ส่ง broadcast แบบ in-app — จำลองสถิติ + บันทึก outbox 1 รายการต่อ campaign
    // เมื่อปิด mock: else จะเรียก lineApi.broadcast(...) ผ่าน backend แทน
    const outboxEntry: SendLog | null = target && FEATURE_FLAGS.MOCK_LINE
      ? {
          id: genId(),
          broadcastId: target.id,
          contactId: '',
          channel: target.channel,
          status: 'sent',
          sentAt: new Date().toISOString(),
        }
      : null;

    set(s => ({
      broadcasts: s.broadcasts.map(b => {
        if (b.id !== broadcastId) return b;
        // simulate sending
        const sentCount = Math.floor(b.targetCount * 0.97);
        const openCount = Math.floor(sentCount * 0.72);
        const clickCount = Math.floor(openCount * 0.25);
        return {
          ...b,
          status: 'sent' as const,
          sentAt: new Date().toISOString(),
          sentCount,
          openCount,
          clickCount,
        };
      }),
      sendLogs: outboxEntry ? [outboxEntry, ...s.sendLogs] : s.sendLogs,
      // อัพเดท LINE quota
      lineConfig: {
        ...s.lineConfig,
        broadcastUsed: s.lineConfig.broadcastUsed + 1,
      },
      stats: {
        ...s.stats,
        broadcastThisMonth: s.stats.broadcastThisMonth + 1,
        broadcastQuotaLeft: s.stats.broadcastQuotaLeft - 1,
      },
    }));
  },

  cancelBroadcast: (broadcastId) => {
    set(s => ({
      broadcasts: s.broadcasts.map(b =>
        b.id === broadcastId ? { ...b, status: 'cancelled' as const } : b
      ),
    }));
  },

  deleteBroadcast: (broadcastId) => {
    set(s => ({
      broadcasts: s.broadcasts.filter(b => b.id !== broadcastId),
    }));
  },

  // ── Single Push (2A/2D) ─────────────────────────────────────────────────────

  sendSingleMessage: (data) => {
    const log: SendLog = {
      id: genId(),
      broadcastId: '',          // ส่งเดี่ยว ไม่ผูกกับ broadcast
      contactId: data.contactId,
      channel: data.channel,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };

    if (FEATURE_FLAGS.MOCK_LINE) {
      // MOCK: ส่งแบบ in-app เท่านั้น — บันทึกลง outbox + จำลองสถานะ "sent"
      set(s => ({ sendLogs: [log, ...s.sendLogs] }));
    } else {
      // เมื่อปิด mock: ต่อ LINE Messaging API จริงผ่าน backend
      // const contact = get().contacts.find(c => c.id === data.contactId);
      // if (contact) lineApi.sendMessage({ to: contact.lineUserId, messages: [{ type: 'text', text: data.content }] });
      set(s => ({ sendLogs: [log, ...s.sendLogs] }));
    }
    return log;
  },

  // ── Outbox / Log ────────────────────────────────────────────────────────────

  getOutbox: () => {
    return [...get().sendLogs].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
  },

  // ── Stats ───────────────────────────────────────────────────────────────────

  refreshStats: () => {
    const { contacts, broadcasts, lineConfig, smsConfig } = get();
    const friends = contacts.filter(c => c.status === 'friend');
    const sentBroadcasts = broadcasts.filter(b => b.status === 'sent');
    const totalOpen = sentBroadcasts.reduce((s, b) => s + b.openCount, 0);
    const totalSent = sentBroadcasts.reduce((s, b) => s + b.sentCount, 0);
    const totalClick = sentBroadcasts.reduce((s, b) => s + b.clickCount, 0);

    set({
      stats: {
        totalLineFriends: contacts.length,
        activeLineFriends: friends.length,
        broadcastThisMonth: broadcasts.filter(b => {
          if (!b.sentAt) return false;
          const d = new Date(b.sentAt);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length,
        broadcastQuotaLeft: lineConfig.broadcastQuota - lineConfig.broadcastUsed,
        smsCredits: smsConfig.creditBalance,
        avgOpenRate: totalSent > 0 ? Math.round((totalOpen / totalSent) * 1000) / 10 : 0,
        avgClickRate: totalOpen > 0 ? Math.round((totalClick / totalOpen) * 1000) / 10 : 0,
        couponsSentThisMonth: broadcasts
          .filter(b => b.attachedCouponId && b.status === 'sent')
          .reduce((s, b) => s + b.sentCount, 0),
      },
    });
  },

  // ── Send Coupon via Campaign ────────────────────────────────────────────────

  sendCouponCampaign: (data) => {
    const { contacts } = get();
    const activeContacts = contacts.filter(c => c.status === 'friend');

    let targetCount = 0;
    switch (data.target.type) {
      case 'all':
        targetCount = activeContacts.length;
        break;
      case 'level':
        // ใช้ linked members ที่มี level ตรง
        targetCount = Math.min(activeContacts.length, 200);
        break;
      case 'tag':
        targetCount = activeContacts.filter(c =>
          c.tags.some(t => (data.target as any).tags?.includes(t))
        ).length;
        break;
      case 'manual':
        targetCount = (data.target as any).contactIds?.length ?? 0;
        break;
      default:
        targetCount = activeContacts.length;
    }

    const broadcast: BroadcastMessage = {
      id: genId(),
      name: data.name,
      channel: data.channel,
      lineMessageType: 'coupon',
      content: data.message,
      attachedCouponId: data.couponId,
      attachedCouponName: data.couponName,
      target: data.target,
      status: 'sent',
      sentAt: new Date().toISOString(),
      targetCount,
      sentCount: Math.floor(targetCount * 0.97),
      openCount: Math.floor(targetCount * 0.7),
      clickCount: Math.floor(targetCount * 0.2),
      couponUsedCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
    };

    // MOCK: ส่งคูปองแบบ in-app — บันทึก outbox 1 รายการต่อแคมเปญ
    // เมื่อปิด mock: else จะเรียก lineApi.sendCoupon(...) ผ่าน backend แทน
    const outboxEntry: SendLog | null = FEATURE_FLAGS.MOCK_LINE
      ? {
          id: genId(),
          broadcastId: broadcast.id,
          contactId: '',
          channel: data.channel,
          status: 'sent',
          sentAt: new Date().toISOString(),
        }
      : null;

    set(s => ({
      broadcasts: [broadcast, ...s.broadcasts],
      sendLogs: outboxEntry ? [outboxEntry, ...s.sendLogs] : s.sendLogs,
      lineConfig: data.channel === 'line'
        ? { ...s.lineConfig, broadcastUsed: s.lineConfig.broadcastUsed + 1 }
        : s.lineConfig,
      stats: {
        ...s.stats,
        broadcastThisMonth: s.stats.broadcastThisMonth + 1,
        broadcastQuotaLeft: data.channel === 'line'
          ? s.stats.broadcastQuotaLeft - 1
          : s.stats.broadcastQuotaLeft,
        couponsSentThisMonth: s.stats.couponsSentThisMonth + broadcast.sentCount,
      },
    }));

    return broadcast;
  },
    }),
    { name: 'pos-communication', storage: createJSONStorage(() => persistStorage) }
  )
);
