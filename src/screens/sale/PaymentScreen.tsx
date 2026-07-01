/**
 * SCR-SALE-006 — Payment Screen (ชำระเงิน)
 * FR-SALE-006: รับชำระเงิน — Cash, Credit Card, QR Code, Other
 * รองรับ Split Payment (จ่ายหลายช่องทาง)
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Modal, Image,
  KeyboardAvoidingView, Platform, Animated, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { useMemberStore } from '../../store/memberStore';
import { usePromoStore } from '../../store/promoStore';
import { useProductStore } from '../../store/productStore';
import { useShiftStore } from '../../store/shiftStore';
import { useStoreConfigStore } from '../../store/storeConfigStore';
import { Payment, PaymentMethod } from '../../types/sale';
import { Member } from '../../types/member';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

interface PaymentScreenProps {
  onBack: () => void;
  onPaid: (payments: Payment[], saleNo: string) => void;
}

// ช่องทางชำระเงินทั้งหมด
const PAYMENT_METHODS: {
  key: PaymentMethod;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}[] = [
  { key: 'cash',     label: 'เงินสด',        icon: 'cash-outline',           color: Colors.success, bgColor: Colors.successLight },
  { key: 'credit',   label: 'บัตรเครดิต',    icon: 'card-outline',           color: Colors.category1, bgColor: Colors.primaryLight },
  { key: 'qr',       label: 'QR Code',        icon: 'qr-code-outline',        color: Colors.info, bgColor: Colors.infoLight },
  { key: 'transfer', label: 'โอนเงิน',        icon: 'phone-portrait-outline', color: Colors.warning, bgColor: Colors.warningLight },
  { key: 'ewallet',  label: 'E-Wallet / อื่นๆ', icon: 'wallet-outline',        color: Colors.primary, bgColor: Colors.primaryLight },
];

const QUICK_CASH = [20, 50, 100, 500, 1000];

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ onBack, onPaid }) => {
  const { getGrandTotal, getSubtotal, getDiscountTotal, getVatAmount, items, discount } = useCartStore();
  const grandTotalBase = getGrandTotal();

  // ── Service Charge ──
  const { serviceCharge } = useStoreConfigStore();
  const scAmount = serviceCharge.enabled
    ? (serviceCharge.mode === 'percentage' ? grandTotalBase * (serviceCharge.value / 100) : serviceCharge.value)
    : 0;
  const grandTotalWithSC = grandTotalBase + scAmount;

  // ── CRM & Promotion state ─────────────────────────────────────────────────
  const { members, selectedMember, selectMember, searchMembers, earnPoints, redeemPoints, pointConfig } = useMemberStore();
  const { validateCoupon, applyCoupon } = usePromoStore();
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberSearch, setMemberSearch]       = useState('');
  const [couponCode, setCouponCode]           = useState('');
  const [couponError, setCouponError]         = useState('');
  const [couponDiscount, setCouponDiscount]   = useState(0);
  const [couponPromoName, setCouponPromoName] = useState('');
  const [showPointRedeem, setShowPointRedeem] = useState(false);
  const [pointsToUse, setPointsToUse]        = useState('');
  const [pointDiscount, setPointDiscount]     = useState(0);

  const memberSearchResults = memberSearch.trim()
    ? searchMembers(memberSearch).filter((m: Member) => m.isActive)
    : members.filter((m: Member) => m.isActive);

  const grandTotal = Math.max(0, grandTotalWithSC - couponDiscount - pointDiscount);

  const handleValidateCoupon = () => {
    if (!couponCode.trim()) return;
    const result = validateCoupon(couponCode, grandTotalBase, selectedMember?.level);
    if (result.valid && result.promotion) {
      const promo = result.promotion;
      let disc = 0;
      if (promo.discountPercent) {
        disc = grandTotalBase * (promo.discountPercent / 100);
        if (promo.maxDiscount && disc > promo.maxDiscount) disc = promo.maxDiscount;
      } else if (promo.discountAmount) {
        disc = promo.discountAmount;
      }
      setCouponDiscount(disc);
      setCouponPromoName(promo.name);
      setCouponError('');
    } else {
      setCouponDiscount(0);
      setCouponPromoName('');
      setCouponError(result.error || 'คูปองไม่ถูกต้อง');
    }
  };

  const handleApplyPoints = () => {
    const pts = parseInt(pointsToUse) || 0;
    if (pts <= 0 || !selectedMember) return;
    if (pts > selectedMember.pointBalance) return;
    if (pts < pointConfig.minRedeemPoints) return;
    setPointDiscount(pts * pointConfig.redeemRate);
    setShowPointRedeem(false);
  };

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [inputAmount, setInputAmount] = useState('');
  const [reference, setReference] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSplitMode, setShowSplitMode] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, grandTotal - totalPaid);
  const changeAmount = Math.max(0, totalPaid - grandTotal);
  const numInput = parseFloat(inputAmount) || 0;
  const isFullyPaid = totalPaid >= grandTotal;

  // สำหรับ cash — เงินทอน
  const cashChange = selectedMethod === 'cash' ? Math.max(0, numInput - remaining) : 0;

  const handleQuickCash = (amount: number) => setInputAmount(String(amount));

  const handleAddPayment = () => {
    if (numInput <= 0) return;
    const pay: Payment = {
      method: selectedMethod,
      amount: selectedMethod === 'cash' ? Math.min(numInput, numInput) : Math.min(numInput, remaining),
      reference: reference || undefined,
    };

    if (showSplitMode) {
      setPayments((prev) => [...prev, pay]);
    } else {
      setPayments([pay]);
    }
    setInputAmount('');
    setReference('');
  };

  const removePayment = (index: number) =>
    setPayments((prev) => prev.filter((_, i) => i !== index));

  const handleConfirmPayment = () => {
    if (!isFullyPaid) return;
    const saleNo = `INV${Date.now().toString().slice(-8)}`;

    // ── CRM: Earn points + apply coupon ──
    if (selectedMember) {
      earnPoints(selectedMember.id, grandTotal, saleNo, 'แคชเชียร์');
      if (pointDiscount > 0) {
        redeemPoints(selectedMember.id, parseInt(pointsToUse) || 0, saleNo, 'แคชเชียร์');
      }
      // ── Auto-upgrade level ──
      const { getMemberById, updateMember } = useMemberStore.getState();
      const updatedMember = getMemberById(selectedMember.id);
      if (updatedMember) {
        const { MOCK_LEVEL_CONFIGS } = require('../../data/mockMembers');
        const currentIdx = MOCK_LEVEL_CONFIGS.findIndex((c: any) => c.level === updatedMember.level);
        const nextLevel = MOCK_LEVEL_CONFIGS[currentIdx + 1];
        if (nextLevel && updatedMember.totalSpent >= nextLevel.minSpent) {
          updateMember(updatedMember.id, { level: nextLevel.level });
        }
      }
    }
    if (couponDiscount > 0 && couponCode) {
      applyCoupon(couponCode, saleNo, couponDiscount, selectedMember?.id);
    }

    // ── ตัดสต๊อก ──
    const { deductStock } = useProductStore.getState();
    items.forEach((item) => {
      deductStock(item.product.id, item.qty);
    });

    // ── บันทึกยอดกะ ──
    const { addCashSale, isShiftOpen } = useShiftStore.getState();
    if (isShiftOpen()) {
      addCashSale(grandTotal);
    }

    // Animate success
    Animated.sequence([
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      onPaid(payments, saleNo);
    });
  };

  const selectedMethodInfo = PAYMENT_METHODS.find((m) => m.key === selectedMethod)!;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ชำระเงิน</Text>
          <TouchableOpacity
            style={[styles.splitBtn, showSplitMode && styles.splitBtnActive]}
            onPress={() => { setShowSplitMode(!showSplitMode); setPayments([]); }}
          >
            <Ionicons name="layers-outline" size={16} color={Colors.white} />
            <Text style={styles.splitBtnText}>Split</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Grand Total */}
          <View style={styles.totalBanner}>
            <Text style={styles.totalLabel}>ยอดที่ต้องชำระ</Text>
            <Text style={styles.totalAmount}>฿{formatCurrency(grandTotal)}</Text>
            {showSplitMode && remaining < grandTotal && (
              <Text style={styles.remainingText}>คงเหลือ ฿{formatCurrency(remaining)}</Text>
            )}
          </View>

          {/* Bill Summary (collapsible) */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>รวมสินค้า ({items.length} รายการ)</Text>
              <Text style={styles.summaryValue}>฿{formatCurrency(getSubtotal())}</Text>
            </View>
            {getDiscountTotal() > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ส่วนลด</Text>
                <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                  -฿{formatCurrency(getDiscountTotal())}
                </Text>
              </View>
            )}
            {couponDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: Colors.category1 }]}>คูปอง ({couponPromoName})</Text>
                <Text style={[styles.summaryValue, { color: Colors.category1 }]}>
                  -฿{formatCurrency(couponDiscount)}
                </Text>
              </View>
            )}
            {pointDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: Colors.warning }]}>แลกคะแนน ({pointsToUse} pts)</Text>
                <Text style={[styles.summaryValue, { color: Colors.warning }]}>
                  -฿{formatCurrency(pointDiscount)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>VAT 7% (รวมแล้ว)</Text>
              <Text style={styles.summaryValue}>฿{formatCurrency(getVatAmount())}</Text>
            </View>
          </View>

          {/* ── Member Selection ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>สมาชิก</Text>
            {selectedMember ? (
              <View style={styles.memberBadgeRow}>
                <Ionicons name="person-circle" size={22} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{selectedMember.name}</Text>
                  <Text style={styles.memberSub}>{selectedMember.phone} · {selectedMember.pointBalance} คะแนน</Text>
                </View>
                <View style={[styles.levelBadgeMobile, {
                  backgroundColor: selectedMember.level === 'platinum' ? Colors.category1
                    : selectedMember.level === 'gold' ? Colors.warning : Colors.gray400,
                }]}>
                  <Text style={styles.levelBadgeTextMobile}>{selectedMember.level}</Text>
                </View>
                <TouchableOpacity onPress={() => { selectMember(null); setPointDiscount(0); setPointsToUse(''); }}>
                  <Ionicons name="close-circle" size={20} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.memberSelectButton} onPress={() => { setShowMemberModal(true); setMemberSearch(''); }}>
                <Ionicons name="people-outline" size={18} color={Colors.primary} />
                <Text style={styles.memberSelectText}>เลือกสมาชิก</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Coupon Input ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>คูปอง</Text>
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                value={couponCode}
                onChangeText={(v) => { setCouponCode(v); setCouponError(''); }}
                placeholder="รหัสคูปอง"
                placeholderTextColor={Colors.gray300}
              />
              <TouchableOpacity
                style={[styles.couponApplyBtn, !couponCode.trim() && { opacity: 0.5 }]}
                onPress={handleValidateCoupon}
                disabled={!couponCode.trim()}
              >
                <Text style={styles.couponApplyText}>ใช้คูปอง</Text>
              </TouchableOpacity>
            </View>
            {couponError ? (
              <View style={styles.couponFeedback}>
                <Ionicons name="alert-circle" size={14} color={Colors.danger} />
                <Text style={[styles.couponFeedbackText, { color: Colors.danger }]}>{couponError}</Text>
              </View>
            ) : null}
            {couponDiscount > 0 && (
              <View style={[styles.couponFeedback, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={[styles.couponFeedbackText, { color: Colors.success }]}>
                  ลด ฿{formatCurrency(couponDiscount)} ({couponPromoName})
                </Text>
                <TouchableOpacity onPress={() => { setCouponDiscount(0); setCouponCode(''); setCouponPromoName(''); }}>
                  <Ionicons name="close-circle" size={16} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Point Redemption ── */}
          {selectedMember && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ใช้คะแนน</Text>
              {pointDiscount === 0 ? (
                <TouchableOpacity style={styles.pointRedeemButton} onPress={() => { setShowPointRedeem(true); setPointsToUse(''); }}>
                  <Ionicons name="star-outline" size={18} color="#F59E0B" />
                  <Text style={styles.pointRedeemText}>ใช้คะแนน ({selectedMember.pointBalance} คะแนน)</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.couponFeedback, { backgroundColor: Colors.warningLight }]}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={[styles.couponFeedbackText, { color: Colors.warning }]}>
                    ใช้ {pointsToUse} คะแนน = ลด ฿{formatCurrency(pointDiscount)}
                  </Text>
                  <TouchableOpacity onPress={() => { setPointDiscount(0); setPointsToUse(''); }}>
                    <Ionicons name="close-circle" size={16} color={Colors.gray400} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Payment Method Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ช่องทางชำระเงิน</Text>
            <View style={styles.methodGrid}>
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.methodCard,
                    selectedMethod === m.key && { borderColor: m.color, backgroundColor: m.bgColor },
                  ]}
                  onPress={() => {
                    setSelectedMethod(m.key);
                    setInputAmount('');
                    setReference('');
                    if (m.key === 'qr') setShowQRModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.methodIcon, { backgroundColor: selectedMethod === m.key ? m.color : Colors.gray100 }]}>
                    <Ionicons name={m.icon as any} size={22} color={selectedMethod === m.key ? Colors.white : Colors.gray500} />
                  </View>
                  <Text style={[styles.methodLabel, selectedMethod === m.key && { color: m.color, fontWeight: '700' }]}>
                    {m.label}
                  </Text>
                  {selectedMethod === m.key && (
                    <View style={[styles.selectedDot, { backgroundColor: m.color }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedMethod === 'cash' ? 'รับเงิน' : 'จำนวนเงิน'}
            </Text>

            <View style={[styles.amountInputRow, { borderColor: selectedMethodInfo.color }]}>
              <Text style={[styles.amountPrefix, { color: selectedMethodInfo.color }]}>฿</Text>
              <TextInput
                style={styles.amountInput}
                value={inputAmount}
                onChangeText={setInputAmount}
                keyboardType="decimal-pad"
                placeholder={`฿${formatCurrency(remaining)}`}
                placeholderTextColor={Colors.gray300}
              />
              {!showSplitMode && (
                <TouchableOpacity
                  style={[styles.exactBtn, { backgroundColor: selectedMethodInfo.color }]}
                  onPress={() => setInputAmount(String(remaining.toFixed(2)))}
                >
                  <Text style={styles.exactBtnText}>พอดี</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Cash Buttons */}
            {selectedMethod === 'cash' && (
              <View style={styles.quickCashRow}>
                {QUICK_CASH.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={styles.quickCashBtn}
                    onPress={() => handleQuickCash(q)}
                  >
                    <Text style={styles.quickCashText}>฿{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Reference Input for non-cash */}
            {selectedMethod !== 'cash' && (
              <TextInput
                placeholder={
                  selectedMethod === 'credit' ? 'เลขอ้างอิงบัตร / Approval Code'
                  : selectedMethod === 'transfer' ? 'เลขที่รายการโอน'
                  : selectedMethod === 'ewallet' ? 'รหัสอ้างอิง / ชื่อ E-Wallet'
                  : 'เลขอ้างอิง'
                }
                placeholderTextColor={Colors.gray400}
                value={reference}
                onChangeText={setReference}
                style={styles.referenceInput}
              />
            )}

            {/* Cash Change Preview */}
            {selectedMethod === 'cash' && numInput > 0 && cashChange > 0 && (
              <View style={styles.changeBox}>
                <Ionicons name="arrow-undo-outline" size={18} color={Colors.success} />
                <Text style={styles.changeLabel}>เงินทอน</Text>
                <Text style={styles.changeAmount}>฿{formatCurrency(cashChange)}</Text>
              </View>
            )}

            {/* Add to Split */}
            {showSplitMode && (
              <TouchableOpacity
                style={[styles.addSplitBtn, numInput <= 0 && styles.addSplitBtnDisabled]}
                onPress={handleAddPayment}
                disabled={numInput <= 0}
              >
                <Ionicons name="add-circle-outline" size={18} color={numInput > 0 ? Colors.primary : Colors.gray400} />
                <Text style={[styles.addSplitText, numInput <= 0 && { color: Colors.gray400 }]}>
                  เพิ่มการชำระ ฿{numInput > 0 ? formatCurrency(numInput) : '0.00'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Split Payments List */}
          {showSplitMode && payments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>รายการที่ชำระแล้ว</Text>
              {payments.map((p, i) => {
                const info = PAYMENT_METHODS.find((m) => m.key === p.method)!;
                return (
                  <View key={i} style={styles.splitItem}>
                    <View style={[styles.splitIcon, { backgroundColor: info.bgColor }]}>
                      <Ionicons name={info.icon as any} size={16} color={info.color} />
                    </View>
                    <Text style={styles.splitMethodText}>{info.label}</Text>
                    {p.reference ? <Text style={styles.splitRef}>({p.reference})</Text> : null}
                    <Text style={styles.splitAmount}>฿{formatCurrency(p.amount)}</Text>
                    <TouchableOpacity onPress={() => removePayment(i)} style={styles.removeSplit}>
                      <Ionicons name="close-circle" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                );
              })}
              <View style={styles.splitTotal}>
                <Text style={styles.splitTotalLabel}>รวมที่ชำระ</Text>
                <Text style={styles.splitTotalValue}>฿{formatCurrency(totalPaid)}</Text>
              </View>
              {remaining > 0 && (
                <View style={[styles.splitTotal, { backgroundColor: Colors.warningLight }]}>
                  <Text style={[styles.splitTotalLabel, { color: Colors.warning }]}>คงเหลือ</Text>
                  <Text style={[styles.splitTotalValue, { color: Colors.warning }]}>฿{formatCurrency(remaining)}</Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Confirm Button */}
        <View style={styles.footer}>
          {selectedMethod === 'cash' && !showSplitMode && numInput > 0 && numInput >= grandTotal && (
            <View style={styles.changePreview}>
              <Text style={styles.changePreviewLabel}>รับ ฿{formatCurrency(numInput)}</Text>
              <View style={styles.changePreviewRight}>
                <Text style={styles.changePreviewLabel}>ทอน</Text>
                <Text style={styles.changePreviewAmount}>฿{formatCurrency(numInput - grandTotal)}</Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              !(isFullyPaid || (!showSplitMode && numInput >= grandTotal)) && styles.confirmBtnDisabled,
            ]}
            onPress={() => {
              if (!showSplitMode) {
                // Single payment
                const pay: Payment = {
                  method: selectedMethod,
                  amount: selectedMethod === 'cash' ? numInput : grandTotal,
                  reference: reference || undefined,
                };
                setPayments([pay]);
              }
              handleConfirmPayment();
            }}
            disabled={!(isFullyPaid || (!showSplitMode && selectedMethod !== 'cash' && true) || (!showSplitMode && numInput >= grandTotal))}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
            <Text style={styles.confirmBtnText}>ยืนยันการชำระเงิน</Text>
            <Text style={styles.confirmBtnAmount}>฿{formatCurrency(grandTotal)}</Text>
          </TouchableOpacity>
        </View>

        {/* QR Modal */}
        <Modal visible={showQRModal} animationType="fade" transparent>
          <View style={styles.qrOverlay}>
            <View style={styles.qrSheet}>
              <Text style={styles.qrTitle}>สแกน QR Code ชำระเงิน</Text>
              <Text style={styles.qrAmount}>฿{formatCurrency(remaining)}</Text>
              {/* QR Placeholder */}
              <View style={styles.qrBox}>
                <Ionicons name="qr-code" size={160} color={Colors.primary} />
                <Text style={styles.qrHint}>QR Code จะถูก generate จาก Payment Gateway</Text>
              </View>
              <TouchableOpacity
                style={styles.qrConfirmBtn}
                onPress={() => {
                  setShowQRModal(false);
                  setInputAmount(String(remaining.toFixed(2)));
                }}
              >
                <Text style={styles.qrConfirmText}>ลูกค้าสแกนแล้ว — ยืนยัน</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Text style={styles.qrCancel}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Member Search Modal ── */}
        <Modal visible={showMemberModal} animationType="slide" transparent>
          <View style={styles.qrOverlay}>
            <View style={[styles.qrSheet, { width: '90%', maxHeight: '70%' }]}>
              <Text style={styles.qrTitle}>เลือกสมาชิก</Text>
              <TextInput
                style={styles.memberSearchInput}
                value={memberSearch}
                onChangeText={setMemberSearch}
                placeholder="ค้นหาชื่อ / เบอร์โทร / เลขสมาชิก"
                placeholderTextColor={Colors.gray300}
                autoFocus
              />
              <FlatList
                data={memberSearchResults}
                keyExtractor={(item: Member) => item.id}
                style={{ maxHeight: 300, width: '100%' }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text style={{ textAlign: 'center', color: Colors.gray400, padding: 20 }}>ไม่พบสมาชิก</Text>
                }
                renderItem={({ item: mem }: { item: Member }) => (
                  <TouchableOpacity
                    style={styles.memberListItem}
                    onPress={() => { selectMember(mem); setShowMemberModal(false); }}
                  >
                    <Ionicons name="person-circle-outline" size={28} color={Colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberListName}>{mem.name}</Text>
                      <Text style={styles.memberListSub}>{mem.phone} · {mem.memberNo}</Text>
                    </View>
                    <View style={[styles.levelBadgeMobile, {
                      backgroundColor: mem.level === 'platinum' ? Colors.category1
                        : mem.level === 'gold' ? Colors.warning : Colors.gray500,
                    }]}>
                      <Text style={styles.levelBadgeTextMobile}>{mem.level}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.qrConfirmBtn} onPress={() => setShowMemberModal(false)}>
                <Text style={styles.qrConfirmText}>ปิด</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Point Redemption Modal ── */}
        <Modal visible={showPointRedeem} animationType="fade" transparent>
          <View style={styles.qrOverlay}>
            <View style={[styles.qrSheet, { width: '85%' }]}>
              <Text style={styles.qrTitle}>ใช้คะแนนแลกส่วนลด</Text>
              {selectedMember && (
                <>
                  <Text style={{ ...Typography.body2, color: Colors.textSecondary }}>
                    คะแนนคงเหลือ: {selectedMember.pointBalance} คะแนน
                  </Text>
                  <Text style={{ ...Typography.caption, color: Colors.gray400, marginTop: -4 }}>
                    อัตราแลก: 1 คะแนน = {pointConfig.redeemRate} บาท | ขั้นต่ำ {pointConfig.minRedeemPoints} คะแนน
                  </Text>
                  <TextInput
                    style={styles.memberSearchInput}
                    value={pointsToUse}
                    onChangeText={setPointsToUse}
                    placeholder={`จำนวนคะแนน (สูงสุด ${selectedMember.pointBalance})`}
                    placeholderTextColor={Colors.gray300}
                    keyboardType="number-pad"
                  />
                  {parseInt(pointsToUse) > 0 && (
                    <Text style={{ ...Typography.body2, color: Colors.warning, fontWeight: '700' }}>
                      = ส่วนลด ฿{formatCurrency((parseInt(pointsToUse) || 0) * pointConfig.redeemRate)}
                    </Text>
                  )}
                </>
              )}
              <TouchableOpacity
                style={[styles.qrConfirmBtn, (!(parseInt(pointsToUse) > 0) || (parseInt(pointsToUse) > (selectedMember?.pointBalance ?? 0)) || (parseInt(pointsToUse) < pointConfig.minRedeemPoints)) && { opacity: 0.5 }]}
                disabled={!(parseInt(pointsToUse) > 0) || (parseInt(pointsToUse) > (selectedMember?.pointBalance ?? 0)) || (parseInt(pointsToUse) < pointConfig.minRedeemPoints)}
                onPress={handleApplyPoints}
              >
                <Text style={styles.qrConfirmText}>ยืนยัน</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPointRedeem(false)}>
                <Text style={styles.qrCancel}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white, flex: 1, marginLeft: Spacing.sm },
  splitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  splitBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: Colors.white },
  splitBtnText: { ...Typography.caption, color: Colors.white, fontWeight: '600' },

  totalBanner: {
    backgroundColor: Colors.primary, alignItems: 'center',
    paddingVertical: Spacing.xl, paddingBottom: Spacing.xxl,
  },
  totalLabel: { ...Typography.body1, color: 'rgba(255,255,255,0.8)' },
  totalAmount: { fontSize: 48, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
  remainingText: { ...Typography.body1, color: Colors.warningLight, marginTop: Spacing.xs },

  summaryBox: {
    backgroundColor: Colors.surface, margin: Spacing.md, marginTop: -20,
    borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.xs,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { ...Typography.body2, color: Colors.textSecondary },
  summaryValue: { ...Typography.body2, color: Colors.text, fontWeight: '500' },

  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm },

  methodGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  methodCard: {
    width: '30%', flexGrow: 1,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 2, borderColor: Colors.border,
    padding: Spacing.sm, alignItems: 'center', gap: Spacing.xs,
    position: 'relative',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 1,
  },
  methodIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  methodLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  selectedDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
  },

  amountInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 2.5, paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  amountPrefix: { fontSize: 28, fontWeight: '700', marginRight: Spacing.sm },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '700', color: Colors.text, paddingVertical: Spacing.md },
  exactBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  exactBtnText: { ...Typography.label, color: Colors.white },

  quickCashRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.sm },
  quickCashBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  quickCashText: { ...Typography.label, color: Colors.text },

  referenceInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Typography.body1, color: Colors.text,
    marginBottom: Spacing.sm,
  },

  changeBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.successLight, borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  changeLabel: { ...Typography.body1, color: Colors.success, flex: 1 },
  changeAmount: { ...Typography.h4, color: Colors.success, fontWeight: '700' },

  addSplitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.primary,
    paddingVertical: Spacing.sm, backgroundColor: Colors.primaryLight,
  },
  addSplitBtnDisabled: { borderColor: Colors.border, backgroundColor: Colors.gray100 },
  addSplitText: { ...Typography.label, color: Colors.primary },

  splitItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border,
  },
  splitIcon: {
    width: 32, height: 32, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  splitMethodText: { ...Typography.body2, color: Colors.text, flex: 1 },
  splitRef: { ...Typography.caption, color: Colors.textSecondary },
  splitAmount: { ...Typography.label, color: Colors.text, fontWeight: '600' },
  removeSplit: { padding: 4 },
  splitTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.sm,
    padding: Spacing.sm, marginTop: Spacing.xs,
  },
  splitTotalLabel: { ...Typography.label, color: Colors.textSecondary },
  splitTotalValue: { ...Typography.label, color: Colors.text, fontWeight: '700' },

  footer: {
    backgroundColor: Colors.surface, padding: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  changePreview: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.successLight, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  changePreviewRight: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  changePreviewLabel: { ...Typography.body2, color: Colors.success },
  changePreviewAmount: { ...Typography.label, color: Colors.success, fontWeight: '700' },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.success,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
  },
  confirmBtnDisabled: { backgroundColor: Colors.gray300 },
  confirmBtnText: { ...Typography.button, color: Colors.white, flex: 1, textAlign: 'center' },
  confirmBtnAmount: { ...Typography.h4, color: Colors.white },

  qrOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  qrSheet: {
    backgroundColor: Colors.surface, borderRadius: 24,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
    width: '85%',
  },
  qrTitle: { ...Typography.h4, color: Colors.text },
  qrAmount: { fontSize: 36, fontWeight: '800', color: Colors.primary },
  qrBox: { alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  qrHint: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  qrConfirmBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, width: '100%', alignItems: 'center',
  },
  qrConfirmText: { ...Typography.button, color: Colors.white },
  qrCancel: { ...Typography.body2, color: Colors.textSecondary, marginTop: Spacing.xs },

  // ── CRM & Promotion ──────────────────────────────────────────────────────
  memberBadgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '40',
  },
  memberName: { ...Typography.label, color: Colors.text },
  memberSub: { ...Typography.caption, color: Colors.textSecondary },
  levelBadgeMobile: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  levelBadgeTextMobile: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  memberSelectButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm, backgroundColor: Colors.primaryLight,
  },
  memberSelectText: { ...Typography.button, color: Colors.primary },
  couponInputRow: { flexDirection: 'row', gap: Spacing.sm },
  couponInput: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, height: 42, ...Typography.body1, color: Colors.text,
    backgroundColor: Colors.surface,
  },
  couponApplyBtn: {
    backgroundColor: Colors.category1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, height: 42,
    alignItems: 'center', justifyContent: 'center',
  },
  couponApplyText: { ...Typography.label, color: Colors.white, fontWeight: '700' },
  couponFeedback: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginTop: Spacing.xs, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm, backgroundColor: Colors.dangerLight,
  },
  couponFeedbackText: { ...Typography.caption, flex: 1 },
  pointRedeemButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.warning, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm, backgroundColor: Colors.warningLight,
  },
  pointRedeemText: { ...Typography.button, color: Colors.warning },
  memberSearchInput: {
    width: '100%', borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    height: 44, ...Typography.body1, color: Colors.text,
    backgroundColor: Colors.surface, marginTop: Spacing.sm,
  },
  memberListItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  memberListName: { ...Typography.label, color: Colors.text },
  memberListSub: { ...Typography.caption, color: Colors.textSecondary },
});
