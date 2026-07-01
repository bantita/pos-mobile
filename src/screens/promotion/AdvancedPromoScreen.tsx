/**
 * AdvancedPromoScreen — โปรโมชั่นขั้นสูง (Buy X Get Y / Happy Hour)
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

type TabMode = 'buy_x_get_y' | 'happy_hour';

export const AdvancedPromoScreen: React.FC<Props> = ({ onBack }) => {
  const { createPromotion } = usePromoStore();
  const [tab, setTab] = useState<TabMode>('buy_x_get_y');

  // Buy X Get Y state
  const [bxName, setBxName] = useState('');
  const [bxCode, setBxCode] = useState('');
  const [buyQty, setBuyQty] = useState('');
  const [getQty, setGetQty] = useState('');
  const [getProductId, setGetProductId] = useState('');
  const [applicableProducts, setApplicableProducts] = useState('');
  const [bxStartDate, setBxStartDate] = useState('');
  const [bxEndDate, setBxEndDate] = useState('');

  // Happy Hour state
  const [hhName, setHhName] = useState('');
  const [hhCode, setHhCode] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hhDiscountPercent, setHhDiscountPercent] = useState('');
  const [hhCategories, setHhCategories] = useState('');
  const [hhStartDate, setHhStartDate] = useState('');
  const [hhEndDate, setHhEndDate] = useState('');

  const handleSubmitBuyXGetY = () => {
    if (!bxName.trim() || !bxCode.trim() || !buyQty.trim() || !getQty.trim()
      || !bxStartDate.trim() || !bxEndDate.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    createPromotion({
      name: bxName.trim(),
      promoCode: bxCode.trim().toUpperCase(),
      description: `ซื้อ ${buyQty} แถม ${getQty}`,
      type: 'buy_x_get_y',
      status: 'active',
      startDate: bxStartDate.trim(),
      endDate: bxEndDate.trim(),
      buyQty: Number(buyQty),
      getQty: Number(getQty),
      getProductId: getProductId.trim() || undefined,
      applicableProducts: applicableProducts
        ? applicableProducts.split(',').map(p => p.trim())
        : undefined,
      stackable: false,
      priority: 4,
      createdBy: 'admin',
      shopId: 'shop-01',
    });

    Alert.alert('สำเร็จ', 'สร้างโปร Buy X Get Y เรียบร้อย', [
      { text: 'ตกลง', onPress: onBack },
    ]);
  };

  const handleSubmitHappyHour = () => {
    if (!hhName.trim() || !hhCode.trim() || !startTime.trim() || !endTime.trim()
      || !hhDiscountPercent.trim() || !hhStartDate.trim() || !hhEndDate.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    createPromotion({
      name: hhName.trim(),
      promoCode: hhCode.trim().toUpperCase(),
      description: `Happy Hour ${startTime}-${endTime} ลด ${hhDiscountPercent}%`,
      type: 'happy_hour',
      status: 'active',
      startDate: hhStartDate.trim(),
      endDate: hhEndDate.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      discountPercent: Number(hhDiscountPercent),
      applicableCategories: hhCategories
        ? hhCategories.split(',').map(c => c.trim())
        : undefined,
      stackable: false,
      priority: 1,
      createdBy: 'admin',
      shopId: 'shop-01',
    });

    Alert.alert('สำเร็จ', 'สร้างโปร Happy Hour เรียบร้อย', [
      { text: 'ตกลง', onPress: onBack },
    ]);
  };

  const renderBuyXGetY = () => (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>ชื่อโปรโมชั่น *</Text>
        <TextInput style={styles.input} value={bxName} onChangeText={setBxName}
          placeholder="เช่น ซื้อ 3 แถม 1" placeholderTextColor={Colors.gray400} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>รหัสโปรโมชั่น *</Text>
        <TextInput style={styles.input} value={bxCode} onChangeText={setBxCode}
          placeholder="เช่น BUY3GET1" placeholderTextColor={Colors.gray400}
          autoCapitalize="characters" />
      </View>
      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>จำนวนที่ซื้อ *</Text>
          <TextInput style={styles.input} value={buyQty} onChangeText={setBuyQty}
            placeholder="3" placeholderTextColor={Colors.gray400} keyboardType="numeric" />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>จำนวนที่แถม *</Text>
          <TextInput style={styles.input} value={getQty} onChangeText={setGetQty}
            placeholder="1" placeholderTextColor={Colors.gray400} keyboardType="numeric" />
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>รหัสสินค้าที่แถม</Text>
        <TextInput style={styles.input} value={getProductId}
          onChangeText={setGetProductId} placeholder="เช่น P001"
          placeholderTextColor={Colors.gray400} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>สินค้าที่ร่วมรายการ (คั่นด้วย ,)</Text>
        <TextInput style={styles.input} value={applicableProducts}
          onChangeText={setApplicableProducts} placeholder="P001, P002"
          placeholderTextColor={Colors.gray400} />
      </View>
      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>วันเริ่มต้น *</Text>
          <TextInput style={styles.input} value={bxStartDate}
            onChangeText={setBxStartDate} placeholder="2026-01-01"
            placeholderTextColor={Colors.gray400} />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>วันสิ้นสุด *</Text>
          <TextInput style={styles.input} value={bxEndDate}
            onChangeText={setBxEndDate} placeholder="2026-12-31"
            placeholderTextColor={Colors.gray400} />
        </View>
      </View>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitBuyXGetY}
        activeOpacity={0.85}>
        <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
        <Text style={styles.submitText}>สร้างโปรโมชั่น</Text>
      </TouchableOpacity>
    </>
  );

  const renderHappyHour = () => (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>ชื่อโปรโมชั่น *</Text>
        <TextInput style={styles.input} value={hhName} onChangeText={setHhName}
          placeholder="เช่น Happy Hour 17:00-19:00" placeholderTextColor={Colors.gray400} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>รหัสโปรโมชั่น *</Text>
        <TextInput style={styles.input} value={hhCode} onChangeText={setHhCode}
          placeholder="เช่น HAPPY-1719" placeholderTextColor={Colors.gray400}
          autoCapitalize="characters" />
      </View>
      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>เวลาเริ่ม (HH:mm) *</Text>
          <TextInput style={styles.input} value={startTime}
            onChangeText={setStartTime} placeholder="17:00"
            placeholderTextColor={Colors.gray400} />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>เวลาสิ้นสุด (HH:mm) *</Text>
          <TextInput style={styles.input} value={endTime}
            onChangeText={setEndTime} placeholder="19:00"
            placeholderTextColor={Colors.gray400} />
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>ส่วนลด (%) *</Text>
        <TextInput style={styles.input} value={hhDiscountPercent}
          onChangeText={setHhDiscountPercent} placeholder="20"
          placeholderTextColor={Colors.gray400} keyboardType="numeric" />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>หมวดหมู่ที่ใช้ได้ (คั่นด้วย ,)</Text>
        <TextInput style={styles.input} value={hhCategories}
          onChangeText={setHhCategories} placeholder="เครื่องดื่ม, ขนม"
          placeholderTextColor={Colors.gray400} />
      </View>
      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>วันเริ่มต้น *</Text>
          <TextInput style={styles.input} value={hhStartDate}
            onChangeText={setHhStartDate} placeholder="2026-01-01"
            placeholderTextColor={Colors.gray400} />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>วันสิ้นสุด *</Text>
          <TextInput style={styles.input} value={hhEndDate}
            onChangeText={setHhEndDate} placeholder="2026-12-31"
            placeholderTextColor={Colors.gray400} />
        </View>
      </View>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitHappyHour}
        activeOpacity={0.85}>
        <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
        <Text style={styles.submitText}>สร้างโปรโมชั่น</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>โปรโมชั่นขั้นสูง</Text>
          <Text style={styles.headerSub}>Advanced Promotion</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'buy_x_get_y' && styles.tabActive]}
          onPress={() => setTab('buy_x_get_y')}
        >
          <Ionicons name="gift-outline" size={16}
            color={tab === 'buy_x_get_y' ? Colors.primary : Colors.gray500} />
          <Text style={[styles.tabText,
            tab === 'buy_x_get_y' && styles.tabTextActive]}>Buy X Get Y</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'happy_hour' && styles.tabActive]}
          onPress={() => setTab('happy_hour')}
        >
          <Ionicons name="time-outline" size={16}
            color={tab === 'happy_hour' ? Colors.primary : Colors.gray500} />
          <Text style={[styles.tabText,
            tab === 'happy_hour' && styles.tabTextActive]}>Happy Hour</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {tab === 'buy_x_get_y' ? renderBuyXGetY() : renderHappyHour()}
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
  tabBar: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.md, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { ...Typography.label, color: Colors.gray500 },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  form: { padding: Spacing.md, gap: Spacing.md },
  field: { gap: Spacing.xs },
  label: { ...Typography.label, color: Colors.text },
  input: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 48, ...Typography.body2, color: Colors.text },
  row: { flexDirection: 'row', gap: Spacing.sm },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, marginTop: Spacing.md },
  submitText: { ...Typography.button, color: Colors.white },
});
