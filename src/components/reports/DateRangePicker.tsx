/**
 * DateRangePicker — เลือกช่วงวันที่สำหรับรายงาน
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateRange, DateRangePreset } from '../../types/reports';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatDate } from '../../utils/format';

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
        style={[styles.trigger, compact && styles.triggerCompact]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
        {compact ? (
          <Text style={styles.triggerLabelCompact}>{label}</Text>
        ) : (
          <View style={{ flex: 1 }}>
            <Text style={styles.triggerLabel}>{label}</Text>
            <Text style={styles.triggerRange}>{formatDate(value.from)} – {formatDate(value.to)}</Text>
          </View>
        )}
        <Ionicons name="chevron-down" size={14} color={Colors.gray400} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>เลือกช่วงวันที่</Text>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.option, value.preset === p.key && styles.optionActive]}
                onPress={() => handleSelect(p)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, value.preset === p.key && { color: Colors.primary, fontWeight: '700' }]}>
                    {p.label}
                  </Text>
                  <Text style={styles.optionRange}>{formatDate(p.from())} – {formatDate(p.to())}</Text>
                </View>
                {value.preset === p.key && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.cancelText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  triggerCompact: { paddingVertical: 6 },
  triggerLabel: { ...Typography.label, color: Colors.text },
  triggerLabelCompact: { ...Typography.body2, color: Colors.primary, fontWeight: '600' },
  triggerRange: { ...Typography.caption, color: Colors.textSecondary },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, gap: Spacing.xs },
  handle: { width: 40, height: 4, backgroundColor: Colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.sm },
  title: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.xs },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionActive: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm },
  optionLabel: { ...Typography.body1, color: Colors.text },
  optionRange: { ...Typography.caption, color: Colors.textSecondary },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.xs },
  cancelText: { ...Typography.button, color: Colors.danger },
});
