/**
 * MiniBarChart — แผนภูมิแท่งแบบง่าย ไม่ต้องใช้ library
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency } from '../../utils/format';

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
  data, color = Colors.primary, color2 = Colors.success,
  showValues = false, height = 120, formatValue, unit = '',
}) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const fmt = formatValue ?? ((v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v));

  return (
    <View style={styles.container}>
      <View style={[styles.chart, { height }]}>
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * (height - 20);
          const bar2H = d.value2 ? (d.value2 / maxVal) * (height - 20) : 0;
          return (
            <View key={i} style={styles.barGroup}>
              <View style={[styles.barWrap, { height: height - 20 }]}>
                {/* value2 overlay */}
                {d.value2 !== undefined && (
                  <View style={[styles.bar2, { height: bar2H, backgroundColor: color2 + '60' }]} />
                )}
                {/* Main bar */}
                <View style={[
                  styles.bar,
                  { height: barH, backgroundColor: d.highlight ? color : color + 'BB' },
                ]} />
              </View>
              {showValues && (
                <Text style={styles.valueText} numberOfLines={1}>{fmt(d.value)}</Text>
              )}
              <Text style={[styles.barLabel, d.highlight && { color, fontWeight: '700' }]}>
                {d.label}
              </Text>
            </View>
          );
        })}
      </View>
      {/* X-axis line */}
      <View style={styles.xAxis} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingBottom: 20 },
  barGroup: { flex: 1, alignItems: 'center', gap: 2 },
  barWrap: { width: '100%', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  bar: { width: '70%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  bar2: { position: 'absolute', bottom: 0, width: '70%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barLabel: { ...Typography.caption, color: Colors.textSecondary, fontSize: 9, textAlign: 'center' },
  valueText: { fontSize: 8, color: Colors.textSecondary, textAlign: 'center' },
  xAxis: { position: 'absolute', bottom: 20, left: 0, right: 0, height: 1, backgroundColor: Colors.border },
});
