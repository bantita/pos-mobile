/**
 * CouponCodeRow — Individual coupon code row in campaign detail list
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing } from '../../../constants/spacing';
import { CouponCode } from '../../../types/coupon';
import { CouponStatusBadge } from './CouponStatusBadge';

interface Props {
  item: CouponCode;
  index: number;
}

export const CouponCodeRow: React.FC<Props> = ({ item, index }) => {
  return (
    <View style={[styles.row, index % 2 === 0 && styles.rowEven]}>
      <Text style={styles.code}>{item.code}</Text>
      <Text style={styles.date}>{item.expiryDate.split('T')[0]}</Text>
      <Text style={styles.date}>{item.usageDate ? item.usageDate.split('T')[0] : '-'}</Text>
      <Text style={styles.bill}>{item.billNumber || '-'}</Text>
      <CouponStatusBadge status={item.status} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md, gap: Spacing.sm,
  },
  rowEven: { backgroundColor: Colors.backgroundSecondary },
  code: { ...Typography.body2, color: Colors.text, fontWeight: '500', width: 120 },
  date: { ...Typography.caption, color: Colors.textSecondary, width: 80 },
  bill: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
});
