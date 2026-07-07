import React from 'react';
import { Switch } from 'react-native';
import { ScrollView, Text, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { useStoreConfigStore } from '@/features/settings/application/stores/storeConfigStore';

const ALL_MODULES = [
  { id: 'pos', label: 'POS ขายสินค้า', icon: 'cart-outline', desc: 'หน้าขายสินค้า + สแกนบาร์โค้ด + พักบิล + Split Payment' },
  { id: 'salehistory', label: 'ประวัติการขาย', icon: 'receipt-outline', desc: 'ดูบิลย้อนหลัง + ค้นหา + พิมพ์ซ้ำ' },
  { id: 'products', label: 'จัดการสินค้า', icon: 'cube-outline', desc: 'เพิ่ม/แก้ไขสินค้า + หมวดหมู่ + แบรนด์' },
  { id: 'pricing', label: 'กำหนดราคา', icon: 'cash-outline', desc: 'ราคากลาง / ราคาสาขา / ชั่วคราว' },
  { id: 'inventory', label: 'คลังสินค้า', icon: 'archive-outline', desc: 'รับเข้า / โอนย้าย / ตรวจนับ' },
  { id: 'reports', label: 'รายงาน', icon: 'bar-chart-outline', desc: '15+ รายงาน (ขาย/สินค้า/กำไร/Enterprise)' },
  { id: 'crm', label: 'CRM + สมาชิก', icon: 'people-circle-outline', desc: 'สะสมแต้ม + Wallet + ระดับสมาชิก' },
  { id: 'promotions', label: 'โปรโมชั่น', icon: 'pricetag-outline', desc: 'ส่วนลด + คูปอง + Flash Sale + แคมเปญ' },
  { id: 'communication', label: 'การสื่อสาร (LINE)', icon: 'chatbubble-outline', desc: 'ส่งข้อความ/โปร ผ่าน LINE OA' },
  { id: 'lineIntegration', label: 'LINE Integration', icon: 'logo-whatsapp', desc: 'เชื่อม LINE Messaging API + Rich Menu' },
  { id: 'pointSystem', label: 'ระบบแต้มสมาชิก', icon: 'star-outline', desc: 'สะสมแต้ม + ใช้แต้ม + อัตราแลก' },
  { id: 'wallet', label: 'Wallet สมาชิก', icon: 'wallet-outline', desc: 'เติมเงิน + ใช้จ่าย + ประวัติ' },
  { id: 'splitPayment', label: 'Split Payment', icon: 'git-branch-outline', desc: 'จ่ายหลายช่องทางในบิลเดียว' },
  { id: 'customerDisplay', label: 'จอที่ 2 (Customer Display)', icon: 'tv-outline', desc: 'รายการสินค้า + ยอด + โฆษณา' },
  { id: 'kiosk', label: 'Kiosk Mode', icon: 'expand-outline', desc: 'โหมดตู้ ซ่อน sidebar' },
  { id: 'team', label: 'จัดการทีม (User/Staff)', icon: 'people-outline', desc: 'เพิ่ม/แก้ไข user + บทบาท + สิทธิ์' },
  { id: 'auditlog', label: 'Audit Log', icon: 'document-text-outline', desc: 'บันทึกการใช้งานระบบ' },
  { id: 'settings', label: 'ตั้งค่า', icon: 'settings-outline', desc: 'ร้านค้า + สาขา + POS + Permission' },
];

export const SuperAdminScreen: React.FC = () => {
  const { moduleEnabled, setModuleEnabled } = useStoreConfigStore();
  const enabledCount = Object.values(moduleEnabled).filter(Boolean).length;

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerStyle={{ padding: 24, gap: 16, maxWidth: 800, alignSelf: 'center', width: '100%' }}>
      <View className={cn('bg-rose-600 rounded-2xl p-4 shadow-lg shadow-rose-500/40')}>
        <View className={cn('flex-row justify-between items-center')}>
          <View>
            <Text className={cn('text-lg font-extrabold text-white')}>Super Admin</Text>
            <Text className={cn('text-sm font-medium text-white/80')}>เปิด/ปิดโมดูลทั้งหมด (ขายแยกโมดูล)</Text>
          </View>
          <View className={cn('bg-white/20 rounded-xl px-4 py-2')}>
            <Text className={cn('text-sm font-bold text-white')}>{enabledCount}/{ALL_MODULES.length} โมดูล</Text>
          </View>
        </View>
      </View>

      <View className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden')}>
        {ALL_MODULES.map((mod, idx) => {
          const enabled = moduleEnabled[mod.id] ?? true;
          return (
            <View key={mod.id} className={cn('flex-row items-center p-3.5 gap-3', idx > 0 && 'border-t border-slate-100')}>
              <View className={cn('w-9 h-9 rounded-xl items-center justify-center', enabled ? 'bg-emerald-50' : 'bg-slate-100')}>
                <Ionicons name={mod.icon as any} size={18} color={enabled ? '#16a34a' : '#94a3b8'} />
              </View>
              <View className={cn('flex-1')}>
                <Text className={cn('text-sm font-bold', enabled ? 'text-slate-800' : 'text-slate-400')}>{mod.label}</Text>
                <Text className={cn('text-xs font-medium text-slate-400 mt-0.5')}>{mod.desc}</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={(v) => setModuleEnabled(mod.id, v)}
              />
            </View>
          );
        })}
      </View>

      <View className={cn('flex-row items-center gap-2 bg-amber-50 rounded-xl p-3 border border-amber-200')}>
        <Ionicons name="information-circle" size={16} color="#d97706" />
        <Text className={cn('text-xs font-medium text-amber-600 flex-1')}>
          การปิดโมดูลจะซ่อนเมนูนั้นจาก Sidebar ทันที (ขึ้นกับสิทธิ์ owner/manager/cashier)
        </Text>
      </View>
    </ScrollView>
  );
};
