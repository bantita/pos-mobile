/**
 * StoreSettingsSection — Store type selector + service charge config
 * Requirement 1.1, 1.3, 2.1, 2.3, 3.1, 3.2, 3.3, 3.4
 */
import React, { useState } from 'react';
import { View, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { StoreType, BusinessType, BusinessScale, ServiceChargeConfig } from '@/features/settings/domain/store';
import * as storeConfigStore from '@/features/settings/application/stores/storeConfigStore';
import { useAuthStore } from '@/features/auth/application/stores/authStore';
import { cn } from '@/shared/lib/cn';
import { Text, TextInput } from '@/shared/tw/index';

interface Props {
  onBack: () => void;
}

const BIZ_TYPES: { type: BusinessType; icon: string; label: string; desc: string; color: string }[] = [
  { type: 'SERVICE', icon: 'cut-outline', label: 'ร้านบริการ', desc: 'ตัดผม, สปา, นวด, เสริมสวย', color: '#7c3aed' },
  { type: 'RETAIL', icon: 'storefront-outline', label: 'ร้านค้าปลีก/ค้าส่ง', desc: 'ร้านค้า, คาเฟ่, ร้านอาหาร', color: '#f87171' },
];

const BIZ_SCALES: { scale: BusinessScale; icon: string; label: string; desc: string; color: string }[] = [
  { scale: 'BUSINESS', icon: 'home-outline', label: 'Business', desc: 'ร้านเดียว หลายจุดขาย', color: '#0ea5e9' },
  { scale: 'ENTERPRISE', icon: 'business-outline', label: 'Enterprise', desc: 'หลายสาขา หลายจุดขาย', color: '#0f766e' },
];

export const StoreSettingsSection: React.FC<Props> = ({ onBack }) => {
  const user = useAuthStore(s => s.user);
  const isOwner = user?.role === 'owner';

  const config = storeConfigStore.getStoreConfig();
  const [selectedBizType, setSelectedBizType] = useState<BusinessType>(config.businessType || 'RETAIL');
  const [selectedBizScale, setSelectedBizScale] = useState<BusinessScale>(config.businessScale || 'BUSINESS');
  const [scEnabled, setScEnabled] = useState(config.serviceCharge.enabled);
  const [scMode, setScMode] = useState<'percentage' | 'fixed'>(config.serviceCharge.mode);
  const [scValue, setScValue] = useState(String(config.serviceCharge.value));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const validateAndSave = () => {
    const numValue = parseFloat(scValue);
    if (isNaN(numValue) || numValue < 0) {
      setError('กรุณาระบุค่าที่ถูกต้อง (ตัวเลข ≥ 0)');
      return;
    }
    if (scMode === 'percentage' && numValue > 100) {
      setError('เปอร์เซ็นต์ต้องอยู่ระหว่าง 0-100');
      return;
    }
    setError('');

    const { useStoreConfigStore } = require('@/features/settings/application/stores/storeConfigStore');
    const store = useStoreConfigStore.getState();
    store.setBusinessType(selectedBizType);
    store.setBusinessScale(selectedBizScale);
    store.setStoreType(selectedBizScale === 'ENTERPRISE' ? 'ENTERPRISE' : selectedBizType);

    const scConfig: ServiceChargeConfig = {
      enabled: scEnabled,
      mode: scMode,
      value: numValue,
    };
    storeConfigStore.setServiceCharge(scConfig);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View className="gap-5">
      <View className="flex-row items-center gap-3">
        <TouchableOpacity className="flex-row items-center gap-1 py-[6px] px-[10px] rounded-lg bg-rose-50" onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="#f87171" />
          <Text className="text-[13px] text-rose-600 font-semibold">ตั้งค่า</Text>
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-slate-950">ประเภทร้านค้า & Service Charge</Text>
      </View>

      {/* Store Type Selector — 2 มิติ */}
      {isOwner ? (
        <View className="bg-white rounded-xl p-5 border border-slate-200 gap-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="storefront-outline" size={18} color="#f87171" />
            <Text className="text-[15px] font-bold text-slate-950">ประเภทธุรกิจ</Text>
          </View>
          <Text className="text-xs text-slate-500 -mt-1">เลือกประเภทธุรกิจของคุณ</Text>

          <View className="flex-row gap-3 mt-1">
            {BIZ_TYPES.map(st => {
              const isActive = selectedBizType === st.type;
              return (
                <TouchableOpacity
                  key={st.type}
                  className="flex-1 border-2 border-slate-200 rounded-xl p-4 items-center gap-2 relative"
                  style={isActive ? { borderColor: st.color, backgroundColor: st.color + '10' } : undefined}
                  onPress={() => setSelectedBizType(st.type)}
                  activeOpacity={0.7}
                >
                  <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: st.color + '18' }}>
                    <Ionicons name={st.icon as any} size={24} color={st.color} />
                  </View>
                  <Text className="text-[13px] font-extrabold text-slate-950" style={isActive ? { color: st.color } : undefined}>{st.label}</Text>
                  <Text className="text-[11px] text-slate-500 text-center leading-4">{st.desc}</Text>
                  {isActive && (
                    <View className="absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: st.color }}>
                      <Ionicons name="checkmark" size={12} color="#fafafa" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="flex-row items-center gap-2 mt-5">
            <Ionicons name="resize-outline" size={18} color="#0ea5e9" />
            <Text className="text-[15px] font-bold text-slate-950">ขนาดธุรกิจ</Text>
          </View>
          <Text className="text-xs text-slate-500 -mt-1">ร้านเดียว หรือ หลายสาขา</Text>

          <View className="flex-row gap-3 mt-1">
            {BIZ_SCALES.map(st => {
              const isActive = selectedBizScale === st.scale;
              return (
                <TouchableOpacity
                  key={st.scale}
                  className="flex-1 border-2 border-slate-200 rounded-xl p-4 items-center gap-2 relative"
                  style={isActive ? { borderColor: st.color, backgroundColor: st.color + '10' } : undefined}
                  onPress={() => setSelectedBizScale(st.scale)}
                  activeOpacity={0.7}
                >
                  <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: st.color + '18' }}>
                    <Ionicons name={st.icon as any} size={24} color={st.color} />
                  </View>
                  <Text className="text-[13px] font-extrabold text-slate-950" style={isActive ? { color: st.color } : undefined}>{st.label}</Text>
                  <Text className="text-[11px] text-slate-500 text-center leading-4">{st.desc}</Text>
                  {isActive && (
                    <View className="absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: st.color }}>
                      <Ionicons name="checkmark" size={12} color="#fafafa" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <View className="bg-white rounded-xl p-5 border border-slate-200 gap-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="lock-closed-outline" size={18} color="#57534e" />
            <Text className="text-[15px] font-bold text-slate-950">ประเภทร้านค้า</Text>
          </View>
          <Text className="text-xs text-slate-500 -mt-1">เฉพาะเจ้าของร้าน (Owner) เท่านั้นที่สามารถเปลี่ยนได้</Text>
          <View className="flex-1 border-2 border-slate-200 rounded-xl p-4 items-center gap-2 relative opacity-60">
            <Text className="text-[13px] font-extrabold text-slate-950">ประเภท: {config.businessType || config.storeType} · ขนาด: {config.businessScale || 'BUSINESS'}</Text>
          </View>
        </View>
      )}

      {/* Service Charge Configuration */}
      <View className="bg-white rounded-xl p-5 border border-slate-200 gap-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="receipt-outline" size={18} color="#f87171" />
          <Text className="text-[15px] font-bold text-slate-950">Service Charge (ค่าบริการ)</Text>
        </View>
        <Text className="text-xs text-slate-500 -mt-1">ตั้งค่า service charge ที่จะคำนวณเพิ่มจากยอดรวม</Text>

        {/* Enable/Disable Toggle */}
        <View className="flex-row items-center gap-3 py-2 border-t border-slate-200">
          <View style={{ flex: 1 }}>
            <Text className="text-[13px] font-semibold text-slate-950">เปิดใช้งาน Service Charge</Text>
            <Text className="text-[11px] text-slate-500 mt-0.5">{scEnabled ? 'เปิดอยู่ — จะแสดงในบิลขาย' : 'ปิดอยู่ — จะไม่คิด service charge'}</Text>
          </View>
          <Switch
            value={scEnabled}
            onValueChange={setScEnabled}
          />
        </View>

        {scEnabled && (
          <>
            {/* Mode Picker */}
            <View className="gap-2">
              <Text className="text-[13px] font-semibold text-slate-950">โหมดการคิดค่าบริการ</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className={cn('flex-1 flex-row items-center justify-center gap-[6px] border border-slate-200 rounded-lg py-[10px] px-3 bg-white', scMode === 'percentage' && 'bg-rose-500 border-rose-500')}
                  onPress={() => setScMode('percentage')}
                >
                  <Ionicons name="trending-up-outline" size={16} color={scMode === 'percentage' ? '#fafafa' : '#57534e'} />
                  <Text className={cn('text-xs font-semibold text-slate-500', scMode === 'percentage' && 'text-white')}>เปอร์เซ็นต์ (%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={cn('flex-1 flex-row items-center justify-center gap-[6px] border border-slate-200 rounded-lg py-[10px] px-3 bg-white', scMode === 'fixed' && 'bg-rose-500 border-rose-500')}
                  onPress={() => setScMode('fixed')}
                >
                  <Ionicons name="cash-outline" size={16} color={scMode === 'fixed' ? '#fafafa' : '#57534e'} />
                  <Text className={cn('text-xs font-semibold text-slate-500', scMode === 'fixed' && 'text-white')}>จำนวนเงินคงที่ (฿)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Value Input */}
            <View className="gap-2">
              <Text className="text-[13px] font-semibold text-slate-950">
                {scMode === 'percentage' ? 'เปอร์เซ็นต์ (0-100)' : 'จำนวนเงิน (บาท)'}
              </Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  className={cn('flex-1 border border-slate-200 rounded-lg px-3 py-[10px] text-sm text-slate-950 bg-white', error && 'border-rose-500')}
                  value={scValue}
                  onChangeText={(v) => { setScValue(v); setError(''); }}
                  keyboardType="numeric"
                  placeholder={scMode === 'percentage' ? 'เช่น 10' : 'เช่น 50'}
                  placeholderTextColor="#57534e"
                />
                <Text className="text-sm font-bold text-slate-500">{scMode === 'percentage' ? '%' : '฿'}</Text>
              </View>
              {error ? <Text className="text-[11px] text-rose-600 mt-0.5">{error}</Text> : null}
            </View>
          </>
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity className="flex-row items-center justify-center gap-2 bg-rose-500 rounded-xl py-3 px-5" onPress={validateAndSave}>
        <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={16} color="#fafafa" />
        <Text className="text-sm font-bold text-white">{saved ? 'บันทึกแล้ว ✓' : 'บันทึกการตั้งค่า'}</Text>
      </TouchableOpacity>
    </View>
  );
};
