/**
 * ProductListScreen — Xcellence ERP
 * Responsive: Web = table view, Mobile = card list
 */
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput } from '@/shared/tw/index';
import { useWindowDimensions } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { ProductMaster } from '@/features/product/domain/product';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/features/product/data/mocks/mockProducts';
import { formatCurrency } from '@/shared/lib/format';
import { useStoreConfigStore } from '@/features/settings/application/stores/storeConfigStore';
import { cn } from '@/shared/lib/cn';

interface ProductListScreenProps {
  onAddProduct: () => void;
  onEditProduct: (product: ProductMaster) => void;
  onImportExport?: () => void;
  onManageCategories?: () => void;
}

export const ProductListScreen: React.FC<ProductListScreenProps> = ({
  onAddProduct, onEditProduct, onImportExport, onManageCategories,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products] = useState<ProductMaster[]>(MOCK_PRODUCTS);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { variantColor, variantLot, variantSize, variantYear } = useStoreConfigStore();

  const filtered = useMemo(() => products.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchSearch && matchCat;
  }), [search, selectedCategory, products]);

  // ── Stock Badge ────────────────────────────────────────────────────────────
  const StockBadge: React.FC<{ qty: number; min: number }> = ({ qty, min }) => {
    const isOut = qty === 0;
    const isLow = qty > 0 && qty <= min;
    const bgColor = isOut ? '#ffe4e6' : isLow ? '#ffedd5' : '#e7e5e4';
    const textColor = isOut ? '#ef4444' : isLow ? '#854d0e' : '#3f6212';
    const label = isOut ? 'หมด' : isLow ? `เหลือ ${qty}` : `${qty}`;
    return (
      <View className={cn('rounded-lg px-2 py-[2px]')} style={{ backgroundColor: bgColor }}>
        <Text className={cn('text-xs font-semibold')} style={{ color: textColor }}>{label}</Text>
      </View>
    );
  };

  // ── Web Table Row ──────────────────────────────────────────────────────────
  const TableRow: React.FC<{ item: ProductMaster }> = ({ item }) => (
    <TouchableOpacity className={cn('flex-row items-center px-3 py-2 border-b border-slate-200')} onPress={() => onEditProduct(item)} activeOpacity={0.7}>
      <View className={cn('flex-[2] flex-row items-center gap-2')}>
        <View className={cn('w-9 h-9 rounded-lg bg-rose-50 items-center justify-center')}>
          <Ionicons name="cube-outline" size={20} color="#f87171" />
        </View>
        <View className={cn('flex-1')}>
          <Text className={cn('text-base text-slate-950 font-medium')} numberOfLines={1}>{item.name}</Text>
          <Text className={cn('text-xs text-slate-500')}>{item.code}</Text>
        </View>
      </View>
      <Text className={cn('text-base text-slate-950 flex-[0.8]')}>{item.categoryName}</Text>
      <Text className={cn('text-base text-slate-950 text-right flex-[0.7]')}>฿{formatCurrency(item.salePrice)}</Text>
      <View className={cn('flex-[0.6] items-center')}>
        <StockBadge qty={item.stockQty} min={item.minStock} />
      </View>
      <View className={cn('flex-[0.5] items-center')}>
        <TouchableOpacity className={cn('p-1 rounded-lg border border-slate-200')} onPress={() => onEditProduct(item)}>
          <Ionicons name="create-outline" size={16} color="#f87171" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ── Mobile Card ────────────────────────────────────────────────────────────
  const MobileCard: React.FC<{ item: ProductMaster }> = ({ item }) => (
    <TouchableOpacity className={cn('flex-row items-center gap-2 bg-white rounded-xl p-3 border border-slate-200')} onPress={() => onEditProduct(item)} activeOpacity={0.8}>
      <View className={cn('w-11 h-11 rounded-lg bg-rose-50 items-center justify-center')}>
        <Ionicons name="cube-outline" size={24} color="#f87171" />
      </View>
      <View className={cn('flex-1 gap-[2px]')}>
        <Text className={cn('text-base text-slate-950 font-semibold')} numberOfLines={1}>{item.name}</Text>
        <Text className={cn('text-xs text-slate-500')}>{item.code} · {item.categoryName}</Text>
        {((variantColor && item.color) || (variantSize && item.size) || (variantLot && item.lotNumber) || (variantYear && item.modelYear)) && (
          <Text className={cn('text-xs text-violet-700 font-medium mt-[2px]')}>
            {[variantColor && item.color && `สี: ${item.color}`, variantSize && item.size && `ไซส์: ${item.size}`, variantLot && item.lotNumber && `Lot: ${item.lotNumber}`, variantYear && item.modelYear && `ปี: ${item.modelYear}`].filter(Boolean).join(' · ')}
          </Text>
        )}
        <View className={cn('flex-row items-center gap-2 mt-1')}>
          <Text className={cn('text-xs font-semibold text-rose-600')}>฿{formatCurrency(item.salePrice)}</Text>
          <StockBadge qty={item.stockQty} min={item.minStock} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={isWide ? [] : ['top']}>
      {/* Header */}
      <View className={cn('flex-row items-center justify-between bg-white px-4 py-3 border-b border-slate-200')}>
        <Text className={cn('text-lg font-semibold text-slate-950')}>จัดการสินค้า</Text>
        <View className={cn('flex-row items-center gap-2')}>
          {onImportExport && (
            <TouchableOpacity className={cn('p-2 rounded-lg border border-slate-200')} onPress={onImportExport}>
              <Ionicons name="swap-vertical-outline" size={18} color="#57534e" />
            </TouchableOpacity>
          )}
          <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 rounded-lg px-3 py-2')} onPress={onAddProduct}>
            <Ionicons name="add-outline" size={18} color="#fafafa" />
            <Text className={cn('text-xs font-semibold text-white')}>เพิ่มสินค้า</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search + Category */}
      <View className={cn('px-4 pt-3 pb-2')}>
        <View className={cn('flex-row items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 h-10')}>
          <Ionicons name="search-outline" size={16} color="#57534e" />
          <TextInput
            className={cn('flex-1 text-base text-slate-950')}
            placeholder="ค้นหาชื่อ รหัส บาร์โค้ด..."
            placeholderTextColor="#57534e"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#57534e" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips */}
      <FlatList
        data={[{ id: 'all', name: 'ทั้งหมด', productCount: products.length, status: 'active' as const }, ...MOCK_CATEGORIES]}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerClassName={cn('px-4 gap-2 pb-2')}
        renderItem={({ item }) => (
          <TouchableOpacity
            className={cn('px-3 py-1 rounded-full bg-white border border-slate-200', selectedCategory === item.id && 'bg-rose-500 border-rose-500')}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text className={cn('text-xs font-semibold text-slate-500', selectedCategory === item.id && 'text-white')}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Result count */}
      <View className={cn('px-4 pb-[2px]')}>
        <Text className={cn('text-xs text-slate-500')}>{filtered.length} รายการ</Text>
      </View>

      {/* Web: Table */}
      {isWide ? (
        <View className={cn('flex-1 px-4')}>
          {/* Table Header */}
          <View className={cn('flex-row items-center bg-neutral-100 rounded-lg px-3 py-2')}>
            <Text className={cn('text-xs text-slate-500 font-semibold flex-[2]')}>สินค้า</Text>
            <Text className={cn('text-xs text-slate-500 font-semibold flex-[0.8]')}>หมวดหมู่</Text>
            <Text className={cn('text-xs text-slate-500 font-semibold flex-[0.7] text-right')}>ราคา</Text>
            <Text className={cn('text-xs text-slate-500 font-semibold flex-[0.6] text-center')}>คงเหลือ</Text>
            <Text className={cn('text-xs text-slate-500 font-semibold flex-[0.5] text-center')}>จัดการ</Text>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TableRow item={item} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState />}
          />
        </View>
      ) : (
        /* Mobile: Cards */
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MobileCard item={item} />}
          contentContainerClassName={cn('px-4 pb-[100px] gap-2')}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
        />
      )}

      {/* Mobile FAB */}
      {!isWide && (
        <TouchableOpacity className={cn('absolute bottom-6 right-5 w-[52px] h-[52px] rounded-full bg-rose-500 items-center justify-center')}
          style={{ shadowColor: '#09090b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, boxShadow: '0 14px 40px rgba(15, 23, 42, 0.12)' }}
          onPress={onAddProduct} activeOpacity={0.85}>
          <Ionicons name="add" size={24} color="#fafafa" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

// ── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <View className={cn('items-center py-[60px] gap-2')}>
    <Ionicons name="cube-outline" size={48} color="#d1d5db" />
    <Text className={cn('text-[17px] text-slate-500')}>ไม่พบสินค้า</Text>
    <Text className={cn('text-base text-slate-500')}>ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</Text>
  </View>
);
