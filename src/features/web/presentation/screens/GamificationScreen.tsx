import React, { useState } from 'react';
import { Switch } from 'react-native';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

interface GameConfig {
  id: string; name: string; type: string; icon: string;
  desc: string; enabled: boolean; participants: number;
}

const MOCK_GAMES: GameConfig[] = [
  { id: 'g1', name: 'Spin Wheel รางวัลประจำสัปดาห์', type: 'spin', icon: 'sync-circle', desc: 'หมุนวงล้อลุ้นส่วนลด 5-50%', enabled: true, participants: 345 },
  { id: 'g2', name: 'Stamp Card สะสม 10 แลกฟรี', type: 'stamp', icon: 'grid', desc: 'ซื้อครบ 10 ครั้ง รับเครื่องดื่มฟรี 1 แก้ว', enabled: true, participants: 890 },
  { id: 'g3', name: 'Lucky Draw ปีใหม่', type: 'lucky', icon: 'gift', desc: 'ซื้อครบ 500 รับสิทธิ์ลุ้น iPhone', enabled: false, participants: 1200 },
  { id: 'g4', name: 'Daily Check-in', type: 'mission', icon: 'calendar', desc: 'เช็คอินร้านทุกวัน สะสม 7 วันรับคูปอง', enabled: true, participants: 567 },
  { id: 'g5', name: 'Refer a Friend', type: 'mission', icon: 'people', desc: 'แนะนำเพื่อน ทั้งคู่ได้แต้ม 50', enabled: true, participants: 234 },
];

export const GamificationScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [games, setGames] = useState(MOCK_GAMES);
  const [alertDialog, setAlertDialog] = useState({ visible: false, title: '', message: '' });
  const toggleGame = (id: string) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g));
  };

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerStyle={{ padding: 24, gap: 16 }}>
      {onBack && (
        <TouchableOpacity className={cn('flex-row items-center gap-1.5')} onPress={onBack}>
          <Ionicons name="arrow-back" size={16} color="#e11d48" />
          <Text className={cn('text-xs font-bold text-rose-600')}>กลับ</Text>
        </TouchableOpacity>
      )}

      <View className={cn('bg-rose-600 rounded-2xl p-4 shadow-lg shadow-rose-500/40')}>
        <Text className={cn('text-lg font-extrabold text-white')}>Gamification</Text>
        <Text className={cn('text-sm font-medium text-white/80')}>สร้างเกม/กิจกรรม เพิ่ม engagement ลูกค้า</Text>
      </View>

      <View className={cn('flex-row gap-3')}>
        <View className={cn('flex-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm items-center')}>
          <Text className={cn('text-lg font-extrabold text-rose-500')}>{games.length}</Text>
          <Text className={cn('text-xs font-bold text-slate-500 mt-1')}>เกมทั้งหมด</Text>
        </View>
        <View className={cn('flex-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm items-center')}>
          <Text className={cn('text-lg font-extrabold text-emerald-500')}>{games.filter(g => g.enabled).length}</Text>
          <Text className={cn('text-xs font-bold text-slate-500 mt-1')}>กำลังใช้งาน</Text>
        </View>
        <View className={cn('flex-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm items-center')}>
          <Text className={cn('text-lg font-extrabold text-sky-500')}>{games.reduce((s, g) => s + g.participants, 0).toLocaleString()}</Text>
          <Text className={cn('text-xs font-bold text-slate-500 mt-1')}>ผู้เข้าร่วมทั้งหมด</Text>
        </View>
      </View>

      <TouchableOpacity
        className={cn('flex-row items-center gap-1 bg-rose-500 rounded-xl px-4 py-2.5 self-start shadow-sm')}
        onPress={() => setAlertDialog({
          visible: true,
          title: 'เพิ่มเกมใหม่',
          message: 'ประเภทเกม:\n1. Spin Wheel (วงล้อ)\n2. Stamp Card (สะสม)\n3. Lucky Draw (สุ่มรางวัล)\n4. Daily Check-in\n5. Refer a Friend\n\n(ระบบกำลังพัฒนา)',
        })}
      >
        <Ionicons name="add" size={14} color="#fafafa" />
        <Text className={cn('text-xs font-bold text-white')}>เพิ่มเกมใหม่</Text>
      </TouchableOpacity>

      <View className={cn('gap-2.5')}>
        {games.map(g => (
          <View key={g.id} className={cn('flex-row items-center gap-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm')}>
            <View className={cn('w-12 h-12 rounded-xl items-center justify-center', g.enabled ? 'bg-rose-50' : 'bg-slate-100')}>
              <Ionicons name={g.icon as any} size={22} color={g.enabled ? '#e11d48' : '#6b7280'} />
            </View>
            <View className={cn('flex-1')}>
              <Text className={cn('text-sm font-bold', g.enabled ? 'text-slate-900' : 'text-slate-400')}>{g.name}</Text>
              <Text className={cn('text-xs font-medium text-slate-500 mt-0.5')}>{g.desc}</Text>
              <Text className={cn('text-xs font-medium text-slate-400 mt-1')}>
                {g.participants.toLocaleString()} ผู้เข้าร่วม · ประเภท: {g.type}
              </Text>
            </View>
            <Switch value={g.enabled} onValueChange={() => toggleGame(g.id)} />
          </View>
        ))}
      </View>

      <AlertDialog
        visible={alertDialog.visible}
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant="info"
      />
    </ScrollView>
  );
};
