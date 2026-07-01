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
import { formatCurrency } from '../../utils/format';

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
    Alert.alert('ล้างรายการ', 'ต้องการล้างรายการสินค้าทั้งหมดในบิลนี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ล้าง', style: 'destructive', onPress: clearCart },
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
        <Text style={styles.itemPrice}>฿{formatCurrency(item.unitPrice)} / {item.product.unit}</Text>
        {item.discountAmount > 0 && (
          <Text style={styles.itemDiscount}>
            ส่วนลด: -฿{formatCurrency(item.discountAmount)}
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
        <Text style={styles.itemSubtotal}>฿{formatCurrency(item.subtotal)}</Text>
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
        <Text style={styles.headerTitle}>รายการในบิล ({items.length} รายการ)</Text>
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
          <Text style={styles.emptyTitle}>ยังไม่มีสินค้าในบิล</Text>
          <Text style={styles.emptySubtitle}>กดกลับเพื่อเพิ่มสินค้า</Text>
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
              <Text style={styles.summaryLabel}>รวมสินค้า</Text>
              <Text style={styles.summaryValue}>฿{formatCurrency(subtotal)}</Text>
            </View>
            {discountTotal > 0 && (
              <View style={styles.summaryRow}>
                <View style={styles.discountLabel}>
                  <Text style={styles.summaryLabel}>ส่วนลดท้ายบิล</Text>
                  <TouchableOpacity onPress={onDiscount}>
                    <Text style={styles.editDiscount}>แก้ไข</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.discountValue}>-฿{formatCurrency(discountTotal)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>VAT 7%</Text>
              <Text style={styles.summaryValue}>฿{formatCurrency(vatAmount)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>ยอดรวมสุทธิ</Text>
              <Text style={styles.totalValue}>฿{formatCurrency(grandTotal)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {discountTotal === 0 && (
              <TouchableOpacity style={styles.discountBtn} onPress={onDiscount}>
                <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
                <Text style={styles.discountBtnText}>เพิ่มส่วนลด</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelBillBtn} onPress={onCancelBill}>
              <Ionicons name="close-circle-outline" size={18} color={Colors.danger} />
              <Text style={styles.cancelBillBtnText}>ยกเลิกบิล</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkoutBtn} onPress={onCheckout} activeOpacity={0.85}>
              <Ionicons name="card-outline" size={20} color={Colors.white} />
              <Text style={styles.checkoutBtnText}>ชำระเงิน ฿{formatCurrency(grandTotal)}</Text>
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
