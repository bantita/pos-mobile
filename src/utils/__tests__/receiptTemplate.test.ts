/**
 * Tests — receiptTemplate shared renderer
 *   - resolveField: kind-per-key (§2.2.1), empty-when rules, items 5 columns, logo/qr
 *   - layoutElement: mm -> px geometry
 *   - buildTemplateHtml: z-order, mm units, @page margin:0, empty bordered box,
 *     undefined template -> DEFAULT_TEMPLATE, escaping, custom paper dims
 */
import { describe, test, expect, vi } from 'vitest';

// receiptTemplate -> receiptStore -> persistStorage นำเข้า react-native + AsyncStorage
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import {
  PX_PER_MM,
  ReceiptRenderData,
  resolveField,
  resolveFieldValue,
  layoutElement,
  buildTemplateHtml,
  makeSampleData,
} from '../receiptTemplate';
import {
  ReceiptElement,
  ReceiptElementStyle,
  ReceiptFieldKey,
  ReceiptTemplate,
  ReceiptConfig,
  DEFAULT_TEMPLATE,
  DEFAULT_PAPER,
} from '../../store/receiptStore';

const style = (overrides?: Partial<ReceiptElementStyle>): ReceiptElementStyle => ({
  fontSize: 11,
  bold: false,
  align: 'left',
  border: false,
  borderWidthMm: 0.3,
  ...overrides,
});

const el = (patch: Partial<ReceiptElement>): ReceiptElement => ({
  id: patch.id ?? 'e1',
  type: patch.type ?? 'field',
  xMm: patch.xMm ?? 4,
  yMm: patch.yMm ?? 4,
  wMm: patch.wMm ?? 72,
  hMm: patch.hMm ?? 6,
  z: patch.z ?? 1,
  style: patch.style ?? style(),
  text: patch.text,
  field: patch.field,
});

const sampleData = (): ReceiptRenderData => ({
  shopName: 'ร้านทดสอบ',
  shopAddr: 'ที่อยู่',
  shopTel: '000',
  shopTaxId: 'TAX1',
  shopBranch: 'สาขา1',
  posRegNo: 'POS-1',
  footerText: 'ขอบคุณ',
  headerText: 'สโลแกน',
  logoUri: 'data:image/png;base64,AAA',
  showLogo: true,
  docTitle: 'ใบกำกับภาษีอย่างย่อ',
  billNo: 'B001',
  dateTime: '01/01/2567',
  cashier: 'A',
  payMethod: 'เงินสด',
  cancelReason: 'ยกเลิกโดยผู้จัดการ',
  buyerName: 'บริษัท ก',
  buyerAddr: 'ที่อยู่ผู้ซื้อ',
  buyerTaxId: 'BTAX1',
  buyerBranch: 'สาขาผู้ซื้อ',
  items: [
    { name: 'น้ำดื่ม', qty: 2, unitPrice: 10, disc: 0, lineTotal: 20 },
    { name: 'ขนม', qty: 1, unitPrice: 35, disc: 5, lineTotal: 30 },
  ],
  subtotal: 50,
  discount: 5,
  preVatAmount: 46.73,
  vat: 3.27,
  total: 50,
});

// text-valued field keys per §2.2.1
const TEXT_KEYS: { key: ReceiptFieldKey; prop: keyof ReceiptRenderData }[] = [
  { key: 'shopName', prop: 'shopName' },
  { key: 'shopAddr', prop: 'shopAddr' },
  { key: 'shopTel', prop: 'shopTel' },
  { key: 'shopTaxId', prop: 'shopTaxId' },
  { key: 'shopBranch', prop: 'shopBranch' },
  { key: 'posRegNo', prop: 'posRegNo' },
  { key: 'headerText', prop: 'headerText' },
  { key: 'footerText', prop: 'footerText' },
  { key: 'docTitle', prop: 'docTitle' },
  { key: 'billNo', prop: 'billNo' },
  { key: 'dateTime', prop: 'dateTime' },
  { key: 'cashier', prop: 'cashier' },
  { key: 'payMethod', prop: 'payMethod' },
  { key: 'buyerName', prop: 'buyerName' },
  { key: 'buyerAddr', prop: 'buyerAddr' },
  { key: 'buyerTaxId', prop: 'buyerTaxId' },
  { key: 'buyerBranch', prop: 'buyerBranch' },
  { key: 'cancelReason', prop: 'cancelReason' },
];

const NUMERIC_KEYS: ReceiptFieldKey[] = ['subtotal', 'discount', 'preVatAmount', 'vat', 'total'];

describe('resolveField — kind per ReceiptFieldKey (§2.2.1)', () => {
  test('text-valued field keys resolve to kind:text with their source prop', () => {
    const d = sampleData();
    for (const { key, prop } of TEXT_KEYS) {
      const r = resolveField(el({ type: 'field', field: key }), d);
      expect(r.kind).toBe('text');
      if (r.kind === 'text') {
        expect(r.value).toBe(String(d[prop] as string));
      }
    }
  });

  test('numeric amount keys resolve to kind:text and always render (0.00 too)', () => {
    const d = sampleData();
    for (const key of NUMERIC_KEYS) {
      const r = resolveField(el({ type: 'field', field: key }), d);
      expect(r.kind).toBe('text');
      if (r.kind === 'text') {
        expect(r.value).toMatch(/^฿\d/);
      }
    }
    // zero still renders
    const z = { ...d, total: 0 };
    const rz = resolveField(el({ type: 'field', field: 'total' }), z);
    expect(rz.kind).toBe('text');
    if (rz.kind === 'text') expect(rz.value).toBe('฿0.00');
  });

  test('items -> kind:items with 5-column rows', () => {
    const d = sampleData();
    const r = resolveField(el({ type: 'field', field: 'items' }), d);
    expect(r.kind).toBe('items');
    if (r.kind === 'items') {
      expect(r.rows).toHaveLength(2);
      const row = r.rows[0];
      expect(Object.keys(row).sort()).toEqual(
        ['disc', 'lineTotal', 'name', 'qty', 'unitPrice'].sort()
      );
    }
  });

  test('logo -> kind:image with uri + show', () => {
    const d = sampleData();
    const r = resolveField(el({ type: 'image', field: 'logo' }), d);
    expect(r.kind).toBe('image');
    if (r.kind === 'image') {
      expect(r.uri).toBe(d.logoUri);
      expect(r.show).toBe(true);
    }
  });

  test('logo empty-when: showLogo false OR logoUri empty', () => {
    const r1 = resolveField(el({ type: 'image', field: 'logo' }), { ...sampleData(), showLogo: false });
    expect(r1.kind === 'image' && r1.show).toBe(false);
    const r2 = resolveField(el({ type: 'image', field: 'logo' }), { ...sampleData(), logoUri: '' });
    expect(r2.kind === 'image' && r2.uri).toBe(null);
  });

  test('qr -> kind:qr; empty when payload undefined/empty', () => {
    const d = sampleData();
    const rp = resolveField(el({ type: 'qr', field: 'qr' }), { ...d, qrPayload: 'X' });
    expect(rp.kind).toBe('qr');
    if (rp.kind === 'qr') expect(rp.payload).toBe('X');
    const re = resolveField(el({ type: 'qr', field: 'qr' }), { ...d, qrPayload: '' });
    expect(re.kind === 'qr' && re.payload).toBe(null);
    const ru = resolveField(el({ type: 'qr', field: 'qr' }), { ...d, qrPayload: undefined });
    expect(ru.kind === 'qr' && ru.payload).toBe(null);
  });
});

describe('resolveFieldValue — kind:text empty-when (§2.2.1)', () => {
  test("empty string source -> value:null", () => {
    const d = { ...sampleData(), shopName: '' };
    expect(resolveFieldValue(el({ type: 'field', field: 'shopName' }), d)).toBe(null);
    const r = resolveField(el({ type: 'field', field: 'shopName' }), d);
    expect(r.kind === 'text' && r.value).toBe(null);
  });

  test('free text element uses el.text, ignores field; empty text -> null', () => {
    const d = sampleData();
    expect(resolveFieldValue(el({ type: 'text', text: 'สวัสดี' }), d)).toBe('สวัสดี');
    expect(resolveFieldValue(el({ type: 'text', text: '' }), d)).toBe(null);
    expect(resolveFieldValue(el({ type: 'text' }), d)).toBe(null);
  });
});

describe('ReceiptFieldKey / ReceiptRenderData — no received/change', () => {
  test('received/change keys do not exist on render data', () => {
    const d = sampleData() as unknown as Record<string, unknown>;
    expect('received' in d).toBe(false);
    expect('change' in d).toBe(false);
  });
});

describe('layoutElement — mm -> px', () => {
  test('converts mm to px via PX_PER_MM at zoom 1', () => {
    const geo = layoutElement(el({ xMm: 10, yMm: 20, wMm: 40, hMm: 8 }), 1);
    expect(geo.leftPx).toBeCloseTo(10 * PX_PER_MM, 5);
    expect(geo.topPx).toBeCloseTo(20 * PX_PER_MM, 5);
    expect(geo.widthPx).toBeCloseTo(40 * PX_PER_MM, 5);
    expect(geo.heightPx).toBeCloseTo(8 * PX_PER_MM, 5);
  });

  test('zoom scales px output', () => {
    const geo = layoutElement(el({ xMm: 10, wMm: 40 }), 1.5);
    expect(geo.leftPx).toBeCloseTo(10 * PX_PER_MM * 1.5, 5);
    expect(geo.widthPx).toBeCloseTo(40 * PX_PER_MM * 1.5, 5);
  });

  test('PX_PER_MM ≈ 3.7795', () => {
    expect(PX_PER_MM).toBeCloseTo(3.7795, 3);
  });
});

describe('buildTemplateHtml', () => {
  const tpl = (elements: ReceiptElement[], paper = DEFAULT_PAPER): ReceiptTemplate => ({
    version: 1,
    paper,
    elements,
  });

  test('elements emitted sorted by z', () => {
    const html = buildTemplateHtml(
      tpl([
        el({ id: 'a', type: 'text', text: 'ZZZ', z: 5 }),
        el({ id: 'b', type: 'text', text: 'AAA', z: 1 }),
      ]),
      sampleData()
    );
    expect(html.indexOf('AAA')).toBeLessThan(html.indexOf('ZZZ'));
  });

  test('mm units used in left/top/width/height', () => {
    const html = buildTemplateHtml(
      tpl([el({ xMm: 4, yMm: 6, wMm: 72, hMm: 8, type: 'text', text: 'x' })]),
      sampleData()
    );
    expect(html).toContain('left:4mm');
    expect(html).toContain('top:6mm');
    expect(html).toContain('width:72mm');
    expect(html).toContain('height:8mm');
  });

  test('@page size matches paper and margin:0', () => {
    const html = buildTemplateHtml(tpl([]), sampleData());
    expect(html).toContain('size: 80mm auto');
    expect(html).toContain('margin: 0');
  });

  test('custom paper dims honored (fixed height)', () => {
    const custom = { preset: 'custom' as const, widthMm: 150, heightMm: 100, marginMm: 5 };
    const html = buildTemplateHtml(tpl([], custom), sampleData());
    expect(html).toContain('size: 150mm 100mm');
    expect(html).toContain('width:150mm');
  });

  test('empty bordered kind:text -> box with border and no text', () => {
    const html = buildTemplateHtml(
      tpl([el({ type: 'field', field: 'buyerName', style: style({ border: true }) })]),
      { ...sampleData(), buyerName: '' }
    );
    // bordered div present (mm border), but no buyer text
    expect(html).toMatch(/border:[\d.]+mm solid/);
  });

  test('undefined template renders DEFAULT_TEMPLATE without throwing', () => {
    expect(() => buildTemplateHtml(undefined, sampleData())).not.toThrow();
    const html = buildTemplateHtml(undefined, sampleData());
    // DEFAULT_TEMPLATE paper is 80mm
    expect(html).toContain(`size: ${DEFAULT_TEMPLATE.paper.widthMm}mm`);
  });

  test('malicious text is HTML-escaped', () => {
    const html = buildTemplateHtml(
      tpl([el({ type: 'text', text: '<script>alert(1)</script>' })]),
      sampleData()
    );
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('items block emits 5 columns per row', () => {
    const html = buildTemplateHtml(
      tpl([el({ type: 'field', field: 'items', hMm: 30 })]),
      sampleData()
    );
    expect(html).toContain('น้ำดื่ม');
    expect(html).toContain('฿20.00'); // lineTotal
  });
});

describe('makeSampleData', () => {
  test('uses shop name from config and produces 5 item rows', () => {
    const config = { shopName: 'ร้านของฉัน', showLogo: false } as ReceiptConfig;
    const d = makeSampleData(config);
    expect(d.shopName).toBe('ร้านของฉัน');
    expect(d.items).toHaveLength(5);
    expect(d.total).toBeGreaterThan(0);
  });
});
