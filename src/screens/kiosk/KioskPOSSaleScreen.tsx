/**
 * KioskPOSSaleScreen — M03 หน้าขายแบบ Kiosk
 * รองรับ 3 layouts:
 *   compact   → mobile (สลับ grid/scan)
 *   split     → tablet landscape (grid ซ้าย + scanner ขวา)
 *   fullgrid  → widescreen (grid ใหญ่เต็มจอ + sidebar cart)
 *
 * ปุ่ม "ออก Kiosk" มุมขวาบน (กดค้าง 2 วิ → PIN modal)
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Dimensions, Vibration, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { useKioskStore } from '../../store/kioskStore';
import { useSaleModeStore } from '../../store/saleModeStore';
import { Product } from '../../types/sale';
import { ProductUOM } from '../../types/product';
import { MOCK_PRODUCTS, findProductByBarcode } from '../../data/mockProducts';
import { KioskExitModal } from '../../components/kiosk/KioskExitModal';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';
import { IS_WEB } from '../../utils/platform';

const { width: W, height: H } = Dimensions.get('window');
const isWide    = W >= 1024;
const isTablet  = W >= 768 && !isWide;

// convert master+uom → cart product
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
const CATEGORIES = ['ทั้งหมด', 'เครื่องดื่ม', 'อาหาร', 'ขนม', 'ของใช้'];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onOpenCart:   () => void;
  onExitKiosk:  () => void;
  posName?:     string;
  cashierName?: string;
}

// ─── Cart Sidebar (fullgrid layout) ──────────────────────────────────────────
const CartSidebar: React.FC<{ onCheckout: () => void }> = ({ onCheckout }) => {
  const { items, removeItem, updateQty, getGrandTotal, getItemCount } = useCartStore();
  return (
    <View style={sidebar.container}>
      <View style={sidebar.header}>
        <Ionicons name="cart-outline" size={20} color={Colors.primary} />
        <Text style={sidebar.title}>รายการ ({getItemCount()})</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={i => i.product.id}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <View style={sidebar.row}>
            <View style={{ flex: 1 }}>
              <Text style={sidebar.name} numberOfLines={1}>{item.product.name}</Text>
              <Text style={sidebar.price}>฿{formatCurrency(item.unitPrice)}</Text>
            </View>
            <View style={sidebar.qtyRow}>
              <TouchableOpacity style={sidebar.qtyBtn} onPress={() => updateQty(item.product.id, item.qty - 1)}>
                <Ionicons name="remove" size={14} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={sidebar.qty}>{item.qty}</Text>
              <TouchableOpacity style={sidebar.qtyBtn} onPress={() => updateQty(item.product.id, item.qty + 1)}>
                <Ionicons name="add" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={sidebar.sub}>฿{formatCurrency(item.subtotal)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={sidebar.empty}>
            <Ionicons name="cart-outline" size={40} color={Colors.border} />
            <Text style={sidebar.emptyText}>ยังไม่มีสินค้า</Text>
          </View>
        }
      />
      <View style={sidebar.footer}>
        <View style={sidebar.totalRow}>
          <Text style={sidebar.totalLabel}>ยอดรวม</Text>
          <Text style={sidebar.totalValue}>฿{formatCurrency(getGrandTotal())}</Text>
        </View>
        <TouchableOpacity
          style={[sidebar.checkoutBtn, items.length === 0 && sidebar.checkoutBtnDisabled]}
          onPress={onCheckout}
          disabled={items.length === 0}
        >
          <Ionicons name="card-outline" size={20} color={Colors.white} />
          <Text style={sidebar.checkoutText}>ชำระเงิน</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const sidebar = StyleSheet.create({
  container: { width: 280, backgroundColor: Colors.surface, borderLeftWidth: 1, borderLeftColor: Colors.border, flexDirection: 'column' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.secondary },
  title: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  name: { ...Typography.caption, color: Colors.text, fontWeight: '500' },
  price: { ...Typography.caption, color: Colors.textSecondary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 24, height: 24, borderRadius: BorderRadius.sm, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary },
  qty: { ...Typography.label, color: Colors.text, minWidth: 24, textAlign: 'center' },
  sub: { ...Typography.label, color: Colors.primary, fontWeight: '700', minWidth: 60, textAlign: 'right' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: Spacing.sm },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
  footer: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm, backgroundColor: Colors.surfaceWarm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { ...Typography.label, color: Colors.text },
  totalValue: { ...Typography.h4, color: Colors.primary, fontWeight: '800' },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  checkoutBtnDisabled: { backgroundColor: Colors.gray300 },
  checkoutText: { ...Typography.button, color: Colors.white },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
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

  // scan feedback
  const [scanMsg, setScanMsg]     = useState('');
  const [scanOk, setScanOk]       = useState(false);

  const itemCount  = getItemCount();
  const grandTotal = getGrandTotal();

  const effectiveLayout: 'compact' | 'split' | 'fullgrid' =
    layout === 'fullgrid' ? 'fullgrid' :
    layout === 'split' || isTablet ? 'split' :
    'compact';

  // Filtered products
  const filtered = ALL_PRODUCTS.filter(p => {
    const matchCat  = category === 'ทั้งหมด' || p.category === category;
    const matchSrch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    return matchCat && matchSrch && p.unit === (MOCK_PRODUCTS.find(m => m.id === p.id.split('_')[0])?.unit ?? p.unit);
  });

  const cols = effectiveLayout === 'fullgrid' ? 5 : effectiveLayout === 'split' ? 3 : 3;
  const cardW = (W - (effectiveLayout === 'fullgrid' ? 280 + Spacing.md * 2 : Spacing.md * 2) - Spacing.xs * (cols - 1)) / cols;

  // ── Scan handler ────────────────────────────────────────────────────────────
  const handleScan = useCallback((barcode: string) => {
    if (!barcode.trim()) return;
    const result = findProductByBarcode(barcode.trim(), MOCK_PRODUCTS);
    if (result) {
      const p = toCartProduct(result.product, result.uom);
      addItem(p);
      setScanOk(true);
      setScanMsg(`✓ ${p.name} — ฿${formatCurrency(p.price)}`);
      Vibration.vibrate(60);
    } else {
      setScanOk(false);
      setScanMsg(`✗ ไม่พบสินค้า: ${barcode}`);
      Vibration.vibrate([0, 80, 40, 80]);
    }
    setScanInput('');
    setTimeout(() => setScanMsg(''), 2000);
  }, [addItem]);

  // ── Hold-to-exit ─────────────────────────────────────────────────────────
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

  // ── Product card ────────────────────────────────────────────────────────────
  const renderProduct = ({ item: p }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.card, { width: cardW }, p.stockQty === 0 && styles.cardOut]}
      onPress={() => p.stockQty > 0 && addItem(p)}
      disabled={p.stockQty === 0}
      activeOpacity={0.75}
    >
      <View style={styles.cardIcon}>
        <Ionicons name="cube-outline" size={effectiveLayout === 'fullgrid' ? 28 : 22} color={Colors.primary} />
        {p.stockQty === 0 && <View style={styles.outOverlay}><Text style={styles.outText}>หมด</Text></View>}
        {p.stockQty > 0 && p.stockQty <= 5 && (
          <View style={styles.lowBadge}><Text style={styles.lowText}>{p.stockQty}</Text></View>
        )}
      </View>
      <Text style={[styles.cardName, effectiveLayout === 'fullgrid' && styles.cardNameLg]} numberOfLines={2}>{p.name}</Text>
      <Text style={[styles.cardPrice, effectiveLayout === 'fullgrid' && styles.cardPriceLg]}>฿{formatCurrency(p.price)}</Text>
    </TouchableOpacity>
  );

  // ── Grid panel ──────────────────────────────────────────────────────────────
  const GridPanel = (
    <View style={{ flex: 1 }}>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาสินค้า..."
          placeholderTextColor={Colors.textDisabled}
          value={search}
          onChangeText={setSearch}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={c => c}
        contentContainerStyle={styles.catRow}
        renderItem={({ item: c }) => (
          <TouchableOpacity
            style={[styles.catChip, category === c && styles.catChipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
          </TouchableOpacity>
        )}
      />
      <FlatList
        data={filtered}
        key={`grid-${cols}`}
        numColumns={cols}
        keyExtractor={p => p.id}
        renderItem={renderProduct}
        columnWrapperStyle={{ gap: Spacing.xs }}
        contentContainerStyle={[styles.grid, { paddingBottom: effectiveLayout !== 'fullgrid' ? 72 : Spacing.md }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={44} color={Colors.border} />
            <Text style={styles.emptyText}>ไม่พบสินค้า</Text>
          </View>
        }
      />
    </View>
  );

  // ── Scanner panel ───────────────────────────────────────────────────────────
  const ScanPanel = (
    <View style={styles.scanContainer}>
      <View style={styles.scanViewfinder}>
        {/* corners */}
        {(['TL','TR','BL','BR'] as const).map(corner => (
          <View key={corner} style={[styles.corner, styles[`corner${corner}`]]} />
        ))}
        <Ionicons name="scan-outline" size={80} color={`${Colors.primary}40`} />
      </View>
      {scanMsg !== '' && (
        <View style={[styles.scanMsg, { backgroundColor: scanOk ? Colors.successLight : Colors.dangerLight }]}>
          <Text style={[styles.scanMsgText, { color: scanOk ? Colors.success : Colors.danger }]}>{scanMsg}</Text>
        </View>
      )}
      <View style={styles.scanInputRow}>
        <TextInput
          style={styles.scanInput}
          value={scanInput}
          onChangeText={setScanInput}
          placeholder="สแกนหรือกรอกบาร์โค้ด..."
          placeholderTextColor={Colors.textDisabled}
          returnKeyType="done"
          onSubmitEditing={() => handleScan(scanInput)}
          autoFocus
        />
        <TouchableOpacity style={styles.scanGo} onPress={() => handleScan(scanInput)}>
          <Ionicons name="arrow-forward-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Kiosk top bar ── */}
      <View style={styles.topBar}>
        {/* Left */}
        <View style={styles.topLeft}>
          <View style={styles.kioskBadge}>
            <Ionicons name="storefront" size={13} color={Colors.primary} />
            <Text style={styles.kioskBadgeText}>KIOSK</Text>
          </View>
          <Text style={styles.posName}>{posName}</Text>
        </View>

        {/* Center: tab switcher (compact only) */}
        {effectiveLayout === 'compact' && (
          <View style={styles.tabSwitch}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'grid' && styles.tabBtnActive]}
              onPress={() => setActiveTab('grid')}
            >
              <Ionicons name="grid-outline" size={15} color={activeTab === 'grid' ? Colors.primary : Colors.white} />
              <Text style={[styles.tabBtnText, activeTab === 'grid' && { color: Colors.primary }]}>ปุ่ม</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'scan' && styles.tabBtnActive]}
              onPress={() => setActiveTab('scan')}
            >
              <Ionicons name="barcode-outline" size={15} color={activeTab === 'scan' ? Colors.primary : Colors.white} />
              <Text style={[styles.tabBtnText, activeTab === 'scan' && { color: Colors.primary }]}>สแกน</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Right */}
        <View style={styles.topRight}>
          {IS_WEB && (
            <TouchableOpacity style={styles.iconBtn} onPress={toggleFullscreen}>
              <Ionicons name={isFullscreen ? 'contract-outline' : 'expand-outline'} size={18} color={Colors.white} />
            </TouchableOpacity>
          )}
          {/* Exit Kiosk button — กดค้าง 2 วิ */}
          <View style={styles.exitWrap}>
            <TouchableOpacity
              style={styles.exitBtn}
              onPressIn={startHold}
              onPressOut={cancelHold}
              activeOpacity={0.85}
            >
              <Ionicons name="lock-open-outline" size={15} color={Colors.white} />
              <Text style={styles.exitBtnText}>
                {holdProgress > 0 ? `${Math.ceil((100 - holdProgress) / 50)}s` : 'ออก Kiosk'}
              </Text>
            </TouchableOpacity>
            {holdProgress > 0 && (
              <View style={[styles.holdBar, { width: `${holdProgress}%` }]} />
            )}
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.body}>
        {/* fullgrid: grid + sidebar */}
        {effectiveLayout === 'fullgrid' && (
          <>
            <View style={{ flex: 1 }}>{GridPanel}</View>
            <CartSidebar onCheckout={onOpenCart} />
          </>
        )}
        {/* split: grid ซ้าย + scanner ขวา */}
        {effectiveLayout === 'split' && (
          <>
            <View style={{ flex: 1.4 }}>{GridPanel}</View>
            <View style={styles.splitDivider} />
            <View style={{ flex: 1 }}>{ScanPanel}</View>
          </>
        )}
        {/* compact: สลับ tab */}
        {effectiveLayout === 'compact' && (
          activeTab === 'grid' ? GridPanel : ScanPanel
        )}
      </View>

      {/* ── Cart bar (compact + split) ── */}
      {effectiveLayout !== 'fullgrid' && (
        <TouchableOpacity
          style={[styles.cartBar, itemCount === 0 && styles.cartBarEmpty]}
          onPress={onOpenCart}
          disabled={itemCount === 0}
        >
          <View style={styles.cartLeft}>
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{itemCount}</Text></View>
            <Text style={styles.cartLabel}>รายการในบิล</Text>
          </View>
          <Text style={styles.cartTotal}>฿{formatCurrency(grandTotal)}</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* Exit PIN modal */}
      <KioskExitModal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        onExited={() => { setShowExitModal(false); onExitKiosk(); }}
      />
    </SafeAreaView>
  );
};

const CW = 3;
const CS = 22;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.text, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, height: 44,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  kioskBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  kioskBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1.5 },
  posName: { ...Typography.label, color: Colors.white },
  tabSwitch: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 2, gap: 2 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm - 1 },
  tabBtnActive: { backgroundColor: Colors.white },
  tabBtnText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: { width: 30, height: 30, borderRadius: BorderRadius.sm, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  exitWrap: { position: 'relative', overflow: 'hidden', borderRadius: BorderRadius.md },
  exitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.danger, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
  },
  exitBtnText: { fontSize: 11, color: Colors.white, fontWeight: '700', minWidth: 50, textAlign: 'center' },
  holdBar: { position: 'absolute', bottom: 0, left: 0, height: 3, backgroundColor: Colors.secondary, borderRadius: 2 },

  // Body
  body: { flex: 1, flexDirection: 'row' },
  splitDivider: { width: 1, backgroundColor: Colors.border },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, margin: Spacing.sm,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 40,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.text },

  // Category
  catRow: { paddingHorizontal: Spacing.sm, paddingBottom: Spacing.xs, gap: Spacing.xs },
  catChip: { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },
  catTextActive: { color: Colors.white, fontWeight: '700' },

  // Grid
  grid: { paddingHorizontal: Spacing.sm, gap: Spacing.xs },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  cardOut: { opacity: 0.45 },
  cardIcon: {
    aspectRatio: 1, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  outOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center' },
  outText: { ...Typography.label, color: Colors.white },
  lowBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: Colors.warning, borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  lowText: { fontSize: 9, color: Colors.white, fontWeight: '800' },
  cardName: { ...Typography.caption, color: Colors.text, padding: 5, paddingBottom: 2 },
  cardNameLg: { fontSize: 12 },
  cardPrice: { ...Typography.label, color: Colors.primary, fontWeight: '700', paddingHorizontal: 5, paddingBottom: 5, fontSize: 12 },
  cardPriceLg: { fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: Spacing.sm },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },

  // Scanner
  scanContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.lg },
  scanViewfinder: { width: 200, height: 150, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: CS, height: CS, borderColor: Colors.primary },
  cornerTL: { top: 0, left: 0, borderTopWidth: CW, borderLeftWidth: CW },
  cornerTR: { top: 0, right: 0, borderTopWidth: CW, borderRightWidth: CW },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CW, borderLeftWidth: CW },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CW, borderRightWidth: CW },
  scanMsg: { borderRadius: BorderRadius.md, padding: Spacing.md, width: '90%', alignItems: 'center' },
  scanMsgText: { ...Typography.label, fontWeight: '600' },
  scanInputRow: { flexDirection: 'row', gap: Spacing.sm, width: '90%' },
  scanInput: {
    flex: 1, height: 50, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, ...Typography.body1, color: Colors.text,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  scanGo: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.secondary, borderRadius: BorderRadius.md },

  // Cart bar
  cartBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.primaryDark,
  },
  cartBarEmpty: { backgroundColor: Colors.gray400 },
  cartLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cartBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { ...Typography.label, color: Colors.primary, fontWeight: '800' },
  cartLabel: { ...Typography.body1, color: Colors.white },
  cartTotal: { ...Typography.h4, color: Colors.white, fontWeight: '800' },
});
