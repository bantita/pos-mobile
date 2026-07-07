/**
 * CouponExporter — Filter and export coupons to CSV format
 */
import { CouponCode, CouponCampaign, CouponStatus, ExportFilter, ExportRow } from '@/features/coupon/domain/coupon';

/**
 * Apply export filter to coupon codes
 */
export function applyExportFilter(
  codes: CouponCode[],
  filter: ExportFilter,
  campaigns: Map<string, CouponCampaign>,
): ExportRow[] {
  let filtered = codes;

  if (filter.campaignId) {
    filtered = filtered.filter(c => c.campaignId === filter.campaignId);
  }

  if (filter.status && filter.status.length > 0) {
    filtered = filtered.filter(c => filter.status!.includes(c.status));
  }

  if (filter.dateFrom) {
    const from = new Date(filter.dateFrom);
    filtered = filtered.filter(c => new Date(c.createdAt) >= from);
  }

  if (filter.dateTo) {
    const to = new Date(filter.dateTo);
    filtered = filtered.filter(c => new Date(c.createdAt) <= to);
  }

  return filtered.map(c => {
    const campaign = campaigns.get(c.campaignId);
    return {
      couponCode: c.code,
      campaignName: campaign?.name || '-',
      status: c.status,
      expiryDate: c.expiryDate,
      usageDate: c.usageDate || '',
      billNumber: c.billNumber || '',
      customerRef: c.customerId || '',
    };
  });
}

/**
 * Convert export rows to CSV string
 */
export function exportToCSV(rows: ExportRow[]): string {
  const header = 'couponCode,campaignName,status,expiryDate,usageDate,billNumber,customerRef';
  const lines = rows.map(r =>
    `${r.couponCode},${r.campaignName},${r.status},${r.expiryDate},${r.usageDate},${r.billNumber},${r.customerRef}`
  );
  return [header, ...lines].join('\n');
}
