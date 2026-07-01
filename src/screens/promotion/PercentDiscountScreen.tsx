/**
 * PercentDiscountScreen — สร้างโปรโมชั่นส่วนลดเปอร์เซ็นต์
 * M07 Promotion Engine
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePromoStore } from '../../store/promoStore';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { DatePicker } from '../../components/ui/DatePicker';

interface Props {
  onBack: () => void;
}

export const PercentDiscountScreen: React.FC<Props> = ({ onBack }) => {
  const { createPromotion } = usePromoStore();

  const [name, setName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applicableCategories, setApplicableCategories] = useState('');
  const [stackable, setStackable] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !promoCode.trim() || !discountPercent.trim() || !startDate.trim() || !endDate.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    createPromotion({
      name: name.trim(),
      promoCode: promoCode.trim().toUpperCase(),
      description: `ส่วนลด ${discountPercent}%`,
      type: 'percent',
      status: 'active',
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      discountPercent: Number(discountPercent),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      minPurchase: minPurchase ? Number(minPurchase) : undefined,
      applicableCategories: applicableCategories ? applicableCategories.split(',').map(c => c.trim()) : undefined,
      stackable,
      priority: 1,
      createdBy: 'admin',
      shopId: 'shop-01',
    });

    Alert.alert('สำเร็จ', 'สร้างโปรโมชั่นส่วนลด % เรียบร้อย', [
      { text: 'ตกลง', onPress: onBack },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ส่วนลดเปอร์เซ็นต์</Text>
          <Text style={styles.headerSub}>Percent Discount</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.label}>ชื่อโปรโมชั่น *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="เช่น ลด 10% ทุกสินค้า" placeholderTextColor={Colors.gray400} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>รหัสโปรโมชั่น *</Text>
          <TextInput style={styles.input} value={promoCode} onChangeText={setPromoCode} placeholder="เช่น DISC10ALL" placeholderTextColor={Colors.gray400} autoCapitalize="characters" />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>ส่วนลด (%) *</Text>
            <TextInput style={styles.input} value={discountPercent} onChangeText={setDiscountPercent} placeholder="10" placeholderTextColor={Colors.gray400} keyboardType="numeric" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>ลดสูงสุด (บาท)</Text>
            <TextInput style={styles.input} value={maxDiscount} onChangeText={setMaxDiscount} placeholder="500" placeholderTextColor={Colors.gray400} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>ยอดซื้อขั้นต่ำ (บาท)</Text>
          <TextInput style={styles.input} value={minPurchase} onChangeText={setMinPurchase} placeholder="0" placeholderTextColor={Colors.gray400} keyboardType="numeric" />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <DatePicker
              label="วันเริ่มต้น *"
              value={startDate ? new Date(startDate) : null}
              onChange={(d) => setStartDate(d ? d.toISOString().slice(0, 10) : '')}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <DatePicker
              label="วันสิ้นสุด *"
              value={endDate ? new Date(endDate) : null}
              onChange={(d) => setEndDate(d ? d.toISOString().slice(0, 10) : '')}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>หมวดหมู่ที่ใช้ได้ (คั่นด้วย ,)</Text>
          <TextInput style={styles.input} value={applicableCategories} onChangeText={setApplicableCategories} placeholder="เครื่องดื่ม, อาหาร" placeholderTextColor={Colors.gray400} />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>ใช้ร่วมกับโปรอื่นได้</Text>
            <Text style={styles.switchHint}>อนุญาตให้ซ้อนโปรโมชั่นกับโปรอื่น</Text>
          </View>
          <Switch
            value={stackable}
            onValueChange={setStackable}
            trackColor={{ false: Colors.gray300, true: Colors.primaryMid }}
            thumbColor={stackable ? Colors.primary : Colors.gray100}
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
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
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  switchHint: { ...Typography.caption, color: Colors.textSecondary },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, marginTop: Spacing.md },
  submitText: { ...Typography.button, color: Colors.white },
});
