/**
 * common — ข้อความพื้นฐานที่ใช้ร่วมกันทุกหน้าจอ (ภาษาไทย = แหล่งความจริง)
 */
export const common = {
  save: 'บันทึก',
  cancel: 'ยกเลิก',
  confirm: 'ยืนยัน',
  close: 'ปิด',
  back: 'ย้อนกลับ',
  loading: 'กำลังโหลด...',
  error: 'เกิดข้อผิดพลาด',
  errorTitle: 'เกิดข้อผิดพลาด',
  noData: 'ไม่มีข้อมูล',
  retry: 'ลองใหม่',
  search: 'ค้นหา',
  langShort: {
    th: 'TH',
    en: 'EN',
  },
  docType: {
    receipt: 'ใบเสร็จรับเงิน',
    taxShort: 'ใบกำกับภาษีอย่างย่อ',
    taxFull: 'ใบกำกับภาษี',
  },
} as const;
