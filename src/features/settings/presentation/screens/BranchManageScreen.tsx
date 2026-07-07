import React, { useState } from 'react';
import { FlatList, Modal } from 'react-native';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { usePermission } from '@/shared/hooks/usePermission';
import { usePermissionStore } from '@/features/settings/application/stores/permissionStore';
import { PermissionGuard } from '@/features/settings/presentation/components/PermissionGuard';

interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  taxId: string;
  phone: string;
  manager: string;
  posCount: number;
  status: 'active' | 'inactive';
}

const MOCK_BRANCHES: Branch[] = [
  {
    id: 'br_001',
    code: 'HQ',
    name: 'สาขาหลัก (สำนักงานใหญ่)',
    address: '123 ถ.รัชดาภิเษก แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',
    taxId: '0105556123456',
    phone: '02-123-4567',
    manager: 'มานี ผู้จัดการ',
    posCount: 3,
    status: 'active',
  },
  {
    id: 'br_002',
    code: 'LPL',
    name: 'สาขาลาดพร้าว',
    address: '456 ถ.ลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900',
    taxId: '0105556123456',
    phone: '02-234-5678',
    manager: 'สมหญิง รองสาขา',
    posCount: 2,
    status: 'active',
  },
  {
    id: 'br_003',
    code: 'NBR',
    name: 'สาขานนทบุรี',
    address: '789 ถ.นนทบุรี ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
    taxId: '0105556123456',
    phone: '02-345-6789',
    manager: 'วิโรจน์ สาขา',
    posCount: 1,
    status: 'inactive',
  },
];

interface BranchManageScreenProps {
  onBack: () => void;
}

const EMPTY_BRANCH: Omit<Branch, 'id' | 'posCount'> = {
  code: '', name: '', address: '', taxId: '', phone: '', manager: '', status: 'active',
};

export const BranchManageScreen: React.FC<BranchManageScreenProps> = ({ onBack }) => {
  const { isOwner, isAdmin } = usePermission();
  const { addAuditLog, currentRole } = usePermissionStore();
  const canEdit = isOwner || isAdmin;

  const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Branch | null>(null);
  const [form, setForm] = useState<Omit<Branch, 'id' | 'posCount'>>(EMPTY_BRANCH);

  const [alertDialog, setAlertDialog] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_BRANCH);
    setModalVisible(true);
  };

  const openEdit = (branch: Branch) => {
    setEditTarget(branch);
    const { id, posCount, ...rest } = branch;
    setForm(rest);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.code || !form.name) {
      setAlertDialog({ visible: true, title: 'ข้อผิดพลาด', message: 'กรุณากรอกรหัสสาขาและชื่อสาขา' });
      return;
    }
    if (editTarget) {
      setBranches((prev) =>
        prev.map((b) => (b.id === editTarget.id ? { ...editTarget, ...form } : b))
      );
      addAuditLog({
        userId: 'usr_001',
        userName: 'สมชาย เจ้าของร้าน',
        userRole: currentRole,
        action: 'BRANCH_EDIT',
        module: 'settings',
        description: `แก้ไขสาขา: ${form.name}`,
        beforeValue: `ชื่อ: ${editTarget.name}`,
        afterValue: `ชื่อ: ${form.name}`,
      });
    } else {
      const newBranch: Branch = {
        ...form,
        id: `br_${Date.now()}`,
        posCount: 0,
      };
      setBranches((prev) => [...prev, newBranch]);
      addAuditLog({
        userId: 'usr_001',
        userName: 'สมชาย เจ้าของร้าน',
        userRole: currentRole,
        action: 'BRANCH_ADD',
        module: 'settings',
        description: `เพิ่มสาขาใหม่: ${form.name} (${form.code})`,
      });
    }
    setModalVisible(false);
  };

  const renderBranch = ({ item }: { item: Branch }) => (
    <View className={cn('bg-white rounded-2xl p-3 gap-2 shadow-sm')}>
      <View className={cn('flex-row items-center gap-2')}>
        <View className={cn('bg-slate-100 rounded-xl px-2 py-1 min-w-[44px] items-center')}>
          <Text className={cn('text-sm font-bold text-rose-500')}>{item.code}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-xs font-bold text-slate-950')}>{item.name}</Text>
          <Text className={cn('text-xs font-medium text-slate-600')}>
            <Ionicons name="person-outline" size={11} /> {item.manager}
          </Text>
        </View>
        <View className={cn('rounded-xl px-2 py-0.5', item.status === 'active' ? 'bg-emerald-100' : 'bg-slate-100')}>
          <Text className={cn('text-xs font-bold')} style={{ color: item.status === 'active' ? '#0f766e' : '#57534e' }}>
            {item.status === 'active' ? 'เปิด' : 'ปิด'}
          </Text>
        </View>
        <PermissionGuard module="settings" action="edit">
          <TouchableOpacity onPress={() => openEdit(item)} className={cn('p-1')}>
            <Ionicons name="create-outline" size={18} color="#f87171" />
          </TouchableOpacity>
        </PermissionGuard>
      </View>
      <Text className={cn('text-xs font-medium text-slate-600')}>
        <Ionicons name="location-outline" size={12} /> {item.address}
      </Text>
      <View className={cn('flex-row gap-3')}>
        <View className={cn('flex-row items-center gap-1')}>
          <Ionicons name="call-outline" size={12} color="#57534e" />
          <Text className={cn('text-xs font-medium text-slate-600')}>{item.phone}</Text>
        </View>
        <View className={cn('flex-row items-center gap-1')}>
          <Ionicons name="desktop-outline" size={12} color="#57534e" />
          <Text className={cn('text-xs font-medium text-slate-600')}>{item.posCount} จุดขาย</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 flex-row items-center gap-2 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>จัดการสาขา</Text>
          <Text className={cn('text-xs font-medium text-rose-100')}>{branches.length} สาขา</Text>
        </View>
        <Ionicons name="business-outline" size={24} color="#fecdd3" />
      </View>

      <FlatList
        data={branches}
        keyExtractor={(i) => i.id}
        renderItem={renderBranch}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 24 }} />}
      />

      <PermissionGuard module="settings" action="add">
        <TouchableOpacity className={cn('absolute bottom-7 right-5 w-14 h-14 rounded-full bg-rose-600 items-center justify-center shadow-sm')}
          onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#fafafa" />
        </TouchableOpacity>
      </PermissionGuard>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className={cn('flex-1 bg-black/40 justify-end')}>
          <View className={cn('bg-white rounded-t-2xl p-4 max-h-[85%]')}>
            <View className={cn('flex-row justify-between items-center mb-3')}>
              <Text className={cn('text-lg font-extrabold text-slate-950')}>{editTarget ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#292524" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'code', label: 'รหัสสาขา *', placeholder: 'เช่น HQ, BKK01' },
                { key: 'name', label: 'ชื่อสาขา *', placeholder: 'ชื่อสาขา' },
                { key: 'address', label: 'ที่อยู่', placeholder: 'ที่อยู่สาขา' },
                { key: 'taxId', label: 'เลขผู้เสียภาษี', placeholder: '0000000000000' },
                { key: 'phone', label: 'เบอร์โทร', placeholder: '02-xxx-xxxx' },
                { key: 'manager', label: 'ผู้จัดการสาขา', placeholder: 'ชื่อผู้จัดการ' },
              ].map((f) => (
                <View key={f.key} className={cn('mb-3')}>
                  <Text className={cn('text-xs font-bold text-slate-600 mb-1.5')}>{f.label}</Text>
                  <TextInput
                    className={cn('bg-white border border-slate-200 rounded-xl px-3 py-3 text-base font-medium text-slate-950')}
                    value={form[f.key as keyof typeof form] as string}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
                    placeholder={f.placeholder}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              ))}
              <View className={cn('mb-3')}>
                <Text className={cn('text-xs font-bold text-slate-600 mb-1.5')}>สถานะ</Text>
                <View className={cn('flex-row gap-2')}>
                  {(['active', 'inactive'] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      className={cn('min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 py-2.5', form.status === s && 'bg-rose-500 border-rose-500')}
                      onPress={() => setForm((prev) => ({ ...prev, status: s }))}
                    >
                      <Text className={cn('text-xs font-bold text-slate-950', form.status === s && 'text-white')}>
                        {s === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity className={cn('bg-rose-500 rounded-xl py-3 items-center mt-3 shadow-sm')} onPress={handleSave}>
              <Text className={cn('text-base font-bold text-white')}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AlertDialog
        visible={alertDialog.visible}
        title={alertDialog.title}
        message={alertDialog.message}
        variant="warning"
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        onConfirm={() => setAlertDialog({ visible: false, title: '', message: '' })}
      />
    </SafeAreaView>
  );
};
