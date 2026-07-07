import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { formatCurrency } from '@/shared/lib/format';
import { useNavigation } from 'expo-router/react-navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  ScrollView,
  useWindowDimensions,
  Vibration,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SaleModePicker } from '@/features/sale/presentation/components/SaleModePicker';
import { ServiceStaffPopup } from '@/features/sale/presentation/components/ServiceStaffPopup';
import { findProductByBarcode, MOCK_PRODUCTS } from '@/features/product/data/mocks/mockProducts';
import { MOCK_TECHNICIANS } from '@/features/settings/data/mocks/mockStaff';
import { useCartStore } from '@/features/sale/application/stores/cartStore';
import { useSaleModeStore } from '@/features/sale/application/stores/saleModeStore';
import { ProductUOM } from '@/features/product/domain/product';
import { Product } from '@/features/sale/domain/sale';
import { AppModal } from '@/shared/ui/index';

const CATEGORIES = ['ทั้งหมด', 'เครื่องดื่ม', 'อาหาร', 'ขนม', 'ของใช้'];
const QUICK_AMOUNTS = [1, 2, 3, 5, 10];
const GRID_GAP = 10;
const GRID_HORIZONTAL_PADDING = 16;
const TABLET_CART_RAIL_WIDTH = 340;
const TABLET_CART_RAIL_WIDE_WIDTH = 380;

const toCartProduct = (master: typeof MOCK_PRODUCTS[0], uom: ProductUOM): Product => ({
  id: `${master.id}_${uom.id}`,
  code: master.code,
  barcode: uom.barcodes[0] ?? master.barcode,
  name: uom.ratio > 1 ? `${master.name} (${uom.unit})` : master.name,
  category: master.categoryName,
  price: uom.salePrice,
  cost: uom.costPrice,
  vatIncluded: master.vatIncluded,
  vatRate: master.vatRate,
  unit: uom.unit,
  stockQty: Math.floor(master.stockQty / uom.ratio),
});

const ALL_CART_PRODUCTS: Product[] = MOCK_PRODUCTS.flatMap((m) =>
  m.uoms.map((uom) => toCartProduct(m, uom))
);

interface PosSaleScreenProps {
  onOpenCart: () => void;
  onOpenScanner: () => void;
  onOpenHoldBill: () => void;
  onOpenCustomerDisplay: () => void;
  onCancelBill: () => void;
  cashierName?: string;
  posName?: string;
}

interface UomSelectorProps {
  visible: boolean;
  masterProduct: typeof MOCK_PRODUCTS[0] | null;
  onSelect: (product: Product) => void;
  onClose: () => void;
}

const UomSelector: React.FC<UomSelectorProps> = ({ visible, masterProduct, onSelect, onClose }) => {
  if (!masterProduct) return null;
  return (
    <AppModal visible={visible} onClose={onClose} title={masterProduct.name} subtitle="เลือกหน่วยที่ต้องการขาย" size="sm">
      <View className="gap-2">
        {masterProduct.uoms.map((uom) => {
          const cartProduct = toCartProduct(masterProduct, uom);
          return (
            <TouchableOpacity
              key={uom.id}
              className={cn(
                'flex-row items-center gap-3 rounded-xl border p-3.5',
                uom.isDefault ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'
              )}
              onPress={() => { onSelect(cartProduct); onClose(); }}
              activeOpacity={0.8}
            >
              <View className={cn('min-w-[48px] items-center rounded-lg px-2.5 py-1.5', uom.ratio === 1 ? 'bg-rose-500' : 'bg-slate-100')}>
                <Text className={cn('text-xs font-extrabold', uom.ratio === 1 ? 'text-white' : 'text-slate-700')}>{uom.unit}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-slate-500">
                  {uom.ratio === 1 ? 'หน่วยฐาน' : `1 ${uom.unit} = ${uom.ratio} ${masterProduct.unit}`}
                </Text>
                <View className="mt-0.5 flex-row flex-wrap gap-1">
                  {uom.barcodes.slice(0, 2).map((bc) => (
                    <View key={bc} className="flex-row items-center gap-0.5 rounded-md bg-rose-50 px-1.5 py-0.5">
                      <Ionicons name="barcode-outline" size={10} color="#e11d48" />
                      <Text className="text-xs font-bold text-rose-600">{bc}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className="items-end">
                <Text className="text-sm font-extrabold text-rose-600">฿{formatCurrency(uom.salePrice)}</Text>
                {uom.isDefault && (
                  <View className="mt-0.5 flex-row items-center gap-0.5 rounded-md bg-rose-500 px-1.5 py-0.5">
                    <Ionicons name="star" size={9} color="#fff" />
                    <Text className="text-xs font-extrabold text-white">Default</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </AppModal>
  );
};

interface ScanFeedbackProps {
  status: 'idle' | 'found' | 'not_found';
  productName?: string;
  price?: number;
}

const ScanFeedback: React.FC<ScanFeedbackProps> = ({ status, productName, price }) => {
  if (status === 'idle') return null;
  return (
    <Animated.View
      entering={FadeIn.duration(140)}
      className={cn(
      'absolute inset-0 z-10 items-center justify-center gap-2 rounded-xl',
      status === 'found' ? 'bg-emerald-500/95' : 'bg-rose-500/95'
    )}>
      <Ionicons name={status === 'found' ? 'checkmark-circle' : 'close-circle'} size={44} color="#fff" />
      <Text className="text-sm font-extrabold text-white">{status === 'found' ? productName : 'ไม่พบสินค้า'}</Text>
      {status === 'found' && price !== undefined && (
        <Text className="text-xl font-extrabold text-white">฿{formatCurrency(price)}</Text>
      )}
    </Animated.View>
  );
};

export const PosSaleScreen: React.FC<PosSaleScreenProps> = ({
  onOpenCart, onOpenScanner, onOpenHoldBill,
  onOpenCustomerDisplay, onCancelBill,
  cashierName = 'พนักงาน', posName = 'POS 1',
}) => {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { addItem, addServiceItem, items, removeItem, updateQty, getItemCount, getGrandTotal } = useCartStore();
  const { mode, gridColumns, beepOnScan, splitView } = useSaleModeStore();

  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchText, setSearchText] = useState('');
  const [showModeSettings, setShowModeSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'scan'>(mode === 'scan_only' ? 'scan' : 'grid');
  const [showUomSelector, setShowUomSelector] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<typeof MOCK_PRODUCTS[0] | null>(null);
  const [showStaffPopup, setShowStaffPopup] = useState(false);
  const [serviceProduct, setServiceProduct] = useState<Product | null>(null);
  const [isGridReady, setIsGridReady] = useState(false);

  const [manualBarcode, setManualBarcode] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [scanResult, setScanResult] = useState<{ name: string; price: number } | null>(null);
  const scanFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const itemCount = getItemCount();
  const grandTotal = getGrandTotal();
  const isNarrowPhone = width < 390;
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const showTabletCartRail = isTablet;
  const tabletCartRailWidth = width >= 1100 ? TABLET_CART_RAIL_WIDE_WIDTH : TABLET_CART_RAIL_WIDTH;
  const availableGridWidth = showTabletCartRail ? Math.max(360, width - tabletCartRailWidth - 18) : width;
  const effectiveGridColumns = (() => {
    if (availableGridWidth < 380) return 2;
    if (availableGridWidth < 620) return Math.min(gridColumns, 3);
    if (availableGridWidth < 900) return Math.max(3, gridColumns);
    return Math.max(4, gridColumns);
  })();
  const cardWidth = Math.floor(
    (availableGridWidth - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP * (effectiveGridColumns - 1)) / effectiveGridColumns
  );
  const canUseSplitScanner = mode === 'both' && splitView && isTablet && isLandscape;
  const bottomActionInset = Math.max(insets.bottom, 10);

  useEffect(() => {
    setIsGridReady(false);
    const task = InteractionManager.runAfterInteractions(() => setIsGridReady(true));
    return () => task.cancel();
  }, [effectiveGridColumns, isTablet]);

  const filteredProducts = ALL_CART_PRODUCTS.filter((p) => {
    const matchCat = selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
    const matchSearch = !searchText ||
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.barcode.includes(searchText) ||
      p.code.toLowerCase().includes(searchText.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Quick Add by Amount ──
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);

  const handleProductPress = useCallback((product: Product) => {
    const master = MOCK_PRODUCTS.find((m) => product.id.startsWith(m.id + '_'));
    if (master && master.productType === 'service') {
      setServiceProduct(product);
      setShowStaffPopup(true);
      return;
    }
    if (master && master.uoms.length > 1 && product.unit === master.unit) {
      setSelectedMaster(master);
      setShowUomSelector(true);
      return;
    }
    addItem(product);
  }, [addItem]);

  const handleProductLongPress = useCallback((product: Product) => {
    setQuickAddProduct(product);
    setShowQuickAdd(true);
  }, [setQuickAddProduct, setShowQuickAdd]);

  const handleQuickAdd = useCallback((qty: number) => {
    if (quickAddProduct) {
      addItem(quickAddProduct, qty);
    }
    setShowQuickAdd(false);
    setQuickAddProduct(null);
  }, [quickAddProduct, addItem, setShowQuickAdd, setQuickAddProduct]);

  const handleScan = useCallback((barcode: string) => {
    if (!barcode.trim()) return;
    if (scanFeedbackTimer.current) clearTimeout(scanFeedbackTimer.current);
    const result = findProductByBarcode(barcode.trim(), MOCK_PRODUCTS);
    if (result) {
      const cartProduct = toCartProduct(result.product, result.uom);
      addItem(cartProduct);
      setScanResult({ name: cartProduct.name, price: cartProduct.price });
      setScanStatus('found');
      if (beepOnScan) Vibration.vibrate(60);
    } else {
      setScanResult(null);
      setScanStatus('not_found');
      Vibration.vibrate([0, 80, 40, 80]);
    }
    setManualBarcode('');
    scanFeedbackTimer.current = setTimeout(() => setScanStatus('idle'), 1800);
  }, [addItem, beepOnScan]);

  const renderProduct = ({ item, index }: { item: Product; index: number }) => {
    const isLargeUnit = !item.unit.match(/^(ชิ้น|ขวด|กระป๋อง|ซอง|ถุง|ก้อน)$/);
    const master = MOCK_PRODUCTS.find((m) => item.id.startsWith(m.id + '_'));
    const isService = master?.productType === 'service';
    return (
      <Animated.View
        entering={FadeInDown.duration(180).delay(Math.min(index % 12, 8) * 18)}
        layout={Layout.springify().damping(18)}
      >
      <TouchableOpacity
        style={[{ width: cardWidth }, item.stockQty === 0 && { opacity: 0.4 }]}
        className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
        onPress={() => item.stockQty > 0 && handleProductPress(item)}
        onLongPress={() => item.stockQty > 0 && handleProductLongPress(item)}
        disabled={item.stockQty === 0}
        activeOpacity={0.75}
      >
        <View className={cn('aspect-square items-center justify-center', isService ? 'bg-rose-500' : isLargeUnit ? 'bg-amber-50' : 'bg-rose-50')}>
          <Ionicons name={isService ? 'cut-outline' : isLargeUnit ? 'cube' : 'cube-outline'} size={effectiveGridColumns >= 4 ? 20 : 26} color={isService ? '#fff' : isLargeUnit ? '#d97706' : '#e11d48'} />
          {isLargeUnit && !isService && (
            <View className="absolute bottom-1 left-1 rounded-md bg-amber-500 px-1.5 py-0.5">
              <Text className="text-xs font-extrabold text-white" numberOfLines={1}>{item.unit}</Text>
            </View>
          )}
          {isService && (
            <View className="absolute bottom-1 right-1 rounded-md bg-white/20 px-1.5 py-0.5">
              <Text className="text-xs font-extrabold text-white" numberOfLines={1}>บริการ</Text>
            </View>
          )}
        </View>
        {item.stockQty === 0 ? (
          <View className="absolute inset-0 items-center justify-center rounded-2xl bg-black/50">
            <Text className="text-xs font-extrabold text-white">หมด</Text>
          </View>
        ) : item.stockQty <= 5 && !isService ? (
          <View className="absolute right-1.5 top-1.5 h-5 w-5 items-center justify-center rounded-full bg-amber-500">
            <Text className="text-xs font-extrabold text-white">{item.stockQty}</Text>
          </View>
        ) : null}
        <View className="px-2 pb-2 pt-1.5">
          <Text className="text-xs font-bold text-slate-800" numberOfLines={2}>{item.name}</Text>
          <Text className={cn('mt-0.5 text-sm font-extrabold text-rose-600', effectiveGridColumns >= 4 && 'text-xs')}>฿{formatCurrency(item.price)}</Text>
        </View>
      </TouchableOpacity>
      </Animated.View>
    );
  };

  const ScannerPanel = ({ compact = false }: { compact?: boolean }) => (
    <View className="flex-1 overflow-hidden rounded-xl border border-slate-100 bg-white">
      <View className="relative flex-1 items-center justify-center bg-slate-100">
        <View style={{ width: compact ? 180 : 220, height: compact ? 130 : 160, position: 'relative' }}>
          {(['TL', 'TR', 'BL', 'BR'] as const).map((corner) => (
            <View key={corner} className="absolute border-rose-500" style={cornerStyles[corner]} />
          ))}
          <View className="absolute left-0 right-0 top-1/2 h-0.5 bg-rose-500 opacity-80" />
        </View>
        <Text className="mt-4 text-xs font-bold text-slate-500">จ่อกล้องที่บาร์โค้ด หรือกรอกด้านล่าง</Text>
        <ScanFeedback status={scanStatus} productName={scanResult?.name} price={scanResult?.price} />
      </View>
      <View className="gap-3 bg-white p-3">
        <View className="flex-row gap-2">
          <TextInput
            className="h-12 flex-1 rounded-xl border border-slate-200 bg-[#f6f7fb] px-4 text-base font-bold text-slate-900"
            placeholder="กรอกบาร์โค้ด..."
            placeholderTextColor="#9ca3af"
            value={manualBarcode}
            onChangeText={setManualBarcode}
            keyboardType="default"
            returnKeyType="search"
            onSubmitEditing={() => handleScan(manualBarcode)}
          />
          <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-xl bg-rose-500 active:bg-rose-600" onPress={() => handleScan(manualBarcode)}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {scanStatus !== 'idle' && scanResult && (
          <View className={cn('flex-row items-center gap-2 rounded-xl p-3', scanStatus === 'found' ? 'bg-emerald-50' : 'bg-rose-50')}>
            <Ionicons name={scanStatus === 'found' ? 'checkmark-circle-outline' : 'close-circle-outline'} size={18} color={scanStatus === 'found' ? '#059669' : '#e11d48'} />
            <View className="flex-1">
              <Text className={cn('text-xs font-bold', scanStatus === 'found' ? 'text-emerald-700' : 'text-rose-700')}>
                {scanStatus === 'found' ? scanResult.name : 'ไม่พบสินค้าในระบบ'}
              </Text>
              {scanStatus === 'found' && <Text className="text-xs font-bold text-emerald-600">฿{formatCurrency(scanResult.price)} · เพิ่มลงบิลแล้ว</Text>}
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const GridPanel = () => (
    <View className="flex-1">
      <View className="px-4 pb-2 pt-3">
        <View className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 h-11">
          <Ionicons name="search-outline" size={16} color="#94a3b8" />
          <TextInput
            className="flex-1 text-sm font-bold text-slate-900"
            placeholder="ค้นหาสินค้า, รหัส, บาร์โค้ด..."
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList data={CATEGORIES} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item) => item}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 6 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className={cn('min-h-10 items-center justify-center rounded-full border px-4 py-2.5', selectedCategory === item ? 'border-rose-500 bg-rose-500' : 'border-slate-200 bg-white')}
            onPress={() => setSelectedCategory(item)}
          >
            <Text className={cn('text-xs font-bold', selectedCategory === item ? 'text-white' : 'text-slate-600')}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <Animated.View entering={FadeIn.duration(180)} className="mx-4 mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-bold text-slate-500">{filteredProducts.length} รายการ · {effectiveGridColumns} คอลัมน์</Text>
        <View className={cn('rounded-full px-2.5 py-1', isTablet ? 'bg-emerald-50' : 'bg-rose-50')}>
          <Text className={cn('text-xs font-extrabold', isTablet ? 'text-emerald-700' : 'text-rose-600')}>
            {isTablet ? 'Tablet workflow' : isNarrowPhone ? 'Compact' : 'Mobile'}
          </Text>
        </View>
      </Animated.View>

      {!isGridReady ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <View className="w-full flex-row flex-wrap gap-3">
            {Array.from({ length: effectiveGridColumns * 3 }).map((_, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.duration(220).delay(index * 25)}
                className="rounded-xl border border-slate-100 bg-white"
                style={{ width: cardWidth, height: Math.max(116, cardWidth + 56), opacity: 0.72 }}
              >
                <View className="flex-1 rounded-t-xl bg-slate-100" />
                <View className="gap-2 p-2">
                  <View className="h-3 rounded-full bg-slate-100" />
                  <View className="h-3 w-2/3 rounded-full bg-rose-100" />
                </View>
              </Animated.View>
            ))}
          </View>
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#e11d48" />
            <Text className="text-xs font-bold text-slate-500">กำลังจัดหน้าขายให้พอดีกับอุปกรณ์...</Text>
          </View>
        </View>
      ) : (
      <FlatList data={filteredProducts} key={`grid-${effectiveGridColumns}`} numColumns={effectiveGridColumns}
        keyExtractor={(item) => item.id} renderItem={renderProduct}
        contentContainerStyle={{ paddingHorizontal: GRID_HORIZONTAL_PADDING, gap: GRID_GAP, paddingBottom: showTabletCartRail ? 24 : 90 + bottomActionInset }}
        showsVerticalScrollIndicator={false} columnWrapperStyle={{ gap: 8 }}
        ListEmptyComponent={
          <View className="items-center gap-3 py-16">
            <Ionicons name="search-outline" size={48} color="#e2e8f0" />
            <Text className="text-sm font-bold text-slate-400">ไม่พบสินค้า</Text>
          </View>
        }
      />
      )}
    </View>
  );

  const TabletCartRail = () => (
    <Animated.View
      entering={FadeInDown.duration(220)}
      className="m-3 ml-0 overflow-hidden rounded-xl border border-slate-100 bg-white"
      style={{ width: tabletCartRailWidth, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.10)' }}
    >
      <View className="border-b border-slate-100 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-extrabold text-slate-950">บิลปัจจุบัน</Text>
            <Text className="text-xs font-bold text-slate-500">{itemCount} รายการ</Text>
          </View>
          <View className="rounded-full bg-rose-50 px-3 py-1">
            <Text className="text-xs font-extrabold text-rose-600">฿{formatCurrency(grandTotal)}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id + (item.technicianId ?? '')}
        contentContainerStyle={{ padding: 12, gap: 10, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center gap-3 py-12">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
              <Ionicons name="cart-outline" size={28} color="#e11d48" />
            </View>
            <Text className="text-center text-sm font-bold text-slate-400">แตะสินค้าเพื่อเริ่มขาย</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3">
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-sm font-extrabold text-slate-950" numberOfLines={2}>{item.product.name}</Text>
                <Text className="mt-0.5 text-xs font-bold text-slate-500">฿{formatCurrency(item.product.price)} / {item.product.unit}</Text>
                {item.technicianName && (
                  <Text className="mt-0.5 text-xs font-bold text-violet-600" numberOfLines={1}>{item.technicianName}</Text>
                )}
              </View>
              <Text className="text-sm font-extrabold text-rose-600">฿{formatCurrency(item.product.price * item.qty)}</Text>
            </View>

            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  className="h-9 w-9 items-center justify-center rounded-lg bg-white"
                  onPress={() => item.qty > 1 ? updateQty(item.product.id, item.qty - 1) : removeItem(item.product.id)}
                >
                  <Ionicons name="remove" size={17} color="#64748b" />
                </TouchableOpacity>
                <Text className="min-w-[28px] text-center text-sm font-extrabold text-slate-950">{item.qty}</Text>
                <TouchableOpacity
                  className="h-9 w-9 items-center justify-center rounded-lg bg-rose-50"
                  onPress={() => updateQty(item.product.id, item.qty + 1)}
                >
                  <Ionicons name="add" size={17} color="#e11d48" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity className="min-h-9 flex-row items-center gap-1 rounded-lg px-2" onPress={() => removeItem(item.product.id)}>
                <Ionicons name="trash-outline" size={15} color="#e11d48" />
                <Text className="text-xs font-bold text-rose-600">ลบ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View className="gap-3 border-t border-slate-100 p-4">
        <View className="flex-row items-end justify-between">
          <Text className="text-sm font-bold text-slate-500">ยอดรวม</Text>
          <Text className="text-2xl font-extrabold text-rose-600">฿{formatCurrency(grandTotal)}</Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity className="min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-200" onPress={onOpenHoldBill} disabled={itemCount === 0}>
            <Text className={cn('text-sm font-bold', itemCount === 0 ? 'text-slate-300' : 'text-slate-700')}>พักบิล</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={cn('min-h-12 flex-[1.7] items-center justify-center rounded-xl', itemCount === 0 ? 'bg-slate-300' : 'bg-emerald-500')}
            onPress={onOpenCart}
            disabled={itemCount === 0}
          >
            <Text className="text-sm font-extrabold text-white">ตรวจบิล / ชำระเงิน</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const HeaderAction = ({ icon, label, onPress, danger = false }: { icon: string; label: string; onPress: () => void; danger?: boolean }) => (
    <TouchableOpacity className="min-h-11 min-w-[64px] items-center justify-center rounded-xl px-2 py-1" onPress={onPress}>
      <Ionicons name={icon as any} size={18} color={danger ? '#fecdd3' : '#fff'} />
      <Text className={cn('text-xs font-bold', danger ? 'text-rose-200' : 'text-white/85')} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      {/* Top Bar */}
      <View className="gap-2 bg-rose-500 px-3 py-2.5">
        <View className="flex-row items-center gap-2">
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-extrabold text-white" numberOfLines={1}>{posName}</Text>
            <Text className="text-xs font-bold text-rose-200" numberOfLines={1}>{cashierName}</Text>
          </View>

          {mode !== 'both' && (
            <View className={cn('min-h-9 flex-row items-center gap-1 rounded-full px-3 py-1.5', mode === 'scan_only' ? 'bg-emerald-500' : 'bg-white/20')}>
              <Ionicons name={mode === 'scan_only' ? 'barcode-outline' : 'grid-outline'} size={12} color="#fff" />
              <Text className="text-xs font-extrabold text-white">{mode === 'scan_only' ? 'Scan' : 'Button'}</Text>
            </View>
          )}

          <TouchableOpacity className="min-h-11 min-w-11 items-center justify-center rounded-xl bg-rose-600/45" onPress={() => setShowModeSettings(true)}>
            <Ionicons name="options-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {mode === 'both' && (
          <View className="self-start flex-row gap-0.5 rounded-xl bg-rose-600/50 p-0.5">
            <TouchableOpacity
              className={cn('min-h-10 flex-row items-center gap-1 rounded-lg px-3 py-2', activeTab === 'grid' && 'bg-white')}
              onPress={() => setActiveTab('grid')}
            >
              <Ionicons name="grid-outline" size={14} color={activeTab === 'grid' ? '#e11d48' : '#fff'} />
              <Text className={cn('text-xs font-extrabold', activeTab === 'grid' ? 'text-rose-600' : 'text-white')}>ปุ่ม</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={cn('min-h-10 flex-row items-center gap-1 rounded-lg px-3 py-2', activeTab === 'scan' && 'bg-white')}
              onPress={() => setActiveTab('scan')}
            >
              <Ionicons name="barcode-outline" size={14} color={activeTab === 'scan' ? '#e11d48' : '#fff'} />
              <Text className={cn('text-xs font-extrabold', activeTab === 'scan' ? 'text-rose-600' : 'text-white')}>สแกน</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, paddingRight: 8 }}>
          <HeaderAction icon="storefront-outline" label="Kiosk" onPress={() => navigation.navigate('KioskSetup' as never)} />
          <HeaderAction icon="tv-outline" label="จอ 2" onPress={onOpenCustomerDisplay} />
          <HeaderAction icon="pause-circle-outline" label="พักบิล" onPress={onOpenHoldBill} />
          <HeaderAction icon="close-circle-outline" label="ยกเลิก" onPress={onCancelBill} danger />
        </ScrollView>
      </View>

      <View className={cn('flex-1', showTabletCartRail && 'flex-row')}>
        <View className="flex-1">
          {mode === 'button_only' && <GridPanel />}
          {mode === 'scan_only' && <ScannerPanel />}
          {mode === 'both' && (
            canUseSplitScanner ? (
              <View className="flex-1 flex-row gap-3 p-3">
                <View className="flex-[1.35] overflow-hidden rounded-xl bg-white">
                  <GridPanel />
                </View>
                <View className="flex-1">
                  <ScannerPanel compact />
                </View>
              </View>
            ) : (
              activeTab === 'grid' ? <GridPanel /> : <ScannerPanel />
            )
          )}
        </View>
        {showTabletCartRail && <TabletCartRail />}
      </View>

      {/* Cart Bar */}
      {!showTabletCartRail && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          className="absolute left-0 right-0"
          style={{ bottom: 0 }}
        >
        <TouchableOpacity
        className={cn('flex-row items-center justify-between px-5 py-3.5 shadow-lg',
          itemCount === 0 ? 'bg-slate-400' : 'bg-rose-500')}
        style={{ paddingBottom: bottomActionInset, boxShadow: '0 22px 56px rgba(15, 23, 42, 0.16)' }}
        onPress={onOpenCart}
        activeOpacity={0.9}
        disabled={itemCount === 0}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
            <Text className="text-xs font-extrabold text-rose-600">{itemCount}</Text>
          </View>
          <Text className="text-sm font-bold text-white">รายการในบิล</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-lg font-extrabold text-white">฿{formatCurrency(grandTotal)}</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </View>
        </TouchableOpacity>
        </Animated.View>
      )}

      {/* UOM Selector */}
      <UomSelector visible={showUomSelector} masterProduct={selectedMaster} onSelect={(p) => addItem(p)} onClose={() => setShowUomSelector(false)} />

      {/* Service Staff Popup */}
      <ServiceStaffPopup visible={showStaffPopup} productName={serviceProduct?.name ?? ''}
        technicians={MOCK_TECHNICIANS}
        onSelect={(tech) => { if (serviceProduct) { addServiceItem(serviceProduct, tech.id, tech.name); } setShowStaffPopup(false); setServiceProduct(null); }}
        onClose={() => { setShowStaffPopup(false); setServiceProduct(null); }}
      />

      {/* Quick Add Modal */}
      <AppModal visible={showQuickAdd} onClose={() => { setShowQuickAdd(false); setQuickAddProduct(null); }} title="เพิ่มจำนวน" size="sm">
        <View className="gap-3 py-2">
          <Text className="text-center text-sm font-bold text-slate-500">เพิ่ม {quickAddProduct?.name} กี่ชิ้น?</Text>
          <View className="flex-row flex-wrap justify-center gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity key={amt} className="min-w-[56px] items-center rounded-xl bg-rose-500 px-4 py-3 shadow-sm" onPress={() => handleQuickAdd(amt)}>
                <Text className="text-base font-extrabold text-white">{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </AppModal>

      {/* Sale Mode Settings Modal */}
      <AppModal visible={showModeSettings} onClose={() => setShowModeSettings(false)} title="ตั้งค่าโหมดขาย" size="md">
        <SaleModePicker onClose={() => setShowModeSettings(false)} />
      </AppModal>
    </SafeAreaView>
  );
};

const cornerStyles = {
  TL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, width: 24, height: 24, borderTopLeftRadius: 4 },
  TR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, width: 24, height: 24, borderTopRightRadius: 4 },
  BL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, width: 24, height: 24, borderBottomLeftRadius: 4 },
  BR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, width: 24, height: 24, borderBottomRightRadius: 4 },
};
