/**
 * VariantSelector — เลือกตัวเลือกสินค้า (variant) บน POS (mobile)
 *
 * แสดงเป็น bottom-sheet modal แบบเดียวกับ UOMSelector / ServiceStaffPopup
 * ให้ผู้ใช้เลือกค่าทีละตัวเลือก (เช่น สี, ไซส์) แล้ว resolve variant ที่ตรงจาก
 * master.variants[] ตาม optionValues ก่อนสร้างรายการตะกร้าผ่าน shared toCartProduct()
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, ComponentSize } from '../../constants/spacing';
import { ProductMaster, ProductVariant } from '../../types/product';
import { Product } from '../../types/sale';
import { toCartProduct } from '../../utils/cartProduct';
import { formatCurrency } from '../../utils/format';
import { resolveCartPrice } from '../../utils/priceResolver';

interface VariantSelectorProps {
  visible: boolean;
  master: ProductMaster | null;
  branchId?: string;
  onSelect: (cartProduct: Product, variant: ProductVariant) => void;
  onClose: () => void;
}

/** หา variant ที่ optionValues ตรงกับค่าที่ผู้ใช้เลือกครบทุกตัวเลือก */
const findMatchingVariant = (
  master: ProductMaster,
  selected: Record<string, string>,
): ProductVariant | undefined =>
  (master.variants ?? []).find((v) =>
    (master.options ?? []).every(
      (opt) => v.optionValues[opt.name] === selected[opt.name],
    ),
  );

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  visible, master, branchId, onSelect, onClose,
}) => {
  const [selected, setSelected] = useState<Record<string, string>>({});

  // รีเซ็ตค่าที่เลือกทุกครั้งที่เปลี่ยนสินค้า/เปิดใหม่
  React.useEffect(() => {
    if (visible) setSelected({});
  }, [visible, master?.id]);

  const options = master?.options ?? [];
  const uom = master?.uoms?.[0];

  const allChosen =
    options.length > 0 && options.every((opt) => !!selected[opt.name]);

  const matchedVariant = useMemo(
    () => (master && allChosen ? findMatchingVariant(master, selected) : undefined),
    [master, allChosen, selected],
  );

  const previewPrice =
    master && uom
      ? resolveCartPrice(master, uom, branchId, matchedVariant).price
      : 0;

  if (!master) return null;

  const handleConfirm = () => {
    if (!uom || !matchedVariant) return;
    const cartProduct = toCartProduct(master, uom, branchId, matchedVariant);
    onSelect(cartProduct, matchedVariant);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="options-outline" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>เลือกตัวเลือกสินค้า</Text>
              <Text style={styles.subtitle}>{master.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          {/* ตัวเลือกแต่ละชนิด */}
          {options.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyText}>ไม่มีข้อมูลตัวเลือก</Text>
            </View>
          ) : (
            options.map((opt) => (
              <View key={opt.name} style={styles.optionGroup}>
                <Text style={styles.optionLabel}>{opt.name}</Text>
                <View style={styles.valueRow}>
                  {opt.values.map((value) => {
                    const active = selected[opt.name] === value;
                    // เช็คว่าค่านี้มี variant รองรับหรือไม่ (combination ที่เหลือ)
                    const hasVariant = (master.variants ?? []).some(
                      (v) => v.optionValues[opt.name] === value,
                    );
                    return (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.valueChip,
                          active && styles.valueChipActive,
                          !hasVariant && styles.valueChipDisabled,
                        ]}
                        onPress={() =>
                          setSelected((s) => ({ ...s, [opt.name]: value }))
                        }
                        disabled={!hasVariant}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.valueText,
                            active && styles.valueTextActive,
                            !hasVariant && styles.valueTextDisabled,
                          ]}
                        >
                          {value}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}

          {/* สรุป/แจ้งเตือนเมื่อเลือกครบแต่ไม่มี variant */}
          {allChosen && !matchedVariant && (
            <View style={styles.warnBox}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
              <Text style={styles.warnText}>ไม่มีสินค้าตามตัวเลือกที่เลือก</Text>
            </View>
          )}
          {matchedVariant && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>ราคา</Text>
              <Text style={styles.priceValue}>฿{formatCurrency(previewPrice)}</Text>
            </View>
          )}

          {/* ปุ่มยืนยัน (touch target >= 44px) */}
          <TouchableOpacity
            style={[styles.confirmBtn, !matchedVariant && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!matchedVariant}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmText}>เพิ่มลงบิล</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, maxHeight: '80%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: Colors.gray200,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...Typography.h4, color: Colors.text },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: { padding: 4 },
  optionGroup: { marginBottom: Spacing.md, gap: Spacing.sm },
  optionLabel: {
    ...Typography.caption, color: Colors.gray600,
    fontWeight: '600', marginBottom: 2,
  },
  valueRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  valueChip: {
    minHeight: ComponentSize.button.md,
    paddingHorizontal: Spacing.lg, justifyContent: 'center',
    borderRadius: BorderRadius.md, backgroundColor: Colors.gray50,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  valueChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  valueChipDisabled: { opacity: 0.4 },
  valueText: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  valueTextActive: { color: Colors.white },
  valueTextDisabled: { color: Colors.gray400 },
  warnBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginTop: Spacing.xs,
  },
  warnText: { ...Typography.body2, color: Colors.danger, flex: 1 },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, marginTop: Spacing.xs,
  },
  priceLabel: { ...Typography.body2, color: Colors.textSecondary },
  priceValue: { ...Typography.h4, color: Colors.primary, fontWeight: '700' },
  confirmBtn: {
    marginTop: Spacing.md, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, minHeight: ComponentSize.button.md,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnDisabled: { backgroundColor: Colors.gray300 },
  confirmText: { ...Typography.button, color: Colors.white },
  cancelBtn: {
    alignItems: 'center', paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm,
  },
  cancelText: { ...Typography.button, color: Colors.danger },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText: { ...Typography.body1, color: Colors.gray400 },
});
