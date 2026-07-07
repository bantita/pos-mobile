import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { useSyncStore } from '@/features/sync/application/stores/syncStore';
import { ConflictResolution, ENTITY_LABELS, ENTITY_ICONS } from '@/features/sync/domain/sync';
import { formatDateTime } from '@/shared/lib/format';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { Text, TextInput } from '@/shared/tw/index';

interface Props {
  onBack: () => void;
  onResolved: () => void;
}

const CONFLICT_TYPE_LABELS: Record<string, string> = {
  duplicate_docno: 'เลขที่เอกสารซ้ำ',
  stock_changed:   'สต็อกมีการเปลี่ยนแปลง',
  data_modified:   'ข้อมูลถูกแก้ไขจากที่อื่น',
  deleted_on_server: 'ถูกลบจาก Server แล้ว',
};

const RESOLUTION_OPTIONS: {
  key: ConflictResolution;
  label: string;
  sub: string;
  icon: string;
  color: string;
  bg: string;
}[] = [
  {
    key: 'server_wins',
    label: 'ใช้ข้อมูลของ Server',
    sub: 'ยกเลิกข้อมูลในเครื่องและใช้ข้อมูล Server แทน',
    icon: 'cloud-outline',
    color: '#0284c7',
    bg: '#e0f2fe',
  },
  {
    key: 'client_wins',
    label: 'ใช้ข้อมูลในเครื่อง',
    sub: 'อัปโหลดข้อมูลเครื่องทับ Server',
    icon: 'phone-portrait-outline',
    color: '#e11d48',
    bg: '#fee2e2',
  },
  {
    key: 'manual_merge',
    label: 'Merge ด้วยตนเอง',
    sub: 'ป้อนค่าที่ต้องการเอง',
    icon: 'git-merge-outline',
    color: '#e11d48',
    bg: '#fee2e2',
  },
];

export const ConflictResolutionScreen: React.FC<Props> = ({ onBack, onResolved }) => {
  const { transactions, resolveConflict } = useSyncStore();
  const conflicts = transactions.filter(t => t.status === 'conflict');
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(
    conflicts.length > 0 ? conflicts[0].id : null
  );
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [resolving, setResolving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);

  const showAlert = (title: string, msg: string) => {
    setAlertTitle(title);
    setAlertMsg(msg);
    setAlertVisible(true);
  };

  const selectedTx = transactions.find(t => t.id === selectedConflictId);

  const handleResolve = () => {
    if (!selectedConflictId || !selectedResolution) return;
    if (selectedResolution === 'manual_merge' && !manualValue.trim()) {
      showAlert('แจ้งเตือน', 'กรุณากรอกค่าที่ต้องการ');
      return;
    }

    setResolving(true);
    resolveConflict(
      selectedConflictId,
      selectedResolution,
      selectedResolution === 'manual_merge' ? manualValue : undefined
    );
    setTimeout(() => {
      setResolving(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        const remaining = transactions.filter(t => t.status === 'conflict' && t.id !== selectedConflictId);
        if (remaining.length > 0) {
          setSelectedConflictId(remaining[0].id);
          setSelectedResolution(null);
          setManualValue('');
        } else {
          onResolved();
        }
      }, 1200);
    }, 1000);
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-rose-50')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3 border-b border-rose-700 shadow-sm')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-base font-extrabold text-white')}>แก้ไขปัญหาข้อขัดแย้ง</Text>
          <Text className={cn('text-[10px] text-rose-100 font-medium')}>{conflicts.length} รายการที่รอการแก้ไข</Text>
        </View>
        {conflicts.length > 0 && (
          <View className={cn('bg-white rounded-xl min-w-[24px] h-6 items-center justify-center px-[6px]')}>
            <Text className={cn('text-xs font-extrabold text-rose-600')}>{conflicts.length}</Text>
          </View>
        )}
      </View>

      {conflicts.length === 0 ? (
        <View className={cn('flex-1 items-center justify-center gap-4 p-5')}>
          <View className={cn('w-[120px] h-[120px] rounded-full bg-emerald-100 items-center justify-center')}>
            <Ionicons name="checkmark-circle" size={72} color="#0f766e" />
          </View>
          <Text className={cn('text-base font-extrabold text-slate-800')}>ไม่มีข้อขัดแย้ง</Text>
          <Text className={cn('text-xs text-slate-500 font-medium')}>ข้อมูลทั้งหมดได้รับการซิงค์เรียบร้อยแล้ว</Text>
          <TouchableOpacity className={cn('bg-rose-500 rounded-2xl px-5 py-3 shadow-sm')} onPress={onBack}>
            <Text className={cn('text-xs font-bold text-white')}>กลับไปหน้าแรก</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 12 }}>

          {conflicts.length > 1 && (
            <View className={cn('gap-1')}>
              <Text className={cn('text-[10px] font-bold text-slate-500 mb-1')}>เลือกรายการที่ต้องการแก้ไข</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className={cn('flex-row gap-2 py-1')}>
                  {conflicts.map((tx) => (
                    <TouchableOpacity
                      key={tx.id}
                      className={cn('px-3 py-2 rounded-full border-[1.5]', selectedConflictId === tx.id ? 'bg-rose-500 border-rose-500 shadow-sm' : 'bg-white border-rose-200')}
                      onPress={() => { setSelectedConflictId(tx.id); setSelectedResolution(null); setManualValue(''); }}
                    >
                      <Text className={cn('text-xs font-medium', selectedConflictId === tx.id ? 'text-white font-bold' : 'text-slate-800')}>
                        {tx.documentNo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {selectedTx && (
            <>
              <View className={cn('bg-white rounded-2xl p-3 gap-3 border-[1.5] border-rose-400 shadow-sm')}>
                <View className={cn('flex-row gap-2 items-start')}>
                  <View className={cn('w-11 h-11 rounded-xl bg-rose-100 items-center justify-center')}>
                    <Ionicons name={ENTITY_ICONS[selectedTx.entityType] as any} size={22} color="#e11d48" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className={cn('text-xs font-bold text-slate-800')}>{selectedTx.documentNo}</Text>
                    <Text className={cn('text-xs text-slate-600 font-medium')}>{selectedTx.description}</Text>
                    <Text className={cn('text-xs text-slate-500 font-medium')}>{ENTITY_LABELS[selectedTx.entityType]} · {selectedTx.deviceName}</Text>
                  </View>
                </View>

                <View className={cn('flex-row items-center gap-1 bg-rose-100 rounded-xl p-2')}>
                  <Ionicons name="alert-circle-outline" size={14} color="#e11d48" />
                  <Text className={cn('text-xs font-bold text-rose-600')}>
                    {CONFLICT_TYPE_LABELS[selectedTx.conflictData?.conflictType ?? ''] ?? selectedTx.conflictData?.conflictType}
                  </Text>
                </View>

                {selectedTx.conflictData && (
                  <View className={cn('gap-2')}>
                    <Text className={cn('text-[10px] font-bold text-slate-500')}>ข้อมูลที่ขัดแย้ง - {selectedTx.conflictData.field}</Text>
                    <View className={cn('flex-row gap-2 items-center')}>
                      <View className={cn('flex-1 rounded-xl p-2 gap-1 bg-rose-100 border border-rose-400')}>
                        <View className={cn('flex-row items-center gap-1')}>
                          <Ionicons name="phone-portrait-outline" size={14} color="#e11d48" />
                          <Text className={cn('text-[10px] text-rose-600 font-bold')}>เครื่องนี้ (Client)</Text>
                        </View>
                        <Text className={cn('text-xs text-slate-800 font-bold')}>{selectedTx.conflictData.clientValue}</Text>
                        <Text className={cn('text-[10px] text-slate-500 font-medium')}>{selectedTx.deviceName}</Text>
                      </View>
                      <View className={cn('items-center')}>
                        <Ionicons name="swap-horizontal-outline" size={20} color="#64748b" />
                      </View>
                      <View className={cn('flex-1 rounded-xl p-2 gap-1 bg-sky-100 border border-sky-400')}>
                        <View className={cn('flex-row items-center gap-1')}>
                          <Ionicons name="cloud-outline" size={14} color="#0284c7" />
                          <Text className={cn('text-[10px] font-bold text-sky-700')}>Server</Text>
                        </View>
                        <Text className={cn('text-xs text-slate-800 font-bold')}>{selectedTx.conflictData.serverValue}</Text>
                        <Text className={cn('text-[10px] text-slate-500 font-medium')}>จากระบบกลาง</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <View className={cn('gap-2')}>
                <Text className={cn('text-[10px] font-bold text-slate-500 mb-1')}>เลือกวิธีแก้ไข</Text>
                {RESOLUTION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    className={cn('flex-row items-start gap-3 bg-white rounded-2xl border-[1.5] p-3 relative', selectedResolution === opt.key ? 'border-2' : 'border-rose-200')}
                    style={selectedResolution === opt.key ? { borderColor: opt.color } : undefined}
                    onPress={() => setSelectedResolution(opt.key)}
                    activeOpacity={0.8}
                  >
                    {selectedResolution === opt.key && (
                      <View className={cn('absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center')} style={{ backgroundColor: opt.color }}>
                        <Ionicons name="checkmark" size={12} color="#fafafa" />
                      </View>
                    )}
                    <View className={cn('w-12 h-12 rounded-xl items-center justify-center')} style={{ backgroundColor: opt.bg }}>
                      <Ionicons name={opt.icon as any} size={24} color={opt.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text className={cn('text-xs font-bold text-slate-800')} style={selectedResolution === opt.key ? { color: opt.color } : undefined}>
                        {opt.label}
                      </Text>
                      <Text className={cn('text-xs text-slate-500 font-medium')}>{opt.sub}</Text>
                      {opt.key === 'server_wins' && selectedTx.conflictData && (
                        <Text className={cn('text-xs text-slate-400 italic font-medium')}>จะใช้ค่า: {selectedTx.conflictData.serverValue}</Text>
                      )}
                      {opt.key === 'client_wins' && selectedTx.conflictData && (
                        <Text className={cn('text-xs text-slate-400 italic font-medium')}>จะใช้ค่า: {selectedTx.conflictData.clientValue}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedResolution === 'manual_merge' && (
                <View className={cn('gap-2')}>
                  <Text className={cn('text-[10px] font-bold text-slate-500 mb-1')}>ป้อนค่าที่ต้องการ</Text>
                  <View className={cn('bg-amber-50 rounded-xl p-2 gap-0.5 border border-amber-200')}>
                    <Text className={cn('text-xs text-slate-600 font-medium')}>Client: {selectedTx.conflictData?.clientValue}</Text>
                    <Text className={cn('text-xs text-slate-600 font-medium')}>Server: {selectedTx.conflictData?.serverValue}</Text>
                  </View>
                  <TextInput
                    className={cn('bg-white rounded-2xl border-[1.5] border-rose-200 px-3 py-2 text-xs font-medium text-slate-800 min-h-[80px]')}
                    value={manualValue}
                    onChangeText={setManualValue}
                    placeholder="ป้อนค่าที่ต้องการ..."
                    placeholderTextColor="#cbd5e1"
                    multiline
                    style={{ textAlignVertical: 'top' }}
                  />
                </View>
              )}

              <TouchableOpacity
                className={cn('flex-row items-center justify-center gap-2 rounded-2xl py-3 shadow-sm', selectedResolution && !resolving ? 'bg-rose-500' : 'bg-rose-200')}
                onPress={handleResolve}
                disabled={!selectedResolution || resolving}
              >
                <Ionicons
                  name={resolving ? 'hourglass-outline' : 'git-merge-outline'}
                  size={20} color="#fafafa"
                />
                <Text className={cn('text-xs font-bold text-white')}>
                  {resolving ? 'กำลังแก้ไข...' : 'ยืนยันการแก้ไข'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <Modal visible={showSuccess} transparent animationType="fade">
        <View className={cn('flex-1 bg-[rgba(0,0,0,0.4)] items-center justify-center')}>
          <View className={cn('bg-white rounded-[20px] p-5 items-center gap-3 shadow-lg shadow-rose-500/40')}>
            <Ionicons name="checkmark-circle" size={56} color="#0f766e" />
            <Text className={cn('text-base font-extrabold text-emerald-600')}>แก้ไขสำเร็จ!</Text>
          </View>
        </View>
      </Modal>

      <AlertDialog visible={alertVisible} onClose={() => setAlertVisible(false)} title={alertTitle} message={alertMsg} variant="info" />
    </SafeAreaView>
  );
};
