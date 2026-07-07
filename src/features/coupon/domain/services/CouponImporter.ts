/**
 * CouponImporter — Parse CSV and validate import rows
 */
import { CouponCode, CouponStatus, ImportResult, ImportError } from '@/features/coupon/domain/coupon';

/**
 * Parse raw CSV text into rows. Expects header: code,status,expiryDate
 */
export function parseCSV(csvText: string): Array<{ code: string; status: string; expiryDate: string }> {
  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) return [];

  // Skip header row
  const rows: Array<{ code: string; status: string; expiryDate: string }> = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length >= 3 && cols[0]) {
      rows.push({ code: cols[0], status: cols[1] || 'ACTIVE', expiryDate: cols[2] });
    }
  }
  return rows;
}

/**
 * Map Thai or English status labels to CouponStatus enum
 */
function mapStatus(raw: string): CouponStatus {
  const normalized = raw.trim().toUpperCase();
  if (normalized === 'USED' || normalized === 'ใช้แล้ว') return CouponStatus.USED;
  if (normalized === 'EXPIRED' || normalized === 'หมดอายุ') return CouponStatus.EXPIRED;
  if (normalized === 'CANCELLED' || normalized === 'ยกเลิก') return CouponStatus.CANCELLED;
  return CouponStatus.ACTIVE;
}

/**
 * Validate import rows, skip duplicates, and return importable CouponCode objects
 */
export function validateImportRows(
  rows: Array<{ code: string; status: string; expiryDate: string }>,
  existingCodes: Set<string>,
  campaignId: string,
): ImportResult {
  const imported: CouponCode[] = [];
  const skipped: ImportError[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Skip duplicate codes
    if (existingCodes.has(row.code)) {
      skipped.push({ row: i + 2, code: row.code, reason: 'Duplicate code' });
      continue;
    }

    // Validate date
    const expiryDate = row.expiryDate || now;
    const status = mapStatus(row.status);

    imported.push({
      code: row.code,
      campaignId,
      status,
      expiryDate,
      createdAt: now,
      statusHistory: [{ fromStatus: 'NEW', toStatus: status, timestamp: now, actor: 'import' }],
    });

    // Add to existing set to prevent duplicates within same import
    existingCodes.add(row.code);
  }

  return {
    imported,
    skipped,
    summary: {
      total: rows.length,
      imported: imported.length,
      skipped: skipped.length,
      errors: skipped.length,
    },
  };
}
