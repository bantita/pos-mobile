/**
 * Tests — receiptStore migration (block-list -> canvas template) + persist idempotency
 */
import { describe, test, expect, vi } from 'vitest';

// receiptStore -> persistStorage นำเข้า react-native + AsyncStorage
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import {
  useReceiptStore,
  migrateLayoutToTemplate,
  mergeLayout,
  DEFAULT_LAYOUT,
  DEFAULT_TEMPLATE,
  DEFAULT_PAPER,
  PAPER_PRESETS,
  ReceiptBlock,
  ReceiptConfig,
  ReceiptTemplate,
} from '../receiptStore';

const baseConfig = (over?: Partial<ReceiptConfig>): Partial<ReceiptConfig> => ({
  shopName: 'ร้านทดสอบ',
  shopAddr: 'ที่อยู่',
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
  layout: DEFAULT_LAYOUT.map(b => ({ ...b })),
  ...over,
});

describe('migrateLayoutToTemplate — mapping', () => {
  test('maps the DEFAULT block list to elements in order (payment dropped)', () => {
    const tpl = migrateLayoutToTemplate(baseConfig());
    expect(tpl.version).toBe(1);
    // DEFAULT has 12 blocks: payment dropped, billInfo -> 2 elements => 12 - 1 + 1 = 12
    // (logo,shopName,shopAddr,shopTel,taxId,headerText) 6 +
    // (billNo,dateTime) 2 + items 1 + total 1 + footerText 1 + branchInfo 1 = 12
    const fields = tpl.elements.map(e => e.field);
    expect(fields).toEqual([
      'logo', 'shopName', 'shopAddr', 'shopTel', 'shopTaxId', 'headerText',
      'billNo', 'dateTime', 'items', 'total', 'footerText', 'shopBranch',
    ]);
    // no payment-derived element
    expect(fields).not.toContain('payMethod');
  });

  test('keeps only visible blocks', () => {
    const layout = DEFAULT_LAYOUT.map(b =>
      b.id === 'headerText' ? { ...b, visible: false } : { ...b }
    );
    const tpl = migrateLayoutToTemplate(baseConfig({ layout }));
    expect(tpl.elements.some(e => e.field === 'headerText')).toBe(false);
  });

  test('billInfo expands to two fields: billNo then dateTime (in order)', () => {
    const tpl = migrateLayoutToTemplate(baseConfig());
    const fields = tpl.elements.map(e => e.field);
    const iBill = fields.indexOf('billNo');
    expect(iBill).toBeGreaterThanOrEqual(0);
    expect(fields[iBill + 1]).toBe('dateTime');
  });

  test('payment block emits no element even when visible', () => {
    // payment is visible in DEFAULT_LAYOUT; migration must drop it
    const tpl = migrateLayoutToTemplate(baseConfig());
    // no element derived from the payment block (payMethod is not produced by migration)
    expect(tpl.elements.some(e => e.field === 'payMethod')).toBe(false);
    // element count: 12 blocks - payment(dropped) - billInfo(+1 extra) = 12
    expect(tpl.elements).toHaveLength(12);
  });

  test('hiding payment vs showing payment yields identical elements', () => {
    const shown = migrateLayoutToTemplate(baseConfig());
    const hiddenLayout = DEFAULT_LAYOUT.map(b =>
      b.id === 'payment' ? { ...b, visible: false } : { ...b }
    );
    const hidden = migrateLayoutToTemplate(baseConfig({ layout: hiddenLayout }));
    expect(hidden.elements.map(e => e.field)).toEqual(shown.elements.map(e => e.field));
  });

  test('carries block.align into style.align', () => {
    const layout: ReceiptBlock[] = [{ id: 'shopName', visible: true, align: 'right' }];
    const tpl = migrateLayoutToTemplate(baseConfig({ layout }));
    expect(tpl.elements[0].style.align).toBe('right');
  });

  test('elements stacked with increasing yMm and z', () => {
    const tpl = migrateLayoutToTemplate(baseConfig());
    for (let i = 1; i < tpl.elements.length; i++) {
      expect(tpl.elements[i].yMm).toBeGreaterThan(tpl.elements[i - 1].yMm);
      expect(tpl.elements[i].z).toBeGreaterThan(tpl.elements[i - 1].z);
    }
    // first element starts at margin
    expect(tpl.elements[0].yMm).toBe(tpl.paper.marginMm);
    expect(tpl.elements[0].xMm).toBe(tpl.paper.marginMm);
  });

  test('paper seeded from config.paperSize', () => {
    expect(migrateLayoutToTemplate(baseConfig({ paperSize: '58mm' })).paper).toEqual(PAPER_PRESETS['58mm']);
    expect(migrateLayoutToTemplate(baseConfig({ paperSize: 'A4' })).paper).toEqual(PAPER_PRESETS['A4']);
  });

  test('garbage / undefined input -> DEFAULT_TEMPLATE', () => {
    expect(migrateLayoutToTemplate(undefined)).toBe(DEFAULT_TEMPLATE);
    expect(migrateLayoutToTemplate(null)).toBe(DEFAULT_TEMPLATE);
    // unknown paperSize falls back to DEFAULT_PAPER
    const tpl = migrateLayoutToTemplate(baseConfig({ paperSize: 'weird' as unknown as '80mm' }));
    expect(tpl.paper).toEqual(DEFAULT_PAPER);
  });
});

describe('persist merge — idempotency', () => {
  const merge = useReceiptStore.persist.getOptions().merge!;

  const currentState = () => ({ config: { ...useReceiptStore.getState().config, template: undefined } });

  test('re-merging the merge output keeps the same template (idempotent, no rebuild)', () => {
    const blob = { config: baseConfig() }; // no template -> must be built once
    const once = merge(blob, currentState() as never) as { config: ReceiptConfig };
    expect(once.config.template).toBeDefined();
    // feed the migrated output back in — well-formed template must be kept untouched
    const twice = merge({ config: once.config }, currentState() as never) as { config: ReceiptConfig };
    expect(twice.config.template).toBe(once.config.template);
    expect(twice.config.template).toEqual(once.config.template);
  });

  test('merge on an already-migrated v2 blob does not rebuild (keeps template)', () => {
    const existing: ReceiptTemplate = migrateLayoutToTemplate(baseConfig());
    const blob = { config: baseConfig({ template: existing }) };
    const merged = merge(blob, currentState() as never) as { config: ReceiptConfig };
    // well-formed template is kept untouched (same reference, not rebuilt)
    expect(merged.config.template).toBe(existing);
  });

  test('malformed template is rebuilt from layout', () => {
    const blob = { config: baseConfig({ template: { version: 99 } as unknown as ReceiptTemplate }) };
    const merged = merge(blob, currentState() as never) as { config: ReceiptConfig };
    expect(merged.config.template?.version).toBe(1);
    expect(Array.isArray(merged.config.template?.elements)).toBe(true);
  });

  test('merge still fills layout from mergeLayout', () => {
    const blob = { config: { ...baseConfig(), layout: undefined } };
    const merged = merge(blob, currentState() as never) as { config: ReceiptConfig };
    expect(merged.config.layout.map(b => b.id)).toEqual(mergeLayout(undefined).map(b => b.id));
  });
});

describe('persist migrate — v1 -> v2', () => {
  const migrate = useReceiptStore.persist.getOptions().migrate!;

  test('fromVersion < 2 builds config.template from layout', () => {
    const blob = { config: baseConfig() };
    const out = migrate(blob, 1) as { config: ReceiptConfig };
    expect(out.config.template?.version).toBe(1);
    expect(Array.isArray(out.config.template?.elements)).toBe(true);
  });

  test('fromVersion >= 2 passes through unchanged', () => {
    const blob = { config: baseConfig() };
    const out = migrate(blob, 2);
    expect(out).toBe(blob);
  });
});
