/**
 * DateRangePicker — เลือกช่วงวันที่สำหรับรายงาน
 */
import React, { useState } from 'react';
import { View, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { DateRange, DateRangePreset } from '@/features/reports/domain/reports';
import { formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

const d = (days: number) => new Date(Date.now() - days * 86400000);

export const PRESETS: { key: DateRangePreset; label: string; from: () => Date; to: () => Date }[] = [
  { key: 'today',      label: 'วันนี้',          from: () => d(0),  to: () => new Date() },
  { key: 'yesterday',  label: 'เมื่อวาน',         from: () => d(1),  to: () => d(1) },
  { key: 'this_week',  label: '7 วันล่าสุด',     from: () => d(6),  to: () => new Date() },
  { key: 'last_week',  label: '7 วันก่อน',       from: () => d(13), to: () => d(7) },
  { key: 'this_month', label: 'เดือนนี้',         from: () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); }, to: () => new Date() },
  { key: 'last_month', label: 'เดือนที่แล้ว',    from: () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth() - 1, 1); }, to: () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 0); } },
];

export const getDefaultRange = (): DateRange => ({
  preset: 'this_week',
  from: d(6),
  to: new Date(),
});

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  compact?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, compact = false }) => {
  const [showModal, setShowModal] = useState(false);

  const handleSelect = (preset: typeof PRESETS[0]) => {
    onChange({ preset: preset.key, from: preset.from(), to: preset.to() });
    setShowModal(false);
  };

  const label = PRESETS.find(p => p.key === value.preset)?.label ?? 'กำหนดเอง';

  return (
    <>
      <TouchableOpacity
        className={cn('flex-row items-center gap-2 bg-white rounded-xl border-[1.5px] border-slate-200 px-3 py-2', compact && 'py-[6px]')}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="calendar-outline" size={16} color="#f87171" />
        {compact ? (
          <Text className="text-base text-rose-600 font-semibold">{label}</Text>
        ) : (
          <View className="flex-1">
            <Text className="text-xs font-semibold text-slate-950">{label}</Text>
            <Text className="text-xs text-slate-500">{formatDate(value.from)} – {formatDate(value.to)}</Text>
          </View>
        )}
        <Ionicons name="chevron-down" size={14} color="#9ca3af" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-4 gap-1">
            <View className="w-10 h-1 bg-gray-200 rounded-sm self-center mb-2" />
            <Text className="text-lg font-semibold text-slate-950 mb-1">เลือกช่วงวันที่</Text>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.key}
                className={cn('flex-row items-center py-3 border-b border-slate-200', value.preset === p.key && 'bg-rose-50 rounded-lg px-3')}
                onPress={() => handleSelect(p)}
              >
                <View className="flex-1">
                  <Text className={cn('text-base text-slate-950', value.preset === p.key && 'text-rose-600 font-bold')}>
                    {p.label}
                  </Text>
                  <Text className="text-xs text-slate-500">{formatDate(p.from())} – {formatDate(p.to())}</Text>
                </View>
                {value.preset === p.key && <Ionicons name="checkmark-circle" size={20} color="#f87171" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity className="items-center py-3 mt-1" onPress={() => setShowModal(false)}>
              <Text className="text-base font-semibold text-rose-600">ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};
