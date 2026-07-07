import React, { useState } from 'react';
import { Switch } from 'react-native';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

interface Printer {
  id: string;
  name: string;
  type: 'bluetooth' | 'wifi' | 'usb' | 'airprint';
  model: string;
  connected: boolean;
}

const MOCK_PRINTERS: Printer[] = [
  { id: 'prt_001', name: 'Epson TM-T82X', type: 'bluetooth', model: 'TM-T82X', connected: true },
  { id: 'prt_002', name: 'Star TSP143IV', type: 'wifi', model: 'TSP143IVW', connected: false },
  { id: 'prt_003', name: 'Bixolon SRP-Q200', type: 'usb', model: 'SRP-Q200', connected: true },
];

const TYPE_ICONS: Record<string, string> = {
  bluetooth: 'bluetooth-outline',
  wifi: 'wifi-outline',
  usb: 'hardware-chip-outline',
  airprint: 'print-outline',
};

const TYPE_LABELS: Record<string, string> = {
  bluetooth: 'Bluetooth',
  wifi: 'WiFi',
  usb: 'USB',
  airprint: 'AirPrint',
};

type ReceiptTemplate = 'simple' | 'full' | 'tax_invoice';

interface TemplateOption {
  id: ReceiptTemplate;
  title: string;
  desc: string;
  lines: string[];
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'simple',
    title: 'Simple',
    desc: 'ใบเสร็จแบบเรียบง่าย',
    lines: ['ร้าน ABC', '─────────', 'น้ำดื่ม × 2   20.00', '─────────', 'รวม    20.00'],
  },
  {
    id: 'full',
    title: 'Full (พร้อม VAT)',
    desc: 'แสดงรายละเอียดครบถ้วน',
    lines: ['ร้าน ABC', 'เลขที่: INV-001', '─────────', 'น้ำดื่ม × 2   20.00', 'VAT 7%    1.30', '─────────', 'รวมสุทธิ  21.30'],
  },
  {
    id: 'tax_invoice',
    title: 'ใบกำกับภาษี',
    desc: 'ใบกำกับภาษีเต็มรูปแบบ',
    lines: ['ใบกำกับภาษี', 'ร้าน ABC TIN:01055...', '─────────', 'น้ำดื่ม × 2   20.00', 'ยอดก่อนVAT 18.70', 'VAT 7%    1.30', '─────────', 'รวมสุทธิ  20.00'],
  },
];

interface PrinterSettingsScreenProps {
  onBack: () => void;
}

export const PrinterSettingsScreen: React.FC<PrinterSettingsScreenProps> = ({ onBack }) => {
  const [printers, setPrinters] = useState<Printer[]>(MOCK_PRINTERS);
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate>('full');
  const [printLogo, setPrintLogo] = useState(true);
  const [printBarcode, setPrintBarcode] = useState(false);
  const [printQR, setPrintQR] = useState(true);

  const [alertDialog, setAlertDialog] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const handleTestPrint = (printer: Printer) => {
    setAlertDialog({ visible: true, title: 'Test Print', message: `ส่งงานพิมพ์ทดสอบไปที่ ${printer.name}` });
  };

  const handleDisconnect = (id: string) => {
    setPrinters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: false } : p))
    );
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>ตั้งค่าเครื่องพิมพ์</Text>
          <Text className={cn('text-xs font-medium text-rose-100')}>Printer Settings</Text>
        </View>
        <Ionicons name="print-outline" size={24} color="#fecdd3" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 12 }}>
        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <View className={cn('flex-row justify-between items-center')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>เครื่องพิมพ์ที่เชื่อมต่อ</Text>
            <TouchableOpacity className={cn('min-h-10 flex-row items-center gap-1 rounded-xl border border-rose-500 px-3 py-2')}>
              <Ionicons name="search-outline" size={14} color="#f87171" />
              <Text className={cn('text-xs font-medium text-rose-500')}>ค้นหา</Text>
            </TouchableOpacity>
          </View>
          {printers.map((p) => (
            <View key={p.id} className={cn('flex-row items-center gap-2 py-2 border-b border-slate-100')}>
              <View className={cn('w-10 h-10 rounded-xl items-center justify-center')} style={{ backgroundColor: p.connected ? '#d1fae5' : '#e2e8f0' }}>
                <Ionicons
                  name={TYPE_ICONS[p.type] as any}
                  size={20}
                  color={p.connected ? '#0f766e' : '#9ca3af'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text className={cn('text-xs font-bold text-slate-950')}>{p.name}</Text>
                <View className={cn('flex-row items-center gap-1')}>
                  <Text className={cn('text-xs font-medium text-slate-600')}>{TYPE_LABELS[p.type]}</Text>
                  <View className={cn('rounded px-1.5 py-0.5', p.connected ? 'bg-emerald-100' : 'bg-slate-100')}>
                    <Text style={[{ color: p.connected ? '#0f766e' : '#9ca3af' }]} className={cn('text-xs font-bold')}>
                      {p.connected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
                    </Text>
                  </View>
                </View>
              </View>
              <View className={cn('flex-row gap-1')}>
                {p.connected && (
                  <TouchableOpacity className={cn('p-1.5')} onPress={() => handleTestPrint(p)}>
                    <Ionicons name="print-outline" size={16} color="#f87171" />
                  </TouchableOpacity>
                )}
                {p.connected && (
                  <TouchableOpacity className={cn('p-1.5')} onPress={() => handleDisconnect(p.id)}>
                    <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-600')}>Template ใบเสร็จ</Text>
          <View className={cn('flex-row gap-2')}>
            {TEMPLATES.map((t) => (
              <TouchableOpacity
                key={t.id}
                className={cn('flex-1 rounded-xl border-2 p-2 gap-1 relative', selectedTemplate === t.id ? 'border-rose-500 bg-rose-50' : 'border-slate-200')}
                onPress={() => setSelectedTemplate(t.id)}
                activeOpacity={0.8}
              >
                <View className={cn('bg-[#f6f7fb] rounded-lg p-1.5 mb-1')}>
                  {t.lines.map((line, i) => (
                    <Text key={i} style={{ fontSize: 10, color: '#57534e', lineHeight: 12 }}>{line}</Text>
                  ))}
                </View>
                <Text className={cn('text-sm font-bold text-slate-950', selectedTemplate === t.id && 'text-rose-500')}>
                  {t.title}
                </Text>
                <Text className={cn('text-xs font-medium text-slate-600')}>{t.desc}</Text>
                {selectedTemplate === t.id && (
                  <View className={cn('absolute top-1.5 right-1.5')}>
                    <Ionicons name="checkmark-circle" size={16} color="#f87171" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-600')}>ตัวเลือกการพิมพ์</Text>
          {[
            { label: 'พิมพ์โลโก้ร้าน', sub: 'แสดงโลโก้ที่ด้านบนใบเสร็จ', value: printLogo, setter: setPrintLogo },
            { label: 'พิมพ์บาร์โค้ด', sub: 'แสดงบาร์โค้ดสินค้าในใบเสร็จ', value: printBarcode, setter: setPrintBarcode },
            { label: 'พิมพ์ QR Code', sub: 'แสดง QR Code ท้ายใบเสร็จ', value: printQR, setter: setPrintQR },
          ].map((o, i) => (
            <View key={i} className={cn('flex-row items-center justify-between py-1', i > 0 && 'border-t border-slate-100 pt-3')}>
              <View className={cn('flex-1 gap-0.5')}>
                <Text className={cn('text-xs font-bold text-slate-950')}>{o.label}</Text>
                <Text className={cn('text-xs font-medium text-slate-600')}>{o.sub}</Text>
              </View>
              <Switch
                value={o.value}
                onValueChange={o.setter}
              />
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <AlertDialog
        visible={alertDialog.visible}
        title={alertDialog.title}
        message={alertDialog.message}
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        onConfirm={() => setAlertDialog({ visible: false, title: '', message: '' })}
      />
    </SafeAreaView>
  );
};
