/**
 * MemberPriceScreen — สร้างโปรโมชั่นราคาสมาชิก
 * M07 Promotion Engine
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePromoStore } from '../../store/promoStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onBack: () => void;
}

const LEVELS = [
  { key: 'silver', label: 'Silver' },
  { key: 'gold', label: 'Gold' },
  { key: 'platinum', label: 'Platinum' },
];

export const MemberPriceScreen: React.FC<Props> = ({ onBack }) => {
  const { createPromotion } = usePromoStore();

  const [name, setName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const toggleLevel = (key: string) => {
    setSelectedLevels((prev) =>
      prev.includes(key) ? prev.filter(l => l !== key) : [...prev, key]
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || !promoCode.trim() || !discountPercent.trim()
      || !startDate.trim() || !endDate.trim() || selectedLevels.length === 0) {
      Alert.alert('ข้อมูลไม่ครบ',
        'กรุณากรอกข้อมูลที่จำเป็นและเลือกระดับสมาชิกอย่างน้อย 1 ระดับ');
      return;
    }

    createPromotion({
      name: name.trim(),
      promoCode: promoCode.trim().toUpperCase(),
      description: `ราคาสมาชิก ลด ${discountPercent}% สำหรับ ${selectedLevels.join(', ')}`,
      type: 'member_price',
      status: 'active',
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      discountPercent: Number(discountPercent),
      applicableLevels: selectedLevels,
      stackable: true,
      priority: 5,
      createdBy: 'admin',
      shopId: 'shop-01',
    });

    Alert.alert('สำเร็จ', 'สร้างโปรโมชั่นราคาสมาชิกเรียบร้อย', [
      { text: 'ตกลง', onPress: onBack },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ราคาสมาชิก</Text>
          <Text style={styles.headerSub}>Member Price</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.label}>ชื่อโปรโมชั่น *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName}
            placeholder="เช่น ราคาสมาชิก Gold ลด 5%"
            placeholderTextColor={Colors.gray400} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>รหัสโปรโมชั่น *</Text>
          <TextInput style={styles.input} value={promoCode} onChangeText={setPromoCode}
            placeholder="เช่น GOLD-5PCT" placeholderTextColor={Colors.gray400}
            autoCapitalize="characters" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>ส่วนลด (%) *</Text>
          <TextInput style={styles.input} value={discountPercent}
            onChangeText={setDiscountPercent} placeholder="5"
            placeholderTextColor={Colors.gray400} keyboardType="numeric" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>ระดับสมาชิกที่ใช้ได้ *</Text>
          <View style={styles.checkboxGroup}>
            {LEVELS.map((lv) => {
              const selected = selectedLevels.includes(lv.key);
              return (
                <TouchableOpacity
                  key={lv.key}
                  style={[styles.checkboxItem, selected && styles.checkboxSelected]}
                  onPress={() => toggleLevel(lv.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={selected ? Colors.primary : Colors.gray400}
                  />
                  <Text style={[styles.checkboxLabel,
                    selected && { color: Colors.primary, fontWeight: '600' }]}>
                    {lv.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>วันเริ่มต้น *</Text>
            <TextInput style={styles.input} value={startDate}
              onChangeText={setStartDate} placeholder="2026-01-01"
              placeholderTextColor={Colors.gray400} />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>วันสิ้นสุด *</Text>
            <TextInput style={styles.input} value={endDate}
              onChangeText={setEndDate} placeholder="2026-12-31"
              placeholderTextColor={Colors.gray400} />
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}
          activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
          <Text style={styles.submitText}>สร้างโปรโมชั่น</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  form: { padding: Spacing.md, gap: Spacing.md },
  field: { gap: Spacing.xs },
  label: { ...Typography.label, color: Colors.text },
  input: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 48, ...Typography.body2, color: Colors.text },
  row: { flexDirection: 'row', gap: Spacing.sm },
  checkboxGroup: { gap: Spacing.xs },
  checkboxItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  checkboxSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  checkboxLabel: { ...Typography.body2, color: Colors.text },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, marginTop: Spacing.md },
  submitText: { ...Typography.button, color: Colors.white },
});
