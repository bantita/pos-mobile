/**
 * Mock Staff Data — Demo technicians for SERVICE store "ร้านตัดผม Demo"
 */
import { Technician } from '../types/store';

export const MOCK_TECHNICIANS: Technician[] = [
  { id: 'tech-001', name: 'ช่างเอ (สมชาย)', position: 'ช่างตัดผม', status: 'available' },
  { id: 'tech-002', name: 'ช่างบี (สมหญิง)', position: 'ช่างทำเล็บ/สปา', status: 'available' },
  { id: 'tech-003', name: 'ช่างซี (ประเสริฐ)', position: 'ช่างตัดผม', status: 'unavailable' },
];
