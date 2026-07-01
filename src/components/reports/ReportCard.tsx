import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
  bgColor: string;
  trend?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label, value, sub, icon, color, bgColor, trend, onPress, style,
}) => (
  <TouchableOpacity
    style={[kStyles.card, { borderLeftColor: color }, style]}
    onPress={onPress}
    activeOpacity={onPress ? 0.8 : 1}
    disabled={!onPress}
  >
    <View style={[kStyles.iconBox, { backgroundColor: bgColor }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <View style={kStyles.content}>
      <Text style={kStyles.label}>{label}</Text>
      <Text style={[kStyles.value, { color }]}>{value}</Text>
      {sub && <Text style={kStyles.sub}>{sub}</Text>}
      {trend !== undefined && (
        <View style={kStyles.trendRow}>
          <Ionicons
            name={trend >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
            size={11} color={trend >= 0 ? Colors.success : Colors.danger}
          />
          <Text style={[kStyles.trendText, { color: trend >= 0 ? Colors.success : Colors.danger }]}>
            {trend >= 0 ? '+' : ''}{trend}% vs เมื่อวาน
          </Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

const kStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, borderLeftWidth: 4, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconBox: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  label: { ...Typography.caption, color: Colors.textSecondary },
  value: { ...Typography.h4, fontWeight: '700', marginTop: 1 },
  sub: { ...Typography.caption, color: Colors.textSecondary },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  trendText: { fontSize: 10, fontWeight: '600' },
});

// ─── Section Card ──────────────────────────────────────────────────────────────
interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, subtitle, icon, children, action, style }) => (
  <View style={[scStyles.card, style]}>
    <View style={scStyles.header}>
      <View style={scStyles.headerLeft}>
        {icon && <Ionicons name={icon as any} size={16} color={Colors.primary} />}
        <View>
          <Text style={scStyles.title}>{title}</Text>
          {subtitle && <Text style={scStyles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={scStyles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
    {children}
  </View>
);

const scStyles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  title: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  subtitle: { ...Typography.caption, color: Colors.textSecondary },
  actionText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
});

// ─── Export Button ─────────────────────────────────────────────────────────────
export const ExportButton: React.FC<{ onExcel: () => void; onPdf: () => void }> = ({ onExcel, onPdf }) => (
  <View style={expStyles.row}>
    <TouchableOpacity style={expStyles.excelBtn} onPress={onExcel}>
      <Ionicons name="document-text-outline" size={16} color={Colors.success} />
      <Text style={expStyles.excelText}>Excel</Text>
    </TouchableOpacity>
    <TouchableOpacity style={expStyles.pdfBtn} onPress={onPdf}>
      <Ionicons name="document-outline" size={16} color={Colors.danger} />
      <Text style={expStyles.pdfText}>PDF</Text>
    </TouchableOpacity>
  </View>
);

const expStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  excelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.successLight, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.success },
  excelText: { ...Typography.label, color: Colors.success },
  pdfBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.danger },
  pdfText: { ...Typography.label, color: Colors.danger },
});
