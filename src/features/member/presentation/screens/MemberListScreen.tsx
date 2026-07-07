import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { useMemberStore } from '@/features/member/application/stores/memberStore';
import { Member, MemberLevel } from '@/features/member/domain/member';

interface Props {
  onAddMember: () => void;
  onSelectMember: (member: Member) => void;
}

const LEVEL_CONFIG: Record<MemberLevel, { label: string; color: string; bgColor: string }> = {
  member: { label: 'Member', color: '#e11d48', bgColor: '#ffe4e6' },
  silver: { label: 'Silver', color: '#6b7280', bgColor: '#f3f4f6' },
  gold: { label: 'Gold', color: '#a16207', bgColor: '#fed7aa' },
  platinum: { label: 'Platinum', color: '#6b21a8', bgColor: '#e9d5ff' },
  vip: { label: 'VIP', color: '#ef4444', bgColor: '#ffe4e6' },
};

export const MemberListScreen: React.FC<Props> = ({ onAddMember, onSelectMember }) => {
  const { members } = useMemberStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const k = search.toLowerCase().trim();
    if (!k) return members.filter(m => m.isActive);
    return members.filter(m =>
      m.isActive && (
        m.name.toLowerCase().includes(k) ||
        m.phone.includes(k) ||
        m.memberNo.toLowerCase().includes(k)
      )
    );
  }, [members, search]);

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const renderMember = ({ item }: { item: Member }) => {
    const levelCfg = LEVEL_CONFIG[item.level];
    return (
      <TouchableOpacity
        className="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
        onPress={() => onSelectMember(item)}
        activeOpacity={0.8}
      >
        <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: levelCfg.bgColor }}>
          <Text className="text-lg font-bold" style={{ color: levelCfg.color }}>
            {getInitial(item.name)}
          </Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-bold text-slate-900">{item.name}</Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="call-outline" size={12} color="#78716c" />
            <Text className="text-xs font-medium text-slate-500">{item.phone}</Text>
          </View>
        </View>
        <View className="items-end gap-1.5">
          <View className="rounded-lg px-2.5 py-0.5" style={{ backgroundColor: levelCfg.bgColor }}>
            <Text className="text-xs font-bold" style={{ color: levelCfg.color }}>{levelCfg.label}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={12} color="#e11d48" />
            <Text className="text-xs font-bold text-slate-900">{item.pointBalance.toLocaleString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      <View className="bg-rose-600 px-4 pb-5 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-extrabold text-white">สมาชิก</Text>
            <Text className="text-sm font-medium text-white/70">CRM & Loyalty</Text>
          </View>
          <View className="rounded-xl bg-white/20 px-3 py-1.5">
            <Text className="text-xs font-bold text-white">{filtered.length} คน</Text>
          </View>
        </View>
      </View>

      <View className="-mt-3 px-4 pb-2">
        <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
          <Ionicons name="search-outline" size={18} color="#a1a1aa" />
          <TextInput
            className="flex-1 text-sm font-medium text-slate-900"
            placeholder="ค้นหาชื่อ / เบอร์โทร / เลขสมาชิก"
            placeholderTextColor="#a1a1aa"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#a1a1aa" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        renderItem={renderMember}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center gap-3 py-20">
            <Ionicons name="people-outline" size={64} color="#fda4af" />
            <Text className="text-lg font-bold text-slate-400">ไม่พบสมาชิก</Text>
            <Text className="text-sm font-medium text-slate-500">ลองค้นหาด้วยคำอื่น หรือเพิ่มสมาชิกใหม่</Text>
          </View>
        }
      />

      <TouchableOpacity
        className="absolute bottom-6 right-5 flex-row items-center gap-2 rounded-full bg-rose-500 px-5 py-3.5 shadow-lg shadow-rose-500/40"
        onPress={onAddMember}
        activeOpacity={0.85}
      >
        <Ionicons name="person-add" size={22} color="#fafafa" />
        <Text className="text-sm font-bold text-white">เพิ่มสมาชิก</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};
