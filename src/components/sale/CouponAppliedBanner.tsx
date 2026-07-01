/**
 * CouponAppliedBanner — Shows applied coupon info at POS checkout
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  couponCode: string;
  promotionName: string;
  discountValue: number;
  onRemove: () => void;
}

export const CouponAppliedBanner: React.FC<Props> = ({
  couponCode,
  promotionName,
  discountValue,
  onRemove,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="ticket-outline" size={20} color="#2E7D32" />
      </View>
      <View style={styles.info}>
        <Text style={styles.promoName}>{promotionName}</Text>
        <Text style={styles.codeText}>คูปอง: {couponCode}</Text>
      </View>
      <Text style={styles.discount}>-฿{discountValue.toFixed(2)}</Text>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <Ionicons name="close-circle" size={20} color={Colors.gray400} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#E8F5E9', borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginVertical: Spacing.xs,
  },
  iconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#C8E6C9', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  promoName: { ...Typography.body2, color: '#1B5E20', fontWeight: '600' },
  codeText: { ...Typography.caption, color: '#388E3C' },
  discount: { ...Typography.body2, color: '#2E7D32', fontWeight: '700' },
  removeBtn: { padding: 4 },
});
