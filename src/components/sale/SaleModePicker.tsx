/**
 * SaleModePicker — เลือกวิธีการขายสินค้า
 * ใช้ใน Settings และเรียกได้จาก POSSaleScreen (ปุ่ม gear)
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Switch, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSaleModeStore } from '../../store/saleModeStore';
import { SaleMode } from '../../types/saleMode';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

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
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    features: ['Product Grid', 'ค้นหาสินค้า', 'Filter หมวดหมู่'],
  },
  {
    key: 'scan_only',
    label: 'สแกน Barcode',
    sublabel: 'ใช้กล้องสแกนสินค้าเท่านั้น',
    icon: 'barcode-outline',
    color: Colors.success,
    bgColor: Colors.successLight,
    features: ['Camera Scanner', 'กรอกบาร์โค้ดมือ', 'รองรับ Bluetooth Scanner'],
  },
  {
    key: 'both',
    label: 'ทั้ง 2 วิธี',
    sublabel: 'สลับระหว่างปุ่มและสแกนได้',
    icon: 'apps-outline',
    color: Colors.primary,
    bgColor: Colors.primaryLight,
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
      <View style={compactStyles.row}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[compactStyles.btn, mode === m.key && { backgroundColor: m.color }]}
            onPress={() => setConfig({ mode: m.key })}
            activeOpacity={0.8}
          >
            <Ionicons name={m.icon as any} size={16} color={mode === m.key ? Colors.white : Colors.gray500} />
            <Text style={[compactStyles.label, mode === m.key && { color: Colors.white }]}>
              {{ button_only: 'ปุ่ม', scan_only: 'สแกน', both: 'ทั้ง2' }[m.key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {onClose && (
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>วิธีการขายสินค้า</Text>
        </View>
      )}

      {/* Mode Cards */}
      <Text style={styles.sectionLabel}>เลือกวิธีการขาย</Text>
      <View style={styles.modeGrid}>
        {MODES.map((m) => {
          const isSelected = mode === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeCard, isSelected && { borderColor: m.color, borderWidth: 2.5 }]}
              onPress={() => setConfig({ mode: m.key })}
              activeOpacity={0.8}
            >
              {/* Selected indicator */}
              {isSelected && (
                <View style={[styles.selectedMark, { backgroundColor: m.color }]}>
                  <Ionicons name="checkmark" size={12} color={Colors.white} />
                </View>
              )}

              <View style={[styles.modeIconBox, { backgroundColor: m.bgColor }]}>
                <Ionicons name={m.icon as any} size={28} color={m.color} />
              </View>

              <Text style={[styles.modeLabel, isSelected && { color: m.color }]}>{m.label}</Text>
              <Text style={styles.modeSublabel}>{m.sublabel}</Text>

              <View style={styles.featureList}>
                {m.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <View style={[styles.featureDot, { backgroundColor: m.color }]} />
                    <Text style={styles.featureText}>{f}</Text>
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
          <Text style={styles.sectionLabel}>ขนาด Product Grid</Text>
          <View style={styles.gridSizeRow}>
            {GRID_SIZES.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.gridSizeBtn, gridSize === g.key && styles.gridSizeBtnActive]}
                onPress={() => setConfig({ gridSize: g.key, gridColumns: g.cols })}
                activeOpacity={0.8}
              >
                {/* Preview grid dots */}
                <View style={styles.gridPreview}>
                  {Array.from({ length: g.cols * 2 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.gridDot,
                        { width: `${(100 / g.cols) - 4}%` },
                        gridSize === g.key && { backgroundColor: Colors.primary },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.gridSizeLabel, gridSize === g.key && { color: Colors.primary, fontWeight: '700' }]}>
                  {g.label} ({g.cols} คอลัมน์)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Advanced Options */}
      <Text style={styles.sectionLabel}>ตัวเลือกเพิ่มเติม</Text>
      <View style={styles.optionsCard}>

        {/* Auto open camera */}
        {(mode === 'scan_only' || mode === 'both') && (
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="camera-outline" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.optionLabel}>เปิดกล้องทันที</Text>
                <Text style={styles.optionSub}>เปิดกล้องสแกนอัตโนมัติเมื่อเข้าหน้าขาย</Text>
              </View>
            </View>
            <Switch
              value={autoOpenCamera}
              onValueChange={(v) => setConfig({ autoOpenCamera: v })}
              trackColor={{ true: Colors.primary, false: Colors.gray200 }}
              thumbColor={Colors.white}
            />
          </View>
        )}

        {/* Split View (both only) */}
        {mode === 'both' && (
          <View style={[styles.optionRow, styles.optionRowBorder]}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="tablet-landscape-outline" size={18} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.optionLabel}>Split View (Tablet)</Text>
                <Text style={styles.optionSub}>แสดง grid ซ้าย + scanner ขวา พร้อมกัน</Text>
              </View>
            </View>
            <Switch
              value={splitView}
              onValueChange={(v) => setConfig({ splitView: v })}
              trackColor={{ true: '#7C3AED', false: Colors.gray200 }}
              thumbColor={Colors.white}
            />
          </View>
        )}

        {/* Beep on scan */}
        {(mode === 'scan_only' || mode === 'both') && (
          <View style={[styles.optionRow, styles.optionRowBorder]}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="volume-high-outline" size={18} color={Colors.success} />
              </View>
              <View>
                <Text style={styles.optionLabel}>เสียงบี๊ปเมื่อสแกน</Text>
                <Text style={styles.optionSub}>เล่นเสียงยืนยันทุกครั้งที่สแกนสำเร็จ</Text>
              </View>
            </View>
            <Switch
              value={beepOnScan}
              onValueChange={(v) => setConfig({ beepOnScan: v })}
              trackColor={{ true: Colors.success, false: Colors.gray200 }}
              thumbColor={Colors.white}
            />
          </View>
        )}
      </View>

      {/* Preview box */}
      <View style={styles.previewBox}>
        <Text style={styles.previewTitle}>
          <Ionicons name="eye-outline" size={14} color={Colors.primary} /> ตัวอย่างหน้าขาย
        </Text>
        <View style={styles.previewContent}>
          {mode !== 'scan_only' && (
            <View style={styles.previewGrid}>
              <View style={styles.previewHeader}>
                <Ionicons name="grid-outline" size={12} color={Colors.primary} />
                <Text style={styles.previewHeaderText}>Product Grid ({gridColumns} คอลัมน์)</Text>
              </View>
              <View style={styles.previewGridDots}>
                {Array.from({ length: gridColumns * 2 }).map((_, i) => (
                  <View key={i} style={[styles.previewDot, { width: `${100 / gridColumns - 2}%` }]} />
                ))}
              </View>
            </View>
          )}
          {mode !== 'button_only' && (
            <View style={[styles.previewScanner, mode === 'both' && splitView && { flex: 1 }]}>
              <View style={styles.previewHeader}>
                <Ionicons name="barcode-outline" size={12} color={Colors.success} />
                <Text style={[styles.previewHeaderText, { color: Colors.success }]}>Scanner</Text>
              </View>
              <View style={styles.previewScannerBox}>
                <Ionicons name="scan-outline" size={24} color={Colors.success} />
              </View>
            </View>
          )}
        </View>
      </View>

      {onClose && (
        <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
          <Text style={styles.doneBtnText}>เสร็จสิ้น</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
};

const compactStyles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.md, padding: 3, gap: 2 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: BorderRadius.sm - 2,
  },
  label: { fontSize: 11, fontWeight: '600', color: Colors.gray400 },
});

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  sheetHeader: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.gray200, borderRadius: 2 },
  sheetTitle: { ...Typography.h4, color: Colors.text },
  sectionLabel: { ...Typography.label, color: Colors.gray600, marginBottom: -Spacing.xs },

  // Mode Cards
  modeGrid: { flexDirection: 'row', gap: Spacing.sm },
  modeCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md,
    alignItems: 'center', gap: Spacing.xs, position: 'relative',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  selectedMark: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  modeIconBox: {
    width: 56, height: 56, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  modeLabel: { ...Typography.label, color: Colors.text, textAlign: 'center', fontWeight: '700' },
  modeSublabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  featureList: { width: '100%', gap: 3, marginTop: Spacing.xs },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  featureDot: { width: 5, height: 5, borderRadius: 3 },
  featureText: { ...Typography.caption, color: Colors.text, flex: 1 },

  // Grid Size
  gridSizeRow: { flexDirection: 'row', gap: Spacing.sm },
  gridSizeBtn: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.sm,
    alignItems: 'center', gap: Spacing.xs,
  },
  gridSizeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  gridPreview: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 3,
    width: '100%', justifyContent: 'center',
  },
  gridDot: {
    height: 16, backgroundColor: Colors.gray200,
    borderRadius: 3, marginBottom: 3,
  },
  gridSizeLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },

  // Options Card
  optionsCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
  optionRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  optionIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { ...Typography.label, color: Colors.text },
  optionSub: { ...Typography.caption, color: Colors.textSecondary, marginRight: Spacing.md },

  // Preview
  previewBox: {
    backgroundColor: Colors.gray50, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  previewTitle: { ...Typography.label, color: Colors.primary },
  previewContent: { flexDirection: 'row', gap: Spacing.sm, minHeight: 80 },
  previewGrid: { flex: 2, gap: Spacing.xs },
  previewScanner: { flex: 1, gap: Spacing.xs },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewHeaderText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  previewGridDots: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  previewDot: {
    height: 20, backgroundColor: Colors.primary + '30',
    borderRadius: 4, marginBottom: 3,
    opacity: 0.6,
  },
  previewScannerBox: {
    flex: 1, backgroundColor: '#1a1a2e', borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center', minHeight: 48,
  },

  doneBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  doneBtnText: { ...Typography.button, color: Colors.white },
});
