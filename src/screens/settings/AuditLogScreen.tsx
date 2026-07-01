/**
 * SCR-SET-009 AuditLogScreen
 * Audit Log — ประวัติการใช้งาน
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatDateTime } from '../../utils/format';
import { usePermission } from '../../hooks/usePermission';
import { usePermissionStore, AuditEntry, Role } from '../../store/permissionStore';

const ROLE_COLORS: Record<Role, string> = {
  owner: Colors.category1,
  manager: Colors.primary,
  cashier: Colors.success,
  stock_staff: Colors.warning,
  report_viewer: Colors.danger,
  admin: Colors.gray600,
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
  LOGIN:                 { bg: Colors.primaryLight,  color: Colors.primary, icon: 'log-in-outline' },
  SALE_CREATE:           { bg: Colors.successLight,  color: Colors.success, icon: 'receipt-outline' },
  SALE_CANCEL:           { bg: Colors.dangerLight,   color: Colors.danger,  icon: 'close-circle-outline' },
  PRICE_CHANGE:          { bg: Colors.warningLight,  color: Colors.warning, icon: 'pricetag-outline' },
  STOCK_ADJUST:          { bg: Colors.warningLight,  color: Colors.warning, icon: 'archive-outline' },
  USER_CHANGE:           { bg: Colors.warningLight,  color: Colors.warning, icon: 'person-outline' },
  USER_ADD:              { bg: Colors.successLight,  color: Colors.success, icon: 'person-add-outline' },
  USER_EDIT:             { bg: Colors.warningLight,  color: Colors.warning, icon: 'create-outline' },
  USER_DISABLE:          { bg: Colors.dangerLight,   color: Colors.danger,  icon: 'person-remove-outline' },
  PASSWORD_RESET:        { bg: Colors.warningLight,  color: Colors.warning, icon: 'key-outline' },
  PERMISSION_CHANGE:     { bg: Colors.primaryLight,   color: Colors.category1, icon: 'shield-outline' },
  DISCOUNT_APPLY:        { bg: Colors.primaryLight,  color: Colors.primary, icon: 'cut-outline' },
  BILL_REPRINT:          { bg: Colors.backgroundSecondary, color: Colors.gray600, icon: 'print-outline' },
  EXPORT_REPORT:         { bg: Colors.successLight,  color: Colors.success, icon: 'download-outline' },
  PRODUCT_EDIT:          { bg: Colors.warningLight,  color: Colors.warning, icon: 'cube-outline' },
  SHOP_SETTINGS_CHANGE:  { bg: Colors.primaryLight,  color: Colors.primary, icon: 'settings-outline' },
  SECURITY_SETTINGS_CHANGE: { bg: Colors.dangerLight, color: Colors.danger, icon: 'shield-half-outline' },
};

const DEFAULT_ACTION_STYLE: ActionStyle = {
  bg: Colors.backgroundSecondary, color: Colors.gray600, icon: 'information-circle-outline',
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
    Alert.alert('Export', `ส่งออก ${filtered.length} รายการ (CSV)`);
  };

  const getActionStyle = (action: string): ActionStyle =>
    ACTION_STYLES[action] ?? DEFAULT_ACTION_STYLE;

  const renderEntry = ({ item }: { item: AuditEntry }) => {
    const style = getActionStyle(item.action);
    const expanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => setExpandedId(expanded ? null : item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.entryMain}>
          <View style={[styles.actionIcon, { backgroundColor: style.bg }]}>
            <Ionicons name={style.icon as any} size={16} color={style.color} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <View style={styles.entryTopRow}>
              <View style={[styles.actionBadge, { backgroundColor: style.bg }]}>
                <Text style={[styles.actionBadgeText, { color: style.color }]}>{item.action}</Text>
              </View>
              {item.documentNo && (
                <Text style={styles.docNo}>{item.documentNo}</Text>
              )}
            </View>
            <Text style={styles.entryDesc}>{item.description}</Text>
            <View style={styles.entryMeta}>
              <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.userRole] + '20' }]}>
                <Text style={[styles.roleText, { color: ROLE_COLORS[item.userRole] }]}>
                  {ROLE_LABELS[item.userRole]}
                </Text>
              </View>
              <Text style={styles.entryUser}>{item.userName}</Text>
              <Text style={styles.entryTime}>{formatDateTime(new Date(item.timestamp))}</Text>
            </View>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.gray400}
          />
        </View>

        {expanded && (
          <View style={styles.entryDetail}>
            {item.beforeValue && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ก่อน:</Text>
                <Text style={[styles.detailValue, { color: Colors.danger }]}>{item.beforeValue}</Text>
              </View>
            )}
            {item.afterValue && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>หลัง:</Text>
                <Text style={[styles.detailValue, { color: Colors.success }]}>{item.afterValue}</Text>
              </View>
            )}
            {item.ipAddress && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>IP:</Text>
                <Text style={styles.detailValue}>{item.ipAddress}</Text>
              </View>
            )}
            {item.deviceId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Device:</Text>
                <Text style={styles.detailValue}>{item.deviceId}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Audit Log</Text>
          <Text style={styles.headerSub}>{filtered.length}/{auditLog.length} รายการ</Text>
        </View>
        {(isOwner || isAdmin) && (
          <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
            <Ionicons name="download-outline" size={18} color={Colors.white} />
            <Text style={styles.exportBtnText}>Export</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="ค้นหา user, action, เลขที่เอกสาร..."
          placeholderTextColor={Colors.gray400}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Action Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {ACTION_FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, actionFilter === opt && styles.chipActive]}
            onPress={() => setActionFilter(opt)}
          >
            <Text style={[styles.chipText, actionFilter === opt && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>{filtered.length} รายการ</Text>
        {actionFilter !== 'ทั้งหมด' && (
          <TouchableOpacity onPress={() => setActionFilter('ทั้งหมด')} style={styles.clearFilter}>
            <Text style={styles.clearFilterText}>ล้างตัวกรอง</Text>
            <Ionicons name="close" size={12} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>ไม่พบรายการ Audit Log</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: Spacing.xl }} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  exportBtnText: { ...Typography.caption, color: Colors.white },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginBottom: 0,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, ...Typography.body2, color: Colors.text },
  chipsScroll: { marginTop: Spacing.sm },
  chipsContent: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.caption, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  summaryText: { ...Typography.caption, color: Colors.textSecondary },
  clearFilter: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clearFilterText: { ...Typography.caption, color: Colors.primary },
  list: { padding: Spacing.md, gap: Spacing.xs },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  entryMain: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  actionBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  actionBadgeText: { fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 0.3 },
  docNo: { ...Typography.caption, color: Colors.primary, fontSize: FontSize.caption },
  entryDesc: { ...Typography.body2, color: Colors.text, fontSize: FontSize.body },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  roleBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  roleText: { fontSize: FontSize.xs, fontWeight: '700' },
  entryUser: { ...Typography.caption, color: Colors.textSecondary },
  entryTime: { ...Typography.caption, color: Colors.gray400 },
  entryDetail: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 5,
  },
  detailRow: { flexDirection: 'row', gap: Spacing.xs },
  detailLabel: { ...Typography.caption, color: Colors.textSecondary, width: 50 },
  detailValue: { ...Typography.caption, color: Colors.text, flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
});
