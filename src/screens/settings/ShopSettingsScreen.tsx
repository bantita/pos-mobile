/**
 * SCR-SET-001 ShopSettingsScreen
 * ตั้งค่าร้านค้า — ชื่อร้าน, ที่อยู่, VAT, ใบเสร็จ, ประเภทร้าน, Service Charge
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Switch, TouchableOpacity, Alert, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatDateTime } from '../../utils/format';
import { usePermission } from '../../hooks/usePermission';
import { usePermissionStore } from '../../store/permissionStore';
import { PermissionGuard } from '../../components/settings/PermissionGuard';
import { StoreType, BusinessType, BusinessScale } from '../../types/store';
import { useStoreConfigStore, STORE_TYPE_META } from '../../store/storeConfigStore';
import { useAuthStore } from '../../store/authStore';

interface ShopSettingsScreenProps {
  onBack: () => void;
}

export const ShopSettingsScreen: React.FC<ShopSettingsScreenProps> = ({ onBack }) => {
  const { isOwner, isAdmin, role } = usePermission();
  const { addAuditLog, currentRole } = usePermissionStore();
  const canEdit = isOwner || isAdmin;

  // Store Config (global)
  const {
    storeType, serviceCharge, businessType, businessScale,
    setStoreType, setServiceCharge, setBusinessType, setBusinessScale,
  } = useStoreConfigStore();

  const [shopName, setShopName] = useState('ร้านสะดวกซื้อ ABC');
  const [address, setAddress] = useState('123 ถ.รัชดาภิเษก แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900');
  const [taxId, setTaxId] = useState('0105556123456');
  const [phone, setPhone] = useState('02-123-4567');
  const [vatEnabled, setVatEnabled] = useState(true);
  const [receiptFooter, setReceiptFooter] = useState('ขอบคุณที่ใช้บริการ กรุณาตรวจสอบสินค้าก่อนออกจากร้าน');
  const [showTaxId, setShowTaxId] = useState(true);
  const [lastUpdated] = useState(new Date(Date.now() - 3600000));

  // Service Charge local state (synced to global on save)
  const [scEnabled, setScEnabled] = useState(serviceCharge.enabled);
  const [scMode, setScMode] = useState<'percentage' | 'fixed'>(serviceCharge.mode);
  const [scValue, setScValue] = useState(String(serviceCharge.value));

  const handleSave = () => {
    if (taxId.length !== 13) {
      Alert.alert('ข้อผิดพลาด', 'เลขผู้เสียภาษีต้องมี 13 หลัก');
      return;
    }
    // Save service charge to global store
    setServiceCharge({
      enabled: scEnabled,
      mode: scMode,
      value: parseFloat(scValue) || 0,
    });
    addAuditLog({
      userId: 'usr_001',
      userName: 'สมชาย เจ้าของร้าน',
      userRole: currentRole,
      action: 'SHOP_SETTINGS_CHANGE',
      module: 'settings',
      description: `แก้ไขตั้งค่าร้านค้า: ${shopName}`,
      afterValue: `VAT: ${vatEnabled ? 'เปิด 7%' : 'ปิด'}, ประเภท: ${STORE_TYPE_META[storeType].label}, SC: ${scEnabled ? scValue + (scMode === 'percentage' ? '%' : '฿') : 'ปิด'}`,
      deviceId: 'POS-001',
    });
    Alert.alert('สำเร็จ', 'บันทึกตั้งค่าร้านค้าเรียบร้อย');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>ตั้งค่าร้านค้า</Text>
          <Text style={styles.headerSub}>Shop Settings</Text>
        </View>
        <Ionicons name="storefront-outline" size={24} color={Colors.textSecondary} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Permission notice */}
        {!canEdit && (
          <View style={styles.noticeBox}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.warning} />
            <Text style={styles.noticeText}>คุณมีสิทธิ์ดูเท่านั้น (Role: {role})</Text>
          </View>
        )}

        {/* Logo */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>โลโก้ร้านค้า</Text>
          <TouchableOpacity
            style={styles.logoPlaceholder}
            disabled={!canEdit}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS === 'web') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/png,image/jpeg';
                input.onchange = (e: any) => {
                  const file = e.target?.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const uri = reader.result as string;
                      useStoreConfigStore.getState().setShopLogo(uri);
                      Alert.alert('สำเร็จ', 'อัปโหลดโลโก้เรียบร้อย');
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              } else {
                Alert.alert('อัปโหลดโลโก้', 'เลือกรูปจากแกลเลอรี่ (ต้องติดตั้ง expo-image-picker)');
              }
            }}
          >
            {useStoreConfigStore.getState().shopLogo ? (
              <Image source={{ uri: useStoreConfigStore.getState().shopLogo }} style={{ width: 80, height: 80, borderRadius: 12 }} resizeMode="contain" />
            ) : (
              <Ionicons name="camera-outline" size={32} color={Colors.gray400} />
            )}
            <Text style={styles.logoHint}>แตะเพื่อเลือกรูปโลโก้</Text>
            <Text style={styles.logoSubHint}>PNG, JPG ขนาดสูงสุด 2MB</Text>
          </TouchableOpacity>
        </View>

        {/* ตัวเลือกสินค้า (Variant Fields) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ตัวเลือกสินค้า (Variant)</Text>
          <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md }}>
            เปิด/ปิดฟิลด์เพิ่มเติมที่แสดงในฟอร์มสินค้าและรายการสินค้า
          </Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>สี (Color)</Text>
              <Text style={styles.switchHint}>เช่น ดำ, ขาว, แดง</Text>
            </View>
            <Switch
              value={useStoreConfigStore.getState().variantColor}
              onValueChange={(v) => useStoreConfigStore.getState().setVariantColor(v)}
              trackColor={{ true: Colors.primary, false: Colors.border }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Lot / Batch</Text>
              <Text style={styles.switchHint}>เลข Lot การผลิต เช่น LOT-2024-06A</Text>
            </View>
            <Switch
              value={useStoreConfigStore.getState().variantLot}
              onValueChange={(v) => useStoreConfigStore.getState().setVariantLot(v)}
              trackColor={{ true: Colors.primary, false: Colors.border }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>ไซส์ / ขนาด (Size)</Text>
              <Text style={styles.switchHint}>เช่น S, M, L, XL หรือ 250ml, 500ml</Text>
            </View>
            <Switch
              value={useStoreConfigStore.getState().variantSize}
              onValueChange={(v) => useStoreConfigStore.getState().setVariantSize(v)}
              trackColor={{ true: Colors.primary, false: Colors.border }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>ปี / รุ่น (Model Year)</Text>
              <Text style={styles.switchHint}>เช่น 2024, 2025</Text>
            </View>
            <Switch
              value={useStoreConfigStore.getState().variantYear}
              onValueChange={(v) => useStoreConfigStore.getState().setVariantYear(v)}
              trackColor={{ true: Colors.primary, false: Colors.border }}
            />
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ข้อมูลพื้นฐาน</Text>

          <View style={styles.field}>
            <Text style={styles.label}>ชื่อร้านค้า <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, !canEdit && styles.inputDisabled]}
              value={shopName}
              onChangeText={setShopName}
              editable={canEdit}
              placeholder="ชื่อร้านค้า"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>ที่อยู่</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, !canEdit && styles.inputDisabled]}
              value={address}
              onChangeText={setAddress}
              editable={canEdit}
              multiline
              numberOfLines={3}
              placeholder="ที่อยู่ร้านค้า"
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>เลขประจำตัวผู้เสียภาษี (13 หลัก)</Text>
            <TextInput
              style={[styles.input, !canEdit && styles.inputDisabled]}
              value={taxId}
              onChangeText={(t) => setTaxId(t.replace(/\D/g, '').slice(0, 13))}
              editable={canEdit}
              keyboardType="number-pad"
              maxLength={13}
              placeholder="0000000000000"
            />
            <Text style={styles.inputHint}>{taxId.length}/13 หลัก</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>เบอร์โทรศัพท์</Text>
            <TextInput
              style={[styles.input, !canEdit && styles.inputDisabled]}
              value={phone}
              onChangeText={setPhone}
              editable={canEdit}
              keyboardType="phone-pad"
              placeholder="02-xxx-xxxx"
            />
          </View>
        </View>

        {/* Store Type */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ประเภทธุรกิจ</Text>
          <View style={styles.storeTypeGrid}>
            {([
              { type: 'SERVICE' as BusinessType, icon: 'cut-outline', label: 'ร้านบริการ', desc: 'ตัดผม, สปา, นวด, เสริมสวย' },
              { type: 'RETAIL' as BusinessType, icon: 'storefront-outline', label: 'ร้านค้าปลีก/ค้าส่ง', desc: 'ร้านค้า, คาเฟ่, ร้านอาหาร' },
            ]).map((item) => {
              const isSelected = businessType === item.type;
              return (
                <TouchableOpacity
                  key={item.type}
                  style={[styles.storeTypeRow, isSelected && styles.storeTypeRowActive]}
                  onPress={() => { if (canEdit) { setBusinessType(item.type); setStoreType(item.type); } }}
                  disabled={!canEdit}
                  activeOpacity={0.7}
                >
                  <View style={[styles.storeTypeIconBox, isSelected && styles.storeTypeIconBoxActive]}>
                    <Ionicons name={item.icon as any} size={22} color={isSelected ? Colors.white : Colors.gray500} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.storeTypeLabel, isSelected && styles.storeTypeLabelActive]}>{item.label}</Text>
                    <Text style={styles.storeTypeDesc}>{item.desc}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>ขนาดธุรกิจ</Text>
          <View style={styles.storeTypeGrid}>
            {([
              { scale: 'BUSINESS' as BusinessScale, icon: 'home-outline', label: 'Business', desc: 'ร้านเดียว หลายจุดขาย' },
              { scale: 'ENTERPRISE' as BusinessScale, icon: 'business-outline', label: 'Enterprise', desc: 'หลายสาขา หลายจุดขาย' },
            ]).map((item) => {
              const isSelected = businessScale === item.scale;
              return (
                <TouchableOpacity
                  key={item.scale}
                  style={[styles.storeTypeRow, isSelected && styles.storeTypeRowActive]}
                  onPress={() => { if (canEdit) { setBusinessScale(item.scale); if (item.scale === 'ENTERPRISE') setStoreType('ENTERPRISE'); } }}
                  disabled={!canEdit}
                  activeOpacity={0.7}
                >
                  <View style={[styles.storeTypeIconBox, isSelected && styles.storeTypeIconBoxActive]}>
                    <Ionicons name={item.icon as any} size={22} color={isSelected ? Colors.white : Colors.gray500} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.storeTypeLabel, isSelected && styles.storeTypeLabelActive]}>{item.label}</Text>
                    <Text style={styles.storeTypeDesc}>{item.desc}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Service Charge */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>เซอร์วิสชาร์จ (Service Charge)</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>เปิดใช้ Service Charge</Text>
              <Text style={styles.switchSub}>
                {scEnabled
                  ? `บวก ${scValue}${scMode === 'percentage' ? '%' : ' บาท'} ต่อบิล`
                  : 'ปิดการเก็บ service charge'}
              </Text>
            </View>
            <Switch
              value={scEnabled}
              onValueChange={canEdit ? setScEnabled : undefined}
              trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
              thumbColor={scEnabled ? Colors.primary : Colors.gray400}
              disabled={!canEdit}
            />
          </View>

          {scEnabled && (
            <>
              <View style={styles.scModeRow}>
                <TouchableOpacity
                  style={[styles.scModeBtn, scMode === 'percentage' && styles.scModeBtnActive]}
                  onPress={() => canEdit && setScMode('percentage')}
                  disabled={!canEdit}
                >
                  <Ionicons name="trending-up-outline" size={16} color={scMode === 'percentage' ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.scModeBtnText, scMode === 'percentage' && styles.scModeBtnTextActive]}>เปอร์เซ็นต์ (%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.scModeBtn, scMode === 'fixed' && styles.scModeBtnActive]}
                  onPress={() => canEdit && setScMode('fixed')}
                  disabled={!canEdit}
                >
                  <Ionicons name="cash-outline" size={16} color={scMode === 'fixed' ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.scModeBtnText, scMode === 'fixed' && styles.scModeBtnTextActive]}>จำนวนเงินคงที่ (฿)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  {scMode === 'percentage' ? 'อัตรา Service Charge (%)' : 'จำนวนเงิน Service Charge (บาท)'}
                </Text>
                <TextInput
                  style={[styles.input, !canEdit && styles.inputDisabled]}
                  value={scValue}
                  onChangeText={(t) => setScValue(t.replace(/[^0-9.]/g, ''))}
                  editable={canEdit}
                  keyboardType="decimal-pad"
                  placeholder={scMode === 'percentage' ? 'เช่น 10' : 'เช่น 50'}
                />
                <Text style={styles.inputHint}>
                  {scMode === 'percentage'
                    ? `ตัวอย่าง: ยอด ฿1,000 → SC ${scValue}% = ฿${((parseFloat(scValue) || 0) * 10).toFixed(0)}`
                    : `บวกคงที่ ฿${scValue} ทุกบิล`}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* VAT Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ภาษีมูลค่าเพิ่ม (VAT)</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>เปิดใช้ VAT 7%</Text>
              <Text style={styles.switchSub}>
                {vatEnabled ? 'ราคาสินค้ารวม VAT 7%' : 'ราคาสินค้าไม่รวม VAT'}
              </Text>
            </View>
            <Switch
              value={vatEnabled}
              onValueChange={canEdit ? setVatEnabled : undefined}
              trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
              thumbColor={vatEnabled ? Colors.primary : Colors.gray400}
              disabled={!canEdit}
            />
          </View>
        </View>

        {/* Receipt Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ตั้งค่าใบเสร็จ</Text>

          <View style={styles.field}>
            <Text style={styles.label}>ข้อความท้ายใบเสร็จ</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, !canEdit && styles.inputDisabled]}
              value={receiptFooter}
              onChangeText={setReceiptFooter}
              editable={canEdit}
              multiline
              numberOfLines={3}
              placeholder="ข้อความที่ต้องการแสดงท้ายใบเสร็จ"
              textAlignVertical="top"
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>แสดงเลขผู้เสียภาษีในใบเสร็จ</Text>
              <Text style={styles.switchSub}>พิมพ์เลข {taxId || 'xxxxxxxxxxxxxxx'} บนใบเสร็จ</Text>
            </View>
            <Switch
              value={showTaxId}
              onValueChange={canEdit ? setShowTaxId : undefined}
              trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
              thumbColor={showTaxId ? Colors.primary : Colors.gray400}
              disabled={!canEdit}
            />
          </View>
        </View>

        {/* Last updated */}
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>อัปเดตล่าสุด: {formatDateTime(lastUpdated)}</Text>
        </View>

        {/* Save */}
        <PermissionGuard module="settings" action="edit">
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
            <Text style={styles.saveBtnText}>บันทึกการตั้งค่า</Text>
          </TouchableOpacity>
        </PermissionGuard>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: Colors.textSecondary },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  noticeText: { ...Typography.caption, color: Colors.warning, flex: 1 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary },
  logoPlaceholder: {
    height: 120,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.backgroundSecondary,
  },
  logoHint: { ...Typography.body2, color: Colors.textSecondary },
  logoSubHint: { ...Typography.caption, color: Colors.gray400 },
  field: { gap: 6 },
  label: { ...Typography.label, color: Colors.textSecondary },
  required: { color: Colors.danger },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    ...Typography.body1,
    color: Colors.text,
  },
  inputMultiline: { minHeight: 80 },
  inputDisabled: { backgroundColor: Colors.gray100, color: Colors.textDisabled },
  inputHint: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'right' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  switchInfo: { flex: 1, gap: 2 },
  switchLabel: { ...Typography.label, color: Colors.text },
  switchHint: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  switchSub: { ...Typography.caption, color: Colors.textSecondary },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
    marginTop: -Spacing.xs,
  },
  metaText: { ...Typography.caption, color: Colors.textSecondary },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  saveBtnText: { ...Typography.button, color: Colors.white },

  // Store Type styles
  storeTypeGrid: { gap: Spacing.sm },
  storeTypeRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.backgroundSecondary,
  },
  storeTypeRowActive: {
    borderColor: Colors.primary, backgroundColor: Colors.primaryLight,
  },
  storeTypeIconBox: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center',
  },
  storeTypeIconBoxActive: { backgroundColor: Colors.primary },
  storeTypeLabel: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  storeTypeLabelActive: { color: Colors.primary },
  storeTypeDesc: { ...Typography.caption, color: Colors.textSecondary },

  // Service Charge styles
  scModeRow: { flexDirection: 'row', gap: Spacing.sm },
  scModeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundSecondary, borderWidth: 1, borderColor: Colors.border,
  },
  scModeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  scModeBtnText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  scModeBtnTextActive: { color: Colors.white },
});
