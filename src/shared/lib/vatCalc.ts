/**
 * VAT Calculation — Per-item and cart-level VAT utilities
 */

export interface VatItem {
  subtotal: number;
  vatRate: number; // 0-100 (e.g. 7 for 7%)
  vatIncluded?: boolean; // true if price already includes VAT
}

/**
 * Calculate VAT for a single item
 */
export function calcItemVat(subtotal: number, vatRate: number, vatIncluded?: boolean): number {
  if (subtotal <= 0 || vatRate <= 0) return 0;
  if (vatIncluded) {
    return subtotal - (subtotal / (1 + vatRate / 100));
  }
  return subtotal * (vatRate / 100);
}

/**
 * Calculate total VAT for all items in cart
 */
export function calcCartVat(items: VatItem[]): number {
  return items.reduce((total, item) => total + calcItemVat(item.subtotal, item.vatRate, item.vatIncluded), 0);
}
