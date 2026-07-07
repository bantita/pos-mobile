import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput } from '@/shared/tw/index';
import { Modal, Switch } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { Category, Brand } from '@/features/product/domain/product';
import { MOCK_CATEGORIES, MOCK_BRANDS } from '@/features/product/data/mocks/mockProducts';
import { cn } from '@/shared/lib/cn';

interface CategoryManageScreenProps {
  onBack: () => void;
}

type Tab = 'category' | 'brand';

export const CategoryManageScreen: React.FC<CategoryManageScreenProps> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('category');
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(MOCK_BRANDS);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Category | Brand | null>(null);
  const [formName, setFormName] = useState('');
  const [formActive, setFormActive] = useState(true);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState('');

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
    if (!formName.trim()) { setAlertTitle('กรุณากรอกชื่อ'); setAlertMessage(''); setAlertVisible(true); return; }
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
      setAlertTitle('ไม่สามารถลบได้');
      setAlertMessage(`"${name}" มีสินค้า ${count} รายการอยู่ กรุณาย้ายสินค้าออกก่อน`);
      setAlertVisible(true);
      return;
    }
    setConfirmDeleteId(id);
    setConfirmDeleteName(name);
    setConfirmVisible(true);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      if (tab === 'category') setCategories((prev) => prev.filter((c) => c.id !== confirmDeleteId));
      else setBrands((prev) => prev.filter((b) => b.id !== confirmDeleteId));
    }
    setConfirmVisible(false);
    setConfirmDeleteId(null);
    setConfirmDeleteName('');
  };

  const data = tab === 'category' ? categories : brands;

  const renderItem = ({ item }: { item: Category | Brand }) => (
    <View className={cn('flex-row items-center gap-2 bg-white rounded-2xl p-3 shadow-sm')}>
      <View className={cn('w-11 h-11 rounded-xl items-center justify-center bg-rose-50')}>
        <Ionicons
          name={tab === 'category' ? 'list-outline' : 'pricetag-outline'}
          size={20}
          color="#f87171"
        />
      </View>
      <View className={cn('flex-1')}>
        <Text className={cn('text-xs font-bold text-slate-950')}>{item.name}</Text>
        <Text className={cn('text-xs text-slate-500 font-medium')}>{item.productCount} สินค้า</Text>
      </View>
      <View className={cn('rounded-lg px-[6px] py-[2px]', item.status === 'active' ? 'bg-emerald-100' : 'bg-neutral-100')}>
        <Text className={cn('text-xs font-bold', item.status === 'active' ? 'text-emerald-600' : 'text-gray-500')}>
          {item.status === 'active' ? 'ใช้งาน' : 'ปิดใช้'}
        </Text>
      </View>
      <View className={cn('flex-row gap-1')}>
        <TouchableOpacity className={cn('w-10 h-10 rounded-lg bg-rose-50 items-center justify-center')} onPress={() => openEdit(item)}>
          <Ionicons name="pencil-outline" size={18} color="#f87171" />
        </TouchableOpacity>
        <TouchableOpacity
          className={cn('w-10 h-10 rounded-lg items-center justify-center', item.status === 'active' ? 'bg-amber-100' : 'bg-emerald-100')}
          onPress={() => handleToggleStatus(item.id)}
        >
          <Ionicons
            name={item.status === 'active' ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={item.status === 'active' ? '#a16207' : '#0f766e'}
          />
        </TouchableOpacity>
        <TouchableOpacity className={cn('w-10 h-10 rounded-lg bg-rose-50 items-center justify-center')}
          onPress={() => handleDelete(item.id, item.name, item.productCount)}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center justify-between bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-extrabold text-white')}>หมวดหมู่และ Brand</Text>
        <View style={{ width: 40 }} />
      </View>

      <View className={cn('flex-row bg-white border-b border-slate-200')}>
        {([['category', 'list-outline', 'หมวดหมู่'], ['brand', 'pricetag-outline', 'Brand']] as const).map(([key, icon, label]) => (
          <TouchableOpacity
            key={key}
            className={cn('flex-1 flex-row items-center justify-center gap-1 py-3 border-b-2 border-transparent', tab === key && 'border-b-rose-500')}
            onPress={() => setTab(key)}
          >
            <Ionicons name={icon} size={16} color={tab === key ? '#f87171' : '#9ca3af'} />
            <Text className={cn('text-xs font-semibold text-slate-500', tab === key && 'text-rose-600 font-bold')}>{label}</Text>
            <View className={cn('bg-neutral-100 rounded-full px-[6px] py-[1px]', tab === key && 'bg-rose-500')}>
              <Text className={cn('text-xs font-bold text-gray-500', tab === key && 'text-white')}>
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
        contentContainerClassName={cn('p-3 gap-2 pb-20')}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center pt-20 gap-3')}>
            <Ionicons name={tab === 'category' ? 'list-outline' : 'pricetag-outline'} size={56} color="#d1d5db" />
            <Text className={cn('text-xl font-semibold text-gray-300')}>ยังไม่มี{tab === 'category' ? 'หมวดหมู่' : 'Brand'}</Text>
          </View>
        }
      />

      <TouchableOpacity className={cn('absolute bottom-5 right-5 w-14 h-14 rounded-full bg-rose-500 items-center justify-center shadow-sm')}
        onPress={openAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fafafa" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View className={cn('flex-1 justify-end', 'bg-black/50')}>
          <View className={cn('bg-white rounded-t-[24px] p-4 gap-3')}>
            <View className={cn('w-10 h-1 bg-gray-200 rounded-[2px] self-center mb-1')} />
            <Text className={cn('text-lg font-bold text-slate-950')}>
              {editItem ? 'แก้ไข' : 'เพิ่ม'}{tab === 'category' ? 'หมวดหมู่' : 'Brand'}
            </Text>
            <Text className={cn('text-xs font-bold text-gray-700')}>ชื่อ *</Text>
            <TextInput
              className={cn('bg-rose-50 rounded-xl border border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950 font-medium')}
              value={formName}
              onChangeText={setFormName}
              placeholder={`กรอกชื่อ${tab === 'category' ? 'หมวดหมู่' : 'Brand'}`}
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            <View className={cn('flex-row items-center justify-between')}>
              <Text className={cn('text-xs font-bold text-slate-950')}>เปิดใช้งาน</Text>
              <Switch
                value={formActive}
                onValueChange={setFormActive}
              />
            </View>
            <View className={cn('flex-row gap-2')}>
              <TouchableOpacity className={cn('flex-1 items-center py-3 rounded-xl border border-slate-200')} onPress={() => setShowModal(false)}>
                <Text className={cn('text-base font-bold text-slate-500')}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity className={cn('flex-[2] flex-row items-center justify-center gap-1 bg-rose-500 rounded-xl py-3')} onPress={handleSave}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fafafa" />
                <Text className={cn('text-base font-bold text-white')}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertDialog
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertTitle}
        message={alertMessage}
        variant="warning"
      />

      <ConfirmModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        title="ยืนยันลบ"
        message={`ต้องการลบ "${confirmDeleteName}"?`}
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
};
