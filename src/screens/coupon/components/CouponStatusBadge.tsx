/**
 * CouponStatusBadge — แสดงสถานะคูปอง
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Typography, FontSize } from '../../../constants/typography';
import { BorderRadius, Spacing } from '../../../constants/spacing';
import { CouponStatus } from '../../../types/coupon';

const STATUS_CONFIG: Record<CouponStatus, { label: string; color: string; bgColor: string }> = {
  [CouponStatus.ACTIVE]: { label: 'ใช้ได้', color: Colors.success, bgColor: Colors.successLight },
  [CouponStatus.USED]: { label: 'ใช้แล้ว', color: Colors.textSecondary, bgColor: Colors.backgroundSecondary },
  [CouponStatus.EXPIRED]: { label: 'หมดอายุ', color: Colors.warning, bgColor: Colors.warningLight },
  [CouponStatus.CANCELLED]: { label: 'ยกเลิก', color: Colors.danger, bgColor: Colors.dangerLight },
};

interface Props {
  status: CouponStatus;
}

export const CouponStatusBadge: React.FC<Props> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: Colors.textSecondary, bgColor: Colors.backgroundSecondary };

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bgColor }]}>
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
