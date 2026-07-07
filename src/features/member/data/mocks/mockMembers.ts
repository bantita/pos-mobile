import {
  Member, PointTransaction, PointConfig,
  MemberLevelConfig, CustomerSegment, Campaign,
  MemberPurchaseHistory, MemberWallet, WalletTransaction,
} from '@/features/member/domain/member';

// ==================== Mock Members ====================

export const MOCK_MEMBERS: Member[] = [
  {
    id: 'mem-001', memberNo: 'MEM-000101', phone: '081-234-5678',
    name: 'สมชาย วงศ์สุข', birthday: '1990-03-15', level: 'gold',
    pointBalance: 1250, totalSpent: 48500, joinDate: '2025-06-10',
    isActive: true, shopId: 'shop-01', branchId: 'b1',
    email: 'somchai@email.com', status: 'active', totalBills: 24,
    lastPurchaseDate: '2026-02-15', gender: 'male',
  },
  {
    id: 'mem-002', memberNo: 'MEM-000102', phone: '089-876-5432',
    name: 'สุภาพร แสงทอง', birthday: '1985-08-22', level: 'platinum',
    pointBalance: 3420, totalSpent: 125000, joinDate: '2025-01-05',
    isActive: true, shopId: 'shop-01', branchId: 'b1',
    email: 'supaporn@email.com', status: 'active', totalBills: 58,
    lastPurchaseDate: '2026-02-18', gender: 'female',
  },
  {
    id: 'mem-003', memberNo: 'MEM-000103', phone: '062-345-6789',
    name: 'วิชัย กิจเจริญ', birthday: '1992-11-30', level: 'silver',
    pointBalance: 320, totalSpent: 12800, joinDate: '2025-09-18',
    isActive: true, shopId: 'shop-01', branchId: 'b1',
    status: 'active', totalBills: 8, lastPurchaseDate: '2026-02-16', gender: 'male',
  },
  {
    id: 'mem-004', memberNo: 'MEM-000104', phone: '084-567-8901',
    name: 'นภา ศรีสว่าง', birthday: '1988-05-07', level: 'gold',
    pointBalance: 890, totalSpent: 56200, joinDate: '2025-04-22',
    isActive: true, shopId: 'shop-01', branchId: 'b1',
    email: 'napa@email.com', status: 'active', totalBills: 32,
    lastPurchaseDate: '2026-02-19', gender: 'female',
  },
  {
    id: 'mem-005', memberNo: 'MEM-000105', phone: '095-123-4567',
    name: 'ธนา พัฒนกุล', birthday: '1995-01-20', level: 'silver',
    pointBalance: 150, totalSpent: 8900, joinDate: '2025-11-02',
    isActive: true, shopId: 'shop-01', branchId: 'b2',
    status: 'active', totalBills: 5, lastPurchaseDate: '2026-02-09', gender: 'male',
  },
  {
    id: 'mem-006', memberNo: 'MEM-000106', phone: '086-789-0123',
    name: 'พิมพ์ชนก อุดมทรัพย์', birthday: '1993-07-14', level: 'gold',
    pointBalance: 2100, totalSpent: 72000, joinDate: '2025-03-08',
    isActive: true, shopId: 'shop-01', branchId: 'b1',
    email: 'pimchanok@email.com', status: 'active', totalBills: 38,
    lastPurchaseDate: '2026-02-17', gender: 'female',
  },
  {
    id: 'mem-007', memberNo: 'MEM-000107', phone: '083-456-7890',
    name: 'อนุชา รัตนโชติ', birthday: '1987-12-03', level: 'platinum',
    pointBalance: 4500, totalSpent: 189000, joinDate: '2025-01-15',
    isActive: true, shopId: 'shop-01', branchId: 'b2',
    email: 'anucha@email.com', status: 'active', totalBills: 72,
    lastPurchaseDate: '2026-02-20', gender: 'male',
  },
  {
    id: 'mem-008', memberNo: 'MEM-000108', phone: '091-234-5678',
    name: 'กัญญา ลิ้มประเสริฐ', birthday: '1998-09-25', level: 'member',
    pointBalance: 80, totalSpent: 4200, joinDate: '2026-01-10',
    isActive: true, shopId: 'shop-01', branchId: 'b1',
    status: 'active', totalBills: 3, lastPurchaseDate: '2026-02-21', gender: 'female',
  },
  {
    id: 'mem-009', memberNo: 'MEM-000109', phone: '087-890-1234',
    name: 'ปรีชา สมบูรณ์ดี', birthday: '1982-04-18', level: 'member',
    pointBalance: 0, totalSpent: 3500, joinDate: '2026-02-05',
    isActive: false, shopId: 'shop-01', branchId: 'b1',
    status: 'suspended', totalBills: 2, gender: 'male',
  },
  {
    id: 'mem-010', memberNo: 'MEM-000110', phone: '096-567-8901',
    name: 'ดวงใจ เพชรประดับ', birthday: '1991-06-29', level: 'gold',
    pointBalance: 1680, totalSpent: 63000, joinDate: '2025-05-20',
    isActive: true, shopId: 'shop-01', branchId: 'b2',
    email: 'duangjai@email.com', status: 'active', totalBills: 35,
    lastPurchaseDate: '2026-02-19', gender: 'female',
  },
  {
    id: 'mem-011', memberNo: 'MEM-000111', phone: '082-111-2233',
    name: 'วีระ จันทร์แก้ว', birthday: '1980-02-14', level: 'vip',
    pointBalance: 8200, totalSpent: 320000, joinDate: '2024-06-01',
    isActive: true, shopId: 'shop-01', branchId: 'b1',
    email: 'weera@email.com', status: 'active', totalBills: 120,
    lastPurchaseDate: '2026-02-22', gender: 'male',
  },
  {
    id: 'mem-012', memberNo: 'MEM-000112', phone: '093-444-5566',
    name: 'รัชนี ทองดี', birthday: '1994-10-08', level: 'member',
    pointBalance: 45, totalSpent: 2100, joinDate: '2026-02-15',
    isActive: true, shopId: 'shop-01', branchId: 'b1',
    status: 'active', totalBills: 1, lastPurchaseDate: '2026-02-15', gender: 'female',
  },
];

// ==================== Mock Point Transactions ====================

export const MOCK_POINT_TRANSACTIONS: PointTransaction[] = [
  {
    id: 'pt-001', memberId: 'mem-001', type: 'earn', points: 120,
    balanceAfter: 1250, refType: 'sale', refNo: 'INV-2602-0045',
    description: 'สะสมคะแนนจากยอดซื้อ 3,000 บาท', createdAt: '2026-02-15T10:30:00Z', createdBy: 'สมชาย ใจดี',
  },
  {
    id: 'pt-002', memberId: 'mem-001', type: 'earn', points: 80,
    balanceAfter: 1130, refType: 'sale', refNo: 'INV-2602-0038',
    description: 'สะสมคะแนนจากยอดซื้อ 2,000 บาท', createdAt: '2026-02-10T14:20:00Z', createdBy: 'สมหญิง รักดี',
  },
  {
    id: 'pt-003', memberId: 'mem-001', type: 'redeem', points: -200,
    balanceAfter: 1050, refType: 'sale', refNo: 'INV-2601-0120',
    description: 'แลกคะแนนเป็นส่วนลด 200 บาท', createdAt: '2026-01-28T16:45:00Z', createdBy: 'สมชาย ใจดี',
  },
  {
    id: 'pt-004', memberId: 'mem-002', type: 'earn', points: 200,
    balanceAfter: 3420, refType: 'sale', refNo: 'INV-2602-0052',
    description: 'สะสมคะแนนจากยอดซื้อ 5,000 บาท', createdAt: '2026-02-18T09:15:00Z', createdBy: 'สมชาย ใจดี',
  },
  {
    id: 'pt-005', memberId: 'mem-002', type: 'earn', points: 160,
    balanceAfter: 3220, refType: 'sale', refNo: 'INV-2602-0041',
    description: 'สะสมคะแนนจากยอดซื้อ 4,000 บาท', createdAt: '2026-02-12T11:00:00Z', createdBy: 'สมหญิง รักดี',
  },
  {
    id: 'pt-006', memberId: 'mem-002', type: 'redeem', points: -500,
    balanceAfter: 3060, refType: 'sale', refNo: 'INV-2601-0098',
    description: 'แลกคะแนนเป็นส่วนลด 500 บาท', createdAt: '2026-01-20T13:30:00Z', createdBy: 'มานะ ขยัน',
  },
  {
    id: 'pt-007', memberId: 'mem-003', type: 'earn', points: 40,
    balanceAfter: 320, refType: 'sale', refNo: 'INV-2602-0048',
    description: 'สะสมคะแนนจากยอดซื้อ 1,000 บาท', createdAt: '2026-02-16T15:10:00Z', createdBy: 'สมชาย ใจดี',
  },
  {
    id: 'pt-008', memberId: 'mem-007', type: 'earn', points: 320,
    balanceAfter: 4500, refType: 'sale', refNo: 'INV-2602-0058',
    description: 'สะสมคะแนนจากยอดซื้อ 8,000 บาท', createdAt: '2026-02-20T10:00:00Z', createdBy: 'มานะ ขยัน',
  },
  {
    id: 'pt-009', memberId: 'mem-007', type: 'redeem', points: -1000,
    balanceAfter: 4180, refType: 'sale', refNo: 'INV-2601-0085',
    description: 'แลกคะแนนเป็นส่วนลด 1,000 บาท', createdAt: '2026-01-15T16:00:00Z', createdBy: 'สมหญิง รักดี',
  },
  {
    id: 'pt-010', memberId: 'mem-006', type: 'expire', points: -300,
    balanceAfter: 1920, refType: 'system', refNo: 'SYS-EXP-20260201',
    description: 'คะแนนหมดอายุ (สะสมก่อน 2025-02-01)', expireDate: '2026-02-01',
    createdAt: '2026-02-01T00:00:00Z', createdBy: 'system',
  },
];

// ==================== Mock Point Config ====================

export const MOCK_POINT_CONFIG: PointConfig = {
  earnRate: 25,
  redeemRate: 1,
  minRedeemPoints: 50,
  pointExpireDays: 365,
};

// ==================== Mock Level Configs ====================

export const MOCK_LEVEL_CONFIGS: MemberLevelConfig[] = [
  { level: 'member', label: 'Member', minSpent: 0, minBills: 0, discountPercent: 0, earnMultiplier: 1, expireDays: 0, color: '#a3a3a3' },
  { level: 'silver', label: 'Silver', minSpent: 5000, minBills: 3, discountPercent: 2, earnMultiplier: 1, expireDays: 365, color: '#64748b' },
  { level: 'gold', label: 'Gold', minSpent: 30000, minBills: 15, discountPercent: 5, earnMultiplier: 1.5, expireDays: 365, color: '#eab308' },
  { level: 'platinum', label: 'Platinum', minSpent: 100000, minBills: 40, discountPercent: 8, earnMultiplier: 2, expireDays: 730, color: '#6366f1' },
  { level: 'vip', label: 'VIP', minSpent: 250000, minBills: 80, discountPercent: 12, earnMultiplier: 3, expireDays: 0, color: '#c026d3' },
];

// ==================== Mock Segments ====================

export const MOCK_SEGMENTS: CustomerSegment[] = [
  {
    id: 'seg-001', name: 'ลูกค้าใหม่', description: 'สมัครภายใน 30 วัน',
    conditions: [{ field: 'joinDate', operator: 'daysAgo', value: 30 }],
    memberCount: 3, createdAt: '2026-01-01',
  },
  {
    id: 'seg-002', name: 'ลูกค้าประจำ', description: 'ซื้อมากกว่า 10 บิล',
    conditions: [{ field: 'totalBills', operator: 'gt', value: 10 }],
    memberCount: 7, createdAt: '2026-01-01',
  },
  {
    id: 'seg-003', name: 'VIP', description: 'ยอดซื้อมากกว่า 200,000 บาท',
    conditions: [{ field: 'totalSpent', operator: 'gt', value: 200000 }],
    memberCount: 2, createdAt: '2026-01-01',
  },
  {
    id: 'seg-004', name: 'ไม่ซื้อ 30+ วัน', description: 'ไม่มียอดซื้อเกิน 30 วัน',
    conditions: [{ field: 'lastPurchaseDate', operator: 'daysAgo', value: 30 }],
    memberCount: 1, createdAt: '2026-01-15',
  },
  {
    id: 'seg-005', name: 'วันเกิดเดือนนี้', description: 'สมาชิกที่มีวันเกิดในเดือนปัจจุบัน',
    conditions: [{ field: 'birthday', operator: 'eq', value: 'current_month' }],
    memberCount: 2, createdAt: '2026-01-01',
  },
  {
    id: 'seg-006', name: 'Gold ขึ้นไป', description: 'ระดับ Gold, Platinum, VIP',
    conditions: [{ field: 'level', operator: 'in', value: ['gold', 'platinum', 'vip'] }],
    memberCount: 8, createdAt: '2026-01-01',
  },
];

// ==================== Mock Campaigns ====================

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-001', name: 'โปรวันเกิด กุมภาพันธ์', description: 'ส่วนลด 20% สำหรับสมาชิกวันเกิดเดือน ก.พ.',
    channel: 'sms', segmentId: 'seg-005', status: 'sent',
    scheduledAt: '2026-02-01T08:00:00Z', sentAt: '2026-02-01T08:05:00Z',
    targetCount: 15, sentCount: 15, openCount: 12,
    message: 'สุขสันต์วันเกิด! รับส่วนลด 20% ตลอดเดือนเกิด ใช้โค้ด BDAY20',
    createdAt: '2026-01-28', createdBy: 'แอดมิน',
  },
  {
    id: 'camp-002', name: 'กระตุ้นลูกค้าหาย', description: 'คูปองส่วนลดสำหรับลูกค้าที่หายไป 30 วัน',
    channel: 'line', segmentId: 'seg-004', status: 'completed',
    scheduledAt: '2026-01-15T10:00:00Z', sentAt: '2026-01-15T10:02:00Z',
    targetCount: 8, sentCount: 8, openCount: 5,
    message: 'คิดถึงคุณ! รับคูปองส่วนลด 100 บาท เมื่อซื้อครบ 500 บาท',
    createdAt: '2026-01-12', createdBy: 'แอดมิน',
  },
  {
    id: 'camp-003', name: 'แจ้ง VIP สินค้าใหม่', description: 'แจ้งลูกค้า VIP เรื่องสินค้าใหม่',
    channel: 'email', segmentId: 'seg-003', status: 'scheduled',
    scheduledAt: '2026-03-01T09:00:00Z',
    targetCount: 2, sentCount: 0, openCount: 0,
    message: 'สินค้าใหม่เข้าร้านแล้ว! พิเศษสำหรับ VIP ลด 15% ก่อนใคร',
    createdAt: '2026-02-20', createdBy: 'แอดมิน',
  },
  {
    id: 'camp-004', name: 'แคมเปญ Double Points', description: 'คะแนน x2 ทุกการซื้อสัปดาห์หน้า',
    channel: 'push', segmentId: 'seg-002', status: 'draft',
    targetCount: 45, sentCount: 0, openCount: 0,
    message: 'สัปดาห์พิเศษ! รับคะแนนสะสม x2 ทุกการซื้อ 1-7 มี.ค. 2569',
    createdAt: '2026-02-22', createdBy: 'แอดมิน',
  },
  {
    id: 'camp-005', name: 'ขอบคุณลูกค้าประจำ', description: 'ขอบคุณลูกค้าที่ซื้อครบ 50 บิล',
    channel: 'sms', segmentId: 'seg-002', status: 'sent',
    sentAt: '2026-02-10T09:00:00Z',
    targetCount: 5, sentCount: 5, openCount: 4,
    message: 'ขอบคุณที่เป็นลูกค้าประจำ! รับของขวัญพิเศษได้ที่สาขา',
    createdAt: '2026-02-08', createdBy: 'แอดมิน',
  },
];

// ==================== Mock Purchase History ====================

export const MOCK_PURCHASE_HISTORY: MemberPurchaseHistory[] = [
  {
    id: 'ph-001', memberId: 'mem-001', saleNo: 'INV-2602-0045', date: '2026-02-15',
    branchName: 'สาขาสยาม', posName: 'POS-01', cashierName: 'สมชาย ใจดี',
    items: [
      { productName: 'กาแฟดริป อาราบิก้า', qty: 2, price: 180 },
      { productName: 'ครัวซองต์เนยสด', qty: 3, price: 195 },
    ],
    subtotal: 375, discount: 0, grandTotal: 375, pointsEarned: 15, pointsUsed: 0, paymentMethod: 'เงินสด',
  },
  {
    id: 'ph-002', memberId: 'mem-001', saleNo: 'INV-2602-0038', date: '2026-02-10',
    branchName: 'สาขาสยาม', posName: 'POS-02', cashierName: 'สมหญิง รักดี',
    items: [
      { productName: 'ชาเขียวมัทฉะ', qty: 1, price: 75 },
      { productName: 'เค้กช็อกโกแลต', qty: 1, price: 120 },
      { productName: 'น้ำส้มคั้นสด', qty: 2, price: 100 },
    ],
    subtotal: 295, discount: 15, grandTotal: 280, pointsEarned: 11, pointsUsed: 0, paymentMethod: 'บัตรเครดิต',
  },
  {
    id: 'ph-003', memberId: 'mem-002', saleNo: 'INV-2602-0052', date: '2026-02-18',
    branchName: 'สาขาสยาม', posName: 'POS-01', cashierName: 'สมชาย ใจดี',
    items: [
      { productName: 'เซ็ตอาหารกลางวัน A', qty: 2, price: 500 },
      { productName: 'น้ำดื่ม', qty: 2, price: 40 },
    ],
    subtotal: 540, discount: 43, grandTotal: 497, pointsEarned: 20, pointsUsed: 0, paymentMethod: 'QR Payment',
  },
  {
    id: 'ph-004', memberId: 'mem-002', saleNo: 'INV-2602-0041', date: '2026-02-12',
    branchName: 'สาขาอารีย์', posName: 'POS-01', cashierName: 'มานะ ขยัน',
    items: [
      { productName: 'สเต๊กหมู', qty: 1, price: 289 },
      { productName: 'สลัดซีซ่าร์', qty: 1, price: 159 },
      { productName: 'ชานมไข่มุก', qty: 2, price: 140 },
    ],
    subtotal: 588, discount: 47, grandTotal: 541, pointsEarned: 22, pointsUsed: 0, paymentMethod: 'เงินสด',
  },
  {
    id: 'ph-005', memberId: 'mem-007', saleNo: 'INV-2602-0058', date: '2026-02-20',
    branchName: 'สาขาทองหล่อ', posName: 'POS-01', cashierName: 'มานะ ขยัน',
    items: [
      { productName: 'ไวน์แดง Chateau Margaux', qty: 1, price: 4500 },
      { productName: 'ชีสเพลท', qty: 1, price: 890 },
    ],
    subtotal: 5390, discount: 431, grandTotal: 4959, pointsEarned: 198, pointsUsed: 0, paymentMethod: 'บัตรเครดิต',
  },
  {
    id: 'ph-006', memberId: 'mem-011', saleNo: 'INV-2602-0061', date: '2026-02-22',
    branchName: 'สาขาสยาม', posName: 'POS-01', cashierName: 'สมชาย ใจดี',
    items: [
      { productName: 'กระเป๋าหนังแท้', qty: 1, price: 8900 },
      { productName: 'เข็มขัดหนัง', qty: 1, price: 2500 },
    ],
    subtotal: 11400, discount: 1368, grandTotal: 10032, pointsEarned: 401, pointsUsed: 0, paymentMethod: 'บัตรเครดิต',
  },
  {
    id: 'ph-007', memberId: 'mem-004', saleNo: 'INV-2602-0055', date: '2026-02-19',
    branchName: 'สาขาสยาม', posName: 'POS-02', cashierName: 'สมหญิง รักดี',
    items: [
      { productName: 'เสื้อโปโล', qty: 2, price: 1580 },
      { productName: 'กางเกงขาสั้น', qty: 1, price: 890 },
    ],
    subtotal: 2470, discount: 123, grandTotal: 2347, pointsEarned: 94, pointsUsed: 0, paymentMethod: 'เงินสด',
  },
  {
    id: 'ph-008', memberId: 'mem-006', saleNo: 'INV-2602-0050', date: '2026-02-17',
    branchName: 'สาขาสยาม', posName: 'POS-01', cashierName: 'สมชาย ใจดี',
    items: [
      { productName: 'ครีมบำรุงผิว', qty: 1, price: 1290 },
      { productName: 'เซรั่มวิตามินซี', qty: 1, price: 890 },
      { productName: 'โฟมล้างหน้า', qty: 2, price: 380 },
    ],
    subtotal: 2560, discount: 128, grandTotal: 2432, pointsEarned: 97, pointsUsed: 50, paymentMethod: 'QR Payment',
  },
  {
    id: 'ph-009', memberId: 'mem-010', saleNo: 'INV-2602-0056', date: '2026-02-19',
    branchName: 'สาขาทองหล่อ', posName: 'POS-01', cashierName: 'มานะ ขยัน',
    items: [
      { productName: 'รองเท้าผ้าใบ', qty: 1, price: 2990 },
    ],
    subtotal: 2990, discount: 150, grandTotal: 2840, pointsEarned: 114, pointsUsed: 0, paymentMethod: 'เงินสด',
  },
  {
    id: 'ph-010', memberId: 'mem-005', saleNo: 'INV-2602-0033', date: '2026-02-09',
    branchName: 'สาขาอารีย์', posName: 'POS-01', cashierName: 'มานะ ขยัน',
    items: [
      { productName: 'หูฟังบลูทูธ', qty: 1, price: 1490 },
    ],
    subtotal: 1490, discount: 0, grandTotal: 1490, pointsEarned: 60, pointsUsed: 0, paymentMethod: 'บัตรเครดิต',
  },
];

// ==================== Mock Wallets ====================

export const MOCK_WALLETS: MemberWallet[] = [
  { memberId: 'mem-001', balance: 2500, lastTopUpDate: '2026-02-10' },
  { memberId: 'mem-002', balance: 8900, lastTopUpDate: '2026-02-18' },
  { memberId: 'mem-011', balance: 15000, lastTopUpDate: '2026-02-22' },
];

// ==================== Mock Wallet Transactions ====================

export const MOCK_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'wt-001', memberId: 'mem-001', type: 'topup', amount: 3000,
    balanceAfter: 3000, description: 'เติมเงิน', createdAt: '2026-02-10T09:00:00Z', createdBy: 'สมชาย ใจดี',
  },
  {
    id: 'wt-002', memberId: 'mem-001', type: 'payment', amount: -500,
    balanceAfter: 2500, refNo: 'INV-2602-0045', description: 'ชำระค่าสินค้า',
    createdAt: '2026-02-15T10:30:00Z', createdBy: 'สมชาย ใจดี',
  },
  {
    id: 'wt-003', memberId: 'mem-002', type: 'topup', amount: 10000,
    balanceAfter: 10000, description: 'เติมเงิน', createdAt: '2026-02-01T14:00:00Z', createdBy: 'แคชเชียร์',
  },
  {
    id: 'wt-004', memberId: 'mem-002', type: 'payment', amount: -1100,
    balanceAfter: 8900, refNo: 'INV-2602-0052', description: 'ชำระค่าสินค้า',
    createdAt: '2026-02-18T09:15:00Z', createdBy: 'สมชาย ใจดี',
  },
  {
    id: 'wt-005', memberId: 'mem-011', type: 'topup', amount: 20000,
    balanceAfter: 20000, description: 'เติมเงิน VIP', createdAt: '2026-02-01T10:00:00Z', createdBy: 'แอดมิน',
  },
  {
    id: 'wt-006', memberId: 'mem-011', type: 'payment', amount: -5000,
    balanceAfter: 15000, refNo: 'INV-2602-0061', description: 'ชำระค่าสินค้า',
    createdAt: '2026-02-22T11:00:00Z', createdBy: 'สมชาย ใจดี',
  },
];
