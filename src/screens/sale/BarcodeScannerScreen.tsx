/**
 * SCR-SALE-002 — Barcode Scanner Screen
 * FR-SALE-002: ใช้ Camera หรือ Bluetooth Scanner ค้นหาสินค้าจาก Barcode
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Vibration, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { Product } from '../../types/sale';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

// Mock barcode lookup
const BARCODE_MAP: Record<string, Product> = {
  '8850999000001': { id: '1', code: 'P001', barcode: '8850999000001', name: 'น้ำดื่มสิงห์ 600ml', category: 'เครื่องดื่ม', price: 10, cost: 6, vatIncluded: true, vatRate: 7, unit: 'ขวด', stockQty: 100 },
  '8850999000002': { id: '2', code: 'P002', barcode: '8850999000002', name: 'น้ำอัดลม Pepsi 325ml', category: 'เครื่องดื่ม', price: 15, cost: 9, vatIncluded: true, vatRate: 7, unit: 'กระป๋อง', stockQty: 50 },
};

interface BarcodeScannerScreenProps {
  onBack: () => void;
  onProductFound?: (product: Product) => void;
}

type ScanStatus = 'idle' | 'found' | 'not_found';

export const BarcodeScannerScreen: React.FC<BarcodeScannerScreenProps> = ({
  onBack,
  onProductFound,
}) => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const feedbackAnim = new Animated.Value(0);
  const { addItem } = useCartStore();

  useEffect(() => {
    // Request camera permission
    setHasPermission(true); // assume granted for now
  }, []);

  const handleBarcode = (barcode: string) => {
    if (!barcode.trim()) return;
    const product = BARCODE_MAP[barcode.trim()];
    if (product) {
      setFoundProduct(product);
      setScanStatus('found');
      Vibration.vibrate(80);
      showFeedback();
    } else {
      setFoundProduct(null);
      setScanStatus('not_found');
      Vibration.vibrate([0, 100, 50, 100]);
      showFeedback();
    }
    setScanCount((c) => c + 1);
  };

  const showFeedback = () => {
    feedbackAnim.setValue(0);
    Animated.sequence([
      Animated.timing(feedbackAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(feedbackAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setScanStatus('idle'));
  };

  const handleAddToCart = () => {
    if (foundProduct) {
      addItem(foundProduct);
      onProductFound?.(foundProduct);
      setManualBarcode('');
      setScanStatus('idle');
      setFoundProduct(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สแกน Barcode</Text>
        <View style={styles.scanCountBadge}>
          <Text style={styles.scanCountText}>{scanCount} รายการ</Text>
        </View>
      </View>

      {/* Camera Viewfinder Area */}
      <View style={styles.viewfinder}>
        {hasPermission === false ? (
          <View style={styles.permissionBox}>
            <Ionicons name="camera-outline" size={56} color={Colors.gray400} />
            <Text style={styles.permissionText}>ไม่ได้รับสิทธิ์เข้าถึงกล้อง</Text>
            <Text style={styles.permissionSub}>ใช้การกรอกบาร์โค้ดด้วยตนเองได้ด้านล่าง</Text>
          </View>
        ) : (
          <>
            {/* Scanner Frame */}
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              {/* Scan line animation */}
              <View style={styles.scanLine} />
            </View>
            <Text style={styles.scanHint}>จ่อกล้องไปที่บาร์โค้ดสินค้า</Text>
          </>
        )}

        {/* Feedback Overlay */}
        {scanStatus !== 'idle' && (
          <Animated.View
            style={[
              styles.feedbackOverlay,
              scanStatus === 'found' ? styles.feedbackSuccess : styles.feedbackError,
              { opacity: feedbackAnim },
            ]}
          >
            <Ionicons
              name={scanStatus === 'found' ? 'checkmark-circle' : 'close-circle'}
              size={64}
              color={Colors.white}
            />
            <Text style={styles.feedbackText}>
              {scanStatus === 'found' ? foundProduct?.name : 'ไม่พบสินค้า'}
            </Text>
            {scanStatus === 'found' && foundProduct && (
              <Text style={styles.feedbackPrice}>฿{formatCurrency(foundProduct.price)}</Text>
            )}
          </Animated.View>
        )}
      </View>

      {/* Found Product Card */}
      {scanStatus === 'found' && foundProduct && (
        <View style={styles.foundCard}>
          <View style={styles.foundInfo}>
            <View style={styles.foundIconBox}>
              <Ionicons name="cube-outline" size={32} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.foundName}>{foundProduct.name}</Text>
              <Text style={styles.foundCode}>{foundProduct.code} · {foundProduct.barcode}</Text>
            </View>
            <Text style={styles.foundPrice}>฿{formatCurrency(foundProduct.price)}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart} activeOpacity={0.85}>
            <Ionicons name="add-circle" size={20} color={Colors.white} />
            <Text style={styles.addBtnText}>เพิ่มลงบิล</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Not Found Card */}
      {scanStatus === 'not_found' && (
        <View style={styles.notFoundCard}>
          <Ionicons name="alert-circle-outline" size={24} color={Colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.notFoundTitle}>ไม่พบสินค้าในระบบ</Text>
            <Text style={styles.notFoundSub}>บาร์โค้ด: {manualBarcode}</Text>
          </View>
        </View>
      )}

      {/* Manual Input */}
      <View style={styles.manualSection}>
        <Text style={styles.manualLabel}>กรอกบาร์โค้ดด้วยตนเอง</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="กรอกบาร์โค้ด..."
            placeholderTextColor={Colors.gray400}
            value={manualBarcode}
            onChangeText={setManualBarcode}
            keyboardType="number-pad"
            returnKeyType="search"
            onSubmitEditing={() => handleBarcode(manualBarcode)}
          />
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => handleBarcode(manualBarcode)}
          >
            <Ionicons name="search" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scanCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  scanCountText: { ...Typography.caption, color: Colors.white },
  viewfinder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  permissionBox: { alignItems: 'center', gap: Spacing.md },
  permissionText: { ...Typography.body1, color: Colors.gray400 },
  permissionSub: { ...Typography.body2, color: Colors.gray400 },
  scanFrame: {
    width: 240, height: 180,
    position: 'relative', alignItems: 'center', justifyContent: 'center',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: Colors.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: Colors.primary, opacity: 0.8,
  },
  scanHint: { ...Typography.body2, color: Colors.textSecondary, marginTop: Spacing.lg },
  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  feedbackSuccess: { backgroundColor: 'rgba(16,185,129,0.85)' },
  feedbackError: { backgroundColor: 'rgba(239,68,68,0.85)' },
  feedbackText: { ...Typography.h4, color: Colors.white },
  feedbackPrice: { ...Typography.h3, color: Colors.white },
  foundCard: {
    backgroundColor: Colors.surface, margin: Spacing.md,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    gap: Spacing.sm,
  },
  foundInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  foundIconBox: {
    width: 56, height: 56, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  foundName: { ...Typography.body1, color: Colors.text, fontWeight: '600' },
  foundCode: { ...Typography.caption, color: Colors.textSecondary },
  foundPrice: { ...Typography.h4, color: Colors.primary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm, gap: Spacing.xs,
  },
  addBtnText: { ...Typography.button, color: Colors.white },
  notFoundCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.dangerLight, margin: Spacing.md,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
  },
  notFoundTitle: { ...Typography.label, color: Colors.danger },
  notFoundSub: { ...Typography.caption, color: Colors.danger },
  manualSection: {
    backgroundColor: Colors.surface, padding: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  manualLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm },
  manualRow: { flexDirection: 'row', gap: Spacing.sm },
  manualInput: {
    flex: 1, height: 48, backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    ...Typography.body1, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  manualBtn: {
    width: 48, height: 48, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
  },
});
