import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';

interface Segment {
  id: string; name: string; conditions: string; memberCount: number; color: string;
}

const MOCK_SEGMENTS: Segment[] = [
  { id: 's1', name: 'สมาชิกใหม่ (7 วัน)', conditions: 'ลงทะเบียน ≤ 7 วัน', memberCount: 23, color: '#16a34a' },
  { id: 's2', name: 'Gold ขึ้นไป', conditions: 'ระดับ Gold หรือ Platinum', memberCount: 156, color: '#d97706' },
  { id: 's3', name: 'ไม่ซื้อ 30 วัน', conditions: 'ไม่มีรายการซื้อ 30 วัน', memberCount: 89, color: '#dc2626' },
  { id: 's4', name: 'วันเกิดเดือนนี้', conditions: 'วันเกิดอยู่ในเดือนปัจจุบัน', memberCount: 34, color: '#7c3aed' },
  { id: 's5', name: 'ซื้อบ่อย (≥ 5 ครั้ง/เดือน)', conditions: 'จำนวนบิล ≥ 5 / 30 วัน', memberCount: 67, color: '#0284c7' },
  { id: 's6', name: 'ยอดซื้อสูง (≥ 10,000/เดือน)', conditions: 'ยอดซื้อรวม ≥ 10,000 / 30 วัน', memberCount: 45, color: '#ec4899' },
];

export const SegmentScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [segments] = useState(MOCK_SEGMENTS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerStyle={{ padding: 24, gap: 16 }}>
      {onBack && (
        <TouchableOpacity className={cn('flex-row items-center gap-1.5')} onPress={onBack}>
          <Ionicons name="arrow-back" size={16} color="#e11d48" />
          <Text className={cn('text-sm font-bold text-rose-600')}>กลับ</Text>
        </TouchableOpacity>
      )}

      <View className={cn('bg-rose-600 rounded-2xl p-4 shadow-lg shadow-rose-500/40')}>
        <Text className={cn('text-lg font-extrabold text-white')}>Segment ลูกค้า</Text>
        <Text className={cn('text-sm font-medium text-white/80')}>แบ่งกลุ่มลูกค้าตามเงื่อนไข เพื่อใช้กับ Campaign / โปรโมชั่น</Text>
      </View>

      <View className={cn('flex-row justify-between items-center')}>
        <Text className={cn('text-xs font-bold text-slate-500')}>{segments.length} กลุ่ม</Text>
        <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 rounded-xl px-4 py-2.5 shadow-sm')} onPress={() => setShowCreate(!showCreate)}>
          <Ionicons name="add" size={14} color="#fff" />
          <Text className={cn('text-sm font-bold text-white')}>สร้าง Segment</Text>
        </TouchableOpacity>
      </View>

      {showCreate && (
        <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-3')}>
          <Text className={cn('text-sm font-extrabold text-slate-800')}>สร้าง Segment ใหม่</Text>
          <TextInput
            className={cn('border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 bg-white')}
            value={newName}
            onChangeText={setNewName}
            placeholder="ชื่อ Segment เช่น 'ลูกค้า VIP'"
            placeholderTextColor="#94a3b8"
          />
          <Text className={cn('text-xs font-bold text-slate-500')}>เงื่อนไขแนะนำ (เลือกเพื่อเพิ่ม):</Text>
          <View className={cn('flex-row flex-wrap gap-2')}>
            {['ยอดซื้อรวม', 'วันที่สมัคร/อายุ', 'ซื้อล่าสุด/ครั้ง', 'วันเกิด', 'ระดับสมาชิก', 'ซื้อมากกว่า X ครั้ง', 'Wallet/แต้มคงเหลือ', 'คูปองที่ใช้'].map(c => (
              <View key={c} className={cn('flex-row items-center gap-1 px-3.5 py-2 rounded-lg border border-slate-200 bg-white')}>
                <Ionicons name="add-circle-outline" size={14} color="#94a3b8" />
                <Text className={cn('text-sm font-medium text-slate-500')}>{c}</Text>
              </View>
            ))}
          </View>
          <View className={cn('flex-row gap-2')}>
            <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 rounded-xl px-4 py-2.5 shadow-sm')} onPress={() => setShowCreate(false)}>
              <Text className={cn('text-sm font-bold text-white')}>บันทึก</Text>
            </TouchableOpacity>
            <TouchableOpacity className={cn('px-4 py-2.5 rounded-xl border border-slate-200 bg-white')} onPress={() => setShowCreate(false)}>
              <Text className={cn('text-sm font-bold text-slate-500')}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className={cn('gap-3')}>
        {segments.map(seg => (
          <View key={seg.id} className={cn('flex-row items-center gap-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm')}>
            <View className={cn('w-10 h-10 rounded-xl items-center justify-center')} style={{ backgroundColor: seg.color + '18' }}>
              <Ionicons name="people" size={18} color={seg.color} />
            </View>
            <View className={cn('flex-1')}>
              <Text className={cn('text-sm font-bold text-slate-800')}>{seg.name}</Text>
              <Text className={cn('text-xs font-medium text-slate-500 mt-0.5')}>{seg.conditions}</Text>
            </View>
            <View className={cn('items-center')}>
              <Text className={cn('text-lg font-extrabold')} style={{ color: seg.color }}>{seg.memberCount}</Text>
              <Text className={cn('text-xs font-medium text-slate-400')}>คน</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
