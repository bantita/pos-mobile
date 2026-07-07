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

interface POSDevice {
  id: string;
  code: string;
  name: string;
  branchId: string;
  branchName: string;
  prefix: string;
  runningNumber: number;
  printerType: 'bluetooth' | 'wifi' | 'usb' | 'none';
  printerStatus: 'connected' | 'disconnected';
  receiptTemplate: 'simple' | 'full' | 'tax_invoice';
  assignedUsers: string[];
  status: 'active' | 'inactive';
}

const MOCK_POS: POSDevice[] = [
  {
    id: 'pos_001',
    code: 'POS-001',
    name: 'เคาน์เตอร์หลัก',
    branchId: 'br_001',
    branchName: 'สาขาหลัก',
    prefix: 'INV',
    runningNumber: 1087,
    printerType: 'bluetooth',
    printerStatus: 'connected',
    receiptTemplate: 'full',
    assignedUsers: ['มานี ผู้จัดการ', 'สุดา แคชเชียร์'],
    status: 'active',
  },
  {
    id: 'pos_002',
    code: 'POS-002',
    name: 'เคาน์เตอร์สำรอง',
    branchId: 'br_001',
    branchName: 'สาขาหลัก',
    prefix: 'INV',
    runningNumber: 245,
    printerType: 'wifi',
    printerStatus: 'disconnected',
    receiptTemplate: 'simple',
    assignedUsers: ['สุดา แคชเชียร์'],
    status: 'active',
  },
  {
    id: 'pos_003',
    code: 'POS-003',
    name: 'จุดขาย LPL',
    branchId: 'br_002',
    branchName: 'สาขาลาดพร้าว',
    prefix: 'LPL',
    runningNumber: 512,
    printerType: 'usb',
    printerStatus: 'connected',
    receiptTemplate: 'tax_invoice',
    assignedUsers: ['วิชัย พนักงานคลัง'],
    status: 'active',
  },
];

const PRINTER_ICONS: Record<string, string> = {
  bluetooth: 'bluetooth-outline',
  wifi: 'wifi-outline',
  usb: 'hardware-chip-outline',
  none: 'print-outline',
};

const TEMPLATE_LABELS: Record<string, string> = {
  simple: 'Simple',
  full: 'Full (พร้อม VAT)',
  tax_invoice: 'ใบกำกับภาษี',
};

interface POSManageScreenProps {
  onBack: () => void;
}

const EMPTY_POS: Omit<POSDevice, 'id' | 'runningNumber'> = {
  code: '',
  name: '',
  branchId: 'br_001',
  branchName: 'สาขาหลัก',
  prefix: 'INV',
  printerType: 'bluetooth',
  printerStatus: 'disconnected',
  receiptTemplate: 'simple',
  assignedUsers: [],
  status: 'active',
};

export const POSManageScreen: React.FC<POSManageScreenProps> = ({ onBack }) => {
  const { isOwner, isAdmin, isManager } = usePermission();
  const { addAuditLog, currentRole } = usePermissionStore();
  const canEdit = isOwner || isAdmin || isManager;

  const [posList, setPosList] = useState<POSDevice[]>(MOCK_POS);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<POSDevice | null>(null);
  const [form, setForm] = useState<Omit<POSDevice, 'id' | 'runningNumber'>>(EMPTY_POS);

  const [alertDialog, setAlertDialog] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_POS);
    setModalVisible(true);
  };

  const openEdit = (pos: POSDevice) => {
    setEditTarget(pos);
    const { id, runningNumber, ...rest } = pos;
    setForm(rest);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.code || !form.name) {
      setAlertDialog({ visible: true, title: 'ข้อผิดพลาด', message: 'กรุณากรอกรหัสและชื่อ POS' });
      return;
    }
    if (editTarget) {
      setPosList((prev) =>
        prev.map((p) => (p.id === editTarget.id ? { ...editTarget, ...form } : p))
      );
      addAuditLog({
        userId: 'usr_001',
        userName: 'สมชาย เจ้าของร้าน',
        userRole: currentRole,
        action: 'POS_EDIT',
        module: 'settings',
        description: `แก้ไข POS: ${form.name}`,
      });
    } else {
      const newPos: POSDevice = { ...form, id: `pos_${Date.now()}`, runningNumber: 1 };
      setPosList((prev) => [...prev, newPos]);
      addAuditLog({
        userId: 'usr_001',
        userName: 'สมชาย เจ้าของร้าน',
        userRole: currentRole,
        action: 'POS_ADD',
        module: 'settings',
        description: `เพิ่ม POS ใหม่: ${form.name} (${form.code})`,
      });
    }
    setModalVisible(false);
  };

  const renderPOS = ({ item }: { item: POSDevice }) => (
    <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
      <View className={cn('flex-row items-center gap-2')}>
        <View className={cn('flex-row items-center gap-1 bg-slate-100 rounded-xl px-2 py-1')}>
          <Ionicons name="desktop-outline" size={14} color="#f87171" />
          <Text className={cn('text-xs font-bold text-rose-500')}>{item.code}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-xs font-bold text-slate-950')}>{item.name}</Text>
          <Text className={cn('text-xs font-medium text-slate-600')}>{item.branchName}</Text>
        </View>
        <View className={cn('flex-row items-center gap-1 rounded-xl px-1.5 py-0.5', item.printerStatus === 'connected' ? 'bg-emerald-100' : 'bg-slate-100')}>
          <Ionicons
            name={PRINTER_ICONS[item.printerType] as any}
            size={12}
            color={item.printerStatus === 'connected' ? '#0f766e' : '#9ca3af'}
          />
          <Text style={[{ color: item.printerStatus === 'connected' ? '#0f766e' : '#9ca3af' }]} className={cn('text-xs font-bold')}>
            {item.printerStatus === 'connected' ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
          </Text>
        </View>
      </View>

      <View className={cn('flex-row gap-3')}>
        <View className={cn('flex-row items-center gap-1')}>
          <Ionicons name="document-text-outline" size={12} color="#57534e" />
          <Text className={cn('text-xs font-medium text-slate-600')}>Prefix: {item.prefix}-{String(item.runningNumber).padStart(5, '0')}</Text>
        </View>
        <View className={cn('flex-row items-center gap-1')}>
          <Ionicons name="receipt-outline" size={12} color="#57534e" />
          <Text className={cn('text-xs font-medium text-slate-600')}>{TEMPLATE_LABELS[item.receiptTemplate]}</Text>
        </View>
      </View>

      <View className={cn('flex-row items-start gap-1')}>
        <Ionicons name="people-outline" size={12} color="#57534e" />
        <Text className={cn('text-xs font-medium text-slate-600')}>{item.assignedUsers.join(', ') || 'ยังไม่ได้กำหนดผู้ใช้'}</Text>
      </View>

        <PermissionGuard module="settings" action="edit">
          <TouchableOpacity className={cn('min-h-10 flex-row items-center gap-1 self-end rounded-xl border border-rose-500 px-3 py-2')} onPress={() => openEdit(item)}>
            <Ionicons name="create-outline" size={14} color="#f87171" />
            <Text className={cn('text-xs font-medium text-rose-500')}>แก้ไข</Text>
          </TouchableOpacity>
        </PermissionGuard>
    </View>
  );

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>จัดการจุดขาย (POS)</Text>
          <Text className={cn('text-xs font-medium text-rose-100')}>{posList.length} เครื่อง</Text>
        </View>
        <Ionicons name="desktop-outline" size={24} color="#fecdd3" />
      </View>

      <FlatList
        data={posList}
        keyExtractor={(i) => i.id}
        renderItem={renderPOS}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 24 }} />}
      />

      <PermissionGuard module="settings" action="add">
        <TouchableOpacity className={cn('absolute bottom-7 right-5 w-14 h-14 rounded-full bg-rose-600 items-center justify-center shadow-sm')} onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#fafafa" />
        </TouchableOpacity>
      </PermissionGuard>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className={cn('flex-1 justify-end')} style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className={cn('bg-white rounded-t-2xl p-4')} style={{ maxHeight: '85%' }}>
            <View className={cn('flex-row justify-between items-center mb-3')}>
              <Text className={cn('text-lg font-extrabold text-slate-950')}>{editTarget ? 'แก้ไข POS' : 'เพิ่ม POS ใหม่'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#292524" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'code', label: 'รหัส POS *', placeholder: 'POS-001' },
                { key: 'name', label: 'ชื่อจุดขาย *', placeholder: 'เคาน์เตอร์หลัก' },
                { key: 'prefix', label: 'Prefix เอกสาร', placeholder: 'INV' },
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
                <Text className={cn('text-xs font-bold text-slate-600 mb-1.5')}>ประเภทเครื่องพิมพ์</Text>
                <View className={cn('flex-row flex-wrap gap-1')}>
                  {(['bluetooth', 'wifi', 'usb', 'none'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      className={cn('min-h-10 items-center justify-center rounded-xl border border-slate-200 px-3 py-2', form.printerType === t && 'bg-rose-500 border-rose-500')}
                      onPress={() => setForm((prev) => ({ ...prev, printerType: t }))}
                    >
                      <Text className={cn('text-xs font-bold', form.printerType === t ? 'text-white' : 'text-slate-600')}>
                        {t === 'none' ? 'ไม่มี' : t.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className={cn('mb-3')}>
                <Text className={cn('text-xs font-bold text-slate-600 mb-1.5')}>Template ใบเสร็จ</Text>
                <View className={cn('flex-row flex-wrap gap-1')}>
                  {(['simple', 'full', 'tax_invoice'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      className={cn('min-h-10 items-center justify-center rounded-xl border border-slate-200 px-3 py-2', form.receiptTemplate === t && 'bg-rose-500 border-rose-500')}
                      onPress={() => setForm((prev) => ({ ...prev, receiptTemplate: t }))}
                    >
                      <Text className={cn('text-xs font-bold', form.receiptTemplate === t ? 'text-white' : 'text-slate-600')}>
                        {TEMPLATE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity className={cn('bg-rose-500 rounded-xl py-3 items-center mt-2 shadow-sm')} onPress={handleSave}>
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
