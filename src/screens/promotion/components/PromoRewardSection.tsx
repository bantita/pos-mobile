/**
 * PromoRewardSection — Reward/discount section for promotion form
 * Handles: ส่วนลด (discount products), ของแถม (freebie), คะแนน (points)
 */
import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { PromoGenericTable, TableColumn, TableRow } from './PromoGenericTable';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DiscountProduct {
  id: string;
  code: string;
  name: string;
  unit: string;
  condition: string;
  qty: string;
  promoGroupName: string;
  discountPerUnit: string;
  discountPercent: string;
  discount: string;
  discountBill: boolean;
  salePrice: string;
}

export interface FreeProduct {
  id: string;
  code: string;
  name: string;
  unit: string;
  condition: string;
  qty: string;
}

interface Props {
  promoType: string;
  // Header discount
  headerDiscount: boolean;
  onToggleHeaderDiscount: () => void;
  headerDiscountAmount: string;
  headerDiscountPercent: string;
  onHeaderDiscountAmountChange: (v: string) => void;
  onHeaderDiscountPercentChange: (v: string) => void;
  // Discount products
  discountProducts: DiscountProduct[];
  onOpenDiscountProductModal: () => void;
  onRemoveDiscountProduct: (id: string) => void;
  onUpdateDiscountProduct: (id: string, field: keyof DiscountProduct, value: string | boolean) => void;
  // Freebie products
  freebieProducts: FreeProduct[];
  onOpenFreebieModal: () => void;
  onRemoveFreebieProduct: (id: string) => void;
  // Promo group
  promoGroup: string;
  onOpenPromoGroupPicker: () => void;
  // Excluded in reward
  onOpenExcludedDiscountModal: () => void;
  // Points (for type 2)
  rewardPoints: string;
  onRewardPointsChange: (v: string) => void;
}

export const PromoRewardSection: React.FC<Props> = (props) => {
  const isPointType = props.promoType === 'รับคะแนน, ของกำนัล';
  const isExchangeType = props.promoType === 'คะแนนแลกสินค้า, ส่วนลด' || props.promoType === 'ใช้คะแนนชำระ';

  // Discount table columns
  const discountCols: TableColumn[] = [
    { label: 'ลำดับ', width: 40 },
    { label: 'สินค้า', width: 70 },
    { label: 'ชื่อสินค้า', width: 120 },
    { label: 'หน่วย', width: 50 },
    { label: 'เงื่อนไข', width: 60 },
    { label: 'จำนวน', width: 60 },
    { label: 'ส่วนลด/หน่วย', width: 80 },
    { label: '%ส่วนลด', width: 70 },
    { label: 'ส่วนลด', width: 70 },
    { label: 'มูลค่าขาย', width: 80 },
  ];

  const discountRows: TableRow[] = props.discountProducts.map((p, i) => ({
    id: p.id,
    cells: [
      i + 1, p.code, p.name, p.unit, p.condition || '-', p.qty,
      p.discountPerUnit || '0', p.discountPercent || '0', p.discount || '0', p.salePrice || '0',
    ],
  }));

  // Freebie table columns
  const freebieCols: TableColumn[] = [
    { label: 'ลำดับ', width: 40 },
    { label: 'รหัส', width: 70 },
    { label: 'ชื่อสินค้า', width: 140 },
    { label: 'หน่วย', width: 60 },
    { label: 'จำนวน', width: 60 },
  ];

  const freebieRows: TableRow[] = props.freebieProducts.map((p, i) => ({
    id: p.id,
    cells: [i + 1, p.code, p.name, p.unit, p.qty],
  }));

  return (
    <View>
      <Text style={s.sectionHeader}>3) รางวัล/ส่วนลด</Text>

      {/* Points reward (Type 2) */}
      {isPointType && (
        <View>
          <Text style={s.fieldLabel}>คะแนนที่ได้รับ</Text>
          <TextInput
            style={s.input}
            value={props.rewardPoints}
            onChangeText={props.onRewardPointsChange}
            placeholder="0"
            placeholderTextColor={Colors.textDisabled}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Discount section (Type 1, 3, 4) */}
      {!isPointType && (
        <View>
          {/* Header discount checkbox */}
          <TouchableOpacity style={s.checkboxRow} onPress={props.onToggleHeaderDiscount}>
            <Ionicons
              name={props.headerDiscount ? 'checkbox' : 'square-outline'}
              size={20}
              color={props.headerDiscount ? Colors.primary : Colors.gray400}
            />
            <Text style={s.checkboxLabel}>ส่วนลดหัวบิล</Text>
          </TouchableOpacity>

          {props.headerDiscount && (
            <View>
              <Text style={s.fieldLabel}>จำนวนเงินส่วนลดหัวบิล (บาท)</Text>
              <TextInput
                style={s.input}
                value={props.headerDiscountAmount}
                onChangeText={props.onHeaderDiscountAmountChange}
                placeholder="0.00"
                keyboardType="numeric"
              />
              <Text style={s.fieldLabel}>หรือ % ส่วนลดหัวบิล</Text>
              <TextInput
                style={s.input}
                value={props.headerDiscountPercent}
                onChangeText={props.onHeaderDiscountPercentChange}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Discount products */}
          <Text style={[s.fieldLabel, { marginTop: Spacing.md }]}>กลุ่มสินค้าโปรโมชั่น (ส่วนลด)</Text>
          <TouchableOpacity style={s.input} onPress={props.onOpenPromoGroupPicker}>
            <Text style={[s.inputText, !props.promoGroup && { color: Colors.textDisabled }]}>
              {props.promoGroup || 'เลือกกลุ่มสินค้า'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={s.selectBtn} onPress={props.onOpenDiscountProductModal}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
            <Text style={s.selectBtnText}>เลือกสินค้า</Text>
          </TouchableOpacity>

          <PromoGenericTable columns={discountCols} rows={discountRows} onRemove={props.onRemoveDiscountProduct} />

          {/* Excluded from discount */}
          <Text style={[s.fieldLabel, { marginTop: Spacing.md }]}>สินค้าไม่ร่วมรายการ (ส่วนลด)</Text>
          <TouchableOpacity style={s.selectBtn} onPress={props.onOpenExcludedDiscountModal}>
            <Ionicons name="remove-circle-outline" size={18} color={Colors.white} />
            <Text style={s.selectBtnText}>เลือกสินค้าที่ไม่ร่วมส่วนลด</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Freebie section */}
      <View style={{ marginTop: Spacing.lg }}>
        <Text style={s.subHeader}>ของแถม (ส่วนลด 100%)</Text>
        <TouchableOpacity style={s.selectBtn} onPress={props.onOpenFreebieModal}>
          <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
          <Text style={s.selectBtnText}>เลือกสินค้าของแถม</Text>
        </TouchableOpacity>
        <PromoGenericTable columns={freebieCols} rows={freebieRows} onRemove={props.onRemoveFreebieProduct} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  sectionHeader: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  subHeader: { ...Typography.label, color: Colors.text, fontWeight: '600', marginBottom: Spacing.sm },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, ...Typography.body2, color: Colors.text, backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  inputText: { ...Typography.body2, color: Colors.text, flex: 1 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.sm },
  checkboxLabel: { ...Typography.body2, color: Colors.text },
  selectBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignSelf: 'flex-start', marginTop: Spacing.sm },
  selectBtnText: { ...Typography.body2, color: Colors.white, fontWeight: '500' },
});
