import React, { useState } from 'react';
import { Switch, Platform, Image } from 'react-native';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { formatDateTime } from '@/shared/lib/format';
import { usePermission } from '@/shared/hooks/usePermission';
import { usePermissionStore } from '@/features/settings/application/stores/permissionStore';
import { PermissionGuard } from '@/features/settings/presentation/components/PermissionGuard';
import { StoreType, BusinessType, BusinessScale } from '@/features/settings/domain/store';
import { useStoreConfigStore, STORE_TYPE_META } from '@/features/settings/application/stores/storeConfigStore';
import { useAuthStore } from '@/features/auth/application/stores/authStore';

interface ShopSettingsScreenProps {
  onBack: () => void;
}

export const ShopSettingsScreen: React.FC<ShopSettingsScreenProps> = ({ onBack }) => {
  const { isOwner, isAdmin, role } = usePermission();
  const { addAuditLog, currentRole } = usePermissionStore();
  const canEdit = isOwner || isAdmin;

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

  const [scEnabled, setScEnabled] = useState(serviceCharge.enabled);
  const [scMode, setScMode] = useState<'percentage' | 'fixed'>(serviceCharge.mode);
  const [scValue, setScValue] = useState(String(serviceCharge.value));

  const [alertDialog, setAlertDialog] = useState<{ visible: boolean; title: string; message: string; variant?: 'info' | 'success' | 'warning' | 'danger' }>({ visible: false, title: '', message: '' });

  const handleSave = () => {
    if (taxId.length !== 13) {
      setAlertDialog({ visible: true, title: 'ข้อผิดพลาด', message: 'เลขผู้เสียภาษีต้องมี 13 หลัก', variant: 'warning' });
      return;
    }
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
    setAlertDialog({ visible: true, title: 'สำเร็จ', message: 'บันทึกตั้งค่าร้านค้าเรียบร้อย', variant: 'success' });
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('bg-rose-600 flex-row items-center gap-2 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View>
          <Text className={cn('text-lg font-extrabold text-white')}>ตั้งค่าร้านค้า</Text>
          <Text className={cn('text-xs font-medium text-rose-100')}>Shop Settings</Text>
        </View>
        <Ionicons name="storefront-outline" size={24} color="#fecdd3" />
      </View>

      <ScrollView className={cn('flex-1')} contentContainerStyle={{ padding: 12, gap: 12 }} showsVerticalScrollIndicator={false}>
        {!canEdit && (
          <View className={cn('flex-row items-center gap-1 bg-amber-100 rounded-xl p-2 border-l-4')} style={{ borderLeftColor: '#a16207' }}>
            <Ionicons name="lock-closed-outline" size={16} color="#a16207" />
            <Text className={cn('text-xs font-medium text-amber-700 flex-1')}>คุณมีสิทธิ์ดูเท่านั้น (Role: {role})</Text>
          </View>
        )}

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-600')}>โลโก้ร้านค้า</Text>
          <TouchableOpacity
            className={cn('h-30 border-2 border-slate-200 border-dashed rounded-xl items-center justify-center gap-1 bg-[#f6f7fb]')}
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
                      setAlertDialog({ visible: true, title: 'สำเร็จ', message: 'อัปโหลดโลโก้เรียบร้อย', variant: 'success' });
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              } else {
                setAlertDialog({ visible: true, title: 'อัปโหลดโลโก้', message: 'เลือกรูปจากแกลเลอรี่ (ต้องติดตั้ง expo-image-picker)' });
              }
            }}
          >
            {useStoreConfigStore.getState().shopLogo ? (
              <Image source={{ uri: useStoreConfigStore.getState().shopLogo }} style={{ width: 80, height: 80, borderRadius: 12 }} resizeMode="contain" />
            ) : (
              <Ionicons name="camera-outline" size={32} color="#9ca3af" />
            )}
            <Text className={cn('text-base font-medium text-slate-600')}>แตะเพื่อเลือกรูปโลโก้</Text>
            <Text className={cn('text-xs font-medium text-gray-400')}>PNG, JPG ขนาดสูงสุด 2MB</Text>
          </TouchableOpacity>
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-600')}>ตัวเลือกสินค้า (Variant)</Text>
          <Text className={cn('text-xs font-medium text-slate-600 mb-3')}>
            เปิด/ปิดฟิลด์เพิ่มเติมที่แสดงในฟอร์มสินค้าและรายการสินค้า
          </Text>

          <View className={cn('flex-row items-center justify-between gap-2')}>
            <View style={{ flex: 1 }}>
              <Text className={cn('text-xs font-bold text-slate-950')}>สี (Color)</Text>
              <Text className={cn('text-xs font-medium text-slate-600 mt-0.5')}>เช่น ดำ, ขาว, แดง</Text>
            </View>
            <Switch
              value={useStoreConfigStore.getState().variantColor}
              onValueChange={(v) => useStoreConfigStore.getState().setVariantColor(v)}
            />
          </View>

          <View className={cn('flex-row items-center justify-between gap-2')}>
            <View style={{ flex: 1 }}>
              <Text className={cn('text-xs font-bold text-slate-950')}>Lot / Batch</Text>
              <Text className={cn('text-xs font-medium text-slate-600 mt-0.5')}>เลข Lot การผลิต เช่น LOT-2024-06A</Text>
            </View>
            <Switch
              value={useStoreConfigStore.getState().variantLot}
              onValueChange={(v) => useStoreConfigStore.getState().setVariantLot(v)}
            />
          </View>

          <View className={cn('flex-row items-center justify-between gap-2')}>
            <View style={{ flex: 1 }}>
              <Text className={cn('text-xs font-bold text-slate-950')}>ไซส์ / ขนาด (Size)</Text>
              <Text className={cn('text-xs font-medium text-slate-600 mt-0.5')}>เช่น S, M, L, XL หรือ 250ml, 500ml</Text>
            </View>
            <Switch
              value={useStoreConfigStore.getState().variantSize}
              onValueChange={(v) => useStoreConfigStore.getState().setVariantSize(v)}
            />
          </View>

          <View className={cn('flex-row items-center justify-between gap-2')}>
            <View style={{ flex: 1 }}>
              <Text className={cn('text-xs font-bold text-slate-950')}>ปี / รุ่น (Model Year)</Text>
              <Text className={cn('text-xs font-medium text-slate-600 mt-0.5')}>เช่น 2024, 2025</Text>
            </View>
            <Switch
              value={useStoreConfigStore.getState().variantYear}
              onValueChange={(v) => useStoreConfigStore.getState().setVariantYear(v)}
            />
          </View>
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-600')}>ข้อมูลพื้นฐาน</Text>

          <View className={cn('gap-1.5')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>ชื่อร้านค้า <Text className={cn('text-rose-600')}>*</Text></Text>
            <TextInput
              className={cn('bg-white border border-slate-200 rounded-xl px-3 py-3 text-base font-medium text-slate-950', !canEdit && 'bg-neutral-100 text-slate-500')}
              value={shopName}
              onChangeText={setShopName}
              editable={canEdit}
              placeholder="ชื่อร้านค้า"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className={cn('gap-1.5')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>ที่อยู่</Text>
            <TextInput
              className={cn('bg-white border border-slate-200 rounded-xl px-3 py-3 text-base font-medium text-slate-950 min-h-[80px]', !canEdit && 'bg-neutral-100 text-slate-500')}
              value={address}
              onChangeText={setAddress}
              editable={canEdit}
              multiline
              numberOfLines={3}
              placeholder="ที่อยู่ร้านค้า"
              placeholderTextColor="#9ca3af"
              textAlignVertical="top"
            />
          </View>

          <View className={cn('gap-1.5')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>เลขประจำตัวผู้เสียภาษี (13 หลัก)</Text>
            <TextInput
              className={cn('bg-white border border-slate-200 rounded-xl px-3 py-3 text-base font-medium text-slate-950', !canEdit && 'bg-neutral-100 text-slate-500')}
              value={taxId}
              onChangeText={(t) => setTaxId(t.replace(/\D/g, '').slice(0, 13))}
              editable={canEdit}
              keyboardType="number-pad"
              maxLength={13}
              placeholder="0000000000000"
              placeholderTextColor="#9ca3af"
            />
            <Text className={cn('text-xs font-medium text-slate-600 text-right')}>{taxId.length}/13 หลัก</Text>
          </View>

          <View className={cn('gap-1.5')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>เบอร์โทรศัพท์</Text>
            <TextInput
              className={cn('bg-white border border-slate-200 rounded-xl px-3 py-3 text-base font-medium text-slate-950', !canEdit && 'bg-neutral-100 text-slate-500')}
              value={phone}
              onChangeText={setPhone}
              editable={canEdit}
              keyboardType="phone-pad"
              placeholder="02-xxx-xxxx"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-600')}>ประเภทธุรกิจ</Text>
          <View className={cn('gap-2')}>
              {([
                { type: 'SERVICE' as BusinessType, icon: 'cut-outline', label: 'ร้านบริการ', desc: 'ตัดผม, สปา, นวด, เสริมสวย' },
                { type: 'RETAIL' as BusinessType, icon: 'storefront-outline', label: 'ร้านค้าปลีก/ค้าส่ง', desc: 'ร้านค้า, คาเฟ่, ร้านอาหาร' },
              ]).map((item) => {
                const isSelected = businessType === item.type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    className={cn('flex-row items-center gap-3 p-3 rounded-xl border-[1.5] bg-[#f6f7fb]', isSelected && 'border-rose-500 bg-rose-50')}
                  style={{ borderColor: isSelected ? '#f87171' : '#e7e5e4' }}
                  onPress={() => { if (canEdit) { setBusinessType(item.type); setStoreType(item.type); } }}
                  disabled={!canEdit}
                  activeOpacity={0.7}
                >
                  <View className={cn('w-[42px] h-[42px] rounded-full bg-rose-50 items-center justify-center', isSelected && 'bg-rose-500')}>
                    <Ionicons name={item.icon as any} size={22} color={isSelected ? '#fafafa' : '#6b7280'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className={cn('text-xs font-bold text-slate-950', isSelected && 'text-rose-500')}>{item.label}</Text>
                    <Text className={cn('text-xs font-medium text-slate-600')}>{item.desc}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color="#f87171" />}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className={cn('text-xs font-bold text-slate-600 mt-3')}>ขนาดธุรกิจ</Text>
          <View className={cn('gap-2')}>
              {([
                { scale: 'BUSINESS' as BusinessScale, icon: 'home-outline', label: 'Business', desc: 'ร้านเดียว หลายจุดขาย' },
                { scale: 'ENTERPRISE' as BusinessScale, icon: 'business-outline', label: 'Enterprise', desc: 'หลายสาขา หลายจุดขาย' },
              ]).map((item) => {
                const isSelected = businessScale === item.scale;
                return (
                  <TouchableOpacity
                    key={item.scale}
                    className={cn('flex-row items-center gap-3 p-3 rounded-xl border-[1.5] bg-[#f6f7fb]', isSelected && 'border-rose-500 bg-rose-50')}
                  style={{ borderColor: isSelected ? '#f87171' : '#e7e5e4' }}
                  onPress={() => { if (canEdit) { setBusinessScale(item.scale); if (item.scale === 'ENTERPRISE') setStoreType('ENTERPRISE'); } }}
                  disabled={!canEdit}
                  activeOpacity={0.7}
                >
                  <View className={cn('w-[42px] h-[42px] rounded-full bg-rose-50 items-center justify-center', isSelected && 'bg-rose-500')}>
                    <Ionicons name={item.icon as any} size={22} color={isSelected ? '#fafafa' : '#6b7280'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className={cn('text-xs font-bold text-slate-950', isSelected && 'text-rose-500')}>{item.label}</Text>
                    <Text className={cn('text-xs font-medium text-slate-600')}>{item.desc}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color="#f87171" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-600')}>เซอร์วิสชาร์จ (Service Charge)</Text>
          <View className={cn('flex-row items-center justify-between gap-2')}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text className={cn('text-xs font-bold text-slate-950')}>เปิดใช้ Service Charge</Text>
              <Text className={cn('text-xs font-medium text-slate-600')}>
                {scEnabled
                  ? `บวก ${scValue}${scMode === 'percentage' ? '%' : ' บาท'} ต่อบิล`
                  : 'ปิดการเก็บ service charge'}
              </Text>
            </View>
            <Switch
              value={scEnabled}
              onValueChange={canEdit ? setScEnabled : undefined}
              disabled={!canEdit}
            />
          </View>

          {scEnabled && (
            <>
              <View className={cn('flex-row gap-2')}>
                <TouchableOpacity
                  className={cn('flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 bg-[#f6f7fb]', scMode === 'percentage' && 'bg-rose-500 border-rose-500')}
                  onPress={() => canEdit && setScMode('percentage')}
                  disabled={!canEdit}
                >
                  <Ionicons name="trending-up-outline" size={16} color={scMode === 'percentage' ? '#fafafa' : '#57534e'} />
                  <Text className={cn('text-xs font-bold text-slate-600', scMode === 'percentage' && 'text-white')}>เปอร์เซ็นต์ (%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={cn('flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 bg-[#f6f7fb]', scMode === 'fixed' && 'bg-rose-500 border-rose-500')}
                  onPress={() => canEdit && setScMode('fixed')}
                  disabled={!canEdit}
                >
                  <Ionicons name="cash-outline" size={16} color={scMode === 'fixed' ? '#fafafa' : '#57534e'} />
                  <Text className={cn('text-xs font-bold text-slate-600', scMode === 'fixed' && 'text-white')}>จำนวนเงินคงที่ (฿)</Text>
                </TouchableOpacity>
              </View>

              <View className={cn('gap-1.5')}>
                <Text className={cn('text-xs font-bold text-slate-600')}>
                  {scMode === 'percentage' ? 'อัตรา Service Charge (%)' : 'จำนวนเงิน Service Charge (บาท)'}
                </Text>
                <TextInput
                  className={cn('bg-white border border-slate-200 rounded-xl px-3 py-3 text-base font-medium text-slate-950', !canEdit && 'bg-neutral-100 text-slate-500')}
                  value={scValue}
                  onChangeText={(t) => setScValue(t.replace(/[^0-9.]/g, ''))}
                  editable={canEdit}
                  keyboardType="decimal-pad"
                  placeholder={scMode === 'percentage' ? 'เช่น 10' : 'เช่น 50'}
                  placeholderTextColor="#9ca3af"
                />
                <Text className={cn('text-xs font-medium text-slate-600 text-right')}>
                  {scMode === 'percentage'
                    ? `ตัวอย่าง: ยอด ฿1,000 → SC ${scValue}% = ฿${((parseFloat(scValue) || 0) * 10).toFixed(0)}`
                    : `บวกคงที่ ฿${scValue} ทุกบิล`}
                </Text>
              </View>
            </>
          )}
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-600')}>ภาษีมูลค่าเพิ่ม (VAT)</Text>
          <View className={cn('flex-row items-center justify-between gap-2')}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text className={cn('text-xs font-bold text-slate-950')}>เปิดใช้ VAT 7%</Text>
              <Text className={cn('text-xs font-medium text-slate-600')}>
                {vatEnabled ? 'ราคาสินค้ารวม VAT 7%' : 'ราคาสินค้าไม่รวม VAT'}
              </Text>
            </View>
            <Switch
              value={vatEnabled}
              onValueChange={canEdit ? setVatEnabled : undefined}
              disabled={!canEdit}
            />
          </View>
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-600')}>ตั้งค่าใบเสร็จ</Text>

          <View className={cn('gap-1.5')}>
            <Text className={cn('text-xs font-bold text-slate-600')}>ข้อความท้ายใบเสร็จ</Text>
            <TextInput
              className={cn('bg-white border border-slate-200 rounded-xl px-3 py-3 text-base font-medium text-slate-950 min-h-[80px]', !canEdit && 'bg-neutral-100 text-slate-500')}
              value={receiptFooter}
              onChangeText={setReceiptFooter}
              editable={canEdit}
              multiline
              numberOfLines={3}
              placeholder="ข้อความที่ต้องการแสดงท้ายใบเสร็จ"
              placeholderTextColor="#9ca3af"
              textAlignVertical="top"
            />
          </View>

          <View className={cn('flex-row items-center justify-between gap-2')}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text className={cn('text-xs font-bold text-slate-950')}>แสดงเลขผู้เสียภาษีในใบเสร็จ</Text>
              <Text className={cn('text-xs font-medium text-slate-600')}>พิมพ์เลข {taxId || 'xxxxxxxxxxxxxxx'} บนใบเสร็จ</Text>
            </View>
            <Switch
              value={showTaxId}
              onValueChange={canEdit ? setShowTaxId : undefined}
              disabled={!canEdit}
            />
          </View>
        </View>

        <View className={cn('flex-row items-center gap-1 justify-end -mt-1')}>
          <Ionicons name="time-outline" size={14} color="#57534e" />
          <Text className={cn('text-xs font-medium text-slate-600')}>อัปเดตล่าสุด: {formatDateTime(lastUpdated)}</Text>
        </View>

        <PermissionGuard module="settings" action="edit">
          <TouchableOpacity className={cn('bg-rose-500 rounded-xl py-3 flex-row items-center justify-center gap-2 shadow-sm')} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fafafa" />
            <Text className={cn('text-base font-bold text-white')}>บันทึกการตั้งค่า</Text>
          </TouchableOpacity>
        </PermissionGuard>

        <View style={{ height: 20 }} />
      </ScrollView>

      <AlertDialog
        visible={alertDialog.visible}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant ?? 'info'}
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        onConfirm={() => setAlertDialog({ visible: false, title: '', message: '' })}
      />
    </SafeAreaView>
  );
};
