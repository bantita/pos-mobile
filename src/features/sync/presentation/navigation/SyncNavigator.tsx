/**
 * Sync Navigator — M11 Offline First & Sync
 * Hub → LocalTransaction | SyncQueue | ConflictResolution
 */
import React from 'react';
import { createStackNavigator } from "expo-router/build/react-navigation/stack";
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { LocalTransactionScreen } from '@/features/sync/presentation/screens/LocalTransactionScreen';
import { SyncQueueScreen } from '@/features/sync/presentation/screens/SyncQueueScreen';
import { ConflictResolutionScreen } from '@/features/sync/presentation/screens/ConflictResolutionScreen';
import { useSyncStore } from '@/features/sync/application/stores/syncStore';
import { cn } from '@/shared/lib/cn';
import { formatDateTime } from '@/shared/lib/format';
import { Text } from '@/shared/tw/index';
import { ScreenSurface } from '@/shared/ui/index';

export type SyncStackParamList = {
  SyncHub: undefined;
  LocalTransaction: undefined;
  SyncQueue: undefined;
  ConflictResolution: undefined;
};

const Stack = createStackNavigator<SyncStackParamList>();

const SyncHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isOnline, isSyncing, lastSyncAt, getStats, startSync, devices } = useSyncStore();
  const stats = getStats();
  const actionNeeded = stats.failed + stats.conflict;

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center bg-slate-950 px-6 py-6 border-b border-slate-800')}>
        <View className={cn('flex-1')}>
          <Text className={cn('text-xl font-bold text-white')}>Offline First & Sync</Text>
          <Text className={cn('text-sm text-slate-300')}>M11 — จัดการข้อมูล Offline</Text>
        </View>
        <View className={cn('flex-row items-center gap-1.5 rounded-full px-2 py-1')} style={{ backgroundColor: isOnline ? '#d1fae5' : '#ffe4e6' }}>
          <View className={cn('w-2 h-2 rounded-full')} style={{ backgroundColor: isOnline ? '#16a34a' : '#ef4444' }} />
          <Text className={cn('text-sm font-bold')} style={{ color: isOnline ? '#15803d' : '#be123c' }}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {actionNeeded > 0 && (
          <View className={cn('flex-row items-center gap-4 bg-amber-100 rounded-lg p-4 border-l-4 border-l-amber-400')}>
            <Ionicons name="warning" size={18} color="#facc15" />
            <Text className={cn('text-sm flex-1')} style={{ color: '#854d0e' }}>
              ต้องดำเนินการ {actionNeeded} รายการ ({stats.failed} ล้มเหลว · {stats.conflict} ขัดแย้ง)
            </Text>
            <TouchableOpacity className={cn('bg-amber-400 rounded px-2 py-1')} onPress={() => navigation.navigate('SyncQueue')}>
              <Text className={cn('text-sm font-bold text-white')}>จัดการ</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className={cn('bg-white rounded-xl p-4 gap-4 shadow-sm')} style={{ boxShadow: '0 4px 14px rgba(15, 23, 42, 0.07)' }}>
          <Text className={cn('text-sm font-semibold text-neutral-800 font-bold')}>สถานะ Sync</Text>
          <View className={cn('flex-row gap-2')}>
            {[
              { label: 'รอ Sync',     count: stats.pending,  color: '#facc15',  icon: 'time-outline' },
              { label: 'ล้มเหลว',    count: stats.failed,   color: '#ef4444',   icon: 'close-circle-outline' },
              { label: 'ขัดแย้ง',    count: stats.conflict, color: '#1e40af',  icon: 'alert-circle-outline' },
              { label: 'สำเร็จ',      count: stats.success,  color: '#16a34a',  icon: 'checkmark-circle-outline' },
            ].map((s, i) => (
              <View key={i} className={cn('flex-1 items-center gap-1 bg-[#f6f7fb] rounded p-2')} style={{ borderTopWidth: 3, borderTopColor: s.color }}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
                <Text className="text-2xl font-extrabold" style={{ color: s.color }}>{s.count}</Text>
                <Text className={cn('text-xs text-neutral-500 text-center text-sm')}>{s.label}</Text>
              </View>
            ))}
          </View>
          {lastSyncAt && (
            <Text className={cn('text-xs text-neutral-500 text-center')}>ซิงค์ล่าสุด: {formatDateTime(lastSyncAt)}</Text>
          )}
        </View>

        <View className={cn('bg-white rounded-xl overflow-hidden shadow-sm')} style={{ boxShadow: '0 4px 14px rgba(15, 23, 42, 0.07)' }}>
          {[
            {
              icon: 'document-text-outline', label: 'Local Transactions',
              sub: `ธุรกรรม Offline ทั้งหมด (${stats.total} รายการ)`,
              color: '#0f766e', bg: '#dcfce7',
              route: 'LocalTransaction', badge: stats.pending,
            },
            {
              icon: 'cloud-upload-outline', label: 'Sync Queue',
              sub: 'จัดการคิวซิงค์ข้อมูล',
              color: '#1e40af', bg: '#eef2ff',
              route: 'SyncQueue', badge: stats.failed,
            },
            {
              icon: 'git-merge-outline', label: 'Conflict Resolution',
              sub: `แก้ข้อมูลขัดแย้ง (${stats.conflict} รายการ)`,
              color: '#3b82f6', bg: '#eef2ff',
              route: 'ConflictResolution', badge: stats.conflict,
            },
          ].map((m, i, arr) => (
            <TouchableOpacity
              key={m.route}
              className={cn('flex-row items-center gap-4 p-4', i < arr.length - 1 && 'border-b border-neutral-200')}
              onPress={() => navigation.navigate(m.route as keyof SyncStackParamList)}
              activeOpacity={0.8}
            >
              <View className={cn('w-11 h-11 rounded-lg items-center justify-center')} style={{ backgroundColor: m.bg }}>
                <Ionicons name={m.icon as any} size={22} color={m.color} />
              </View>
              <View className={cn('flex-1')}>
                <Text className={cn('text-sm font-semibold text-neutral-800')}>{m.label}</Text>
                <Text className={cn('text-xs text-neutral-500')}>{m.sub}</Text>
              </View>
              {m.badge > 0 && (
                <View className={cn('min-w-[20px] h-5 rounded-full items-center justify-center px-1.5')} style={{ backgroundColor: m.badge > 0 && m.route === 'SyncQueue' ? '#ef4444' : m.color }}>
                  <Text className={cn('text-sm font-extrabold text-white')}>{m.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color="#e5e5e5" />
            </TouchableOpacity>
          ))}
        </View>

        <View className={cn('bg-white rounded-xl p-4 gap-2 shadow-sm')} style={{ boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)' }}>
          <Text className={cn('text-sm font-semibold text-neutral-800 font-bold')}>อุปกรณ์ที่เชื่อมต่อ</Text>
          {devices.map((d) => (
            <View key={d.deviceId} className={cn('flex-row items-center gap-2 py-1')}>
              <View className={cn('w-9 h-9 rounded items-center justify-center')} style={{ backgroundColor: d.isOnline ? '#d1fae5' : '#f3f4f6' }}>
                <Ionicons name="phone-portrait-outline" size={16} color={d.isOnline ? '#16a34a' : '#a3a3a3'} />
              </View>
              <View className={cn('flex-1')}>
                <Text className={cn('text-sm font-semibold text-neutral-800')}>{d.deviceName}</Text>
                <Text className={cn('text-xs text-neutral-500')}>{d.platform} · v{d.appVersion}</Text>
              </View>
              <View className={cn('items-end gap-0.5')}>
                <View className={cn('rounded-full px-2 py-0.5')} style={{ backgroundColor: d.isOnline ? '#d1fae5' : '#ffe4e6' }}>
                  <Text className={cn('text-sm font-bold')} style={{ color: d.isOnline ? '#16a34a' : '#ef4444' }}>
                    {d.isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
                {d.pendingCount > 0 && (
                  <Text className={cn('text-xs text-amber-400 font-semibold')}>{d.pendingCount} pending</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          className={cn('flex-row items-center justify-center gap-4 rounded-lg py-4')}
          style={{ backgroundColor: (!isOnline || isSyncing) ? '#d6d3d1' : '#1e40af' }}
          onPress={startSync}
          disabled={!isOnline || isSyncing}
        >
          <Ionicons name={isSyncing ? 'hourglass-outline' : 'cloud-upload-outline'} size={20} color="#fafafa" />
          <Text className={cn('text-sm font-semibold text-white')}>{isSyncing ? 'กำลัง Sync...' : 'Force Sync ทันที'}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export const SyncNavigator: React.FC = () => (
  <Stack.Navigator screenLayout={({ children }) => <ScreenSurface>{children}</ScreenSurface>} screenOptions={{ headerShown: false }}>
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
