/**
 * ReportListView — ตาราง Listing ใช้ร่วมกันทุก Report
 * รองรับ: sort, filter, search, pagination, export
 */
import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { ExportButton } from '@/features/reports/presentation/components/ReportCard';
import { cn } from '@/shared/lib/cn';
import { Text, TextInput } from '@/shared/tw/index';

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
    <View className="flex-row bg-white px-2 py-2">
      {columns.map(col => (
        <TouchableOpacity
          key={String(col.key)}
          style={[{ flex: col.flex ?? 1, width: col.width }]}
          className="flex-row items-center gap-[3px] px-1"
          onPress={() => col.sortable !== false && handleSort(col.key)}
          disabled={col.sortable === false}
          activeOpacity={col.sortable === false ? 1 : 0.7}
        >
          <Text style={{ textAlign: col.align ?? 'left' }} className="text-xs font-bold text-slate-950 flex-1" numberOfLines={1}>
            {col.header}
          </Text>
          {col.sortable !== false && sortKey === col.key && (
            <Ionicons
              name={sortDir === 'asc' ? 'chevron-up' : 'chevron-down'}
              size={11}
              color="#f87171"
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // ─── Data Row ──────────────────────────────────────────────────────────────
  const DataRow = ({ item, index }: { item: T; index: number }) => (
    <View className={cn('flex-row px-2 py-2 border-b border-slate-100 bg-white', index % 2 === 1 && 'bg-neutral-50')}>
      {columns.map(col => {
        const val = (item as any)[col.key];
        return (
          <View key={String(col.key)} style={[{ flex: col.flex ?? 1, width: col.width }]} className="px-1 justify-center">
            {col.render ? (
              col.render(val, item)
            ) : (
              <Text style={{ textAlign: col.align ?? 'left' }} className="text-xs text-slate-950" numberOfLines={1}>
                {String(val ?? '—')}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <View className="flex-1">
      {/* ── Top bar ── */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-lg font-semibold text-slate-950">{title}</Text>
          {subtitle && <Text className="text-xs text-slate-500 mt-0.5">{subtitle}</Text>}
        </View>
        <ExportButton onExcel={onExcelExport} onPdf={onPdfExport} />
      </View>

      {/* ── Extra header slot ── */}
      {headerExtra}

      {/* ── Search bar ── */}
      {searchKeys.length > 0 && (
        <View className="flex-row items-center gap-2 mb-2">
          <View className="flex-1 flex-row items-center gap-2 bg-white rounded-xl px-3 h-10 border border-slate-200">
            <Ionicons name="search-outline" size={15} color="#57534e" />
            <TextInput
              className="flex-1 text-base text-slate-950"
              placeholder={searchPlaceholder}
              placeholderTextColor="#57534e"
              value={search}
              onChangeText={handleSearch}
            />
            {search !== '' && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={15} color="#57534e" />
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-xs text-slate-500 min-w-[70px]">
            {filtered.length.toLocaleString('th-TH')} รายการ
          </Text>
        </View>
      )}

      {/* ── Table ── */}
      {loading ? (
        <View className="flex-1 items-center justify-center p-5">
          <ActivityIndicator color="#f87171" size="large" />
        </View>
      ) : (
        <View className="flex-1 rounded-xl border border-slate-200 overflow-hidden">
          <HeaderRow />
          <FlatList
            data={pageData}
            keyExtractor={keyExtractor}
            renderItem={({ item, index }) => <DataRow item={item} index={index} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center py-5 gap-2">
                <Ionicons name="document-outline" size={44} color="#e7e5e4" />
                <Text className="text-base text-slate-500">{emptyText}</Text>
              </View>
            }
          />
        </View>
      )}

      {/* ── Summary ── */}
      {summaryRows && summaryRows.length > 0 && (
        <View className="bg-amber-100 border-t border-slate-200 px-3 py-2 gap-[3px]">
          {summaryRows.map((s, i) => (
            <View key={i} className={cn(i === summaryRows.length - 1 && 'border-t border-slate-200 pt-1 mt-0.5')}>
              <View className="flex-row justify-between">
                <Text className={cn('text-base text-slate-500', i === summaryRows.length - 1 && 'text-xs font-bold text-slate-950')}>
                  {s.label}
                </Text>
                <Text className={cn('text-base text-slate-950', i === summaryRows.length - 1 && 'text-xs font-extrabold text-rose-600')}>
                  {s.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <View className="flex-row items-center justify-center gap-3 py-2 border-t border-slate-200 bg-white">
          <TouchableOpacity
            className={cn('w-8 h-8 rounded-lg bg-neutral-100 items-center justify-center border border-slate-200', page === 1 && 'opacity-40')}
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <Ionicons name="chevron-back" size={16} color={page === 1 ? '#57534e' : '#f87171'} />
          </TouchableOpacity>
          <Text className="text-xs font-semibold text-slate-950">หน้า {page} / {totalPages}</Text>
          <TouchableOpacity
            className={cn('w-8 h-8 rounded-lg bg-neutral-100 items-center justify-center border border-slate-200', page === totalPages && 'opacity-40')}
            onPress={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <Ionicons name="chevron-forward" size={16} color={page === totalPages ? '#57534e' : '#f87171'} />
          </TouchableOpacity>
          <Text className="text-xs text-slate-500">({pageSize} ต่อหน้า)</Text>
        </View>
      )}
    </View>
  );
}
