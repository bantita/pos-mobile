import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { PurchaseOrder } from '@/features/purchase/domain/purchase';
import { usePurchaseStore } from '@/features/purchase/application/stores/purchaseStore';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Text, TextInput } from '@/shared/tw/index';

type ReceiveTab = 'pending' | 'history';

interface Props {
  onOpenReceiveForm?: (po: PurchaseOrder) => void;
  onBack: () => void;
}

export const ReceivePOScreen: React.FC<Props> = ({ onOpenReceiveForm, onBack }) => {
  const { purchaseOrders } = usePurchaseStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ReceiveTab>('pending');

  const pendingOrders = useMemo(() => {
    const raw = purchaseOrders.filter((po) => po.status === 'approved' || po.status === 'partial_receive');
    if (!search.trim()) return raw;
    const q = search.toLowerCase();
    return raw.filter(
      (po) =>
        po.poNo.toLowerCase().includes(q) ||
        (po.supplierName ?? '').toLowerCase().includes(q),
    );
  }, [purchaseOrders, search]);

  const historyOrders = useMemo(() => {
    const raw = purchaseOrders.filter((po) => po.status === 'completed');
    if (!search.trim()) return raw;
    const q = search.toLowerCase();
    return raw.filter(
      (po) =>
        po.poNo.toLowerCase().includes(q) ||
        (po.supplierName ?? '').toLowerCase().includes(q),
    );
  }, [purchaseOrders, search]);

  const renderPO = (po: PurchaseOrder, isHistory: boolean) => {
    const totalReceivedQty = po.items.reduce((sum, item) => sum + item.receivedQty, 0);
    const totalQty = po.items.reduce((sum, item) => sum + item.orderQty, 0);
    const unitLabel = po.items[0]?.unit ?? 'หน่วย';

    return (
    <TouchableOpacity
      key={po.id}
      className={cn('bg-white rounded-2xl p-3 gap-2 shadow-sm')}
      onPress={() => !isHistory && onOpenReceiveForm?.(po)}
      activeOpacity={0.8}
    >
      <View className={cn('flex-row items-center gap-2')}>
        <View className={cn('w-10 h-10 rounded-xl items-center justify-center', isHistory ? 'bg-emerald-500' : 'bg-rose-50')}>
          <Ionicons name="document-text-outline" size={20} color={isHistory ? '#fafafa' : '#f87171'} />
        </View>
        <View className={cn('flex-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>{po.poNo}</Text>
          <Text className={cn('text-xs font-medium text-slate-500')}>{po.supplierName ?? 'ไม่ระบุ Supplier'}</Text>
        </View>
        <Text className={cn('text-xs font-medium text-slate-500')}>{formatDate(new Date(po.deliveryDate ?? po.createdAt))}</Text>
      </View>

      <View className={cn('flex-row gap-3')}>
        <Text className={cn('text-xs font-medium text-slate-500')}>{po.items.length} รายการ</Text>
        <Text className={cn('text-xs font-medium text-slate-500')}>
          รับแล้ว {totalReceivedQty} / {totalQty} {unitLabel}
        </Text>
      </View>

      <View className={cn('h-2 bg-gray-200 rounded-[4px] overflow-hidden')}>
        <View
          className={cn('h-full rounded-[4px]', isHistory ? 'bg-emerald-500' : 'bg-rose-500')}
          style={{ width: `${totalQty > 0 ? Math.min((totalReceivedQty / totalQty) * 100, 100) : 0}%` }}
        />
      </View>

      <View className={cn('flex-row items-center justify-between pt-1 border-t border-slate-200')}>
        <Text className={cn('text-xs font-medium text-slate-500')}>รวม: ฿{formatCurrency(po.grandTotal ?? 0)}</Text>
        {!isHistory && (
          <TouchableOpacity
            className={cn('rounded-lg px-3 py-1 bg-rose-50')}
            onPress={() => onOpenReceiveForm?.(po)}
          >
            <Text className={cn('text-xs font-bold text-rose-600')}>รับสินค้า</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-rose-50')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 px-3 py-3 bg-rose-600')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white flex-1')}>รับสินค้าตาม PO</Text>
      </View>

      <View className={cn('flex-row bg-white border-b border-slate-200')}>
        {[
          { key: 'pending', label: 'รอรับสินค้า' },
          { key: 'history', label: 'ประวัติรับแล้ว' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            className={cn('flex-1 items-center py-2 border-b-2', activeTab === tab.key ? 'border-rose-500' : 'border-transparent')}
            onPress={() => setActiveTab(tab.key as ReceiveTab)}
          >
            <Text className={cn('text-xs font-bold', activeTab === tab.key ? 'text-rose-600' : 'text-slate-500')}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className={cn('px-3 py-2')}>
        <View className={cn('flex-row items-center gap-2 bg-white rounded-xl px-3 h-11 border border-slate-200')}>
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            className={cn('flex-1 text-base font-medium text-slate-950')}
            placeholder="ค้นหา PO หรือ Supplier..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={activeTab === 'pending' ? pendingOrders : historyOrders}
        keyExtractor={(po) => po.id}
        renderItem={({ item }) => renderPO(item, activeTab === 'history')}
        contentContainerClassName={cn('px-3 pb-5 gap-3')}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center py-20 gap-3')}>
            <Ionicons name="document-text-outline" size={56} color="#d1d5db" />
            <Text className={cn('text-xl font-bold text-gray-300')}>
              {activeTab === 'pending' ? 'ไม่มี PO ที่รอรับสินค้า' : 'ไม่มีประวัติรับสินค้า'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
