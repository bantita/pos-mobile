import { create } from 'zustand';
import { SaleModeConfig, DEFAULT_SALE_MODE_CONFIG } from '../types/saleMode';

interface SaleModeState extends SaleModeConfig {
  setConfig: (config: Partial<SaleModeConfig>) => void;
  resetConfig: () => void;
}

export const useSaleModeStore = create<SaleModeState>((set) => ({
  ...DEFAULT_SALE_MODE_CONFIG,
  setConfig: (config) => set((state) => ({ ...state, ...config })),
  resetConfig: () => set(DEFAULT_SALE_MODE_CONFIG),
}));
