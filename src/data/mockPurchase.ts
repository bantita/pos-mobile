import {
  Supplier, PurchaseRequisition, PurchaseOrder, POReceive,
} from '../types/purchase';

// ==================== Mock Suppliers ====================

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    supplierCode: 'SUP-001',
    name: 'บจก. สยามเบเวอเรจ ซัพพลาย',
    contactName: 'คุณวิทยา สุขสมบูรณ์',
    phone: '02-345-6789',
    email: 'supply@siambeverage.co.th',
    address: '123/45 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310',
    taxId: '0105548012345',
    paymentTerms: '30 days',
    isActive: true,
    shopId: 'shop-01',
    createdAt: '2025-06-01',
  },
  {
    id: 'sup-002',
    supplierCode: 'SUP-002',
    name: 'บจก. ไทยสแน็ค ดิสทริบิวเตอร์',
    contactName: 'คุณสมศรี ใจดี',
    phone: '02-567-8901',
    email: 'order@thaisnack.co.th',
    address: '88/9 ถ.บางนา-ตราด กม.5 แขวงบางนา เขตบางนา กรุงเทพฯ 10260',
    taxId: '0105551098765',
    paymentTerms: '15 days',
    isActive: true,
    shopId: 'shop-01',
    createdAt: '2025-07-15',
  },
  {
    id: 'sup-003',
    supplierCode: 'SUP-003',
    name: 'หจก. เจริญทรัพย์ ค้าส่ง',
    contactName: 'คุณประเสริฐ เจริญสุข',
    phone: '089-012-3456',
    email: 'charoensap@gmail.com',
    address: '56/2 ม.3 ต.บางพลี อ.บางพลี จ.สมุทรปราการ 10540',
    taxId: '0105563024680',
    paymentTerms: 'COD',
    isActive: true,
    shopId: 'shop-01',
    createdAt: '2025-09-20',
  },
];

// ==================== Mock Purchase Requisitions ====================

export const MOCK_PURCHASE_REQUISITIONS: PurchaseRequisition[] = [
  {
    id: 'pr-001',
    prNo: 'PR-202602-0001',
    status: 'approved',
    items: [
      {
        productId: 'P001', productName: 'น้ำดื่มสิงห์ 600ml', productCode: 'P001',
        requestQty: 240, unit: 'ขวด', currentStock: 100, minStock: 20,
        estimatedCost: 6, preferredSupplierId: 'sup-001',
      },
      {
        productId: 'P002', productName: 'น้ำอัดลม Pepsi 325ml', productCode: 'P002',
        requestQty: 120, unit: 'กระป๋อง', currentStock: 50, minStock: 10,
        estimatedCost: 9, preferredSupplierId: 'sup-001',
      },
    ],
    reason: 'เติมสต็อกเครื่องดื่มประจำเดือน ก.พ. 2569',
    requestedBy: 'สมชาย ใจดี',
    requestedAt: '2026-02-01T09:00:00Z',
    approvedBy: 'admin',
    approvedAt: '2026-02-01T14:30:00Z',
    shopId: 'shop-01',
    branchId: 'b1',
  },
  {
    id: 'pr-002',
    prNo: 'PR-202602-0002',
    status: 'draft',
    items: [
      {
        productId: 'P006', productName: 'สบู่ Dove ก้อน', productCode: 'P006',
        requestQty: 48, unit: 'ก้อน', currentStock: 3, minStock: 10,
        estimatedCost: 30, preferredSupplierId: 'sup-003',
      },
      {
        productId: 'P007', productName: 'แชมพู Head & Shoulders', productCode: 'P007',
        requestQty: 24, unit: 'ขวด', currentStock: 2, minStock: 5,
        estimatedCost: 65, preferredSupplierId: 'sup-003',
      },
      {
        productId: 'P008', productName: 'โอรีโอ้ช็อกโกแลต', productCode: 'P008',
        requestQty: 60, unit: 'ห่อ', currentStock: 0, minStock: 10,
        estimatedCost: 13, preferredSupplierId: 'sup-002',
      },
    ],
    reason: 'สินค้าใกล้หมด/หมดสต็อก ต้องสั่งเพิ่มด่วน',
    requestedBy: 'สมหญิง รักดี',
    requestedAt: '2026-02-18T11:00:00Z',
    shopId: 'shop-01',
    branchId: 'b1',
  },
];

// ==================== Mock Purchase Orders ====================

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-001',
    poNo: 'PO-202602-0001',
    status: 'partial_receive',
    supplierId: 'sup-001',
    supplierName: 'บจก. สยามเบเวอเรจ ซัพพลาย',
    prId: 'pr-001',
    items: [
      {
        productId: 'P001', productName: 'น้ำดื่มสิงห์ 600ml', productCode: 'P001',
        orderQty: 240, receivedQty: 120, unit: 'ขวด', unitCost: 6, totalCost: 1440,
      },
      {
        productId: 'P002', productName: 'น้ำอัดลม Pepsi 325ml', productCode: 'P002',
        orderQty: 120, receivedQty: 120, unit: 'กระป๋อง', unitCost: 9, totalCost: 1080,
      },
    ],
    subtotal: 2520,
    vatAmount: 176.4,
    grandTotal: 2696.4,
    deliveryDate: '2026-02-10',
    paymentTerms: '30 days',
    notes: 'ส่งงวดแรก 10 ก.พ. งวดที่สอง 20 ก.พ.',
    createdBy: 'admin',
    createdAt: '2026-02-02T10:00:00Z',
    approvedBy: 'admin',
    approvedAt: '2026-02-02T10:30:00Z',
    shopId: 'shop-01',
    branchId: 'b1',
  },
  {
    id: 'po-002',
    poNo: 'PO-202602-0002',
    status: 'approved',
    supplierId: 'sup-002',
    supplierName: 'บจก. ไทยสแน็ค ดิสทริบิวเตอร์',
    items: [
      {
        productId: 'P005', productName: 'เลย์ รสออริจินัล', productCode: 'P005',
        orderQty: 100, receivedQty: 0, unit: 'ถุง', unitCost: 14, totalCost: 1400,
      },
      {
        productId: 'P008', productName: 'โอรีโอ้ช็อกโกแลต', productCode: 'P008',
        orderQty: 60, receivedQty: 0, unit: 'ห่อ', unitCost: 13, totalCost: 780,
      },
    ],
    subtotal: 2180,
    vatAmount: 152.6,
    grandTotal: 2332.6,
    deliveryDate: '2026-02-25',
    paymentTerms: '15 days',
    createdBy: 'admin',
    createdAt: '2026-02-15T09:00:00Z',
    approvedBy: 'admin',
    approvedAt: '2026-02-15T14:00:00Z',
    shopId: 'shop-01',
    branchId: 'b1',
  },
  {
    id: 'po-003',
    poNo: 'PO-202602-0003',
    status: 'draft',
    supplierId: 'sup-003',
    supplierName: 'หจก. เจริญทรัพย์ ค้าส่ง',
    items: [
      {
        productId: 'P006', productName: 'สบู่ Dove ก้อน', productCode: 'P006',
        orderQty: 48, receivedQty: 0, unit: 'ก้อน', unitCost: 30, totalCost: 1440,
      },
      {
        productId: 'P007', productName: 'แชมพู Head & Shoulders', productCode: 'P007',
        orderQty: 24, receivedQty: 0, unit: 'ขวด', unitCost: 65, totalCost: 1560,
      },
    ],
    subtotal: 3000,
    vatAmount: 210,
    grandTotal: 3210,
    deliveryDate: '2026-03-01',
    paymentTerms: 'COD',
    notes: 'รอยืนยันราคากับ supplier',
    createdBy: 'สมหญิง รักดี',
    createdAt: '2026-02-19T15:00:00Z',
    shopId: 'shop-01',
    branchId: 'b1',
  },
];

// ==================== Mock PO Receives ====================

export const MOCK_PO_RECEIVES: POReceive[] = [
  {
    id: 'rcv-001',
    receiveNo: 'RCV-202602-0001',
    poId: 'po-001',
    poNo: 'PO-202602-0001',
    items: [
      {
        productId: 'P001', productName: 'น้ำดื่มสิงห์ 600ml',
        receiveQty: 120, unit: 'ขวด', actualCost: 6,
        lotNo: 'LOT-2602A', expireDate: '2027-02-10',
      },
      {
        productId: 'P002', productName: 'น้ำอัดลม Pepsi 325ml',
        receiveQty: 120, unit: 'กระป๋อง', actualCost: 9,
        lotNo: 'LOT-2602B', expireDate: '2027-01-15',
      },
    ],
    receivedBy: 'สมชาย ใจดี',
    receivedAt: '2026-02-10T08:30:00Z',
    notes: 'รับสินค้างวดแรก ครบตามจำนวน',
  },
  {
    id: 'rcv-002',
    receiveNo: 'RCV-202602-0002',
    poId: 'po-001',
    poNo: 'PO-202602-0001',
    items: [
      {
        productId: 'P001', productName: 'น้ำดื่มสิงห์ 600ml',
        receiveQty: 120, unit: 'ขวด', actualCost: 6,
        lotNo: 'LOT-2602C', expireDate: '2027-02-20',
      },
    ],
    receivedBy: 'สมหญิง รักดี',
    receivedAt: '2026-02-20T09:00:00Z',
    notes: 'รับงวดที่สอง - เฉพาะน้ำดื่มสิงห์',
  },
];
