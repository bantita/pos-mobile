import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Supplier } from '@/features/purchase/domain/supplier';
import { formatCurrency } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Text, TextInput } from '@/shared/tw/index';

interface Props {
  suppliers: Supplier[];
  onSelect?: (sup: Supplier) => void;
  onCreateNew?: () => void;
  onEdit?: (sup: Supplier) => void;
  onBack: () => void;
}

export const SupplierListScreen: React.FC<Props> = ({ suppliers, onSelect, onCreateNew, onEdit, onBack }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code ?? s.supplierCode ?? '').toLowerCase().includes(q) ||
        (s.phone ?? '').includes(q) ||
        (s.taxId ?? '').includes(q),
    );
  }, [suppliers, search]);

  const renderSupplier = ({ item: sup }: { item: Supplier }) => (
    <TouchableOpacity
      className={cn('bg-white rounded-2xl p-3 gap-2 shadow-sm')}
      onPress={() => (onSelect ? onSelect(sup) : onEdit?.(sup))}
      activeOpacity={0.8}
    >
      <View className={cn('flex-row items-center gap-3')}>
        <View className={cn('w-12 h-12 rounded-xl bg-rose-50 items-center justify-center')}>
          <Ionicons name="business-outline" size={22} color="#f87171" />
        </View>
        <View className={cn('flex-1')}>
          <Text className={cn('text-base font-bold text-slate-950')}>{sup.name}</Text>
          <Text className={cn('text-xs font-medium text-slate-500')}>{sup.code ?? sup.supplierCode ?? '-'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </View>

      <View className={cn('flex-row gap-4 pt-1 border-t border-slate-200')}>
        {sup.phone && (
          <View className={cn('flex-row items-center gap-1')}>
            <Ionicons name="call-outline" size={12} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-500')}>{sup.phone}</Text>
          </View>
        )}
        {sup.email && (
          <View className={cn('flex-row items-center gap-1')}>
            <Ionicons name="mail-outline" size={12} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-500')}>{sup.email}</Text>
          </View>
        )}
      </View>

      <View className={cn('flex-row items-center justify-between')}>
        <View className={cn('flex-row gap-4')}>
          <View className={cn('flex-row items-center gap-1')}>
            <Ionicons name="pricetag-outline" size={12} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-500')}>{sup.purchaseCount ?? 0} รายการ</Text>
          </View>
          <View className={cn('flex-row items-center gap-1')}>
            <Ionicons name="cash-outline" size={12} color="#f87171" />
            <Text className={cn('text-xs font-bold text-rose-600')}>
              {sup.totalPurchases ? `฿${formatCurrency(sup.totalPurchases)}` : '฿0'}
            </Text>
          </View>
        </View>
        {onSelect && (
          <TouchableOpacity
            className={cn('rounded-lg px-3 py-1 bg-rose-50')}
            onPress={() => onSelect(sup)}
          >
            <Text className={cn('text-xs font-bold text-rose-600')}>เลือก</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className={cn('flex-1', 'bg-rose-50')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 px-3 py-3 bg-rose-600')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View className={cn('flex-1')}>
          <Text className={cn('text-lg font-extrabold text-white')}>คู่ค้า / Supplier</Text>
          <Text className={cn('text-xs font-medium text-white/75')}>{suppliers.length} รายการ</Text>
        </View>
        {onCreateNew && (
          <TouchableOpacity className={cn('flex-row items-center gap-1 rounded-xl px-2 py-1 border')}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)' }}
            onPress={onCreateNew}>
            <Ionicons name="add" size={20} color="#fafafa" />
            <Text className={cn('text-xs font-bold text-white')}>เพิ่ม</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className={cn('px-3 py-2')}>
        <View className={cn('flex-row items-center gap-2 bg-white rounded-xl px-3 h-11 border border-slate-200')}>
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            className={cn('flex-1 text-base font-medium text-slate-950')}
            placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร..."
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
        data={filtered}
        keyExtractor={(s) => s.id}
        renderItem={renderSupplier}
        contentContainerClassName={cn('px-3 pb-5 gap-3')}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center py-20 gap-3')}>
            <Ionicons name="business-outline" size={56} color="#d1d5db" />
            <Text className={cn('text-xl font-bold text-gray-300')}>
              {search ? 'ไม่พบ Supplier' : 'ยังไม่มี Supplier'}
            </Text>
            {!search && onCreateNew && (
              <TouchableOpacity className={cn('flex-row items-center gap-1 rounded-xl px-5 py-3 bg-rose-500 shadow-lg shadow-rose-500/40')}
                onPress={onCreateNew}>
                <Ionicons name="add" size={18} color="#fafafa" />
                <Text className={cn('text-base font-bold text-white')}>เพิ่ม Supplier</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};
