import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

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
    style={[{ borderLeftColor: color, shadowColor: '#09090b', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, boxShadow: '0 4px 14px rgba(15, 23, 42, 0.07)' }, style]}
    className="flex-row items-center gap-2 bg-white rounded-xl p-3 border-l-4"
    onPress={onPress}
    activeOpacity={onPress ? 0.8 : 1}
    disabled={!onPress}
  >
    <View style={{ backgroundColor: bgColor }} className="w-11 h-11 rounded-xl items-center justify-center">
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <View className="flex-1">
      <Text className="text-xs text-slate-500">{label}</Text>
      <Text style={{ color }} className="text-lg font-bold mt-0.5">{value}</Text>
      {sub && <Text className="text-xs text-slate-500">{sub}</Text>}
      {trend !== undefined && (
        <View className="flex-row items-center gap-[3px] mt-0.5">
          <Ionicons
            name={trend >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
            size={11} color={trend >= 0 ? '#0f766e' : '#ef4444'}
          />
          <Text style={{ color: trend >= 0 ? '#0f766e' : '#ef4444' }} className="text-[10px] font-semibold">
            {trend >= 0 ? '+' : ''}{trend}% vs เมื่อวาน
          </Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

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
  <View style={[{ shadowColor: '#09090b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, boxShadow: '0 4px 14px rgba(15, 23, 42, 0.07)' }, style]} className="bg-white rounded-2xl p-3 gap-3">
    <View className="flex-row items-start justify-between">
      <View className="flex-row items-center gap-1">
        {icon && <Ionicons name={icon as any} size={16} color="#f87171" />}
        <View>
          <Text className="text-xs font-bold text-slate-950">{title}</Text>
          {subtitle && <Text className="text-xs text-slate-500">{subtitle}</Text>}
        </View>
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text className="text-xs text-rose-600 font-semibold">{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
    {children}
  </View>
);

// ─── Export Button ─────────────────────────────────────────────────────────────
export const ExportButton: React.FC<{ onExcel: () => void; onPdf: () => void }> = ({ onExcel, onPdf }) => (
  <View className="flex-row gap-2">
    <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-1.5 bg-emerald-100 rounded-xl py-2 border border-emerald-500" onPress={onExcel}>
      <Ionicons name="document-text-outline" size={16} color="#0f766e" />
      <Text className="text-xs font-semibold text-emerald-600">Excel</Text>
    </TouchableOpacity>
    <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-1.5 bg-rose-50 rounded-xl py-2 border border-rose-500" onPress={onPdf}>
      <Ionicons name="document-outline" size={16} color="#ef4444" />
      <Text className="text-xs font-semibold text-rose-600">PDF</Text>
    </TouchableOpacity>
  </View>
);
