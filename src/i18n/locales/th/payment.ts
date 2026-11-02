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
} as const;
