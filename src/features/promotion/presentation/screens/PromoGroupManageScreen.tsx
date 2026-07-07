import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList } from '@/shared/tw/index';
import { Modal } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { MOCK_PRODUCTS } from '@/features/product/data/mocks/mockProducts';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

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

const INITIAL_GROUPS: PromoGroup[] = [
  {
    id: 'pg-001',
    code: 'AutoRunCode_10',
    name: 'โปรเด็ก(แกดพล)',
    nameEN: '',
    remark: '',
    products: [
      { id: 'pgp-1', productId: 'H00001', code: 'H00001', name: "บริการตัดผมชาย Men's Hair Cut", unit: 'ครั้ง', remark: '', approved: true, active: true },
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

export const PromoGroupManageScreen: React.FC<Props> = ({ onBack }) => {
  const [groups, setGroups] = useState<PromoGroup[]>(INITIAL_GROUPS);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingGroup, setEditingGroup] = useState<PromoGroup | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formNameEN, setFormNameEN] = useState('');
  const [formRemark, setFormRemark] = useState('');
  const [formProducts, setFormProducts] = useState<PromoGroupProduct[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; variant: 'info' | 'success' | 'warning' | 'danger'; onConfirm?: () => void }>({ visible: false, title: '', message: '', variant: 'info' });

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
      setAlert({ visible: true, title: 'กรุณากรอกข้อมูล', message: 'ชื่อกลุ่มสินค้าโปรโมชั่นจำเป็นต้องกรอก', variant: 'warning' });
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
      setAlert({ visible: true, title: 'บันทึกสำเร็จ', message: 'สร้างกลุ่มสินค้าโปรโมชั่นเรียบร้อย', variant: 'success' });
    } else if (mode === 'edit' && editingGroup) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === editingGroup.id
            ? { ...g, name: formName, nameEN: formNameEN, remark: formRemark, products: formProducts }
            : g,
        ),
      );
      setAlert({ visible: true, title: 'บันทึกสำเร็จ', message: 'แก้ไขกลุ่มสินค้าโปรโมชั่นเรียบร้อย', variant: 'success' });
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

  const renderProductModal = () => (
    <Modal visible={showProductModal} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
        <View className={cn('bg-white rounded-2xl overflow-hidden shadow-sm')} style={{ width: '90%', maxHeight: '70%' }}>
          <View className={cn('flex-row justify-between items-center p-3 border-b border-slate-100')}>
            <Text className={cn('text-lg font-extrabold text-slate-950')}>เลือกสินค้า</Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <Ionicons name="close" size={24} color="#292524" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={MOCK_PRODUCTS.filter((p) => p.status === 'active')}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={cn('flex-row items-center px-3 py-2')}
                onPress={() => handleSelectProduct(item.id)}
              >
                <View className={cn('flex-1')}>
                  <Text className={cn('text-xs font-medium text-slate-600')}>{item.code}</Text>
                  <Text className={cn('text-sm font-medium text-slate-950')}>{item.name}</Text>
                </View>
                <Text className={cn('text-xs font-bold text-rose-500')}>฿{item.salePrice}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#ffe4e6' }} />}
          />
        </View>
      </View>
    </Modal>
  );

  const renderProductTable = () => {
    if (formProducts.length === 0) return null;
    return (
      <View className={cn('mt-3 border border-slate-200 rounded-xl overflow-hidden shadow-sm')}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View className={cn('flex-row bg-neutral-100 py-2')}>
              <Text className={cn('text-xs font-bold text-slate-600 text-center')} style={{ width: 40, paddingHorizontal: 2 }}>ลำดับ</Text>
              <Text className={cn('text-xs font-bold text-slate-600 text-center')} style={{ width: 70, paddingHorizontal: 2 }}>สินค้า</Text>
              <Text className={cn('text-xs font-bold text-slate-600 text-center')} style={{ width: 150, paddingHorizontal: 2 }}>ชื่อสินค้า</Text>
              <Text className={cn('text-xs font-bold text-slate-600 text-center')} style={{ width: 60, paddingHorizontal: 2 }}>หน่วย</Text>
              <Text className={cn('text-xs font-bold text-slate-600 text-center')} style={{ width: 100, paddingHorizontal: 2 }}>หมายเหตุ</Text>
              <Text className={cn('text-xs font-bold text-slate-600 text-center')} style={{ width: 60, paddingHorizontal: 2 }}>อนุมัติ</Text>
              <Text className={cn('text-xs font-bold text-slate-600 text-center')} style={{ width: 80, paddingHorizontal: 2 }}>สถานะ</Text>
              <View style={{ width: 40, paddingHorizontal: 2 }} />
            </View>
            {formProducts.map((item, idx) => (
              <View key={item.id} className={cn('flex-row items-center py-2 border-t border-slate-100')}>
                <Text className={cn('text-xs font-medium text-slate-950 text-center')} style={{ width: 40, paddingHorizontal: 2 }}>{idx + 1}</Text>
                <Text className={cn('text-xs font-medium text-slate-950 text-center')} style={{ width: 70, paddingHorizontal: 2 }}>{item.code}</Text>
                <Text className={cn('text-xs font-medium text-slate-950 text-center')} style={{ width: 150, paddingHorizontal: 2 }} numberOfLines={1}>{item.name}</Text>
                <Text className={cn('text-xs font-medium text-slate-950 text-center')} style={{ width: 60, paddingHorizontal: 2 }}>{item.unit}</Text>
                <TextInput
                  style={{ width: 100, paddingHorizontal: 4, paddingVertical: 2, textAlign: 'center', height: 30 }}
                  className={cn('text-xs font-medium text-slate-950 border border-slate-200 rounded-xl')}
                  value={item.remark}
                  onChangeText={(v) =>
                    setFormProducts((prev) =>
                      prev.map((p) => (p.id === item.id ? { ...p, remark: v } : p)),
                    )
                  }
                  placeholder="-"
                  placeholderTextColor="#57534e"
                />
                <TouchableOpacity
                  style={{ width: 60, paddingHorizontal: 2, alignItems: 'center' }}
                  onPress={() => toggleApproved(item.id)}
                >
                  <Ionicons
                    name={item.approved ? 'checkbox' : 'square-outline'}
                    size={18}
                    color={item.approved ? '#0f766e' : '#9ca3af'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ width: 80, paddingHorizontal: 2, alignItems: 'center' }}
                  onPress={() => toggleActive(item.id)}
                >
                  <Text className={cn('text-xs font-medium')} style={{ color: item.active ? '#0f766e' : '#6b7280' }}>
                    {item.active ? 'Y ใช้งาน' : 'N ไม่ใช้งาน'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ width: 40, paddingHorizontal: 2, alignItems: 'center' }}
                  onPress={() => removeProduct(item.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderGroupCard = (group: PromoGroup) => (
    <TouchableOpacity
      key={group.id}
      className={cn('bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-3')}
      onPress={() => startEdit(group)}
    >
      <View className={cn('flex-row justify-between items-center mb-1')}>
        <Text className={cn('text-xs font-bold text-slate-600')}>{group.code}</Text>
        <View className={cn('px-2 rounded-full py-0.5')} style={{ backgroundColor: group.status === 'active' ? '#d1fae5' : '#e5e7eb' }}>
          <Text className={cn('text-xs font-bold')} style={{ color: group.status === 'active' ? '#0f766e' : '#6b7280' }}>
            {group.status === 'active' ? 'Y' : 'N'}
          </Text>
        </View>
      </View>
      <Text className={cn('text-base font-extrabold text-slate-950 mb-1')}>{group.name}</Text>
      <Text className={cn('text-xs font-medium text-slate-600')}>จำนวนสินค้า: {group.products.length} รายการ</Text>
    </TouchableOpacity>
  );

  const renderListView = () => (
    <>
      {groups.length === 0 ? (
        <View className={cn('items-center justify-center py-12 gap-3')}>
          <Ionicons name="layers-outline" size={48} color="#d1d5db" />
          <Text className={cn('text-sm font-medium text-slate-600')}>ยังไม่มีกลุ่มสินค้าโปรโมชั่น</Text>
        </View>
      ) : (
        groups.map(renderGroupCard)
      )}
    </>
  );

  const renderFormView = () => (
    <>
      <Text className={cn('text-xs font-bold text-slate-600 mt-2 mb-1')}>กลุ่มสินค้าโปรโมชั่น</Text>
      <TextInput
        className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium bg-neutral-100 text-slate-600 shadow-sm')}
        style={{ minHeight: 44 }}
        value={formCode}
        editable={false}
      />

      <Text className={cn('text-xs font-bold text-slate-600 mt-2 mb-1')}>ชื่อกลุ่มสินค้าโปรโมชั่น *</Text>
      <TextInput
        className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white shadow-sm')}
        style={{ minHeight: 44 }}
        value={formName}
        onChangeText={setFormName}
        placeholder="กรอกชื่อกลุ่มสินค้า"
        placeholderTextColor="#57534e"
      />

      <Text className={cn('text-xs font-bold text-slate-600 mt-2 mb-1')}>ชื่อกลุ่มสินค้าโปรโมชั่น-EN</Text>
      <TextInput
        className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white shadow-sm')}
        style={{ minHeight: 44 }}
        value={formNameEN}
        onChangeText={setFormNameEN}
        placeholder="English name (optional)"
        placeholderTextColor="#57534e"
      />

      <Text className={cn('text-xs font-bold text-slate-600 mt-2 mb-1')}>หมายเหตุ</Text>
      <TextInput
        className={cn('border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-950 bg-white shadow-sm')}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
        value={formRemark}
        onChangeText={setFormRemark}
        placeholder="หมายเหตุ (ถ้ามี)"
        placeholderTextColor="#57534e"
        multiline
        numberOfLines={3}
      />

      <View className={cn('h-px bg-rose-100 my-4')} />

      <Text className={cn('text-lg font-extrabold text-slate-950 mb-3')}>สินค้าในกลุ่ม</Text>

      <TouchableOpacity
        className={cn('flex-row items-center gap-1 bg-rose-600 px-3 py-2 rounded-xl self-start shadow-lg shadow-rose-500/40')}
        onPress={() => setShowProductModal(true)}
      >
        <Ionicons name="add-circle-outline" size={18} color="#fafafa" />
        <Text className={cn('text-sm font-bold text-white')}>เลือก</Text>
      </TouchableOpacity>

      {renderProductTable()}

      <View className={cn('h-4')} />

      <View className={cn('flex-row gap-3 mt-4')}>
        <TouchableOpacity className={cn('flex-1 border border-slate-200 rounded-xl py-3 items-center justify-center bg-white shadow-sm')} onPress={handleCancel}>
          <Text className={cn('text-base font-bold text-slate-600')}>ยกเลิก</Text>
        </TouchableOpacity>
        <TouchableOpacity className={cn('flex-1 flex-row gap-1 bg-rose-600 rounded-xl py-3 items-center justify-center shadow-lg shadow-rose-500/40')} onPress={handleSave}>
          <Ionicons name="checkmark" size={18} color="#fafafa" />
          <Text className={cn('text-base font-bold text-white')}>บันทึก</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')}>
      <View className={cn('flex-row items-center justify-between px-3 py-2 bg-rose-600 shadow-sm')}>
        <TouchableOpacity onPress={mode === 'list' ? onBack : handleCancel} className={cn('w-10 h-10 items-center justify-center')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white flex-1 text-center')}>จัดกลุ่มสินค้าโปรโมชั่น</Text>
        {mode === 'list' ? (
          <TouchableOpacity className={cn('flex-row items-center gap-1 bg-white/20 px-4 py-2.5 rounded-xl min-h-10')} onPress={startCreate}>
            <Ionicons name="add" size={16} color="#fafafa" />
            <Text className={cn('text-xs font-bold text-white')}>สร้างกลุ่มใหม่</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView className={cn('flex-1')} contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
        {mode === 'list' ? renderListView() : renderFormView()}
      </ScrollView>

      {renderProductModal()}

      <AlertDialog
        visible={alert.visible}
        onClose={() => setAlert({ ...alert, visible: false })}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
        confirmLabel="ตกลง"
        onConfirm={alert.onConfirm}
      />
    </SafeAreaView>
  );
};
