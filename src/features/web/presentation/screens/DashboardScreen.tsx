import { Ionicons } from '@/shared/icons/lucideAdapter';
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Text, View } from '@/shared/tw/index';
import { MOCK_SALES_BY_DAY, MOCK_SALES_SUMMARY, MOCK_STOCK_ITEMS, MOCK_TOP_PRODUCTS } from '@/features/reports/data/mocks/mockReports';
import { cn } from '@/shared/lib/cn';

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

const BarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.value));
  return (
    <View className={cn('flex-row items-end h-[180px] gap-3 pb-5')}>
      {data.map((d, i) => (
        <View key={i} className={cn('flex-1 items-center h-full')}>
          <View className={cn('flex-1 w-full justify-end')}>
            <View className={cn('w-full rounded-lg bg-rose-400')} style={{ height: `${(d.value / max) * 100}%` as any }} />
          </View>
          <Text className={cn('mt-2 text-xs font-medium text-slate-500')}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
};

export const DashboardScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isCompact = width < 960;
  const isPhone = width < 640;
  const s = MOCK_SALES_SUMMARY;
  const kpis = [
    { label: 'ยอดขายวันนี้', value: `฿${fmt(s.totalSales)}`, icon: 'wallet-outline', valueClass: 'text-rose-600', iconClass: 'bg-rose-50', iconColor: '#e11d48' },
    { label: 'จำนวนบิล', value: `${s.totalBills}`, icon: 'receipt-outline', valueClass: 'text-emerald-700', iconClass: 'bg-emerald-50', iconColor: '#059669' },
    { label: 'กำไรวันนี้', value: `฿${fmt(s.totalSales * 0.25)}`, icon: 'trending-up-outline', valueClass: 'text-amber-700', iconClass: 'bg-amber-50', iconColor: '#d97706' },
    { label: 'เฉลี่ยต่อบิล', value: `฿${fmt(s.avgPerBill)}`, icon: 'analytics-outline', valueClass: 'text-violet-700', iconClass: 'bg-violet-50', iconColor: '#7c3aed' },
  ];
  const lowStock = MOCK_STOCK_ITEMS.filter(i => i.status === 'low');
  const outStock = MOCK_STOCK_ITEMS.filter(i => i.status === 'out');

  return (
    <View className={cn('flex-1 gap-5')}>
      {/* Page header */}
      <View className={cn('overflow-hidden rounded-3xl bg-slate-950 p-6', isPhone && 'rounded-2xl p-5')}>
        <View
          className={cn('flex-row items-center justify-between gap-4', isPhone && 'items-start')}
          style={isPhone ? { flexDirection: 'column' } : undefined}
        >
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-rose-300">ภาพรวมร้านวันนี้</Text>
            <Text className={cn('text-2xl font-extrabold text-white', isPhone && 'text-xl')}>{'ยินดีต้อนรับกลับ'}</Text>
            <Text className="text-sm font-medium text-slate-300" numberOfLines={isPhone ? 2 : 1}>
              ติดตามยอดขาย สินค้าคงเหลือ และรายการที่ต้องจัดการในหน้าจอเดียว
            </Text>
          </View>
          <View className={cn('flex-row items-center gap-2 rounded-full bg-white/10 px-4 py-2', isPhone && 'px-3')}>
            <Ionicons name="calendar-outline" size={15} color="#fda4af" />
            <Text className="text-xs font-semibold text-white">{new Date().toLocaleDateString('th-TH')}</Text>
          </View>
        </View>
      </View>

      {/* KPI Cards */}
      <View className={cn('flex-row gap-4 flex-wrap')}>
        {kpis.map((k, i) => (
          <View key={i} className={cn('min-w-[200px] flex-1 flex-row items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm', isPhone && 'min-w-[145px] p-4')}>
            <View>
              <Text className={cn('mb-1 text-xs font-semibold text-slate-500')}>{k.label}</Text>
              <Text className={cn('text-xl font-extrabold', isPhone && 'text-lg', k.valueClass)}>{k.value}</Text>
            </View>
            <View className={cn('w-11 h-11 rounded-xl items-center justify-center', k.iconClass)}>
              <Ionicons name={k.icon as any} size={22} color={k.iconColor} />
            </View>
          </View>
        ))}
      </View>

      {/* Charts row */}
      <View className={cn('flex-row flex-wrap gap-4')} style={isCompact ? { flexDirection: 'column' } : undefined}>
        <View
          className={cn('min-w-[320px] flex-[1.4] rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm', isPhone && 'min-w-0 p-4')}
          style={isCompact ? { flexGrow: 0, flexBasis: 'auto', width: '100%' } : undefined}
        >
          <Text className={cn('mb-4 text-sm font-bold text-slate-900')}>{'ยอดขาย 5 วันล่าสุด'}</Text>
          <BarChart data={MOCK_SALES_BY_DAY.map(d => ({ label: d.label, value: d.sales }))} />
        </View>
        <View
          className={cn('min-w-[300px] flex-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm', isPhone && 'min-w-0 p-4')}
          style={isCompact ? { flexGrow: 0, flexBasis: 'auto', width: '100%' } : undefined}
        >
          <Text className={cn('mb-4 text-sm font-bold text-slate-900')}>{'สินค้าขายดี'}</Text>
          {MOCK_TOP_PRODUCTS.slice(0, 5).map((p, i) => (
            <View key={i} className={cn('flex-row items-center py-2.5 border-b border-slate-100 gap-3')}>
              <View className={cn('w-7 h-7 rounded-full items-center justify-center', i < 3 ? 'bg-rose-500' : 'bg-slate-100')}>
                <Text className={cn('text-xs font-bold', i < 3 ? 'text-white' : 'text-slate-500')}>{i + 1}</Text>
              </View>
              <Text className={cn('flex-1 text-sm font-medium text-slate-800')} numberOfLines={1}>{p.productName}</Text>
              <Text className={cn('text-sm font-bold text-slate-900')}>{'฿'}{p.revenue.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Low/Out stock */}
      <View className={cn('flex-row flex-wrap gap-4')} style={isCompact ? { flexDirection: 'column' } : undefined}>
        <View
          className={cn('flex-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm', isPhone && 'p-4')}
          style={isCompact ? { flexGrow: 0, flexBasis: 'auto', width: '100%' } : undefined}
        >
          <View className={cn('flex-row items-center gap-2 mb-3')}>
            <Ionicons name="warning-outline" size={16} color="#d97706" />
            <Text className={cn('text-sm font-bold text-slate-800')}>
              {'สินค้าใกล้หมด'}{lowStock.length > 0 ? ` (${lowStock.length})` : ''}
            </Text>
          </View>
          {lowStock.length === 0 ? (
            <Text className={cn('text-xs font-medium text-slate-400')}>{'ไม่มีสินค้าใกล้หมด'}</Text>
          ) : (
            lowStock.map((item, i) => (
              <View key={i} className={cn('flex-row items-center justify-between py-2 border-b border-slate-100')}>
                <Text className={cn('flex-1 text-sm font-medium text-slate-800')} numberOfLines={1}>{item.productName}</Text>
                <View className={cn('rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-0.5')}>
                  <Text className={cn('text-xs font-bold text-amber-700')}>{item.onHandQty}{' '}{item.unit}</Text>
                </View>
              </View>
            ))
          )}
        </View>
        <View
          className={cn('flex-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm', isPhone && 'p-4')}
          style={isCompact ? { flexGrow: 0, flexBasis: 'auto', width: '100%' } : undefined}
        >
          <View className={cn('flex-row items-center gap-2 mb-3')}>
            <Ionicons name="close-circle-outline" size={16} color="#dc2626" />
            <Text className={cn('text-sm font-bold text-slate-800')}>
              {'สินค้าหมด'}{outStock.length > 0 ? ` (${outStock.length})` : ''}
            </Text>
          </View>
          {outStock.length === 0 ? (
            <Text className={cn('text-xs font-medium text-slate-400')}>{'ไม่มีสินค้าหมดสต๊อก'}</Text>
          ) : (
            outStock.map((item, i) => (
              <View key={i} className={cn('flex-row items-center justify-between py-2 border-b border-slate-100')}>
                <Text className={cn('flex-1 text-sm font-medium text-slate-800')} numberOfLines={1}>{item.productName}</Text>
                <View className={cn('rounded-lg bg-red-50 border border-red-200 px-2.5 py-0.5')}>
                  <Text className={cn('text-xs font-bold text-red-600')}>{'หมด'}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
};
