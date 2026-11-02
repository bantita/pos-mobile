/**
 * receiptScreen — chrome ของหน้าจอใบเสร็จ/ใบกำกับภาษี/ยกเลิกเอกสาร (ภาษา UI)
 */
export const receiptScreen = {
  reprint: '🔄 พิมพ์ซ้ำ',
  paid: '✅ ชำระเงินสำเร็จ',
  paidDone: 'ชำระเงินเรียบร้อย',
  printing: 'กำลังพิมพ์...',
  printReceipt: 'พิมพ์ใบเสร็จ',
  issueTaxInvoice: 'ออกใบกำกับภาษีเต็มรูป',
  nextSale: 'ขายรายการถัดไป',
  choosePrinter: 'เลือกเครื่องพิมพ์',
  sharePdf: 'แชร์ PDF',
  printDoneTitle: 'พิมพ์สำเร็จ',
  printDoneMsg: 'พิมพ์ใบเสร็จผ่าน {printer} เรียบร้อย',
  taxInvoice: {
    title: 'ใบกำกับภาษีเต็มรูป',
    notFound: 'ไม่พบข้อมูลการขาย',
    buyerInfo: 'ข้อมูลผู้ซื้อ',
    buyerName: 'ชื่อผู้ซื้อ',
    buyerNamePlaceholder: 'ชื่อลูกค้า / บริษัท',
    buyerTaxId: 'เลขประจำตัวผู้เสียภาษี',
    buyerTaxIdPlaceholder: 'เลข 13 หลัก',
    buyerAddress: 'ที่อยู่',
    buyerAddressPlaceholder: 'ที่อยู่สำหรับออกใบกำกับภาษี',
    print: 'พิมพ์ใบกำกับภาษี',
    cancel: 'ยกเลิกใบกำกับภาษี',
    shareTitle: 'ใบกำกับภาษี {no}',
  },
  cancel: {
    title: 'ยกเลิกเอกสาร',
    billNo: 'เลขที่บิล',
    docType: 'ประเภทเอกสาร',
    reasonLabel: 'เหตุผลการยกเลิก',
    reasonPlaceholder: 'ระบุเหตุผลการยกเลิกเอกสาร',
    errReason: 'กรุณากรอกเหตุผลการยกเลิก',
    confirm: 'ยืนยันการยกเลิก',
  },
} as const;
