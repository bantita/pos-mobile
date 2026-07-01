/**
 * Sync Navigator — M11 Offline First & Sync
 * Hub → LocalTransaction | SyncQueue | ConflictResolution
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LocalTransactionScreen } from '../screens/sync/LocalTransactionScreen';
import { SyncQueueScreen } from '../screens/sync/SyncQueueScreen';
import { ConflictResolutionScreen } from '../screens/sync/ConflictResolutionScreen';
import { useSyncStore } from '../store/syncStore';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/spacing';
import { formatDateTime } from '../utils/format';

export type SyncStackParamList = {
  SyncHub: undefined;
  LocalTransaction: undefined;
  SyncQueue: undefined;
  ConflictResolution: undefined;
};

const Stack = createStackNavigator<SyncStackParamList>();

// ─── Sync Hub ─────────────────────────────────────────────────────────────────
const SyncHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isOnline, isSyncing, lastSyncAt, getStats, startSync, devices } = useSyncStore();
  const stats = getStats();
  const actionNeeded = stats.failed + stats.conflict;

  return (
    <SafeAreaView style={hub.container} edges={['top']}>
      {/* Header */}
      <View style={hub.header}>
        <View style={{ flex: 1 }}>
          <Text style={hub.headerTitle}>Offline First & Sync</Text>
          <Text style={hub.headerSub}>M11 — จัดการข้อมูล Offline</Text>
        </View>
        <View style={[hub.onlineChip, { backgroundColor: isOnline ? Colors.successLight : Colors.dangerLight }]}>
          <View style={[hub.dot, { backgroundColor: isOnline ? Colors.success : Colors.danger }]} />
          <Text style={[hub.onlineText, { color: isOnline ? Colors.successDark : Colors.dangerDark }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={hub.scroll} showsVerticalScrollIndicator={false}>
        {/* Alert banner */}
        {actionNeeded > 0 && (
          <View style={hub.alertBanner}>
            <Ionicons name="warning" size={18} color={Colors.warning} />
            <Text style={hub.alertText}>
              ต้องดำเนินการ {actionNeeded} รายการ ({stats.failed} ล้มเหลว · {stats.conflict} ขัดแย้ง)
            </Text>
            <TouchableOpacity style={hub.alertBtn} onPress={() => navigation.navigate('SyncQueue')}>
              <Text style={hub.alertBtnText}>จัดการ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats overview */}
        <View style={hub.statsCard}>
          <Text style={hub.statsTitle}>สถานะ Sync</Text>
          <View style={hub.statsGrid}>
            {[
              { label: 'รอ Sync',     count: stats.pending,  color: Colors.warning,  icon: 'time-outline' },
              { label: 'ล้มเหลว',    count: stats.failed,   color: Colors.danger,   icon: 'close-circle-outline' },
              { label: 'ขัดแย้ง',    count: stats.conflict, color: Colors.primary,  icon: 'alert-circle-outline' },
              { label: 'สำเร็จ',      count: stats.success,  color: Colors.success,  icon: 'checkmark-circle-outline' },
            ].map((s, i) => (
              <View key={i} style={[hub.statItem, { borderTopColor: s.color }]}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
                <Text style={[hub.statCount, { color: s.color }]}>{s.count}</Text>
                <Text style={hub.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
          {lastSyncAt && (
            <Text style={hub.lastSync}>ซิงค์ล่าสุด: {formatDateTime(lastSyncAt)}</Text>
          )}
        </View>

        {/* Menus */}
        <View style={hub.menuCard}>
          {[
            {
              icon: 'document-text-outline', label: 'Local Transactions',
              sub: `ธุรกรรม Offline ทั้งหมด (${stats.total} รายการ)`,
              color: Colors.accentDark, bg: Colors.accentLight,
              route: 'LocalTransaction', badge: stats.pending,
            },
            {
              icon: 'cloud-upload-outline', label: 'Sync Queue',
              sub: 'จัดการคิวซิงค์ข้อมูล',
              color: Colors.primary, bg: Colors.primaryLight,
              route: 'SyncQueue', badge: stats.failed,
            },
            {
              icon: 'git-merge-outline', label: 'Conflict Resolution',
              sub: `แก้ข้อมูลขัดแย้ง (${stats.conflict} รายการ)`,
              color: Colors.info, bg: Colors.infoLight,
              route: 'ConflictResolution', badge: stats.conflict,
            },
          ].map((m, i, arr) => (
            <TouchableOpacity
              key={m.route}
              style={[hub.menuItem, i < arr.length - 1 && hub.menuItemBorder]}
              onPress={() => navigation.navigate(m.route as keyof SyncStackParamList)}
              activeOpacity={0.8}
            >
              <View style={[hub.menuIcon, { backgroundColor: m.bg }]}>
                <Ionicons name={m.icon as any} size={22} color={m.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={hub.menuLabel}>{m.label}</Text>
                <Text style={hub.menuSub}>{m.sub}</Text>
              </View>
              {m.badge > 0 && (
                <View style={[hub.badge, { backgroundColor: m.badge > 0 && m.route === 'SyncQueue' ? Colors.danger : m.color }]}>
                  <Text style={hub.badgeText}>{m.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={Colors.border} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Devices */}
        <View style={hub.sectionCard}>
          <Text style={hub.sectionTitle}>อุปกรณ์ที่เชื่อมต่อ</Text>
          {devices.map((d) => (
            <View key={d.deviceId} style={hub.deviceRow}>
              <View style={[hub.deviceIcon, { backgroundColor: d.isOnline ? Colors.successLight : Colors.gray100 }]}>
                <Ionicons name="phone-portrait-outline" size={16} color={d.isOnline ? Colors.success : Colors.gray400} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={hub.deviceName}>{d.deviceName}</Text>
                <Text style={hub.deviceMeta}>{d.platform} · v{d.appVersion}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <View style={[hub.deviceStatus, { backgroundColor: d.isOnline ? Colors.successLight : Colors.dangerLight }]}>
                  <Text style={[hub.deviceStatusText, { color: d.isOnline ? Colors.success : Colors.danger }]}>
                    {d.isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
                {d.pendingCount > 0 && (
                  <Text style={hub.devicePending}>{d.pendingCount} pending</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Force Sync */}
        <TouchableOpacity
          style={[hub.forceSyncBtn, (!isOnline || isSyncing) && hub.forceSyncBtnDisabled]}
          onPress={startSync}
          disabled={!isOnline || isSyncing}
        >
          <Ionicons name={isSyncing ? 'hourglass-outline' : 'cloud-upload-outline'} size={20} color={Colors.white} />
          <Text style={hub.forceSyncText}>{isSyncing ? 'กำลัง Sync...' : 'Force Sync ทันที'}</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const hub = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.secondary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.secondaryDark,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  headerSub: { ...Typography.body2, color: Colors.textSecondary },
  onlineChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { fontSize: 16, fontWeight: '700' },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md, padding: Spacing.md, borderLeftWidth: 4, borderLeftColor: Colors.warning },
  alertText: { ...Typography.body2, color: Colors.warningDark, flex: 1 },
  alertBtn: { backgroundColor: Colors.warning, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  alertBtnText: { fontSize: 15, color: Colors.white, fontWeight: '700' },
  statsCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statsTitle: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  statItem: { flex: 1, alignItems: 'center', gap: 3, backgroundColor: Colors.gray50, borderRadius: BorderRadius.sm, padding: Spacing.sm, borderTopWidth: 3 },
  statCount: { fontSize: 26, fontWeight: '800' },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', fontSize: 13 },
  lastSync: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  menuCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  menuIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { ...Typography.label, color: Colors.text },
  menuSub: { ...Typography.caption, color: Colors.textSecondary },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { fontSize: 14, fontWeight: '800', color: Colors.white },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  sectionTitle: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  deviceIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  deviceName: { ...Typography.label, color: Colors.text },
  deviceMeta: { ...Typography.caption, color: Colors.textSecondary },
  deviceStatus: { borderRadius: BorderRadius.full, paddingHorizontal: 7, paddingVertical: 2 },
  deviceStatusText: { fontSize: 14, fontWeight: '700' },
  devicePending: { ...Typography.caption, color: Colors.warning, fontWeight: '600' },
  forceSyncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  forceSyncBtnDisabled: { backgroundColor: Colors.gray300 },
  forceSyncText: { ...Typography.button, color: Colors.white },
});

// ─── Navigator ────────────────────────────────────────────────────────────────
export const SyncNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SyncHub" component={SyncHubScreen} />
    <Stack.Screen name="LocalTransaction">
      {({ navigation }) => (
        <LocalTransactionScreen
          onBack={() => navigation.goBack()}
          onOpenQueue={() => navigation.navigate('SyncQueue')}
        />
      )}
    </Stack.Screen>
    <Stack.Screen name="SyncQueue">
      {({ navigation }) => (
        <SyncQueueScreen
          onBack={() => navigation.goBack()}
          onOpenConflict={() => navigation.navigate('ConflictResolution')}
        />
      )}
    </Stack.Screen>
    <Stack.Screen name="ConflictResolution">
      {({ navigation }) => (
        <ConflictResolutionScreen
          onBack={() => navigation.goBack()}
          onResolved={() => navigation.goBack()}
        />
      )}
    </Stack.Screen>
  </Stack.Navigator>
);
