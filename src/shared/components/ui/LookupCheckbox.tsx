import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { Text, TextInput } from '@/shared/tw/index';

export interface LookupItem {
  id: string;
  label: string;
  sub?: string;
  extra?: string;
}

interface Props {
  items: LookupItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  title?: string;
  columns?: string[];
  inline?: boolean;
}

export const LookupCheckbox: React.FC<Props> = ({
  items, selectedIds, onChange, placeholder = 'เลือก...', title = 'เลือกรายการ', columns, inline,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.label.toLowerCase().includes(q) || i.sub?.toLowerCase().includes(q) || i.extra?.toLowerCase().includes(q));
  }, [items, search]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  };

  const selectAll = () => onChange(items.map(i => i.id));
  const clearAll = () => onChange([]);

  const selectedLabels = items.filter(i => selectedIds.includes(i.id)).map(i => i.label);
  const displayText = selectedLabels.length === 0 ? placeholder
    : selectedLabels.length <= 2 ? selectedLabels.join(', ')
    : `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`;

  if (inline) {
    return (
      <View className="flex-row flex-wrap gap-1.5">
        {items.map(i => {
          const on = selectedIds.includes(i.id);
          return (
            <TouchableOpacity
              key={i.id}
              className={cn(
                'flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg border',
                on ? 'bg-rose-500 border-rose-500' : 'bg-white border-slate-200',
              )}
              onPress={() => toggle(i.id)}
            >
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={14} color={on ? '#fafafa' : '#64748b'} />
              <Text className={cn('text-xs', on ? 'text-white' : 'text-slate-500')}>{i.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity className="flex-row items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white" onPress={() => setOpen(true)}>
        <Ionicons name="list-outline" size={14} color="#64748b" />
        <Text className="flex-1 text-xs text-slate-700" numberOfLines={1}>{displayText}</Text>
        <View className="bg-rose-500 rounded-full px-1.5 py-0.5 min-w-[20] items-center">
          <Text className="text-[10px] font-bold text-white">{selectedIds.length}</Text>
        </View>
        <Ionicons name="chevron-down" size={14} color="#94a3b8" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <View className="flex-1 bg-black/40 items-center justify-center">
          <View className="bg-white rounded-xl w-[520] max-h-[80%] overflow-hidden">
            <View className="flex-row items-center justify-between p-4 border-b border-slate-100">
              <Text className="text-sm font-bold text-slate-800">{title}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center gap-1.5 m-3 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Ionicons name="search" size={14} color="#94a3b8" />
              <TextInput className="flex-1 text-xs text-slate-700 p-0" value={search} onChangeText={setSearch} placeholder="ค้นหา..." placeholderTextColor="#94a3b8" />
              {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}
            </View>

            <View className="flex-row items-center gap-3 px-4 pb-2">
              <TouchableOpacity className="flex-row items-center gap-1" onPress={selectAll}>
                <Ionicons name="checkbox" size={13} color="#16a34a" />
                <Text className="text-xs font-semibold text-green-600">เลือกทั้งหมด</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center gap-1" onPress={clearAll}>
                <Ionicons name="square-outline" size={13} color="#ef4444" />
                <Text className="text-xs font-semibold text-red-500">ล้างทั้งหมด</Text>
              </TouchableOpacity>
              <Text className="text-xs text-slate-400 ml-auto">{selectedIds.length}/{items.length} เลือก</Text>
            </View>

            <View className="border-t border-slate-100">
              <View className="flex-row items-center bg-[#f6f7fb] px-3 py-2 border-b border-slate-200">
                <View className="w-8" />
                <Text className="text-xs font-bold text-slate-500 uppercase flex-[2]">{columns?.[0] ?? 'รายการ'}</Text>
                {columns && columns.length > 1 && <Text className="text-xs font-bold text-slate-500 uppercase flex-[1.5]">{columns[1]}</Text>}
                {columns && columns.length > 2 && <Text className="text-xs font-bold text-slate-500 uppercase flex-1">{columns[2]}</Text>}
              </View>

              <ScrollView className="max-h-[280]">
                {filtered.map((item, idx) => {
                  const checked = selectedIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      className={cn(
                        'flex-row items-center px-3 py-[9px] border-b border-slate-50',
                        idx % 2 === 1 && 'bg-[#f6f7fb]',
                      )}
                      onPress={() => toggle(item.id)}
                    >
                      <View className="w-8">
                        <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={18} color={checked ? '#ef4444' : '#cbd5e1'} />
                      </View>
                      <Text className="text-xs text-slate-700 flex-[2]" numberOfLines={1}>{item.label}</Text>
                      {item.sub !== undefined && <Text className="text-xs text-slate-500 flex-[1.5]" numberOfLines={1}>{item.sub}</Text>}
                      {item.extra !== undefined && <Text className="text-xs text-slate-500 flex-1" numberOfLines={1}>{item.extra}</Text>}
                    </TouchableOpacity>
                  );
                })}
                {filtered.length === 0 && <Text className="p-5 text-center text-xs text-slate-400">ไม่พบรายการ</Text>}
              </ScrollView>
            </View>

            <View className="flex-row items-center justify-between p-3 border-t border-slate-100">
              <Text className="text-xs text-slate-400">Choices in List: {items.length}</Text>
              <TouchableOpacity className="flex-row items-center gap-1 bg-rose-500 rounded-lg px-3.5 py-2" onPress={() => setOpen(false)}>
                <Ionicons name="checkmark" size={16} color="#fafafa" />
                <Text className="text-xs font-bold text-white">ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
