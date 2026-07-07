import { clearPersistedState } from '@/shared/infrastructure/storage/persistStorage';

/** Clears persisted data and resets business stores without synchronous SQLite calls. */
export async function resetBusinessDataForNewStore(): Promise<void> {
  await clearPersistedState();

  const [member, employee, saleHistory, purchase, promo, sync] = await Promise.all([
    import('@/features/member/application/stores/memberStore'),
    import('@/features/settings/application/stores/employeeStore'),
    import('@/features/sale/application/stores/saleHistoryStore'),
    import('@/features/purchase/application/stores/purchaseStore'),
    import('@/features/promotion/application/stores/promoStore'),
    import('@/features/sync/application/stores/syncStore'),
  ]);

  member.useMemberStore.setState({ members: [], pointTransactions: [] });
  employee.useEmployeeStore.setState({ employees: [], users: [] });
  saleHistory.useSaleHistoryStore.setState({ sales: [] });
  purchase.usePurchaseStore.setState({
    suppliers: [],
    requisitions: [],
    purchaseOrders: [],
    receives: [],
  });
  promo.usePromoStore.setState({ promotions: [], couponUsages: [] });
  sync.useSyncStore.setState({
    transactions: [],
    devices: [],
    isSyncing: false,
    lastSyncAt: null,
  });
}
