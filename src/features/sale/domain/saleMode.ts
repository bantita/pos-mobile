/**
 * Sale Mode — วิธีการขายสินค้า
 * button_only   = กดปุ่มเลือกสินค้าเท่านั้น
 * scan_only     = สแกน Barcode เท่านั้น
 * both          = ทั้ง 2 วิธี (default)
 */
export type SaleMode = 'button_only' | 'scan_only' | 'both';

export interface SaleModeConfig {
  mode: SaleMode;
  /** scan_only / both: เปิดกล้องทันทีเมื่อเข้าหน้าขาย */
  autoOpenCamera: boolean;
  /** both: แสดง split view (ซ้าย=ปุ่ม, ขวา=scan) */
  splitView: boolean;
  /** scan_only: เล่นเสียงบี๊ปเมื่อสแกนสำเร็จ */
  beepOnScan: boolean;
  /** แสดง product grid ขนาด: small | medium | large */
  gridSize: 'small' | 'medium' | 'large';
  /** จำนวนคอลัมน์ใน grid */
  gridColumns: 2 | 3 | 4;
}

export const DEFAULT_SALE_MODE_CONFIG: SaleModeConfig = {
  mode: 'both',
  autoOpenCamera: false,
  splitView: false,
  beepOnScan: true,
  gridSize: 'medium',
  gridColumns: 3,
};
