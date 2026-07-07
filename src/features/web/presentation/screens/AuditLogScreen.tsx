/**
 * AuditLogScreen — Web Back-Office
 * Full-size layout matching other pages. Real data from stores,
 * search, module/action filters, KPIs, table with expandable rows, CSV export.
 */
import { useAuditLogStore } from '@/features/audit/application/stores/auditLogStore';
import {
  AuditEntry as PermAuditEntry,
  usePermissionStore,
} from '@/features/settings/application/stores/permissionStore';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import React, { useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UnifiedLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: string;
  description: string;
  status: 'success' | 'failed' | 'pending';
  beforeValue?: string;
  afterValue?: string;
  documentNo?: string;
  ipAddress?: string;
  deviceId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MODULE_OPTIONS = ['ทั้งหมด', 'POS', 'CRM', 'สินค้า', 'โปรโมชั่น', 'ตั้งค่า', 'Wallet', 'กำหนดราคา', 'คลังสินค้า', 'รายงาน'];
const ACTION_OPTIONS = ['ทั้งหมด', 'LOGIN', 'SALE_CREATE', 'SALE_CANCEL', 'PRICE_CHANGE', 'STOCK_ADJUST', 'USER_CHANGE', 'PERMISSION_CHANGE', 'EXPORT_REPORT'];

const ROLE_LABELS: Record<string, string> = {
  owner: 'เจ้าของ', manager: 'ผู้จัดการ', cashier: 'แคชเชียร์',
  stock_staff: 'พนักงานคลัง', report_viewer: 'ดูรายงาน', admin: 'Admin',
};
const ROLE_COLORS: Record<string, string> = {
  owner: '#7c3aed', manager: '#1d4ed8', cashier: '#059669',
  stock_staff: '#d97706', report_viewer: '#64748b', admin: '#dc2626',
};

const ACTION_COLORS: Record<string, { color: string; bg: string }> = {
  LOGIN:             { color: '#1d4ed8', bg: '#dbeafe' },
  SALE_CREATE:       { color: '#059669', bg: '#d1fae5' },
  SALE_CANCEL:       { color: '#dc2626', bg: '#fee2e2' },
  PRICE_CHANGE:      { color: '#d97706', bg: '#fef3c7' },
  STOCK_ADJUST:      { color: '#d97706', bg: '#fef3c7' },
  USER_CHANGE:       { color: '#7c3aed', bg: '#f3e8ff' },
  USER_ADD:          { color: '#059669', bg: '#d1fae5' },
  PERMISSION_CHANGE: { color: '#dc2626', bg: '#fee2e2' },
  DISCOUNT_APPLY:    { color: '#e11d48', bg: '#fff1f2' },
  EXPORT_REPORT:     { color: '#0891b2', bg: '#cffafe' },
};
const DEFAULT_ACTION_COLOR = { color: '#475569', bg: '#f1f5f9' };

const formatDT = (iso: string): { date: string; time: string } => {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' }),
      time: d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch { return { date: iso, time: '' }; }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const AuditLogScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { logs: rawLogs } = useAuditLogStore();
  const { auditLog: permLogs } = usePermissionStore();

  // Merge both stores
  const allLogs: UnifiedLog[] = useMemo(() => {
    const fromAudit: UnifiedLog[] = rawLogs.map((l) => ({
      id: l.id, timestamp: l.timestamp, user: l.actor, role: l.role,
      action: l.action, module: l.module, description: l.description, status: 'success' as const,
    }));
    const fromPerm: UnifiedLog[] = permLogs.map((l: PermAuditEntry) => ({
      id: l.id,
      timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : String(l.timestamp),
      user: l.userName, role: l.userRole, action: l.action, module: l.module,
      description: l.description, status: 'success' as const,
      beforeValue: l.beforeValue, afterValue: l.afterValue,
      documentNo: l.documentNo, ipAddress: l.ipAddress, deviceId: l.deviceId,
    }));
    const map = new Map<string, UnifiedLog>();
    [...fromAudit, ...fromPerm].forEach((l) => map.set(l.id, l));
    return Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [rawLogs, permLogs]);

  // Filters
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ทั้งหมด');
  const [actionFilter, setActionFilter] = useState('ทั้งหมด');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return allLogs.filter((log) => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || log.user.toLowerCase().includes(q) || log.action.toLowerCase().includes(q)
        || log.description.toLowerCase().includes(q) || (log.documentNo?.toLowerCase().includes(q) ?? false);
      const matchModule = moduleFilter === 'ทั้งหมด' || log.module === moduleFilter;
      const matchAction = actionFilter === 'ทั้งหมด' || log.action === actionFilter;
      return matchSearch && matchModule && matchAction;
    });
  }, [allLogs, search, moduleFilter, actionFilter]);

  const totalCount = filtered.length;
  const todayCount = filtered.filter((l) => new Date(l.timestamp).toDateString() === new Date().toDateString()).length;
  const successCount = filtered.filter((l) => l.status === 'success').length;
  const failedCount = filtered.filter((l) => l.status === 'failed').length;

  const handleExport = () => {
    if (typeof window === 'undefined') return;
    const header = 'วันที่,ผู้ใช้,Role,Action,Module,รายละเอียด,สถานะ\n';
    const rows = filtered.map((l) => {
      const { date, time } = formatDT(l.timestamp);
      return `${date} ${time},${l.user},${l.role},${l.action},${l.module},"${l.description}",${l.status}`;
    }).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <View className={cn('flex-1 bg-[#f8fafc]')}>
      <ScrollView contentContainerStyle={{ padding: isMobile ? 16 : 28, gap: 24 }} showsVerticalScrollIndicator={false}>
        {/* ─── Header ─── */}
        <View className={cn('flex-row items-center justify-between')}>
          <View>
            <Text className={cn('text-xl font-bold text-slate-900')}>Audit Log</Text>
            <Text className={cn('text-sm text-slate-500 mt-0.5')}>บันทึกกิจกรรมการใช้งานระบบทั้งหมด</Text>
          </View>
          <TouchableOpacity
            className={cn('flex-row items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm')}
            onPress={handleExport}
          >
            <Ionicons name="download-outline" size={18} color="#475569" />
            <Text className={cn('text-sm font-semibold text-slate-700')}>ดาวน์โหลด CSV</Text>
          </TouchableOpacity>
        </View>

        {/* ─── KPI Cards ─── */}
        <View className={cn('flex-row gap-4')} style={isMobile ? { flexWrap: 'wrap' } : undefined}>
          <KpiCard label="กิจกรรมทั้งหมด" value={totalCount} color="#1e293b" icon="pulse-outline" />
          <KpiCard label="วันนี้" value={todayCount} color="#1d4ed8" icon="today-outline" />
          <KpiCard label="สำเร็จ" value={successCount} color="#059669" icon="checkmark-circle-outline" />
          <KpiCard label="ล้มเหลว" value={failedCount} color="#dc2626" icon="close-circle-outline" />
        </View>

        {/* ─── Module Filter ─── */}
        <View className={cn('flex-row gap-2 flex-wrap')}>
          {MODULE_OPTIONS.map((mod) => {
            const active = moduleFilter === mod;
            return (
              <TouchableOpacity
                key={mod}
                className={cn('px-4 py-2 rounded-xl border', active ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-200')}
                onPress={() => setModuleFilter(mod)}
              >
                <Text className={cn('text-sm font-semibold', active ? 'text-white' : 'text-slate-600')}>{mod}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Search + Action Filter ─── */}
        <View className={cn('flex-row items-center gap-4')} style={isMobile ? { flexDirection: 'column', alignItems: 'stretch' } as any : undefined}>
          <View className={cn('flex-1 flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-12 shadow-sm')}>
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              className={cn('flex-1 ml-3 text-sm text-slate-800')}
              placeholder="ค้นหา ผู้ใช้, action, รายละเอียด, เลขเอกสาร..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />
            {search !== '' && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={isMobile ? {} : { maxWidth: 500 }}>
            <View className={cn('flex-row gap-2')}>
              {ACTION_OPTIONS.map((act) => {
                const active = actionFilter === act;
                return (
                  <TouchableOpacity
                    key={act}
                    className={cn('px-3 py-2 rounded-xl border', active ? 'bg-rose-600 border-rose-600' : 'bg-white border-slate-200')}
                    onPress={() => setActionFilter(act)}
                  >
                    <Text className={cn('text-xs font-semibold', active ? 'text-white' : 'text-slate-600')}>{act === 'ทั้งหมด' ? 'All' : act}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* ─── Results count ─── */}
        <View className={cn('flex-row items-center justify-between')}>
          <Text className={cn('text-sm font-medium text-slate-500')}>{filtered.length} รายการ</Text>
          {(moduleFilter !== 'ทั้งหมด' || actionFilter !== 'ทั้งหมด') && (
            <TouchableOpacity className={cn('flex-row items-center gap-1.5')} onPress={() => { setModuleFilter('ทั้งหมด'); setActionFilter('ทั้งหมด'); }}>
              <Text className={cn('text-sm font-medium text-rose-600')}>ล้างตัวกรอง</Text>
              <Ionicons name="close" size={14} color="#e11d48" />
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Table ─── */}
        <View className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 1020 }}>
              {/* Header */}
              <View className={cn('flex-row items-center bg-slate-50 border-b border-slate-100 px-5 h-12')}>
                <Text className={cn('text-xs font-semibold text-slate-500')} style={{ width: 140 }}>วันที่/เวลา</Text>
                <Text className={cn('text-xs font-semibold text-slate-500')} style={{ width: 150 }}>ผู้ใช้งาน</Text>
                <Text className={cn('text-xs font-semibold text-slate-500')} style={{ width: 140 }}>Action</Text>
                <Text className={cn('text-xs font-semibold text-slate-500')} style={{ width: 100 }}>Module</Text>
                <Text className={cn('text-xs font-semibold text-slate-500')} style={{ flex: 1 }}>รายละเอียด</Text>
                <Text className={cn('text-xs font-semibold text-slate-500 text-center')} style={{ width: 80 }}>สถานะ</Text>
                <View style={{ width: 36 }} />
              </View>

              {/* Rows */}
              {filtered.slice(0, 100).map((log, i) => {
                const { date, time } = formatDT(log.timestamp);
                const actionStyle = ACTION_COLORS[log.action] || DEFAULT_ACTION_COLOR;
                const roleColor = ROLE_COLORS[log.role] || '#64748b';
                const roleLabel = ROLE_LABELS[log.role] || log.role;
                const expanded = expandedId === log.id;

                return (
                  <View key={log.id}>
                    <TouchableOpacity
                      className={cn('flex-row items-center px-5 min-h-[52px] border-b border-slate-50', i % 2 === 1 && 'bg-slate-50/40')}
                      onPress={() => setExpandedId(expanded ? null : log.id)}
                      activeOpacity={0.7}
                    >
                      {/* Date */}
                      <View style={{ width: 140 }}>
                        <Text className={cn('text-sm font-medium text-slate-800')}>{date}</Text>
                        <Text className={cn('text-xs text-slate-400')}>{time}</Text>
                      </View>
                      {/* User */}
                      <View style={{ width: 150 }}>
                        <Text className={cn('text-sm font-medium text-slate-800')} numberOfLines={1}>{log.user}</Text>
                        <View className={cn('flex-row items-center gap-1 mt-0.5')}>
                          <View className={cn('w-2 h-2 rounded-full')} style={{ backgroundColor: roleColor }} />
                          <Text className={cn('text-xs')} style={{ color: roleColor }}>{roleLabel}</Text>
                        </View>
                      </View>
                      {/* Action */}
                      <View style={{ width: 140 }}>
                        <View className={cn('self-start px-2.5 py-1 rounded-lg')} style={{ backgroundColor: actionStyle.bg }}>
                          <Text className={cn('text-xs font-bold')} style={{ color: actionStyle.color }}>{log.action}</Text>
                        </View>
                      </View>
                      {/* Module */}
                      <Text className={cn('text-sm text-slate-600')} style={{ width: 100 }} numberOfLines={1}>{log.module}</Text>
                      {/* Description */}
                      <Text className={cn('text-sm text-slate-700')} style={{ flex: 1 }} numberOfLines={2}>{log.description}</Text>
                      {/* Status */}
                      <View style={{ width: 80, alignItems: 'center' }}>
                        <StatusBadge status={log.status} />
                      </View>
                      {/* Expand */}
                      <View style={{ width: 36, alignItems: 'center' }}>
                        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Detail */}
                    {expanded && (
                      <View className={cn('px-5 py-4 bg-slate-50 border-b border-slate-100')} style={{ gap: 8 }}>
                        {log.documentNo && <DetailRow label="เลขที่เอกสาร" value={log.documentNo} />}
                        {log.beforeValue && <DetailRow label="ก่อนเปลี่ยน" value={log.beforeValue} valueColor="#dc2626" />}
                        {log.afterValue && <DetailRow label="หลังเปลี่ยน" value={log.afterValue} valueColor="#059669" />}
                        {log.ipAddress && <DetailRow label="IP Address" value={log.ipAddress} />}
                        {log.deviceId && <DetailRow label="Device" value={log.deviceId} />}
                        {!log.documentNo && !log.beforeValue && !log.afterValue && !log.ipAddress && !log.deviceId && (
                          <Text className={cn('text-xs text-slate-400 italic')}>ไม่มีรายละเอียดเพิ่มเติม</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}

              {filtered.length === 0 && (
                <View className={cn('py-20 items-center')}>
                  <Ionicons name="document-text-outline" size={52} color="#cbd5e1" />
                  <Text className={cn('text-base text-slate-400 mt-4')}>ไม่พบรายการ Audit Log</Text>
                  <Text className={cn('text-sm text-slate-400 mt-1')}>ลองเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {filtered.length > 100 && (
          <Text className={cn('text-xs text-slate-400 text-center')}>แสดง 100 รายการแรก จากทั้งหมด {filtered.length} รายการ</Text>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const KpiCard: React.FC<{ label: string; value: number; color: string; icon: string }> = ({ label, value, color, icon }) => (
  <View className={cn('flex-1 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm min-w-[160px]')}>
    <View className={cn('flex-row items-center gap-2 mb-2')}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text className={cn('text-xs font-semibold text-slate-500')}>{label}</Text>
    </View>
    <Text className={cn('text-2xl font-extrabold')} style={{ color }}>{value.toLocaleString()}</Text>
  </View>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = status === 'success'
    ? { label: 'สำเร็จ', color: '#059669', bg: '#d1fae5' }
    : status === 'failed'
      ? { label: 'ล้มเหลว', color: '#dc2626', bg: '#fee2e2' }
      : { label: 'รอ', color: '#d97706', bg: '#fef3c7' };
  return (
    <View className={cn('px-2.5 py-1 rounded-lg')} style={{ backgroundColor: cfg.bg }}>
      <Text className={cn('text-xs font-bold')} style={{ color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
};

const DetailRow: React.FC<{ label: string; value: string; valueColor?: string }> = ({ label, value, valueColor }) => (
  <View className={cn('flex-row items-start gap-3')}>
    <Text className={cn('text-xs font-semibold text-slate-500')} style={{ width: 100 }}>{label}:</Text>
    <Text className={cn('text-sm font-medium flex-1')} style={{ color: valueColor || '#1e293b' }}>{value}</Text>
  </View>
);
