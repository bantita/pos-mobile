/**
 * Tests — receiptLayout shared helper (ordering/visibility + print HTML parity)
 */
import { describe, test, expect, vi } from 'vitest';

// receiptLayout → receiptStore → persistStorage นำเข้า react-native + AsyncStorage
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import { getOrderedBlocks, buildReceiptHtml, ReceiptSampleData } from '../receiptLayout';
import { DEFAULT_LAYOUT, ReceiptConfig, ReceiptBlock } from '../../store/receiptStore';

const baseConfig = (layout: ReceiptBlock[]): ReceiptConfig => ({
  shopName: 'ร้านทดสอบ',
  shopAddr: 'ที่อยู่ทดสอบ',
  shopTel: '000',
  shopTaxId: '123',
  shopBranch: 'สาขา1',
  posRegNo: 'POS-1',
  paperSize: '80mm',
  headerLogo: '',
  headerText: 'สโลแกน',
  footerText: 'ขอบคุณ',
  showLogo: false,
  copies: 1,
  taxInvoiceEnabled: true,
  layout,
});

const sample: ReceiptSampleData = {
  billNo: '20001',
  date: '01/01/2567',
  items: [{ name: 'น้ำดื่ม', qty: 2, price: 20 }],
  total: 20,
  received: 100,
  change: 80,
};

describe('getOrderedBlocks', () => {
  test('คืนบล็อกตามลำดับ และตัด visible:false ออก', () => {
    const layout = DEFAULT_LAYOUT.map(b =>
      b.id === 'headerText' ? { ...b, visible: false } : { ...b }
    );
    const ordered = getOrderedBlocks(baseConfig(layout));
    expect(ordered.some(b => b.id === 'headerText')).toBe(false);
    expect(ordered).toHaveLength(DEFAULT_LAYOUT.length - 1);
  });

  test('สะท้อนลำดับที่สลับ (footerText ก่อน items)', () => {
    const layout: ReceiptBlock[] = [
      { id: 'footerText', visible: true, align: 'center' },
      { id: 'items', visible: true, align: 'left' },
    ];
    const ordered = getOrderedBlocks(baseConfig(layout));
    expect(ordered.map(b => b.id)).toEqual(['footerText', 'items']);
  });
});

describe('buildReceiptHtml — print parity', () => {
  test('เรียงบล็อกตาม config.layout', () => {
    const layout: ReceiptBlock[] = [
      { id: 'footerText', visible: true, align: 'center' },
      { id: 'shopName', visible: true, align: 'center' },
    ];
    const html = buildReceiptHtml(baseConfig(layout), sample);
    expect(html.indexOf('ขอบคุณ')).toBeLessThan(html.indexOf('ร้านทดสอบ'));
  });

  test('บล็อกที่ซ่อนไม่ปรากฏใน HTML', () => {
    const layout = DEFAULT_LAYOUT.map(b =>
      b.id === 'footerText' ? { ...b, visible: false } : { ...b }
    );
    const html = buildReceiptHtml(baseConfig(layout), sample);
    expect(html.includes('ขอบคุณ')).toBe(false);
  });

  test('ใช้การจัดตำแหน่งจาก block.align', () => {
    const layout: ReceiptBlock[] = [{ id: 'shopName', visible: true, align: 'right' }];
    const html = buildReceiptHtml(baseConfig(layout), sample);
    expect(html).toContain('text-align:right');
  });
});
