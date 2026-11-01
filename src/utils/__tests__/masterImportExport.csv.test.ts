/**
 * Tests — masterImportExport CSV layer
 *   parseCsv: quotes, "" escapes, comma/newline inside quotes, BOM, CRLF/CR, blank rows
 *   toCsv ↔ parseCsv identity, workbook ↔ CSV (variant marker split), formula guard
 */
import { describe, test, expect } from 'vitest';
import {
  parseCsv, toCsv, workbookToCsv, csvToWorkbook, VARIANT_CSV_MARKER, SHEET_NAMES,
} from '../masterImportExport';

describe('parseCsv', () => {
  test('ฟิลด์ธรรมดา + LF', () => {
    expect(parseCsv('a,b,c\n1,2,3\n')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });

  test('ตัด BOM และรองรับ CRLF / CR', () => {
    expect(parseCsv('\ufeffรหัส,ชื่อ\r\nP1,น้ำ\rP2,ขนม\r\n')).toEqual([['รหัส', 'ชื่อ'], ['P1', 'น้ำ'], ['P2', 'ขนม']]);
  });

  test('comma, "" และขึ้นบรรทัดใหม่ภายใน quote', () => {
    const text = 'name,note\r\n"น้ำ, ขวด","เขาว่า ""ดี"""\r\n"บรรทัด1\r\nบรรทัด2",x\r\n';
    expect(parseCsv(text)).toEqual([
      ['name', 'note'],
      ['น้ำ, ขวด', 'เขาว่า "ดี"'],
      ['บรรทัด1\r\nบรรทัด2', 'x'],
    ]);
  });

  test('ช่องว่างท้ายแถวและแถวว่างถูกตัดทิ้ง', () => {
    expect(parseCsv('a,b\n\n,\n1,\n')).toEqual([['a', 'b'], ['1', '']]);
  });

  test('ไม่มีขึ้นบรรทัดท้ายไฟล์', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('toCsv', () => {
  test('ใส่ quote เมื่อจำเป็น + CRLF', () => {
    expect(toCsv([['a', 'b,c', 'd"e', 'f\ng', 5, null]])).toBe('a,"b,c","d""e","f\ng",5,\r\n');
  });

  test('toCsv → parseCsv ได้ข้อมูลเดิม (ภาษาไทย)', () => {
    const rows = [['รหัสสินค้า', 'ชื่อสินค้า', 'บาร์โค้ด'], ['P001', 'น้ำดื่ม "พิเศษ", 600ml', '885001|885002'], ['P002', 'หลาย\nบรรทัด', '']];
    expect(parseCsv('\ufeff' + toCsv(rows))).toEqual(rows);
  });
});

describe('workbook ↔ CSV', () => {
  test('สินค้า: ตาราง variant อยู่ใต้แถวคั่น และแยกกลับได้', () => {
    const wb = {
      sheets: [
        { name: SHEET_NAMES.product, rows: [['รหัสสินค้า', 'ชื่อสินค้า'], ['P1', 'เสื้อ']] },
        { name: SHEET_NAMES.variant, rows: [['รหัสสินค้า', 'ค่าตัวเลือก'], ['P1', 'สี=แดง']] },
        { name: SHEET_NAMES.help, rows: [['ไม่ต้องอยู่ใน CSV']] },
      ],
    };
    const csv = workbookToCsv('product', wb);
    expect(csv).toContain(VARIANT_CSV_MARKER);
    expect(csv).not.toContain('ไม่ต้องอยู่ใน CSV');
    const back = csvToWorkbook('product', csv);
    expect(back.sheets.map(s => s.name)).toEqual([SHEET_NAMES.product, SHEET_NAMES.variant]);
    expect(back.sheets[0].rows).toEqual(wb.sheets[0].rows);
    expect(back.sheets[1].rows).toEqual(wb.sheets[1].rows);
  });

  test('ไม่มีแถวคั่น → มีแค่ชีตสินค้า', () => {
    const back = csvToWorkbook('product', 'รหัสสินค้า,ชื่อสินค้า\r\nP1,น้ำ\r\n');
    expect(back.sheets).toHaveLength(1);
  });

  test('กันสูตร Excel (CSV injection) และถอดกลับตอนนำเข้า', () => {
    const wb = { sheets: [{ name: SHEET_NAMES.brand, rows: [['ชื่อแบรนด์'], ['=HYPERLINK("x")'], ['-5'], ['@cmd']] }] };
    const csv = workbookToCsv('brand', wb);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('\r\n-5\r\n');
    expect(csv).toContain(`'@cmd`);
    expect(csvToWorkbook('brand', csv).sheets[0].rows).toEqual(wb.sheets[0].rows);
  });
});
