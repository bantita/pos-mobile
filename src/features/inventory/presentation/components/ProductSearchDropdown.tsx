/**
 * ProductSearchDropdown
 * Dropdown ค้นหาสินค้า พร้อมเลือกหน่วย (UOM) และแสดงยอดคงเหลือในบรรทัดเดียว
 */
import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, FlatList, Modal } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { MOCK_PRODUCTS } from '@/features/product/data/mocks/mockProducts';
import { MOCK_STOCK } from '@/features/inventory/data/mocks/mockInventory';
import { ProductUOM } from '@/features/product/domain/product';
import { cn } from '@/shared/lib/cn';
import { formatCurrency } from '@/shared/lib/format';
import { Text, TextInput } from '@/shared/tw/index';

export interface SelectedProductUOM {
  productId: string;
  productCode: string;
  productName: string;
  uomId: string;
  unit: string;
  ratio: number;
  costPrice: number;
  salePrice: number;
  onHandQty: number;
  onHandQtyDisplay: number;
}

interface Props {
  warehouseId: string;
  value: SelectedProductUOM | null;
  onChange: (item: SelectedProductUOM) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export const ProductSearchDropdown: React.FC<Props> = ({
  warehouseId, value, onChange, placeholder = 'ค้นหาหรือเลือกสินค้า', label, required,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingProduct, setPendingProduct] = useState<typeof MOCK_PRODUCTS[0] | null>(null);

  const stockMap = useMemo(() => {
    const map: Record<string, number> = {};
    MOCK_STOCK.forEach((s) => {
      if (s.warehouseId === warehouseId) {
        map[s.productId] = (map[s.productId] ?? 0) + s.onHandQty;
      }
    });
    return map;
  }, [warehouseId]);

  const filtered = useMemo(() =>
    MOCK_PRODUCTS.filter((p) =>
      p.status === 'active' && (
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)
      )
    ), [search]);

  const selectUOM = (product: typeof MOCK_PRODUCTS[0], uom: ProductUOM) => {
    const onHand = stockMap[product.id] ?? 0;
    const onHandDisplay = uom.ratio > 1 ? Math.floor(onHand / uom.ratio) : onHand;
    onChange({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      uomId: uom.id,
      unit: uom.unit,
      ratio: uom.ratio,
      costPrice: uom.costPrice,
      salePrice: uom.salePrice,
      onHandQty: onHand,
      onHandQtyDisplay: onHandDisplay,
    });
    setPendingProduct(null);
    setShowModal(false);
    setSearch('');
  };

  return (
    <>
      {label && (
        <Text className="text-xs font-semibold text-gray-700 mb-1">{label}{required && <Text className="text-rose-600"> *</Text>}</Text>
      )}
      <TouchableOpacity className="flex-row items-center gap-2 bg-white rounded-xl border-[1.5px] border-slate-200 px-3 py-2 min-h-[50px]" onPress={() => setShowModal(true)} activeOpacity={0.8}>
        {value ? (
          <View className="flex-row items-center flex-1 gap-2">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-950" numberOfLines={1}>{value.productName}</Text>
              <Text className="text-xs text-slate-500">{value.productCode}</Text>
            </View>
            <View className="flex-row gap-1 items-center">
              <View className="bg-rose-500 rounded-lg px-[7px] py-[3px]">
                <Text className="text-[11px] text-white font-bold">{value.unit}</Text>
              </View>
              <View className={cn('rounded-lg px-[6px] py-[3px]',
                value.onHandQtyDisplay <= 0 && 'bg-rose-50',
                value.onHandQtyDisplay > 0 && value.onHandQtyDisplay < 5 && 'bg-amber-100',
                value.onHandQtyDisplay >= 5 && 'bg-emerald-100')}>
                <Text className={cn('text-[10px] font-bold',
                  value.onHandQtyDisplay <= 0 && 'text-rose-600',
                  value.onHandQtyDisplay > 0 && value.onHandQtyDisplay < 5 && 'text-amber-600',
                  value.onHandQtyDisplay >= 5 && 'text-emerald-600')}>
                  คงเหลือ {value.onHandQtyDisplay}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center gap-2 flex-1">
            <Ionicons name="search-outline" size={16} color="#9ca3af" />
            <Text className="text-base text-gray-400">{placeholder}</Text>
          </View>
        )}
        <Ionicons name="chevron-down" size={16} color="#9ca3af" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[24px] max-h-[85%]">
            <View className="w-10 h-1 bg-gray-200 rounded-sm self-center mt-2" />
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200">
              <Text className="text-lg font-semibold text-slate-950">
                {pendingProduct ? `เลือกหน่วย — ${pendingProduct.name}` : 'เลือกสินค้า'}
              </Text>
              <TouchableOpacity onPress={() => { setPendingProduct(null); setShowModal(false); setSearch(''); }}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {!pendingProduct ? (
              <>
                <View className="flex-row items-center gap-2 m-3 bg-gray-50 rounded-xl border border-slate-200 px-3 h-11">
                  <Ionicons name="search-outline" size={16} color="#9ca3af" />
                  <TextInput
                    className="flex-1 text-base text-slate-950"
                    placeholder="ชื่อ รหัส บาร์โค้ด..."
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                    autoFocus
                  />
                  {search !== '' && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <Ionicons name="close-circle" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>
                <FlatList
                  data={filtered}
                  keyExtractor={(p) => p.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: p }) => {
                    const onHand = stockMap[p.id] ?? 0;
                    return (
                      <TouchableOpacity
                        className="flex-row items-center gap-2 px-4 py-3 border-b border-slate-200"
                        onPress={() => p.uoms.length === 1 ? selectUOM(p, p.uoms[0]) : setPendingProduct(p)}
                        activeOpacity={0.8}
                      >
                        <View className="w-10 h-10 rounded-lg bg-rose-50 items-center justify-center">
                          <Ionicons name="cube-outline" size={20} color="#f87171" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-semibold text-slate-950" numberOfLines={1}>{p.name}</Text>
                          <Text className="text-xs text-slate-500">{p.code} · {p.barcode}</Text>
                        </View>
                        <View className="items-end gap-0.5">
                          <Text className="text-xs text-emerald-600 font-semibold">คงเหลือ {onHand} {p.unit}</Text>
                          {p.uoms.length > 1 && (
                            <View className="bg-amber-100 rounded-[6px] px-[5px] py-[1px]">
                              <Text className="text-[9px] text-amber-600 font-bold">{p.uoms.length} หน่วย</Text>
                            </View>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View className="items-center py-12 gap-2">
                      <Ionicons name="search-outline" size={36} color="#d1d5db" />
                      <Text className="text-base text-gray-400">ไม่พบสินค้า</Text>
                    </View>
                  }
                />
              </>
            ) : (
              <FlatList
                data={pendingProduct.uoms}
                keyExtractor={(u) => u.id}
                renderItem={({ item: uom }) => {
                  const onHand = stockMap[pendingProduct.id] ?? 0;
                  const display = uom.ratio > 1 ? Math.floor(onHand / uom.ratio) : onHand;
                  return (
                    <TouchableOpacity
                      className={cn('flex-row items-center gap-3 px-4 py-3 border-b border-slate-200 relative', uom.isDefault && 'bg-amber-50')}
                      onPress={() => selectUOM(pendingProduct, uom)}
                      activeOpacity={0.8}
                    >
                      <View className={cn('min-w-[56px] px-2 py-[6px] bg-gray-100 rounded-lg items-center', uom.ratio === 1 && 'bg-rose-500')}>
                        <Text className={cn('text-xs font-bold text-slate-950', uom.ratio === 1 && 'text-white')}>{uom.unit}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-slate-500">
                          {uom.ratio === 1 ? 'หน่วยฐาน' : `1 ${uom.unit} = ${uom.ratio} ${pendingProduct.unit}`}
                        </Text>
                        <Text className="text-[10px] text-gray-400">
                          {uom.barcodes.join(', ') || '—'}
                        </Text>
                      </View>
                      <View className="items-end gap-0.5">
                        <Text className="text-xs font-bold text-rose-600">฿{formatCurrency(uom.salePrice)}</Text>
                        <Text className={cn('text-xs text-emerald-600 font-semibold', display <= 0 && 'text-rose-600')}>
                          เหลือ {display} {uom.unit}
                        </Text>
                      </View>
                      {uom.isDefault && (
                        <View className="absolute top-2 right-4 bg-amber-500 rounded-full w-4 h-4 items-center justify-center">
                          <Ionicons name="star" size={11} color="#fafafa" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListHeaderComponent={
                  <TouchableOpacity className="flex-row items-center gap-1 p-3 border-b border-slate-200" onPress={() => setPendingProduct(null)}>
                    <Ionicons name="arrow-back" size={16} color="#f87171" />
                    <Text className="text-base text-rose-600 font-semibold">กลับเลือกสินค้า</Text>
                  </TouchableOpacity>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};
