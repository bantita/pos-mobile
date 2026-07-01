/**
 * SCR-SALE-001 — POS Sale Screen
 * รองรับ 3 Sale Modes:
 *   button_only  → Product Grid เท่านั้น
 *   scan_only    → Scanner เท่านั้น
 *   both         → สลับ/แบ่ง Grid + Scanner ได้
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, Modal, Animated, Vibration, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { useSaleModeStore } from '../../store/saleModeStore';
import { Product } from '../../types/sale';
import { ProductUOM } from '../../types/product';
import { useNavigation } from '@react-navigation/native';
import { useKioskStore } from '../../store/kioskStore';
import { SaleModePicker } from '../../components/sale/SaleModePicker';
import { ServiceStaffPopup } from '../../components/sale/ServiceStaffPopup';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';
import { findProductByBarcode, MOCK_PRODUCTS } from '../../data/mockProducts';
import { MOCK_TECHNICIANS } from '../../data/mockStaff';
import { useStoreConfigStore } from '../../store/storeConfigStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Mock Products (Product type สำหรับ cart) ─────────────────────────────────
const CATEGORIES = ['ทั้งหมด', 'เครื่องดื่ม', 'อาหาร', 'ขนม', 'ของใช้'];

// แปลง ProductMaster → Product ตาม UOM ที่เลือก
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

// Flat list สินค้า + UOM ทุกตัว
const ALL_CART_PRODUCTS: Product[] = MOCK_PRODUCTS.flatMap((m) =>
  m.uoms.map((uom) => toCartProduct(m, uom))
);

// ─── Props ─────────────────────────────────────────────────────────────────────
interface POSSaleScreenProps {
  onOpenCart: () => void;
  onOpenScanner: () => void;
  onOpenHoldBill: () => void;
  onOpenCustomerDisplay: () => void;
  onCancelBill: () => void;
  cashierName?: string;
  posName?: string;
}

// ─── UOM Selector Sheet ────────────────────────────────────────────────────────
interface UOMSelectorProps {
  visible: boolean;
  masterProduct: typeof MOCK_PRODUCTS[0] | null;
  onSelect: (product: Product) => void;
  onClose: () => void;
}

const UOMSelector: React.FC<UOMSelectorProps> = ({ visible, masterProduct, onSelect, onClose }) => {
  if (!masterProduct) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={uomStyles.overlay}>
        <View style={uomStyles.sheet}>
          <View style={uomStyles.handle} />
          <Text style={uomStyles.title}>{masterProduct.name}</Text>
          <Text style={uomStyles.subtitle}>เลือกหน่วยที่ต้องการขาย</Text>
          {masterProduct.uoms.map((uom) => {
            const cartProduct = toCartProduct(masterProduct, uom);
            return (
              <TouchableOpacity
                key={uom.id}
                style={[uomStyles.uomRow, uom.isDefault && uomStyles.uomRowDefault]}
                onPress={() => { onSelect(cartProduct); onClose(); }}
                activeOpacity={0.8}
              >
                <View style={[uomStyles.unitBox, uom.ratio === 1 && { backgroundColor: Colors.primary }]}>
                  <Text style={[uomStyles.unitText, uom.ratio === 1 && { color: Colors.white }]}>
                    {uom.unit}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={uomStyles.ratioText}>
                    {uom.ratio === 1 ? 'หน่วยฐาน' : `1 ${uom.unit} = ${uom.ratio} ${masterProduct.unit}`}
                  </Text>
                  <View style={uomStyles.barcodeRow}>
                    {uom.barcodes.slice(0, 2).map((bc) => (
                      <View key={bc} style={uomStyles.barcodeChip}>
                        <Ionicons name="barcode" size={10} color={Colors.primary} />
                        <Text style={uomStyles.barcodeText}>{bc}</Text>
                      </View>
                    ))}
                    {uom.barcodes.length > 2 && (
                      <Text style={uomStyles.barcodeMore}>+{uom.barcodes.length - 2}</Text>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={uomStyles.price}>฿{formatCurrency(uom.salePrice)}</Text>
                  {uom.isDefault && (
                    <View style={uomStyles.defaultBadge}>
                      <Ionicons name="star" size={9} color={Colors.white} />
                      <Text style={uomStyles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={uomStyles.cancelBtn} onPress={onClose}>
            <Text style={uomStyles.cancelText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const uomStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, gap: Spacing.sm },
  handle: { width: 40, height: 4, backgroundColor: Colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xs },
  title: { ...Typography.h4, color: Colors.text },
  subtitle: { ...Typography.body2, color: Colors.textSecondary, marginTop: -Spacing.xs },
  uomRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.border,
  },
  uomRowDefault: { backgroundColor: Colors.primaryLight, borderColor: Colors.warning },
  unitBox: {
    minWidth: 52, paddingHorizontal: Spacing.sm, paddingVertical: 6,
    backgroundColor: Colors.gray200, borderRadius: BorderRadius.sm, alignItems: 'center',
  },
  unitText: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  ratioText: { ...Typography.caption, color: Colors.textSecondary },
  barcodeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  barcodeChip: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 },
  barcodeText: { fontSize: 9, color: Colors.primary },
  barcodeMore: { ...Typography.caption, color: Colors.gray400 },
  price: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.warning, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1, marginTop: 2 },
  defaultText: { fontSize: 9, color: Colors.white, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.xs },
  cancelText: { ...Typography.button, color: Colors.danger },
});

// ─── Scan Feedback overlay ─────────────────────────────────────────────────────
interface ScanFeedbackProps {
  status: 'idle' | 'found' | 'not_found';
  productName?: string;
  price?: number;
}
const ScanFeedback: React.FC<ScanFeedbackProps> = ({ status, productName, price }) => {
  if (status === 'idle') return null;
  return (
    <View style={[sfStyles.overlay, status === 'found' ? sfStyles.found : sfStyles.notFound]}>
      <Ionicons name={status === 'found' ? 'checkmark-circle' : 'close-circle'} size={40} color={Colors.white} />
      <Text style={sfStyles.text}>{status === 'found' ? productName : 'ไม่พบสินค้า'}</Text>
      {status === 'found' && price !== undefined && (
        <Text style={sfStyles.price}>฿{formatCurrency(price)}</Text>
      )}
    </View>
  );
};
const sfStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderRadius: BorderRadius.md, zIndex: 10 },
  found: { backgroundColor: 'rgba(16,185,129,0.92)' },
  notFound: { backgroundColor: 'rgba(239,68,68,0.92)' },
  text: { ...Typography.label, color: Colors.white, fontWeight: '700' },
  price: { ...Typography.h4, color: Colors.white },
});

// ─── Main Component ────────────────────────────────────────────────────────────
export const POSSaleScreen: React.FC<POSSaleScreenProps> = ({
  onOpenCart, onOpenScanner, onOpenHoldBill,
  onOpenCustomerDisplay, onCancelBill,
  cashierName = 'พนักงาน', posName = 'POS 1',
}) => {
  const navigation = useNavigation();
  const { addItem, getItemCount, getGrandTotal } = useCartStore();
  const { mode, gridColumns, autoOpenCamera, beepOnScan } = useSaleModeStore();

  // UI State
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchText, setSearchText] = useState('');
  const [showModeSettings, setShowModeSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'scan'>(
    mode === 'scan_only' ? 'scan' : 'grid'
  );

  // UOM selector
  const [showUOMSelector, setShowUOMSelector] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<typeof MOCK_PRODUCTS[0] | null>(null);

  // Service Staff popup
  const [showStaffPopup, setShowStaffPopup] = useState(false);
  const [serviceProduct, setServiceProduct] = useState<Product | null>(null);
  const { storeType } = useStoreConfigStore();
  const { addServiceItem } = useCartStore();

  // Scanner state
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [scanResult, setScanResult] = useState<{ name: string; price: number } | null>(null);
  const scanFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const itemCount = getItemCount();
  const grandTotal = getGrandTotal();

  // ── Filtered products ──
  const filteredProducts = ALL_CART_PRODUCTS.filter((p) => {
    const matchCat = selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
    const matchSearch = !searchText ||
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.barcode.includes(searchText) ||
      p.code.toLowerCase().includes(searchText.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Add product (จาก grid) ──
  const handleProductPress = useCallback((product: Product) => {
    // Check if this is a SERVICE product → show staff popup
    const master = MOCK_PRODUCTS.find((m) => product.id.startsWith(m.id + '_'));
    if (master && master.productType === 'service') {
      setServiceProduct(product);
      setShowStaffPopup(true);
      return;
    }
    // ถ้า master มีหลาย UOM → แสดง UOM selector
    if (master && master.uoms.length > 1 && !product.id.includes('uom_base') && product.unit === master.unit) {
      setSelectedMaster(master);
      setShowUOMSelector(true);
      return;
    }
    // default UOM → เพิ่มเลย
    addItem(product);
  }, [addItem]);

  const handleProductLongPress = useCallback((product: Product) => {
    // Long press → เลือก UOM เสมอ
    const master = MOCK_PRODUCTS.find((m) => product.id.startsWith(m.id + '_'));
    if (master && master.uoms.length > 1) {
      setSelectedMaster(master);
      setShowUOMSelector(true);
    } else {
      addItem(product);
    }
  }, [addItem]);

  // ── Scan barcode ──
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

  // ── Card width ──
  const cardWidth = (SCREEN_WIDTH - Spacing.md * 2 - Spacing.xs * (gridColumns - 1)) / gridColumns;

  // ── Product Card ──
  const renderProduct = ({ item }: { item: Product }) => {
    const isLargeUnit = !item.unit.match(/^(ชิ้น|ขวด|กระป๋อง|ซอง|ถุง|ก้อน)$/);
    const master = MOCK_PRODUCTS.find((m) => item.id.startsWith(m.id + '_'));
    const isService = master?.productType === 'service';
    return (
      <TouchableOpacity
        style={[styles.productCard, { width: cardWidth }, item.stockQty === 0 && styles.outOfStock]}
        onPress={() => item.stockQty > 0 && handleProductPress(item)}
        onLongPress={() => item.stockQty > 0 && handleProductLongPress(item)}
        disabled={item.stockQty === 0}
        activeOpacity={0.75}
      >
        <View style={[styles.productIconBox, isLargeUnit && { backgroundColor: Colors.warningLight }, isService && styles.serviceIconBox]}>
          <Ionicons
            name={isService ? 'cut-outline' : isLargeUnit ? 'cube' : 'cube-outline'}
            size={gridColumns === 4 ? 20 : gridColumns === 3 ? 24 : 32}
            color={isService ? Colors.white : isLargeUnit ? Colors.warning : Colors.primary}
          />
          {isLargeUnit && !isService && (
            <View style={styles.uomBadge}>
              <Text style={styles.uomBadgeText}>{item.unit}</Text>
            </View>
          )}
          {isService && (
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>บริการ</Text>
            </View>
          )}
        </View>
        {item.stockQty === 0 ? (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>หมด</Text>
          </View>
        ) : item.stockQty <= 5 && !isService ? (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>{item.stockQty}</Text>
          </View>
        ) : null}
        <Text style={[styles.productName, gridColumns === 4 && styles.productNameSm]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.productPrice, gridColumns === 4 && styles.productPriceSm]}>
          ฿{formatCurrency(item.price)}
        </Text>
      </TouchableOpacity>
    );
  };

  // ── Scanner Panel ──
  const ScannerPanel = () => (
    <View style={styles.scanPanel}>
      {/* Viewfinder */}
      <View style={styles.viewfinder}>
        <View style={styles.scanFrame}>
          {(['TL','TR','BL','BR'] as const).map((corner) => (
            <View key={corner} style={[styles.corner, styles[`corner${corner}`]]} />
          ))}
          <View style={styles.scanLine} />
        </View>
        <Text style={styles.scanHint}>จ่อกล้องที่บาร์โค้ด หรือกรอกด้านล่าง</Text>
        <ScanFeedback status={scanStatus} productName={scanResult?.name} price={scanResult?.price} />
      </View>

      {/* Manual input */}
      <View style={styles.manualInputSection}>
        <View style={styles.manualInputRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="กรอกบาร์โค้ด..."
            placeholderTextColor={Colors.gray400}
            value={manualBarcode}
            onChangeText={setManualBarcode}
            keyboardType="default"
            returnKeyType="search"
            onSubmitEditing={() => handleScan(manualBarcode)}
            autoFocus={mode === 'scan_only' && autoOpenCamera}
          />
          <TouchableOpacity style={styles.scanSubmitBtn} onPress={() => handleScan(manualBarcode)}>
            <Ionicons name="search" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Recent scans */}
        {scanStatus !== 'idle' && scanResult && (
          <View style={[styles.lastScanCard, scanStatus === 'found' ? styles.lastScanFound : styles.lastScanNotFound]}>
            <Ionicons
              name={scanStatus === 'found' ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={18}
              color={scanStatus === 'found' ? Colors.success : Colors.danger}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.lastScanName, { color: scanStatus === 'found' ? Colors.success : Colors.danger }]}>
                {scanStatus === 'found' ? scanResult.name : 'ไม่พบสินค้าในระบบ'}
              </Text>
              {scanStatus === 'found' && (
                <Text style={styles.lastScanPrice}>฿{formatCurrency(scanResult.price)} · เพิ่มลงบิลแล้ว</Text>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );

  // ── Grid Panel ──
  const GridPanel = () => (
    <View style={{ flex: 1 }}>
      {/* Search */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาสินค้า..."
            placeholderTextColor={Colors.gray400}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category tabs */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catChip, selectedCategory === item && styles.catChipActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[styles.catChipText, selectedCategory === item && styles.catChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        key={`grid-${gridColumns}`}
        numColumns={gridColumns}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={[styles.productGrid, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: Spacing.xs }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>ไม่พบสินค้า</Text>
          </View>
        }
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.posName}>{posName}</Text>
          <Text style={styles.cashierName}>{cashierName}</Text>
        </View>

        {/* Mode switcher (compact) — แสดงเฉพาะ mode=both */}
        {mode === 'both' && (
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabSwitcherBtn, activeTab === 'grid' && styles.tabSwitcherBtnActive]}
              onPress={() => setActiveTab('grid')}
            >
              <Ionicons name="grid-outline" size={15} color={activeTab === 'grid' ? Colors.primary : Colors.white} />
              <Text style={[styles.tabSwitcherText, activeTab === 'grid' && { color: Colors.primary }]}>ปุ่ม</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabSwitcherBtn, activeTab === 'scan' && styles.tabSwitcherBtnActive]}
              onPress={() => setActiveTab('scan')}
            >
              <Ionicons name="barcode-outline" size={15} color={activeTab === 'scan' ? Colors.primary : Colors.white} />
              <Text style={[styles.tabSwitcherText, activeTab === 'scan' && { color: Colors.primary }]}>สแกน</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mode badge (scan/button only) */}
        {mode !== 'both' && (
          <View style={[styles.modeBadge, mode === 'scan_only' ? styles.modeBadgeScan : styles.modeBadgeGrid]}>
            <Ionicons name={mode === 'scan_only' ? 'barcode-outline' : 'grid-outline'} size={13} color={Colors.white} />
            <Text style={styles.modeBadgeText}>{mode === 'scan_only' ? 'Scan Mode' : 'Button Mode'}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.topActions}>
          {/* Kiosk Mode button */}
          <TouchableOpacity
            style={[styles.iconBtn, styles.kioskBtn]}
            onPress={() => navigation.navigate('KioskSetup' as never)}
          >
            <Ionicons name="storefront-outline" size={18} color={Colors.secondary} />
            <Text style={[styles.iconBtnLabel, { color: Colors.secondary }]}>Kiosk</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowModeSettings(true)}>
            <Ionicons name="options-outline" size={20} color={Colors.white} />
            <Text style={styles.iconBtnLabel}>Mode</Text>
          </TouchableOpacity>
          {/* จอ 2 — กดดูจอลูกค้า / กดค้างจัดการโฆษณา */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onOpenCustomerDisplay}
            onLongPress={() => navigation.navigate('AdManager' as never)}
            delayLongPress={600}
          >
            <Ionicons name="tv-outline" size={20} color={Colors.white} />
            <Text style={styles.iconBtnLabel}>จอ 2</Text>
          </TouchableOpacity>          <TouchableOpacity style={styles.iconBtn} onPress={onOpenHoldBill}>
            <Ionicons name="pause-circle-outline" size={20} color={Colors.white} />
            <Text style={styles.iconBtnLabel}>พัก</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onCancelBill}>
            <Ionicons name="close-circle-outline" size={20} color={Colors.dangerLight} />
            <Text style={[styles.iconBtnLabel, { color: Colors.dangerLight }]}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content Area ── */}
      <View style={{ flex: 1 }}>
        {mode === 'button_only' && <GridPanel />}
        {mode === 'scan_only' && <ScannerPanel />}
        {mode === 'both' && (
          <>
            {activeTab === 'grid' ? <GridPanel /> : <ScannerPanel />}
          </>
        )}
      </View>

      {/* ── Cart Bar ── */}
      <TouchableOpacity
        style={[styles.cartBar, itemCount === 0 && styles.cartBarEmpty]}
        onPress={onOpenCart}
        activeOpacity={0.9}
        disabled={itemCount === 0}
      >
        <View style={styles.cartLeft}>
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{itemCount}</Text>
          </View>
          <Text style={styles.cartLabel}>รายการในบิล</Text>
        </View>
        <View style={styles.cartRight}>
          <Text style={styles.cartTotal}>฿{formatCurrency(grandTotal)}</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.white} />
        </View>
      </TouchableOpacity>

      {/* ── UOM Selector ── */}
      <UOMSelector
        visible={showUOMSelector}
        masterProduct={selectedMaster}
        onSelect={(p) => addItem(p)}
        onClose={() => setShowUOMSelector(false)}
      />

      {/* ── Service Staff Popup ── */}
      <ServiceStaffPopup
        visible={showStaffPopup}
        productName={serviceProduct?.name ?? ''}
        technicians={MOCK_TECHNICIANS}
        onSelect={(tech) => {
          if (serviceProduct) {
            addServiceItem(serviceProduct, tech.id, tech.name);
          }
          setShowStaffPopup(false);
          setServiceProduct(null);
        }}
        onClose={() => {
          setShowStaffPopup(false);
          setServiceProduct(null);
        }}
      />

      {/* ── Sale Mode Settings Modal ── */}
      <Modal visible={showModeSettings} animationType="slide" transparent>
        <View style={styles.modeModalOverlay}>
          <View style={styles.modeModalSheet}>
            <SaleModePicker onClose={() => setShowModeSettings(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const CORNER_W = 3;
const CORNER_S = 22;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Top Bar
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    gap: Spacing.sm, flexWrap: 'wrap',
  },
  posName: { ...Typography.label, color: Colors.white, fontWeight: '700' },
  cashierName: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },

  tabSwitcher: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BorderRadius.md, padding: 3, gap: 2,
  },
  tabSwitcherBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: BorderRadius.sm - 1,
  },
  tabSwitcherBtnActive: { backgroundColor: Colors.white },
  tabSwitcherText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },

  modeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  modeBadgeScan: { backgroundColor: Colors.success },
  modeBadgeGrid: { backgroundColor: Colors.category1 },
  modeBadgeText: { fontSize: 10, color: Colors.white, fontWeight: '700' },

  topActions: { flexDirection: 'row', gap: Spacing.md, marginLeft: 'auto' },
  iconBtn: { alignItems: 'center', gap: 1 },
  iconBtnLabel: { fontSize: 9, color: 'rgba(255,255,255,0.8)' },
  kioskBtn: { backgroundColor: 'rgba(255,241,203,0.15)', borderRadius: BorderRadius.sm, paddingHorizontal: 5, paddingVertical: 3, borderWidth: 1, borderColor: Colors.secondary + '80' },

  // Search & Categories
  searchBarWrap: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, height: 40,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.text },
  categoryList: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.xs },
  catChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },
  catChipTextActive: { color: Colors.white, fontWeight: '700' },

  // Product Grid
  productGrid: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  productCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    position: 'relative', marginBottom: Spacing.xs,
  },
  outOfStock: { opacity: 0.45 },
  productIconBox: {
    aspectRatio: 1, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  uomBadge: {
    position: 'absolute', bottom: 3, left: 3,
    backgroundColor: Colors.warning, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1,
  },
  uomBadgeText: { fontSize: 8, color: Colors.white, fontWeight: '800' },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  outOfStockText: { ...Typography.label, color: Colors.white },
  lowStockBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: Colors.warning, borderRadius: 8, width: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  lowStockText: { fontSize: 9, color: Colors.white, fontWeight: '800' },
  productName: { ...Typography.caption, color: Colors.text, fontWeight: '500', paddingHorizontal: 5, paddingTop: 4, paddingBottom: 1 },
  productNameSm: { fontSize: 9 },
  productPrice: { ...Typography.label, color: Colors.primary, fontWeight: '700', paddingHorizontal: 5, paddingBottom: 5, fontSize: 12 },
  productPriceSm: { fontSize: 10 },
  serviceIconBox: { backgroundColor: Colors.category1 },
  serviceBadge: {
    position: 'absolute', bottom: 3, right: 3,
    backgroundColor: Colors.category1, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1,
  },
  serviceBadgeText: { fontSize: 8, color: Colors.white, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: Spacing.sm },
  emptyText: { ...Typography.body1, color: Colors.gray400 },

  // Scanner Panel
  scanPanel: { flex: 1 },
  viewfinder: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  scanFrame: { width: 220, height: 160, position: 'relative' },
  corner: { position: 'absolute', borderColor: Colors.primary },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W, width: CORNER_S, height: CORNER_S },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_W, borderRightWidth: CORNER_W, width: CORNER_S, height: CORNER_S },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W, width: CORNER_S, height: CORNER_S },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W, width: CORNER_S, height: CORNER_S },
  scanLine: { position: 'absolute', left: 0, right: 0, top: '50%', height: 2, backgroundColor: Colors.primary, opacity: 0.8 },
  scanHint: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.lg },
  manualInputSection: { backgroundColor: Colors.surface, padding: Spacing.md, gap: Spacing.sm },
  manualInputRow: { flexDirection: 'row', gap: Spacing.sm },
  manualInput: {
    flex: 1, height: 48, backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    ...Typography.body1, color: Colors.text, borderWidth: 1.5, borderColor: Colors.border,
  },
  scanSubmitBtn: { width: 48, height: 48, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  lastScanCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md, padding: Spacing.sm },
  lastScanFound: { backgroundColor: Colors.successLight },
  lastScanNotFound: { backgroundColor: Colors.dangerLight },
  lastScanName: { ...Typography.label },
  lastScanPrice: { ...Typography.caption, color: Colors.success },

  // Cart Bar
  cartBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 10,
  },
  cartBarEmpty: { backgroundColor: Colors.gray400 },
  cartLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cartBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  cartLabel: { ...Typography.body1, color: Colors.white },
  cartRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cartTotal: { ...Typography.h4, color: Colors.white },

  // Mode Modal
  modeModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modeModalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
});
