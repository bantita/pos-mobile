import { SaleRecord, useSaleHistoryStore } from '@/features/sale/application/stores/saleHistoryStore';
import { LookupCheckbox } from '@/shared/components/ui/LookupCheckbox';
import { useUserBranches } from '@/shared/hooks/useUserBranches';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';

const fmt = (n: number) => n.toLocaleString();
const fmtDate = (d: Date) => new Date(d).toLocaleDateString('th-TH');
const fmtTime = (d: Date) => new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    completed: { color: '#059669', bg: '#ecfdf5', label: 'สำเร็จ' },
    voided:    { color: '#dc2626', bg: '#fef2f2', label: 'ยกเลิก' },
    returned:  { color: '#d97706', bg: '#fffbeb', label: 'คืนสินค้า' },
  };
  const s = map[status] || map.completed;
  return (
    <View className={cn('px-2.5 py-1 rounded-lg')} style={{ backgroundColor: s.bg }}>
      <Text className={cn('text-xs font-bold')} style={{ color: s.color }}>{s.label}</Text>
    </View>
  );
};

export const SaleHistoryScreen: React.FC = () => {
  const { sales, searchSales } = useSaleHistoryStore();
  const { accessibleBranches, canSeeAll } = useUserBranches();
  const { width: viewportWidth } = useWindowDimensions();
  const isMobile = viewportWidth < 640;
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024;
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [tab, setTab] = useState<'all' | 'completed' | 'returned'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [branchFilter, setBranchFilter] = useState<string[]>([]);

  const filtered = (() => {
    let base = search.trim() ? searchSales(search) : sales;
    if (!canSeeAll) {
      const names = accessibleBranches.map(b => b.name);
      base = base.filter(s => names.includes(s.branchName || 'สาขาหลัก'));
    }
    if (branchFilter.length > 0) {
      const names = branchFilter.map(id => accessibleBranches.find(b => b.id === id)?.name).filter(Boolean);
      base = base.filter(s => names.includes(s.branchName || 'สาขาหลัก'));
    }
    if (tab === 'completed') base = base.filter(s => s.status === 'completed');
    if (tab === 'returned') base = base.filter(s => s.status === 'voided' || s.status === 'returned');
    if (dateFrom) base = base.filter(s => new Date(s.createdAt) >= new Date(dateFrom));
    if (dateTo) base = base.filter(s => new Date(s.createdAt) <= new Date(dateTo + 'T23:59:59'));
    return base.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  })();

  // ── Detail View ──
  if (selectedSale) {
    const s = selectedSale;
    return (
      <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerClassName={cn('p-5 gap-4')}>
        <TouchableOpacity className={cn('flex-row items-center gap-1 mb-1')} onPress={() => setSelectedSale(null)}>
          <Ionicons name="arrow-back" size={18} color="#64748b" />
          <Text className={cn('text-xs font-bold text-slate-600')}>{'กลับ'}</Text>
        </TouchableOpacity>
        <View className={cn('bg-white rounded-2xl p-5 shadow-sm border border-slate-200 gap-3')}>
          <View className={cn('flex-row justify-between items-center')}>
            <Text className={cn('text-base font-extrabold text-slate-800')}>{s.saleNo}</Text>
            <StatusBadge status={s.status} />
          </View>
          <Text className={cn('text-xs text-slate-500 font-medium')}>{fmtDate(s.createdAt)}{' '}{fmtTime(s.createdAt)}</Text>
          <Text className={cn('text-xs font-medium text-slate-700')}>{'พนักงาน: '}<Text className={cn('font-bold')}>{s.cashierName}</Text></Text>
          <Text className={cn('text-xs font-medium text-slate-700')}>{'สาขา: '}<Text className={cn('font-bold')}>{s.branchName || 'สาขาหลัก'}</Text></Text>
          {s.memberName && <Text className={cn('text-xs font-medium text-slate-700')}>{'สมาชิก: '}<Text className={cn('font-bold')}>{s.memberName}</Text></Text>}
        </View>
        <View className={cn('bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden')}>
          <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-4 border-b border-slate-200')}>
            {['รายการ', 'จำนวน', 'ราคา', 'ส่วนลด', 'รวม'].map((h, i) => (
              <Text key={i} className={cn('flex-1 text-xs font-bold text-slate-500 uppercase')} style={i === 0 ? { flex: 2 } : {}}>
                {h}
              </Text>
            ))}
          </View>
          {s.items.map((item, i) => (
            <View key={i} className={cn('flex-row items-center py-2.5 px-4 border-b border-slate-100', i % 2 === 1 && 'bg-[#f6f7fb]/50')}>
              <Text className={cn('flex-[2] text-xs font-medium text-slate-700')} numberOfLines={1}>{item.product.name}</Text>
              <Text className={cn('flex-1 text-xs text-slate-600')}>{item.qty}</Text>
              <Text className={cn('flex-1 text-xs text-slate-700 font-medium')}>{'฿'}{fmt(item.unitPrice)}</Text>
              <Text className={cn('flex-1 text-xs text-rose-500 font-medium')}>{'-฿'}{fmt(item.discountAmount)}</Text>
              <Text className={cn('flex-1 text-xs font-bold text-slate-800')}>{'฿'}{fmt(item.subtotal)}</Text>
            </View>
          ))}
        </View>
        <View className={cn('bg-white rounded-2xl p-5 shadow-sm border border-slate-200 gap-2')}>
          <View className={cn('flex-row justify-between')}>
            <Text className={cn('text-xs text-slate-500 font-medium')}>{'รวม'}</Text>
            <Text className={cn('text-xs font-bold text-slate-700')}>{'฿'}{fmt(s.subtotal)}</Text>
          </View>
          <View className={cn('flex-row justify-between')}>
            <Text className={cn('text-xs text-rose-500 font-medium')}>{'ส่วนลด'}</Text>
            <Text className={cn('text-xs text-rose-500 font-bold')}>{'-฿'}{fmt(s.discountTotal)}</Text>
          </View>
          {s.vatAmount > 0 && (
            <View className={cn('flex-row justify-between')}>
              <Text className={cn('text-xs text-slate-500 font-medium')}>{'VAT'}</Text>
              <Text className={cn('text-xs font-bold text-slate-700')}>{'฿'}{fmt(s.vatAmount)}</Text>
            </View>
          )}
          <View className={cn('h-px bg-slate-200 my-1')} />
          <View className={cn('flex-row justify-between')}>
            <Text className={cn('text-sm font-bold text-slate-800')}>{'ยอดรวมสุทธิ'}</Text>
            <Text className={cn('text-sm font-bold text-rose-600')}>{'฿'}{fmt(s.grandTotal)}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── List View ──
  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerClassName={cn('p-5 gap-4')}>
      <Text className={cn('text-base font-extrabold text-slate-800')}>{'ประวัติการขาย'}</Text>
      <Text className={cn('text-xs text-slate-500 font-medium -mt-3')}>{'ค้นหาและตรวจสอบรายการขาย'}</Text>

      {/* Tabs */}
      <View className={cn('flex-row gap-1.5')}>
        {(['all', 'completed', 'returned'] as const).map(t => (
          <TouchableOpacity
            key={t}
            className={cn('px-4 py-2.5 rounded-lg', tab === t ? 'bg-rose-500' : 'bg-white border border-slate-200')}
            onPress={() => setTab(t)}
          >
            <Text className={cn('text-sm font-bold', tab === t ? 'text-white' : 'text-slate-600')}>
              {t === 'all' ? 'ทั้งหมด' : t === 'completed' ? 'สำเร็จ' : 'คืน/ยกเลิก'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search & Filters */}
      <View className={cn('bg-white rounded-2xl p-4 shadow-sm border border-slate-200 gap-3')}>
        <TextInput
          className={cn('border border-slate-200 rounded-xl px-3.5 h-10 text-xs font-medium text-slate-800 bg-[#f6f7fb]')}
          value={search}
          onChangeText={setSearch}
          placeholder="ค้นหาเลขบิล, ชื่อสินค้า..."
          placeholderTextColor="#94a3b8"
        />
        <View className={cn('flex-row gap-2')}>
          <TextInput
            className={cn('flex-1 border border-slate-200 rounded-xl px-3.5 h-10 text-xs font-medium text-slate-800 bg-[#f6f7fb]')}
            value={dateFrom}
            onChangeText={setDateFrom}
            placeholder="วันที่เริ่ม"
            onFocus={(e: any) => { if (e.target) e.target.type = 'date'; }}
          />
          <TextInput
            className={cn('flex-1 border border-slate-200 rounded-xl px-3.5 h-10 text-xs font-medium text-slate-800 bg-[#f6f7fb]')}
            value={dateTo}
            onChangeText={setDateTo}
            placeholder="วันที่สิ้นสุด"
            onFocus={(e: any) => { if (e.target) e.target.type = 'date'; }}
          />
        </View>
        {!canSeeAll && accessibleBranches.length > 0 && (
          <LookupCheckbox
            title="สาขา"
            items={accessibleBranches.map(b => ({ id: b.id, label: b.name }))}
            selectedIds={branchFilter}
            onChange={setBranchFilter}
          />
        )}
      </View>

      {/* Table / Card List */}
      <View className={cn('bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden')}>
        {/* Desktop/Tablet: Table Header */}
        {!isMobile && (
          <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-4 border-b border-slate-200')}>
            {(isTablet
              ? ['เลขที่บิล', 'วันที่', 'พนักงาน', 'ยอดรวม', 'สถานะ']
              : ['เลขที่บิล', 'วันที่', 'เวลา', 'พนักงาน', 'สาขา', 'ยอดรวม', 'สถานะ']
            ).map((h, i) => (
              <Text
                key={i}
                className={cn('flex-1 text-xs font-bold text-slate-500 uppercase')}
                style={i === 0 ? { flex: 1.4 } : (h === 'ยอดรวม' ? { flex: 1.2 } : {})}
              >
                {h}
              </Text>
            ))}
          </View>
        )}
        {/* Rows */}
        {filtered.map((s, idx) => (
          isMobile ? (
            /* Mobile: Card layout */
            <TouchableOpacity
              key={s.id}
              className={cn('px-4 py-3 border-b border-slate-100', idx % 2 === 1 && 'bg-[#f6f7fb]/50')}
              onPress={() => setSelectedSale(s)}
            >
              <View className={cn('flex-row items-center justify-between mb-1')}>
                <Text className={cn('text-xs font-bold text-rose-600')} numberOfLines={1}>{s.saleNo}</Text>
                <StatusBadge status={s.status} />
              </View>
              <View className={cn('flex-row items-center justify-between')}>
                <Text className={cn('text-xs text-slate-500 font-medium')}>
                  {fmtDate(s.createdAt)} {fmtTime(s.createdAt)} · {s.cashierName}
                </Text>
                <Text className={cn('text-sm font-bold text-slate-800')}>{'฿'}{fmt(s.grandTotal)}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            /* Desktop/Tablet: Table row */
            <TouchableOpacity
              key={s.id}
              className={cn('flex-row items-center py-2.5 px-4 border-b border-slate-100', idx % 2 === 1 && 'bg-[#f6f7fb]/50')}
              onPress={() => setSelectedSale(s)}
            >
              <Text className={cn('flex-[1.4] text-xs font-bold text-rose-600')} numberOfLines={1}>{s.saleNo}</Text>
              <Text className={cn('flex-1 text-xs text-slate-700 font-medium')}>{fmtDate(s.createdAt)}</Text>
              {!isTablet && <Text className={cn('flex-1 text-xs text-slate-600')}>{fmtTime(s.createdAt)}</Text>}
              <Text className={cn('flex-1 text-xs text-slate-700')} numberOfLines={1}>{s.cashierName}</Text>
              {!isTablet && <Text className={cn('flex-1 text-xs text-slate-700')} numberOfLines={1}>{s.branchName || 'สาขาหลัก'}</Text>}
              <Text className={cn('flex-[1.2] text-xs font-bold text-slate-800')}>{'฿'}{fmt(s.grandTotal)}</Text>
              <View className={cn('flex-1')}><StatusBadge status={s.status} /></View>
            </TouchableOpacity>
          )
        ))}
        {filtered.length === 0 && (
          <Text className={cn('text-xs text-slate-400 text-center py-10 font-medium')}>{'ไม่พบรายการ'}</Text>
        )}
      </View>
    </ScrollView>
  );
};
