/**
 * Tests — receiptStore (layout reorder/toggle/align + persist + migration)
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

// receiptStore → persistStorage นำเข้า react-native + AsyncStorage
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import {
  useReceiptStore,
  DEFAULT_LAYOUT,
  mergeLayout,
  ReceiptBlock,
} from '../receiptStore';

const DEFAULT_ORDER = DEFAULT_LAYOUT.map(b => b.id);

beforeEach(() => {
  // คืนค่า layout เป็น DEFAULT ก่อนทุกเทส (setLayout ถูกถอดออกแล้ว)
  useReceiptStore.getState().setConfig({ layout: DEFAULT_LAYOUT.map(b => ({ ...b })) });
});

describe('receiptStore — DEFAULT layout', () => {
  test('มี 12 บล็อก แสดงทั้งหมด ตามลำดับเดิม', () => {
    const layout = useReceiptStore.getState().config.layout;
    expect(layout).toHaveLength(12);
    expect(layout.map(b => b.id)).toEqual([
      'logo', 'shopName', 'shopAddr', 'shopTel', 'taxId', 'headerText',
      'billInfo', 'items', 'totals', 'payment', 'footerText', 'branchInfo',
    ]);
    expect(layout.every(b => b.visible)).toBe(true);
  });
});

describe('receiptStore — persist', () => {
  test('ใช้ persist key "pos-receipt"', () => {
    expect(useReceiptStore.persist.getOptions().name).toBe('pos-receipt');
  });
});

describe('receiptStore — mergeLayout (migration)', () => {
  test('mergeLayout(undefined) คืน DEFAULT ครบ 12 บล็อก', () => {
    const merged = mergeLayout(undefined);
    expect(merged.map(b => b.id)).toEqual(DEFAULT_ORDER);
    expect(merged.every(b => b.visible)).toBe(true);
  });

  test('เก็บ order/visible ของ saved และเติม id ที่ขาด + ตัด id แปลกปลอม', () => {
    const saved: ReceiptBlock[] = [
      { id: 'items', visible: false, align: 'left' },
      { id: 'logo', visible: true, align: 'right' },
      // @ts-expect-error — จงใจส่ง id ที่ไม่รู้จักเพื่อทดสอบว่าถูกตัดทิ้ง
      { id: 'unknownBlock', visible: true },
    ];
    const merged = mergeLayout(saved);
    // id แรก ๆ มาจาก saved ตามลำดับ
    expect(merged[0].id).toBe('items');
    expect(merged[0].visible).toBe(false);
    expect(merged[1].id).toBe('logo');
    expect(merged[1].align).toBe('right');
    // ครบ 12 บล็อก, ไม่มี unknownBlock
    expect(merged).toHaveLength(12);
    expect(merged.some(b => (b.id as string) === 'unknownBlock')).toBe(false);
    // id ที่ขาดถูกเติมจาก DEFAULT
    expect(new Set(merged.map(b => b.id))).toEqual(new Set(DEFAULT_ORDER));
  });
});
