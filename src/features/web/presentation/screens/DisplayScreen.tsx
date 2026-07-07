import React, { useState } from 'react';
import { Switch } from 'react-native';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

export const DisplayScreen: React.FC = () => {
  const [enabled, setEnabled] = useState(true);
  const [showAds, setShowAds] = useState(true);
  const [showTotal, setShowTotal] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [alertDialog, setAlertDialog] = useState({ visible: false, title: '', message: '' });

  const openDisplay = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.origin + '?display=1', '_blank', 'width=1024,height=768');
    }
  };

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerStyle={{ padding: 24, gap: 16 }}>
      <View className={cn('bg-rose-600 rounded-2xl p-4 shadow-lg shadow-rose-500/40')}>
        <Text className={cn('text-lg font-extrabold text-white')}>จอที่ 2 (Customer Display)</Text>
        <Text className={cn('text-sm font-medium text-white/80')}>จอแสดงผลลูกค้า — แสดงรายการสินค้า ยอดรวม โฆษณา</Text>
      </View>

      <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-3')}>
        <Text className={cn('text-sm font-extrabold text-slate-800')}>เปิดจอลูกค้า</Text>
        <Text className={cn('text-sm font-medium text-slate-500 mb-2')}>
          เปิดหน้าต่างใหม่เพื่อแสดงจอลูกค้า (ลากไปจอที่ 2 หรือจอ HDMI)
        </Text>
        <TouchableOpacity
          className={cn('flex-row items-center gap-2 bg-rose-500 rounded-xl px-4 py-2.5 self-start shadow-sm')}
          onPress={openDisplay}
        >
          <Ionicons name="open-outline" size={16} color="#fafafa" />
          <Text className={cn('text-sm font-bold text-white')}>เปิด Customer Display</Text>
        </TouchableOpacity>
      </View>

      <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-3')}>
        <Text className={cn('text-sm font-extrabold text-slate-800')}>ตั้งค่าการแสดงผล</Text>
        <View className={cn('flex-row items-center justify-between py-2 border-b border-slate-100')}>
          <Text className={cn('text-sm font-medium text-neutral-800')}>เปิดใช้งานจอลูกค้า</Text>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>
        <View className={cn('flex-row items-center justify-between py-2 border-b border-slate-100')}>
          <Text className={cn('text-sm font-medium text-neutral-800')}>แสดงยอดรวม Real-time</Text>
          <Switch value={showTotal} onValueChange={setShowTotal} />
        </View>
        <View className={cn('flex-row items-center justify-between py-2 border-b border-slate-100')}>
          <Text className={cn('text-sm font-medium text-neutral-800')}>แสดงโลโก้ร้านค้า</Text>
          <Switch value={showLogo} onValueChange={setShowLogo} />
        </View>
        <View className={cn('flex-row items-center justify-between py-2')}>
          <Text className={cn('text-sm font-medium text-neutral-800')}>แสดงโฆษณา (Slideshow)</Text>
          <Switch value={showAds} onValueChange={setShowAds} />
        </View>
      </View>

      {showAds && (
        <View className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-sm gap-3')}>
          <Text className={cn('text-sm font-extrabold text-slate-800')}>จัดการโฆษณา / Slideshow</Text>
          <Text className={cn('text-sm font-medium text-slate-500 mb-2')}>
            รูปโฆษณาที่แสดงเมื่อไม่มีรายการขาย
          </Text>
          <View className={cn('flex-row flex-wrap gap-2.5')}>
            {['โปรโมชั่นลด 20%', 'สมัครสมาชิก', 'เครื่องดื่มใหม่'].map((ad, i) => (
              <View key={i} className={cn('w-[140px] h-[90px] rounded-xl bg-rose-50 border border-slate-200 items-center justify-center gap-1')}>
                <Ionicons name="image-outline" size={24} color="#94a3b8" />
                <Text className={cn('text-sm font-medium text-slate-500 text-center')}>{ad}</Text>
              </View>
            ))}
            <TouchableOpacity
              className={cn('w-[140px] h-[90px] rounded-xl border-[1.5] border-dashed border-rose-500 items-center justify-center gap-1')}
              onPress={() => setAlertDialog({ visible: true, title: 'เพิ่มโฆษณา', message: 'ระบบเพิ่มโฆษณากำลังพัฒนา' })}
            >
              <Ionicons name="add-circle-outline" size={24} color="#e11d48" />
              <Text className={cn('text-sm font-bold text-center text-rose-600')}>เพิ่มรูป</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className={cn('flex-row items-start gap-2 bg-rose-100/50 rounded-xl p-3')}>
        <Ionicons name="information-circle-outline" size={16} color="#64748b" />
        <Text className={cn('text-sm font-medium text-slate-500 flex-1')}>
          วิธีใช้: กด "เปิด Customer Display" → หน้าต่างใหม่จะเปิดขึ้น → ลากไปจอที่ 2 → ระบบจะแสดงรายการสินค้า + ยอดรวม + โฆษณาอัตโนมัติ
        </Text>
      </View>

      <AlertDialog
        visible={alertDialog.visible}
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant="info"
      />
    </ScrollView>
  );
};
