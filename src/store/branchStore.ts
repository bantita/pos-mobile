/**
 * Branch Store — Branch and Terminal CRUD for RETAIL/ENTERPRISE
 * Zustand + Persist — keeps same exported function API for backward compatibility
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Branch, Terminal } from '../types/store';
import { persistStorage } from './persistStorage';

interface BranchState {
  branches: Branch[];
  terminals: Terminal[];
}

const useBranchStore = create<BranchState>()(
  persist(
    () => ({
      branches: [] as Branch[],
      terminals: [] as Terminal[],
    }),
    { name: 'pos-branches', storage: createJSONStorage(() => persistStorage) }
  )
);

// ─── Branch CRUD ──────────────────────────────────────────────────────────────
export function getBranches(): Branch[] { return [...useBranchStore.getState().branches]; }
export function getBranch(id: string): Branch | undefined { return useBranchStore.getState().branches.find(b => b.id === id); }

export function addBranch(data: Omit<Branch, 'id'>): Branch {
  const branch: Branch = { ...data, id: `branch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  useBranchStore.setState(s => ({ branches: [...s.branches, branch] }));
  return branch;
}

export function updateBranch(id: string, updates: Partial<Omit<Branch, 'id'>>): void {
  useBranchStore.setState(s => ({
    branches: s.branches.map(b => b.id === id ? { ...b, ...updates } : b),
  }));
}

export function deleteBranch(id: string): void {
  useBranchStore.setState(s => ({
    branches: s.branches.filter(b => b.id !== id),
    terminals: s.terminals.filter(t => t.branchId !== id),
  }));
}

// ─── Terminal CRUD ────────────────────────────────────────────────────────────
export function getTerminals(): Terminal[] { return [...useBranchStore.getState().terminals]; }

export function getTerminalsByBranch(branchId: string): Terminal[] {
  return useBranchStore.getState().terminals.filter(t => t.branchId === branchId);
}

export function getRetailTerminals(): Terminal[] {
  return useBranchStore.getState().terminals.filter(t => !t.branchId);
}

export function addTerminal(name: string, branchId?: string): Terminal {
  const terminal: Terminal = {
    id: `terminal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    branchId,
    name,
    status: 'active',
  };
  useBranchStore.setState(s => ({ terminals: [...s.terminals, terminal] }));
  return terminal;
}

export function updateTerminal(id: string, updates: Partial<Omit<Terminal, 'id'>>): void {
  useBranchStore.setState(s => ({
    terminals: s.terminals.map(t => t.id === id ? { ...t, ...updates } : t),
  }));
}

export function deleteTerminal(id: string): void {
  useBranchStore.setState(s => ({
    terminals: s.terminals.filter(t => t.id !== id),
  }));
}

export function setBranches(branches: Branch[]): void {
  useBranchStore.setState({ branches: [...branches] });
}
export function setTerminals(terminals: Terminal[]): void {
  useBranchStore.setState({ terminals: [...terminals] });
}
export function resetBranchStore(): void {
  useBranchStore.setState({ branches: [], terminals: [] });
}
