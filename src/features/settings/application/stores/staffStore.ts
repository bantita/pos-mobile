/**
 * Staff Store — Technician/staff CRUD for SERVICE store type
 * Zustand + Persist — keeps same exported function API for backward compatibility
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Technician } from '@/features/settings/domain/store';
import { persistStorage } from '@/shared/infrastructure/storage/persistStorage';

interface StaffState {
  technicians: Technician[];
}

const useStaffStore = create<StaffState>()(
  persist(
    () => ({
      technicians: [] as Technician[],
    }),
    { name: 'pos-staff', storage: createJSONStorage(() => persistStorage) }
  )
);

export function getTechnicians(): Technician[] { return [...useStaffStore.getState().technicians]; }

export function getAvailableTechnicians(): Technician[] {
  return useStaffStore.getState().technicians.filter(t => t.status === 'available');
}

export function getTechnician(id: string): Technician | undefined {
  return useStaffStore.getState().technicians.find(t => t.id === id);
}

export function addTechnician(data: Omit<Technician, 'id'>): Technician {
  const tech: Technician = { ...data, id: `tech-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  useStaffStore.setState(s => ({ technicians: [...s.technicians, tech] }));
  return tech;
}

export function updateTechnician(id: string, updates: Partial<Omit<Technician, 'id'>>): void {
  useStaffStore.setState(s => ({
    technicians: s.technicians.map(t => t.id === id ? { ...t, ...updates } : t),
  }));
}

export function deleteTechnician(id: string): void {
  useStaffStore.setState(s => ({
    technicians: s.technicians.filter(t => t.id !== id),
  }));
}

export function setTechnicians(techs: Technician[]): void {
  useStaffStore.setState({ technicians: [...techs] });
}

export function resetStaffStore(): void {
  useStaffStore.setState({ technicians: [] });
}
