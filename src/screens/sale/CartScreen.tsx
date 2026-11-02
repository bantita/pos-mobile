/**
 * SCR-SALE-003 — Cart Screen (ตะกร้าสินค้า)
 * FR-SALE-003: จัดการรายการในบิล เพิ่ม/ลบ/แก้ไขจำนวน
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { CartItem } from '../../types/sale';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { useT, useFormat } from '../../i18n';

interface CartScreenProps {
  onBack: () => void;
  onCheckout: () => void;
  onDiscount: () => void;
  onCancelBill: () => void;
  onCustomerDisplay: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  onBack,
  onCheckout,
  onDiscount,
  onCancelBill,
  onCustomerDisplay,
}) => {
  const t = useT();
  const f = useFormat();
  const {
    items, discount, removeItem, updateQty,
    clearCart, getSubtotal, getDiscountTotal,
    getVatAmount, getGrandTotal,
  } = useCartStore();

  const subtotal = getSubtotal();
  const discountTotal = getDiscountTotal();
  const vatAmount = getVatAmount();
  const grandTotal = getGrandTotal();

  const handleClearCart = () => {
    Alert.alert(t('pos.mobile.clearTitle'), t('pos.mobile.clearMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('pos.mobile.clearBtn'), style: 'destructive', onPress: clearCart },
    ]);
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={[styles.itemImageBox, item.technicianId ? styles.itemImageBoxService : undefined]}>
        <Ionicons
          name={item.technicianId ? 'cut-outline' : 'cube-outline'}
          size={24}
          color={item.technicianId ? Colors.category1 : Colors.primary}
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
        {item.technicianName && (
          <Text style={styles.itemTechnician} numberOfLines={1}>
            👤 {item.technicianName}
          </Text>
        )}
        <Text style={styles.itemPrice}>{f.money(item.unitPrice)} / {item.product.unit}</Text>
        {item.discountAmount > 0 && (
          <Text style={styles.itemDiscount}>
            {t('pos.mobile.itemDiscount', { amount: f.money(item.discountAmount) })}
          </Text>
        )}
      </View>
      <View style={styles.itemControls}>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQty(item.product.id, item.qty - 1)}
          >
            <Ionicons name="remove" size={16} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.qty}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQty(item.product.id, item.qty + 1)}
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemSubtotal}>{f.money(item.subtotal)}</Text>
      </View>
      <TouchableOpacity
        onPress={() => removeItem(item.product.id)}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={16} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('pos.mobile.cartTitle', { count: items.length })}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onCustomerDisplay} style={styles.headerIconBtn}>
            <Ionicons name="tv-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
          {items.length > 0 && (
            <TouchableOpacity onPress={handleClearCart} style={styles.headerIconBtn}>
              <Ionicons name="trash-outline" size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cart Items */}
      {items.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={72} color={Colors.gray300} />
          <Text style={styles.emptyTitle}>{t('pos.mobile.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('pos.mobile.emptySub')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.product.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Summary */}
      {items.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryRows}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('pos.mobile.subtotal')}</Text>
              <Text style={styles.summaryValue}>{f.money(subtotal)}</Text>
            </View>
            {discountTotal > 0 && (
              <View style={styles.summaryRow}>
                <View style={styles.discountLabel}>
                  <Text style={styles.summaryLabel}>{t('pos.disc.billTitle')}</Text>
                  <TouchableOpacity onPress={onDiscount}>
                    <Text style={styles.editDiscount}>{t('pos.mobile.edit')}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.discountValue}>-{f.money(discountTotal)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('pos.cart.vat', { rate: 7 })}</Text>
              <Text style={styles.summaryValue}>{f.money(vatAmount)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>{t('pos.mobile.netTotal')}</Text>
              <Text style={styles.totalValue}>{f.money(grandTotal)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {discountTotal === 0 && (
              <TouchableOpacity style={styles.discountBtn} onPress={onDiscount}>
                <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
                <Text style={styles.discountBtnText}>{t('pos.mobile.addDiscount')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelBillBtn} onPress={onCancelBill}>
              <Ionicons name="close-circle-outline" size={18} color={Colors.danger} />
              <Text style={styles.cancelBillBtnText}>{t('pos.inv.cancelBill')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkoutBtn} onPress={onCheckout} activeOpacity={0.85}>
              <Ionicons name="card-outline" size={20} color={Colors.white} />
              <Text style={styles.checkoutBtnText}>{t('pos.mobile.checkout', { amount: f.money(grandTotal) })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  headerActions: { flexDirection: 'row', gap: Spacing.xs },
  headerIconBtn: { padding: Spacing.xs },
  emptyCart: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.gray400 },
  emptySubtitle: { ...Typography.body2, color: Colors.gray300 },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 200 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  itemImageBox: {
    width: 44, height: 44, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  itemImageBoxService: {
    backgroundColor: Colors.primaryLight,
  },
  itemInfo: { flex: 1 },
  itemName: { ...Typography.label, color: Colors.text },
  itemTechnician: { ...Typography.caption, color: Colors.category1, fontWeight: '600' },
  itemPrice: { ...Typography.caption, color: Colors.textSecondary },
  itemDiscount: { ...Typography.caption, color: Colors.danger },
  itemControls: { alignItems: 'flex-end', gap: Spacing.xs },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  qtyBtn: {
    width: 28, height: 28, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary,
  },
  qtyText: { ...Typography.label, color: Colors.text, minWidth: 28, textAlign: 'center' },
  itemSubtotal: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  deleteBtn: { padding: Spacing.xs },
  summary: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: Spacing.lg,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  summaryRows: { gap: Spacing.sm, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...Typography.body2, color: Colors.textSecondary },
  summaryValue: { ...Typography.body2, color: Colors.text },
  discountLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  editDiscount: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  discountValue: { ...Typography.body2, color: Colors.danger },
  divider: { height: 1, backgroundColor: Colors.border },
  totalLabel: { ...Typography.h4, color: Colors.text },
  totalValue: { ...Typography.h3, color: Colors.primary, fontWeight: '700' },
  actions: { gap: Spacing.sm },
  discountBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, padding: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  discountBtnText: { ...Typography.button, color: Colors.primary },
  cancelBillBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, padding: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  cancelBillBtnText: { ...Typography.button, color: Colors.danger },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, padding: Spacing.md,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
  },
  checkoutBtnText: { ...Typography.button, color: Colors.white },
});
