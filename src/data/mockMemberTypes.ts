import { MemberType } from '../types/memberType';

/** id ของประเภทเริ่มต้น "ลูกค้าทั่วไป" (ใช้ใน migration ของ memberStore) */
export const DEFAULT_MEMBER_TYPE_ID = 'mt-general';
export const DEFAULT_MEMBER_TYPE_NAME = 'ลูกค้าทั่วไป';
/** id ของประเภท "พนักงาน" */
export const STAFF_MEMBER_TYPE_ID = 'mt-staff';
export const STAFF_MEMBER_TYPE_NAME = 'พนักงาน';

export const MOCK_MEMBER_TYPES: MemberType[] = [
  {
    id: DEFAULT_MEMBER_TYPE_ID,
    name: DEFAULT_MEMBER_TYPE_NAME,
    description: 'ลูกค้าทั่วไปที่สมัครสมาชิก',
    color: 'gray',
    discountPercent: 0,
    earnPoints: true,
    pointMultiplier: 1,
    isDefault: true,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: STAFF_MEMBER_TYPE_ID,
    name: STAFF_MEMBER_TYPE_NAME,
    description: 'สมาชิกที่เป็นพนักงานของร้าน',
    color: 'blue',
    discountPercent: 0,
    earnPoints: true,
    pointMultiplier: 1,
    isDefault: false,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];
