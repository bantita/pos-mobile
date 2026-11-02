/**
 * payment — การชำระเงิน / วิธีชำระ
 * method.* ตรึงตามถ้อยคำที่พิมพ์บนบิลเว็บปัจจุบัน (design §5.3)
 */
export const payment = {
  method: {
    cash: 'เงินสด',
    transfer: 'โอน',
    qr: 'QR Code',
    credit: 'บัตร',
    wallet: 'Wallet',
    ewallet: 'E-Wallet',
    coupon: 'คูปอง',
  },
  ewalletOther: 'E-Wallet / อื่นๆ',
  memberTypeDiscount: 'ส่วนลด{name} {percent}%',
  couponInvalid: 'คูปองไม่ถูกต้อง',
  title: 'ชำระเงิน',
  confirmPrint: 'ยืนยัน & พิมพ์บิล',
  amountDue: 'ยอดที่ต้องชำระ',
  removeSplit: 'ลบช่องทางนี้',
  paidSoFar: 'ชำระแล้ว:',
  remaining: 'คงเหลือ:',
  chooseMethod: 'เลือกวิธีชำระ:',
  addMethod: 'เพิ่มช่องทาง:',
  amountFor: 'จำนวนเงิน ({method}):',
  amountPlaceholder: 'ใส่จำนวน (คงเหลือ ฿{amount})',
  fullAmount: 'เต็มจำนวน',
  walletBalance: 'Wallet: ฿{amount}',
  change: 'เงินทอน',
  walletNeedMember: 'กรุณาเลือกสมาชิกก่อนชำระผ่าน Wallet',
  walletInsufficient: 'ยอดเงินใน Wallet ไม่เพียงพอ (คงเหลือ ฿{balance}, ต้องชำระ ฿{amount})',
  settings: {
    title: 'ตั้งค่าประเภทชำระเงิน',
    subtitle: 'เพิ่ม/ลบ ประเภทชำระเงินที่ต้องการแสดง',
    defaultTag: 'ค่าเริ่มต้น',
    newPlaceholder: 'ชื่อประเภทชำระใหม่ เช่น Rabbit Card',
    add: 'เพิ่ม',
  },
} as const;
