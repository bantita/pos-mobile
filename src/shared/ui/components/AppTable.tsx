/**
 * AppTable — Modern table with rounded corners, hover, pagination, search
 * Responsive, consistent styling.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from '@/shared/tw/index';
import { cn } from '@/shared/lib/cn';

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
  <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    {/* Header */}
    <View className="flex-row border-b border-slate-200 bg-[#f6f7fb] px-4 py-3">
      {columns.map(col => (
        <View key={col.key} className="justify-center" style={col.flex ? { flex: col.flex } : col.width ? { width: col.width } : { flex: 1 }}>
          <Text className={cn('text-xs font-semibold uppercase leading-[18px] text-slate-500', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}>
            {col.label}
          </Text>
        </View>
      ))}
    </View>

    {/* Rows */}
    {data.length === 0 ? (
      <View className="items-center p-10"><Text className="text-[15px] leading-[22px] text-slate-500">{emptyText}</Text></View>
    ) : (
      data.map((row, i) => {
        const key = keyExtractor ? keyExtractor(row, i) : String(i);
        const isClickable = !!onRowPress;
        return (
          <TouchableOpacity
            key={key}
            className={cn('flex-row items-center border-b border-slate-200 px-4 py-3', i % 2 === 1 && 'bg-neutral-50')}
            onPress={isClickable ? () => onRowPress!(row) : undefined}
            activeOpacity={isClickable ? 0.6 : 1}
            disabled={!isClickable}
          >
            {columns.map(col => (
              <View key={col.key} className="justify-center" style={col.flex ? { flex: col.flex } : col.width ? { width: col.width } : { flex: 1 }}>
                {col.render ? (
                  col.render(row, i)
                ) : (
                  <Text className={cn('text-sm leading-[22px] text-slate-950', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')} numberOfLines={1}>
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
