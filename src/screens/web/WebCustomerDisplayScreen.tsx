/**
 * WebCustomerDisplayScreen — จอที่ 2 (Single Layout)
 *
 * Layout คงที่ 1 หน้า split ซ้าย/ขวา:
 *   LEFT  : รายการสินค้า + summary  (เปลี่ยน state ตาม mode)
 *   RIGHT : ชื่อร้าน + ยอดชำระ + โฆษณา slideshow (ล่าง)
 *
 * Mode ไม่เปลี่ยน layout แค่เปลี่ยน:
 *   idle            → ยอด = 0, รายการว่าง, โฆษณาเล่น
 *   cart            → ยอด = grand total, รายการ = items
 *   payment_pending → ยอดกระพริบ, banner "กรุณาชำระ"
 *   payment_success → banner "สำเร็จ", เงินทอน
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Animated, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { useCustomerDisplayStore } from '../../store/customerDisplayStore';
import { WebColors } from '../../constants/webColors';

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

// ─── Ad Slideshow (ใช้ใน RIGHT panel ล่าง) ───────────────────────────────────
const AdSlide: React.FC = () => {
  const { ads, currentAdIndex, nextAd, shopName } = useCustomerDisplayStore();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (ads.length > 0) {
      const dur = (ads[currentAdIndex]?.duration ?? 5) * 1000;
      timerRef.current = setInterval(nextAd, dur);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentAdIndex, ads.length]);

  if (ads.length === 0) {
    return (
      <View style={cd.adEmpty}>
        <Ionicons name="images-outline" size={32} color={WebColors.gray300} />
        <Text style={cd.adEmptyTxt}>ยังไม่มีโฆษณา</Text>
      </View>
    );
  }

  const ad = ads[currentAdIndex];
  return (
    <Animated.View style={[cd.adSlide, { opacity: fadeAnim }]}>
      {ad?.type === 'image' && ad.uri
        ? <Image source={{ uri: ad.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        : <View style={[StyleSheet.absoluteFill, { backgroundColor: WebColors.grayDark }]} />}
      <View style={cd.adDim} />
      {(ad?.title || ad?.subtitle) && (
        <View style={cd.adCaption}>
          {ad.title    && <Text style={cd.adTitle}   numberOfLines={1}>{ad.title}</Text>}
          {ad.subtitle && <Text style={cd.adSubtitle} numberOfLines={1}>{ad.subtitle}</Text>}
        </View>
      )}
      {ads.length > 1 && (
        <View style={cd.dots}>
          {ads.map((_, i) => (
            <View key={i} style={[cd.dot, i === currentAdIndex && cd.dotActive]} />
          ))}
        </View>
      )}
    </Animated.View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
type DisplayMode = 'idle' | 'cart' | 'payment_pending' | 'payment_success';

interface DisplayItem {
  id: string;
  name: string;
  unitPrice: number;   // ราคาต่อหน่วย (อาจ override)
  qty: number;
  discAmt: number;     // ส่วนลดต่อหน่วย
  subtotal: number;    // มูลค่าสุทธิ (qty * (unitPrice - discAmt))
}

interface Props {
  mode?: DisplayMode;
  paidAmount?: number;
  changeAmount?: number;
  discountOverride?: number;   // ส่วนลดรวม (item + bill) จากจอ 1
  grandOverride?: number;      // ยอดสุทธิจากจอ 1
  displayItems?: DisplayItem[]; // items ที่คำนวณแล้วจากจอ 1
  onClose?: () => void;
  embedded?: boolean;
}

export const WebCustomerDisplayScreen: React.FC<Props> = ({
  mode: propMode, paidAmount = 0, changeAmount = 0,
  discountOverride, grandOverride, displayItems,
  onClose, embedded = false,
}) => {
  const store      = useCustomerDisplayStore();
  const cart       = useCartStore();
  const activeMode = propMode ?? store.mode;

  const subtotal  = cart.getSubtotal();
  // ใช้ค่าที่ส่งมาจากจอ 1 ก่อน ถ้าไม่มีค่าให้ fallback เป็น cartStore
  const discTotal = discountOverride !== undefined ? discountOverride
    : store.syncedDiscount > 0 ? store.syncedDiscount
    : cart.getDiscountTotal();
  const grand     = grandOverride     !== undefined ? grandOverride
    : store.syncedGrand   > 0 ? store.syncedGrand
    : cart.getGrandTotal();

  // items ที่จะแสดง — ใช้ displayItems จากจอ 1 ก่อน (มีข้อมูลราคา/ส่วนลด)
  // ถ้าไม่มีให้ใช้ syncedItems จาก BroadcastChannel
  const showItems = displayItems ?? (store.syncedItems.length > 0 ? store.syncedItems : cart.items.map(i => ({
    id:        i.product.id,
    name:      i.product.name,
    unitPrice: i.unitPrice,
    qty:       i.qty,
    discAmt:   i.discountAmount,
    subtotal:  i.subtotal,
  })));
  const totalQty  = showItems.reduce((s, i) => s + i.qty, 0);
  const lastItem  = showItems[showItems.length - 1];

  // pulse anim สำหรับ payment_pending
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (activeMode === 'payment_pending') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [activeMode]);

  useEffect(() => {
    if (paidAmount) store.setPaidInfo(paidAmount, changeAmount);
  }, [paidAmount, changeAmount]);

  // ── สี/ข้อความตาม mode ──
  const modeColor =
    activeMode === 'payment_pending' ? WebColors.warning
    : activeMode === 'payment_success' ? WebColors.success
    : WebColors.info;

  const modeDotColor =
    activeMode === 'payment_pending' ? WebColors.warning
    : activeMode === 'payment_success' ? WebColors.success
    : WebColors.success;

  const modeLabel: Record<DisplayMode, string> = {
    idle: 'โฆษณา',
    cart: 'รายการสินค้า',
    payment_pending: 'รอชำระ',
    payment_success: 'ชำระสำเร็จ',
  };

  // ── ยอด + banner text ──
  const renderAmountBox = () => {
    if (activeMode === 'payment_success') {
      return (
        <View style={[cd.amountBox, { borderColor: WebColors.success }]}>
          <Text style={[cd.amountTxt, { color: WebColors.success }]}>฿ {fmt(grand)}</Text>
        </View>
      );
    }
    if (activeMode === 'payment_pending') {
      return (
        <Animated.View style={[cd.amountBox, { borderColor: WebColors.warning, transform: [{ scale: pulseAnim }] }]}>
          <Text style={[cd.amountTxt, { color: WebColors.warning }]}>฿ {fmt(grand)}</Text>
        </Animated.View>
      );
    }
    return (
      <View style={cd.amountBox}>
        <Text style={cd.amountTxt}>฿ {fmt(grand)}</Text>
      </View>
    );
  };

  // ── banner ท้าย right panel ──
  const renderBanner = () => {
    if (activeMode === 'payment_pending') {
      return (
        <View style={[cd.banner, { backgroundColor: WebColors.warningLight, borderColor: WebColors.warning }]}>
          <Ionicons name="card-outline" size={18} color={WebColors.warning} />
          <Text style={[cd.bannerTxt, { color: WebColors.warning }]}>กรุณาชำระเงิน</Text>
        </View>
      );
    }
    if (activeMode === 'payment_success') {
      return (
        <View style={[cd.banner, { backgroundColor: WebColors.successLight, borderColor: WebColors.success }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color={WebColors.success} />
          <Text style={[cd.bannerTxt, { color: WebColors.success }]}>ชำระเงินสำเร็จ!</Text>
          {store.changeAmount > 0 && (
            <Text style={cd.changeTxt}>เงินทอน ฿ {fmt(store.changeAmount)}</Text>
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[cd.root, embedded && cd.rootEmbedded]}>

      {/* Close btn */}
      {onClose && (
        <TouchableOpacity style={cd.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={15} color={WebColors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* ────── ALL-IN-ONE LAYOUT ────── */}
      <View style={cd.splitRoot}>

        {/* ── LEFT : รายการสินค้า + summary ── */}
        <View style={cd.leftPanel}>

          {/* Mode badge */}
          <View style={cd.modeBadge}>
            <View style={[cd.modeDot, { backgroundColor: modeDotColor }]} />
            <Text style={cd.modeTxt}>{modeLabel[activeMode]}</Text>
          </View>

          {/* Header ตาราง */}
          <View style={cd.tableHead}>
            <Text style={[cd.tableH, { flex: 1 }]}>{totalQty} รายการ</Text>
            <Text style={[cd.tableH, { width: 44, textAlign: 'center' }]}>จน.</Text>
            <Text style={[cd.tableH, { width: 72, textAlign: 'right' }]}>ราคา</Text>
            <Text style={[cd.tableH, { width: 68, textAlign: 'right', color: WebColors.warning }]}>ลด</Text>
            <Text style={[cd.tableH, { width: 82, textAlign: 'right' }]}>สุทธิ</Text>
          </View>

          {/* รายการ */}
          <ScrollView style={cd.itemsList} showsVerticalScrollIndicator={false}>
            {showItems.length === 0
              ? <Text style={cd.noItems}>ยังไม่มีสินค้า</Text>
              : showItems.map((item, idx) => (
                <View key={item.id} style={[cd.itemRow, idx % 2 === 1 && cd.itemRowAlt]}>
                  <Text style={cd.itemIdx}>{idx + 1}.</Text>
                  <Text style={cd.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={[cd.itemCell, { width: 44, textAlign: 'center' }]}>{item.qty}</Text>
                  <Text style={[cd.itemCell, { width: 72, textAlign: 'right' }]}>฿{fmt(item.unitPrice)}</Text>
                  <Text style={[cd.itemCell, { width: 68, textAlign: 'right', color: item.discAmt > 0 ? WebColors.warning : WebColors.gray300 }]}>
                    {item.discAmt > 0 ? `-฿${fmt(item.discAmt)}` : '—'}
                  </Text>
                  <Text style={[cd.itemCell, { width: 82, textAlign: 'right', fontWeight: '700', color: WebColors.text }]}>
                    ฿{fmt(item.subtotal)}
                  </Text>
                </View>
              ))
            }
          </ScrollView>

          {/* Summary */}
          <View style={cd.summaryBox}>
            <View style={cd.sumRow}>
              <Text style={cd.sumLbl}>รวม</Text>
              <Text style={cd.sumVal}>฿ {fmt(subtotal)}</Text>
            </View>
            <View style={cd.sumRow}>
              <Text style={[cd.sumLbl, { color: WebColors.warning }]}>ส่วนลด</Text>
              <Text style={[cd.sumVal, { color: WebColors.warning }]}>
                {discTotal > 0 ? `-฿ ${fmt(discTotal)}` : '฿ 0.00'}
              </Text>
            </View>
            <View style={cd.sumDivider} />
            <View style={cd.sumRow}>
              <Text style={cd.sumTotalLbl}>ยอดรวมสุทธิ</Text>
              <Text style={[cd.sumTotalVal, { color: modeColor }]}>฿ {fmt(grand)}</Text>
            </View>
          </View>
        </View>

        {/* ── RIGHT : ร้าน + ยอด + โฆษณา + banner ─────────────────────── */}
        <View style={cd.rightPanel}>

          {/* ชื่อร้าน */}
          <View style={cd.shopRow}>
            <View style={cd.shopIconWrap}>
              <Ionicons name="storefront-outline" size={15} color={WebColors.primary} />
            </View>
            <Text style={cd.shopNameTxt} numberOfLines={1}>{store.shopName}</Text>
          </View>

          {/* Member Info */}
          {store.memberInfo && (
            <View style={{ backgroundColor: WebColors.warningLight, borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: WebColors.warning }}>{store.memberInfo.name}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: WebColors.warning }}>⭐ {store.memberInfo.points.toLocaleString()} pts</Text>
                <Text style={{ fontSize: 11, color: WebColors.success, fontWeight: '600' }}>💰 ฿{store.memberInfo.wallet.toLocaleString()}</Text>
              </View>
              <Text style={{ fontSize: 10, color: WebColors.warning, marginTop: 2 }}>ระดับ: {store.memberInfo.level}</Text>
            </View>
          )}

          {/* ยอดชำระ */}
          <Text style={cd.payLbl}>ยอดชำระเงิน</Text>
          {renderAmountBox()}

          {/* Banner pending/success — ซ้อนเหนือโฆษณา */}
          {renderBanner()}

          {/* โฆษณา Slideshow — ส่วนล่าง (แสดงทุก mode) */}
          <View style={cd.adWrap}>
            {/* overlay ตาม mode */}
            {activeMode === 'payment_pending' && (
              <View style={cd.adOverlay}>
                <Ionicons name="card-outline" size={48} color={WebColors.warning} />
                <Text style={[cd.adOverlayTxt, { color: WebColors.warning }]}>กรุณาชำระเงิน</Text>
                <Animated.Text style={[cd.adOverlayAmt, { color: WebColors.warning, transform: [{ scale: pulseAnim }] }]}>
                  ฿ {fmt(grand)}
                </Animated.Text>
              </View>
            )}
            {activeMode === 'payment_success' && (
              <View style={[cd.adOverlay, { backgroundColor: 'rgba(22,163,74,0.88)' }]}>
                <Ionicons name="checkmark-circle" size={56} color={WebColors.white} />
                <Text style={[cd.adOverlayTxt, { color: WebColors.white }]}>ชำระเงินสำเร็จ!</Text>
                {store.changeAmount > 0 && (
                  <Text style={[cd.adOverlayAmt, { color: WebColors.white, fontSize: 19 }]}>
                    เงินทอน ฿ {fmt(store.changeAmount)}
                  </Text>
                )}
              </View>
            )}
            <AdSlide />
          </View>
        </View>

      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const cd = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WebColors.gray50,
    ...(Platform.OS === 'web' ? { minHeight: '100%' as any } : {}),
  },
  rootEmbedded: { borderRadius: 12, overflow: 'hidden' as any },

  closeBtn: {
    position: 'absolute', top: 8, right: 8, zIndex: 99,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    marginHorizontal: 10, marginTop: 8, marginBottom: 4,
    borderWidth: 1, borderColor: WebColors.border,
  },
  modeDot: { width: 6, height: 6, borderRadius: 3 },
  modeTxt: { fontSize: 14, color: WebColors.textSecondary, fontWeight: '600' },

  // ── Split ──────────────────────────────────────────────────────────────────
  splitRoot: { flex: 1, flexDirection: 'row' },

  // LEFT
  leftPanel: {
    flex: 1, backgroundColor: WebColors.white,
    borderRightWidth: 1, borderRightColor: WebColors.border,
    flexDirection: 'column',
  },
  tableHead: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: WebColors.gray50,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
  },
  tableH: { fontSize: 15, fontWeight: '700', color: WebColors.textSecondary },

  itemsList: { flex: 1 },
  noItems: { padding: 20, textAlign: 'center', color: WebColors.textSecondary, fontSize: 13 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: WebColors.gray100,
  },
  itemRowAlt: { backgroundColor: WebColors.gray50 },
  itemIdx: { fontSize: 15, color: WebColors.textSecondary, width: 20 },
  itemName: { flex: 1, fontSize: 13, fontWeight: '500', color: WebColors.text },
  itemCell: { fontSize: 13, color: WebColors.text },

  summaryBox: {
    padding: 14, gap: 5,
    borderTopWidth: 1, borderTopColor: WebColors.border,
    backgroundColor: WebColors.gray50,
  },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumLbl: { fontSize: 13, color: WebColors.textSecondary },
  sumVal: { fontSize: 13, color: WebColors.text },
  sumDivider: { height: 1, backgroundColor: WebColors.border, marginVertical: 2 },
  sumTotalLbl: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  sumTotalVal: { fontSize: 17, fontWeight: '800' },

  // RIGHT
  rightPanel: {
    width: '44%',
    backgroundColor: WebColors.white,
    padding: 16,
    flexDirection: 'column',
    gap: 10,
  },
  shopRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: WebColors.border,
  },
  shopIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: WebColors.infoLight, alignItems: 'center', justifyContent: 'center',
  },
  shopNameTxt: { fontSize: 13, fontWeight: '700', color: WebColors.text, flex: 1 },

  payLbl: { fontSize: 15, fontWeight: '600', color: WebColors.textSecondary },
  amountBox: {
    borderWidth: 2, borderColor: WebColors.info,
    borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', backgroundColor: WebColors.infoLight,
  },
  amountTxt: { fontSize: 26, fontWeight: '900', color: WebColors.info, letterSpacing: 1 },

  // banner
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    flexWrap: 'wrap',
  },
  bannerTxt: { fontSize: 13, fontWeight: '700', flex: 1 },
  changeTxt: { fontSize: 13, fontWeight: '600', color: WebColors.success, width: '100%' },

  // Ad area (ล่าง right panel)
  adWrap: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden' as any,
    backgroundColor: WebColors.grayDark,
    minHeight: 80,
    position: 'relative',
  },
  adSlide: { flex: 1, position: 'relative' },
  adDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  adCaption: {
    position: 'absolute', bottom: 20, left: 0, right: 0,
    paddingHorizontal: 14, gap: 3,
  },
  adTitle:    { fontSize: 15, fontWeight: '700', color: WebColors.white },
  adSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  dots: {
    position: 'absolute', bottom: 6, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  dot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: WebColors.white, width: 14 },

  // overlay บน adWrap สำหรับโหมด pending/success
  adOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(249,115,22,0.88)',
    alignItems: 'center', justifyContent: 'center',
    gap: 8, zIndex: 10, borderRadius: 10,
  },
  adOverlayTxt: { fontSize: 20, fontWeight: '800', color: WebColors.white, textAlign: 'center' },
  adOverlayAmt: { fontSize: 28, fontWeight: '900', color: WebColors.white, letterSpacing: 1 },

  adEmpty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: WebColors.text,
  },
  adEmptyTxt: { fontSize: 15, color: WebColors.textSecondary },
});
