/**
 * MiniBarChart — แผนภูมิแท่งแบบง่าย ไม่ต้องใช้ library
 */
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { formatCurrency } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

interface BarData {
  label: string;
  value: number;
  value2?: number;   // line overlay (profit)
  highlight?: boolean;
}

interface MiniBarChartProps {
  data: BarData[];
  color?: string;
  color2?: string;   // profit bar
  showValues?: boolean;
  height?: number;
  formatValue?: (v: number) => string;
  unit?: string;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({
  data, color = '#f87171', color2 = '#0f766e',
  showValues = false, height = 120, formatValue, unit = '',
}) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const fmt = formatValue ?? ((v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v));

  return (
    <View className="relative">
      <View className="flex-row items-end gap-1 pb-5" style={{ height }}>
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * (height - 20);
          const bar2H = d.value2 ? (d.value2 / maxVal) * (height - 20) : 0;
          return (
            <View key={i} className="flex-1 items-center gap-0.5">
              <View className="w-full justify-end items-center relative" style={{ height: height - 20 }}>
                {d.value2 !== undefined && (
                  <View style={[{ position: 'absolute', bottom: 0, width: '70%', borderTopLeftRadius: 3, borderTopRightRadius: 3 }, { height: bar2H, backgroundColor: color2 + '60' }]} />
                )}
                <View style={[{ width: '70%', borderTopLeftRadius: 3, borderTopRightRadius: 3 }, { height: barH, backgroundColor: d.highlight ? color : color + 'BB' }]} />
              </View>
              {showValues && (
                <Text className="text-[8px] text-slate-500 text-center" numberOfLines={1}>{fmt(d.value)}</Text>
              )}
              <Text style={{ color: d.highlight ? color : undefined, fontWeight: d.highlight ? '700' : undefined }} className="text-[9px] text-slate-500 text-center">
                {d.label}
              </Text>
            </View>
          );
        })}
      </View>
      <View className="absolute bottom-5 left-0 right-0 h-[1px] bg-slate-200" />
    </View>
  );
};
