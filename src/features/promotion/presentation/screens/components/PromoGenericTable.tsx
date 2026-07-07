import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from '@/shared/tw/index';

import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';

export interface TableColumn {
  label: string;
  width: number;
}

export interface TableRow {
  id: string;
  cells: Array<string | number>;
}

interface Props {
  columns: TableColumn[];
  rows: TableRow[];
  onRemove?: (id: string) => void;
}

export const PromoGenericTable: React.FC<Props> = ({ columns, rows, onRemove }) => {
  if (rows.length === 0) return null;

  return (
    <View className={cn('mt-3 border border-slate-200 rounded-xl overflow-hidden')}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View className={cn('flex-row bg-neutral-100 py-2')}>
            {columns.map((col, i) => (
              <Text key={i} className={cn('text-xs font-semibold text-slate-500 px-1 text-center')} style={{ width: col.width }}>{col.label}</Text>
            ))}
            {onRemove && <Text className={cn('text-xs font-semibold text-slate-500 px-1 text-center')} style={{ width: 40 }}></Text>}
          </View>

          {rows.map((row) => (
            <View key={row.id} className={cn('flex-row border-t border-slate-100 py-2 items-center')}>
              {row.cells.map((cell, i) => (
                <Text key={i} className={cn('text-xs text-slate-950 px-1 text-center')} style={{ width: columns[i]?.width || 60 }} numberOfLines={1}>
                  {cell != null ? String(cell) : '-'}
                </Text>
              ))}
              {onRemove && (
                <TouchableOpacity
                  style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => onRemove(row.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
