/**
 * PromoGroupManageScreen — จัดกลุ่มสินค้าโปรโมชั่น
 * Manage promotion product groups: list, create, edit
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { MOCK_PRODUCTS } from '../../data/mockProducts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PromoGroupProduct {
  id: string;
  productId: string;
  code: string;
  name: string;
  unit: string;
  remark: string;
  approved: boolean;
  active: boolean;
}

interface PromoGroup {
  id: string;
  code: string;
  name: string;
  nameEN: string;
  remark: string;
  products: PromoGroupProduct[];
  status: 'active' | 'inactive';
}

interface Props {
  onBack: () => void;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_GROUPS: PromoGroup[] = [
  {
    id: 'pg-001',
    code: 'AutoRunCode_10',
    name: 'โปรเด็ก(แกดพล)',
    nameEN: '',
    remark: '',
    products: [
      { id: 'pgp-1', productId: 'H00001', code: 'H00001', name: 'บริการตัดผมชาย Men\'s Hair Cut', unit: 'ครั้ง', remark: '', approved: true, active: true },
      { id: 'pgp-2', productId: 'H00002', code: 'H00002', name: 'บริการตัดผมชาย + สระ Hair Cut + Wash', unit: 'ครั้ง', remark: '', approved: false, active: true },
    ],
    status: 'active',
  },
  {
    id: 'pg-002',
    code: 'AutoRunCode_11',
    name: 'โปรสินค้าเครื่องดื่ม',
    nameEN: 'Beverage Promo',
    remark: 'กลุ่มสินค้าเครื่องดื่มทั้งหมด',
    products: [
      { id: 'pgp-3', productId: 'p1', code: 'P001', name: 'น้ำดื่มสิงห์ 600ml', unit: 'ขวด', remark: '', approved: true, active: true },
    ],
    status: 'active',
  },
  {
    id: 'pg-003',
    code: 'AutoRunCode_12',
    name: 'กลุ่มขนมขบเคี้ยว',
    nameEN: 'Snack Group',
    remark: '',
    products: [],
    status: 'inactive',
  },
];

let nextCodeNum = 13;
const generateCode = () => {
  const code = `AutoRunCode_${nextCodeNum}`;
  nextCodeNum++;
  return code;
};

// ─── Component ────────────────────────────────────────────────────────────────
export const PromoGroupManageScreen: React.FC<Props> = ({ onBack }) => {
  const [groups, setGroups] = useState<PromoGroup[]>(INITIAL_GROUPS);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingGroup, setEditingGroup] = useState<PromoGroup | null>(null);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formNameEN, setFormNameEN] = useState('');
  const [formRemark, setFormRemark] = useState('');
  const [formProducts, setFormProducts] = useState<PromoGroupProduct[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormCode('');
    setFormName('');
    setFormNameEN('');
    setFormRemark('');
    setFormProducts([]);
    setEditingGroup(null);
  };

  const startCreate = () => {
    resetForm();
    setFormCode(generateCode());
    setMode('create');
  };

  const startEdit = (group: PromoGroup) => {
    setEditingGroup(group);
    setFormCode(group.code);
    setFormName(group.name);
    setFormNameEN(group.nameEN);
    setFormRemark(group.remark);
    setFormProducts([...group.products]);
    setMode('edit');
  };

  const handleCancel = () => {
    resetForm();
    setMode('list');
  };

  const handleSave = () => {
    if (!formName.trim()) {
      Alert.alert('กรุณากรอกข้อมูล', 'ชื่อกลุ่มสินค้าโปรโมชั่นจำเป็นต้องกรอก');
      return;
    }

    if (mode === 'create') {
      const newGroup: PromoGroup = {
        id: `pg-${Date.now()}`,
        code: formCode,
        name: formName,
        nameEN: formNameEN,
        remark: formRemark,
        products: formProducts,
        status: 'active',
      };
      setGroups((prev) => [...prev, newGroup]);
      Alert.alert('บันทึกสำเร็จ', 'สร้างกลุ่มสินค้าโปรโมชั่นเรียบร้อย');
    } else if (mode === 'edit' && editingGroup) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === editingGroup.id
            ? { ...g, name: formName, nameEN: formNameEN, remark: formRemark, products: formProducts }
            : g,
        ),
      );
      Alert.alert('บันทึกสำเร็จ', 'แก้ไขกลุ่มสินค้าโปรโมชั่นเรียบร้อย');
    }

    resetForm();
    setMode('list');
  };

  const handleSelectProduct = (productId: string) => {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product) return;
    if (formProducts.find((p) => p.productId === productId)) return;

    const newProduct: PromoGroupProduct = {
      id: `pgp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      code: product.code,
      name: product.name,
      unit: product.unit,
      remark: '',
      approved: true,
      active: true,
    };
    setFormProducts((prev) => [...prev, newProduct]);
  };

  const removeProduct = (id: string) => {
    setFormProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleApproved = (id: string) => {
    setFormProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, approved: !p.approved } : p)),
    );
  };

  const toggleActive = (id: string) => {
    setFormProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
    );
  };

  // ─── Render: Product Modal ────────────────────────────────────────────────
  const renderProductModal = () => (
    <Modal visible={showProductModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.productModal}>
          <View style={styles.productModalHeader}>
            <Text style={styles.pickerTitle}>เลือกสินค้า</Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={MOCK_PRODUCTS.filter((p) => p.status === 'active')}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productItem}
                onPress={() => handleSelectProduct(item.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.productItemCode}>{item.code}</Text>
                  <Text style={styles.productItemName}>{item.name}</Text>
                </View>
                <Text style={styles.productItemPrice}>฿{item.salePrice}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );

  // ─── Render: Product Table ────────────────────────────────────────────────
  const renderProductTable = () => {
    if (formProducts.length === 0) return null;
    return (
      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: 40 }]}>ลำดับ</Text>
              <Text style={[styles.tableHeaderCell, { width: 70 }]}>สินค้า</Text>
              <Text style={[styles.tableHeaderCell, { width: 150 }]}>ชื่อสินค้า</Text>
              <Text style={[styles.tableHeaderCell, { width: 60 }]}>หน่วย</Text>
              <Text style={[styles.tableHeaderCell, { width: 100 }]}>หมายเหตุ</Text>
              <Text style={[styles.tableHeaderCell, { width: 60 }]}>อนุมัติ</Text>
              <Text style={[styles.tableHeaderCell, { width: 80 }]}>สถานะ</Text>
              <Text style={[styles.tableHeaderCell, { width: 40 }]}></Text>
            </View>
            {formProducts.map((item, idx) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 40 }]}>{idx + 1}</Text>
                <Text style={[styles.tableCell, { width: 70 }]}>{item.code}</Text>
                <Text style={[styles.tableCell, { width: 150 }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.tableCell, { width: 60 }]}>{item.unit}</Text>
                <TextInput
                  style={[styles.tableCellInput, { width: 100 }]}
                  value={item.remark}
                  onChangeText={(v) =>
                    setFormProducts((prev) =>
                      prev.map((p) => (p.id === item.id ? { ...p, remark: v } : p)),
                    )
                  }
                  placeholder="-"
                  placeholderTextColor={Colors.textDisabled}
                />
                <TouchableOpacity
                  style={[styles.tableCell, { width: 60, alignItems: 'center' }]}
                  onPress={() => toggleApproved(item.id)}
                >
                  <Ionicons
                    name={item.approved ? 'checkbox' : 'square-outline'}
                    size={18}
                    color={item.approved ? Colors.success : Colors.gray400}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusCell, { width: 80 }]}
                  onPress={() => toggleActive(item.id)}
                >
                  <Text style={[styles.statusText, item.active ? styles.statusActive : styles.statusInactive]}>
                    {item.active ? 'Y ใช้งาน' : 'N ไม่ใช้งาน'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tableCell, { width: 40, alignItems: 'center' }]}
                  onPress={() => removeProduct(item.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // ─── Render: Group Card ───────────────────────────────────────────────────
  const renderGroupCard = (group: PromoGroup) => (
    <TouchableOpacity
      key={group.id}
      style={styles.groupCard}
      onPress={() => startEdit(group)}
    >
      <View style={styles.groupCardHeader}>
        <Text style={styles.groupCardCode}>{group.code}</Text>
        <View style={[styles.statusBadge, group.status === 'active' ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, group.status === 'active' ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {group.status === 'active' ? 'Y' : 'N'}
          </Text>
        </View>
      </View>
      <Text style={styles.groupCardName}>{group.name}</Text>
      <Text style={styles.groupCardMeta}>จำนวนสินค้า: {group.products.length} รายการ</Text>
    </TouchableOpacity>
  );

  // ─── Render: List View ────────────────────────────────────────────────────
  const renderListView = () => (
    <>
      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="layers-outline" size={48} color={Colors.gray300} />
          <Text style={styles.emptyText}>ยังไม่มีกลุ่มสินค้าโปรโมชั่น</Text>
        </View>
      ) : (
        groups.map(renderGroupCard)
      )}
    </>
  );

  // ─── Render: Form View ────────────────────────────────────────────────────
  const renderFormView = () => (
    <>
      <Text style={styles.fieldLabel}>กลุ่มสินค้าโปรโมชั่น</Text>
      <TextInput
        style={[styles.input, styles.inputReadonly]}
        value={formCode}
        editable={false}
      />

      <Text style={styles.fieldLabel}>ชื่อกลุ่มสินค้าโปรโมชั่น *</Text>
      <TextInput
        style={styles.input}
        value={formName}
        onChangeText={setFormName}
        placeholder="กรอกชื่อกลุ่มสินค้า"
        placeholderTextColor={Colors.textDisabled}
      />

      <Text style={styles.fieldLabel}>ชื่อกลุ่มสินค้าโปรโมชั่น-EN</Text>
      <TextInput
        style={styles.input}
        value={formNameEN}
        onChangeText={setFormNameEN}
        placeholder="English name (optional)"
        placeholderTextColor={Colors.textDisabled}
      />

      <Text style={styles.fieldLabel}>หมายเหตุ</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={formRemark}
        onChangeText={setFormRemark}
        placeholder="หมายเหตุ (ถ้ามี)"
        placeholderTextColor={Colors.textDisabled}
        multiline
        numberOfLines={3}
      />

      <View style={styles.divider} />

      <Text style={styles.sectionHeader}>สินค้าในกลุ่ม</Text>

      <TouchableOpacity
        style={styles.selectBtn}
        onPress={() => setShowProductModal(true)}
      >
        <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
        <Text style={styles.selectBtnText}>เลือก</Text>
      </TouchableOpacity>

      {renderProductTable()}

      <View style={{ height: Spacing.lg }} />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>ยกเลิก</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="checkmark" size={18} color={Colors.white} />
          <Text style={styles.saveBtnText}>บันทึก</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={mode === 'list' ? onBack : handleCancel} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>จัดกลุ่มสินค้าโปรโมชั่น</Text>
        {mode === 'list' ? (
          <TouchableOpacity style={styles.createBtn} onPress={startCreate}>
            <Ionicons name="add" size={16} color={Colors.white} />
            <Text style={styles.createBtnText}>สร้างกลุ่มใหม่</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {mode === 'list' ? renderListView() : renderFormView()}
      </ScrollView>

      {/* Product Modal */}
      {renderProductModal()}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
  },
  createBtnText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Group card
  groupCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  groupCardCode: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  groupCardName: {
    ...Typography.body1,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  groupCardMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeActive: {
    backgroundColor: Colors.successLight,
  },
  badgeInactive: {
    backgroundColor: Colors.gray200,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  badgeTextActive: {
    color: Colors.success,
  },
  badgeTextInactive: {
    color: Colors.gray500,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },

  // Section & Divider
  sectionHeader: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.lg,
  },

  // Fields
  fieldLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body2,
    color: Colors.text,
    backgroundColor: Colors.white,
    minHeight: 44,
  },
  inputReadonly: {
    backgroundColor: Colors.gray100,
    color: Colors.textSecondary,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Select button
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  selectBtnText: {
    ...Typography.body2,
    color: Colors.white,
    fontWeight: '500',
  },

  // Table
  tableContainer: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    paddingVertical: Spacing.sm,
  },
  tableHeaderCell: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.xs,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  tableCell: {
    ...Typography.caption,
    color: Colors.text,
    paddingHorizontal: Spacing.xs,
    textAlign: 'center',
  },
  tableCellInput: {
    ...Typography.caption,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    textAlign: 'center',
    height: 30,
  },

  statusCell: {
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  statusActive: {
    color: Colors.success,
  },
  statusInactive: {
    color: Colors.gray500,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...Typography.button,
    color: Colors.white,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productModal: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  productModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  pickerTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  productItemCode: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  productItemName: {
    ...Typography.body2,
    color: Colors.text,
  },
  productItemPrice: {
    ...Typography.label,
    color: Colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
  },
});
