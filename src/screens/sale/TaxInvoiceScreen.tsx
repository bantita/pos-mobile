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
import { useT, useReceiptT } from '../../i18n';
import { buildTaxInvoiceHtml } from '../../utils/taxInvoiceHtml';
import { receiptDateTime } from '../../utils/receiptTemplate';

interface TaxInvoiceScreenProps {
  saleNo: string;
  onBack: () => void;
  onCancelInvoice: () => void;
}

export const TaxInvoiceScreen: React.FC<TaxInvoiceScreenProps> = ({
  saleNo, onBack, onCancelInvoice,
}) => {
  const t = useT();
  // เอกสาร (กระดาษ/HTML ที่พิมพ์) ใช้ "ภาษาใบเสร็จ"; ฟอร์มและปุ่มใช้ภาษา UI
  const { rt, receiptLang, fmt } = useReceiptT();
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
          <Text style={styles.headerTitle}>{t('receiptScreen.taxInvoice.title')}</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="document-outline" size={64} color={Colors.gray400} />
          <Text style={styles.emptyText}>{t('receiptScreen.taxInvoice.notFound')}</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={18} color={Colors.primary} />
            <Text style={styles.emptyBtnText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const invoiceNo = `TAX${saleNo}`;
  const grandTotal = sale.grandTotal;
  const base = grandTotal / 1.07;
  const vat = grandTotal - base;

  const handlePrint = async () => {
    const html = buildTaxInvoiceHtml(
      {
        invoiceNo,
        issuedAt: sale.createdAt,
        seller: { name: sellerName, address: sellerAddress, taxId: sellerTaxId },
        buyer: { name: buyerName, taxId: buyerTaxId, address: buyerAddress },
        items: sale.items.map((i) => ({ name: i.product.name, qty: i.qty, unitPrice: i.unitPrice, amount: i.subtotal })),
        totals: { base, vat, grand: grandTotal },
      },
      receiptLang,
    );
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: t('receiptScreen.taxInvoice.shareTitle', { no: invoiceNo }), UTI: 'com.adobe.pdf' });
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
        <Text style={styles.headerTitle}>{t('receiptScreen.taxInvoice.title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Invoice info */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{rt('receipt.caption.taxInvoiceNo')}</Text>
            <Text style={styles.infoValue}>{invoiceNo}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{rt('receipt.caption.date')}</Text>
            <Text style={styles.infoValue}>{receiptDateTime(sale.createdAt, receiptLang)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{rt('receipt.taxInvoice.refBill')}</Text>
            <Text style={styles.infoValue}>{saleNo}</Text>
          </View>
        </View>

        {/* Seller */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{rt('receipt.taxInvoice.sellerInfo')}</Text>
          <Text style={styles.sellerLine}>{sellerName}</Text>
          <Text style={styles.sellerSub}>{sellerAddress}</Text>
          <Text style={styles.sellerSub}>{rt('receipt.caption.taxId')}: {sellerTaxId}</Text>
        </View>

        {/* Buyer (editable) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('receiptScreen.taxInvoice.buyerInfo')}</Text>
          <Input
            label={t('receiptScreen.taxInvoice.buyerName')}
            placeholder={t('receiptScreen.taxInvoice.buyerNamePlaceholder')}
            value={buyerName}
            onChangeText={setBuyerName}
          />
          <Input
            label={t('receiptScreen.taxInvoice.buyerTaxId')}
            placeholder={t('receiptScreen.taxInvoice.buyerTaxIdPlaceholder')}
            value={buyerTaxId}
            onChangeText={setBuyerTaxId}
            keyboardType="number-pad"
          />
          <Input
            label={t('receiptScreen.taxInvoice.buyerAddress')}
            placeholder={t('receiptScreen.taxInvoice.buyerAddressPlaceholder')}
            value={buyerAddress}
            onChangeText={setBuyerAddress}
            multiline
            numberOfLines={3}
            containerStyle={{ marginBottom: 0 }}
          />
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{rt('receipt.paper.items')}</Text>
          {sale.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.itemDetail}>{item.qty} × {fmt.money(item.unitPrice)}</Text>
              </View>
              <Text style={styles.itemAmount}>{fmt.money(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* VAT breakdown */}
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{rt('receipt.taxInvoice.beforeVat')}</Text>
            <Text style={styles.totalValue}>{fmt.money(base)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{rt('receipt.vat', { rate: 7 })}</Text>
            <Text style={styles.totalValue}>{fmt.money(vat)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{rt('receipt.taxInvoice.vatFromBill')}</Text>
            <Text style={styles.totalValue}>{fmt.money(sale.vatAmount)}</Text>
          </View>
          <View style={styles.grandTotalBox}>
            <Text style={styles.grandTotalLabel}>{rt('receipt.taxInvoice.grandTotal')}</Text>
            <Text style={styles.grandTotalValue}>{fmt.money(grandTotal)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.printBtn} onPress={handlePrint} activeOpacity={0.85}>
            <Ionicons name="print-outline" size={20} color={Colors.white} />
            <Text style={styles.printBtnText}>{t('receiptScreen.taxInvoice.print')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineBtn} onPress={onBack} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color={Colors.primary} />
            <Text style={styles.outlineBtnText}>{t('common.back')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onCancelInvoice} activeOpacity={0.85}>
            <Ionicons name="close-circle-outline" size={20} color={Colors.danger} />
            <Text style={styles.cancelBtnText}>{t('receiptScreen.taxInvoice.cancel')}</Text>
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
