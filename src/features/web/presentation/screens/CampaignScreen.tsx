import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

interface Campaign {
  id: string; name: string; channel: string; segment: string;
  status: 'draft' | 'scheduled' | 'sent' | 'active';
  sentAt?: string; scheduledAt?: string;
  reach: number; opened: number; converted: number;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Welcome สมาชิกใหม่', channel: 'LINE', segment: 'สมาชิกใหม่', status: 'active', reach: 245, opened: 180, converted: 42 },
  { id: 'c2', name: 'Flash Friday ลด 20%', channel: 'LINE', segment: 'ทุกคน', status: 'sent', sentAt: '2026-06-20', reach: 1200, opened: 890, converted: 156 },
  { id: 'c3', name: 'Birthday Month', channel: 'LINE + SMS', segment: 'เกิดเดือน มิ.ย.', status: 'scheduled', scheduledAt: '2026-07-01', reach: 0, opened: 0, converted: 0 },
  { id: 'c4', name: 'Win Back ไม่มา 30 วัน', channel: 'LINE', segment: 'ไม่ซื้อ 30 วัน', status: 'draft', reach: 0, opened: 0, converted: 0 },
];

const CHIP_COLORS: Record<string, string> = { LINE: '#a855f7', SMS: '#2563eb', 'LINE + SMS': '#a855f7', Push: '#d97706' };

export const CampaignScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [campaigns] = useState(MOCK_CAMPAIGNS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newChannel, setNewChannel] = useState('LINE');
  const [newSegment, setNewSegment] = useState('ทุกคน');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const showAlert = (title: string, msg: string) => {
    setAlertTitle(title);
    setAlertMsg(msg);
    setAlertVisible(true);
  };

  const statusColor = (s: string) => s === 'active' ? '#10b981' : s === 'sent' ? '#0284c7' : s === 'scheduled' ? '#d97706' : '#6b7280';
  const statusLabel = (s: string) => s === 'active' ? 'ใช้งาน' : s === 'sent' ? 'ส่งแล้ว' : s === 'scheduled' ? 'ตั้งเวลา' : 'แบบร่าง';

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerClassName={cn('p-5 gap-4')}>
      {onBack && (
        <TouchableOpacity className={cn('flex-row items-center gap-1.5')} onPress={onBack}>
          <Ionicons name="arrow-back" size={16} color="#e11d48" />
          <Text className={cn('text-xs font-bold text-rose-600')}>กลับ</Text>
        </TouchableOpacity>
      )}
      <View className={cn('flex-row justify-between items-center')}>
        <View>
          <Text className={cn('text-base font-extrabold text-slate-800')}>Campaign Marketing</Text>
          <Text className={cn('text-xs text-slate-500 font-medium mt-0.5')}>โปรโมชั่นการตลาดผ่าน LINE, SMS และช่องทางอื่นๆ</Text>
        </View>
        <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 rounded-lg px-3.5 py-2 shadow-sm')} onPress={() => setShowCreate(!showCreate)}>
          <Ionicons name="add" size={14} color="#fafafa" />
          <Text className={cn('text-xs font-bold text-white')}>สร้างแคมเปญ</Text>
        </TouchableOpacity>
      </View>

      <View className={cn('flex-row gap-3')}>
        <View className={cn('flex-1 bg-white rounded-2xl p-4 shadow-sm border border-rose-100 items-center')}>
          <Text className={cn('text-base font-extrabold text-purple-600')}>{campaigns.length}</Text>
          <Text className={cn('text-xs text-slate-500 font-medium mt-1')}>แคมเปญทั้งหมด</Text>
        </View>
        <View className={cn('flex-1 bg-white rounded-2xl p-4 shadow-sm border border-rose-100 items-center')}>
          <Text className={cn('text-base font-extrabold text-emerald-600')}>{campaigns.filter(c => c.status === 'active').length}</Text>
          <Text className={cn('text-xs text-slate-500 font-medium mt-1')}>กำลังใช้งาน</Text>
        </View>
        <View className={cn('flex-1 bg-white rounded-2xl p-4 shadow-sm border border-rose-100 items-center')}>
          <Text className={cn('text-base font-extrabold text-blue-600')}>{campaigns.reduce((s, c) => s + c.reach, 0).toLocaleString()}</Text>
          <Text className={cn('text-xs text-slate-500 font-medium mt-1')}>เข้าถึงทั้งหมด</Text>
        </View>
        <View className={cn('flex-1 bg-white rounded-2xl p-4 shadow-sm border border-rose-100 items-center')}>
          <Text className={cn('text-base font-extrabold text-rose-600')}>{campaigns.reduce((s, c) => s + c.converted, 0)}</Text>
          <Text className={cn('text-xs text-slate-500 font-medium mt-1')}>Conversion</Text>
        </View>
      </View>

      {showCreate && (
        <View className={cn('bg-white rounded-2xl p-4 shadow-sm border border-rose-100 gap-3')}>
          <Text className={cn('text-xs font-bold text-slate-800')}>สร้างแคมเปญใหม่</Text>
          <TextInput className={cn('border border-rose-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 bg-rose-50')} value={newName} onChangeText={setNewName} placeholder="ชื่อแคมเปญ..." placeholderTextColor="#cbd5e1" />
          <View className={cn('flex-row gap-2')}>
            {['LINE', 'SMS', 'LINE + SMS', 'Push'].map(ch => (
              <TouchableOpacity key={ch} className={cn('px-3 py-2 rounded-lg border', newChannel === ch ? 'bg-rose-500 border-rose-500' : 'bg-[#f6f7fb] border-slate-200')} onPress={() => setNewChannel(ch)}>
                <Text className={cn('text-xs', newChannel === ch ? 'text-white font-bold' : 'text-slate-600 font-medium')}>{ch}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className={cn('flex-row gap-2 flex-wrap')}>
            {['ทุกคน', 'สมาชิกใหม่', 'Gold Member', 'ไม่ซื้อ 30 วัน', 'เกิดเดือนนี้'].map(seg => (
              <TouchableOpacity key={seg} className={cn('px-3 py-2 rounded-lg border', newSegment === seg ? 'bg-rose-500 border-rose-500' : 'bg-[#f6f7fb] border-slate-200')} onPress={() => setNewSegment(seg)}>
                <Text className={cn('text-xs', newSegment === seg ? 'text-white font-bold' : 'text-slate-600 font-medium')}>{seg}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className={cn('flex-row gap-2')}>
            <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 rounded-lg px-3.5 py-2 shadow-sm')} onPress={() => { showAlert('บันทึก', 'สร้างแคมเปญสำเร็จ'); setShowCreate(false); setNewName(''); }}>
              <Text className={cn('text-xs font-bold text-white')}>บันทึก</Text>
            </TouchableOpacity>
            <TouchableOpacity className={cn('px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200')} onPress={() => setShowCreate(false)}>
              <Text className={cn('text-xs text-slate-600 font-medium')}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className={cn('bg-white rounded-2xl shadow-sm border border-rose-100')}>
        {campaigns.map((c, idx) => (
          <TouchableOpacity
            key={c.id}
            className={cn('flex-row items-center p-3 gap-3', idx > 0 && 'border-t border-rose-100')}
            onPress={() => showAlert(`รายละเอียด ${c.name}`, `Channel: ${c.channel}\nSegment: ${c.segment}\nสถานะ: ${statusLabel(c.status)}\n\nเข้าถึง: ${c.reach} คน\nเปิดอ่าน: ${c.opened} คน\nแปลง: ${c.converted} คน${c.sentAt ? '\nส่งเมื่อ: ' + c.sentAt : ''}${c.scheduledAt ? '\nกำหนดส่ง: ' + c.scheduledAt : ''}`)}
          >
            <View className={cn('w-9 h-9 rounded-xl bg-purple-100 items-center justify-center')}>
              <Ionicons name={c.channel.includes('LINE') ? 'chatbubble' : 'mail'} size={18} color="#a855f7" />
            </View>
            <View className={cn('flex-1')}>
              <Text className={cn('text-xs font-semibold text-slate-800')}>{c.name}</Text>
              <Text className={cn('text-xs text-slate-500 font-medium mt-0.5')}>{c.channel} · {c.segment}{c.sentAt ? ` · ส่ง ${c.sentAt}` : ''}{c.scheduledAt ? ` · กำหนด ${c.scheduledAt}` : ''}</Text>
            </View>
            <View className={cn('items-end gap-1')}>
              <View className={cn('px-2 py-0.5 rounded-xl')} style={{ backgroundColor: statusColor(c.status) + '18' }}>
                <Text className={cn('text-xs font-bold')} style={{ color: statusColor(c.status) }}>{statusLabel(c.status)}</Text>
              </View>
              {c.reach > 0 && <Text className={cn('text-xs text-slate-500 font-medium')}>เปิด {c.reach} · อ่าน {c.opened} · แปลง {c.converted}</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <AlertDialog visible={alertVisible} onClose={() => setAlertVisible(false)} title={alertTitle} message={alertMsg} variant="info" />
    </ScrollView>
  );
};
