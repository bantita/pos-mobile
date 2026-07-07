/**
 * SCR-RPT-003 — รายงานคลังสินค้า
 * FR-RPT-003: Stock On Hand, Low Stock, Dead Stock, Inventory Value
 */
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { MOCK_STOCK_ITEMS, MOCK_INV_SUMMARY } from '@/features/reports/data/mocks/mockReports';
import { StockOnHandItem } from '@/features/reports/domain/reports';
import { SectionCard, ExportButton } from '@/features/reports/presentation/components/ReportCard';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { cn } from '@/shared/lib/cn';

interface Props { onBack: () => void }

type StockFilter = 'all' | 'ok' | 'low' | 'out' | 'dead';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  ok:   { label: 'ปกติ',        color: '#0f766e', bg: '#d1fae5', icon: 'checkmark-circle-outline' },
  low:  { label: 'ใกล้หมด',     color: '#a16207', bg: '#fed7aa', icon: 'warning-outline' },
  out:  { label: 'หมดสต๊อก',   color: '#ef4444',  bg: '#ffe4e6',  icon: 'close-circle-outline' },
  dead: { label: 'Dead Stock',  color: '#6b7280', bg: '#f5f5f5',      icon: 'time-outline' },
};

export const InventoryReportScreen: React.FC<Props> = ({ onBack }) => {
  const [filter, setFilter] = useState<StockFilter>('all');
  const [sortBy, setSortBy] = useState<'name' | 'qty' | 'value' | 'turnover'>('qty');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const s = MOCK_INV_SUMMARY;

  const filtered = useMemo(() => {
    let items = filter === 'all' ? [...MOCK_STOCK_ITEMS] : MOCK_STOCK_ITEMS.filter(i => i.status === filter);
    if (sortBy === 'name')     items.sort((a, b) => a.productName.localeCompare(b.productName));
    if (sortBy === 'qty')      items.sort((a, b) => a.onHandQty - b.onHandQty);
    if (sortBy === 'value')    items.sort((a, b) => b.inventoryValue - a.inventoryValue);
    if (sortBy === 'turnover') items.sort((a, b) => (b.turnover ?? 0) - (a.turnover ?? 0));
    return items;
  }, [filter, sortBy]);

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-4 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}><Ionicons name="arrow-back" size={24} color="#fafafa" /></TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white flex-1')}>รายงานคลังสินค้า</Text>
        <ExportButton onExcel={() => showAlert('Export Excel', 'Excel export feature coming soon')} onPdf={() => showAlert('Export PDF', 'PDF export feature coming soon')} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName={cn('p-3 gap-3')}>

        {/* KPI Summary Cards */}
        <View className={cn('flex-row gap-2')}>
          {[
            { label: 'SKU ทั้งหมด',    value: String(s.totalSKU),     color: '#f87171', bg: '#fee2e2', icon: 'cube-outline',         filter: 'all' },
            { label: 'ใกล้หมด',         value: String(s.lowStockSKU),  color: '#a16207', bg: '#fed7aa', icon: 'warning-outline',      filter: 'low' },
            { label: 'หมดสต๊อก',       value: String(s.outOfStockSKU),color: '#ef4444',  bg: '#ffe4e6',  icon: 'close-circle-outline', filter: 'out' },
            { label: 'Dead Stock',      value: String(s.deadStockSKU), color: '#6b7280', bg: '#f5f5f5',      icon: 'time-outline',         filter: 'dead' },
          ].map((k) => (
            <TouchableOpacity
              key={k.filter}
              className={cn('flex-1 bg-white rounded-xl p-3 items-center gap-[3px] shadow-sm', filter === k.filter && 'border-2')}
              style={{ borderTopWidth: 3, borderTopColor: k.color }}
              onPress={() => setFilter(k.filter as StockFilter)}
            >
              <View className={cn('w-9 h-9 rounded-lg items-center justify-center')} style={{ backgroundColor: k.bg }}>
                <Ionicons name={k.icon as any} size={18} color={k.color} />
              </View>
              <Text className={cn('text-xl font-extrabold')} style={{ color: k.color }}>{k.value}</Text>
              <Text className={cn('text-xs text-slate-500 text-center')}>{k.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inventory Value */}
        <SectionCard title="มูลค่าคลังสินค้า" icon="archive-outline">
          <View className={cn('flex-row gap-3')}>
            <View className={cn('flex-1')}>
              <Text className={cn('text-xs text-slate-500')}>มูลค่ารวม (At Cost)</Text>
              <Text className={cn('text-xl font-extrabold text-rose-600 mt-[2px]')}>฿{formatCurrency(s.totalInventoryValue)}</Text>
            </View>
            <View className={cn('flex-1 gap-1')}>
              {['ok', 'low', 'out', 'dead'].map((st) => {
                const total = MOCK_STOCK_ITEMS.filter(i => i.status === st).reduce((s, i) => s + i.inventoryValue, 0);
                const cfg = STATUS_CFG[st];
                return (
                  <View key={st} className={cn('flex-row items-center gap-1')}>
                    <View className={cn('w-2 h-2 rounded-full')} style={{ backgroundColor: cfg.color }} />
                    <Text className={cn('text-xs text-slate-500 flex-1')}>{cfg.label}</Text>
                    <Text className={cn('text-xs text-slate-950 font-semibold')}>฿{formatCurrency(total)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </SectionCard>

        {/* Sort + Filter */}
        <View className={cn('flex-row items-center gap-2 flex-wrap')}>
          <Text className={cn('text-xs text-slate-500 font-medium')}>เรียงโดย:</Text>
          {[
            { key: 'qty',      label: 'คงเหลือ' },
            { key: 'value',    label: 'มูลค่า' },
            { key: 'turnover', label: 'Turnover' },
            { key: 'name',     label: 'ชื่อ' },
          ].map((o) => (
            <TouchableOpacity key={o.key} className={cn('px-3 py-2 min-h-10 rounded-full bg-neutral-100 border border-slate-200', sortBy === o.key && 'bg-rose-500 border-rose-500')} onPress={() => setSortBy(o.key as any)}>
              <Text className={cn('text-xs font-medium text-slate-500', sortBy === o.key && 'text-white font-bold')}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stock Table */}
        <SectionCard title={`รายการสินค้า (${filtered.length})`} icon="list-outline">
          <View className={cn('flex-row bg-neutral-100 rounded-lg px-1 py-1')}>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[2.5]')}>สินค้า</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[0.9] text-center')}>คงเหลือ</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[1] text-right')}>มูลค่า</Text>
            <Text className={cn('text-xs text-slate-500 font-bold flex-[0.9] text-center')}>สถานะ</Text>
          </View>
          {filtered.map((item, idx) => {
            const cfg = STATUS_CFG[item.status];
            const pctOfMin = item.minStock > 0 ? Math.min(100, (item.onHandQty / item.minStock) * 100) : 100;
            return (
              <View key={`${item.productCode}-${item.warehouseName}`} className={cn('flex-row items-start gap-1 py-2 border-b border-slate-200', idx % 2 === 1 && 'bg-rose-50')}>
                <View className={cn('flex-[2.5]')}>
                  <Text className={cn('text-base text-slate-950 font-medium')} numberOfLines={1}>{item.productName}</Text>
                  <Text className={cn('text-xs text-slate-500')}>{item.categoryName} · {item.warehouseName}</Text>
                  {/* Mini stock bar */}
                  <View className={cn('h-[3px] bg-gray-200 rounded-[2px] mt-[3px] overflow-hidden')}>
                    <View className={cn('h-full rounded-[2px]')} style={{ width: `${pctOfMin}%`, backgroundColor: cfg.color }} />
                  </View>
                  {item.lastMovement && (
                    <Text className={cn('text-[9px] text-gray-400 mt-[2px]')}>ล่าสุด: {formatDate(item.lastMovement)}</Text>
                  )}
                </View>
                <View className={cn('flex-[0.9] items-center')}>
                  <Text className={cn('text-sm font-extrabold')} style={{ color: cfg.color }}>{item.onHandQty}</Text>
                  <Text className={cn('text-xs text-slate-500')}>{item.unit}</Text>
                  {item.turnover !== undefined && (
                    <Text className={cn('text-xs text-slate-500')}>×{item.turnover}/ปี</Text>
                  )}
                </View>
                <Text className={cn('text-base flex-[1] text-right')} style={{ color: item.inventoryValue === 0 ? '#9ca3af' : '#f87171' }}>
                  ฿{formatCurrency(item.inventoryValue)}
                </Text>
                <View className={cn('flex-[0.9] items-center')}>
                  <View className={cn('flex-row items-center gap-[2px] rounded-lg px-1 py-[2px]')} style={{ backgroundColor: cfg.bg }}>
                    <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
                    <Text className={cn('text-xs font-bold')} style={{ color: cfg.color }}>{cfg.label}</Text>
                  </View>
                  <Text className={cn('text-[9px] text-gray-400 mt-[2px]')}>ขั้นต่ำ {item.minStock}</Text>
                </View>
              </View>
            );
          })}
        </SectionCard>

        <View className={cn('h-5')} />
      </ScrollView>

      <AlertDialog
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertTitle}
        message={alertMessage}
      />
    </SafeAreaView>
  );
};
