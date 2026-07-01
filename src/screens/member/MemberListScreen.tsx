/**
 * MemberListScreen — รายการสมาชิก
 * M06 CRM & Loyalty
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMemberStore } from '../../store/memberStore';
import { Member, MemberLevel } from '../../types/member';
import { Colors } from '../../constants/colors';
import { MemberLevelColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onAddMember: () => void;
  onSelectMember: (member: Member) => void;
}

const LEVEL_CONFIG: Record<MemberLevel, { label: string; color: string; bgColor: string }> = {
  member: { label: 'Member', ...MemberLevelColors.member },
  silver: { label: 'Silver', ...MemberLevelColors.silver },
  gold: { label: 'Gold', ...MemberLevelColors.gold },
  platinum: { label: 'Platinum', ...MemberLevelColors.platinum },
  vip: { label: 'VIP', ...MemberLevelColors.vip },
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

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const renderMember = ({ item }: { item: Member }) => {
    const levelCfg = LEVEL_CONFIG[item.level];
    return (
      <TouchableOpacity
        style={styles.memberCard}
        onPress={() => onSelectMember(item)}
        activeOpacity={0.8}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: LEVEL_CONFIG[item.level].bgColor }]}>
          <Text style={[styles.avatarText, { color: LEVEL_CONFIG[item.level].color }]}>
            {getInitial(item.name)}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <View style={styles.memberMeta}>
            <Ionicons name="call-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.memberPhone}>{item.phone}</Text>
          </View>
        </View>

        {/* Right side */}
        <View style={styles.memberRight}>
          <View style={[styles.levelBadge, { backgroundColor: levelCfg.bgColor }]}>
            <Text style={[styles.levelText, { color: levelCfg.color }]}>{levelCfg.label}</Text>
          </View>
          <View style={styles.pointRow}>
            <Ionicons name="star" size={12} color={Colors.warning} />
            <Text style={styles.pointText}>{item.pointBalance.toLocaleString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>สมาชิก</Text>
          <Text style={styles.headerSub}>CRM & Loyalty</Text>
        </View>
        <View style={styles.headerCount}>
          <Text style={styles.headerCountText}>{filtered.length} คน</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาชื่อ / เบอร์โทร / เลขสมาชิก"
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={56} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>ไม่พบสมาชิก</Text>
            <Text style={styles.emptyDesc}>ลองค้นหาด้วยคำอื่น หรือเพิ่มสมาชิกใหม่</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={onAddMember} activeOpacity={0.85}>
        <Ionicons name="person-add" size={22} color={Colors.white} />
        <Text style={styles.fabText}>เพิ่มสมาชิก</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { ...Typography.h3, color: Colors.white },
  headerSub: { ...Typography.body2, color: 'rgba(255,255,255,0.7)' },
  headerCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  headerCountText: { ...Typography.label, color: Colors.white },
  searchRow: { padding: Spacing.md, paddingBottom: Spacing.xs },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.text },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100, gap: Spacing.sm },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberPhone: { ...Typography.caption, color: Colors.textSecondary },
  memberRight: { alignItems: 'flex-end', gap: 4 },
  levelBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelText: { fontSize: 10, fontWeight: '700' },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pointText: { ...Typography.caption, color: Colors.text, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: Spacing.sm },
  emptyTitle: { ...Typography.h3, color: Colors.gray400 },
  emptyDesc: { ...Typography.body2, color: Colors.textSecondary },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { ...Typography.button, color: Colors.white },
});
