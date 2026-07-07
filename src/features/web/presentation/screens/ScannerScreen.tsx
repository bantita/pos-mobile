import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import React, { useRef, useState } from 'react';
import { Switch } from 'react-native';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { findProductByBarcode, MOCK_PRODUCTS } from '@/features/product/data/mocks/mockProducts';

export const ScannerScreen: React.FC = () => {
  const [mode, setMode] = useState<'settings' | 'test'>('settings');
  const [autoAdd, setAutoAdd] = useState(true);
  const [beepSound, setBeepSound] = useState(true);
  const [continuousScan, setContinuousScan] = useState(true);
  const [scanPrefix, setScanPrefix] = useState('');
  const [scanSuffix, setScanSuffix] = useState('\\n');
  const [testBarcode, setTestBarcode] = useState('');
  const [scanHistory, setScanHistory] = useState<{ barcode: string; result: string; time: string; found: boolean }[]>([]);
  const inputRef = useRef<any>(null);

  const handleTestScan = () => {
    if (!testBarcode.trim()) return;
    const result = findProductByBarcode(testBarcode.trim(), MOCK_PRODUCTS);
    const entry = {
      barcode: testBarcode.trim(),
      result: result ? `${result.product.name} (${result.uom.unit}) — ฿${result.uom.salePrice}` : 'ไม่พบสินค้า',
      time: new Date().toLocaleTimeString('th-TH'),
      found: !!result,
    };
    setScanHistory(prev => [entry, ...prev].slice(0, 20));
    setTestBarcode('');
    inputRef.current?.focus();
  };

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerStyle={{ padding: 24, gap: 16 }}>
      <View className={cn('bg-rose-600 rounded-2xl p-4 shadow-lg shadow-rose-500/40')}>
        <Text className={cn('text-lg font-extrabold text-white')}>สแกนเนอร์บาร์โค้ด</Text>
        <Text className={cn('text-sm font-medium text-white/80')}>ตั้งค่าและทดสอบเครื่องสแกนบาร์โค้ด</Text>
      </View>

      <View className={cn('flex-row gap-1 bg-white rounded-2xl p-1 border border-slate-200 shadow-sm self-start')}>
        <TouchableOpacity
          className={cn('flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl', mode === 'settings' ? 'bg-rose-500' : 'bg-transparent')}
          onPress={() => setMode('settings')}
        >
          <Ionicons name="settings-outline" size={14} color={mode === 'settings' ? '#fafafa' : '#64748b'} />
          <Text className={cn('text-sm font-bold', mode === 'settings' ? 'text-white' : 'text-slate-500')}>ตั้งค่า</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={cn('flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl', mode === 'test' ? 'bg-rose-500' : 'bg-transparent')}
          onPress={() => setMode('test')}
        >
          <Ionicons name="barcode-outline" size={14} color={mode === 'test' ? '#fafafa' : '#64748b'} />
          <Text className={cn('text-sm font-bold', mode === 'test' ? 'text-white' : 'text-slate-500')}>ทดสอบ</Text>
        </TouchableOpacity>
      </View>

      {mode === 'settings' && (
        <>
          <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-2')}>
            <Text className={cn('text-sm font-extrabold text-slate-800')}>การทำงานอัตโนมัติ</Text>
            <View className={cn('flex-row items-center justify-between py-2 border-b border-slate-100')}>
              <Text className={cn('text-sm font-medium text-slate-700')}>เพิ่มสินค้าอัตโนมัติเมื่อสแกน</Text>
              <Switch value={autoAdd} onValueChange={setAutoAdd} />
            </View>
            <View className={cn('flex-row items-center justify-between py-2 border-b border-slate-100')}>
              <Text className={cn('text-sm font-medium text-slate-700')}>เสียง Beep เมื่อสแกนสำเร็จ</Text>
              <Switch value={beepSound} onValueChange={setBeepSound} />
            </View>
            <View className={cn('flex-row items-center justify-between py-2')}>
              <Text className={cn('text-sm font-medium text-slate-700')}>สแกนต่อเนื่อง (ไม่ต้องกด Enter)</Text>
              <Switch value={continuousScan} onValueChange={setContinuousScan} />
            </View>
          </View>

          <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-2')}>
            <Text className={cn('text-sm font-extrabold text-slate-800')}>Prefix / Suffix (กันอักขระนำ/ตาม)</Text>
            <View className={cn('flex-row gap-3')}>
              <View className={cn('flex-1')}>
                <Text className={cn('text-sm font-bold text-slate-500 mb-1')}>Prefix</Text>
                <TextInput className={cn('h-9 border border-slate-200 rounded-xl px-3 text-sm font-medium text-slate-800 bg-white')} value={scanPrefix} onChangeText={setScanPrefix} placeholder="ว่าง = ไม่มี" placeholderTextColor="#cbd5e1" />
              </View>
              <View className={cn('flex-1')}>
                <Text className={cn('text-sm font-bold text-slate-500 mb-1')}>Suffix</Text>
                <TextInput className={cn('h-9 border border-slate-200 rounded-xl px-3 text-sm font-medium text-slate-800 bg-white')} value={scanSuffix} onChangeText={setScanSuffix} placeholder="\\n = Enter" placeholderTextColor="#cbd5e1" />
              </View>
            </View>
          </View>

          <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-2')}>
            <Text className={cn('text-sm font-extrabold text-slate-800')}>อุปกรณ์ที่รองรับ</Text>
            <View className={cn('gap-2')}>
              {[
                { name: 'USB Barcode Scanner', desc: 'เสียบ USB  → ใช้งานทันที (Keyboard mode)', icon: 'hardware-chip-outline' },
                { name: 'Bluetooth Scanner', desc: 'เชื่อม Bluetooth → เปิด Keyboard/SPP mode', icon: 'bluetooth-outline' },
                { name: 'กล้องมือถือ', desc: 'สแกนผ่านกล้องหลัง (Mobile app)', icon: 'camera-outline' },
                { name: 'USB HID Scanner', desc: 'สแกนเนอร์แบบ keyboard emulation', icon: 'scan-outline' },
              ].map((d, i) => (
                <View key={i} className={cn('flex-row items-center gap-2.5 py-2 border-b border-slate-100')}>
                  <Ionicons name={d.icon as any} size={18} color="#e11d48" />
                  <View className={cn('flex-1')}>
                    <Text className={cn('text-sm font-semibold text-slate-800')}>{d.name}</Text>
                    <Text className={cn('text-sm font-medium text-slate-500')}>{d.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {mode === 'test' && (
        <>
          <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-2')}>
            <Text className={cn('text-sm font-extrabold text-slate-800')}>ทดสอบสแกน</Text>
            <Text className={cn('text-sm font-medium text-slate-500 mb-2')}>ป้อนบาร์โค้ดจำลอง หรือเสียบเครื่องสแกนแล้วกด Enter</Text>
            <View className={cn('flex-row items-center gap-2 bg-rose-50 rounded-xl px-3 h-11 border-[1.5] border-rose-500')}>
              <Ionicons name="barcode" size={20} color="#e11d48" />
              <TextInput
                ref={inputRef}
                className={cn('flex-1 text-sm font-medium text-slate-800')}
                value={testBarcode}
                onChangeText={setTestBarcode}
                placeholder="ป้อนหรือสแกนบาร์โค้ด..."
                placeholderTextColor="#94a3b8"
                onSubmitEditing={handleTestScan}
                autoFocus
              />
              <TouchableOpacity className={cn('w-10 h-10 rounded-xl bg-rose-500 items-center justify-center')} onPress={handleTestScan}>
                <Ionicons name="search" size={16} color="#fafafa" />
              </TouchableOpacity>
            </View>
          </View>

          {scanHistory.length > 0 && (
            <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-2')}>
              <Text className={cn('text-sm font-extrabold text-slate-800')}>ประวัติ ({scanHistory.length})</Text>
              {scanHistory.map((h, i) => (
                <View key={i} className={cn('flex-row items-center gap-2.5 py-2 px-2 rounded-md border-b border-slate-100', !h.found && 'bg-red-50')}>
                  <Ionicons name={h.found ? 'checkmark-circle' : 'close-circle'} size={16} color={h.found ? '#16a34a' : '#ef4444'} />
                  <View className={cn('flex-1')}>
                    <Text className={cn('text-sm font-bold', h.found ? 'text-slate-800' : 'text-red-500')}>{h.barcode}</Text>
                    <Text className={cn('text-sm font-medium text-slate-500')}>{h.result}</Text>
                  </View>
                  <Text className={cn('text-sm font-medium text-slate-400')}>{h.time}</Text>
                </View>
              ))}
            </View>
          )}

          <View className={cn('flex-row items-start gap-2 bg-rose-100/50 rounded-xl p-3')}>
            <Ionicons name="information-circle-outline" size={16} color="#64748b" />
            <Text className={cn('text-sm font-medium text-slate-500 flex-1')}>
              ทดสอบ: 8850999000001 (น้ำดื่ม), 8850999000002 (Pepsi), 8850999000201 (เลย์ ถุง 24)
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};
