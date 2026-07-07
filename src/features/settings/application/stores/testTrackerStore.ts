/**
 * Test Tracker Store — Zustand + Persist (Offline-ready)
 * บันทึกผลการทดสอบแต่ละ test case ลง local storage
 * ใช้งานได้ทั้ง online และ offline
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from '@/shared/infrastructure/storage/persistStorage';

// ─── Types ────────────────────────────────────────────────────────────────────
export type TestStatus = 'pending' | 'pass' | 'fail' | 'skip';

export interface TestResult {
  id: string;
  module: string;
  title: string;
  description: string;
  status: TestStatus;
  /** หมายเหตุ/ข้อสังเกต */
  note?: string;
  /** Screenshot URL (ถ้ามี) */
  screenshot?: string;
  /** ใครเป็นคนทดสอบ */
  tester?: string;
  /** วันที่ทดสอบ */
  testedAt?: string;
  /** วันที่สร้าง test case */
  createdAt: string;
}

export interface TestRun {
  id: string;
  name: string;
  description?: string;
  /** วันที่เริ่มทดสอบ */
  startedAt: string;
  /** วันที่เสร็จ */
  completedAt?: string;
  /** ชื่อผู้ทดสอบ */
  tester: string;
  /** สถานะ */
  status: 'in_progress' | 'completed';
  /** ผลลัพธ์ */
  results: TestResult[];
}

// ─── Default Test Cases ───────────────────────────────────────────────────────
const DEFAULT_TESTS: Omit<TestResult, 'status' | 'testedAt'>[] = [
  // Auth
  { id: 'TST-001', module: 'Auth', title: 'สมัครร้านค้าใหม่', description: 'กรอกข้อมูลร้าน + เจ้าของ → เข้า Dashboard สำเร็จ', createdAt: '2026-06-22' },
  { id: 'TST-002', module: 'Auth', title: 'เข้าสู่ระบบ', description: 'กรอก Username + Password → เข้า Dashboard', createdAt: '2026-06-22' },
  { id: 'TST-003', module: 'Auth', title: 'รหัสผ่านผิด', description: 'กรอก password ผิด → แสดง error ไม่เข้า Dashboard', createdAt: '2026-06-22' },
  // POS
  { id: 'TST-010', module: 'POS', title: 'ขายสินค้าปกติ (เงินสด)', description: 'เพิ่มสินค้า → ชำระเงินสด → ทอน → บิลสำเร็จ', createdAt: '2026-06-22' },
  { id: 'TST-011', module: 'POS', title: 'ขายสินค้า + ส่วนลดรายการ', description: 'เพิ่มสินค้า → ใส่ส่วนลด % → ตรวจราคาหลังลด', createdAt: '2026-06-22' },
  { id: 'TST-012', module: 'POS', title: 'เลือกสมาชิก + สะสมคะแนน', description: 'เลือกสมาชิก → ชำระ → คะแนนเพิ่ม', createdAt: '2026-06-22' },
  { id: 'TST-013', module: 'POS', title: 'ใช้คูปอง', description: 'กรอกคูปอง → ตรวจส่วนลด → ยอดลดถูกต้อง', createdAt: '2026-06-22' },
  { id: 'TST-014', module: 'POS', title: 'ใช้คะแนนแลกส่วนลด', description: 'เลือกสมาชิก → ใช้คะแนน → ส่วนลดจากคะแนน', createdAt: '2026-06-22' },
  { id: 'TST-015', module: 'POS', title: 'พักบิล + เรียกคืน', description: 'พักบิล → ขายใหม่ → เรียกบิลพักคืนมา', createdAt: '2026-06-22' },
  { id: 'TST-016', module: 'POS', title: 'สินค้าบริการ + เลือกช่าง', description: 'เพิ่มสินค้าประเภทบริการ → popup เลือกช่าง → เข้าตะกร้า', createdAt: '2026-06-22' },
  { id: 'TST-017', module: 'POS', title: 'ชำระ QR Code', description: 'เพิ่มสินค้า → กด QR → ยืนยัน → บิลสำเร็จ', createdAt: '2026-06-22' },
  // สินค้า
  { id: 'TST-020', module: 'สินค้า', title: 'เพิ่มสินค้าใหม่', description: 'กรอกรหัส + ชื่อ + ราคา → บันทึก → แสดงในรายการ', createdAt: '2026-06-22' },
  { id: 'TST-021', module: 'สินค้า', title: 'แก้ไขราคา', description: 'กดแก้ไข → เปลี่ยนราคา → บันทึก → อัพเดท', createdAt: '2026-06-22' },
  { id: 'TST-022', module: 'สินค้า', title: 'ดูคลังสินค้า', description: 'เข้า tab คลังสินค้า → เห็น KPI + สถานะสต๊อก', createdAt: '2026-06-22' },
  // CRM
  { id: 'TST-030', module: 'CRM', title: 'เพิ่มสมาชิก', description: 'กรอกเบอร์ + ชื่อ → บันทึก → ได้เลข MEM-XXXXX', createdAt: '2026-06-22' },
  { id: 'TST-031', module: 'CRM', title: 'ค้นหาสมาชิก', description: 'พิมพ์ชื่อ/เบอร์ → กรองถูกต้อง', createdAt: '2026-06-22' },
  { id: 'TST-032', module: 'CRM', title: 'ส่งคูปองผ่าน LINE', description: 'เลือกคูปอง → กดส่ง LINE → broadcast สำเร็จ', createdAt: '2026-06-22' },
  // โปรโมชั่น
  { id: 'TST-040', module: 'โปรโมชั่น', title: 'สร้างโปรลด %', description: 'สร้างโปร ลด 10% → Active → คำนวณอัตโนมัติ', createdAt: '2026-06-22' },
  { id: 'TST-041', module: 'โปรโมชั่น', title: 'โปรคำนวณอัตโนมัติ', description: 'มีโปร Active → ขายสินค้าที่ตรง → ลดอัตโนมัติ', createdAt: '2026-06-22' },
  // รายงาน
  { id: 'TST-050', module: 'รายงาน', title: 'สรุปประจำวัน', description: 'เข้ารายงาน → สรุปประจำวัน → เห็น KPI ครบ', createdAt: '2026-06-22' },
  { id: 'TST-051', module: 'รายงาน', title: 'Export Excel', description: 'กด Excel → ดาวน์โหลดไฟล์สำเร็จ', createdAt: '2026-06-22' },
  // ตั้งค่า
  { id: 'TST-060', module: 'ตั้งค่า', title: 'ตั้งค่าเครื่องพิมพ์', description: 'สาขา > POS > เครื่องพิมพ์ > เลือก USB > ทดสอบพิมพ์', createdAt: '2026-06-22' },
  { id: 'TST-061', module: 'ตั้งค่า', title: 'เพิ่มประเภทชำระ', description: 'ตั้งค่า > ประเภทชำระ > เพิ่มใหม่ → แสดงใน POS', createdAt: '2026-06-22' },
  { id: 'TST-062', module: 'ตั้งค่า', title: 'สแกนเนอร์', description: 'สาขา > POS > สแกนเนอร์ > ทดสอบสแกน', createdAt: '2026-06-22' },
  // Offline
  { id: 'TST-070', module: 'Offline', title: 'ขายสินค้า offline', description: 'ปิด internet → ขายได้ → เปิด internet → sync', createdAt: '2026-06-22' },
  { id: 'TST-071', module: 'Offline', title: 'ข้อมูลสมาชิก offline', description: 'ปิด internet → ค้นหาสมาชิกได้จาก cache', createdAt: '2026-06-22' },
  { id: 'TST-072', module: 'Offline', title: 'ข้อมูลสินค้า offline', description: 'ปิด internet → ดูรายการสินค้าได้จาก cache', createdAt: '2026-06-22' },
];

// ─── Store ────────────────────────────────────────────────────────────────────
interface TestTrackerState {
  runs: TestRun[];
  currentRunId: string | null;
  /** ผลทดสอบจากคนอื่นที่ sync มา (admin view) */
  sharedRuns: TestRun[];

  // Actions
  createRun: (name: string, tester: string, description?: string) => TestRun;
  getCurrentRun: () => TestRun | null;
  updateTestResult: (testId: string, status: TestStatus, note?: string, screenshot?: string) => void;
  completeRun: () => void;
  deleteRun: (runId: string) => void;
  getRunStats: (runId: string) => { total: number; pass: number; fail: number; skip: number; pending: number };
  getAllModules: () => string[];
  /** Export ผลทดสอบเป็น JSON string */
  exportRun: (runId: string) => string | null;
  /** Import ผลทดสอบจากคนอื่น (admin) */
  importSharedRun: (jsonStr: string) => boolean;
  /** ลบ shared run */
  deleteSharedRun: (runId: string) => void;
}

export const useTestTrackerStore = create<TestTrackerState>()(
  persist(
    (set, get) => ({
      runs: [],
      currentRunId: null,
      sharedRuns: [],

      createRun: (name, tester, description) => {
        const run: TestRun = {
          id: `run_${Date.now()}`,
          name,
          tester,
          description,
          startedAt: new Date().toISOString(),
          status: 'in_progress',
          results: DEFAULT_TESTS.map(t => ({ ...t, status: 'pending' as TestStatus })),
        };
        set(s => ({ runs: [run, ...s.runs], currentRunId: run.id }));
        return run;
      },

      getCurrentRun: () => {
        const { runs, currentRunId } = get();
        return runs.find(r => r.id === currentRunId) || null;
      },

      updateTestResult: (testId, status, note, screenshot) => {
        const { currentRunId } = get();
        if (!currentRunId) return;
        set(s => ({
          runs: s.runs.map(r =>
            r.id === currentRunId
              ? {
                  ...r,
                  results: r.results.map(t =>
                    t.id === testId
                      ? { ...t, status, note, screenshot, testedAt: new Date().toISOString(), tester: r.tester }
                      : t
                  ),
                }
              : r
          ),
        }));
      },

      completeRun: () => {
        const { currentRunId } = get();
        if (!currentRunId) return;
        set(s => ({
          runs: s.runs.map(r =>
            r.id === currentRunId
              ? { ...r, status: 'completed', completedAt: new Date().toISOString() }
              : r
          ),
          currentRunId: null,
        }));
      },

      deleteRun: (runId) => {
        set(s => ({
          runs: s.runs.filter(r => r.id !== runId),
          currentRunId: s.currentRunId === runId ? null : s.currentRunId,
        }));
      },

      getRunStats: (runId) => {
        const run = get().runs.find(r => r.id === runId);
        if (!run) return { total: 0, pass: 0, fail: 0, skip: 0, pending: 0 };
        return {
          total: run.results.length,
          pass: run.results.filter(t => t.status === 'pass').length,
          fail: run.results.filter(t => t.status === 'fail').length,
          skip: run.results.filter(t => t.status === 'skip').length,
          pending: run.results.filter(t => t.status === 'pending').length,
        };
      },

      getAllModules: () => {
        return [...new Set(DEFAULT_TESTS.map(t => t.module))];
      },

      exportRun: (runId) => {
        const run = get().runs.find(r => r.id === runId);
        if (!run) return null;
        return JSON.stringify(run);
      },

      importSharedRun: (jsonStr) => {
        try {
          const run = JSON.parse(jsonStr) as TestRun;
          if (!run.id || !run.results) return false;
          set(s => ({
            sharedRuns: [
              run,
              ...s.sharedRuns.filter(r => r.id !== run.id), // replace if exists
            ],
          }));
          return true;
        } catch {
          return false;
        }
      },

      deleteSharedRun: (runId) => {
        set(s => ({ sharedRuns: s.sharedRuns.filter(r => r.id !== runId) }));
      },
    }),
    {
      name: 'pos-test-tracker',
      storage: createJSONStorage(() => persistStorage),
    }
  )
);
