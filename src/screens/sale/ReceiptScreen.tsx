/**
 * SCR-SALE-007 — Receipt Screen (ใบเสร็จ)
 * FR-SALE-007: แสดงและพิมพ์ใบเสร็จ รองรับ Reprint และบันทึก Audit Log
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { Payment, PaymentMethod, PAYMENT_LABELS } from '../../types/sale';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface ReceiptScreenProps {
  saleNo: string;
  payments: Payment[];
  isReprint?: boolean;
  onNewSale: () => void;
  onPrintDone?: () => void;
  shopName?: string;
  shopAddress?: string;
  shopTaxId?: string;
  cashierName?: string;
  posName?: string;
}

const PRINTER_OPTIONS = [
  { key: 'bluetooth', label: 'Bluetooth Printer', icon: 'bluetooth-outline' },
  { key: 'wifi', label: 'WiFi Printer', icon: 'wifi-outline' },
  { key: 'airprint', label: 'AirPrint', icon: 'print-outline' },
  { key: 'share', label: 'แชร์ PDF', icon: 'share-outline' },
];

export const ReceiptScreen: React.FC<ReceiptScreenProps> = ({
  saleNo,
  payments,
  isReprint = false,
  onNewSale,
  onPrintDone,
  shopName = 'ร้านค้าตัวอย่าง',
  shopAddress = '123 ถนนสุขุมวิท กรุงเทพฯ',
  shopTaxId = '0105563123456',
  cashierName = 'พนักงาน',
  posName = 'POS 1',
}) => {
  const { items, discount, getSubtotal, getDiscountTotal, getVatAmount, getGrandTotal, clearCart } = useCartStore();
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printedBy, setPrintedBy] = useState<string | null>(null);
  const now = new Date();

  const subtotal = getSubtotal();
  const discountTotal = getDiscountTotal();
  const vatAmount = getVatAmount();
  const grandTotal = getGrandTotal();
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const changeAmount = Math.max(0, totalPaid - grandTotal);
  const cashPayment = payments.find((p) => p.method === 'cash');

  const handlePrint = (printerType: string) => {
    setPrinting(true);
    setShowPrinterModal(false);
    setTimeout(() => {
      setPrinting(false);
      setPrintedBy(printerType);
      if (isReprint) {
        // Audit log: บันทึกการ Reprint
        console.log(`[AUDIT] REPRINT - SaleNo: ${saleNo}, By: ${cashierName}, Printer: ${printerType}`);
      }
      Alert.alert('พิมพ์สำเร็จ', `พิมพ์ใบเสร็จผ่าน ${printerType} เรียบร้อย`);
      onPrintDone?.();
    }, 1500);
  };

  const handleNewSale = () => {
    clearCart();
    onNewSale();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>
          {isReprint ? '🔄 พิมพ์ซ้ำ' : '✅ ชำระเงินสำเร็จ'}
        </Text>
        <TouchableOpacity onPress={() => setShowPrinterModal(true)} style={styles.printIconBtn}>
          <Ionicons name="print-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Success Badge */}
        {!isReprint && (
          <View style={styles.successBadge}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>ชำระเงินเรียบร้อย</Text>
          </View>
        )}

        {/* Receipt Paper */}
        <View style={styles.receiptPaper}>
          {/* Shop Header */}
          <View style={styles.receiptHeader}>
            <Text style={styles.shopName}>{shopName}</Text>
            <Text style={styles.shopAddress}>{shopAddress}</Text>
            <Text style={styles.shopTax}>เลขที่ผู้เสียภาษี: {shopTaxId}</Text>
          </View>

          <View style={styles.dottedLine} />

          {/* Receipt Info */}
          <View style={styles.receiptInfo}>
            {[
              { label: 'เลขที่ใบเสร็จ', value: saleNo },
              { label: 'วันที่', value: formatDateTime(now) },
              { label: 'แคชเชียร์', value: cashierName },
              { label: 'จุดขาย', value: posName },
            ].map((row, i) => (
              <View key={i} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.dottedLine} />

          {/* Items */}
          <View style={styles.itemsSection}>
            <Text style={styles.itemsHeader}>รายการสินค้า</Text>
            {items.map((item, i) => (
              <View key={i} style={styles.receiptItem}>
                <View style={styles.receiptItemTop}>
                  <Text style={styles.receiptItemName} numberOfLines={1}>{item.product.name}</Text>
                  <Text style={styles.receiptItemSubtotal}>฿{formatCurrency(item.subtotal)}</Text>
                </View>
                <View style={styles.receiptItemBottom}>
                  <Text style={styles.receiptItemDetail}>
                    {item.qty} × ฿{formatCurrency(item.unitPrice)}
                    {item.discountAmount > 0 ? ` (-฿${formatCurrency(item.discountAmount)})` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.dottedLine} />

          {/* Totals */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowLabel}>รวมสินค้า</Text>
              <Text style={styles.totalRowValue}>฿{formatCurrency(subtotal)}</Text>
            </View>
            {discountTotal > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>
                  ส่วนลด{discount?.type === 'percent' ? ` (${discount.value}%)` : ''}
                </Text>
                <Text style={[styles.totalRowValue, { color: Colors.danger }]}>
                  -฿{formatCurrency(discountTotal)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalRowLabel}>VAT 7% (รวมแล้ว)</Text>
              <Text style={styles.totalRowValue}>฿{formatCurrency(vatAmount)}</Text>
            </View>
          </View>

          <View style={styles.grandTotalBox}>
            <Text style={styles.grandTotalLabel}>ยอดรวมสุทธิ</Text>
            <Text style={styles.grandTotalValue}>฿{formatCurrency(grandTotal)}</Text>
          </View>

          <View style={styles.dottedLine} />

          {/* Payments */}
          <View style={styles.paymentsSection}>
            <Text style={styles.paymentHeader}>ชำระเงิน</Text>
            {payments.map((p, i) => (
              <View key={i} style={styles.paymentRow}>
                <Text style={styles.paymentMethod}>{PAYMENT_LABELS[p.method]}</Text>
                {p.reference ? (
                  <Text style={styles.paymentRef}>{p.reference}</Text>
                ) : null}
                <Text style={styles.paymentAmount}>฿{formatCurrency(p.amount)}</Text>
              </View>
            ))}
            {cashPayment && changeAmount > 0 && (
              <View style={[styles.paymentRow, styles.changeRow]}>
                <Text style={styles.changeLabel}>เงินทอน</Text>
                <Text style={styles.changeValue}>฿{formatCurrency(changeAmount)}</Text>
              </View>
            )}
          </View>

          <View style={styles.dottedLine} />

          {/* Footer */}
          <View style={styles.receiptFooter}>
            <Text style={styles.thankYou}>ขอบคุณที่ใช้บริการ</Text>
            <Text style={styles.footerSub}>กรุณาเก็บใบเสร็จไว้เป็นหลักฐาน</Text>
            {isReprint && (
              <View style={styles.reprintBadge}>
                <Ionicons name="refresh-outline" size={12} color={Colors.warning} />
                <Text style={styles.reprintText}>สำเนา</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.printBtn}
            onPress={() => setShowPrinterModal(true)}
            disabled={printing}
            activeOpacity={0.85}
          >
            <Ionicons name={printing ? 'hourglass-outline' : 'print-outline'} size={20} color={Colors.primary} />
            <Text style={styles.printBtnText}>{printing ? 'กำลังพิมพ์...' : 'พิมพ์ใบเสร็จ'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.newSaleBtn} onPress={handleNewSale} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
            <Text style={styles.newSaleBtnText}>ขายรายการถัดไป</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Printer Selection Modal */}
      <Modal visible={showPrinterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>เลือกเครื่องพิมพ์</Text>

            {PRINTER_OPTIONS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={styles.printerOption}
                onPress={() => handlePrint(p.label)}
                activeOpacity={0.8}
              >
                <View style={styles.printerIcon}>
                  <Ionicons name={p.icon as any} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.printerLabel}>{p.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.gray300} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.cancelPrint} onPress={() => setShowPrinterModal(false)}>
              <Text style={styles.cancelPrintText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.success, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.h4, color: Colors.white },
  printIconBtn: { padding: Spacing.xs },
  scroll: { padding: Spacing.md },
  successBadge: {
    alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.sm,
  },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { ...Typography.h3, color: Colors.success },

  // Receipt Paper
  receiptPaper: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  receiptHeader: { alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  shopName: { ...Typography.h3, color: Colors.text },
  shopAddress: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  shopTax: { ...Typography.caption, color: Colors.textSecondary },
  dottedLine: {
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    borderStyle: 'dashed', marginVertical: Spacing.sm,
  },
  receiptInfo: { gap: Spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { ...Typography.caption, color: Colors.textSecondary },
  infoValue: { ...Typography.caption, color: Colors.text, fontWeight: '500' },
  itemsSection: { gap: Spacing.xs },
  itemsHeader: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs },
  receiptItem: { gap: 2 },
  receiptItemTop: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptItemName: { ...Typography.body2, color: Colors.text, flex: 1 },
  receiptItemSubtotal: { ...Typography.body2, color: Colors.text, fontWeight: '600' },
  receiptItemBottom: {},
  receiptItemDetail: { ...Typography.caption, color: Colors.textSecondary },
  totalsSection: { gap: Spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalRowLabel: { ...Typography.body2, color: Colors.textSecondary },
  totalRowValue: { ...Typography.body2, color: Colors.text },
  grandTotalBox: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm,
    padding: Spacing.sm, marginVertical: Spacing.xs,
  },
  grandTotalLabel: { ...Typography.label, color: Colors.primary },
  grandTotalValue: { ...Typography.h4, color: Colors.primary, fontWeight: '800' },
  paymentsSection: { gap: Spacing.xs },
  paymentHeader: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentMethod: { ...Typography.body2, color: Colors.text, flex: 1 },
  paymentRef: { ...Typography.caption, color: Colors.textSecondary, marginRight: Spacing.sm },
  paymentAmount: { ...Typography.body2, color: Colors.text, fontWeight: '600' },
  changeRow: { backgroundColor: Colors.successLight, borderRadius: BorderRadius.sm, padding: Spacing.xs, marginTop: 4 },
  changeLabel: { ...Typography.body2, color: Colors.success, flex: 1 },
  changeValue: { ...Typography.body2, color: Colors.success, fontWeight: '700' },
  receiptFooter: { alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  thankYou: { ...Typography.label, color: Colors.text },
  footerSub: { ...Typography.caption, color: Colors.textSecondary },
  reprintBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warningLight, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 2, marginTop: Spacing.xs,
  },
  reprintText: { ...Typography.caption, color: Colors.warning, fontWeight: '600' },

  // Actions
  actions: { gap: Spacing.sm, marginBottom: Spacing.md },
  printBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  printBtnText: { ...Typography.button, color: Colors.primary },
  newSaleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
  },
  newSaleBtnText: { ...Typography.button, color: Colors.white },

  // Printer Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, gap: Spacing.sm,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: Colors.gray200,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.sm,
  },
  modalTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.xs },
  printerOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  printerIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  printerLabel: { ...Typography.body1, color: Colors.text, flex: 1 },
  cancelPrint: {
    alignItems: 'center', paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  cancelPrintText: { ...Typography.button, color: Colors.danger },
});
