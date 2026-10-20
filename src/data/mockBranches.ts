/**
 * Mock Branches Data — Demo data for RETAIL and ENTERPRISE store types
 */
import { Branch, Terminal } from '../types/store';

// RETAIL Demo: 2 terminals in single store
export const MOCK_RETAIL_TERMINALS: Terminal[] = [
  { id: 'terminal-r1', name: 'จุดขาย 1 (หน้าร้าน)', status: 'active' },
  { id: 'terminal-r2', name: 'จุดขาย 2 (หลังร้าน)', status: 'active' },
];

// ENTERPRISE Demo: 3 branches × 2 terminals = 6 total
export const MOCK_BRANCHES: Branch[] = [
  { id: 'b1', name: 'สาขาหลัก', address: '999 ถ.พระราม 1 ปทุมวัน กรุงเทพฯ', contactPhone: '02-111-1111' },
  { id: 'b2', name: 'สาขา 1', address: '4 ถ.ราชดำริ ปทุมวัน กรุงเทพฯ', contactPhone: '02-222-2222' },
  { id: 'b3', name: 'สาขา เชียงใหม่', address: '39 ถ.บางนา-ตราด บางพลี สมุทรปราการ', contactPhone: '02-333-3333' },
];

export const MOCK_ENTERPRISE_TERMINALS: Terminal[] = [
  { id: 'terminal-e1', branchId: 'b1', name: 'POS 1', status: 'active' },
  { id: 'terminal-e2', branchId: 'b1', name: 'POS 2', status: 'active' },
  { id: 'terminal-e3', branchId: 'b2', name: 'POS 1', status: 'active' },
  { id: 'terminal-e4', branchId: 'b2', name: 'POS 2', status: 'active' },
  { id: 'terminal-e5', branchId: 'b3', name: 'POS 1', status: 'active' },
  { id: 'terminal-e6', branchId: 'b3', name: 'POS 2', status: 'inactive' },
];
