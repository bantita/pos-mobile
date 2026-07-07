/**
 * SaleModePicker — เลือกวิธีการขายสินค้า
 * ใช้ใน Settings และเรียกได้จาก POSSaleScreen (ปุ่ม gear)
 */
import React from 'react';
import { View, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { useSaleModeStore } from '@/features/sale/application/stores/saleModeStore';
import { SaleMode } from '@/features/sale/domain/saleMode';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

interface SaleModePickerProps {
  onClose?: () => void;
  compact?: boolean; // แสดงแบบย่อใน header bar
}

const MODES: {
  key: SaleMode;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  bgColor: string;
  features: string[];
}[] = [
  {
    key: 'button_only',
    label: 'กดปุ่มเลือกสินค้า',
    sublabel: 'แสดง product grid เท่านั้น',
    icon: 'grid-outline',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    features: ['Product Grid', 'ค้นหาสินค้า', 'Filter หมวดหมู่'],
  },
  {
    key: 'scan_only',
    label: 'สแกน Barcode',
    sublabel: 'ใช้กล้องสแกนสินค้าเท่านั้น',
    icon: 'barcode-outline',
    color: '#0f766e',
    bgColor: '#d1fae5',
    features: ['Camera Scanner', 'กรอกบาร์โค้ดมือ', 'รองรับ Bluetooth Scanner'],
  },
  {
    key: 'both',
    label: 'ทั้ง 2 วิธี',
    sublabel: 'สลับระหว่างปุ่มและสแกนได้',
    icon: 'apps-outline',
    color: '#f87171',
    bgColor: '#fee2e2',
    features: ['Product Grid', 'Camera Scanner', 'สลับ mode ได้ทันที'],
  },
];

const GRID_SIZES: { key: 'small' | 'medium' | 'large'; label: string; cols: 2 | 3 | 4; icon: string }[] = [
  { key: 'small',  label: 'เล็ก',   cols: 4, icon: 'grid' },
  { key: 'medium', label: 'กลาง',   cols: 3, icon: 'grid-outline' },
  { key: 'large',  label: 'ใหญ่',   cols: 2, icon: 'stop-outline' },
];

export const SaleModePicker: React.FC<SaleModePickerProps> = ({ onClose, compact = false }) => {
  const { mode, autoOpenCamera, splitView, beepOnScan, gridSize, gridColumns, setConfig } = useSaleModeStore();

  if (compact) {
    // Mini version สำหรับใน header
    return (
      <View className={cn('flex-row rounded-xl p-[3px] gap-[2px]')} style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[{ backgroundColor: mode === m.key ? m.color : 'transparent' }]}
            className={cn('flex-row items-center gap-1 px-2 py-[5px] rounded-[6px]')}
            onPress={() => setConfig({ mode: m.key })}
            activeOpacity={0.8}
          >
            <Ionicons name={m.icon as any} size={16} color={mode === m.key ? '#fafafa' : '#6b7280'} />
            <Text className={cn('text-[11px] font-semibold')} style={{ color: mode === m.key ? '#fafafa' : '#9ca3af' }}>
              {{ button_only: 'ปุ่ม', scan_only: 'สแกน', both: 'ทั้ง2' }[m.key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {onClose && (
        <View className={cn('items-center gap-2 mb-1')}>
          <View className={cn('w-10 h-1 rounded-sm')} style={{ backgroundColor: '#e5e7eb' }} />
          <Text className={cn('text-lg font-semibold text-slate-950')}>วิธีการขายสินค้า</Text>
        </View>
      )}

      {/* Mode Cards */}
      <Text className={cn('text-xs font-semibold text-gray-600 -mb-1')}>เลือกวิธีการขาย</Text>
      <View className={cn('flex-row gap-2')}>
        {MODES.map((m) => {
          const isSelected = mode === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              className={cn('flex-1 bg-white rounded-2xl border p-3 items-center gap-1 relative')}
              style={[
                { borderColor: isSelected ? m.color : '#e7e5e4', borderWidth: isSelected ? 2.5 : 1.5 },
                isSelected && { shadowColor: '#09090b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, boxShadow: '0 4px 14px rgba(15, 23, 42, 0.07)' },
              ]}
              onPress={() => setConfig({ mode: m.key })}
              activeOpacity={0.8}
            >
              {/* Selected indicator */}
              {isSelected && (
                <View className={cn('absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center')} style={{ backgroundColor: m.color }}>
                  <Ionicons name="checkmark" size={12} color="#fafafa" />
                </View>
              )}

              <View className={cn('w-14 h-14 rounded-xl items-center justify-center mb-1')} style={{ backgroundColor: m.bgColor }}>
                <Ionicons name={m.icon as any} size={28} color={m.color} />
              </View>

              <Text className={cn('text-xs font-semibold text-center font-bold')} style={{ color: isSelected ? m.color : '#292524' }}>{m.label}</Text>
              <Text className={cn('text-xs text-slate-500 text-center')}>{m.sublabel}</Text>

              <View className={cn('w-full gap-[3px] mt-1')}>
                {m.features.map((f) => (
                  <View key={f} className={cn('flex-row items-center gap-[5px]')}>
                    <View className={cn('w-[5px] h-[5px] rounded-full')} style={{ backgroundColor: m.color }} />
                    <Text className={cn('text-xs text-slate-950 flex-1')}>{f}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grid Size (สำหรับ button_only และ both) */}
      {mode !== 'scan_only' && (
        <>
          <Text className={cn('text-xs font-semibold text-gray-600 -mb-1')}>ขนาด Product Grid</Text>
          <View className={cn('flex-row gap-2')}>
            {GRID_SIZES.map((g) => (
              <TouchableOpacity
                key={g.key}
                className={cn('flex-1 bg-white rounded-xl border-[1.5px] p-2 items-center gap-1', gridSize === g.key && 'border-rose-500')}
                style={gridSize === g.key ? { backgroundColor: '#fee2e2' } : { borderColor: '#e7e5e4' }}
                onPress={() => setConfig({ gridSize: g.key, gridColumns: g.cols })}
                activeOpacity={0.8}
              >
                {/* Preview grid dots */}
                <View className={cn('flex-row flex-wrap gap-[3px] w-full justify-center')}>
                  {Array.from({ length: g.cols * 2 }).map((_, i) => (
                    <View
                      key={i}
                      className={cn('h-4 rounded-lg mb-[3px]', gridSize === g.key ? 'bg-rose-500' : 'bg-gray-200')}
                      style={{ width: `${(100 / g.cols) - 4}%` }}
                    />
                  ))}
                </View>
                <Text className={cn('text-xs text-center', gridSize === g.key ? 'text-rose-600 font-bold' : 'text-slate-500')}>
                  {g.label} ({g.cols} คอลัมน์)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Advanced Options */}
      <Text className={cn('text-xs font-semibold text-gray-600 -mb-1')}>ตัวเลือกเพิ่มเติม</Text>
      <View className={cn('bg-white rounded-2xl overflow-hidden border border-slate-200')}>

        {/* Auto open camera */}
        {(mode === 'scan_only' || mode === 'both') && (
          <View className={cn('flex-row items-center justify-between p-4')}>
            <View className={cn('flex-row items-center gap-3 flex-1')}>
              <View className={cn('w-9 h-9 rounded-lg items-center justify-center')} style={{ backgroundColor: '#fee2e2' }}>
                <Ionicons name="camera-outline" size={18} color="#f87171" />
              </View>
              <View>
                <Text className={cn('text-xs font-semibold text-slate-950')}>เปิดกล้องทันที</Text>
                <Text className={cn('text-xs text-slate-500 mr-3')}>เปิดกล้องสแกนอัตโนมัติเมื่อเข้าหน้าขาย</Text>
              </View>
            </View>
            <Switch
              value={autoOpenCamera}
              onValueChange={(v) => setConfig({ autoOpenCamera: v })}
            />
          </View>
        )}

        {/* Split View (both only) */}
        {mode === 'both' && (
          <View className={cn('flex-row items-center justify-between p-4 border-t border-t-slate-200')}>
            <View className={cn('flex-row items-center gap-3 flex-1')}>
              <View className={cn('w-9 h-9 rounded-lg items-center justify-center')} style={{ backgroundColor: '#ede9fe' }}>
                <Ionicons name="tablet-landscape-outline" size={18} color="#7c3aed" />
              </View>
              <View>
                <Text className={cn('text-xs font-semibold text-slate-950')}>Split View (Tablet)</Text>
                <Text className={cn('text-xs text-slate-500 mr-3')}>แสดง grid ซ้าย + scanner ขวา พร้อมกัน</Text>
              </View>
            </View>
            <Switch
              value={splitView}
              onValueChange={(v) => setConfig({ splitView: v })}
            />
          </View>
        )}

        {/* Beep on scan */}
        {(mode === 'scan_only' || mode === 'both') && (
          <View className={cn('flex-row items-center justify-between p-4 border-t border-t-slate-200')}>
            <View className={cn('flex-row items-center gap-3 flex-1')}>
              <View className={cn('w-9 h-9 rounded-lg items-center justify-center')} style={{ backgroundColor: '#d1fae5' }}>
                <Ionicons name="volume-high-outline" size={18} color="#0f766e" />
              </View>
              <View>
                <Text className={cn('text-xs font-semibold text-slate-950')}>เสียงบี๊ปเมื่อสแกน</Text>
                <Text className={cn('text-xs text-slate-500 mr-3')}>เล่นเสียงยืนยันทุกครั้งที่สแกนสำเร็จ</Text>
              </View>
            </View>
            <Switch
              value={beepOnScan}
              onValueChange={(v) => setConfig({ beepOnScan: v })}
            />
          </View>
        )}
      </View>

      {/* Preview box */}
      <View className={cn('rounded-2xl p-4 gap-2 border border-slate-200')} style={{ backgroundColor: '#fafafa' }}>
        <Text className={cn('text-xs font-semibold text-rose-600')}>
          <Ionicons name="eye-outline" size={14} color="#f87171" /> ตัวอย่างหน้าขาย
        </Text>
        <View className={cn('flex-row gap-2')} style={{ minHeight: 80 }}>
          {mode !== 'scan_only' && (
            <View className={cn('flex-[2] gap-1')}>
              <View className={cn('flex-row items-center gap-1')}>
                <Ionicons name="grid-outline" size={12} color="#f87171" />
                <Text className={cn('text-xs text-rose-600 font-semibold')}>Product Grid ({gridColumns} คอลัมน์)</Text>
              </View>
              <View className={cn('flex-row flex-wrap gap-[3px]')}>
                {Array.from({ length: gridColumns * 2 }).map((_, i) => (
                  <View key={i} className={cn('h-5 rounded-lg mb-[3px] opacity-60')}
                    style={{ width: `${100 / gridColumns - 2}%`, backgroundColor: '#f8717130' }} />
                ))}
              </View>
            </View>
          )}
          {mode !== 'button_only' && (
            <View className={cn('flex-1 gap-1')} style={mode === 'both' && splitView ? { flex: 1 } : undefined}>
              <View className={cn('flex-row items-center gap-1')}>
                <Ionicons name="barcode-outline" size={12} color="#0f766e" />
                <Text className={cn('text-xs font-semibold')} style={{ color: '#0f766e' }}>Scanner</Text>
              </View>
              <View className={cn('flex-1 rounded-lg items-center justify-center')} style={{ backgroundColor: '#111827', minHeight: 48 }}>
                <Ionicons name="scan-outline" size={24} color="#0f766e" />
              </View>
            </View>
          )}
        </View>
      </View>

      {onClose && (
        <TouchableOpacity className={cn('bg-rose-500 rounded-xl py-3 items-center')} onPress={onClose}>
          <Text className={cn('text-base font-semibold text-white')}>เสร็จสิ้น</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};
