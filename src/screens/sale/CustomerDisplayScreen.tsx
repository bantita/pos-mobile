/**
 * CustomerDisplayScreen — จอที่ 2 (หันหน้าให้ลูกค้า)
 * Modes:
 *   idle              → Slideshow โฆษณา (รูป/วิดีโอ)
 *   cart              → รายการสินค้า + ยอดเงิน + ส่วนลด
 *   payment_pending   → ยอดที่ต้องชำระ (pulse)
 *   payment_success   → ชำระสำเร็จ + เงินทอน
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  Animated, Image, Dimensions, TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { useCustomerDisplayStore } from '../../store/customerDisplayStore';
import { CartItem } from '../../types/sale';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

const { width: W, height: H } = Dimensions.get('window');

// ─── Ad Slide ─────────────────────────────────────────────────────────────────
const AdSlide: React.FC<{
  uri: string;
  title?: string;
  subtitle?: string;
  type: 'image' | 'video';
}> = ({ uri, title, subtitle, type }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    return () => fadeAnim.setValue(0);
  }, [uri]);

  return (
    <Animated.View style={[styles.adSlide, { opacity: fadeAnim }]}>
      <Image
        source={{ uri }}
        style={styles.adImage}
        resizeMode="cover"
      />
      {/* Gradient overlay */}
      <View style={styles.adOverlay} />
      {/* Text */}
      {(title || subtitle) && (
        <View style={styles.adTextBox}>
          {title && <Text style={styles.adTitle}>{title}</Text>}
          {subtitle && <Text style={styles.adSubtitle}>{subtitle}</Text>}
        </View>
      )}
    </Animated.View>
  );
};

// ─── Idle Screen (Ad Slideshow) ───────────────────────────────────────────────
const IdleScreen: React.FC = () => {
  const { ads, currentAdIndex, nextAd, shopName } = useCustomerDisplayStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dotAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (ads.length === 0) return;
    const current = ads[currentAdIndex];
    timerRef.current = setInterval(() => {
      nextAd();
    }, (current?.duration ?? 5) * 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentAdIndex, ads]);

  // dot pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (ads.length === 0) {
    return (
      <View style={styles.idleFallback}>
        <Ionicons name="storefront" size={100} color={Colors.primary} />
        <Text style={styles.idleShopName}>{shopName}</Text>
        <Text style={styles.idleWelcome}>ยินดีต้อนรับ</Text>
      </View>
    );
  }

  const currentAd = ads[currentAdIndex];

  return (
    <View style={styles.idleContainer}>
      <AdSlide
        key={currentAd.id}
        uri={currentAd.uri}
        title={currentAd.title}
        subtitle={currentAd.subtitle}
        type={currentAd.type}
      />

      {/* Shop name watermark */}
      <View style={styles.shopWatermark}>
        <Ionicons name="storefront" size={16} color="rgba(255,255,255,0.8)" />
        <Text style={styles.shopWatermarkText}>{shopName}</Text>
      </View>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {ads.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => useCustomerDisplayStore.getState().setMode('idle')}>
            <View style={[styles.dot, i === currentAdIndex && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Cart Screen ──────────────────────────────────────────────────────────────
const CartScreen: React.FC = () => {
  const { items, discount, getSubtotal, getDiscountTotal, getVatAmount, getGrandTotal, getItemCount } = useCartStore();
  const { shopName } = useCustomerDisplayStore();
  const subtotal    = getSubtotal();
  const discTotal   = getDiscountTotal();
  const vatAmount   = getVatAmount();
  const grandTotal  = getGrandTotal();
  const itemCount   = getItemCount();

  const renderItem = ({ item, index }: { item: CartItem; index: number }) => (
    <View style={[styles.cartRow, index % 2 === 1 && styles.cartRowAlt]}>
      <View style={styles.cartRowLeft}>
        <View style={styles.cartQtyBadge}>
          <Text style={styles.cartQtyText}>{item.qty}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
          <Text style={styles.cartItemUnit}>
            {item.product.unit} · ฿{formatCurrency(item.unitPrice)}
            {item.discountAmount > 0 && ` (-฿${formatCurrency(item.discountAmount)})`}
          </Text>
        </View>
      </View>
      <Text style={styles.cartItemSubtotal}>฿{formatCurrency(item.subtotal)}</Text>
    </View>
  );

  return (
    <View style={styles.cartContainer}>
      {/* Header */}
      <View style={styles.cartHeader}>
        <Ionicons name="storefront" size={20} color={Colors.white} />
        <Text style={styles.cartHeaderShop}>{shopName}</Text>
        <View style={styles.cartItemCountBadge}>
          <Text style={styles.cartItemCountText}>{itemCount} รายการ</Text>
        </View>
      </View>

      {/* Items */}
      {items.length === 0 ? (
        <View style={styles.cartEmpty}>
          <Ionicons name="cart-outline" size={80} color={Colors.primaryMid} />
          <Text style={styles.cartEmptyText}>กรุณาเลือกสินค้า</Text>
        </View>
      ) : (
        <>
          {/* Column Headers */}
          <View style={styles.colHeaders}>
            <Text style={[styles.colHeader, { flex: 1 }]}>สินค้า</Text>
            <Text style={[styles.colHeader, { width: 80, textAlign: 'right' }]}>ยอด</Text>
          </View>

          <FlatList
            data={items}
            keyExtractor={(i) => i.product.id}
            renderItem={renderItem}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {/* Summary Panel */}
      <View style={styles.summaryPanel}>
        {/* Rows */}
        <View style={styles.summaryRows}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ราคารวมสินค้า</Text>
            <Text style={styles.summaryValue}>฿{formatCurrency(subtotal)}</Text>
          </View>

          {discTotal > 0 && (
            <View style={styles.summaryRow}>
              <View style={styles.discountLabelRow}>
                <View style={styles.discountBadge}>
                  <Ionicons name="pricetag-outline" size={12} color={Colors.white} />
                  <Text style={styles.discountBadgeText}>
                    {discount?.type === 'percent' ? `ลด ${discount.value}%` : 'ส่วนลด'}
                  </Text>
                </View>
              </View>
              <Text style={styles.discountValue}>-฿{formatCurrency(discTotal)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>VAT 7% (รวมแล้ว)</Text>
            <Text style={styles.summaryValue}>฿{formatCurrency(vatAmount)}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.summaryDivider} />

        {/* Grand Total */}
        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>ยอดรวมสุทธิ</Text>
          <Text style={styles.grandTotalValue}>฿{formatCurrency(grandTotal)}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Payment Pending ──────────────────────────────────────────────────────────
const PaymentPendingScreen: React.FC = () => {
  const { getGrandTotal } = useCartStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.pendingContainer}>
      <View style={styles.pendingIconRow}>
        <Ionicons name="card-outline" size={56} color={Colors.secondary} />
      </View>
      <Text style={styles.pendingTitle}>กรุณาชำระเงิน</Text>
      <Animated.Text style={[styles.pendingAmount, { transform: [{ scale: pulseAnim }] }]}>
        ฿{formatCurrency(getGrandTotal())}
      </Animated.Text>
      {/* Payment icons */}
      <View style={styles.paymentIcons}>
        {[
          { icon: 'cash-outline', label: 'เงินสด' },
          { icon: 'qr-code-outline', label: 'QR Code' },
          { icon: 'card-outline', label: 'บัตรเครดิต' },
          { icon: 'phone-portrait-outline', label: 'โอนเงิน' },
        ].map((p) => (
          <View key={p.label} style={styles.paymentIcon}>
            <Ionicons name={p.icon as any} size={28} color={Colors.secondary} />
            <Text style={styles.paymentIconLabel}>{p.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.pendingHint}>กำลังรอการยืนยัน...</Text>
    </View>
  );
};

// ─── Payment Success ──────────────────────────────────────────────────────────
const PaymentSuccessScreen: React.FC = () => {
  const { paidAmount, changeAmount, getGrandTotal } = { ...useCustomerDisplayStore(), ...useCartStore() };
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const grandTotal = useCartStore.getState().getGrandTotal();

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.successContainer}>
      <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="checkmark" size={80} color={Colors.white} />
      </Animated.View>
      <Text style={styles.successTitle}>ชำระเงินสำเร็จ</Text>
      <Text style={styles.successAmount}>฿{formatCurrency(grandTotal)}</Text>

      {paidAmount > 0 && (
        <View style={styles.successDetails}>
          <View style={styles.successDetailRow}>
            <Text style={styles.successDetailLabel}>รับเงิน</Text>
            <Text style={styles.successDetailValue}>฿{formatCurrency(paidAmount)}</Text>
          </View>
          {changeAmount > 0 && (
            <View style={[styles.successDetailRow, styles.changeRow]}>
              <Text style={styles.changeLabel}>เงินทอน</Text>
              <Text style={styles.changeValue}>฿{formatCurrency(changeAmount)}</Text>
            </View>
          )}
        </View>
      )}
      <Text style={styles.thankYou}>ขอบคุณที่ใช้บริการ 🙏</Text>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface CustomerDisplayScreenProps {
  mode?: 'idle' | 'cart' | 'payment_pending' | 'payment_success';
  paidAmount?: number;
  changeAmount?: number;
  shopName?: string;
}

export const CustomerDisplayScreen: React.FC<CustomerDisplayScreenProps> = ({
  mode: propMode,
  paidAmount = 0,
  changeAmount = 0,
  shopName,
}) => {
  const store = useCustomerDisplayStore();
  const activeMode = propMode ?? store.mode;

  useEffect(() => {
    if (paidAmount) store.setPaidInfo(paidAmount, changeAmount);
    if (shopName) store.setShopName(shopName);
  }, [paidAmount, changeAmount, shopName]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {activeMode === 'idle'             && <IdleScreen />}
      {activeMode === 'cart'             && <CartScreen />}
      {activeMode === 'payment_pending'  && <PaymentPendingScreen />}
      {activeMode === 'payment_success'  && <PaymentSuccessScreen />}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.text },

  // ── Idle / Ad ──
  idleContainer: { flex: 1, position: 'relative' },
  adSlide: { flex: 1 },
  adImage: { width: '100%', height: '100%', position: 'absolute' },
  adOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  adTextBox: {
    position: 'absolute', bottom: 80, left: 0, right: 0,
    paddingHorizontal: Spacing.xl, gap: Spacing.xs,
  },
  adTitle: { fontSize: 36, fontWeight: '800', color: Colors.white, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 6 },
  adSubtitle: { fontSize: 20, color: 'rgba(255,255,255,0.9)', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  shopWatermark: { position: 'absolute', top: Spacing.md, left: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
  shopWatermarkText: { ...Typography.body2, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  dots: { position: 'absolute', bottom: 24, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: Colors.white, width: 24, borderRadius: 4 },
  idleFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, gap: Spacing.lg },
  idleShopName: { fontSize: 40, fontWeight: '800', color: Colors.white },
  idleWelcome: { fontSize: 24, color: 'rgba(255,255,255,0.8)' },

  // ── Cart ──
  cartContainer: { flex: 1, backgroundColor: Colors.primary },
  cartHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.primaryDark },
  cartHeaderShop: { ...Typography.h4, color: Colors.white, flex: 1 },
  cartItemCountBadge: { backgroundColor: Colors.secondary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  cartItemCountText: { fontSize: 12, color: Colors.text, fontWeight: '700' },
  cartEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  cartEmptyText: { fontSize: 22, color: Colors.primaryMid },
  colHeaders: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)' },
  colHeader: { ...Typography.caption, color: 'rgba(255,255,255,0.6)', fontWeight: '700', textTransform: 'uppercase' },
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  cartRowAlt: { backgroundColor: 'rgba(255,255,255,0.05)' },
  cartRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cartQtyBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  cartQtyText: { fontSize: 14, fontWeight: '800', color: Colors.text },
  cartItemName: { ...Typography.label, color: Colors.white, fontWeight: '500' },
  cartItemUnit: { ...Typography.caption, color: 'rgba(255,255,255,0.6)' },
  cartItemSubtotal: { fontSize: 18, fontWeight: '700', color: Colors.secondary },

  // Summary
  summaryPanel: { backgroundColor: 'rgba(0,0,0,0.4)', padding: Spacing.lg, gap: Spacing.sm },
  summaryRows: { gap: Spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...Typography.body1, color: 'rgba(255,255,255,0.75)' },
  summaryValue: { ...Typography.body1, color: Colors.white },
  discountLabelRow: { flexDirection: 'row', alignItems: 'center' },
  discountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.danger, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  discountBadgeText: { fontSize: 12, color: Colors.white, fontWeight: '700' },
  discountValue: { ...Typography.body1, color: Colors.danger, fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: Spacing.xs },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { fontSize: 22, fontWeight: '700', color: Colors.white },
  grandTotalValue: { fontSize: 44, fontWeight: '900', color: Colors.secondary, letterSpacing: 1 },

  // ── Pending ──
  pendingContainer: { flex: 1, backgroundColor: Colors.warning, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl },
  pendingIconRow: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  pendingTitle: { fontSize: 32, fontWeight: '700', color: Colors.white },
  pendingAmount: { fontSize: 64, fontWeight: '900', color: Colors.white },
  paymentIcons: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.md },
  paymentIcon: { alignItems: 'center', gap: Spacing.xs },
  paymentIconLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)' },
  pendingHint: { ...Typography.body1, color: 'rgba(255,255,255,0.7)' },

  // ── Success ──
  successContainer: { flex: 1, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl },
  successCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 36, fontWeight: '800', color: Colors.white },
  successAmount: { fontSize: 56, fontWeight: '900', color: Colors.white },
  successDetails: { width: '80%', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.sm },
  successDetailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  successDetailLabel: { ...Typography.body1, color: 'rgba(255,255,255,0.8)' },
  successDetailValue: { ...Typography.body1, color: Colors.white, fontWeight: '700' },
  changeRow: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.md, padding: Spacing.sm },
  changeLabel: { ...Typography.h4, color: Colors.white },
  changeValue: { ...Typography.h3, color: Colors.white, fontWeight: '900' },
  thankYou: { fontSize: 28, color: 'rgba(255,255,255,0.9)' },
});
