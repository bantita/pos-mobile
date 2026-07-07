import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, FlatList, Dimensions, Vibration, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { useCartStore } from '@/features/sale/application/stores/cartStore';
import { useKioskStore } from '@/features/kiosk/application/stores/kioskStore';
import { useSaleModeStore } from '@/features/sale/application/stores/saleModeStore';
import { Product } from '@/features/sale/domain/sale';
import { ProductUOM } from '@/features/product/domain/product';
import { MOCK_PRODUCTS, findProductByBarcode } from '@/features/product/data/mocks/mockProducts';
import { KioskExitModal } from '@/features/kiosk/presentation/components/KioskExitModal';
import { cn } from '@/shared/lib/cn';
import { formatCurrency } from '@/shared/lib/format';
import { IS_WEB } from '@/shared/lib/platform';
import { Text, TextInput } from '@/shared/tw/index';

const { width: W, height: H } = Dimensions.get('window');
const isWide    = W >= 1024;
const isTablet  = W >= 768 && !isWide;

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

const ALL_PRODUCTS: Product[] = MOCK_PRODUCTS.flatMap(m =>
  m.uoms.map(uom => toCartProduct(m, uom))
);
const CATEGORIES = ['ทั้งหมด', 'เครื่องดื่ม', 'ขนม', 'ข้าว', 'ของใช้'];

interface Props {
  onOpenCart:   () => void;
  onExitKiosk:  () => void;
  posName?:     string;
  cashierName?: string;
}

const CartSidebar: React.FC<{ onCheckout: () => void }> = ({ onCheckout }) => {
  const { items, removeItem, updateQty, getGrandTotal, getItemCount } = useCartStore();
  return (
    <View className="w-[280px] bg-white border-l border-rose-200 flex-col">
      <View className="flex-row items-center gap-2 p-3 border-b border-rose-200 bg-rose-50">
        <Ionicons name="cart-outline" size={20} color="#e11d48" />
        <Text className="text-xs font-bold text-slate-800">ตะกร้า ({getItemCount()})</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={i => i.product.id}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-2 px-3 py-2 border-b border-rose-50">
            <View className="flex-1">
              <Text className="text-xs font-medium text-slate-800" numberOfLines={1}>{item.product.name}</Text>
              <Text className="text-xs text-slate-500">฿{formatCurrency(item.unitPrice)}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <TouchableOpacity className="w-6 h-6 rounded-lg items-center justify-center bg-rose-100 border border-rose-400" onPress={() => updateQty(item.product.id, item.qty - 1)}>
                <Ionicons name="remove" size={14} color="#e11d48" />
              </TouchableOpacity>
              <Text className="text-xs font-bold text-slate-800 min-w-6 text-center">{item.qty}</Text>
              <TouchableOpacity className="w-6 h-6 rounded-lg items-center justify-center bg-rose-100 border border-rose-400" onPress={() => updateQty(item.product.id, item.qty + 1)}>
                <Ionicons name="add" size={14} color="#e11d48" />
              </TouchableOpacity>
            </View>
            <Text className="text-xs font-bold text-rose-600 min-w-[60px] text-right">฿{formatCurrency(item.subtotal)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-8 gap-2">
            <Ionicons name="cart-outline" size={40} color="#fecdd3" />
            <Text className="text-xs text-slate-400">ยังไม่มีสินค้า</Text>
          </View>
        }
      />
      <View className="p-3 border-t border-rose-200 gap-2 bg-rose-50">
        <View className="flex-row justify-between">
          <Text className="text-xs font-bold text-slate-800">รวม</Text>
          <Text className="text-base font-extrabold text-rose-600">฿{formatCurrency(getGrandTotal())}</Text>
        </View>
        <TouchableOpacity
          className={cn('flex-row items-center justify-center gap-2 rounded-2xl py-3', items.length === 0 ? 'bg-rose-200' : 'bg-rose-500 shadow-sm')}
          onPress={onCheckout}
          disabled={items.length === 0}
        >
          <Ionicons name="card-outline" size={20} color="#fafafa" />
          <Text className="text-xs font-bold text-white">ชำระเงิน</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const KioskPOSSaleScreen: React.FC<Props> = ({
  onOpenCart, onExitKiosk,
  posName = 'POS Kiosk', cashierName = 'พนักงาน',
}) => {
  const { addItem, getItemCount, getGrandTotal } = useCartStore();
  const { layout, isFullscreen, toggleFullscreen } = useKioskStore();

  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const [scanInput, setScanInput] = useState('');
  const [activeTab, setActiveTab] = useState<'grid' | 'scan'>('grid');
  const [showExitModal, setShowExitModal] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const [scanMsg, setScanMsg]     = useState('');
  const [scanOk, setScanOk]       = useState(false);

  const itemCount  = getItemCount();
  const grandTotal = getGrandTotal();

  const effectiveLayout: 'compact' | 'split' | 'fullgrid' =
    layout === 'fullgrid' ? 'fullgrid' :
    layout === 'split' || isTablet ? 'split' :
    'compact';

  const filtered = ALL_PRODUCTS.filter(p => {
    const matchCat  = category === 'ทั้งหมด' || p.category === category;
    const matchSrch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    return matchCat && matchSrch && p.unit === (MOCK_PRODUCTS.find(m => m.id === p.id.split('_')[0])?.unit ?? p.unit);
  });

  const cols = effectiveLayout === 'fullgrid' ? 5 : effectiveLayout === 'split' ? 3 : 3;
  const cardW = (W - (effectiveLayout === 'fullgrid' ? 280 + 12 * 2 : 12 * 2) - 4 * (cols - 1)) / cols;

  const handleScan = useCallback((barcode: string) => {
    if (!barcode.trim()) return;
    const result = findProductByBarcode(barcode.trim(), MOCK_PRODUCTS);
    if (result) {
      const p = toCartProduct(result.product, result.uom);
      addItem(p);
      setScanOk(true);
      setScanMsg(`✓ ${p.name} - ฿${formatCurrency(p.price)}`);
      Vibration.vibrate(60);
    } else {
      setScanOk(false);
      setScanMsg(`✗ ไม่พบบาร์โค้ด: ${barcode}`);
      Vibration.vibrate([0, 80, 40, 80]);
    }
    setScanInput('');
    setTimeout(() => setScanMsg(''), 2000);
  }, [addItem]);

  const startHold = () => {
    let p = 0;
    holdRef.current = setInterval(() => {
      p += 5;
      setHoldProgress(p);
      if (p >= 100) {
        clearInterval(holdRef.current!);
        setHoldProgress(0);
        setShowExitModal(true);
      }
    }, 100);
  };
  const cancelHold = () => {
    if (holdRef.current) clearInterval(holdRef.current);
    setHoldProgress(0);
  };

  const renderProduct = ({ item: p }: { item: Product }) => (
    <TouchableOpacity
      className={cn('bg-white rounded-2xl border border-rose-100 overflow-hidden mb-1 shadow-sm', p.stockQty === 0 && 'opacity-45')}
      style={{ width: cardW }}
      onPress={() => p.stockQty > 0 && addItem(p)}
      disabled={p.stockQty === 0}
      activeOpacity={0.75}
    >
      <View className="aspect-square bg-rose-50 items-center justify-center relative">
        <Ionicons name="cube-outline" size={effectiveLayout === 'fullgrid' ? 28 : 22} color="#e11d48" />
        {p.stockQty === 0 && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center">
            <Text className="text-xs font-bold text-white">หมด</Text>
          </View>
        )}
        {p.stockQty > 0 && p.stockQty <= 5 && (
          <View className="absolute top-1 right-1 bg-amber-500 rounded-full w-[18px] h-[18px] items-center justify-center">
            <Text className="text-[9px] text-white font-extrabold">{p.stockQty}</Text>
          </View>
        )}
      </View>
      <Text className={cn('text-xs font-medium text-slate-800 p-[5px] pb-[2px]', effectiveLayout === 'fullgrid' && 'text-xs')} numberOfLines={2}>{p.name}</Text>
      <Text className={cn('text-xs font-bold text-rose-600 px-[5px] pb-[5px]')}>฿{formatCurrency(p.price)}</Text>
    </TouchableOpacity>
  );

  const GridPanel = (
    <View className="flex-1">
      <View className="flex-row items-center gap-2 bg-white m-2 rounded-xl px-3 h-10 border border-rose-200 shadow-sm">
        <Ionicons name="search-outline" size={16} color="#64748b" />
        <TextInput
          className="flex-1 text-xs font-medium text-slate-800"
          placeholder="ค้นหาสินค้า..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={c => c}
        contentContainerClassName="px-2 pb-1 gap-1"
        renderItem={({ item: c }) => (
          <TouchableOpacity
            className={cn('px-2 py-[5px] rounded-full bg-white border border-rose-200', category === c && 'bg-rose-500 border-rose-500 shadow-sm')}
            onPress={() => setCategory(c)}
          >
            <Text className={cn('text-xs font-medium text-slate-600', category === c && 'text-white font-bold')}>{c}</Text>
          </TouchableOpacity>
        )}
      />
      <FlatList
        data={filtered}
        key={`grid-${cols}`}
        numColumns={cols}
        keyExtractor={p => p.id}
        renderItem={renderProduct}
        columnWrapperStyle={{ gap: 3 }}
        contentContainerClassName={cn('px-2 gap-1', effectiveLayout !== 'fullgrid' && 'pb-[72px]')}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-10 gap-2">
            <Ionicons name="search-outline" size={44} color="#fecdd3" />
            <Text className="text-xs text-slate-400">ไม่พบสินค้า</Text>
          </View>
        }
      />
    </View>
  );

  const ScanPanel = (
    <View className="flex-1 bg-rose-50 items-center justify-center gap-4 p-4">
      <View className="w-[200px] h-[150px] relative items-center justify-center">
        <View className="absolute top-0 left-0 w-[22px] h-[22px] border-t-[3px] border-l-[3px] border-rose-400" />
        <View className="absolute top-0 right-0 w-[22px] h-[22px] border-t-[3px] border-r-[3px] border-rose-400" />
        <View className="absolute bottom-0 left-0 w-[22px] h-[22px] border-b-[3px] border-l-[3px] border-rose-400" />
        <View className="absolute bottom-0 right-0 w-[22px] h-[22px] border-b-[3px] border-r-[3px] border-rose-400" />
        <Ionicons name="scan-outline" size={80} color="#fca5a5" />
      </View>
      {scanMsg !== '' && (
        <View className={cn('rounded-xl p-3 w-[90%] items-center', scanOk ? 'bg-emerald-100' : 'bg-rose-100')}>
          <Text className={cn('text-xs font-bold', scanOk ? 'text-emerald-600' : 'text-rose-600')}>{scanMsg}</Text>
        </View>
      )}
      <View className="flex-row gap-2 w-[90%]">
        <TextInput
          className="flex-1 h-[50px] bg-white rounded-xl px-3 text-xs font-medium text-slate-800 border-[1.5px] border-rose-200"
          value={scanInput}
          onChangeText={setScanInput}
          placeholder="สแกนบาร์โค้ดหรือพิมพ์..."
          placeholderTextColor="#64748b"
          returnKeyType="done"
          onSubmitEditing={() => handleScan(scanInput)}
          autoFocus
        />
        <TouchableOpacity className="w-[50px] h-[50px] items-center justify-center bg-white rounded-xl border border-rose-200" onPress={() => handleScan(scanInput)}>
          <Ionicons name="arrow-forward-circle" size={28} color="#e11d48" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['top']}>
      <View className="flex-row items-center justify-between px-3 py-2 h-11 bg-rose-700">
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1 bg-white rounded-full px-2 py-[3px] shadow-sm">
            <Ionicons name="storefront" size={13} color="#e11d48" />
            <Text className="text-[9px] font-extrabold text-rose-600 tracking-[1.5px]">KIOSK</Text>
          </View>
          <Text className="text-xs font-bold text-white">{posName}</Text>
        </View>

        {effectiveLayout === 'compact' && (
          <View className="flex-row bg-white/20 rounded-xl p-[2px] gap-[2px]">
            <TouchableOpacity
              className={cn('flex-row items-center gap-1 px-2 py-1 rounded-lg', activeTab === 'grid' && 'bg-white')}
              onPress={() => setActiveTab('grid')}
            >
              <Ionicons name="grid-outline" size={15} color={activeTab === 'grid' ? '#e11d48' : '#fecdd3'} />
              <Text className="text-[11px] font-bold" style={{ color: activeTab === 'grid' ? '#e11d48' : '#fecdd3' }}>สินค้า</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={cn('flex-row items-center gap-1 px-2 py-1 rounded-lg', activeTab === 'scan' && 'bg-white')}
              onPress={() => setActiveTab('scan')}
            >
              <Ionicons name="barcode-outline" size={15} color={activeTab === 'scan' ? '#e11d48' : '#fecdd3'} />
              <Text className="text-[11px] font-bold" style={{ color: activeTab === 'scan' ? '#e11d48' : '#fecdd3' }}>สแกน</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-row items-center gap-2">
          {IS_WEB && (
            <TouchableOpacity className="w-[30px] h-[30px] rounded-lg bg-white/20 items-center justify-center" onPress={toggleFullscreen}>
              <Ionicons name={isFullscreen ? 'contract-outline' : 'expand-outline'} size={18} color="#fafafa" />
            </TouchableOpacity>
          )}
          <View className="relative overflow-hidden rounded-xl">
            <TouchableOpacity
              className="flex-row items-center gap-[5px] px-2 py-[6px] rounded-xl bg-rose-500"
              onPressIn={startHold}
              onPressOut={cancelHold}
              activeOpacity={0.85}
            >
              <Ionicons name="lock-open-outline" size={15} color="#fafafa" />
              <Text className="text-[11px] text-white font-bold min-w-[50px] text-center">
                {holdProgress > 0 ? `${Math.ceil((100 - holdProgress) / 50)}s` : 'ออก Kiosk'}
              </Text>
            </TouchableOpacity>
            {holdProgress > 0 && (
              <View className="absolute bottom-0 left-0 h-[3px] bg-white rounded-[2px]" style={{ width: `${holdProgress}%` }} />
            )}
          </View>
        </View>
      </View>

      <View className="flex-1 flex-row">
        {effectiveLayout === 'fullgrid' && (
          <>
            <View className="flex-1">{GridPanel}</View>
            <CartSidebar onCheckout={onOpenCart} />
          </>
        )}
        {effectiveLayout === 'split' && (
          <>
            <View className="flex-[1.4]">{GridPanel}</View>
            <View className="w-[1px] bg-rose-200" />
            <View className="flex-1">{ScanPanel}</View>
          </>
        )}
        {effectiveLayout === 'compact' && (
          activeTab === 'grid' ? GridPanel : ScanPanel
        )}
      </View>

      {effectiveLayout !== 'fullgrid' && (
        <TouchableOpacity
          className={cn('flex-row items-center justify-between px-4 py-3 border-t bg-rose-500', itemCount === 0 && 'bg-rose-300')}
          style={{ borderTopColor: '#e11d48' }}
          onPress={onOpenCart}
          disabled={itemCount === 0}
        >
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-full bg-white items-center justify-center shadow-sm">
              <Text className="text-xs font-extrabold text-rose-600">{itemCount}</Text>
            </View>
            <Text className="text-xs font-bold text-white">ดูตะกร้าสินค้า</Text>
          </View>
          <Text className="text-base font-extrabold text-white">฿{formatCurrency(grandTotal)}</Text>
          <Ionicons name="chevron-forward" size={18} color="#fafafa" />
        </TouchableOpacity>
      )}

      <KioskExitModal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        onExited={() => { setShowExitModal(false); onExitKiosk(); }}
      />
    </SafeAreaView>
  );
};
