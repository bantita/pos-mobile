/**
 * TaxInvoiceScreen — ใบกำกับภาษีเต็มรูป
 * ออกใบกำกับภาษีจากบิลขาย พร้อมแก้ไขข้อมูลผู้ซื้อ, พิมพ์, และยกเลิกใบกำกับภาษี
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Input } from '../../components/ui';
import { useSaleHistoryStore } from '../../store/saleHistoryStore';
import { useStoreConfigStore } from '../../store/storeConfigStore';
import { useReceiptStore } from '../../store/receiptStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface TaxInvoiceScreenProps {
  saleNo: string;
  onBack: () => void;
  onCancelInvoice: () => void;
}

export const TaxInvoiceScreen: React.FC<TaxInvoiceScreenProps> = ({
  saleNo, onBack, onCancelInvoice,
}) => {
  const sale = useSaleHistoryStore((s) => s.getSaleByNo)(saleNo);
  const storeConfig = useStoreConfigStore();
  const receiptConfig = useReceiptStore((s) => s.config);

  const sellerName = storeConfig.storeName || receiptConfig.shopName;
  const sellerAddress = storeConfig.storeAddress || receiptConfig.shopAddr;
  const sellerTaxId = storeConfig.storeTaxId || receiptConfig.shopTaxId;

  const [buyerName, setBuyerName] = useState('');
  const [buyerTaxId, setBuyerTaxId] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');

  // ─── Empty / Error state ──────────────────────────────────────────────────
  if (!sale) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ใบกำกับภาษีเต็มรูป</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="document-outline" size={64} color={Colors.gray400} />
          <Text style={styles.emptyText}>ไม่พบข้อมูลการขาย</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={18} color={Colors.primary} />
            <Text style={styles.emptyBtnText}>ย้อนกลับ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const invoiceNo = `TAX${saleNo}`;
  const grandTotal = sale.grandTotal;
  const base = grandTotal / 1.07;
  const vat = grandTotal - base;

  const buildHTML = (): string => {
    const rows = sale.items
      .map((item) => `<tr>
        <td>${item.product.name}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">฿${formatCurrency(item.unitPrice)}</td>
        <td style="text-align:right">฿${formatCurrency(item.subtotal)}</td>
      </tr>`)
      .join('');

    return `<!doctype html><html><head><meta charset="utf-8"><title>ใบกำกับภาษีเต็มรูป</title>
<style>
  * { font-family: 'Sarabun', -apple-system, sans-serif; }
  body { width: 560px; margin: 0 auto; padding: 24px; color: #111; }
  h2 { text-align: center; margin: 4px 0; font-size: 20px; }
  .sub { text-align: center; font-size: 13px; color: #555; }
  .block { margin: 10px 0; font-size: 13px; }
  .block b { display: inline-block; min-width: 120px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; }
  th { background: #f5f5f5; text-align: left; }
  .totals { width: 260px; margin-left: auto; margin-top: 12px; font-size: 13px; }
  .totals td { border: none; padding: 3px 0; }
  .total { font-weight: 800; font-size: 15px; }
  .line { border-top: 1px dashed #999; margin: 10px 0; }
</style></head><body>
  <h2>ใบกำกับภาษีเต็มรูป</h2>
  <div class="sub">เลขที่ ${invoiceNo} · วันที่ ${formatDateTime(new Date(sale.createdAt))}</div>
  <div class="line"></div>
  <div class="block"><b>ผู้ขาย</b> ${sellerName}</div>
  <div class="block"><b>ที่อยู่</b> ${sellerAddress}</div>
  <div class="block"><b>เลขผู้เสียภาษี</b> ${sellerTaxId}</div>
  <div class="line"></div>
  <div class="block"><b>ผู้ซื้อ</b> ${buyerName || '-'}</div>
  <div class="block"><b>เลขผู้เสียภาษี</b> ${buyerTaxId || '-'}</div>
  <div class="block"><b>ที่อยู่</b> ${buyerAddress || '-'}</div>
  <table>
    <thead><tr><th>รายการ</th><th style="text-align:center">จำนวน</th><th style="text-align:right">ราคา/หน่วย</th><th style="text-align:right">รวม</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals">
    <tr><td>มูลค่าสินค้า (ก่อน VAT)</td><td style="text-align:right">฿${formatCurrency(base)}</td></tr>
    <tr><td>ภาษีมูลค่าเพิ่ม 7%</td><td style="text-align:right">฿${formatCurrency(vat)}</td></tr>
    <tr class="total"><td>ยอดรวมสุทธิ</td><td style="text-align:right">฿${formatCurrency(grandTotal)}</td></tr>
  </table>
</body></html>`;
  };

  const handlePrint = async () => {
    const html = buildHTML();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 300);
      }
      return;
    }
    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `ใบกำกับภาษี ${invoiceNo}`, UTI: 'com.adobe.pdf' });
      } else {
        await Print.printAsync({ html });
      }
    } catch (err) {
      console.error('Print tax invoice error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ใบกำกับภาษีเต็มรูป</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Invoice info */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>เลขที่ใบกำกับภาษี</Text>
            <Text style={styles.infoValue}>{invoiceNo}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>วันที่</Text>
            <Text style={styles.infoValue}>{formatDateTime(new Date(sale.createdAt))}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>อ้างอิงบิล</Text>
            <Text style={styles.infoValue}>{saleNo}</Text>
          </View>
        </View>

        {/* Seller */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ข้อมูลผู้ขาย</Text>
          <Text style={styles.sellerLine}>{sellerName}</Text>
          <Text style={styles.sellerSub}>{sellerAddress}</Text>
          <Text style={styles.sellerSub}>เลขประจำตัวผู้เสียภาษี: {sellerTaxId}</Text>
        </View>

        {/* Buyer (editable) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ข้อมูลผู้ซื้อ</Text>
          <Input
            label="ชื่อผู้ซื้อ"
            placeholder="ชื่อลูกค้า / บริษัท"
            value={buyerName}
            onChangeText={setBuyerName}
          />
          <Input
            label="เลขประจำตัวผู้เสียภาษี"
            placeholder="เลข 13 หลัก"
            value={buyerTaxId}
            onChangeText={setBuyerTaxId}
            keyboardType="number-pad"
          />
          <Input
            label="ที่อยู่"
            placeholder="ที่อยู่สำหรับออกใบกำกับภาษี"
            value={buyerAddress}
            onChangeText={setBuyerAddress}
            multiline
            numberOfLines={3}
            containerStyle={{ marginBottom: 0 }}
          />
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>รายการสินค้า</Text>
          {sale.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.itemDetail}>{item.qty} × ฿{formatCurrency(item.unitPrice)}</Text>
              </View>
              <Text style={styles.itemAmount}>฿{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* VAT breakdown */}
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>มูลค่าสินค้า (ก่อน VAT)</Text>
            <Text style={styles.totalValue}>฿{formatCurrency(base)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ภาษีมูลค่าเพิ่ม 7%</Text>
            <Text style={styles.totalValue}>฿{formatCurrency(vat)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT จากบิล</Text>
            <Text style={styles.totalValue}>฿{formatCurrency(sale.vatAmount)}</Text>
          </View>
          <View style={styles.grandTotalBox}>
            <Text style={styles.grandTotalLabel}>ยอดรวมสุทธิ</Text>
            <Text style={styles.grandTotalValue}>฿{formatCurrency(grandTotal)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.printBtn} onPress={handlePrint} activeOpacity={0.85}>
            <Ionicons name="print-outline" size={20} color={Colors.white} />
            <Text style={styles.printBtnText}>พิมพ์ใบกำกับภาษี</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineBtn} onPress={onBack} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color={Colors.primary} />
            <Text style={styles.outlineBtnText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onCancelInvoice} activeOpacity={0.85}>
            <Ionicons name="close-circle-outline" size={20} color={Colors.danger} />
            <Text style={styles.cancelBtnText}>ยกเลิกใบกำกับภาษี</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scroll: { padding: Spacing.md, gap: Spacing.md },

  // Empty state
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyText: { ...Typography.h4, color: Colors.textSecondary },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, minHeight: 44,
  },
  emptyBtnText: { ...Typography.button, color: Colors.primary },

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.xs,
  },
  sectionTitle: { ...Typography.label, color: Colors.text, fontWeight: '700', marginBottom: Spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { ...Typography.body2, color: Colors.textSecondary },
  infoValue: { ...Typography.body2, color: Colors.text, fontWeight: '600' },
  sellerLine: { ...Typography.body1, color: Colors.text, fontWeight: '600' },
  sellerSub: { ...Typography.caption, color: Colors.textSecondary },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  itemName: { ...Typography.body2, color: Colors.text },
  itemDetail: { ...Typography.caption, color: Colors.textSecondary },
  itemAmount: { ...Typography.body2, color: Colors.text, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { ...Typography.body2, color: Colors.textSecondary },
  totalValue: { ...Typography.body2, color: Colors.text },
  grandTotalBox: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm,
    padding: Spacing.sm, marginTop: Spacing.xs,
  },
  grandTotalLabel: { ...Typography.label, color: Colors.primary },
  grandTotalValue: { ...Typography.h4, color: Colors.primary, fontWeight: '800' },

  actions: { gap: Spacing.sm },
  printBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md, minHeight: 44,
  },
  printBtnText: { ...Typography.button, color: Colors.white },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md, minHeight: 44,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  outlineBtnText: { ...Typography.button, color: Colors.primary },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md, minHeight: 44,
  },
  cancelBtnText: { ...Typography.button, color: Colors.danger },
});
