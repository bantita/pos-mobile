/**
 * ReportListView — ตาราง Listing ใช้ร่วมกันทุก Report
 * รองรับ: sort, filter, search, pagination, export
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ExportButton } from './ReportCard';

export interface Column<T = any> {
  key: keyof T;
  header: string;
  width?: number;
  flex?: number;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface ReportListViewProps<T = any> {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  pageSize?: number;
  loading?: boolean;
  summaryRows?: { label: string; value: string }[];
  onExcelExport: () => void;
  onPdfExport: () => void;
  headerExtra?: React.ReactNode;
  emptyText?: string;
}

type SortDir = 'asc' | 'desc' | null;

export function ReportListView<T>({
  title, subtitle, columns, data, keyExtractor,
  searchKeys = [], searchPlaceholder = 'ค้นหา...',
  pageSize = 20, loading = false,
  summaryRows, onExcelExport, onPdfExport,
  headerExtra, emptyText = 'ไม่มีข้อมูล',
}: ReportListViewProps<T>) {
  const [search, setSearch]     = useState('');
  const [sortKey, setSortKey]   = useState<keyof T | null>(null);
  const [sortDir, setSortDir]   = useState<SortDir>(null);
  const [page, setPage]         = useState(1);

  const filtered = useMemo(() => {
    let result = [...data];
    if (search && searchKeys.length > 0) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        searchKeys.some(k => String((row as any)[k] ?? '').toLowerCase().includes(q))
      );
    }
    if (sortKey && sortDir) {
      result.sort((a, b) => {
        const av = (a as any)[sortKey];
        const bv = (b as any)[sortKey];
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), 'th');
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData   = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: keyof T) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); }
    else if (sortDir === 'asc') setSortDir('desc');
    else { setSortKey(null); setSortDir(null); }
    setPage(1);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    setPage(1);
  };

  // ─── Header Row ────────────────────────────────────────────────────────────
  const HeaderRow = () => (
    <View style={styles.tableHeader}>
      {columns.map(col => (
        <TouchableOpacity
          key={String(col.key)}
          style={[styles.th, { flex: col.flex ?? 1, width: col.width }]}
          onPress={() => col.sortable !== false && handleSort(col.key)}
          disabled={col.sortable === false}
          activeOpacity={col.sortable === false ? 1 : 0.7}
        >
          <Text style={[styles.thText, { textAlign: col.align ?? 'left' }]} numberOfLines={1}>
            {col.header}
          </Text>
          {col.sortable !== false && sortKey === col.key && (
            <Ionicons
              name={sortDir === 'asc' ? 'chevron-up' : 'chevron-down'}
              size={11}
              color={Colors.primary}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // ─── Data Row ──────────────────────────────────────────────────────────────
  const DataRow = ({ item, index }: { item: T; index: number }) => (
    <View style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
      {columns.map(col => {
        const val = (item as any)[col.key];
        return (
          <View key={String(col.key)} style={[styles.td, { flex: col.flex ?? 1, width: col.width }]}>
            {col.render ? (
              col.render(val, item)
            ) : (
              <Text style={[styles.tdText, { textAlign: col.align ?? 'left' }]} numberOfLines={1}>
                {String(val ?? '—')}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <ExportButton onExcel={onExcelExport} onPdf={onPdfExport} />
      </View>

      {/* ── Extra header slot ── */}
      {headerExtra}

      {/* ── Search bar ── */}
      {searchKeys.length > 0 && (
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={15} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={Colors.textDisabled}
              value={search}
              onChangeText={handleSearch}
            />
            {search !== '' && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={15} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.resultCount}>
            {filtered.length.toLocaleString('th-TH')} รายการ
          </Text>
        </View>
      )}

      {/* ── Table ── */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <View style={styles.tableContainer}>
          <HeaderRow />
          <FlatList
            data={pageData}
            keyExtractor={keyExtractor}
            renderItem={({ item, index }) => <DataRow item={item} index={index} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="document-outline" size={44} color={Colors.border} />
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            }
          />
        </View>
      )}

      {/* ── Summary ── */}
      {summaryRows && summaryRows.length > 0 && (
        <View style={styles.summarySection}>
          {summaryRows.map((s, i) => (
            <View key={i} style={[styles.summaryRow, i === summaryRows.length - 1 && styles.summaryRowTotal]}>
              <Text style={[styles.summaryLabel, i === summaryRows.length - 1 && styles.summaryLabelTotal]}>
                {s.label}
              </Text>
              <Text style={[styles.summaryValue, i === summaryRows.length - 1 && styles.summaryValueTotal]}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <Ionicons name="chevron-back" size={16} color={page === 1 ? Colors.textDisabled : Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.pageText}>หน้า {page} / {totalPages}</Text>
          <TouchableOpacity
            style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <Ionicons name="chevron-forward" size={16} color={page === totalPages ? Colors.textDisabled : Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.pageSize}>({pageSize} ต่อหน้า)</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  topBarLeft: { flex: 1, marginRight: Spacing.sm },
  title: { ...Typography.h4, color: Colors.text },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, height: 40,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.text },
  resultCount: { ...Typography.caption, color: Colors.textSecondary, minWidth: 70 },
  tableContainer: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  th: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  thText: { ...Typography.caption, color: Colors.text, fontWeight: '700', flex: 1 },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  tableRowAlt: { backgroundColor: Colors.gray50 },
  td: { paddingHorizontal: 4, justifyContent: 'center' },
  tdText: { ...Typography.caption, color: Colors.text },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  empty: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
  summarySection: {
    backgroundColor: Colors.surfaceWarm,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    gap: 3,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryRowTotal: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.xs, marginTop: 2 },
  summaryLabel: { ...Typography.body2, color: Colors.textSecondary },
  summaryLabelTotal: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  summaryValue: { ...Typography.body2, color: Colors.text },
  summaryValueTotal: { ...Typography.label, color: Colors.primary, fontWeight: '800' },
  pagination: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pageBtn: {
    width: 32, height: 32, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageText: { ...Typography.label, color: Colors.text },
  pageSize: { ...Typography.caption, color: Colors.textDisabled },
});
