import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';

const LOG_LEVELS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'info', label: 'ทั่วไป' },
  { key: 'warning', label: 'คำเตือน' },
  { key: 'error', label: 'ข้อผิดพลาด' },
] as const;

const SAMPLE_LOGS = [
  { time: '09:15:22', user: 'admin', action: 'เข้าสู่ระบบ', target: 'POS 1', level: 'info' },
  { time: '09:14:00', user: 'cashier01', action: 'ขายสินค้า #B2401', target: 'POS 2', level: 'info' },
  { time: '09:10:45', user: 'admin', action: 'แก้ไขราคาสินค้า #P1001', target: 'ระบบสินค้า', level: 'warning' },
  { time: '08:55:12', user: 'system', action: 'Sync ล้มเหลว', target: 'Cloud DB', level: 'error' },
  { time: '08:30:00', user: 'owner', action: 'เปิด/ปิดโมดูล Inventory', target: 'Super Admin', level: 'info' },
];

export const AuditLogScreen: React.FC = () => {
  const [level, setLevel] = useState<string>('all');

  const filtered = level === 'all' ? SAMPLE_LOGS : SAMPLE_LOGS.filter(l => l.level === level);

  return (
    <View className={cn('flex-1 bg-[#f6f7fb] p-5 gap-5')}>
      <Text className={cn('text-base font-extrabold text-slate-800')}>Audit Log</Text>
      <Text className={cn('text-xs text-slate-500 font-medium -mt-4')}>บันทึกการใช้งานในระบบ</Text>

      <View className={cn('flex-row gap-2')}>
        {LOG_LEVELS.map(l => {
          const active = level === l.key;
          return (
            <TouchableOpacity
              key={l.key}
              className={cn('px-3.5 py-2 rounded-lg', active ? 'bg-rose-500 shadow-sm' : 'bg-rose-100')}
              onPress={() => setLevel(l.key)}
            >
              <Text className={cn('text-xs font-bold', active ? 'text-white' : 'text-slate-600')}>{l.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className={cn('bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden')}>
          <View className={cn('flex-row bg-rose-50 px-4 py-2.5 border-b border-rose-100')}>
            {['เวลา', 'ผู้ใช้', 'การกระทำ', 'เป้าหมาย'].map(h => (
              <Text key={h} className={cn('flex-1 text-xs font-bold text-rose-700')}>{h}</Text>
            ))}
          </View>
          {filtered.map((log, i) => (
            <View key={i} className={cn('flex-row px-4 py-3 border-b border-rose-50', i % 2 === 1 && 'bg-rose-50/30')}>
              <Text className={cn('flex-1 text-xs font-medium text-slate-700')}>{log.time}</Text>
              <Text className={cn('flex-1 text-xs font-medium text-slate-700')}>{log.user}</Text>
              <Text className={cn('flex-1 text-xs font-medium text-slate-700')}>{log.action}</Text>
              <Text className={cn('flex-1 text-xs font-medium text-slate-700')}>{log.target}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
