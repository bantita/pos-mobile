export type DisplayMode =
  | 'idle'              // หน้าจอโฆษณา (ไม่มีลูกค้า)
  | 'cart'              // แสดงรายการสินค้า
  | 'payment_pending'   // รอชำระเงิน
  | 'payment_success';  // ชำระสำเร็จ

export type AdMediaType = 'image' | 'video';

export interface AdMedia {
  id: string;
  type: AdMediaType;
  uri: string;           // URL หรือ local path
  duration: number;      // วินาที ก่อนเลื่อนไปอันถัดไป
  title?: string;
  subtitle?: string;
}

export interface CustomerDisplayState {
  mode: DisplayMode;
  paidAmount: number;
  changeAmount: number;
  shopName: string;
  shopLogo?: string;
}
