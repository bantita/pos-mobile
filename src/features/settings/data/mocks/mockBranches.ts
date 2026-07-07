/**
 * Mock Branches Data — Demo data for RETAIL and ENTERPRISE store types
 */
import { Branch, Terminal } from '@/features/settings/domain/store';

// RETAIL Demo: 2 terminals in single store
export const MOCK_RETAIL_TERMINALS: Terminal[] = [
  { id: 'terminal-r1', name: 'จุดขาย 1 (หน้าร้าน)', status: 'active' },
  { id: 'terminal-r2', name: 'จุดขาย 2 (หลังร้าน)', status: 'active' },
];

// ENTERPRISE Demo: 3 branches × 2 terminals = 6 total
export const MOCK_BRANCHES: Branch[] = [
  { id: 'branch-001', name: 'สาขาสยาม', address: '999 ถ.พระราม 1 ปทุมวัน กรุงเทพฯ', contactPhone: '02-111-1111' },
  { id: 'branch-002', name: 'สาขาเซ็นทรัลเวิลด์', address: '4 ถ.ราชดำริ ปทุมวัน กรุงเทพฯ', contactPhone: '02-222-2222' },
  { id: 'branch-003', name: 'สาขาเมกาบางนา', address: '39 ถ.บางนา-ตราด บางพลี สมุทรปราการ', contactPhone: '02-333-3333' },
];

export const MOCK_ENTERPRISE_TERMINALS: Terminal[] = [
  { id: 'terminal-e1', branchId: 'branch-001', name: 'POS 1', status: 'active' },
  { id: 'terminal-e2', branchId: 'branch-001', name: 'POS 2', status: 'active' },
  { id: 'terminal-e3', branchId: 'branch-002', name: 'POS 1', status: 'active' },
  { id: 'terminal-e4', branchId: 'branch-002', name: 'POS 2', status: 'active' },
  { id: 'terminal-e5', branchId: 'branch-003', name: 'POS 1', status: 'active' },
  { id: 'terminal-e6', branchId: 'branch-003', name: 'POS 2', status: 'inactive' },
];
