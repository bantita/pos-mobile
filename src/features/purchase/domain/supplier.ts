export interface Supplier {
  id: string;
  name: string;
  supplierCode?: string;
  code?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  isActive?: boolean;
  shopId?: string;
  createdAt?: string;
  purchaseCount?: number;
  totalPurchases?: number;
}
