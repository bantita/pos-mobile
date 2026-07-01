/**
 * SCR-PROD-005 — จัดการหมวดหมู่ / Brand
 * FR-PROD-005: เพิ่ม แก้ไข ปิดใช้งาน Category และ Brand
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Modal, TextInput, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Category, Brand } from '../../types/product';
import { MOCK_CATEGORIES, MOCK_BRANDS } from '../../data/mockProducts';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface CategoryManageScreenProps {
  onBack: () => void;
}

type Tab = 'category' | 'brand';

export const CategoryManageScreen: React.FC<CategoryManageScreenProps> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('category');
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(MOCK_BRANDS);

  // Bottom sheet modal state
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Category | Brand | null>(null);
  const [formName, setFormName] = useState('');
  const [formActive, setFormActive] = useState(true);

  const openAdd = () => {
    setEditItem(null);
    setFormName('');
    setFormActive(true);
    setShowModal(true);
  };

  const openEdit = (item: Category | Brand) => {
    setEditItem(item);
    setFormName(item.name);
    setFormActive(item.status === 'active');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName.trim()) { Alert.alert('กรุณากรอกชื่อ'); return; }
    const status: 'active' | 'inactive' = formActive ? 'active' : 'inactive';
    if (tab === 'category') {
      if (editItem) {
        setCategories((prev) => prev.map((c) => c.id === editItem.id ? { ...c, name: formName, status } : c));
      } else {
        const newCat: Category = { id: `c${Date.now()}`, name: formName, productCount: 0, status };
        setCategories((prev) => [...prev, newCat]);
      }
    } else {
      if (editItem) {
        setBrands((prev) => prev.map((b) => b.id === editItem.id ? { ...b, name: formName, status } : b));
      } else {
        const newBrand: Brand = { id: `b${Date.now()}`, name: formName, productCount: 0, status };
        setBrands((prev) => [...prev, newBrand]);
      }
    }
    setShowModal(false);
  };

  const handleToggleStatus = (id: string) => {
    if (tab === 'category') {
      setCategories((prev) => prev.map((c) => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c));
    } else {
      setBrands((prev) => prev.map((b) => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b));
    }
  };

  const handleDelete = (id: string, name: string, count: number) => {
    if (count > 0) {
      Alert.alert('ไม่สามารถลบได้', `"${name}" มีสินค้า ${count} รายการอยู่ กรุณาย้ายสินค้าออกก่อน`);
      return;
    }
    Alert.alert('ยืนยันลบ', `ต้องการลบ "${name}"?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ', style: 'destructive',
        onPress: () => {
          if (tab === 'category') setCategories((prev) => prev.filter((c) => c.id !== id));
          else setBrands((prev) => prev.filter((b) => b.id !== id));
        },
      },
    ]);
  };

  const data = tab === 'category' ? categories : brands;

  const renderItem = ({ item }: { item: Category | Brand }) => (
    <View style={styles.itemCard}>
      <View style={[styles.itemIcon, { backgroundColor: tab === 'category' ? Colors.primaryLight : Colors.primaryLight }]}>
        <Ionicons
          name={tab === 'category' ? 'list-outline' : 'pricetag-outline'}
          size={20}
          color={tab === 'category' ? Colors.primary : Colors.category1}
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCount}>{item.productCount} สินค้า</Text>
      </View>
      <View style={[styles.statusBadge, item.status === 'active' ? styles.statusActive : styles.statusInactive]}>
        <Text style={[styles.statusText, { color: item.status === 'active' ? Colors.success : Colors.gray500 }]}>
          {item.status === 'active' ? 'ใช้งาน' : 'ปิดใช้'}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
          <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: item.status === 'active' ? Colors.warningLight : Colors.successLight }]}
          onPress={() => handleToggleStatus(item.id)}
        >
          <Ionicons
            name={item.status === 'active' ? 'eye-off-outline' : 'eye-outline'}
            size={16}
            color={item.status === 'active' ? Colors.warning : Colors.success}
          />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.dangerLight }]}
          onPress={() => handleDelete(item.id, item.name, item.productCount)}>
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>หมวดหมู่และ Brand</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab */}
      <View style={styles.tabRow}>
        {([['category', 'list-outline', 'หมวดหมู่'], ['brand', 'pricetag-outline', 'Brand']] as const).map(([key, icon, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Ionicons name={icon} size={16} color={tab === key ? Colors.primary : Colors.gray400} />
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
            <View style={[styles.tabBadge, tab === key && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, tab === key && { color: Colors.white }]}>
                {(tab === key ? data : (key === 'category' ? categories : brands)).length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name={tab === 'category' ? 'list-outline' : 'pricetag-outline'} size={56} color={Colors.gray300} />
            <Text style={styles.emptyText}>ยังไม่มี{tab === 'category' ? 'หมวดหมู่' : 'Brand'}</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editItem ? 'แก้ไข' : 'เพิ่ม'}{tab === 'category' ? 'หมวดหมู่' : 'Brand'}
            </Text>
            <Text style={styles.fieldLabel}>ชื่อ *</Text>
            <TextInput
              style={styles.modalInput}
              value={formName}
              onChangeText={setFormName}
              placeholder={`กรอกชื่อ${tab === 'category' ? 'หมวดหมู่' : 'Brand'}`}
              placeholderTextColor={Colors.gray400}
              autoFocus
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>เปิดใช้งาน</Text>
              <Switch
                value={formActive}
                onValueChange={setFormActive}
                trackColor={{ true: Colors.success, false: Colors.gray200 }}
                thumbColor={Colors.white}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                <Text style={styles.modalSaveText}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.md,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { ...Typography.label, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  tabBadge: {
    backgroundColor: Colors.gray100, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  tabBadgeActive: { backgroundColor: Colors.primary },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.gray500 },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 80 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  itemIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { ...Typography.label, color: Colors.text },
  itemCount: { ...Typography.caption, color: Colors.textSecondary },
  statusBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  statusActive: { backgroundColor: Colors.successLight },
  statusInactive: { backgroundColor: Colors.gray100 },
  statusText: { fontSize: 10, fontWeight: '700' },
  itemActions: { flexDirection: 'row', gap: Spacing.xs },
  actionBtn: {
    width: 32, height: 32, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { ...Typography.h3, color: Colors.gray400 },
  fab: {
    position: 'absolute', bottom: Spacing.xl, right: Spacing.xl,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, gap: Spacing.md,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xs },
  modalTitle: { ...Typography.h4, color: Colors.text },
  fieldLabel: { ...Typography.label, color: Colors.gray700 },
  modalInput: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.body1, color: Colors.text,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { ...Typography.label, color: Colors.text },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  modalCancelBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border },
  modalCancelText: { ...Typography.button, color: Colors.textSecondary },
  modalSaveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  modalSaveText: { ...Typography.button, color: Colors.white },
});
