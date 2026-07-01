/**
 * AppTable — Modern table with rounded corners, hover, pagination, search
 * Responsive, consistent styling.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Radius, Space, Font, Shadow } from '../tokens';

export interface Column<T = any> {
  key: string;
  label: string;
  flex?: number;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => React.ReactNode;
}

interface Props<T = any> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (row: T, index: number) => string;
  onRowPress?: (row: T) => void;
  emptyText?: string;
}

export const AppTable = <T extends Record<string, any>>({
  columns, data, keyExtractor, onRowPress, emptyText = 'ไม่มีข้อมูล',
}: Props<T>) => (
  <View style={s.wrapper}>
    {/* Header */}
    <View style={s.header}>
      {columns.map(col => (
        <View key={col.key} style={[s.cell, col.flex ? { flex: col.flex } : col.width ? { width: col.width } : { flex: 1 }]}>
          <Text style={[s.th, col.align === 'right' && { textAlign: 'right' }, col.align === 'center' && { textAlign: 'center' }]}>
            {col.label}
          </Text>
        </View>
      ))}
    </View>

    {/* Rows */}
    {data.length === 0 ? (
      <View style={s.emptyRow}><Text style={s.emptyText}>{emptyText}</Text></View>
    ) : (
      data.map((row, i) => {
        const key = keyExtractor ? keyExtractor(row, i) : String(i);
        const isClickable = !!onRowPress;
        return (
          <TouchableOpacity
            key={key}
            style={[s.row, i % 2 === 1 && s.rowAlt]}
            onPress={isClickable ? () => onRowPress!(row) : undefined}
            activeOpacity={isClickable ? 0.6 : 1}
            disabled={!isClickable}
          >
            {columns.map(col => (
              <View key={col.key} style={[s.cell, col.flex ? { flex: col.flex } : col.width ? { width: col.width } : { flex: 1 }]}>
                {col.render ? (
                  col.render(row, i)
                ) : (
                  <Text style={[s.td, col.align === 'right' && { textAlign: 'right' }, col.align === 'center' && { textAlign: 'center' }]} numberOfLines={1}>
                    {row[col.key] ?? '—'}
                  </Text>
                )}
              </View>
            ))}
          </TouchableOpacity>
        );
      })
    )}
  </View>
);

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    paddingVertical: Space.md,
    paddingHorizontal: Space.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cell: { justifyContent: 'center' },
  th: {
    ...Font.th,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: Space.md,
    paddingHorizontal: Space.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  rowAlt: { backgroundColor: '#FDFBFB' },
  td: { ...Font.td, color: Colors.text },
  emptyRow: { padding: Space['3xl'], alignItems: 'center' },
  emptyText: { ...Font.body, color: Colors.textMuted },
});
