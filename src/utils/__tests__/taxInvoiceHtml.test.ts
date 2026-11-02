/**
 * Tests — buildTaxInvoiceHtml (pure, design §5.4 / §10)
 */
import { describe, test, expect } from 'vitest';
import { buildTaxInvoiceHtml, TaxInvoiceHtmlArgs } from '../taxInvoiceHtml';

const args = (over?: Partial<TaxInvoiceHtmlArgs>): TaxInvoiceHtmlArgs => ({
  invoiceNo: 'TAXS0001',
  issuedAt: new Date(2026, 5, 8, 9, 5),
  seller: { name: 'ร้านสะดวกซื้อ ABC', address: '123 ถนนสุขุมวิท', taxId: '0105560123456' },
  buyer: { name: 'บริษัท ตัวอย่าง จำกัด', taxId: '0999999999999', address: 'กรุงเทพฯ' },
  items: [{ name: 'กาแฟ', qty: 2, unitPrice: 1000, amount: 2000 }],
  totals: { base: 1869.16, vat: 130.84, grand: 2000 },
  ...over,
});

describe('buildTaxInvoiceHtml', () => {
  test('th → Thai title, BE year, Thai captions', () => {
    const html = buildTaxInvoiceHtml(args(), 'th');
    expect(html).toContain('ใบกำกับภาษีเต็มรูป');
    expect(html).toContain('08/06/2569 09:05 น.');
    expect(html).toContain('ภาษีมูลค่าเพิ่ม 7%');
    expect(html).toContain('ยอดรวมสุทธิ');
    expect(html).toContain('฿2,000.00');
  });

  test('en → Tax Invoice, Gregorian year, no Thai title', () => {
    const html = buildTaxInvoiceHtml(args(), 'en');
    expect(html).toContain('Tax Invoice');
    expect(html).toContain('08/06/2026 09:05');
    expect(html).toContain('VAT 7%');
    expect(html).not.toContain('ใบกำกับภาษี');
    expect(html).not.toContain('2569');
    expect(html).not.toContain('ยอดรวมสุทธิ');
  });

  test('buyer/shop names and item names verbatim in both languages', () => {
    for (const lang of ['th', 'en'] as const) {
      const html = buildTaxInvoiceHtml(args(), lang);
      expect(html).toContain('ร้านสะดวกซื้อ ABC');
      expect(html).toContain('บริษัท ตัวอย่าง จำกัด');
      expect(html).toContain('กาแฟ');
      expect(html).toContain('TAXS0001');
    }
  });

  test('empty buyer fields render "-"; user text is HTML-escaped', () => {
    const html = buildTaxInvoiceHtml(args({ buyer: { name: '', taxId: '', address: '<b>x</b>' } }), 'en');
    expect(html).toContain('<b>Buyer</b> -');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
