/**
 * Tests — buildPosReceiptData (POS print path, design §5.3 / §10)
 *   ข้อความเอกสารตาม cfg.receiptLanguage; ภาษา UI ไม่มีผล; parity กับ makeSampleData
 */
import { describe, test, expect, vi, afterEach } from 'vitest';

// posReceiptData -> receiptTemplate -> receiptStore -> persistStorage นำเข้า react-native + AsyncStorage
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import { buildPosReceiptData, PosPrintInvoice, ShopFallbacks } from '../posReceiptData';
import { makeSampleData, ReceiptDocType } from '../receiptTemplate';
import { useReceiptStore, ReceiptConfig } from '../../store/receiptStore';
import { useLanguageStore } from '../../store/languageStore';
import type { Language } from '../../i18n/types';

const FALLBACKS: ShopFallbacks = {
  shopName: 'ร้านสะดวกซื้อ ABC',
  shopAddr: '123 ถนนสุขุมวิท',
  shopTel: '02-123-4567',
  shopTaxId: '0105560123456',
  shopBranch: 'สำนักงานใหญ่',
  posRegNo: 'POS-001',
};

const cfg = (over?: Partial<ReceiptConfig>): ReceiptConfig => ({
  ...useReceiptStore.getState().config,
  ...over,
});

const invoice = (over?: Partial<PosPrintInvoice>): PosPrintInvoice => ({
  billNo: 'INV-2569-0001',
  date: '08/06/2569',
  time: '09:05',
  cashier: 'สมชาย',
  payMethod: 'เงินสด',
  items: [{ name: 'น้ำดื่ม', qty: 2, unitPrice: 10, disc: 0, total: 20 }],
  subtotal: 20,
  discount: 0,
  vat: 1.31,
  grand: 20,
  status: 'paid',
  ...over,
});

const ISSUED = new Date(2026, 5, 8, 9, 5).getTime();
const DATE_RE = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}( น\.)?$/;

afterEach(() => {
  useLanguageStore.setState({ uiLanguage: 'th' });
});

describe('buildPosReceiptData — doc titles', () => {
  const cases: [ReceiptDocType, Language, string][] = [
    ['receipt', 'th', 'ใบเสร็จรับเงิน'],
    ['tax_short', 'th', 'ใบกำกับภาษีอย่างย่อ'],
    ['tax_full', 'th', 'ใบกำกับภาษี'],
    ['receipt', 'en', 'Receipt'],
    ['tax_short', 'en', 'Abbreviated Tax Invoice'],
    ['tax_full', 'en', 'Tax Invoice'],
  ];
  test.each(cases)('%s × %s', (type, lang, title) => {
    expect(buildPosReceiptData(invoice(), type, cfg({ receiptLanguage: lang }), FALLBACKS).docTitle).toBe(title);
  });
});

describe('buildPosReceiptData — dateTime', () => {
  test('issuedAt → BE (th) vs Gregorian (en)', () => {
    const inv = invoice({ issuedAt: ISSUED });
    expect(buildPosReceiptData(inv, 'receipt', cfg({ receiptLanguage: 'th' }), FALLBACKS).dateTime).toBe('08/06/2569 09:05 น.');
    expect(buildPosReceiptData(inv, 'receipt', cfg({ receiptLanguage: 'en' }), FALLBACKS).dateTime).toBe('08/06/2026 09:05');
  });

  test('legacy date fallback: th keeps " น.", en has no suffix', () => {
    const inv = invoice({ date: '01/02/2567', time: '10:00' });
    expect(buildPosReceiptData(inv, 'receipt', cfg({ receiptLanguage: 'th' }), FALLBACKS).dateTime).toBe('01/02/2567 10:00 น.');
    expect(buildPosReceiptData(inv, 'receipt', cfg({ receiptLanguage: 'en' }), FALLBACKS).dateTime).toBe('01/02/2567 10:00');
  });
});

describe('buildPosReceiptData — pay method / cashier', () => {
  test('tax_full + en + payMethods cash + issuedAt → English, Gregorian, no เงินสด', () => {
    const d = buildPosReceiptData(
      invoice({ issuedAt: ISSUED, payMethods: [{ id: 'cash' }] }),
      'tax_full', cfg({ receiptLanguage: 'en' }), FALLBACKS,
    );
    expect(d.docTitle).toBe('Tax Invoice');
    expect(d.payMethod).toBe('Cash');
    expect(d.dateTime).toContain('2026');
    expect(JSON.stringify(d)).not.toContain('เงินสด');
  });

  test('void-note-shaped invoice (negative totals, copied payMethods) + en → Cash', () => {
    const d = buildPosReceiptData(
      invoice({
        issuedAt: ISSUED, payMethods: [{ id: 'cash' }],
        items: [{ name: 'น้ำดื่ม', qty: -2, unitPrice: 10, disc: 0, total: -20 }],
        subtotal: -20, grand: -20, vat: -1.31, status: 'cancelled', cancelReason: 'ลูกค้ายกเลิก',
      }),
      'receipt', cfg({ receiptLanguage: 'en' }), FALLBACKS,
    );
    expect(d.payMethod).toBe('Cash');
    expect(d.total).toBe(-20);
    expect(d.cancelReason).toBe('ลูกค้ายกเลิก');
  });

  test('legacy payMethod string used when payMethods missing', () => {
    expect(buildPosReceiptData(invoice(), 'receipt', cfg({ receiptLanguage: 'en' }), FALLBACKS).payMethod).toBe('เงินสด');
  });

  test('pay_* custom label kept in both languages', () => {
    for (const lang of ['th', 'en'] as const) {
      const d = buildPosReceiptData(
        invoice({ payMethods: [{ id: 'qr' }, { id: 'pay_1', label: 'แลกแต้ม' }] }),
        'receipt', cfg({ receiptLanguage: lang }), FALLBACKS,
      );
      expect(d.payMethod).toBe(`QR Code + แลกแต้ม`);
    }
  });

  test('cashier fallback when empty', () => {
    expect(buildPosReceiptData(invoice({ cashier: '' }), 'receipt', cfg({ receiptLanguage: 'th' }), FALLBACKS).cashier).toBe('แคชเชียร์');
    expect(buildPosReceiptData(invoice({ cashier: '' }), 'receipt', cfg({ receiptLanguage: 'en' }), FALLBACKS).cashier).toBe('Cashier');
    expect(buildPosReceiptData(invoice(), 'receipt', cfg({ receiptLanguage: 'en' }), FALLBACKS).cashier).toBe('สมชาย');
  });
});

describe('buildPosReceiptData — footer / branch / shop', () => {
  test('DEFAULT config + en → Thank you 🙏 / Head Office', () => {
    const d = buildPosReceiptData(invoice(), 'receipt', cfg({ receiptLanguage: 'en' }), FALLBACKS);
    expect(d.footerText).toBe('Thank you 🙏');
    expect(d.shopBranch).toBe('Head Office');
  });

  test('empty config branch falls back to SHOP_BRANCH, translated', () => {
    const d = buildPosReceiptData(invoice(), 'receipt', cfg({ receiptLanguage: 'en', shopBranch: '' }), FALLBACKS);
    expect(d.shopBranch).toBe('Head Office');
  });

  test('edited footer/branch kept verbatim in en', () => {
    const d = buildPosReceiptData(
      invoice(), 'receipt',
      cfg({ receiptLanguage: 'en', footerText: 'แวะมาใหม่นะ', shopBranch: 'สาขา 2' }), FALLBACKS,
    );
    expect(d.footerText).toBe('แวะมาใหม่นะ');
    expect(d.shopBranch).toBe('สาขา 2');
  });

  test('empty shop fields fall back to ShopFallbacks; showLogo defaults true', () => {
    const d = buildPosReceiptData(
      invoice(), 'receipt',
      cfg({ shopName: '', shopAddr: '', shopTel: '', shopTaxId: '', posRegNo: '' }), FALLBACKS,
    );
    expect(d.shopName).toBe(FALLBACKS.shopName);
    expect(d.shopAddr).toBe(FALLBACKS.shopAddr);
    expect(d.shopTel).toBe(FALLBACKS.shopTel);
    expect(d.shopTaxId).toBe(FALLBACKS.shopTaxId);
    expect(d.posRegNo).toBe(FALLBACKS.posRegNo);
    const noLogoFlag = { ...cfg() } as Partial<ReceiptConfig>;
    delete noLogoFlag.showLogo;
    expect(buildPosReceiptData(invoice(), 'receipt', noLogoFlag as ReceiptConfig, FALLBACKS).showLogo).toBe(true);
  });

  test('totals: preVat/vat derived from grand; items mapped to lineTotal', () => {
    const d = buildPosReceiptData(invoice({ grand: 107 }), 'receipt', cfg(), FALLBACKS);
    expect(d.preVatAmount).toBeCloseTo(100, 6);
    expect(d.vat).toBeCloseTo(7, 6);
    expect(d.items[0]).toEqual({ name: 'น้ำดื่ม', qty: 2, unitPrice: 10, disc: 0, lineTotal: 20 });
  });
});

describe('UI language has no effect', () => {
  test('flipping uiLanguage leaves buildPosReceiptData and makeSampleData unchanged', () => {
    const inv = invoice({ issuedAt: ISSUED, payMethods: [{ id: 'cash' }] });
    for (const lang of ['th', 'en'] as const) {
      const c = cfg({ receiptLanguage: lang });
      useLanguageStore.setState({ uiLanguage: 'th' });
      const posTh = buildPosReceiptData(inv, 'tax_short', c, FALLBACKS);
      const sampleTh = makeSampleData(c);
      useLanguageStore.setState({ uiLanguage: 'en' });
      expect(buildPosReceiptData(inv, 'tax_short', c, FALLBACKS)).toEqual(posTh);
      expect(makeSampleData(c)).toEqual(sampleTh);
    }
  });
});

describe('parity — makeSampleData vs buildPosReceiptData', () => {
  test.each(['th', 'en'] as const)('%s', (lang) => {
    for (const footerText of [cfg().footerText, '']) {
      const c = cfg({ receiptLanguage: lang, footerText });
      const sample = makeSampleData(c);
      const pos = buildPosReceiptData(invoice({ issuedAt: ISSUED }), 'tax_short', c, FALLBACKS);
      expect(pos.docTitle).toBe(sample.docTitle);
      expect(pos.footerText).toBe(sample.footerText);
      expect(pos.shopBranch).toBe(sample.shopBranch);
      expect(sample.dateTime).toMatch(DATE_RE);
      expect(pos.dateTime).toMatch(DATE_RE);
    }
  });
});
