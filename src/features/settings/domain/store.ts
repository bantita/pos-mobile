/**
 * Store Types — POS Store Type System
 * 2 มิติ: BusinessType (SERVICE/RETAIL) × BusinessScale (BUSINESS/ENTERPRISE)
 */

export type BusinessType = 'SERVICE' | 'RETAIL';
export type BusinessScale = 'BUSINESS' | 'ENTERPRISE';

/** @deprecated ใช้ BusinessType + BusinessScale แทน — คงไว้เพื่อ backward compat */
export type StoreType = 'SERVICE' | 'RETAIL' | 'ENTERPRISE';

export interface ServiceChargeConfig {
  enabled: boolean;
  mode: 'percentage' | 'fixed';
  value: number;
}

export interface StoreConfig {
  storeType: StoreType;
  businessType: BusinessType;
  businessScale: BusinessScale;
  storeName: string;
  serviceCharge: ServiceChargeConfig;
}

export interface Technician {
  id: string;
  name: string;
  position: string;
  status: 'available' | 'unavailable';
  photo?: string;
}

export interface Branch {
  id: string;
  name: string;
  code?: string;
  address: string;
  contactPhone?: string;
  contactEmail?: string;
  isHeadquarter?: boolean;
}

export interface Terminal {
  id: string;
  branchId?: string;
  name: string;
  code?: string;
  status: 'active' | 'inactive';
}
