import React, { useState, useMemo } from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { formatDateTime } from '@/shared/lib/format';
import { usePermission } from '@/shared/hooks/usePermission';
import { usePermissionStore, AuditEntry, Role } from '@/features/settings/application/stores/permissionStore';

const ROLE_COLORS: Record<Role, string> = {
  owner: '#f87171',
  manager: '#f87171',
  cashier: '#0f766e',
  stock_staff: '#a16207',
  report_viewer: '#ef4444',
  admin: '#4b5563',
};

const ROLE_LABELS: Record<Role, string> = {
  owner: 'เจ้าของ',
  manager: 'ผู้จัดการ',
  cashier: 'แคชเชียร์',
  stock_staff: 'พนักงานคลัง',
  report_viewer: 'ดูรายงาน',
  admin: 'Admin',
};

interface ActionStyle {
  bg: string;
  color: string;
  icon: string;
}

const ACTION_STYLES: Record<string, ActionStyle> = {
  LOGIN:                 { bg: '#fee2e2',  color: '#f87171', icon: 'log-in-outline' },
  SALE_CREATE:           { bg: '#d1fae5',  color: '#0f766e', icon: 'receipt-outline' },
  SALE_CANCEL:           { bg: '#ffe4e6',   color: '#ef4444',  icon: 'close-circle-outline' },
  PRICE_CHANGE:          { bg: '#fed7aa',  color: '#a16207', icon: 'pricetag-outline' },
  STOCK_ADJUST:          { bg: '#fed7aa',  color: '#a16207', icon: 'archive-outline' },
  USER_CHANGE:           { bg: '#fed7aa',  color: '#a16207', icon: 'person-outline' },
  USER_ADD:              { bg: '#d1fae5',  color: '#0f766e', icon: 'person-add-outline' },
  USER_EDIT:             { bg: '#fed7aa',  color: '#a16207', icon: 'create-outline' },
  USER_DISABLE:          { bg: '#ffe4e6',   color: '#ef4444',  icon: 'person-remove-outline' },
  PASSWORD_RESET:        { bg: '#fed7aa',  color: '#a16207', icon: 'key-outline' },
  PERMISSION_CHANGE:     { bg: '#fee2e2',   color: '#f87171', icon: 'shield-outline' },
  DISCOUNT_APPLY:        { bg: '#fee2e2',  color: '#f87171', icon: 'cut-outline' },
  BILL_REPRINT:          { bg: '#fee2e2', color: '#4b5563', icon: 'print-outline' },
  EXPORT_REPORT:         { bg: '#d1fae5',  color: '#0f766e', icon: 'download-outline' },
  PRODUCT_EDIT:          { bg: '#fed7aa',  color: '#a16207', icon: 'cube-outline' },
  SHOP_SETTINGS_CHANGE:  { bg: '#fee2e2',  color: '#f87171', icon: 'settings-outline' },
  SECURITY_SETTINGS_CHANGE: { bg: '#ffe4e6', color: '#ef4444', icon: 'shield-half-outline' },
};

const DEFAULT_ACTION_STYLE: ActionStyle = {
  bg: '#fee2e2', color: '#4b5563', icon: 'information-circle-outline',
};

const ACTION_FILTER_OPTIONS = [
  'ทั้งหมด', 'LOGIN', 'SALE_CREATE', 'SALE_CANCEL', 'PRICE_CHANGE',
  'STOCK_ADJUST', 'USER_CHANGE', 'PERMISSION_CHANGE', 'EXPORT_REPORT',
];

interface AuditLogScreenProps {
  onBack: () => void;
}

export const AuditLogScreen: React.FC<AuditLogScreenProps> = ({ onBack }) => {
  const { isOwner, isAdmin } = usePermission();
  const { auditLog } = usePermissionStore();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ทั้งหมด');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [alertDialog, setAlertDialog] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const filtered = useMemo(() => {
    return auditLog.filter((e) => {
      const q = search.toLowerCase();
      const matchSearch =
        q === '' ||
        e.userName.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        (e.documentNo?.toLowerCase().includes(q) ?? false) ||
        e.description.toLowerCase().includes(q);
      const matchAction = actionFilter === 'ทั้งหมด' || e.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [auditLog, search, actionFilter]);

  const handleExport = () => {
    setAlertDialog({ visible: true, title: 'Export', message: `ส่งออก ${filtered.length} รายการ (CSV)` });
  };

  const getActionStyle = (action: string): ActionStyle =>
    ACTION_STYLES[action] ?? DEFAULT_ACTION_STYLE;

  const renderEntry = ({ item }: { item: AuditEntry }) => {
    const style = getActionStyle(item.action);
    const expanded = expandedId === item.id;

    return (
      <TouchableOpacity
        className={cn('bg-white rounded-2xl p-3 shadow-sm border border-slate-100')}
        onPress={() => setExpandedId(expanded ? null : item.id)}
        activeOpacity={0.85}
      >
        <View className={cn('flex-row items-start gap-2')}>
          <View className={cn('w-8 h-8 rounded-xl items-center justify-center')} style={{ backgroundColor: style.bg }}>
            <Ionicons name={style.icon as any} size={16} color={style.color} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <View className={cn('flex-row items-center gap-1 flex-wrap')}>
              <View className={cn('rounded-lg px-2 py-1')} style={{ backgroundColor: style.bg }}>
                <Text style={{ color: style.color, letterSpacing: 0.3 }} className={cn('text-xs font-bold')}>{item.action}</Text>
              </View>
              {item.documentNo && (
                <Text className={cn('text-[13px] font-medium text-rose-500')}>{item.documentNo}</Text>
              )}
            </View>
            <Text className={cn('text-[15px] font-medium text-slate-950 leading-[22px]')}>{item.description}</Text>
            <View className={cn('flex-row items-center gap-1 flex-wrap')}>
              <View className={cn('rounded-lg px-2 py-1')} style={{ backgroundColor: ROLE_COLORS[item.userRole] + '18' }}>
                <Text style={[{ color: ROLE_COLORS[item.userRole] }]} className={cn('text-xs font-bold')}>
                  {ROLE_LABELS[item.userRole]}
                </Text>
              </View>
              <Text className={cn('text-[13px] font-medium text-slate-600')}>{item.userName}</Text>
              <Text className={cn('text-[12px] font-medium text-slate-400')}>{formatDateTime(new Date(item.timestamp))}</Text>
            </View>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#9ca3af"
          />
        </View>

        {expanded && (
          <View className={cn('mt-2 pt-2 border-t border-slate-200 gap-1')}>
            {item.beforeValue && (
              <View className={cn('flex-row gap-1')}>
                <Text className={cn('text-[13px] font-medium text-slate-600 w-[50px]')}>ก่อน:</Text>
                <Text className={cn('text-[13px] font-medium text-rose-600 flex-1')}>{item.beforeValue}</Text>
              </View>
            )}
            {item.afterValue && (
              <View className={cn('flex-row gap-1')}>
                <Text className={cn('text-[13px] font-medium text-slate-600 w-[50px]')}>หลัง:</Text>
                <Text className={cn('text-[13px] font-medium text-emerald-700 flex-1')}>{item.afterValue}</Text>
              </View>
            )}
            {item.ipAddress && (
              <View className={cn('flex-row gap-1')}>
                <Text className={cn('text-[13px] font-medium text-slate-600 w-[50px]')}>IP:</Text>
                <Text className={cn('text-[13px] font-medium text-slate-950 flex-1')}>{item.ipAddress}</Text>
              </View>
            )}
            {item.deviceId && (
              <View className={cn('flex-row gap-1')}>
                <Text className={cn('text-[13px] font-medium text-slate-600 w-[50px]')}>Device:</Text>
                <Text className={cn('text-[13px] font-medium text-slate-950 flex-1')}>{item.deviceId}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>Audit Log</Text>
          <Text className={cn('text-xs font-medium text-rose-100')}>{filtered.length}/{auditLog.length} รายการ</Text>
        </View>
        {(isOwner || isAdmin) && (
        <TouchableOpacity className={cn('min-h-10 flex-row items-center gap-1.5 rounded-xl border border-rose-400 bg-rose-500/20 px-3 py-2')} onPress={handleExport}>
          <Ionicons name="download-outline" size={18} color="#fafafa" />
          <Text className={cn('text-[13px] font-bold text-white')}>Export</Text>
        </TouchableOpacity>
        )}
      </View>

      <View className={cn('flex-row items-center bg-white mx-3 mb-0 rounded-xl px-3 gap-2 border border-slate-200 shadow-sm')}>
        <Ionicons name="search-outline" size={18} color="#57534e" />
        <TextInput
          className={cn('flex-1 py-3 text-[15px] font-medium text-slate-950')}
          value={search}
          onChangeText={setSearch}
          placeholder="ค้นหา user, action, เลขที่เอกสาร..."
          placeholderTextColor="#9ca3af"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className={cn('mt-2')}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 2 }}
      >
        {ACTION_FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            className={cn('px-3 py-2 rounded-full border', actionFilter === opt ? 'bg-rose-600 border-rose-600' : 'bg-white border-slate-200')}
            onPress={() => setActionFilter(opt)}
          >
            <Text className={cn('text-[13px] font-bold', actionFilter === opt ? 'text-white' : 'text-slate-600')}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className={cn('flex-row items-center justify-between px-3 py-2')}>
        <Text className={cn('text-[13px] font-medium text-slate-600')}>{filtered.length} รายการ</Text>
        {actionFilter !== 'ทั้งหมด' && (
          <TouchableOpacity className={cn('flex-row items-center gap-1')} onPress={() => setActionFilter('ทั้งหมด')}>
            <Text className={cn('text-[13px] font-medium text-rose-500')}>ล้างตัวกรอง</Text>
            <Ionicons name="close" size={14} color="#f87171" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderEntry}
        contentContainerStyle={{ padding: 12, gap: 4 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center pt-6 gap-2')}>
            <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
            <Text className={cn('text-[15px] font-medium text-slate-600')}>ไม่พบรายการ Audit Log</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 20 }} />}
      />

      <AlertDialog
        visible={alertDialog.visible}
        title={alertDialog.title}
        message={alertDialog.message}
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        onConfirm={() => setAlertDialog({ visible: false, title: '', message: '' })}
      />
    </SafeAreaView>
  );
};
