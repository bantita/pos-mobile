/**
 * SupplierListScreen — รายการผู้จำหน่าย (Supplier Management)
 * M08 Supplier & Purchase
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePurchaseStore } from '../../store/purchaseStore';
import { Supplier } from '../../types/purchase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onBack?: () => void;
}

export const SupplierListScreen: React.FC<Props> = ({ onBack }) => {
  const { suppliers, addSupplier } = usePurchaseStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.supplierCode.toLowerCase().includes(q) ||
        (s.phone ?? '').includes(q) ||
        (s.contactName ?? '').toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const handleAdd = () => {
    Alert.prompt
      ? Alert.prompt('เพิ่ม Supplier', 'กรุณาใส่ชื่อผู้จำหน่าย', (name) => {
          if (name && name.trim()) {
            addSupplier({
              supplierCode: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
              name: name.trim(),
              isActive: true,
              shopId: 'shop-01',
            });
          }
        })
      : Alert.alert('เพิ่ม Supplier', 'ฟีเจอร์เพิ่มผู้จำหน่ายจะพร้อมใช้งานเร็วๆ นี้', [
          { text: 'ตกลง' },
        ]);
  };

  const renderSupplier = ({ item }: { item: Supplier }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <View style={styles.iconWrap}>
          <Ionicons name="business-outline" size={22} color={Colors.accentDark} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.supplierName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.supplierCode}>{item.supplierCode}</Text>
        </View>
        <View style={[styles.statusBadge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.statusText, item.isActive ? styles.statusActive : styles.statusInactive]}>
            {item.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        {item.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        {item.paymentTerms && (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>เงื่อนไข: {item.paymentTerms}</Text>
          </View>
        )}
        {item.contactName && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.contactName}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ผู้จำหน่าย</Text>
          <Text style={styles.headerSub}>Supplier Management · {suppliers.length} ราย</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร..."
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
        keyExtractor={(s) => s.id}
        renderItem={renderSupplier}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={56} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>ยังไม่มีผู้จำหน่าย</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={22} color={Colors.white} />
        <Text style={styles.fabText}>เพิ่ม Supplier</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.accentDark, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },
  searchRow: { padding: Spacing.md, paddingBottom: Spacing.xs },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, height: 44,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.text },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconWrap: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  supplierName: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  supplierCode: { ...Typography.caption, color: Colors.textSecondary },
  statusBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  badgeActive: { backgroundColor: Colors.successLight },
  badgeInactive: { backgroundColor: Colors.gray200 },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusActive: { color: Colors.success },
  statusInactive: { color: Colors.gray500 },
  cardDetails: { gap: 3, paddingLeft: 56 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { ...Typography.caption, color: Colors.text },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: Spacing.lg },
  emptyTitle: { ...Typography.h3, color: Colors.gray400 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.accentDark, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  fabText: { ...Typography.label, color: Colors.white, fontWeight: '700' },
});
