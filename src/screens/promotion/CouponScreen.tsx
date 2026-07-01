/**
 * CouponScreen — สร้างคูปองส่วนลด
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

export const CouponScreen: React.FC<Props> = ({ onBack }) => {
  const { createPromotion } = usePromoStore();

  const [name, setName] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [couponLimit, setCouponLimit] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !couponCode.trim() || !discountAmount.trim()
      || !startDate.trim() || !endDate.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    createPromotion({
      name: name.trim(),
      promoCode: couponCode.trim().toUpperCase(),
      couponCode: couponCode.trim().toUpperCase(),
      description: `คูปองลด ${discountAmount} บาท`,
      type: 'coupon',
      status: 'active',
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      discountAmount: Number(discountAmount),
      couponLimit: couponLimit ? Number(couponLimit) : undefined,
      minPurchase: minPurchase ? Number(minPurchase) : undefined,
      stackable: false,
      priority: 3,
      createdBy: 'admin',
      shopId: 'shop-01',
    });

    Alert.alert('สำเร็จ', 'สร้างคูปองส่วนลดเรียบร้อย', [
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
          <Text style={styles.headerTitle}>สร้างคูปอง</Text>
          <Text style={styles.headerSub}>Coupon</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.label}>ชื่อคูปอง *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName}
            placeholder="เช่น คูปอง SUMMER ลด 100 บาท"
            placeholderTextColor={Colors.gray400} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>รหัสคูปอง *</Text>
          <TextInput style={styles.input} value={couponCode} onChangeText={setCouponCode}
            placeholder="เช่น SUMMER2024" placeholderTextColor={Colors.gray400}
            autoCapitalize="characters" />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>ส่วนลด (บาท) *</Text>
            <TextInput style={styles.input} value={discountAmount}
              onChangeText={setDiscountAmount} placeholder="100"
              placeholderTextColor={Colors.gray400} keyboardType="numeric" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>จำนวนสิทธิ์</Text>
            <TextInput style={styles.input} value={couponLimit}
              onChangeText={setCouponLimit} placeholder="200"
              placeholderTextColor={Colors.gray400} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>ยอดซื้อขั้นต่ำ (บาท)</Text>
          <TextInput style={styles.input} value={minPurchase}
            onChangeText={setMinPurchase} placeholder="300"
            placeholderTextColor={Colors.gray400} keyboardType="numeric" />
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
          <Text style={styles.submitText}>สร้างคูปอง</Text>
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
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, marginTop: Spacing.md },
  submitText: { ...Typography.button, color: Colors.white },
});
