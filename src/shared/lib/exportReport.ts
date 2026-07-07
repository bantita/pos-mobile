/**
 * Export Report Utilities
 * - Excel: สร้าง CSV format (รองรับ Excel เปิดได้)
 * - PDF: สร้าง HTML → Print/Share ผ่าน expo-print
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

// ─── CSV / Excel ──────────────────────────────────────────────────────────────

/** แปลง array of objects เป็น CSV string */
export const toCSV = (rows: Record<string, unknown>[], columns: { key: string; header: string }[]): string => {
  const header = columns.map(c => `"${c.header}"`).join(',');
  const body = rows.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  ).join('\n');
  return `\uFEFF${header}\n${body}`; // BOM สำหรับ Excel ภาษาไทย
};

/** Export CSV ผ่าน Share */
export const exportExcel = async (
  filename: string,
  rows: Record<string, unknown>[],
  columns: { key: string; header: string }[]
): Promise<void> => {
  try {
    const csv = toCSV(rows, columns);
    const uri = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

    if (Platform.OS === 'web') {
      // Web: download โดยตรง
      const link = document.createElement('a');
      link.href = `data:text/csv;charset=utf-8,\uFEFF${encodeURIComponent(csv)}`;
      link.download = `${filename}.csv`;
      link.click();
    } else {
      // Native: share ผ่าน expo-sharing
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // เขียน temp file
        const FileSystem = await import('expo-file-system/legacy');
        const path = `${FileSystem.documentDirectory}${filename}.csv`;
        await FileSystem.writeAsStringAsync(path, csv, { encoding: 'utf8' });
        await Sharing.shareAsync(path, {
          mimeType: 'text/csv',
          dialogTitle: `Export ${filename}`,
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('ไม่รองรับ', 'อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์');
      }
    }
  } catch (err) {
    console.error('Export Excel error:', err);
    Alert.alert('Export ไม่สำเร็จ', String(err));
  }
};

// ─── PDF ──────────────────────────────────────────────────────────────────────

const PDF_STYLES = `
  body { font-family: 'Sarabun', Arial, sans-serif; margin: 20px; color: #1c1917; font-size: 12px; }
  h1 { color: #fca5a5; font-size: 20px; margin-bottom: 4px; }
  h2 { color: #fca5a5; font-size: 14px; }
  .meta { color: #78716c; font-size: 11px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #fef3c7; color: #1c1917; padding: 8px 10px; text-align: left; border: 1px solid #e7e5e4; font-size: 11px; }
  td { padding: 7px 10px; border: 1px solid #e7e5e4; font-size: 11px; }
  tr:nth-child(even) td { background: #fafaf9; }
  .total-row td { background: #fef3c7; font-weight: bold; }
  .badge-green { color: #15803d; font-weight: bold; }
  .badge-red   { color: #b91c1c; font-weight: bold; }
  .badge-warn  { color: #ca8a04; font-weight: bold; }
  .footer { margin-top: 24px; color: #a8a29e; font-size: 10px; text-align: right; }
  @media print { body { margin: 0; } }
`;

/** สร้าง HTML table สำหรับ PDF */
export const buildHTMLReport = (
  title: string,
  subtitle: string,
  dateRange: string,
  columns: { key: string; header: string; align?: 'left' | 'right' | 'center' }[],
  rows: Record<string, unknown>[],
  summaryRows?: { label: string; value: string }[]
): string => {
  const now = new Date().toLocaleString('th-TH');
  const tableHeader = columns.map(c =>
    `<th style="text-align:${c.align ?? 'left'}">${c.header}</th>`
  ).join('');
  const tableBody = rows.map((row, i) => {
    const cells = columns.map(c => {
      const val = String(row[c.key] ?? '');
      const isNum = c.align === 'right';
      return `<td style="text-align:${c.align ?? 'left'}">${val}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const summaryHTML = summaryRows ? `
    <table style="margin-top:16px; width:280px; margin-left:auto">
      ${summaryRows.map(s => `
        <tr class="total-row">
          <td style="text-align:right; font-weight:bold">${s.label}</td>
          <td style="text-align:right; font-weight:bold">${s.value}</td>
        </tr>`).join('')}
    </table>` : '';

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <style>${PDF_STYLES}</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">${subtitle} | ช่วงวันที่: ${dateRange} | พิมพ์: ${now}</p>
  <table>
    <thead><tr>${tableHeader}</tr></thead>
    <tbody>${tableBody}</tbody>
  </table>
  ${summaryHTML}
  <div class="footer">POS Mobile v1.0.0 | ร้านสะดวกซื้อ ABC</div>
</body>
</html>`;
};

/** Print/Share PDF */
export const exportPDF = async (html: string, filename: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
      }
    } else {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Export ${filename}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Print.printAsync({ html });
      }
    }
  } catch (err) {
    console.error('Export PDF error:', err);
    Alert.alert('Export PDF ไม่สำเร็จ', String(err));
  }
};
