/**
 * Store Features — Feature gating based on store type
 */
import { StoreType } from '@/features/settings/domain/store';

export interface StoreFeatureSet {
  staffManagement: boolean;
  staffPopup: boolean;
  terminalManagement: boolean;
  branchManagement: boolean;
}

export function getFeaturesByStoreType(type: StoreType): StoreFeatureSet {
  switch (type) {
    case 'SERVICE':
      return { staffManagement: true, staffPopup: true, terminalManagement: false, branchManagement: false };
    case 'RETAIL':
      return { staffManagement: false, staffPopup: false, terminalManagement: true, branchManagement: false };
    case 'ENTERPRISE':
      return { staffManagement: false, staffPopup: false, terminalManagement: true, branchManagement: true };
    default:
      return { staffManagement: false, staffPopup: false, terminalManagement: false, branchManagement: false };
  }
}
