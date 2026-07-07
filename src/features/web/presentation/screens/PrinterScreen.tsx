import React, { useState } from 'react';
import { Switch } from 'react-native';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

const MOCK_PRINTERS = [
  { id: 'p1', name: 'เครื่องพิมพ์ใบเสร็จ (USB)', type: 'USB', status: 'connected', model: 'Epson TM-T82III' },
  { id: 'p2', name: 'เครื่องพิมพ์ครัว (WiFi)', type: 'WiFi', status: 'connected', model: 'Xprinter XP-N160II' },
  { id: 'p3', name: 'เครื่องพิมพ์สำรอง (Bluetooth)', type: 'Bluetooth', status: 'disconnected', model: 'SUNMI T2 mini' },
];

export const PrinterScreen: React.FC = () => {
  const [autoPrint, setAutoPrint] = useState(true);
  const [copies, setCopies] = useState(1);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const showAlert = (title: string, msg: string) => {
    setAlertTitle(title);
    setAlertMsg(msg);
    setAlertVisible(true);
  };

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerClassName={cn('p-5 gap-4')}>
      <Text className={cn('text-base font-extrabold text-slate-800')}>เครื่องพิมพ์</Text>
      <Text className={cn('text-xs text-slate-500 font-medium -mt-3')}>จัดการเครื่องพิมพ์ที่เชื่อมต่อกับจุดขาย</Text>

      <View className={cn('bg-white rounded-2xl p-5 gap-3 shadow-sm border border-rose-100')}>
        <Text className={cn('text-xs font-bold text-rose-600')}>ตั้งค่าการพิมพ์</Text>
        <View className={cn('flex-row items-center justify-between py-2')}>
          <Text className={cn('text-xs font-medium text-slate-700')}>พิมพ์ใบเสร็จอัตโนมัติหลังชำระ</Text>
           <Switch value={autoPrint} onValueChange={setAutoPrint} />
        </View>
        <View className={cn('flex-row items-center justify-between py-2')}>
          <Text className={cn('text-xs font-medium text-slate-700')}>จำนวนสำเนา</Text>
          <View className={cn('flex-row items-center gap-3')}>
            <TouchableOpacity className={cn('w-9 h-9 rounded-lg bg-[#f6f7fb] items-center justify-center border border-slate-200')} onPress={() => setCopies(Math.max(1, copies - 1))}>
              <Text className={cn('text-sm font-bold text-slate-700')}>-</Text>
            </TouchableOpacity>
            <Text className={cn('text-sm font-bold text-slate-800')}>{copies}</Text>
            <TouchableOpacity className={cn('w-9 h-9 rounded-lg bg-[#f6f7fb] items-center justify-center border border-slate-200')} onPress={() => setCopies(copies + 1)}>
              <Text className={cn('text-sm font-bold text-slate-700')}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className={cn('bg-white rounded-2xl p-5 gap-3 shadow-sm border border-rose-100')}>
        <View className={cn('flex-row justify-between items-center')}>
          <Text className={cn('text-xs font-bold text-rose-600')}>เครื่องพิมพ์ที่เชื่อมต่อ</Text>
          <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 rounded-lg px-3.5 py-2 shadow-sm')} onPress={() => showAlert('เพิ่มเครื่องพิมพ์', 'กำลังพัฒนา...')}>
            <Ionicons name="add-circle" size={16} color="#fafafa" />
            <Text className={cn('text-xs font-bold text-white')}>เพิ่ม</Text>
          </TouchableOpacity>
        </View>
        {MOCK_PRINTERS.map(p => (
          <View key={p.id} className={cn('flex-row items-center gap-3 py-3 border-b border-rose-50')}>
            <View className={cn('w-10 h-10 rounded-xl items-center justify-center', p.status === 'connected' ? 'bg-emerald-50' : 'bg-rose-50')}>
              <Ionicons name="print" size={20} color={p.status === 'connected' ? '#10b981' : '#64748b'} />
            </View>
            <View className={cn('flex-1')}>
              <Text className={cn('text-xs font-semibold text-slate-800')}>{p.name}</Text>
              <Text className={cn('text-xs text-slate-500 font-medium')}>{p.model} · {p.type}</Text>
            </View>
            <View className={cn('flex-row items-center gap-1 px-2 py-1 rounded-lg', p.status === 'connected' ? 'bg-emerald-50' : 'bg-rose-50')}>
              <View className={cn('w-1.5 h-1.5 rounded-full', p.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500')} />
              <Text className={cn('text-xs font-semibold', p.status === 'connected' ? 'text-emerald-600' : 'text-rose-600')}>{p.status === 'connected' ? 'เชื่อมต่อ' : 'ไม่ได้เชื่อม'}</Text>
            </View>
            <TouchableOpacity className={cn('px-3.5 py-2 rounded-lg border border-slate-200 bg-white')} onPress={() => showAlert('ทดสอบพิมพ์', 'พิมพ์ทดสอบ: ' + p.name)}>
              <Text className={cn('text-xs font-semibold text-slate-600')}>ทดสอบ</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <AlertDialog visible={alertVisible} onClose={() => setAlertVisible(false)} title={alertTitle} message={alertMsg} variant="info" />
    </ScrollView>
  );
};
