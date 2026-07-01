/**
 * Audit Log Store — Zustand + Persist
 * บันทึกทุก action สำคัญทั้งระบบ (Offline-ready)
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from './persistStorage';

export interface AuditEntry {
  id: string;
  /** วันที่ */
  timestamp: string;
  /** ใครทำ */
  actor: string;
  /** role */
  role: string;
  /** module ที่ทำ */
  module: string;
  /** action ที่ทำ */
  action: string;
  /** รายละเอียด */
  description: string;
  /** อุปกรณ์ที่ใช้ */
  device: string;
  /** ข้อมูลเพิ่มเติม */
  metadata?: Record<string, any>;
}

interface AuditLogState {
  logs: AuditEntry[];
  addLog: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  getLogs: (filter?: { module?: string; actor?: string; from?: string; to?: string }) => AuditEntry[];
  clearLogs: () => void;
}

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const useAuditLogStore = create<AuditLogState>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (entry) => {
        const newEntry: AuditEntry = {
          ...entry,
          id: genId(),
          timestamp: new Date().toISOString(),
        };
        set(s => ({ logs: [newEntry, ...s.logs].slice(0, 500) })); // เก็บสูงสุด 500 รายการ
      },

      getLogs: (filter) => {
        let result = get().logs;
        if (filter?.module) result = result.filter(l => l.module === filter.module);
        if (filter?.actor) result = result.filter(l => l.actor.includes(filter.actor!));
        if (filter?.from) result = result.filter(l => l.timestamp >= filter.from!);
        if (filter?.to) result = result.filter(l => l.timestamp <= filter.to!);
        return result;
      },

      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'pos-audit-log',
      storage: createJSONStorage(() => persistStorage),
    }
  )
);

// ─── Helper: log action (ใช้เรียกจากทุกที่) ─────────────────────────────────
function detectDevice(): string {
  if (typeof navigator === 'undefined') return 'Server';
  const ua = navigator.userAgent || '';
  if (ua.includes('Chrome') && ua.includes('Windows')) return 'Chrome on Windows';
  if (ua.includes('Chrome') && ua.includes('Mac')) return 'Chrome on macOS';
  if (ua.includes('Safari') && ua.includes('iPhone')) return 'Mobile Safari on iOS';
  if (ua.includes('Safari') && ua.includes('iPad')) return 'Safari on iPad';
  if (ua.includes('Safari') && ua.includes('Mac')) return 'Safari on macOS';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Android')) return 'Android Browser';
  if (ua.includes('Edge')) return 'Edge on Windows';
  return ua.slice(0, 40) || 'Unknown';
}

export function logAction(module: string, action: string, description: string, metadata?: Record<string, any>) {
  // ดึง user ปัจจุบัน
  let actor = 'ระบบ';
  let role = '';
  try {
    const authState = require('./authStore').useAuthStore.getState();
    if (authState.user) {
      actor = authState.user.name || authState.user.username;
      role = authState.user.role || '';
    }
  } catch (e) {}

  useAuditLogStore.getState().addLog({ actor, role, module, action, description, device: detectDevice(), metadata });
}
