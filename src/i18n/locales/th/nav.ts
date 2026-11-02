/**
 * nav — เมนู/แถบนำทาง/บทบาทผู้ใช้
 */
export const nav = {
  logout: 'ออกจากระบบ',
  role: {
    owner: 'เจ้าของร้าน',
    manager: 'ผู้จัดการ',
    cashier: 'แคชเชียร์',
    admin: 'ผู้ดูแลระบบ',
    stock_staff: 'พนักงานคลัง',
    report_viewer: 'ผู้ดูรายงาน',
  },
} as const;
