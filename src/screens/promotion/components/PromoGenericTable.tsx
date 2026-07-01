/**
 * PromoGenericTable — Reusable horizontal-scroll table for promotion screens
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';

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
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={styles.headerRow}>
            {columns.map((col, i) => (
              <Text key={i} style={[styles.headerCell, { width: col.width }]}>{col.label}</Text>
            ))}
            {onRemove && <Text style={[styles.headerCell, { width: 40 }]}></Text>}
          </View>

          {/* Rows */}
          {rows.map((row) => (
            <View key={row.id} style={styles.dataRow}>
              {row.cells.map((cell, i) => (
                <Text key={i} style={[styles.dataCell, { width: columns[i]?.width || 60 }]} numberOfLines={1}>
                  {cell != null ? String(cell) : '-'}
                </Text>
              ))}
              {onRemove && (
                <TouchableOpacity
                  style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => onRemove(row.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    paddingVertical: Spacing.sm,
  },
  headerCell: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.xs,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  dataCell: {
    ...Typography.caption,
    color: Colors.text,
    paddingHorizontal: Spacing.xs,
    textAlign: 'center',
  },
});
