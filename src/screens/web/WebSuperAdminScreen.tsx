/**
 * WebSuperAdminScreen — หน้าเจ้าหน้าที่ดูแลระบบ (Super Admin)
 * เปิด/ปิดโมดูลทั้งหมด สำหรับขายแยกโมดูล
 * เห็นเฉพาะ role = 'admin' (user: xclnc)
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors } from '../../design-system/tokens';
import { useStoreConfigStore } from '../../store/storeConfigStore';

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
  { id: 'customerDisplay', label: 'จอที่ 2 (Customer Display)', icon: 'tv-outline', desc: 'แสดงรายการ + โฆษณา + ข้อมูลสมาชิก' },
  { id: 'kiosk', label: 'Kiosk Mode', icon: 'expand-outline', desc: 'โหมดเต็มจอ ซ่อน sidebar' },
  { id: 'team', label: 'จัดการทีม (User/Staff)', icon: 'people-outline', desc: 'เพิ่ม/แก้ไข user + พนักงาน + สิทธิ์สาขา' },
  { id: 'auditlog', label: 'Audit Log', icon: 'document-text-outline', desc: 'ประวัติการใช้งานระบบ' },
  { id: 'settings', label: 'ตั้งค่า', icon: 'settings-outline', desc: 'ร้านค้า + สาขา + POS + Permission' },
];

export const WebSuperAdminScreen: React.FC = () => {
  const { moduleEnabled, setModuleEnabled } = useStoreConfigStore();

  const enabledCount = Object.values(moduleEnabled).filter(Boolean).length;

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content}>
      <View style={st.header}>
        <View>
          <Text style={st.title}>Super Admin — จัดการโมดูล</Text>
          <Text style={st.subtitle}>เปิด/ปิดโมดูลสำหรับร้านค้า (ขายแยกโมดูล)</Text>
        </View>
        <View style={st.badge}>
          <Text style={st.badgeText}>{enabledCount}/{ALL_MODULES.length} เปิด</Text>
        </View>
      </View>

      <View style={st.card}>
        {ALL_MODULES.map((mod, idx) => {
          const enabled = moduleEnabled[mod.id] ?? true;
          return (
            <View key={mod.id} style={[st.row, idx > 0 && st.rowBorder]}>
              <View style={[st.iconWrap, { backgroundColor: enabled ? WebColors.successLight : WebColors.gray100 }]}>
                <Ionicons name={mod.icon as any} size={18} color={enabled ? WebColors.success : WebColors.textDisabled} />
              </View>
              <View style={st.info}>
                <Text style={[st.modLabel, !enabled && st.modLabelOff]}>{mod.label}</Text>
                <Text style={st.modDesc}>{mod.desc}</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={(v) => setModuleEnabled(mod.id, v)}
                trackColor={{ true: WebColors.success, false: WebColors.border }}
              />
            </View>
          );
        })}
      </View>

      <View style={st.note}>
        <Ionicons name="information-circle" size={16} color={WebColors.warning} />
        <Text style={st.noteText}>โมดูลที่ปิดจะไม่แสดงในเมนู Sidebar ของผู้ใช้ทั่วไป (owner/manager/cashier)</Text>
      </View>
    </ScrollView>
  );
};

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 16, maxWidth: 800, alignSelf: 'center' as any, width: '100%' as any },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: WebColors.text },
  subtitle: { fontSize: 12, color: WebColors.textSecondary, marginTop: 2 },
  badge: { backgroundColor: WebColors.success, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', color: WebColors.white },
  card: { backgroundColor: WebColors.white, borderRadius: 12, borderWidth: 1, borderColor: WebColors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: WebColors.gray100 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  modLabel: { fontSize: 13, fontWeight: '600', color: WebColors.text },
  modLabelOff: { color: WebColors.textDisabled },
  modDesc: { fontSize: 10, color: WebColors.textSecondary, marginTop: 1 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WebColors.warningLight, borderRadius: 10, padding: 12 },
  noteText: { fontSize: 11, color: WebColors.warning, flex: 1 },
});
