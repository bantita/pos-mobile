/**
 * LookupCheckbox — Popup ตาราง + checkbox + ค้นหา
 * ใช้สำหรับเลือกสาขา, ผู้ใช้งาน, หรือรายการอื่นๆ แบบ multi-select
 *
 * Props:
 *  - items: รายการทั้งหมด [{id, label, sub?}]
 *  - selectedIds: id ที่เลือกอยู่
 *  - onChange: callback เมื่อเปลี่ยน
 *  - placeholder: ข้อความบนปุ่มเปิด
 *  - columns?: header คอลัมน์ (default: ['รายการ'])
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  /** ถ้า true จะแสดงแค่ inline chips ไม่มี popup */
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

  // Inline mode — แค่แสดง chip row
  if (inline) {
    return (
      <View style={st.chipRow}>
        {items.map(i => {
          const on = selectedIds.includes(i.id);
          return (
            <TouchableOpacity key={i.id} style={[st.chip, on && st.chipOn]} onPress={() => toggle(i.id)}>
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={14} color={on ? '#fff' : '#64748B'} />
              <Text style={[st.chipText, on && st.chipTextOn]}>{i.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <>
      {/* ปุ่มเปิด */}
      <TouchableOpacity style={st.trigger} onPress={() => setOpen(true)}>
        <Ionicons name="list-outline" size={14} color="#64748B" />
        <Text style={st.triggerText} numberOfLines={1}>{displayText}</Text>
        <View style={st.countBadge}><Text style={st.countText}>{selectedIds.length}</Text></View>
        <Ionicons name="chevron-down" size={14} color="#94A3B8" />
      </TouchableOpacity>

      {/* Popup */}
      <Modal visible={open} transparent animationType="fade">
        <View style={st.overlay}>
          <View style={st.popup}>
            {/* Header */}
            <View style={st.header}>
              <Text style={st.title}>{title}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={st.searchRow}>
              <Ionicons name="search" size={14} color="#94A3B8" />
              <TextInput style={st.searchInput} value={search} onChangeText={setSearch} placeholder="ค้นหา..." placeholderTextColor="#94A3B8" />
              {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color="#94A3B8" /></TouchableOpacity> : null}
            </View>

            {/* Actions */}
            <View style={st.actions}>
              <TouchableOpacity style={st.actionBtn} onPress={selectAll}>
                <Ionicons name="checkbox" size={13} color="#16A34A" />
                <Text style={[st.actionText, { color: '#16A34A' }]}>เลือกทั้งหมด</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.actionBtn} onPress={clearAll}>
                <Ionicons name="square-outline" size={13} color="#EF4444" />
                <Text style={[st.actionText, { color: '#EF4444' }]}>ล้างทั้งหมด</Text>
              </TouchableOpacity>
              <Text style={st.countInfo}>{selectedIds.length}/{items.length} เลือก</Text>
            </View>

            {/* Table */}
            <View style={st.tableWrap}>
              {/* Table header */}
              <View style={st.thead}>
                <View style={st.thCheck} />
                <Text style={[st.th, { flex: 2 }]}>{columns?.[0] ?? 'รายการ'}</Text>
                {columns && columns.length > 1 && <Text style={[st.th, { flex: 1.5 }]}>{columns[1]}</Text>}
                {columns && columns.length > 2 && <Text style={[st.th, { flex: 1 }]}>{columns[2]}</Text>}
              </View>

              <ScrollView style={st.tableScroll}>
                {filtered.map((item, idx) => {
                  const checked = selectedIds.includes(item.id);
                  return (
                    <TouchableOpacity key={item.id} style={[st.tr, idx % 2 === 1 && st.trAlt]} onPress={() => toggle(item.id)}>
                      <View style={st.tdCheck}>
                        <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={18} color={checked ? '#FF424D' : '#CBD5E1'} />
                      </View>
                      <Text style={[st.td, { flex: 2 }]} numberOfLines={1}>{item.label}</Text>
                      {item.sub !== undefined && <Text style={[st.td, st.tdSub, { flex: 1.5 }]} numberOfLines={1}>{item.sub}</Text>}
                      {item.extra !== undefined && <Text style={[st.td, st.tdSub, { flex: 1 }]} numberOfLines={1}>{item.extra}</Text>}
                    </TouchableOpacity>
                  );
                })}
                {filtered.length === 0 && <Text style={st.empty}>ไม่พบรายการ</Text>}
              </ScrollView>
            </View>

            {/* Footer */}
            <View style={st.footer}>
              <Text style={st.footerInfo}>Choices in List: {items.length}</Text>
              <TouchableOpacity style={st.doneBtn} onPress={() => setOpen(false)}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={st.doneText}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const st = StyleSheet.create({
  // Trigger
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#fff' },
  triggerText: { flex: 1, fontSize: 12, color: '#334155' },
  countBadge: { backgroundColor: '#FF424D', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  countText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  // Overlay
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  popup: { backgroundColor: '#fff', borderRadius: 12, width: 520, maxHeight: '80%', overflow: 'hidden' },
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  title: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, margin: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  searchInput: { flex: 1, fontSize: 12, color: '#334155', padding: 0 },
  // Actions
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 11, fontWeight: '600' },
  countInfo: { marginLeft: 'auto', fontSize: 11, color: '#94A3B8' },
  // Table
  tableWrap: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  thead: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  thCheck: { width: 32 },
  th: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  tableScroll: { maxHeight: 280 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  trAlt: { backgroundColor: '#FAFBFC' },
  tdCheck: { width: 32 },
  td: { fontSize: 12, color: '#334155' },
  tdSub: { color: '#64748B' },
  empty: { padding: 20, textAlign: 'center', fontSize: 12, color: '#94A3B8' },
  // Footer
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  footerInfo: { fontSize: 11, color: '#94A3B8' },
  doneBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FF424D', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  doneText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  // Inline chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff' },
  chipOn: { backgroundColor: '#FF424D', borderColor: '#FF424D' },
  chipText: { fontSize: 11, color: '#64748B' },
  chipTextOn: { color: '#fff' },
});
