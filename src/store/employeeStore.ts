/**
 * Employee & User Store — Zustand + Persist
 * จัดการข้อมูลพนักงานและผู้ใช้งาน
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Employee, UserAccount } from '../types/staff';
import { MOCK_EMPLOYEES, MOCK_USERS } from '../data/mockEmployees';
import { persistStorage } from './persistStorage';
import { isFreshStore } from './freshStore';

interface EmployeeState {
  employees: Employee[];
  users: UserAccount[];

  // Employee CRUD
  addEmployee: (emp: Employee) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  getEmployee: (id: string) => Employee | undefined;

  // User CRUD
  addUser: (user: UserAccount) => void;
  updateUser: (id: string, data: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;
  getUserByEmployeeId: (employeeId: string) => UserAccount | undefined;

  // Queries
  getActiveEmployees: () => Employee[];
  getTechnicians: () => Employee[];
  getEmployeesWithoutUser: () => Employee[];
}

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set, get) => ({
  employees: isFreshStore() ? [] : [...MOCK_EMPLOYEES],
  users: isFreshStore() ? [] : [...MOCK_USERS],

  // ─── Employee CRUD ────────────────────────────────────────────────────────
  addEmployee: (emp) =>
    set((s) => ({ employees: [emp, ...s.employees] })),

  updateEmployee: (id, data) =>
    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === id ? { ...e, ...data, updatedAt: new Date() } : e
      ),
    })),

  deleteEmployee: (id) =>
    set((s) => ({
      employees: s.employees.filter((e) => e.id !== id),
      // ลบ user ที่เชื่อมด้วย
      users: s.users.filter((u) => u.employeeId !== id),
    })),

  getEmployee: (id) => get().employees.find((e) => e.id === id),

  // ─── User CRUD ────────────────────────────────────────────────────────────
  addUser: (user) =>
    set((s) => ({ users: [user, ...s.users] })),

  updateUser: (id, data) =>
    set((s) => ({
      users: s.users.map((u) =>
        u.id === id ? { ...u, ...data } : u
      ),
    })),

  deleteUser: (id) =>
    set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

  getUserByEmployeeId: (employeeId) =>
    get().users.find((u) => u.employeeId === employeeId),

  // ─── Queries ──────────────────────────────────────────────────────────────
  getActiveEmployees: () =>
    get().employees.filter((e) => e.status === 'active'),

  getTechnicians: () =>
    get().employees.filter((e) => e.isTechnician && e.status === 'active'),

  getEmployeesWithoutUser: () => {
    const userEmployeeIds = new Set(get().users.map((u) => u.employeeId));
    return get().employees.filter((e) => !userEmployeeIds.has(e.id) && e.status === 'active');
  },
    }),
    {
      name: 'pos-employees',
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({ employees: state.employees, users: state.users }),
    }
  )
);
