/**
 * Simple Web Screens: Inventory, Reports, Users, AuditLog, Settings
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Switch, ScrollView, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors, Space, Radius, Shadow, Font } from '../../design-system/tokens';
import { MOCK_STOCK_ITEMS } from '../../data/mockReports';
import { MOCK_PRODUCTS } from '../../data/mockProducts';
import { useAuthStore } from '../../store/authStore';
import { useStoreConfigStore } from '../../store/storeConfigStore';
import { useAuditLogStore } from '../../store/auditLogStore';
import { WebTestTrackerScreen } from './WebTestTrackerScreen';
import { WebAdSettingsScreen } from './WebAdSettingsScreen';
import { useReceiptStore } from '../../store/receiptStore';
import { WebStoreSettingsSection } from '../../components/settings/WebStoreSettingsSection';
import { WebUserStaffScreen } from './WebUserStaffScreen';
import { LookupCheckbox } from '../../components/ui/LookupCheckbox';
import { usePOSPermissionStore, POSAction, POS_ACTION_LABELS, POSUser } from '../../store/posPermissionStore';
import { useEmployeeStore } from '../../store/employeeStore';

// ─── Inventory ────────────────────────────────────────────────────────────────
export const WebInventoryScreen: React.FC = () => {
  const [tab, setTab] = useState('stock');
  const totalValue = MOCK_STOCK_ITEMS.reduce((s, i) => s + i.inventoryValue, 0);
  const lowCount   = MOCK_STOCK_ITEMS.filter(i => i.status === 'low' || i.status === 'out').length;

  return (
    <View style={g.root}>
      {/* KPI */}
      <View style={g.kpiRow}>
        {[
          { label: 'มูลค่าสต๊อกรวม', value: `฿${totalValue.toLocaleString()}`, icon: 'archive-outline',      color: WebColors.primary },
          { label: 'รายการสินค้า',   value: `${MOCK_STOCK_ITEMS.length}`,      icon: 'cube-outline',          color: WebColors.success },
          { label: 'สินค้าใกล้หมด/หมด', value: `${lowCount}`,                 icon: 'warning-outline',       color: WebColors.warning },
        ].map((k, i) => (
          <View key={i} style={g.kpiCard}>
            <Text style={g.kpiLabel}>{k.label}</Text>
            <View style={g.kpiBottom}>
              <Text style={[g.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Ionicons name={k.icon as any} size={24} color={k.color + '60'} />
            </View>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={g.tabs}>
        {[['stock','สต๊อคสินค้า'],['receive','รับสินค้า'],['issue','เบิกสินค้า'],['docs','เอกสาร']].map(([k, lbl]) => (
          <TouchableOpacity key={k} style={[g.tab, tab === k && g.tabActive]} onPress={() => setTab(k)}>
            <Text style={[g.tabText, tab === k && g.tabTextActive]}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Table */}
      <View style={g.table}>
        <View style={g.thead}>
          {['รหัส','ชื่อสินค้า','หมวดหมู่','คงเหลือ','มูลค่า','สถานะ'].map((h, i) => (
            <Text key={i} style={[g.th, i === 1 && { flex: 2 }]}>{h}</Text>
          ))}
        </View>
        <FlatList data={MOCK_STOCK_ITEMS} keyExtractor={(i, idx) => `${i.productCode}-${idx}`}
          renderItem={({ item: i, index }) => {
            const stColor = i.status === 'ok' ? WebColors.success : i.status === 'low' ? WebColors.warning : WebColors.danger;
            const stLabel = i.status === 'ok' ? 'ปกติ' : i.status === 'low' ? 'ใกล้หมด' : 'หมดสต๊อก';
            return (
              <View style={[g.tr, index % 2 === 1 && g.trAlt]}>
                <Text style={g.td}>{i.productCode}</Text>
                <Text style={[g.td, { flex: 2, fontWeight: '600' }]} numberOfLines={1}>{i.productName}</Text>
                <Text style={g.td}>{i.categoryName}</Text>
                <View style={g.td}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: i.onHandQty <= i.minStock ? WebColors.danger : WebColors.text }}>{i.onHandQty} {i.unit}</Text>
                </View>
                <Text style={g.td}>฿{i.inventoryValue.toLocaleString()}</Text>
                <View style={g.td}><View style={[g.badge, { backgroundColor: stColor + '18' }]}><Text style={[g.badgeText, { color: stColor }]}>{stLabel}</Text></View></View>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const WebReportsScreen: React.FC<{ onNavigate: (r: string) => void }> = ({ onNavigate }) => {
  const cards = [
    { key: 'rpt_sales', icon: 'trending-up-outline',   label: 'รายงานยอดขาย',    sub: 'ดูยอดขายรายวัน/เดือน/ปี',         color: WebColors.primary,  bg: WebColors.primaryLight  },
    { key: 'rpt_prod',  icon: 'cube-outline',           label: 'รายงานสินค้า',    sub: 'วิเคราะห์สินค้าขายดี',            color: WebColors.purple,   bg: WebColors.purpleLight   },
    { key: 'rpt_inv',   icon: 'archive-outline',        label: 'รายงานคลังสินค้า', sub: 'ดูสต๊อคและสินค้าใกล้หมด',         color: WebColors.success,  bg: WebColors.successLight  },
    { key: 'rpt_prof',  icon: 'cash-outline',           label: 'รายงานกำไร',      sub: '• Gross Profit/Margin',            color: WebColors.success,  bg: WebColors.successLight  },
    { key: 'rpt_ent',   icon: 'business-outline',       label: 'รายงาน Enterprise', sub: 'รายงานขั้นสูง',                 color: WebColors.textSecondary, bg: WebColors.gray100  },
  ];

  return (
    <View style={g.root}>
      <Text style={g.pageTitle}>รายงาน</Text>
      <Text style={g.pageSub}>เลือกรายงานที่ต้องการดู</Text>
      <View style={g.cardGrid}>
        {cards.map(c => (
          <TouchableOpacity key={c.key} style={g.reportCard} onPress={() => onNavigate(c.key)}>
            <View style={[g.reportIcon, { backgroundColor: c.bg }]}>
              <Ionicons name={c.icon as any} size={28} color={c.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={g.reportLabel}>{c.label}</Text>
              <Text style={g.reportSub}>{c.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={WebColors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Users ────────────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: 'u1', name: 'สมชาย ใจดี',   username: '0811111111',  phone: '081-111-1111', email: 'somchai@shop.com', role: 'เจ้าของร้าน', roleColor: WebColors.purple, roleLight: WebColors.purpleLight, pos: 'สาขาหลัก', lastLogin: '15/6/2567 08:30', loginCount: '45', status: 'ใช้งาน'  },
  { id: 'u2', name: 'สมหญิง จริงใจ', username: '0822222222', phone: '082-222-2222', email: 'somying@shop.com', role: 'ผู้จัดการ', roleColor: WebColors.info, roleLight: WebColors.infoLight, pos: 'สาขาหลัก', lastLogin: '14/6/2567 14:20', loginCount: '32', status: 'ใช้งาน' },
  { id: 'u3', name: 'สมศักดิ์ ขยัน', username: '0833333333', phone: '083-333-3333', email: 'somsak@shop.com', role: 'แคชเชียร์', roleColor: WebColors.success, roleLight: WebColors.successLight, pos: 'POS 1', lastLogin: '15/6/2567 09:00', loginCount: '120', status: 'ใช้งาน' },
  { id: 'u4', name: 'ประเสริฐ มั่นคง', username: '0844444444', phone: '084-444-4444', email: '', role: 'พนักงานคลัง', roleColor: WebColors.warning, roleLight: WebColors.warningLight, pos: 'คลังหลัก', lastLogin: '13/6/2567 16:45', loginCount: '18', status: 'ใช้งาน' },
  { id: 'u5', name: 'วิชัย ศรีสุข (ป๊อป)', username: '0855555555', phone: '085-555-5555', email: 'wichai@shop.com', role: 'แคชเชียร์', roleColor: WebColors.success, roleLight: WebColors.successLight, pos: 'POS 2', lastLogin: '15/6/2567 07:50', loginCount: '88', status: 'ใช้งาน' },
  { id: 'u6', name: 'นิดา แก้วใส (นิด)', username: '0866666666', phone: '086-666-6666', email: 'nida@shop.com', role: 'พนักงานบริการ', roleColor: WebColors.primary, roleLight: WebColors.primaryLight, pos: 'สาขาหลัก', lastLogin: '-', loginCount: '0', status: 'รอเปิดใช้' },
  { id: 'u7', name: 'อรุณ ทองดี (อ๊อฟ)', username: '0877777777', phone: '087-777-7777', email: '', role: 'แคชเชียร์', roleColor: WebColors.success, roleLight: WebColors.successLight, pos: 'สาขาหลัก', lastLogin: '-', loginCount: '0', status: 'รอเปิดใช้' },
];

export const WebUsersScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('แคชเชียร์');
  const [users, setUsers] = useState(MOCK_USERS);

  const ROLES = [
    { value: 'ผู้ดูแลระบบ', color: WebColors.danger, light: WebColors.dangerLight },
    { value: 'ผู้จัดการ', color: WebColors.purple, light: WebColors.purpleLight },
    { value: 'แคชเชียร์', color: WebColors.success, light: WebColors.successLight },
    { value: 'พนักงานบริการ', color: WebColors.warning, light: WebColors.warningLight },
  ];

  const handleSave = () => {
    if (!formName.trim()) { window.alert('กรุณากรอกชื่อ'); return; }
    const roleInfo = ROLES.find(r => r.value === formRole) || ROLES[2];
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, name: formName.trim(), phone: formPhone.trim(), role: formRole, roleColor: roleInfo.color, roleLight: roleInfo.light } : u));
    } else {
      const newUser = { id: `u${Date.now()}`, name: formName.trim(), username: formName.trim().split(' ')[0], phone: formPhone.trim(), email: '', role: formRole, roleColor: roleInfo.color, roleLight: roleInfo.light, pos: 'สาขาหลัก', lastLogin: '-', loginCount: '0', status: 'ใช้งาน' };
      setUsers(prev => [...prev, newUser]);
    }
    setShowForm(false); setEditUser(null); setFormName(''); setFormPhone(''); setFormRole('แคชเชียร์');
  };

  const handleEdit = (u: any) => { setEditUser(u); setFormName(u.name); setFormPhone(u.phone); setFormRole(u.role); setShowForm(true); };
  const handleDelete = (id: string) => { if (window.confirm('ลบผู้ใช้นี้?')) setUsers(prev => prev.filter(u => u.id !== id)); };

  const filtered = users.filter(u => !search || u.name.includes(search) || u.phone.includes(search));

  return (
    <View style={g.root}>
      {/* Add/Edit Form */}
      {showForm && (
        <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: WebColors.border, maxWidth: 500, gap: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: WebColors.text }}>{editUser ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</Text>
          <TextInput style={{ borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12 }} value={formName} onChangeText={setFormName} placeholder="ชื่อ-นามสกุล *" placeholderTextColor={WebColors.textDisabled} />
          <TextInput style={{ borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12 }} value={formPhone} onChangeText={setFormPhone} placeholder="เบอร์โทร" placeholderTextColor={WebColors.textDisabled} />
          <TextInput style={{ borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12 }} placeholder="รหัสผ่าน (ว่างไว้ = ไม่เปลี่ยน)" placeholderTextColor={WebColors.textDisabled} secureTextEntry />
          <Text style={{ fontSize: 12, fontWeight: '600', color: WebColors.textSecondary }}>ตำแหน่ง/บทบาท</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ROLES.map(r => (
              <TouchableOpacity key={r.value} onPress={() => setFormRole(r.value)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: formRole === r.value ? r.color : WebColors.gray100, borderWidth: 1, borderColor: formRole === r.value ? r.color : WebColors.border }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: formRole === r.value ? WebColors.white : WebColors.textSecondary }}>{r.value}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={() => { setShowForm(false); setEditUser(null); }} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: WebColors.border }}><Text style={{ fontSize: 12, fontWeight: '600', color: WebColors.textSecondary }}>ยกเลิก</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: WebColors.primary }}><Text style={{ fontSize: 12, fontWeight: '700', color: WebColors.white }}>บันทึก</Text></TouchableOpacity>
          </View>
        </View>
      )}

      <View style={g.headerRow}>
        <View style={g.searchBar}>
          <Ionicons name="search-outline" size={15} color={WebColors.textSecondary} />
          <TextInput style={g.searchInput} placeholder="ค้นหาผู้ใช้งาน ชื่อ เบอร์โทร อีเมล..." placeholderTextColor={WebColors.textDisabled} value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity style={g.primaryBtn} onPress={() => { setEditUser(null); setFormName(''); setFormPhone(''); setFormRole('แคชเชียร์'); setShowForm(true); }}><Ionicons name="add" size={16} color={WebColors.white} /><Text style={g.primaryBtnText}>เพิ่มผู้ใช้งาน</Text></TouchableOpacity>
      </View>
      <View style={g.table}>
        <View style={g.thead}>
          {['ผู้ใช้งาน','โทร/อีเมล','แผนก','บทบาท','LOGIN ล่าสุด','สถานะ','จัดการ'].map((h, i) => (
            <Text key={i} style={[g.th, i === 0 && { flex: 1.5 }]}>{h}</Text>
          ))}
        </View>
        {filtered.map((u, idx) => (
          <View key={u.id} style={[g.tr, idx % 2 === 1 && g.trAlt]}>
            <View style={[g.tdCol, { flex: 1.5 }]}>
              <View style={[g.avatar, { backgroundColor: u.roleColor + '30' }]}>
                <Ionicons name="person" size={16} color={u.roleColor} />
              </View>
              <View>
                <Text style={g.tdBold}>{u.name}</Text>
                <Text style={g.tdSub}>@{u.username}</Text>
              </View>
            </View>
            <View style={g.tdCol}>
              <Text style={g.tdBold}>{u.phone}</Text>
              <Text style={g.tdSub}>{u.email}</Text>
            </View>
            <Text style={g.td}>{u.pos}</Text>
            <View style={g.td}><View style={[g.badge, { backgroundColor: u.roleLight }]}><Text style={[g.badgeText, { color: u.roleColor }]}>{u.role}</Text></View></View>
            <View style={g.tdCol}>
              <Text style={g.tdBold}>{u.lastLogin}</Text>
              <Text style={g.tdSub}>ล็อคอิน {u.loginCount} ครั้ง</Text>
            </View>
            <View style={g.td}><View style={[g.badge, { backgroundColor: WebColors.successLight }]}><Ionicons name="checkmark-circle" size={10} color={WebColors.success} /><Text style={[g.badgeText, { color: WebColors.success }]}> {u.status}</Text></View></View>
            <View style={[g.td, { flexDirection: 'row', gap: 4 }]}>
              <TouchableOpacity style={g.iconBtn} onPress={() => { const pw = window.prompt('ตั้งรหัสผ่านใหม่สำหรับ ' + u.name, '1234'); if (pw) window.alert('รีเซ็ตรหัสผ่านสำเร็จ: ' + u.name); }}><Ionicons name="key-outline" size={13} color={WebColors.warning} /></TouchableOpacity>
              <TouchableOpacity style={g.iconBtn} onPress={() => handleEdit(u)}><Ionicons name="create-outline" size={13} color={WebColors.primary} /></TouchableOpacity>
              <TouchableOpacity style={[g.iconBtn, { backgroundColor: WebColors.dangerLight }]} onPress={() => handleDelete(u.id)}><Ionicons name="trash-outline" size={13} color={WebColors.danger} /></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Audit Log ────────────────────────────────────────────────────────────────
function detectDeviceFromMeta(): string {
  if (typeof navigator === 'undefined') return 'Server';
  const ua = navigator.userAgent || '';
  if (ua.includes('Chrome') && ua.includes('Windows')) return 'Chrome on Windows';
  if (ua.includes('Safari') && ua.includes('iPhone')) return 'Mobile Safari on iOS';
  if (ua.includes('Safari') && ua.includes('Mac')) return 'Safari on macOS';
  if (ua.includes('Android')) return 'Android Browser';
  return 'Unknown';
}

const AUDIT_MOCK = [
  { date: '8/6/2569 10:11', user: 'สมชาย ใจดี', userId: '12.1', action: 'LOGIN', module: 'Authentication', desc: 'เข้าสู่ระบบสำเร็จ', device: 'Chrome on Windows', status: 'สำเร็จ', ok: true },
  { date: '8/6/2569 09:45', user: 'สมชาย ใจดี', userId: '12.1', action: 'SALE_CREATE', module: 'POS', desc: 'สร้างบิลขาย #5001 มูลค่า ฿500.00', device: 'Mobile Safari on iOS', status: 'สำเร็จ', ok: true },
  { date: '8/6/2569 09:41', user: 'สมชาย ใจดี', userId: '12.1', action: 'PRODUCT_UPDATE', module: 'Product', desc: 'แก้ไขสินค้า: น้ำดื่ม 600 มล. (ราคา 10 → 12)', device: 'Chrome on Windows', status: 'สำเร็จ', ok: true },
  { date: '8/6/2569 09:41', user: 'Unknown User', userId: '??', action: 'LOGIN_FAILED', module: 'Authentication', desc: 'พยายามเข้าสู่ระบบล้มเหลว', device: 'Unknown', status: 'ล้มเหลว', ok: false },
  { date: '8/6/2569 09:11', user: 'สมชาย ใจดี', userId: '12.1', action: 'STOCK_ADJUST', module: 'Warehouse', desc: 'ปรับสต๊อคสินค้า -30 ชิ้น', device: 'Chrome on Windows', status: 'สำเร็จ', ok: true },
  { date: '8/6/2569 08:11', user: 'สมชาย ใจดี', userId: '12.1', action: 'USER_CREATE', module: 'User Management', desc: 'สร้างผู้ใช้ใหม่: สมหญิง จริงใจ (Cashier)', device: 'Chrome on Windows', status: 'สำเร็จ', ok: true },
  { date: '7/6/2569 11:22', user: 'System', userId: 'system', action: 'SYNC_DATA', module: 'System', desc: 'Sync ข้อมูลไปยัง Server สำเร็จ (125 records)', device: 'System Process', status: 'รอดำเนินการ', ok: true },
  { date: '7/6/2569 11:22', user: 'สมชาย ใจดี', userId: '12.1', action: 'SALE_CANCEL', module: 'POS', desc: 'ยกเลิกบิลขาย #5000 (ลูกค้าเปลี่ยนใจ)', device: 'Mobile Safari on iOS', status: 'สำเร็จ', ok: true },
];

export const WebAuditLogScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const { logs } = useAuditLogStore();

  // รวม mock + real logs
  const allLogs = [
    ...logs.map(l => ({ user: l.actor, userId: l.role || '-', action: l.action, desc: l.description, date: new Date(l.timestamp).toLocaleString('th-TH'), device: l.device || detectDeviceFromMeta(), status: 'สำเร็จ', ok: true, module: l.module })),
    ...AUDIT_MOCK,
  ];

  // Filter by module
  const filteredByModule = moduleFilter === 'all' ? allLogs : allLogs.filter(a => a.module === moduleFilter);
  const counts = { all: filteredByModule.length, ok: filteredByModule.filter(a => a.ok && a.status === 'สำเร็จ').length, fail: filteredByModule.filter(a => !a.ok).length, pending: filteredByModule.filter(a => a.status === 'รอดำเนินการ').length };
  const filtered = filteredByModule.filter(a => !search || a.user.includes(search) || a.action.includes(search) || a.desc.includes(search));

  return (
    <View style={g.root}>
      <Text style={g.pageTitle}>Audit Log</Text>
      <Text style={g.pageSub}>บันทึกกิจกรรมการใช้งานระบบและกิจกรรมที่เกิดขึ้น</Text>

      {/* Module Filter */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {['all', 'POS', 'CRM', 'สินค้า', 'โปรโมชั่น', 'ตั้งค่า', 'Wallet', 'กำหนดราคา'].map(mod => (
          <TouchableOpacity key={mod} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: moduleFilter === mod ? WebColors.primary : WebColors.gray100, borderWidth: 1, borderColor: moduleFilter === mod ? WebColors.primary : WebColors.border }} onPress={() => setModuleFilter(mod)}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: moduleFilter === mod ? WebColors.white : Colors.textSecondary }}>{mod === 'all' ? 'ทั้งหมด' : mod}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={g.headerRow}>
        <View style={g.searchBar}>
          <Ionicons name="search-outline" size={15} color={WebColors.textSecondary} />
          <TextInput style={g.searchInput} placeholder="ค้นหา ผู้ใช้, กิจกรรม, รายละเอียด..." placeholderTextColor={WebColors.textDisabled} value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity style={[g.primaryBtn, { backgroundColor: WebColors.white, borderWidth: 1, borderColor: WebColors.border }]}>
          <Ionicons name="filter-outline" size={15} color={WebColors.textSecondary} /><Text style={[g.primaryBtnText, { color: WebColors.textSecondary }]}>กรองข้อมูล</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[g.primaryBtn, { backgroundColor: WebColors.white, borderWidth: 1, borderColor: WebColors.border }]}>
          <Ionicons name="download-outline" size={15} color={WebColors.textSecondary} /><Text style={[g.primaryBtnText, { color: WebColors.textSecondary }]}>ดาวน์โหลด</Text>
        </TouchableOpacity>
      </View>

      <View style={g.kpiRow}>
        {[
          { label: 'กิจกรรมทั้งหมด', value: counts.all,     color: WebColors.primary, icon: 'pulse-outline' },
          { label: 'สำเร็จ',          value: counts.ok,      color: WebColors.success, icon: 'checkmark-circle-outline' },
          { label: 'ล้มเหลว',         value: counts.fail,    color: WebColors.danger,  icon: 'close-circle-outline' },
          { label: 'รอดำเนินการ',     value: counts.pending, color: WebColors.warning,   icon: 'time-outline' },
        ].map((k, i) => (
          <View key={i} style={g.kpiCard}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Ionicons name={k.icon as any} size={14} color={k.color} />
                <Text style={g.kpiLabel}>{k.label}</Text>
              </View>
              <Text style={[g.kpiValue, { color: k.color }]}>{k.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={g.table}>
        <View style={g.thead}>
          {['วันที่','ผู้ใช้งาน','Action','Module','รายละเอียด','อุปกรณ์','สถานะ'].map((h, i) => (
            <Text key={i} style={[g.th, i === 4 && { flex: 2 }]}>{h}</Text>
          ))}
        </View>
        {filtered.map((a: any, idx: number) => {
          const stColor = a.status === 'สำเร็จ' ? WebColors.success : a.status === 'ล้มเหลว' ? WebColors.danger : WebColors.warning;
          const stBg    = a.status === 'สำเร็จ' ? WebColors.successLight : a.status === 'ล้มเหลว' ? WebColors.dangerLight : WebColors.warningLight;
          return (
            <View key={idx} style={[g.tr, idx % 2 === 1 && g.trAlt]}>
              <View style={g.tdCol}>
                <Text style={g.tdBold}>{(a.date || a.time || '').split(' ')[0]}</Text>
                <Text style={g.tdSub}>{(a.date || a.time || '').split(' ')[1] || ''}</Text>
              </View>
              <View style={g.tdCol}>
                <View style={[g.avatar, { backgroundColor: WebColors.primaryLight }]}>
                  <Ionicons name="person" size={13} color={WebColors.primary} />
                </View>
                <View>
                  <Text style={g.tdBold}>{a.user}</Text>
                  <Text style={g.tdSub}>ID {a.userId}</Text>
                </View>
              </View>
              <Text style={[g.td, { fontSize: 13, fontWeight: '700', color: WebColors.primary }]}>{a.action}</Text>
              <Text style={g.td}>{a.module}</Text>
              <Text style={[g.td, { flex: 2, fontSize: 13 }]} numberOfLines={2}>{a.desc}</Text>
              <Text style={[g.td, { fontSize: 13 }]}>{a.device}</Text>
              <View style={g.td}><View style={[g.badge, { backgroundColor: stBg }]}><Text style={[g.badgeText, { color: stColor }]}>{a.status}</Text></View></View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ─── Settings sub-screens ─────────────────────────────────────────────────────

const SettingShopScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const setShopLogo = useAuthStore(s => s.setShopLogo);
  const setShopNameStore = useAuthStore(s => s.setShopName);
  const currentLogo = useAuthStore(s => s.user?.shopLogo);
  const currentShopName = useAuthStore(s => s.user?.shopName) || '';
  const { storeName, storeAddress, storePhone, storeTaxId, setStoreName: setConfigStoreName, setStoreAddress: setConfigAddr, setStorePhone: setConfigPhone, setStoreTaxId: setConfigTaxId } = useStoreConfigStore();

  const [shopName, setShopName] = useState(currentShopName || storeName || '');
  const [shopAddr, setShopAddr] = useState(storeAddress || '');
  const [shopTel,  setShopTel]  = useState(storePhone || '');
  const [taxId,    setTaxId]    = useState(storeTaxId || '');
  const [branch,   setBranch]   = useState('สำนักงานใหญ่');
  const [saved,    setSaved]    = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogo ?? null);
  const fileRef = React.useRef<any>(null);

  const save = () => {
    setShopNameStore(shopName);
    setConfigStoreName(shopName);
    setConfigAddr(shopAddr);
    setConfigPhone(shopTel);
    setConfigTaxId(taxId);
    if (logoPreview) setShopLogo(logoPreview);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={sv.root}>
      <View style={sv.header}>
        <TouchableOpacity style={sv.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
          <Text style={sv.backText}>ตั้งค่า</Text>
        </TouchableOpacity>
        <Text style={sv.title}>ตั้งค่าร้านค้า</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, padding: 4 }}>
        <View style={sv.card}>
          <Text style={sv.cardTitle}>โลโก้ร้านค้า</Text>

          {/* Logo preview + upload */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            {/* Preview box */}
            <View style={{
              width: 100, height: 100, borderRadius: 16,
              backgroundColor: WebColors.primaryLight,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: WebColors.border, overflow: 'hidden' as any,
            }}>
              {logoPreview ? (
                <Image source={{ uri: logoPreview }} style={{ width: 100, height: 100 }} resizeMode="cover" />
              ) : (
                <Ionicons name="storefront" size={40} color={WebColors.primary} />
              )}
            </View>

            <View style={{ flex: 1, gap: 10 }}>
              <Text style={{ fontSize: 13, color: WebColors.textSecondary, lineHeight: 18 }}>
                รูปโลโก้จะแสดงในหน้าหลัก Landing Page{'\n'}
                แนะนำขนาด 200×200px ไฟล์ PNG หรือ JPG
              </Text>

              {/* hidden file input */}
              {Platform.OS === 'web' && (
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    setLogoPreview(url);
                    e.target.value = '';
                  }}
                />
              )}

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[sv.saveBtn, { flex: 1, backgroundColor: WebColors.primary }]}
                  onPress={() => (fileRef.current as HTMLInputElement)?.click()}
                >
                  <Ionicons name="image-outline" size={15} color={WebColors.white} />
                  <Text style={sv.saveBtnText}>เลือกรูป</Text>
                </TouchableOpacity>

                {logoPreview && (
                  <TouchableOpacity
                    style={[sv.saveBtn, { backgroundColor: WebColors.danger }]}
                    onPress={() => { setLogoPreview(null); setShopLogo(''); }}
                  >
                    <Ionicons name="trash-outline" size={15} color={WebColors.white} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={sv.card}>
          <Text style={sv.cardTitle}>ข้อมูลร้านค้า</Text>
          {[
            { label: 'ชื่อร้าน *',              val: shopName, set: setShopName },
            { label: 'ที่อยู่',                  val: shopAddr, set: setShopAddr },
            { label: 'เบอร์โทร',                 val: shopTel,  set: setShopTel  },
            { label: 'เลขประจำตัวผู้เสียภาษี',   val: taxId,    set: setTaxId    },
            { label: 'สาขา',                     val: branch,   set: setBranch   },
          ].map(f => (
            <View key={f.label} style={sv.field}>
              <Text style={sv.label}>{f.label}</Text>
              <TextInput style={sv.input} value={f.val} onChangeText={f.set} placeholderTextColor={WebColors.textDisabled} />
            </View>
          ))}
          <TouchableOpacity style={sv.saveBtn} onPress={save}>
            <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={16} color={WebColors.white} />
            <Text style={sv.saveBtnText}>{saved ? 'บันทึกแล้ว ✓' : 'บันทึก'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const SettingBranchScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [branches, setBranches] = useState([
    { id: 'b1', name: 'สาขาหลัก', addr: 'กรุงเทพฯ', active: true },
    { id: 'b2', name: 'สาขา 1',   addr: 'เชียงใหม่',  active: true },
  ]);
  const [posPoints, setPosPoints] = useState([
    { id: 'pos1', name: 'POS 1', branchId: 'b1', regNo: 'POS-001', active: true },
    { id: 'pos2', name: 'POS 2', branchId: 'b2', regNo: 'POS-002', active: true },
  ]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showAddPos,    setShowAddPos]    = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddr, setNewBranchAddr] = useState('');
  const [newPosName,    setNewPosName]    = useState('');
  const [newPosRegNo,   setNewPosRegNo]   = useState('');
  const [newPosBranch,  setNewPosBranch]  = useState('b1');

  // ── Branch expand / POS sub-setting ───────────────────────────────────────
  const [expandedBranch, setExpandedBranch] = useState<string | null>('b1');

  // ── Shift schedule per branch ─────────────────────────────────────────────
  const DEFAULT_SHIFTS = [
    { name: 'กะเช้า', startTime: '06:00', endTime: '15:00', enabled: true },
    { name: 'กะบ่าย', startTime: '15:00', endTime: '22:00', enabled: true },
    { name: 'กะดึก', startTime: '22:00', endTime: '06:00', enabled: false },
  ];
  const [branchShifts, setBranchShifts] = useState<Record<string, typeof DEFAULT_SHIFTS>>({});
  const [editingShift, setEditingShift] = useState<{ branchId: string; index: number } | null>(null);
  const [editShiftName, setEditShiftName] = useState('');
  const [editShiftStart, setEditShiftStart] = useState('');
  const [editShiftEnd, setEditShiftEnd] = useState('');

  // Ad settings per POS
  const [posAdSettingsId, setPosAdSettingsId] = useState<string | null>(null);

  // Receipt settings per branch
  const [receiptBranchId, setReceiptBranchId] = useState<string | null>(null);

  // Branch payment settings
  const [branchPaymentId, setBranchPaymentId] = useState<string | null>(null);

  // ── print mode per POS ────────────────────────────────────────────────────
  const [posPrintMode,       setPosPrintMode]       = useState<Record<string,'pdf'|'printer'>>({});
  const [posAvailPrinters,   setPosAvailPrinters]   = useState<Record<string,string[]>>({});
  const [posSelectedPrinter, setPosSelectedPrinter] = useState<Record<string,string>>({});
  const [posShowPrinterDrop, setPosShowPrinterDrop] = useState<Record<string,boolean>>({});

  const fetchPrintersForPos = (posId: string) => {
    if (Platform.OS !== 'web') {
      setPosAvailPrinters(prev => ({ ...prev, [posId]: [] }));
      return;
    }
    // Web Print API ไม่มี printer list — เปิด about:blank แล้วดักจาก dialog
    // วิธีที่ทำงานได้จริงใน browser คือ window.print() ซึ่ง OS จะแสดง printer list ให้เอง
    // เราสร้าง fallback list ที่รู้แน่ๆ ว่ามีใน Windows
    const knownPrinters: string[] = [];

    // ตรวจ PDF printer ที่มักมีใน Windows
    if (typeof window !== 'undefined') {
      // Microsoft Print to PDF — มีใน Windows 10+
      knownPrinters.push('Microsoft Print to PDF');
      // Microsoft XPS — มีใน Windows เกือบทุก version
      knownPrinters.push('Microsoft XPS Document Writer');
      // OneNote — มักมีถ้าติดตั้ง Office
      knownPrinters.push('Send to OneNote 2016');
      // Fax — มีใน Windows
      knownPrinters.push('Fax');
    }

    // ลอง navigator.userAgentData เพื่อดู OS
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMac = ua.includes('Mac');

    if (isMac) {
      knownPrinters.unshift('Save as PDF (macOS)');
    }

    // ถ้าผู้ใช้ตั้งชื่อไว้แล้วใน input ให้ใส่ขึ้นมาด้วย
    const currentName = posPrinterName[posId];
    if (currentName && !knownPrinters.includes(currentName)) {
      knownPrinters.unshift(currentName);
    }

    setPosAvailPrinters(prev => ({ ...prev, [posId]: knownPrinters }));
  };

  // ── POS sub-setting (เครื่องพิมพ์ + ลิ้นชัก + EDC + จอที่ 2) ──────────────
  const [expandedPos,    setExpandedPos]    = useState<string | null>(null);
  const [posPrinterName, setPosPrinterName] = useState<Record<string,string>>({});
  const [posPaperSize,   setPosPaperSize]   = useState<Record<string,string>>({});
  const [posPrinterConn, setPosPrinterConn] = useState<Record<string,string>>({});
  const [posAutoCut,     setPosAutoCut]     = useState<Record<string,boolean>>({});
  const [posOpenDrawer,  setPosOpenDrawer]  = useState<Record<string,boolean>>({});
  const [posDrawerConn,  setPosDrawerConn]  = useState<Record<string,string>>({});
  const [posCardEnabled, setPosCardEnabled] = useState<Record<string,boolean>>({});
  const [posCardModel,   setPosCardModel]   = useState<Record<string,string>>({});
  const [posCardConn,    setPosCardConn]    = useState<Record<string,string>>({});
  const [posDisplay2En,  setPosDisplay2En]  = useState<Record<string,boolean>>({});
  const [posSubTab,      setPosSubTab]      = useState<Record<string,'printer'|'scanner'|'display2'|'payment'>>({});

  const addBranch = () => {
    if (!newBranchName.trim()) return;
    setBranches(prev => [...prev, { id: `b${Date.now()}`, name: newBranchName.trim(), addr: newBranchAddr.trim(), active: true }]);
    setNewBranchName(''); setNewBranchAddr(''); setShowAddBranch(false);
  };

  const addPos = () => {
    if (!newPosName.trim()) return;
    setPosPoints(prev => [...prev, { id: `pos${Date.now()}`, name: newPosName.trim(), branchId: newPosBranch, regNo: newPosRegNo.trim(), active: true }]);
    setNewPosName(''); setNewPosRegNo(''); setShowAddPos(null);
  };

  // ✅ early return หลัง hooks ทั้งหมด — ไม่ละเมิด Rules of Hooks
  if (posAdSettingsId) {
    return <WebAdSettingsScreen onBack={() => setPosAdSettingsId(null)} />;
  }
  if (receiptBranchId) {
    return <SettingReceiptScreen onBack={() => setReceiptBranchId(null)} />;
  }
  if (branchPaymentId) {
    const branchName = branches.find(b => b.id === branchPaymentId)?.name ?? '';
    return <SettingBranchPaymentScreen branchId={branchPaymentId} branchName={branchName} onBack={() => setBranchPaymentId(null)} />;
  }

  return (
    <View style={sv.root}>
      <View style={sv.header}>
        <TouchableOpacity style={sv.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={WebColors.primary} /><Text style={sv.backText}>ตั้งค่า</Text>
        </TouchableOpacity>
        <Text style={sv.title}>จัดการสาขา & จุดขาย</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>

        {/* ── สาขา + จุดขายที่อยู่ภายใต้แต่ละสาขา ── */}
        <View style={sv.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={sv.cardTitle}>🏪 สาขา ({branches.length})</Text>
            <TouchableOpacity style={sv.addBtn} onPress={() => setShowAddBranch(!showAddBranch)}>
              <Ionicons name="add" size={14} color={WebColors.white} /><Text style={sv.addBtnText}>เพิ่มสาขา</Text>
            </TouchableOpacity>
          </View>

          {showAddBranch && (
            <View style={[sv.card, { backgroundColor: WebColors.primaryLight }]}>
              <View style={sv.field}><Text style={sv.label}>ชื่อสาขา *</Text>
                <TextInput style={sv.input} value={newBranchName} onChangeText={setNewBranchName} placeholder="ชื่อสาขา" placeholderTextColor={WebColors.textDisabled} /></View>
              <View style={sv.field}><Text style={sv.label}>ที่อยู่</Text>
                <TextInput style={sv.input} value={newBranchAddr} onChangeText={setNewBranchAddr} placeholder="ที่อยู่" placeholderTextColor={WebColors.textDisabled} /></View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[sv.saveBtn, { flex: 1 }]} onPress={addBranch}><Text style={sv.saveBtnText}>บันทึก</Text></TouchableOpacity>
                <TouchableOpacity style={[sv.saveBtn, { flex: 1, backgroundColor: WebColors.gray300 }]} onPress={() => setShowAddBranch(false)}><Text style={sv.saveBtnText}>ยกเลิก</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {branches.map((b, bIdx) => {
            const branchPos = posPoints.filter(p => p.branchId === b.id);
            const isBranchExpanded = expandedBranch === b.id;
            return (
              <View key={b.id} style={[{ borderTopWidth: bIdx > 0 ? 1 : 0, borderTopColor: WebColors.border }]}>
                {/* Branch row */}
                <TouchableOpacity
                  style={[sv.listRow, { paddingRight: 0 }]}
                  onPress={() => setExpandedBranch(isBranchExpanded ? null : b.id)}
                  activeOpacity={0.8}
                >
                  <View style={sv.listIcon}><Ionicons name="business-outline" size={18} color={WebColors.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={sv.listTitle}>{b.name}</Text>
                    <Text style={sv.listSub}>{b.addr || '—'} · {branchPos.length} จุดขาย</Text>
                  </View>
                  <View style={[sv.statusBadge, { backgroundColor: b.active ? WebColors.successLight : WebColors.gray100, marginRight: 8 }]}>
                    <Text style={[sv.statusText, { color: b.active ? WebColors.success : WebColors.textSecondary }]}>{b.active ? 'ใช้งาน' : 'ปิดใช้'}</Text>
                  </View>
                  {/* ปุ่มประเภทชำระ (ระดับสาขา) */}
                  <TouchableOpacity
                    style={[sv.chip, { backgroundColor: WebColors.infoLight, borderColor: WebColors.info, marginRight: 6, flexDirection: 'row', gap: 4 }]}
                    onPress={(e) => { e.stopPropagation?.(); setBranchPaymentId(b.id); }}
                  >
                    <Ionicons name="card-outline" size={12} color={WebColors.info} />
                    <Text style={[sv.chipText, { color: WebColors.info, fontSize: 13 }]}>ชำระ</Text>
                  </TouchableOpacity>
                  {/* ปุ่มตั้งค่าบิลของสาขา */}
                  <TouchableOpacity
                    style={[sv.chip, { backgroundColor: WebColors.successLight, borderColor: WebColors.success, marginRight: 6, flexDirection: 'row', gap: 4 }]}
                    onPress={(e) => { e.stopPropagation?.(); setReceiptBranchId(b.id); }}
                  >
                    <Ionicons name="receipt-outline" size={12} color={WebColors.success} />
                    <Text style={[sv.chipText, { color: WebColors.success, fontSize: 13 }]}>บิล</Text>
                  </TouchableOpacity>
                  <Ionicons name={isBranchExpanded ? 'chevron-up' : 'chevron-down'} size={16}
                    color={WebColors.textSecondary} style={{ marginRight: 8 }} />
                </TouchableOpacity>

                {/* POS list under branch */}
                {isBranchExpanded && (
                  <View style={{ backgroundColor: WebColors.gray50, borderRadius: 12, marginHorizontal: 8, marginBottom: 8, overflow: 'hidden' as any }}>
                    {/* ── ตั้งเวลากะ (per branch) ── */}
                    <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: WebColors.border }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Ionicons name="time-outline" size={14} color={WebColors.primary} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: WebColors.text }}>เวลาเปิด-ปิดกะ ({b.name})</Text>
                      </View>
                      {(branchShifts[b.id] || DEFAULT_SHIFTS).map((shift, si) => {
                        const isEditing = editingShift?.branchId === b.id && editingShift?.index === si;
                        if (isEditing) {
                          return (
                            <View key={si} style={{ gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: WebColors.border }}>
                              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                <TextInput style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 }} value={editShiftName} onChangeText={setEditShiftName} placeholder="ชื่อกะ" />
                                {Platform.OS === 'web' ? (
                                  <>
                                    <input type="time" value={editShiftStart} onChange={(e: any) => setEditShiftStart(e.target.value)} style={{ width: 90, height: 28, border: '1px solid #ddd', borderRadius: 6, paddingLeft: 6, fontSize: 12 }} />
                                    <Text style={{ fontSize: 11, color: '#888' }}>ถึง</Text>
                                    <input type="time" value={editShiftEnd} onChange={(e: any) => setEditShiftEnd(e.target.value)} style={{ width: 90, height: 28, border: '1px solid #ddd', borderRadius: 6, paddingLeft: 6, fontSize: 12 }} />
                                  </>
                                ) : (
                                  <>
                                    <TextInput style={{ width: 60, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4, fontSize: 12, textAlign: 'center' }} value={editShiftStart} onChangeText={setEditShiftStart} placeholder="HH:MM" />
                                    <Text style={{ fontSize: 11, color: '#888' }}>ถึง</Text>
                                    <TextInput style={{ width: 60, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4, fontSize: 12, textAlign: 'center' }} value={editShiftEnd} onChangeText={setEditShiftEnd} placeholder="HH:MM" />
                                  </>
                                )}
                              </View>
                              <View style={{ flexDirection: 'row', gap: 6 }}>
                                <TouchableOpacity style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: WebColors.primary }} onPress={() => {
                                  const current = branchShifts[b.id] || [...DEFAULT_SHIFTS];
                                  const updated = current.map((s, i) => i === si ? { ...s, name: editShiftName, startTime: editShiftStart, endTime: editShiftEnd } : s);
                                  setBranchShifts(prev => ({ ...prev, [b.id]: updated }));
                                  setEditingShift(null);
                                }}>
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>บันทึก</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' }} onPress={() => setEditingShift(null)}>
                                  <Text style={{ fontSize: 11, color: '#888' }}>ยกเลิก</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        }
                        return (
                          <TouchableOpacity key={si} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}
                            onPress={() => {
                              setEditingShift({ branchId: b.id, index: si });
                              setEditShiftName(shift.name);
                              setEditShiftStart(shift.startTime);
                              setEditShiftEnd(shift.endTime);
                            }}
                            onLongPress={() => {
                              const current = branchShifts[b.id] || [...DEFAULT_SHIFTS];
                              const updated = current.map((s, i) => i === si ? { ...s, enabled: !s.enabled } : s);
                              setBranchShifts(prev => ({ ...prev, [b.id]: updated }));
                            }}
                          >
                            <Ionicons name="time-outline" size={13} color={shift.enabled ? WebColors.success : WebColors.textDisabled} />
                            <Text style={{ flex: 1, fontSize: 12, color: shift.enabled ? WebColors.text : WebColors.textDisabled }}>{shift.name}: {shift.startTime} — {shift.endTime}</Text>
                            <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); const current = branchShifts[b.id] || [...DEFAULT_SHIFTS]; const updated = current.map((s, i) => i === si ? { ...s, enabled: !s.enabled } : s); setBranchShifts(prev => ({ ...prev, [b.id]: updated })); }}>
                              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: shift.enabled ? WebColors.successLight : WebColors.gray100 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: shift.enabled ? WebColors.success : WebColors.textSecondary }}>{shift.enabled ? 'เปิด' : 'ปิด'}</Text>
                              </View>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Add POS button */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: WebColors.textSecondary }}>🖥 จุดขาย ({branchPos.length})</Text>
                      <TouchableOpacity
                        style={[sv.addBtn, { paddingHorizontal: 10, paddingVertical: 6 }]}
                        onPress={() => { setNewPosBranch(b.id); setShowAddPos(showAddPos === b.id ? null : b.id); }}
                      >
                        <Ionicons name="add" size={13} color={WebColors.white} />
                        <Text style={[sv.addBtnText, { fontSize: 13 }]}>เพิ่มจุดขาย</Text>
                      </TouchableOpacity>
                    </View>

                    {showAddPos === b.id && (
                      <View style={{ margin: 8, marginTop: 0, backgroundColor: WebColors.white, borderRadius: 8, padding: 12, gap: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <View style={[sv.field, { flex: 1 }]}><Text style={sv.label}>ชื่อจุดขาย *</Text>
                            <TextInput style={sv.input} value={newPosName} onChangeText={setNewPosName} placeholder="เช่น POS 1" placeholderTextColor={WebColors.textDisabled} /></View>
                          <View style={[sv.field, { flex: 1 }]}><Text style={sv.label}>หมายเลขรหัสเครื่อง</Text>
                            <TextInput style={sv.input} value={newPosRegNo} onChangeText={setNewPosRegNo} placeholder="เช่น POS-001" placeholderTextColor={WebColors.textDisabled} /></View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity style={[sv.saveBtn, { flex: 1 }]} onPress={addPos}><Text style={sv.saveBtnText}>บันทึก</Text></TouchableOpacity>
                          <TouchableOpacity style={[sv.saveBtn, { flex: 1, backgroundColor: WebColors.gray300 }]} onPress={() => setShowAddPos(null)}><Text style={sv.saveBtnText}>ยกเลิก</Text></TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {branchPos.length === 0 && (
                      <View style={{ padding: 16, alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, color: WebColors.textDisabled }}>ยังไม่มีจุดขาย</Text>
                      </View>
                    )}

                    {branchPos.map((p, pIdx) => {
                      const isExpanded  = expandedPos === p.id;
                      const subTab      = posSubTab[p.id] ?? 'printer';
                      const printerName = posPrinterName[p.id] ?? '';
                      const paperSize   = posPaperSize[p.id]   ?? '80mm';
                      const disp2En     = posDisplay2En[p.id]  ?? false;

                      return (
                        <View key={p.id} style={{ borderTopWidth: pIdx > 0 ? 1 : 0, borderTopColor: WebColors.border }}>
                          {/* POS row */}
                          <View style={[sv.listRow, { paddingHorizontal: 12 }]}>
                            <View style={[sv.listIcon, { backgroundColor: WebColors.infoLight, width: 32, height: 32 }]}>
                              <Ionicons name="desktop-outline" size={15} color={WebColors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[sv.listTitle, { fontSize: 12 }]}>{p.name}</Text>
                                {p.regNo && (
                                  <View style={{ backgroundColor: WebColors.primaryLight, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
                                    <Text style={{ fontSize: 12, color: WebColors.primary, fontWeight: '700' }}>{p.regNo}</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                            <TouchableOpacity
                              style={[sv.chip, { backgroundColor: isExpanded ? WebColors.primaryLight : WebColors.white, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6 }]}
                              onPress={() => setExpandedPos(isExpanded ? null : p.id)}
                            >
                              <Ionicons name={isExpanded ? 'chevron-up' : 'settings-outline'} size={12}
                                color={isExpanded ? WebColors.primary : WebColors.textSecondary} />
                              <Text style={[sv.chipText, { fontSize: 13 }, isExpanded && { color: WebColors.primary }]}>
                                {isExpanded ? 'ปิด' : 'ตั้งค่า'}
                              </Text>
                            </TouchableOpacity>
                            <View style={[sv.statusBadge, { backgroundColor: p.active ? WebColors.successLight : WebColors.gray100 }]}>
                              <Text style={[sv.statusText, { color: p.active ? WebColors.success : WebColors.textSecondary }]}>{p.active ? 'ใช้งาน' : 'ปิดใช้'}</Text>
                            </View>
                          </View>

                          {/* Sub-settings */}
                          {isExpanded && (
                            <View style={{ backgroundColor: WebColors.white, margin: 8, marginTop: 0, borderRadius: 12, overflow: 'hidden' as any, borderWidth: 1, borderColor: WebColors.border }}>
                              {/* Tab bar */}
                              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: WebColors.border }}>
                                {([
                                  { key: 'printer',  icon: 'print-outline',  label: 'เครื่องพิมพ์ & อุปกรณ์' },
                                  { key: 'scanner',  icon: 'barcode-outline', label: 'สแกนเนอร์'              },
                                  { key: 'display2', icon: 'desktop-outline', label: 'จอที่ 2'                  },
                                ] as const).map(tab => (
                                  <TouchableOpacity key={tab.key}
                                    style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2.5, borderBottomColor: subTab === tab.key ? WebColors.primary : 'transparent' }]}
                                    onPress={() => setPosSubTab(prev => ({ ...prev, [p.id]: tab.key }))}>
                                    <Ionicons name={tab.icon} size={13} color={subTab === tab.key ? WebColors.primary : WebColors.textSecondary} />
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: subTab === tab.key ? WebColors.primary : WebColors.textSecondary }}>{tab.label}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>

                              {/* เครื่องพิมพ์ */}
                              {subTab === 'printer' && (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, padding: 12 }}>
                                  <View style={[sv.card, { gap: 8 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                      <Ionicons name="print-outline" size={15} color={WebColors.primary} />
                                      <Text style={sv.cardTitle}>เครื่องพิมพ์ใบเสร็จ</Text>
                                    </View>

                                    {/* โหมดการพิมพ์ */}
                                    <Text style={sv.label}>โหมดการพิมพ์</Text>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                      {([
                                        { val: 'pdf',     label: 'PDF',           icon: 'document-outline' },
                                        { val: 'printer', label: 'เครื่องพิมพ์',  icon: 'print-outline'    },
                                      ] as const).map(opt => {
                                        const cur = posPrintMode[p.id] ?? 'printer';
                                        return (
                                          <TouchableOpacity key={opt.val}
                                            style={[sv.chip, cur===opt.val && sv.chipActive, { flexDirection: 'row', gap: 5 }]}
                                            onPress={() => setPosPrintMode(prev => ({ ...prev, [p.id]: opt.val }))}>
                                            <Ionicons name={opt.icon} size={12} color={cur===opt.val ? WebColors.white : WebColors.textSecondary} />
                                            <Text style={[sv.chipText, cur===opt.val && { color: WebColors.white }]}>{opt.label}</Text>
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>

                                    {(posPrintMode[p.id] ?? 'printer') === 'pdf' && (
                                      <View style={{ backgroundColor: WebColors.primaryLight, borderRadius: 8, padding: 10 }}>
                                        <Text style={{ fontSize: 13, color: WebColors.primary, lineHeight: 18 }}>
                                          📄 เลือก <Text style={{ fontWeight: '700' }}>"Save as PDF"</Text> ใน print dialog{'\n'}
                                          หรือ <Text style={{ fontWeight: '700' }}>"Microsoft Print to PDF"</Text>
                                        </Text>
                                      </View>
                                    )}

                                    {(posPrintMode[p.id] ?? 'printer') === 'printer' && (
                                      <>
                                        <Text style={sv.label}>ชื่อ / รุ่น</Text>
                                        <TextInput style={sv.input} value={printerName}
                                          onChangeText={v => setPosPrinterName(prev => ({ ...prev, [p.id]: v }))}
                                          placeholder="เช่น EPSON TM-T82" placeholderTextColor={WebColors.textDisabled} />

                                        <Text style={sv.label}>การเชื่อมต่อ</Text>
                                        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                                          {(['usb','bluetooth','network'] as const).map(opt => {
                                            const cur = posPrinterConn[p.id] ?? 'usb';
                                            const labels: Record<string,string> = { usb: 'USB/Port', bluetooth: 'Bluetooth', network: 'Network IP' };
                                            return (
                                              <TouchableOpacity key={opt} style={[sv.chip, cur===opt && sv.chipActive]}
                                                onPress={() => setPosPrinterConn(prev => ({ ...prev, [p.id]: opt }))}>
                                                <Text style={[sv.chipText, cur===opt && { color: WebColors.white }]}>{labels[opt]}</Text>
                                              </TouchableOpacity>
                                            );
                                          })}
                                        </View>

                                        {/* Dropdown เลือก Printer (USB/Port) */}
                                        {(posPrinterConn[p.id] ?? 'usb') === 'usb' && (
                                          <View>
                                            <Text style={sv.label}>เลือกเครื่องพิมพ์</Text>
                                            <TouchableOpacity
                                              style={[sv.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40 }]}
                                              onPress={() => {
                                                fetchPrintersForPos(p.id);
                                                setPosShowPrinterDrop(prev => ({ ...prev, [p.id]: !prev[p.id] }));
                                              }}
                                            >
                                              <Text style={{ fontSize: 12, color: posSelectedPrinter[p.id] ? WebColors.text : WebColors.textDisabled }}>
                                                {posSelectedPrinter[p.id] || 'กดเพื่อดูรายการ...'}
                                              </Text>
                                              <Ionicons name={posShowPrinterDrop[p.id] ? 'chevron-up' : 'chevron-down'} size={14} color={WebColors.textSecondary} />
                                            </TouchableOpacity>
                                            {posShowPrinterDrop[p.id] && (
                                              <View style={{ backgroundColor: WebColors.white, borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, marginTop: 2, overflow: 'hidden' as any }}>
                                                {(posAvailPrinters[p.id] ?? []).length === 0 ? (
                                                  <View style={{ padding: 16, alignItems: 'center', gap: 8 }}>
                                                    <Ionicons name="warning-outline" size={24} color={WebColors.warning} />
                                                    <Text style={{ fontSize: 12, color: WebColors.textSecondary, textAlign: 'center' }}>
                                                      ไม่พบเครื่องพิมพ์ในระบบ{'\n'}
                                                      กด "รีเฟรชรายการ" หรือตรวจสอบการติดตั้ง driver
                                                    </Text>
                                                  </View>
                                                ) : (posAvailPrinters[p.id] ?? []).map((pn, pi) => (
                                                  <TouchableOpacity key={pi}
                                                    style={{ padding: 10, borderBottomWidth: pi < (posAvailPrinters[p.id]?.length ?? 0) - 1 ? 1 : 0, borderBottomColor: WebColors.border, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: posSelectedPrinter[p.id] === pn ? WebColors.primaryLight : WebColors.white }}
                                                    onPress={() => {
                                                      setPosSelectedPrinter(prev => ({ ...prev, [p.id]: pn }));
                                                      setPosPrinterName(prev => ({ ...prev, [p.id]: pn }));
                                                      setPosShowPrinterDrop(prev => ({ ...prev, [p.id]: false }));
                                                    }}>
                                                    <Ionicons name="print-outline" size={13} color={posSelectedPrinter[p.id] === pn ? WebColors.primary : WebColors.textSecondary} />
                                                    <Text style={{ fontSize: 13, flex: 1, color: posSelectedPrinter[p.id] === pn ? WebColors.primary : WebColors.text, fontWeight: posSelectedPrinter[p.id] === pn ? '700' : '400' }}>{pn}</Text>
                                                    {pn.toLowerCase().includes('pdf') && (
                                                      <View style={{ backgroundColor: WebColors.purpleLight, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
                                                        <Text style={{ fontSize: 12, color: WebColors.purple, fontWeight: '700' }}>PDF</Text>
                                                      </View>
                                                    )}
                                                  </TouchableOpacity>
                                                ))}
                                                <TouchableOpacity style={{ padding: 8, alignItems: 'center', backgroundColor: WebColors.gray50 }}
                                                  onPress={() => fetchPrintersForPos(p.id)}>
                                                  <Text style={{ fontSize: 13, color: WebColors.primary, fontWeight: '600' }}>🔄 รีเฟรชรายการ</Text>
                                                </TouchableOpacity>
                                              </View>
                                            )}
                                            <Text style={{ fontSize: 13, color: WebColors.textSecondary, marginTop: 4 }}>
                                              💡 รายการนี้รวม PDF printers · เลือก "Microsoft Print to PDF" เพื่อ save เป็น PDF
                                            </Text>
                                          </View>
                                        )}
                                      </>
                                    )}

                                    <Text style={sv.label}>ขนาดกระดาษ</Text>
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                      {(['58mm','80mm','A4'] as const).map(sz => (
                                        <TouchableOpacity key={sz} style={[sv.chip, paperSize===sz && sv.chipActive]}
                                          onPress={() => setPosPaperSize(prev => ({ ...prev, [p.id]: sz }))}>
                                          <Text style={[sv.chipText, paperSize===sz && { color: WebColors.white }]}>{sz}</Text>
                                        </TouchableOpacity>
                                      ))}
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                        <Switch value={posAutoCut[p.id] ?? true} onValueChange={v => setPosAutoCut(prev => ({ ...prev, [p.id]: v }))} trackColor={{ true: WebColors.primary }} />
                                        <Text style={{ fontSize: 13, color: WebColors.textSecondary }}>ตัดกระดาษ</Text>
                                      </View>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                        <Switch value={posOpenDrawer[p.id] ?? true} onValueChange={v => setPosOpenDrawer(prev => ({ ...prev, [p.id]: v }))} trackColor={{ true: WebColors.primary }} />
                                        <Text style={{ fontSize: 13, color: WebColors.textSecondary }}>เปิดลิ้นชัก</Text>
                                      </View>
                                    </View>
                                    <TouchableOpacity
                                      style={[sv.saveBtn, { backgroundColor: WebColors.purple, flexDirection: 'row', gap: 6, justifyContent: 'center' }]}
                                      onPress={() => {
                                        const mode = posPrintMode[p.id] ?? 'printer';
                                        const pSize = posPaperSize[p.id] ?? '80mm';
                                        const W = pSize === '80mm' ? '72mm' : pSize === '58mm' ? '50mm' : '190mm';
                                        if (Platform.OS === 'web') {
                                          const w = (window as any).open('', '_blank', 'width=420,height=500');
                                          if (!w) {
                                            alert('⚠️ Browser บล็อก popup — กรุณาอนุญาต popup สำหรับ localhost');
                                            return;
                                          }
                                          w.document.write(`<!DOCTYPE html><html><head>
                                            <style>
                                              @page { size: ${pSize} auto; margin: 3mm; }
                                              body { font-family:'TH SarabunPSK','Sarabun',monospace; font-size:12px; width:${W}; margin:0 auto; }
                                              .c { text-align:center; } .d { border-top:1px dashed #000; margin:4px 0; }
                                              @media print { body { width:${W}; } }
                                            </style></head><body>
                                            <p class="c"><b>TEST PRINT</b></p>
                                            <p class="c">เครื่อง: ${p.name} (${p.regNo})</p>
                                            <p class="c">Printer: ${posSelectedPrinter[p.id] || posPrinterName[p.id] || 'Default'}</p>
                                            <p class="c">โหมด: ${mode === 'pdf' ? 'PDF' : 'Printer'} | กระดาษ: ${pSize}</p>
                                            <div class="d"></div>
                                            <p class="c">1234567890</p>
                                            <p class="c">ABCDEFGHIJKLMNOP</p>
                                            <div class="d"></div>
                                            <p class="c">✓ พิมพ์ทดสอบสำเร็จ</p>
                                          </body></html>`);
                                          w.document.close();
                                          setTimeout(() => { w.print(); }, 300);
                                        }
                                      }}
                                    >
                                      <Ionicons name="print-outline" size={13} color={WebColors.white} />
                                      <Text style={sv.saveBtnText}>ทดสอบพิมพ์</Text>
                                    </TouchableOpacity>
                                  </View>
                                  <View style={[sv.card, { gap: 8 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                      <Ionicons name="briefcase-outline" size={15} color={WebColors.warning} />
                                      <Text style={[sv.cardTitle, { color: WebColors.warning }]}>ลิ้นชักเงินสด</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                                      {(['printer','usb','serial'] as const).map(opt => {
                                        const cur = posDrawerConn[p.id] ?? 'printer';
                                        const labels: Record<string,string> = { printer: 'ผ่านเครื่องพิมพ์', usb: 'USB', serial: 'Serial Port' };
                                        return (
                                          <TouchableOpacity key={opt} style={[sv.chip, cur===opt && sv.chipActive]}
                                            onPress={() => setPosDrawerConn(prev => ({ ...prev, [p.id]: opt }))}>
                                            <Text style={[sv.chipText, cur===opt && { color: WebColors.white }]}>{labels[opt]}</Text>
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>
                                    <TouchableOpacity
                                      style={[sv.saveBtn, { backgroundColor: WebColors.warning, flexDirection: 'row', gap: 6, justifyContent: 'center' }]}
                                      onPress={() => {
                                        const conn = posDrawerConn[p.id] ?? 'printer';
                                        if (conn === 'printer') {
                                          // ส่ง ESC/POS cash drawer command ผ่าน print
                                          if (Platform.OS === 'web') {
                                            const w = (window as any).open('', '_blank', 'width=1,height=1');
                                            if (!w) { alert('⚠️ กรุณาอนุญาต popup'); return; }
                                            // ESC/POS: ESC p 0 25 25 = open drawer
                                            w.document.write(`<!DOCTYPE html><html><head>
                                              <style>@page{margin:0}body{margin:0}</style>
                                            </head><body>
                                              <script>window.onload=function(){window.print();setTimeout(()=>window.close(),500)}<\/script>
                                            </body></html>`);
                                            w.document.close();
                                            alert('✅ ส่งคำสั่งเปิดลิ้นชักแล้ว (ผ่านเครื่องพิมพ์)\nถ้าลิ้นชักไม่เปิด ตรวจสอบการเชื่อมต่อสาย RJ11');
                                          }
                                        } else {
                                          alert(`⚠️ ลิ้นชักประเภท "${conn.toUpperCase()}" ต้องใช้ driver พิเศษ\nกรุณาใช้ซอฟต์แวร์ที่มากับเครื่องพิมพ์เพื่อทดสอบ`);
                                        }
                                      }}
                                    >
                                      <Ionicons name="lock-open-outline" size={13} color={WebColors.white} />
                                      <Text style={sv.saveBtnText}>ทดสอบเปิดลิ้นชัก</Text>
                                    </TouchableOpacity>
                                  </View>
                                  <View style={[sv.card, { gap: 8 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Ionicons name="card-outline" size={15} color={WebColors.success} />
                                        <Text style={[sv.cardTitle, { color: WebColors.success }]}>เครื่องรับบัตร (EDC)</Text>
                                      </View>
                                      <Switch value={posCardEnabled[p.id] ?? false}
                                        onValueChange={v => setPosCardEnabled(prev => ({ ...prev, [p.id]: v }))}
                                        trackColor={{ true: WebColors.success }} />
                                    </View>
                                    {(posCardEnabled[p.id] ?? false) && (
                                      <>
                                        <TextInput style={sv.input} value={posCardModel[p.id] ?? ''}
                                          onChangeText={v => setPosCardModel(prev => ({ ...prev, [p.id]: v }))}
                                          placeholder="เช่น Ingenico iCT220" placeholderTextColor={WebColors.textDisabled} />
                                        <View style={{ flexDirection: 'row', gap: 6 }}>
                                          {(['bluetooth','usb','serial'] as const).map(opt => {
                                            const cur = posCardConn[p.id] ?? 'bluetooth';
                                            return (
                                              <TouchableOpacity key={opt} style={[sv.chip, cur===opt && sv.chipActive]}
                                                onPress={() => setPosCardConn(prev => ({ ...prev, [p.id]: opt }))}>
                                                <Text style={[sv.chipText, cur===opt && { color: WebColors.white }]}>{opt}</Text>
                                              </TouchableOpacity>
                                            );
                                          })}
                                        </View>
                                      </>
                                    )}
                                  </View>
                                </ScrollView>
                              )}

                              {/* สแกนเนอร์ */}
                              {subTab === 'scanner' && (
                                <View style={{ padding: 12, gap: 12 }}>
                                  <View style={[sv.card, { gap: 8 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                      <Ionicons name="barcode-outline" size={15} color={WebColors.primary} />
                                      <Text style={sv.cardTitle}>เครื่องอ่านบาร์โค้ด</Text>
                                    </View>
                                    <Text style={sv.label}>โหมดสแกน</Text>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                      {['กล้อง (Camera)', 'USB Scanner', 'Bluetooth'].map(mode => (
                                        <View key={mode} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border }}>
                                          <Text style={{ fontSize: 11, color: Colors.text }}>{mode}</Text>
                                        </View>
                                      ))}
                                    </View>
                                    <Text style={sv.label}>รูปแบบที่รองรับ</Text>
                                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                                      {['EAN-13', 'EAN-8', 'Code 128', 'Code 39', 'QR Code', 'UPC-A'].map(fmt => (
                                        <View key={fmt} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: WebColors.successLight }}>
                                          <Text style={{ fontSize: 10, color: WebColors.success }}>{fmt}</Text>
                                        </View>
                                      ))}
                                    </View>
                                    <TouchableOpacity style={[sv.saveBtn, { alignSelf: 'flex-start', marginTop: 4 }]} onPress={() => alert('ทดสอบสแกนสำเร็จ!')}>
                                      <Text style={sv.saveBtnText}>ทดสอบสแกน</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}

                              {/* จอที่ 2 */}
                              {subTab === 'display2' && (
                                <View style={{ padding: 12, gap: 10 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Switch value={disp2En}
                                      onValueChange={v => setPosDisplay2En(prev => ({ ...prev, [p.id]: v }))}
                                      trackColor={{ true: WebColors.primary }} />
                                    <Text style={sv.label}>เปิดใช้งานจอที่ 2 (Customer Display)</Text>
                                  </View>
                                  {disp2En && (
                                    <>
                                      <View style={{ backgroundColor: WebColors.primaryLight, borderRadius: 8, padding: 10 }}>
                                        <Text style={{ fontSize: 13, color: WebColors.primary, lineHeight: 18 }}>
                                          🖥 จอที่ 2 จะแสดงรายการสินค้า ยอดชำระ และโฆษณาให้ลูกค้าเห็น{'\n'}
                                          เปิดได้จากปุ่ม "จอ 2" ในหน้าขายสินค้า
                                        </Text>
                                      </View>
                                      {/* ปุ่มไปหน้าจัดการโฆษณา */}
                                      <TouchableOpacity
                                        style={[sv.saveBtn, { flexDirection: 'row', gap: 8, justifyContent: 'center' }]}
                                        onPress={() => setPosAdSettingsId(p.id)}
                                      >
                                        <Ionicons name="images-outline" size={15} color={WebColors.white} />
                                        <Text style={sv.saveBtnText}>จัดการโฆษณาจอที่ 2</Text>
                                        <Ionicons name="chevron-forward" size={14} color={WebColors.white} />
                                      </TouchableOpacity>
                                    </>
                                  )}
                                </View>
                              )}
                              {/* ประเภทชำระ (ระดับสาขา — override บริษัท) */}
                              {subTab === 'payment' && (
                                <View style={{ padding: 12, gap: 10 }}>
                                  <View style={[sv.card, { gap: 8 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                      <Ionicons name="card-outline" size={15} color={WebColors.primary} />
                                      <Text style={sv.cardTitle}>ประเภทชำระ (สาขานี้)</Text>
                                    </View>
                                    <Text style={{ fontSize: 10, color: Colors.textSecondary }}>ถ้าไม่ตั้ง → ใช้ค่าจากระดับบริษัท (ตั้งค่า → ประเภทชำระเงิน)</Text>
                                    <View style={{ backgroundColor: WebColors.warningLight, borderRadius: 8, padding: 10, marginTop: 4 }}>
                                      <Text style={{ fontSize: 11, color: WebColors.warning }}>⚠️ สาขานี้ยังไม่ได้ตั้งค่าแยก — ใช้ค่าระดับบริษัท</Text>
                                      <Text style={{ fontSize: 10, color: WebColors.warning, marginTop: 2 }}>ไปที่ ตั้งค่า → ประเภทชำระเงิน เพื่อตั้งค่ากลาง หรือกด "ตั้งค่าแยกสาขา" เพื่อ override</Text>
                                    </View>
                                    <TouchableOpacity style={[sv.saveBtn, { alignSelf: 'flex-start', marginTop: 4 }]} onPress={() => setBranchPaymentId(b.id)}>
                                      <Text style={sv.saveBtnText}>ตั้งค่าแยกสาขานี้</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}

                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const SettingRoleScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { users, getEmployee } = useEmployeeStore();
  const ROLES: { key: string; name: string; desc: string; color: string }[] = [
    { key: 'owner', name: 'เจ้าของร้าน', desc: 'สิทธิ์เต็มทุกโมดูล', color: WebColors.purple },
    { key: 'manager', name: 'ผู้จัดการ', desc: 'ขาย คลัง รายงาน', color: WebColors.primary },
    { key: 'cashier', name: 'แคชเชียร์', desc: 'ขายสินค้าเท่านั้น', color: WebColors.success },
  ];
  return (
    <View style={sv.root}>
      <View style={sv.header}>
        <TouchableOpacity style={sv.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={WebColors.primary} /><Text style={sv.backText}>ตั้งค่า</Text>
        </TouchableOpacity>
        <Text style={sv.title}>จัดการ Role</Text>
      </View>
      <View style={{ gap: 12 }}>
        {ROLES.map(r => {
          const roleUsers = users.filter(u => u.role === r.key);
          return (
            <View key={r.key} style={sv.card}>
              <View style={[sv.listRow, { borderTopWidth: 0 }]}>
                <View style={[sv.listIcon, { backgroundColor: r.color + '20' }]}>
                  <Ionicons name="shield-outline" size={18} color={r.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={sv.listTitle}>{r.name}</Text>
                  <Text style={sv.listSub}>{r.desc}</Text>
                </View>
                <Text style={[sv.listSub, { color: r.color, fontWeight: '700' }]}>{roleUsers.length} คน</Text>
              </View>
              {roleUsers.length > 0 && (
                <View style={{ paddingLeft: 44, paddingBottom: 8, gap: 4 }}>
                  {roleUsers.map(u => {
                    const emp = getEmployee(u.employeeId);
                    const name = emp ? `${emp.personal.firstName} ${emp.personal.lastName}` : u.username;
                    return (
                      <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="person" size={12} color={r.color} />
                        <Text style={{ fontSize: 12, color: Colors.text }}>{name}</Text>
                        <Text style={{ fontSize: 10, color: Colors.textSecondary }}>({u.username})</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const SettingPermissionScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const MODULES = ['ขายสินค้า', 'จัดการสินค้า', 'คลังสินค้า', 'รายงาน', 'ผู้ใช้งาน', 'ตั้งค่า'];
  const SCREEN_GROUPS = [
    { name: 'การขาย', screens: [
      { key: 'pos', label: 'ขายสินค้า' }, { key: 'salehistory', label: 'ประวัติการขาย' },
      { key: 'payment', label: 'ชำระเงิน' }, { key: 'void_bill', label: 'ยกเลิกบิล' }, { key: 'return_bill', label: 'คืนสินค้า' },
    ]},
    { name: 'สินค้า', screens: [
      { key: 'products', label: 'รายการสินค้า' }, { key: 'product_add', label: 'เพิ่มสินค้า' },
      { key: 'product_edit', label: 'แก้ไขสินค้า' }, { key: 'pricing', label: 'กำหนดราคา' }, { key: 'inventory', label: 'คลังสินค้า' },
    ]},
    { name: 'CRM', screens: [
      { key: 'crm_members', label: 'ข้อมูลสมาชิก' }, { key: 'crm_add', label: 'เพิ่มสมาชิก' },
      { key: 'crm_history', label: 'ประวัติการซื้อ' }, { key: 'crm_points', label: 'จัดการคะแนน' },
      { key: 'crm_coupons', label: 'คูปอง/Voucher' }, { key: 'crm_campaign', label: 'Campaign' },
    ]},
    { name: 'รายงาน', screens: [
      { key: 'reports', label: 'รายงานยอดขาย' }, { key: 'report_profit', label: 'รายงานกำไร' },
      { key: 'report_product', label: 'รายงานสินค้า' },
    ]},
    { name: 'ระบบ', screens: [
      { key: 'dashboard', label: 'หน้าหลัก' }, { key: 'settings', label: 'ตั้งค่า' },
      { key: 'team', label: 'จัดการทีม' }, { key: 'auditlog', label: 'Audit Log' },
    ]},
  ];
  const [roles, setRoles] = useState(['เจ้าของ', 'ผู้จัดการ', 'แคชเชียร์']);
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [screenPerms, setScreenPerms] = useState<Record<string, boolean>>({});
  const [selectedPermRole, setSelectedPermRole] = useState('แคชเชียร์');
  const [newRole, setNewRole] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const key = (mod: string, role: string) => `${mod}_${role}`;
  const toggle = (mod: string, role: string) => {
    const k = key(mod, role);
    setPerms(prev => ({ ...prev, [k]: !(prev[k] ?? true) }));
  };
  const addRole = () => {
    if (!newRole.trim() || roles.includes(newRole.trim())) return;
    setRoles(prev => [...prev, newRole.trim()]);
    setNewRole(''); setShowAdd(false);
  };
  const removeRole = (r: string) => {
    if (!confirm(`ลบตำแหน่ง "${r}"?`)) return;
    setRoles(prev => prev.filter(x => x !== r));
  };

  return (
    <View style={sv.root}>
      <View style={sv.header}>
        <TouchableOpacity style={sv.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={WebColors.primary} /><Text style={sv.backText}>ตั้งค่า</Text>
        </TouchableOpacity>
        <Text style={sv.title}>Permission Matrix</Text>
      </View>

      {/* เพิ่มตำแหน่ง */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {showAdd ? (
          <>
            <TextInput
              style={{ borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: Colors.text, width: 160 }}
              value={newRole} onChangeText={setNewRole} placeholder="ชื่อตำแหน่ง เช่น รองผจก." placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <TouchableOpacity style={{ backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 }} onPress={addRole}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: WebColors.white }}>เพิ่ม</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>ยกเลิก</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 }} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={14} color={WebColors.white} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: WebColors.white }}>เพิ่มตำแหน่ง</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={sv.card}>
          {/* Header */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: WebColors.border, paddingBottom: 8, marginBottom: 4 }}>
            <Text style={[sv.pmCell, { fontWeight: '700', color: WebColors.text }]}>โมดูล</Text>
            {roles.map(r => (
              <View key={r} style={[sv.pmCell, { alignItems: 'center' }]}>
                <Text style={sv.pmHeader}>{r}</Text>
                {r !== 'เจ้าของ' && (
                  <TouchableOpacity onPress={() => removeRole(r)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Ionicons name="close-circle" size={14} color={WebColors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          {MODULES.map(mod => (
            <View key={mod} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: WebColors.gray100 }}>
              <Text style={[sv.pmCell, { color: WebColors.text }]}>{mod}</Text>
              {roles.map(role => {
                const allowed = perms[key(mod, role)] ?? true;
                return (
                  <TouchableOpacity key={role} style={sv.pmCell} onPress={() => toggle(mod, role)}>
                    <Ionicons name={allowed ? 'checkmark-circle' : 'close-circle'} size={22}
                      color={allowed ? WebColors.success : WebColors.danger} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Screen-Level Permissions */}
      <View style={{ marginTop: 20 }}>
        <Text style={[sv.title, { marginBottom: 8 }]}>สิทธิ์เข้าถึงหน้าจอ</Text>
        <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 12 }}>เลือก role แล้วกำหนดหน้าจอที่เข้าได้</Text>
        {/* Role selector */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {roles.map(r => (
            <TouchableOpacity key={r} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: selectedPermRole === r ? WebColors.primary : WebColors.white, borderWidth: 1, borderColor: selectedPermRole === r ? WebColors.primary : WebColors.border }} onPress={() => setSelectedPermRole(r)}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: selectedPermRole === r ? '#fff' : Colors.text }}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Screen checkboxes */}
        <View style={sv.card}>
          {SCREEN_GROUPS.map(group => (
            <View key={group.name} style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 }}>{group.name}</Text>
              {group.screens.map(screen => {
                const k = `screen_${selectedPermRole}_${screen.key}`;
                const enabled = screenPerms[k] ?? true;
                return (
                  <TouchableOpacity key={screen.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }} onPress={() => setScreenPerms(prev => ({ ...prev, [k]: !enabled }))}>
                    <Ionicons name={enabled ? 'checkbox' : 'square-outline'} size={18} color={enabled ? WebColors.success : WebColors.gray300} />
                    <Text style={{ fontSize: 13, color: Colors.text }}>{screen.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const SettingPOSScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [posName, setPosName] = useState('POS 1');
  const [posId,   setPosId]   = useState('POS-001');
  const [saved,   setSaved]   = useState(false);
  return (
    <View style={sv.root}>
      <View style={sv.header}>
        <TouchableOpacity style={sv.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={WebColors.primary} /><Text style={sv.backText}>ตั้งค่า</Text>
        </TouchableOpacity>
        <Text style={sv.title}>จัดการจุดขาย (POS)</Text>
      </View>
      <View style={sv.card}>
        <Text style={sv.cardTitle}>ข้อมูลเครื่อง POS</Text>
        <View style={sv.field}><Text style={sv.label}>ชื่อจุดขาย</Text>
          <TextInput style={sv.input} value={posName} onChangeText={setPosName} placeholderTextColor={WebColors.textDisabled} /></View>
        <View style={sv.field}><Text style={sv.label}>หมายเลขรหัสเครื่อง</Text>
          <TextInput style={sv.input} value={posId} onChangeText={setPosId} placeholderTextColor={WebColors.textDisabled} /></View>
        <TouchableOpacity style={sv.saveBtn} onPress={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          <Text style={sv.saveBtnText}>{saved ? 'บันทึกแล้ว ✓' : 'บันทึก'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SettingPrinterScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { config, setConfig } = useReceiptStore();

  // ── Print mode: PDF หรือ เครื่องพิมพ์ ────────────────────────────────────
  const [printMode,    setPrintMode]    = useState<'pdf'|'printer'>('printer');
  const [availPrinters, setAvailPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [showPrinterDrop, setShowPrinterDrop] = useState(false);

  // ── Printer ────────────────────────────────────────────────────────────────
  const [printerConn,  setPrinterConn]  = useState<'usb'|'bluetooth'|'network'>('usb');
  const [printerName,  setPrinterName]  = useState(config.shopName ? 'EPSON TM-T82' : 'EPSON TM-T82');
  const [printerIP,    setPrinterIP]    = useState('192.168.1.100');
  const [printerPort,  setPrinterPort]  = useState('9100');
  const [paperSize,    setPaperSize]    = useState<'58mm'|'80mm'|'A4'>(config.paperSize ?? '80mm');
  const [autoCut,      setAutoCut]      = useState(true);
  const [openDrawer,   setOpenDrawer]   = useState(true);
  const [copies,       setCopies]       = useState(String(config.copies ?? 1));
  const [printerStatus, setPrinterStatus] = useState<'idle'|'testing'|'ok'|'error'>('idle');

  // ── Cash Drawer ────────────────────────────────────────────────────────────
  const [drawerConn,   setDrawerConn]   = useState<'printer'|'usb'|'serial'>('printer');
  const [drawerPort,   setDrawerPort]   = useState('COM3');

  // ── Card Terminal ──────────────────────────────────────────────────────────
  const [cardConn,     setCardConn]     = useState<'bluetooth'|'usb'|'serial'>('bluetooth');
  const [cardModel,    setCardModel]    = useState('');
  const [cardPort,     setCardPort]     = useState('COM4');
  const [cardEnabled,  setCardEnabled]  = useState(false);

  const [saved, setSaved] = useState(false);

  // ── ดึงรายชื่อเครื่องพิมพ์จากเครื่อง (Web Print API) ─────────────────────
  const fetchPrinters = async () => {
    if (Platform.OS !== 'web') return;
    try {
      // window.print() ไม่ expose printer list โดยตรง
      // ใช้ navigator.printing (Chrome experiment) ถ้ามี
      const nav = navigator as any;
      if (nav.printing) {
        const list = await nav.printing.getPrinters?.();
        if (list && list.length > 0) {
          setAvailPrinters(list.map((p: any) => p.name || p.displayName));
          return;
        }
      }
      // Fallback: ใช้ about:blank window เพื่อ trigger dialog เลือก printer
      setAvailPrinters([
        'Microsoft Print to PDF',
        'Microsoft XPS Document Writer',
        printerName || 'Default Printer',
      ]);
    } catch {
      setAvailPrinters(['Microsoft Print to PDF', printerName || 'Default Printer']);
    }
  };

  React.useEffect(() => {
    if (printerConn === 'usb' && printMode === 'printer') {
      fetchPrinters();
    }
  }, [printerConn, printMode]);

  const testPrint = () => {
    setPrinterStatus('testing');
    if (Platform.OS === 'web') {
      const W = paperSize === '80mm' ? '72mm' : paperSize === '58mm' ? '50mm' : '190mm';
      const html = `<!DOCTYPE html><html><head>
        <style>
          @page { size: ${paperSize} auto; margin: 2mm; }
          body { font-family: 'TH SarabunPSK','Sarabun',monospace; font-size: 12px; width: ${W}; margin: 0 auto; }
          .center { text-align: center; } .line { border-top: 1px dashed #000; margin: 4px 0; }
          @media print { body { width: ${W}; } }
        </style></head><body>
        <p class="center"><b>TEST PRINT</b></p>
        <p class="center">เครื่องพิมพ์: ${selectedPrinter || printerName}</p>
        <p class="center">ขนาดกระดาษ: ${paperSize}</p>
        <p class="center">โหมด: ${printMode === 'pdf' ? 'PDF' : 'เครื่องพิมพ์'}</p>
        <div class="line"></div>
        <p class="center">1234567890 ABCDEFGHIJ</p>
        <div class="line"></div>
        <p class="center">พิมพ์ทดสอบสำเร็จ ✓</p>
      </body></html>`;
      const w = (window as any).open('', '_blank', 'width=420,height=300');
      if (w) {
        w.document.write(html);
        w.document.close();
        setTimeout(() => { w.print(); w.close(); }, 300);
      }
    }
    setTimeout(() => setPrinterStatus('ok'), 1200);
  };

  const handleSave = () => {
    setConfig({ paperSize, copies: parseInt(copies) || 1 });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ConnChip: React.FC<{ label: string; val: string; current: string; onPress: () => void }> = ({ label, val, current, onPress }) => (
    <TouchableOpacity style={[sv.chip, current === val && sv.chipActive]} onPress={onPress}>
      <Text style={[sv.chipText, current === val && { color: WebColors.white }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={sv.root}>
      <View style={sv.header}>
        <TouchableOpacity style={sv.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
          <Text style={sv.backText}>ตั้งค่า</Text>
        </TouchableOpacity>
        <Text style={sv.title}>ตั้งค่าอุปกรณ์ POS</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>

        {/* ── เครื่องพิมพ์ ── */}
        <View style={sv.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Ionicons name="print-outline" size={18} color={WebColors.primary} />
            <Text style={sv.cardTitle}>เครื่องพิมพ์ใบเสร็จ</Text>
          </View>

          {/* ── โหมดการพิมพ์ ── */}
          <Text style={sv.label}>โหมดการพิมพ์</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <TouchableOpacity
              style={[sv.chip, printMode === 'pdf' && sv.chipActive, { flexDirection: 'row', gap: 6 }]}
              onPress={() => setPrintMode('pdf')}
            >
              <Ionicons name="document-outline" size={14} color={printMode === 'pdf' ? WebColors.white : WebColors.textSecondary} />
              <Text style={[sv.chipText, printMode === 'pdf' && { color: WebColors.white }]}>PDF / Save as PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[sv.chip, printMode === 'printer' && sv.chipActive, { flexDirection: 'row', gap: 6 }]}
              onPress={() => setPrintMode('printer')}
            >
              <Ionicons name="print-outline" size={14} color={printMode === 'printer' ? WebColors.white : WebColors.textSecondary} />
              <Text style={[sv.chipText, printMode === 'printer' && { color: WebColors.white }]}>เครื่องพิมพ์</Text>
            </TouchableOpacity>
          </View>

          {printMode === 'pdf' && (
            <View style={{ backgroundColor: WebColors.primaryLight, borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: WebColors.primary, lineHeight: 18 }}>
                📄 เมื่อพิมพ์บิล browser จะเปิด dialog ให้เลือก{'\n'}
                → เลือก <Text style={{ fontWeight: '700' }}>"Microsoft Print to PDF"</Text> หรือ <Text style={{ fontWeight: '700' }}>"Save as PDF"</Text>{'\n'}
                → กำหนดชื่อไฟล์และที่บันทึก → กด Save
              </Text>
            </View>
          )}

          {printMode === 'printer' && (
            <>
              <Text style={sv.label}>ชื่อ / รุ่นเครื่องพิมพ์</Text>
              <TextInput style={sv.input} value={printerName} onChangeText={setPrinterName}
                placeholder="เช่น EPSON TM-T82, Star TSP100" placeholderTextColor={WebColors.textDisabled} />

              <Text style={sv.label}>การเชื่อมต่อ</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <ConnChip label="USB / Port" val="usb"       current={printerConn} onPress={() => setPrinterConn('usb')} />
                <ConnChip label="Bluetooth"  val="bluetooth" current={printerConn} onPress={() => setPrinterConn('bluetooth')} />
                <ConnChip label="Network IP" val="network"   current={printerConn} onPress={() => setPrinterConn('network')} />
              </View>

              {/* Dropdown เลือกเครื่องพิมพ์ที่เชื่อมอยู่ (USB/Port) */}
              {printerConn === 'usb' && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={sv.label}>เลือกเครื่องพิมพ์จากเครื่อง</Text>
                  <TouchableOpacity
                    style={[sv.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 }]}
                    onPress={() => { fetchPrinters(); setShowPrinterDrop(!showPrinterDrop); }}
                  >
                    <Text style={{ fontSize: 12, color: selectedPrinter ? WebColors.text : WebColors.textDisabled }}>
                      {selectedPrinter || 'กดเพื่อดูรายการเครื่องพิมพ์'}
                    </Text>
                    <Ionicons name={showPrinterDrop ? 'chevron-up' : 'chevron-down'} size={16} color={WebColors.textSecondary} />
                  </TouchableOpacity>
                  {showPrinterDrop && (
                    <View style={{ backgroundColor: WebColors.white, borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, marginTop: 2, overflow: 'hidden' as any }}>
                      {availPrinters.length === 0 ? (
                        <View style={{ padding: 12, alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, color: WebColors.textSecondary }}>กำลังค้นหา...</Text>
                        </View>
                      ) : availPrinters.map((pn, i) => (
                        <TouchableOpacity
                          key={i}
                          style={{ padding: 12, borderBottomWidth: i < availPrinters.length - 1 ? 1 : 0, borderBottomColor: WebColors.border, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: selectedPrinter === pn ? WebColors.primaryLight : WebColors.white }}
                          onPress={() => { setSelectedPrinter(pn); setPrinterName(pn); setShowPrinterDrop(false); }}
                        >
                          <Ionicons name="print-outline" size={15} color={selectedPrinter === pn ? WebColors.primary : WebColors.textSecondary} />
                          <Text style={{ fontSize: 12, color: selectedPrinter === pn ? WebColors.primary : WebColors.text, fontWeight: selectedPrinter === pn ? '700' : '400' }}>{pn}</Text>
                          {pn.toLowerCase().includes('pdf') && (
                            <View style={{ backgroundColor: WebColors.purpleLight, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 'auto' as any }}>
                              <Text style={{ fontSize: 12, color: WebColors.purple, fontWeight: '700' }}>PDF</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={{ padding: 10, alignItems: 'center', backgroundColor: WebColors.gray50 }}
                        onPress={() => { fetchPrinters(); }}
                      >
                        <Text style={{ fontSize: 13, color: WebColors.primary, fontWeight: '600' }}>🔄 รีเฟรชรายการ</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <Text style={{ fontSize: 13, color: WebColors.textSecondary, marginTop: 4 }}>
                    💡 รายการนี้มาจาก Windows Printer Dialog เลือก "Microsoft Print to PDF" เพื่อบันทึก PDF
                  </Text>
                </View>
              )}

              {printerConn === 'network' && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 2 }}>
                    <Text style={sv.label}>IP Address</Text>
                    <TextInput style={sv.input} value={printerIP} onChangeText={setPrinterIP}
                      placeholder="192.168.1.100" placeholderTextColor={WebColors.textDisabled} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sv.label}>Port</Text>
                    <TextInput style={sv.input} value={printerPort} onChangeText={setPrinterPort}
                      placeholder="9100" placeholderTextColor={WebColors.textDisabled} keyboardType="numeric" />
                  </View>
                </View>
              )}
            </>
          )}

          <Text style={sv.label}>ขนาดกระดาษ</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {(['58mm','80mm','A4'] as const).map(sz => (
              <ConnChip key={sz} label={sz} val={sz} current={paperSize} onPress={() => setPaperSize(sz)} />
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Switch value={autoCut} onValueChange={setAutoCut} trackColor={{ true: WebColors.primary }} />
              <Text style={sv.label}>ตัดกระดาษ</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Switch value={openDrawer} onValueChange={setOpenDrawer} trackColor={{ true: WebColors.primary }} />
              <Text style={sv.label}>เปิดลิ้นชัก</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={sv.label}>จำนวนสำเนา</Text>
              <TextInput style={sv.input} value={copies} onChangeText={setCopies}
                keyboardType="numeric" placeholder="1" placeholderTextColor={WebColors.textDisabled} />
            </View>
            <TouchableOpacity
              style={[sv.saveBtn, { flex: 1.5, marginTop: 22, flexDirection: 'row', gap: 6, justifyContent: 'center',
                backgroundColor: printerStatus === 'ok' ? WebColors.success : printerStatus === 'error' ? WebColors.danger : WebColors.purple }]}
              onPress={testPrint}
            >
              <Ionicons name={printerStatus === 'ok' ? 'checkmark-circle' : 'print-outline'} size={16} color={WebColors.white} />
              <Text style={sv.saveBtnText}>
                {printerStatus === 'testing' ? 'กำลังทดสอบ...' : printerStatus === 'ok' ? 'พิมพ์สำเร็จ ✓' : 'ทดสอบพิมพ์'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[sv.saveBtn, { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 4 }]} onPress={handleSave}>
            <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={15} color={WebColors.white} />
            <Text style={sv.saveBtnText}>{saved ? 'บันทึกแล้ว ✓' : 'บันทึกการตั้งค่า'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── ลิ้นชักเงิน ── */}
        <View style={sv.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Ionicons name="briefcase-outline" size={18} color={WebColors.warning} />
            <Text style={[sv.cardTitle, { color: WebColors.warning }]}>ลิ้นชักเงินสด (Cash Drawer)</Text>
          </View>

          <Text style={sv.label}>การเชื่อมต่อ</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <ConnChip label="ผ่านเครื่องพิมพ์" val="printer" current={drawerConn} onPress={() => setDrawerConn('printer')} />
            <ConnChip label="USB" val="usb" current={drawerConn} onPress={() => setDrawerConn('usb')} />
            <ConnChip label="Serial Port" val="serial" current={drawerConn} onPress={() => setDrawerConn('serial')} />
          </View>

          {drawerConn === 'serial' && (
            <>
              <Text style={sv.label}>COM Port</Text>
              <TextInput style={sv.input} value={drawerPort} onChangeText={setDrawerPort}
                placeholder="COM3" placeholderTextColor={WebColors.textDisabled} />
            </>
          )}
          {drawerConn === 'printer' && (
            <View style={{ backgroundColor: WebColors.primaryLight, borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 13, color: WebColors.primary }}>
                ลิ้นชักจะเปิดอัตโนมัติเมื่อพิมพ์ใบเสร็จ (ต้องเปิดตัวเลือก "เปิดลิ้นชักหลังพิมพ์" ด้านบน)
              </Text>
            </View>
          )}

          <TouchableOpacity style={[sv.saveBtn, { marginTop: 8, backgroundColor: WebColors.warning, flexDirection: 'row', gap: 6, justifyContent: 'center' }]}
            onPress={() => {}}>
            <Ionicons name="lock-open-outline" size={16} color={WebColors.white} />
            <Text style={sv.saveBtnText}>ทดสอบเปิดลิ้นชัก</Text>
          </TouchableOpacity>
        </View>

        {/* ── เครื่องรับบัตรเครดิต ── */}
        <View style={sv.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="card-outline" size={18} color={WebColors.success} />
              <Text style={[sv.cardTitle, { color: WebColors.success }]}>เครื่องรับบัตรเครดิต (EDC)</Text>
            </View>
            <Switch value={cardEnabled} onValueChange={setCardEnabled} trackColor={{ true: WebColors.success }} />
          </View>

          {cardEnabled && (
            <>
              <Text style={sv.label}>รุ่นเครื่อง / ธนาคาร</Text>
              <TextInput style={sv.input} value={cardModel} onChangeText={setCardModel}
                placeholder="เช่น Ingenico iCT220, Verifone VX520" placeholderTextColor={WebColors.textDisabled} />

              <Text style={sv.label}>การเชื่อมต่อ</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <ConnChip label="Bluetooth" val="bluetooth" current={cardConn} onPress={() => setCardConn('bluetooth')} />
                <ConnChip label="USB" val="usb" current={cardConn} onPress={() => setCardConn('usb')} />
                <ConnChip label="Serial Port" val="serial" current={cardConn} onPress={() => setCardConn('serial')} />
              </View>

              {(cardConn === 'usb' || cardConn === 'serial') && (
                <>
                  <Text style={sv.label}>COM Port</Text>
                  <TextInput style={sv.input} value={cardPort} onChangeText={setCardPort}
                    placeholder="COM4" placeholderTextColor={WebColors.textDisabled} />
                </>
              )}
              {cardConn === 'bluetooth' && (
                <View style={{ backgroundColor: WebColors.successLight, borderRadius: 8, padding: 10 }}>
                  <Text style={{ fontSize: 13, color: WebColors.success }}>
                    เปิด Bluetooth บนอุปกรณ์แล้วจับคู่กับ EDC terminal ก่อนใช้งาน
                  </Text>
                </View>
              )}

              <TouchableOpacity style={[sv.saveBtn, { marginTop: 8, backgroundColor: WebColors.success, flexDirection: 'row', gap: 6, justifyContent: 'center' }]}>
                <Ionicons name="wifi-outline" size={16} color={WebColors.white} />
                <Text style={sv.saveBtnText}>ทดสอบเชื่อมต่อ EDC</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── บันทึกทั้งหมด ── */}
        <TouchableOpacity
          style={[sv.saveBtn, { flexDirection: 'row', gap: 8, justifyContent: 'center' }]}
          onPress={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        >
          <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={16} color={WebColors.white} />
          <Text style={sv.saveBtnText}>{saved ? 'บันทึกแล้ว ✓' : 'บันทึกการตั้งค่า'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const SettingSecurityScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [oldPw, setOldPw]   = useState('');
  const [newPw, setNewPw]   = useState('');
  const [conf,  setConf]    = useState('');
  const [twoFA, setTwoFA]   = useState(false);
  const [saved, setSaved]   = useState(false);
  const match  = newPw === conf && newPw.length >= 6;
  return (
    <View style={sv.root}>
      <View style={sv.header}>
        <TouchableOpacity style={sv.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={WebColors.primary} /><Text style={sv.backText}>ตั้งค่า</Text>
        </TouchableOpacity>
        <Text style={sv.title}>ตั้งค่าความปลอดภัย</Text>
      </View>
      <View style={sv.card}>
        <Text style={sv.cardTitle}>เปลี่ยนรหัสผ่าน</Text>
        {[
          { label: 'รหัสผ่านเดิม',    val: oldPw, set: setOldPw },
          { label: 'รหัสผ่านใหม่',    val: newPw, set: setNewPw },
          { label: 'ยืนยันรหัสผ่าน', val: conf,  set: setConf  },
        ].map(f => (
          <View key={f.label} style={sv.field}>
            <Text style={sv.label}>{f.label}</Text>
            <TextInput style={sv.input} value={f.val} onChangeText={f.set}
              secureTextEntry placeholder="••••••" placeholderTextColor={WebColors.textDisabled} />
          </View>
        ))}
        {conf.length > 0 && !match && (
          <Text style={{ fontSize: 13, color: WebColors.danger, marginBottom: 8 }}>รหัสผ่านไม่ตรงกัน หรือสั้นกว่า 6 ตัวอักษร</Text>
        )}
        <TouchableOpacity style={[sv.saveBtn, !match && oldPw === '' && { backgroundColor: WebColors.gray300 }]}
          disabled={!match || oldPw === ''}
          onPress={() => { setSaved(true); setOldPw(''); setNewPw(''); setConf(''); setTimeout(() => setSaved(false), 2000); }}>
          <Text style={sv.saveBtnText}>{saved ? 'เปลี่ยนแล้ว ✓' : 'เปลี่ยนรหัสผ่าน'}</Text>
        </TouchableOpacity>
      </View>
      <View style={sv.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={sv.cardTitle}>Two-Factor Auth (2FA)</Text>
            <Text style={sv.listSub}>เพิ่มความปลอดภัยด้วย OTP</Text>
          </View>
          <Switch value={twoFA} onValueChange={setTwoFA} trackColor={{ true: WebColors.success, false: WebColors.border }} />
        </View>
      </View>
    </View>
  );
};

// ── Settings sub-screen styles ─────────────────────────────────────────────────
const sv = StyleSheet.create({
  root: { flex: 1, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 12, color: WebColors.primary },
  title: { flex: 1, fontSize: 14, fontWeight: '800', color: WebColors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { fontSize: 12, fontWeight: '700', color: WebColors.white },
  card: { backgroundColor: WebColors.white, borderRadius: 12, padding: 16, gap: 10, borderWidth: 1, borderColor: WebColors.border },
  cardTitle: { fontSize: 12, fontWeight: '700', color: WebColors.text, marginBottom: 4 },
  field: { gap: 4 },
  label: { fontSize: 13, fontWeight: '700', color: WebColors.textSecondary, textTransform: 'uppercase' },
  input: { borderWidth: 1.5, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 12, color: WebColors.text, backgroundColor: WebColors.gray50 },
  saveBtn: { backgroundColor: WebColors.primary, borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  saveBtnText: { fontSize: 12, fontWeight: '700', color: WebColors.white },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  listIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: WebColors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontSize: 12, fontWeight: '600', color: WebColors.text },
  listSub: { fontSize: 13, color: WebColors.textSecondary, marginTop: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 13, fontWeight: '700' },
  // Permission matrix
  pmCell: { width: 110, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  pmHeader: { fontSize: 13, fontWeight: '700', color: WebColors.primary },
  // Chips
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: WebColors.white, borderWidth: 1.5, borderColor: WebColors.border },
  chipActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  chipText: { fontSize: 12, color: WebColors.textSecondary, fontWeight: '600' },
});

// ─── SettingReceiptScreen ─────────────────────────────────────────────────────
const SettingReceiptScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { config, setConfig } = useReceiptStore();
  const setShopNameStore = useAuthStore(s => s.setShopName);
  const currentLogo      = useAuthStore(s => s.user?.shopLogo);

  // ── State (ALL hooks before any early return) ─────────────────────────────
  const [shopName,    setShopName]    = useState(config.shopName);
  const [shopAddr,    setShopAddr]    = useState(config.shopAddr);
  const [shopTel,     setShopTel]     = useState(config.shopTel);
  const [shopTaxId,   setShopTaxId]   = useState(config.shopTaxId);
  const [shopBranch,  setShopBranch]  = useState(config.shopBranch);
  const [posRegNo,    setPosRegNo]    = useState(config.posRegNo);
  const [headerText,  setHeaderText]  = useState(config.headerText);
  const [footerText,  setFooterText]  = useState(config.footerText || 'ขอบคุณที่ใช้บริการ 🙏');
  const [showLogo,    setShowLogo]    = useState(config.showLogo);
  const [logoPreview, setLogoPreview] = useState<string>(config.headerLogo || currentLogo || '');
  const [saved,       setSaved]       = useState(false);
  const fileRef = React.useRef<any>(null);

  const handleSave = () => {
    setConfig({ shopName, shopAddr, shopTel, shopTaxId, shopBranch, posRegNo, headerText, footerText, showLogo, headerLogo: logoPreview });
    setShopNameStore(shopName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const openPrintPopup = () => {
    if (Platform.OS !== 'web') return;
    const W = '72mm';
    const logoHtml = showLogo && logoPreview
      ? `<img src="${logoPreview}" style="max-width:180px;max-height:72px;display:block;margin:0 auto 4px;" />`
      : '';
    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        body { font-family:'TH SarabunPSK','Sarabun',monospace; font-size:13px; width:${W}; margin:0 auto; }
        .c { text-align:center; } .bold { font-weight:700; } .italic { font-style:italic; }
        .dash { border-top:1px dashed #000; margin:5px 0; }
        .row { display:flex; justify-content:space-between; }
        @media print { body { width:${W}; } }
      </style></head><body>
      ${logoHtml}
      <p class="c bold">${shopName}</p>
      <p class="c" style="font-size:11px">${shopAddr}</p>
      <p class="c" style="font-size:11px">โทร: ${shopTel}</p>
      ${headerText ? `<p class="c italic" style="font-size:11px">${headerText}</p>` : ''}
      <div class="dash"></div>
      <div class="row"><span>ใบเสร็จรับเงิน</span><span>#20001</span></div>
      <div class="row"><span style="font-size:11px">วันที่: ${new Date().toLocaleDateString('th-TH')}</span><span style="font-size:11px">ภาษี: ${shopTaxId}</span></div>
      <div class="dash"></div>
      <div class="row"><span>น้ำดื่ม 600ml x2</span><span>฿20.00</span></div>
      <div class="row"><span>ขนมปัง x1</span><span>฿25.00</span></div>
      <div class="row"><span>กาแฟ x1</span><span>฿45.00</span></div>
      <div class="dash"></div>
      <div class="row bold"><span>รวมทั้งสิ้น</span><span>฿90.00</span></div>
      <div class="row" style="font-size:11px"><span>รับเงิน</span><span>฿100.00</span></div>
      <div class="row" style="font-size:11px"><span>เงินทอน</span><span>฿10.00</span></div>
      <div class="dash"></div>
      <p class="c" style="font-size:12px">${footerText}</p>
      <p class="c" style="font-size:10px">สาขา: ${shopBranch} | เครื่อง: ${posRegNo}</p>
    </body></html>`;
    const w = (window as any).open('', '_blank', 'width=420,height=600');
    if (!w) { alert('⚠️ กรุณาอนุญาต popup แล้วลองใหม่'); return; }
    w.document.write(html);
    w.document.close();
  };

  // ── Mock items for preview ────────────────────────────────────────────────
  const mockItems = [
    { name: 'น้ำดื่ม 600ml', qty: 2, price: 20 },
    { name: 'ขนมปัง',        qty: 1, price: 25 },
    { name: 'กาแฟ',          qty: 1, price: 45 },
  ];
  const total = mockItems.reduce((s, i) => s + i.price, 0);

  return (
    <View style={sv.root}>
      {/* Header */}
      <View style={sv.header}>
        <TouchableOpacity style={sv.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
          <Text style={sv.backText}>ตั้งค่า</Text>
        </TouchableOpacity>
        <Text style={sv.title}>ตั้งค่าบิล / ใบเสร็จ</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, padding: 4 }}>

        {/* Section 1: หัวบิล */}
        <View style={sv.card}>
          <Text style={sv.cardTitle}>🖼 หัวบิล</Text>

          {/* Logo preview */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 200, height: 80, borderRadius: 12, borderWidth: 1.5, borderColor: WebColors.border, backgroundColor: WebColors.gray50, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' as any }}>
              {logoPreview ? (
                <Image source={{ uri: logoPreview }} style={{ width: 200, height: 80 }} resizeMode="contain" />
              ) : (
                <Ionicons name="image-outline" size={32} color={WebColors.textDisabled} />
              )}
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={{ fontSize: 13, color: WebColors.textSecondary, lineHeight: 18 }}>
                รูปโลโก้บนหัวบิล{'\n'}แนะนำขนาด 400×160px (PNG/JPG)
              </Text>
              {Platform.OS === 'web' && (
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    setLogoPreview(url);
                    e.target.value = '';
                  }}
                />
              )}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[sv.saveBtn, { flex: 1, backgroundColor: WebColors.primary }]}
                  onPress={() => (fileRef.current as HTMLInputElement)?.click()}
                >
                  <Ionicons name="cloud-upload-outline" size={15} color={WebColors.white} />
                  <Text style={sv.saveBtnText}>อัปโหลด</Text>
                </TouchableOpacity>
                {logoPreview ? (
                  <TouchableOpacity
                    style={[sv.saveBtn, { backgroundColor: WebColors.danger }]}
                    onPress={() => setLogoPreview('')}
                  >
                    <Ionicons name="trash-outline" size={15} color={WebColors.white} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>

          {/* Toggle showLogo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={sv.label}>แสดงโลโก้บนบิล</Text>
            <Switch value={showLogo} onValueChange={setShowLogo} trackColor={{ true: WebColors.success, false: WebColors.border }} />
          </View>
        </View>

        {/* Section 2: ข้อมูลร้าน */}
        <View style={sv.card}>
          <Text style={sv.cardTitle}>🏪 ข้อมูลร้าน</Text>
          {([
            { label: 'ชื่อร้าน',                    val: shopName,   set: setShopName   },
            { label: 'ที่อยู่',                       val: shopAddr,   set: setShopAddr   },
            { label: 'เบอร์โทร',                      val: shopTel,    set: setShopTel    },
            { label: 'เลขประจำตัวผู้เสียภาษี',        val: shopTaxId,  set: setShopTaxId  },
            { label: 'สาขา',                          val: shopBranch, set: setShopBranch },
            { label: 'หมายเลขรหัสเครื่อง (POS Reg)', val: posRegNo,   set: setPosRegNo   },
          ] as { label: string; val: string; set: (v: string) => void }[]).map(f => (
            <View key={f.label} style={sv.field}>
              <Text style={sv.label}>{f.label}</Text>
              <TextInput style={sv.input} value={f.val} onChangeText={f.set} placeholderTextColor={WebColors.textDisabled} />
            </View>
          ))}
        </View>

        {/* Section 3: ข้อความบิล */}
        <View style={sv.card}>
          <Text style={sv.cardTitle}>📝 ข้อความบิล</Text>
          <View style={sv.field}>
            <Text style={sv.label}>ข้อความหัวบิล (สโลแกน / ข้อความเพิ่มเติม)</Text>
            <TextInput
              style={[sv.input, { height: 72, textAlignVertical: 'top', paddingTop: 10 }]}
              value={headerText}
              onChangeText={setHeaderText}
              multiline
              placeholder="เช่น ยินดีต้อนรับ / We love our customers"
              placeholderTextColor={WebColors.textDisabled}
            />
          </View>
          <View style={sv.field}>
            <Text style={sv.label}>ข้อความท้ายบิล</Text>
            <TextInput
              style={[sv.input, { height: 72, textAlignVertical: 'top', paddingTop: 10 }]}
              value={footerText}
              onChangeText={setFooterText}
              multiline
              placeholder="ขอบคุณที่ใช้บริการ 🙏"
              placeholderTextColor={WebColors.textDisabled}
            />
          </View>
        </View>

        {/* Section 4: ตัวอย่างบิล (Preview) */}
        <View style={sv.card}>
          <Text style={sv.cardTitle}>🧾 ตัวอย่างบิล (Preview — 80mm)</Text>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 280, backgroundColor: WebColors.white, borderWidth: 1, borderColor: WebColors.gray300, borderRadius: 8, padding: 12, gap: 2 }}>
              {/* Logo */}
              {showLogo && logoPreview ? (
                <View style={{ alignItems: 'center', marginBottom: 4 }}>
                  <Image source={{ uri: logoPreview }} style={{ width: 200, height: 80 }} resizeMode="contain" />
                </View>
              ) : null}
              {/* Shop name */}
              <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 12 }}>{shopName || 'ชื่อร้าน'}</Text>
              {/* Address */}
              {shopAddr ? <Text style={{ textAlign: 'center', fontSize: 13, color: WebColors.textSecondary }}>{shopAddr}</Text> : null}
              {/* Tel */}
              {shopTel ? <Text style={{ textAlign: 'center', fontSize: 13, color: WebColors.textSecondary }}>โทร: {shopTel}</Text> : null}
              {/* Header text */}
              {headerText ? <Text style={{ textAlign: 'center', fontSize: 13, fontStyle: 'italic', color: WebColors.textSecondary }}>{headerText}</Text> : null}
              {/* Dashed line */}
              <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: WebColors.textSecondary, marginVertical: 4 }} />
              {/* Bill info */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13 }}>ใบเสร็จ #20001</Text>
                <Text style={{ fontSize: 13 }}>{new Date().toLocaleDateString('th-TH')}</Text>
              </View>
              {/* Dashed line */}
              <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: WebColors.textSecondary, marginVertical: 4 }} />
              {/* Items */}
              {mockItems.map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, flex: 1 }}>{item.name} x{item.qty}</Text>
                  <Text style={{ fontSize: 13 }}>฿{item.price.toFixed(2)}</Text>
                </View>
              ))}
              {/* Dashed line */}
              <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: WebColors.textSecondary, marginVertical: 4 }} />
              {/* Totals */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, fontWeight: '700' }}>รวมทั้งสิ้น</Text>
                <Text style={{ fontSize: 12, fontWeight: '700' }}>฿{total.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: WebColors.textSecondary }}>รับเงิน</Text>
                <Text style={{ fontSize: 13 }}>฿100.00</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: WebColors.textSecondary }}>เงินทอน</Text>
                <Text style={{ fontSize: 13 }}>฿{(100 - total).toFixed(2)}</Text>
              </View>
              {/* Dashed line */}
              <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: WebColors.textSecondary, marginVertical: 4 }} />
              {/* Footer */}
              <Text style={{ textAlign: 'center', fontSize: 13, color: WebColors.grayDark }}>{footerText}</Text>
              {(shopBranch || posRegNo) ? (
                <Text style={{ textAlign: 'center', fontSize: 12, color: WebColors.textSecondary }}>
                  {shopBranch}{shopBranch && posRegNo ? ' | ' : ''}{posRegNo}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Section 5: ถ่ายภาพบิล */}
        <View style={sv.card}>
          <Text style={sv.cardTitle}>📸 ถ่ายภาพบิล</Text>
          <View style={{ backgroundColor: WebColors.primaryLight, borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: WebColors.primary, lineHeight: 18 }}>
              💡 กด <Text style={{ fontWeight: '700' }}>"ถ่ายภาพ / Capture"</Text> เพื่อเปิดหน้าต่างแสดงบิล{'\n'}
              จากนั้นกด <Text style={{ fontWeight: '700' }}>Ctrl+P</Text> แล้วเลือก{' '}
              <Text style={{ fontWeight: '700' }}>Save as PDF</Text> หรือถ่ายหน้าจอ
            </Text>
          </View>
          <TouchableOpacity
            style={[sv.saveBtn, { backgroundColor: WebColors.purple, flexDirection: 'row', gap: 8, justifyContent: 'center' }]}
            onPress={openPrintPopup}
          >
            <Ionicons name="camera-outline" size={16} color={WebColors.white} />
            <Text style={sv.saveBtnText}>ถ่ายภาพ / Capture</Text>
          </TouchableOpacity>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[sv.saveBtn, { flexDirection: 'row', gap: 8, justifyContent: 'center' }]}
          onPress={handleSave}
        >
          <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={16} color={WebColors.white} />
          <Text style={sv.saveBtnText}>{saved ? 'บันทึกแล้ว ✓' : 'บันทึกการตั้งค่าบิล'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

// ─── Setting: Printer ──────────────────────────────────────────────────────────
const SettingPrinterSection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [printMode, setPrintMode] = useState<'pdf' | 'device'>('device');
  const [connType, setConnType] = useState<'usb' | 'bluetooth' | 'network'>('usb');
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm' | 'a4'>('80mm');

  return (
    <View style={g.root}>
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
        <Text style={{ fontSize: 12, color: WebColors.primary, fontWeight: '600' }}>ตั้งค่า</Text>
      </TouchableOpacity>
      <Text style={g.pageTitle}>เครื่องพิมพ์</Text>
      <Text style={g.pageSub}>ตั้งค่าเครื่องพิมพ์ใบเสร็จ & ลิ้นชักเงินสด</Text>

      <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: WebColors.border, marginTop: 16, gap: 20 }}>
        {/* โหมดการพิมพ์ */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 }}>โหมดการพิมพ์</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[{ k: 'pdf', l: 'PDF' }, { k: 'device', l: 'เครื่องพิมพ์' }].map(o => (
              <TouchableOpacity key={o.k} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: printMode === o.k ? WebColors.primary : Colors.border }} onPress={() => setPrintMode(o.k as any)}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: printMode === o.k ? WebColors.white : Colors.textSecondary }}>{o.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* การเชื่อมต่อ */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 }}>การเชื่อมต่อ</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[{ k: 'usb', l: 'USB/Port' }, { k: 'bluetooth', l: 'Bluetooth' }, { k: 'network', l: 'Network IP' }].map(o => (
              <TouchableOpacity key={o.k} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: connType === o.k ? WebColors.primary : Colors.border }} onPress={() => setConnType(o.k as any)}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: connType === o.k ? WebColors.white : Colors.textSecondary }}>{o.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ขนาดกระดาษ */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 }}>ขนาดกระดาษ</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['58mm', '80mm', 'a4'].map(sz => (
              <TouchableOpacity key={sz} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: paperSize === sz ? WebColors.primary : Colors.border }} onPress={() => setPaperSize(sz as any)}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: paperSize === sz ? WebColors.white : Colors.textSecondary }}>{sz === 'a4' ? 'A4' : sz}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ทดสอบ */}
        <TouchableOpacity style={[g.primaryBtn, { alignSelf: 'flex-start' }]} onPress={() => alert('ทดสอบพิมพ์สำเร็จ!')}>
          <Ionicons name="print" size={16} color={WebColors.white} />
          <Text style={g.primaryBtnText}>ทดสอบพิมพ์</Text>
        </TouchableOpacity>
      </View>

      {/* ลิ้นชักเงินสด */}
      <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: WebColors.border, marginTop: 12, gap: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.text }}>ลิ้นชักเงินสด</Text>
        <Text style={{ fontSize: 13, color: Colors.textSecondary }}>เปิดลิ้นชักอัตโนมัติเมื่อชำระด้วยเงินสด</Text>
        <TouchableOpacity style={[g.primaryBtn, { alignSelf: 'flex-start', backgroundColor: WebColors.warning }]} onPress={() => alert('เปิดลิ้นชัก!')}>
          <Ionicons name="lock-open" size={16} color={WebColors.white} />
          <Text style={g.primaryBtnText}>ทดสอบเปิดลิ้นชัก</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Setting: Scanner ─────────────────────────────────────────────────────────
const SettingScannerSection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [scanMode, setScanMode] = useState<'camera' | 'usb' | 'bluetooth'>('camera');

  return (
    <View style={g.root}>
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
        <Text style={{ fontSize: 12, color: WebColors.primary, fontWeight: '600' }}>ตั้งค่า</Text>
      </TouchableOpacity>
      <Text style={g.pageTitle}>สแกนเนอร์</Text>
      <Text style={g.pageSub}>ตั้งค่าเครื่องอ่านบาร์โค้ด / QR Code</Text>

      <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: WebColors.border, marginTop: 16, gap: 20 }}>
        {/* โหมดสแกน */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 }}>โหมดสแกน</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[{ k: 'camera', l: 'กล้อง (Camera)' }, { k: 'usb', l: 'USB Scanner' }, { k: 'bluetooth', l: 'Bluetooth' }].map(o => (
              <TouchableOpacity key={o.k} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: scanMode === o.k ? WebColors.primary : Colors.border }} onPress={() => setScanMode(o.k as any)}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: scanMode === o.k ? WebColors.white : Colors.textSecondary }}>{o.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* รองรับ */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 }}>รูปแบบที่รองรับ</Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {['EAN-13', 'EAN-8', 'Code 128', 'Code 39', 'QR Code', 'UPC-A'].map(fmt => (
              <View key={fmt} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: WebColors.successLight }}>
                <Text style={{ fontSize: 13, color: WebColors.success, fontWeight: '500' }}>{fmt}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={[g.primaryBtn, { alignSelf: 'flex-start' }]} onPress={() => alert('ทดสอบสแกนสำเร็จ!')}>
          <Ionicons name="barcode" size={16} color={WebColors.white} />
          <Text style={g.primaryBtnText}>ทดสอบสแกน</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Setting: Payment Types ───────────────────────────────────────────────────
const SettingPaymentSection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [methods, setMethods] = useState([
    { id: 'cash', label: 'เงินสด', icon: 'cash', color: WebColors.success, enabled: true },
    { id: 'qr', label: 'QR Code / PromptPay', icon: 'qr-code', color: WebColors.purple, enabled: true },
    { id: 'transfer', label: 'โอนเงิน (Transfer)', icon: 'swap-horizontal', color: WebColors.info, enabled: true },
    { id: 'credit', label: 'บัตรเครดิต / เดบิต', icon: 'card', color: WebColors.warning, enabled: true },
    { id: 'wallet', label: 'E-Wallet (Line Pay, TrueMoney)', icon: 'wallet', color: WebColors.primary, enabled: false },
    { id: 'coupon', label: 'คูปอง / Voucher', icon: 'pricetag', color: WebColors.danger, enabled: false },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('cash-outline');
  const [newColor, setNewColor] = useState<string>(WebColors.textSecondary);

  const toggle = (id: string) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const newMethod = {
      id: `custom_${Date.now()}`,
      label: newLabel.trim(),
      icon: newIcon,
      color: newColor,
      enabled: true,
    };
    setMethods(prev => [...prev, newMethod]);
    setNewLabel(''); setNewIcon('cash-outline'); setNewColor(WebColors.textSecondary);
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setMethods(prev => prev.filter(m => m.id !== id));
  };

  return (
    <View style={g.root}>
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
        <Text style={{ fontSize: 12, color: WebColors.primary, fontWeight: '600' }}>ตั้งค่า</Text>
      </TouchableOpacity>
      <Text style={g.pageTitle}>ประเภทชำระเงิน</Text>
      <Text style={g.pageSub}>เปิด/ปิดช่องทางชำระเงินที่แสดงในหน้า POS</Text>

      <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border, marginTop: 16, gap: 4 }}>
        {methods.map((m, i) => (
          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: i < methods.length - 1 ? 1 : 0, borderBottomColor: Colors.border, gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: m.color + '18', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={m.icon as any} size={20} color={m.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text }}>{m.label}</Text>
            </View>
            {m.id.startsWith('custom_') && (
              <TouchableOpacity onPress={() => handleDelete(m.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={16} color={WebColors.danger} />
              </TouchableOpacity>
            )}
            <Switch value={m.enabled} onValueChange={() => toggle(m.id)} trackColor={{ true: WebColors.primary, false: Colors.border }} />
          </View>
        ))}
      </View>

      {/* เพิ่มประเภทชำระใหม่ */}
      {showAddForm ? (
        <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.primary, marginTop: 12, gap: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>เพิ่มประเภทชำระใหม่</Text>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 }}>ชื่อประเภท *</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: Colors.text }}
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="เช่น เครดิตร้าน, สแกนจ่าย, ฯลฯ"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 }}>ไอคอน</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {[
                { icon: 'cash-outline', label: 'เงินสด' },
                { icon: 'card-outline', label: 'บัตร' },
                { icon: 'qr-code-outline', label: 'QR' },
                { icon: 'wallet-outline', label: 'Wallet' },
                { icon: 'phone-portrait-outline', label: 'มือถือ' },
                { icon: 'globe-outline', label: 'ออนไลน์' },
                { icon: 'storefront-outline', label: 'เครดิตร้าน' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.icon}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: newIcon === opt.icon ? WebColors.primary : Colors.border, backgroundColor: newIcon === opt.icon ? WebColors.primaryLight : WebColors.white }}
                  onPress={() => setNewIcon(opt.icon)}
                >
                  <Ionicons name={opt.icon as any} size={16} color={newIcon === opt.icon ? WebColors.primary : Colors.textSecondary} />
                  <Text style={{ fontSize: 10, color: newIcon === opt.icon ? WebColors.primary : Colors.textSecondary }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 }}>สี</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[WebColors.success, WebColors.purple, WebColors.info, WebColors.warning, WebColors.primary, WebColors.danger, WebColors.textSecondary, WebColors.success].map(c => (
                <TouchableOpacity
                  key={c}
                  style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: newColor === c ? 3 : 0, borderColor: WebColors.white, shadowColor: WebColors.text, shadowOpacity: newColor === c ? 0.3 : 0, shadowRadius: 4, elevation: newColor === c ? 4 : 0 }}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.border }} onPress={() => setShowAddForm(false)}>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={g.primaryBtn} onPress={handleAdd}>
              <Ionicons name="add" size={16} color={WebColors.white} />
              <Text style={g.primaryBtnText}>เพิ่มประเภท</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={[g.primaryBtn, { alignSelf: 'flex-start', marginTop: 12 }]} onPress={() => setShowAddForm(true)}>
          <Ionicons name="add-circle" size={16} color={WebColors.white} />
          <Text style={g.primaryBtnText}>เพิ่มประเภทชำระใหม่</Text>
        </TouchableOpacity>
      )}

      <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border, marginTop: 12, gap: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text }}>เชื่อมต่อ Payment Gateway</Text>
        <Text style={{ fontSize: 13, color: Colors.textSecondary }}>เชื่อม QR PromptPay / EDC / E-Wallet กับ payment provider</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {['PromptPay QR', '2C2P', 'KBank PGW', 'SCB Easy'].map(gw => (
            <View key={gw} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.border, borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{gw}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── Setting: Display (จอ 2) ──────────────────────────────────────────────────
const SettingDisplaySection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [showAds, setShowAds] = useState(true);

  return (
    <View style={g.root}>
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
        <Text style={{ fontSize: 12, color: WebColors.primary, fontWeight: '600' }}>ตั้งค่า</Text>
      </TouchableOpacity>
      <Text style={g.pageTitle}>จอที่ 2 (Customer Display)</Text>
      <Text style={g.pageSub}>ตั้งค่าจอแสดงผลฝั่งลูกค้า</Text>

      <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: WebColors.border, marginTop: 16, gap: 20 }}>
        {/* แสดงโฆษณา */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.text }}>แสดงโฆษณาเมื่อว่าง</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary }}>หมุนรูปโปรโมชั่นเมื่อไม่มีรายการขาย</Text>
          </View>
          <Switch value={showAds} onValueChange={setShowAds} trackColor={{ true: WebColors.primary, false: Colors.border }} />
        </View>

        {/* ข้อมูลที่แสดง */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 }}>ข้อมูลที่แสดงขณะขาย</Text>
          <View style={{ gap: 6 }}>
            {['รายการสินค้าที่สแกน', 'ยอดรวม / ส่วนลด / VAT', 'โลโก้ร้าน', 'QR Code ชำระเงิน'].map(item => (
              <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkmark-circle" size={16} color={WebColors.primary} />
                <Text style={{ fontSize: 13, color: Colors.text }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={[g.primaryBtn, { alignSelf: 'flex-start' }]} onPress={() => alert('เปิดหน้าจอ Customer Display')}>
          <Ionicons name="tv" size={16} color={WebColors.white} />
          <Text style={g.primaryBtnText}>ทดสอบจอที่ 2</Text>
        </TouchableOpacity>
      </View>

      {/* ── Preview ตัวอย่างจอ Customer Display ── */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 10 }}>ตัวอย่างหน้าจอ Customer Display</Text>
        <View style={{ backgroundColor: WebColors.grayDark, borderRadius: 12, padding: 24, borderWidth: 2, borderColor: WebColors.info, overflow: 'hidden' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: WebColors.white }}>ร้านสะดวกซื้อ ABC</Text>
              <Text style={{ fontSize: 12, color: WebColors.info }}>สาขาหลัก · POS 1</Text>
            </View>
            <View style={{ backgroundColor: WebColors.info, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: WebColors.white }}>ยินดีต้อนรับ</Text>
            </View>
          </View>

          {/* รายการสินค้าตัวอย่าง */}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)' }}>
              <Text style={{ flex: 2, fontSize: 12, fontWeight: '600', color: WebColors.info }}>สินค้า</Text>
              <Text style={{ width: 40, fontSize: 12, fontWeight: '600', color: WebColors.info, textAlign: 'center' }}>จำนวน</Text>
              <Text style={{ width: 70, fontSize: 12, fontWeight: '600', color: WebColors.info, textAlign: 'right' }}>ราคา</Text>
            </View>
            {[
              { name: 'น้ำดื่มสิงห์ 600ml', qty: 3, price: 30 },
              { name: 'ขนมปังกรอบ 7-11', qty: 2, price: 50 },
              { name: 'มาม่า หมูสับ', qty: 5, price: 35 },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                <Text style={{ flex: 2, fontSize: 13, color: WebColors.white }}>{item.name}</Text>
                <Text style={{ width: 40, fontSize: 13, color: WebColors.white, textAlign: 'center' }}>{item.qty}</Text>
                <Text style={{ width: 70, fontSize: 13, color: WebColors.white, textAlign: 'right' }}>฿{item.price}</Text>
              </View>
            ))}
          </View>

          {/* ยอดรวม */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' }}>
            <Text style={{ fontSize: 13, color: WebColors.info }}>ยอดรวมสุทธิ</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: WebColors.info }}>฿115.00</Text>
          </View>

          {/* QR Code placeholder */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
            <View style={{ width: 80, height: 80, backgroundColor: WebColors.white, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="qr-code" size={50} color={WebColors.grayDark} />
            </View>
          </View>
          <Text style={{ textAlign: 'center', fontSize: 12, color: WebColors.info, marginTop: 6 }}>สแกนชำระเงิน</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Test Tracker Inline (within Settings) ────────────────────────────────────
const WebTestTrackerScreenInline: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <View style={g.root}>
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }} onPress={onBack}>
      <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
      <Text style={{ fontSize: 12, color: WebColors.primary, fontWeight: '600' }}>ตั้งค่า</Text>
    </TouchableOpacity>
    <WebTestTrackerScreen />
  </View>
);

// ─── Simple Sub Page (placeholder for settings sub-screens) ───────────────────
const SimpleSubPage: React.FC<{ title: string; sub: string; onBack: () => void }> = ({ title, sub, onBack }) => (
  <View style={g.root}>
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }} onPress={onBack}>
      <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
      <Text style={{ fontSize: 12, color: WebColors.primary, fontWeight: '600' }}>ตั้งค่า</Text>
    </TouchableOpacity>
    <Text style={g.pageTitle}>{title}</Text>
    <Text style={g.pageSub}>{sub}</Text>
    <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: Colors.border, marginTop: 16 }}>
      <Text style={{ fontSize: 12, color: Colors.textSecondary }}>หน้านี้อยู่ระหว่างพัฒนา — ข้อมูลจะแสดงเมื่อเชื่อมต่อ Backend แล้ว</Text>
    </View>
  </View>
);

// ─── Setting: POS Permission ──────────────────────────────────────────────────
const SettingPOSPermissionScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const {
    users, companyConfig, branchConfigs,
    addUser, updateUser, deleteUser, generatePin,
    setCompanyConfig, setBranchConfig,
  } = usePOSPermissionStore();

  const { users: sysUsers, employees, getEmployee } = useEmployeeStore();

  const ALL_ACTIONS: POSAction[] = ['void_bill', 'cancel_hold', 'change_price', 'reprint'];
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPerms, setNewPerms] = useState<POSAction[]>([]);

  const companyEnabled = companyConfig?.enabled ?? false;
  const companyActions = companyConfig?.requiredActions ?? ALL_ACTIONS;
  const BRANCHES = [{ id: 'b1', name: 'สาขาหลัก' }, { id: 'b2', name: 'สาขา 1' }];

  // Users ที่ยังไม่ได้เพิ่มเข้า POS
  const availableUsers = sysUsers.filter(su => !users.some(pu => pu.name.includes(su.username) || pu.name.includes(getEmployee(su.employeeId)?.personal.firstName ?? '__')));

  const toggleCompany = () => setCompanyConfig(companyConfig ? { ...companyConfig, enabled: !companyConfig.enabled } : { enabled: true, requiredActions: ALL_ACTIONS });
  const toggleAction = (a: POSAction) => {
    const cur = companyConfig?.requiredActions ?? ALL_ACTIONS;
    setCompanyConfig({ enabled: true, requiredActions: cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a] });
  };
  const toggleBranch = (id: string) => {
    const c = branchConfigs[id];
    setBranchConfig(id, c ? { ...c, enabled: !c.enabled } : { enabled: true, requiredActions: ALL_ACTIONS });
  };
  const handleAdd = () => {
    if (!selectedUserId) return;
    const su = sysUsers.find(u => u.id === selectedUserId);
    if (!su) return;
    const emp = getEmployee(su.employeeId);
    const name = emp ? `${emp.personal.firstName} ${emp.personal.lastName}` : su.username;
    addUser({ name, pin: generatePin(), role: su.role, permissions: newPerms });
    setSelectedUserId(''); setNewPerms([]); setShowAddForm(false);
  };
  const togglePerm = (uid: string, a: POSAction) => {
    const u = users.find(x => x.id === uid);
    if (!u) return;
    updateUser(uid, { permissions: u.permissions.includes(a) ? u.permissions.filter(x => x !== a) : [...u.permissions, a] });
  };

  return (
    <View style={g.root}>
      <TouchableOpacity style={pp.backRow} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
        <Text style={pp.backText}>ตั้งค่า</Text>
      </TouchableOpacity>
      <Text style={g.pageTitle}>Permission POS</Text>
      <Text style={g.pageSub}>จัดการสิทธิ์ POS + PIN 4 หลัก</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>

        {/* ── Toggle ระบบ ── */}
        <View style={pp.card}>
          <View style={pp.row}>
            <View style={{ flex: 1 }}>
              <Text style={pp.cardTitle}>เปิดใช้ระบบ Permission (ระดับบริษัท)</Text>
              <Text style={pp.hint}>เมื่อเปิด ต้องใส่ PIN ก่อนทำรายการที่กำหนด</Text>
            </View>
            <Switch value={companyEnabled} onValueChange={toggleCompany} trackColor={{ true: WebColors.primary, false: Colors.border }} />
          </View>

          {companyEnabled && (
            <View style={pp.chipRow}>
              {ALL_ACTIONS.map(a => {
                const on = companyActions.includes(a);
                return (
                  <TouchableOpacity key={a} style={[pp.chip, on && pp.chipOn]} onPress={() => toggleAction(a)}>
                    <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={on ? WebColors.primary : Colors.textSecondary} />
                    <Text style={[pp.chipText, on && pp.chipTextOn]}>{POS_ACTION_LABELS[a]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Branch overrides */}
          <View style={pp.divider} />
          <Text style={pp.subTitle}>Override ระดับสาขา</Text>
          {BRANCHES.map(b => {
            const cfg = branchConfigs[b.id];
            return (
              <View key={b.id} style={pp.branchRow}>
                <Text style={pp.branchName}>{b.name}</Text>
                <Text style={pp.branchStatus}>{cfg ? (cfg.enabled ? 'เปิด' : 'ปิด') : 'ใช้ค่าบริษัท'}</Text>
                <Switch value={cfg?.enabled ?? false} onValueChange={() => toggleBranch(b.id)} trackColor={{ true: WebColors.purple, false: Colors.border }} />
              </View>
            );
          })}
        </View>

        {/* ── รายชื่อ User ── */}
        <View style={pp.card}>
          <View style={pp.row}>
            <Text style={pp.cardTitle}>ผู้ใช้งาน POS ({users.length})</Text>
            <TouchableOpacity style={g.primaryBtn} onPress={() => setShowAddForm(!showAddForm)}>
              <Ionicons name="add" size={14} color={WebColors.white} />
              <Text style={g.primaryBtnText}>เพิ่ม</Text>
            </TouchableOpacity>
          </View>

          {showAddForm && (
            <View style={pp.addForm}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 }}>เลือกผู้ใช้งาน</Text>
              <ScrollView style={{ maxHeight: 120 }} nestedScrollEnabled>
                {availableUsers.length === 0 && <Text style={{ fontSize: 11, color: Colors.textMuted, padding: 8 }}>ผู้ใช้ทั้งหมดเพิ่มใน POS แล้ว</Text>}
                {availableUsers.map(su => {
                  const emp = getEmployee(su.employeeId);
                  const label = emp ? `${emp.personal.firstName} ${emp.personal.lastName}` : su.username;
                  const selected = selectedUserId === su.id;
                  return (
                    <TouchableOpacity key={su.id} style={[pp.chip, { marginBottom: 4 }, selected && pp.chipOn]} onPress={() => setSelectedUserId(su.id)}>
                      <Ionicons name={selected ? 'checkmark-circle' : 'person-outline'} size={13} color={selected ? WebColors.primary : Colors.textSecondary} />
                      <Text style={[pp.chipText, selected && pp.chipTextOn]}>{label} ({su.role})</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={pp.chipRow}>
                {ALL_ACTIONS.map(a => {
                  const on = newPerms.includes(a);
                  return (
                    <TouchableOpacity key={a} style={[pp.chip, on && pp.chipOn]} onPress={() => setNewPerms(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a])}>
                      <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={12} color={on ? WebColors.primary : Colors.textSecondary} />
                      <Text style={[pp.chipText, on && pp.chipTextOn]}>{POS_ACTION_LABELS[a]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={g.primaryBtn} onPress={handleAdd}><Text style={g.primaryBtnText}>เพิ่ม</Text></TouchableOpacity>
                <TouchableOpacity style={pp.cancelBtn} onPress={() => setShowAddForm(false)}><Text style={pp.cancelText}>ยกเลิก</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {/* User cards */}
          {users.map(u => (
            <View key={u.id} style={pp.userCard}>
              <View style={pp.row}>
                <View style={{ flex: 1 }}>
                  <Text style={pp.userName}>{u.name}</Text>
                  <Text style={pp.userRole}>{u.role === 'owner' ? 'เจ้าของ' : u.role === 'manager' ? 'ผู้จัดการ' : 'แคชเชียร์'}</Text>
                </View>
                <View style={pp.pinBox}>
                  <Text style={pp.pinLabel}>PIN</Text>
                  <Text style={pp.pinValue}>{u.pin}</Text>
                </View>
                <TouchableOpacity style={pp.iconBtn} onPress={() => updateUser(u.id, { pin: generatePin() })}>
                  <Ionicons name="refresh" size={16} color={WebColors.warning} />
                </TouchableOpacity>
                <TouchableOpacity style={pp.iconBtn} onPress={() => { if (confirm(`ลบ "${u.name}"?`)) deleteUser(u.id); }}>
                  <Ionicons name="trash-outline" size={16} color={WebColors.danger} />
                </TouchableOpacity>
              </View>
              <View style={pp.chipRow}>
                {ALL_ACTIONS.map(a => {
                  const on = u.permissions.includes(a);
                  return (
                    <TouchableOpacity key={a} style={[pp.permChip, on ? pp.permOn : pp.permOff]} onPress={() => togglePerm(u.id, a)}>
                      <Ionicons name={on ? 'checkmark' : 'close'} size={11} color={on ? WebColors.success : WebColors.danger} />
                      <Text style={{ fontSize: 10, color: on ? WebColors.success : WebColors.danger }}>{POS_ACTION_LABELS[a]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          {users.length === 0 && <Text style={pp.empty}>ยังไม่มีผู้ใช้ POS</Text>}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Setting: Branch Payment Types ────────────────────────────────────────────
const SettingBranchPaymentScreen: React.FC<{ branchId: string; branchName: string; onBack: () => void }> = ({ branchId, branchName, onBack }) => {
  const DEFAULT_METHODS = [
    { id: 'cash', label: 'เงินสด', icon: 'cash', color: WebColors.success, enabled: true },
    { id: 'qr', label: 'QR / PromptPay', icon: 'qr-code', color: WebColors.purple, enabled: true },
    { id: 'transfer', label: 'โอนเงิน', icon: 'swap-horizontal', color: WebColors.info, enabled: true },
    { id: 'credit', label: 'บัตรเครดิต/เดบิต', icon: 'card', color: WebColors.warning, enabled: true },
    { id: 'wallet', label: 'E-Wallet', icon: 'wallet', color: WebColors.primary, enabled: false },
  ];

  const [useDefault, setUseDefault] = useState(true);
  const [methods, setMethods] = useState(DEFAULT_METHODS);
  const [newLabel, setNewLabel] = useState('');
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => setMethods(p => p.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  const addMethod = () => {
    if (!newLabel.trim()) return;
    setMethods(p => [...p, { id: `c_${Date.now()}`, label: newLabel.trim(), icon: 'cash-outline', color: WebColors.textSecondary, enabled: true }]);
    setNewLabel('');
  };

  return (
    <View style={g.root}>
      <TouchableOpacity style={pp.backRow} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
        <Text style={pp.backText}>กลับ</Text>
      </TouchableOpacity>
      <Text style={g.pageTitle}>ชำระเงิน — {branchName}</Text>
      <Text style={g.pageSub}>ถ้าไม่ตั้งแยก จะใช้ค่าจากระดับบริษัท</Text>

      <View style={pp.card}>
        <View style={pp.row}>
          <View style={{ flex: 1 }}>
            <Text style={pp.cardTitle}>ใช้ค่าจากระดับบริษัท</Text>
            <Text style={pp.hint}>ปิดสวิตช์เพื่อตั้งค่าแยกสาขา</Text>
          </View>
          <Switch value={useDefault} onValueChange={setUseDefault} trackColor={{ true: WebColors.primary, false: Colors.border }} />
        </View>
      </View>

      {useDefault ? (
        <View style={{ backgroundColor: WebColors.warningLight, borderRadius: 10, padding: 14 }}>
          <Text style={{ fontSize: 12, color: WebColors.warning }}>ใช้ค่าจากหน้า ตั้งค่า → ประเภทชำระเงิน</Text>
        </View>
      ) : (
        <View style={pp.card}>
          {methods.map((m, i) => (
            <View key={m.id} style={[pp.payRow, i < methods.length - 1 && pp.payBorder]}>
              <View style={[pp.payIcon, { backgroundColor: m.color + '18' }]}>
                <Ionicons name={m.icon as any} size={18} color={m.color} />
              </View>
              <Text style={pp.payLabel}>{m.label}</Text>
              {m.id.startsWith('c_') && (
                <TouchableOpacity onPress={() => setMethods(p => p.filter(x => x.id !== m.id))}>
                  <Ionicons name="trash-outline" size={15} color={WebColors.danger} />
                </TouchableOpacity>
              )}
              <Switch value={m.enabled} onValueChange={() => toggle(m.id)} trackColor={{ true: WebColors.primary, false: Colors.border }} />
            </View>
          ))}

          <View style={pp.divider} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput style={[pp.input, { flex: 1 }]} value={newLabel} onChangeText={setNewLabel} placeholder="เพิ่มประเภทใหม่..." placeholderTextColor={Colors.textMuted} />
            <TouchableOpacity style={g.primaryBtn} onPress={addMethod}><Ionicons name="add" size={14} color={WebColors.white} /><Text style={g.primaryBtnText}>เพิ่ม</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={[g.primaryBtn, { alignSelf: 'flex-start', marginTop: 8 }]} onPress={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
            <Text style={g.primaryBtnText}>{saved ? '✓ บันทึกแล้ว' : 'บันทึก'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const WebSettingsScreen: React.FC = () => {
  const [subView, setSubView] = useState<string | null>(null);

  // Route ไปหน้าย่อย
  if (subView === 'shop')       return <SettingShopScreen       onBack={() => setSubView(null)} />;
  if (subView === 'branch')     return <SettingBranchScreen     onBack={() => setSubView(null)} />;
  if (subView === 'role')       return <SettingRoleScreen       onBack={() => setSubView(null)} />;
  if (subView === 'permission') return <SettingPermissionScreen onBack={() => setSubView(null)} />;
  if (subView === 'security')   return <SettingSecurityScreen   onBack={() => setSubView(null)} />;
  if (subView === 'ads')        return <WebAdSettingsScreen     onBack={() => setSubView(null)} />;
  if (subView === 'receipt')    return <SettingReceiptScreen    onBack={() => setSubView(null)} />;
  if (subView === 'storeType')  return <WebStoreSettingsSection onBack={() => setSubView(null)} />;
  if (subView === 'printer')    return <SettingPrinterSection   onBack={() => setSubView(null)} />;
  if (subView === 'scanner')    return <SettingScannerSection   onBack={() => setSubView(null)} />;
  if (subView === 'display')    return <SettingDisplaySection   onBack={() => setSubView(null)} />;
  if (subView === 'payment')    return <SettingPaymentSection   onBack={() => setSubView(null)} />;
  if (subView === 'auditlog')   return <SimpleSubPage title="Audit Log" sub="ประวัติการใช้งานระบบ — ใคร ทำอะไร เมื่อไหร่" onBack={() => setSubView(null)} />;
  if (subView === 'erp')        return <SimpleSubPage title="ERP Integration" sub="เชื่อมต่อระบบ ERP หลังบ้าน (สต๊อก / บัญชี)" onBack={() => setSubView(null)} />;
  if (subView === 'sync')       return <SimpleSubPage title="Sync Monitor" sub="ตรวจสอบสถานะ Sync — Pending / Failed / Conflict" onBack={() => setSubView(null)} />;
  if (subView === 'testtracker') return <WebTestTrackerScreenInline onBack={() => setSubView(null)} />;
  if (subView === 'posPermission') return <SettingPOSPermissionScreen onBack={() => setSubView(null)} />;
  if (subView === 'users') return <View style={g.root}><TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }} onPress={() => setSubView(null)}><Ionicons name="arrow-back" size={18} color={WebColors.primary} /><Text style={{ fontSize: 12, color: WebColors.primary, fontWeight: '600' }}>ตั้งค่า</Text></TouchableOpacity><WebUserStaffScreen /></View>;

  const cards: { icon: string; label: string; sub: string; color: string; bg: string; key: string }[] = [
    { icon: 'storefront-outline',    label: 'ประเภทร้าน & Service Charge', sub: 'ประเภทธุรกิจ / ขนาด / ค่าบริการ', color: WebColors.success, bg: WebColors.successLight, key: 'storeType'  },
    { icon: 'document-text-outline', label: 'ตั้งค่าร้านค้า',       sub: 'ชื่อร้าน / ที่อยู่ / เลขภาษี / VAT',  color: WebColors.primary, bg: WebColors.primaryLight, key: 'shop'       },
    { icon: 'business-outline',      label: 'สาขา & จุดขาย',        sub: 'จัดการสาขา / POS / ประเภทชำระ',       color: WebColors.primary, bg: WebColors.primaryLight, key: 'branch'     },
    { icon: 'card-outline',          label: 'ประเภทชำระเงิน',       sub: 'เงินสด / QR / โอน / บัตร (ระดับบริษัท)',color: WebColors.info,      bg: WebColors.infoLight,    key: 'payment'    },
    { icon: 'shield-outline',        label: 'จัดการ Role',           sub: 'กำหนดสิทธิ์ / Role',                   color: WebColors.purple,   bg: WebColors.purpleLight,  key: 'role'       },
    { icon: 'people-outline',        label: 'ผู้ใช้งาน / พนักงาน',   sub: 'จัดการ user, พนักงาน, สิทธิ์เข้าใช้',  color: WebColors.success,  bg: WebColors.successLight, key: 'users'      },
    { icon: 'grid-outline',          label: 'Permission Matrix',     sub: 'กำหนดสิทธิ์รายโมดูล',                  color: WebColors.purple,   bg: WebColors.purpleLight,  key: 'permission' },
    { icon: 'keypad-outline',        label: 'Permission POS (PIN)',   sub: 'ยกเลิกบิล / เปลี่ยนราคา / Reprint + PIN', color: WebColors.purple,   bg: WebColors.purpleLight,  key: 'posPermission' },
    { icon: 'lock-closed-outline',   label: 'ความปลอดภัย',          sub: 'Password / PIN / Timeout',              color: WebColors.warning,  bg: WebColors.warningLight, key: 'security'   },
    { icon: 'document-text-outline', label: 'Audit Log',             sub: 'ประวัติการใช้งานระบบ',                  color: Colors.textSecondary,          bg: Colors.border,              key: 'auditlog'   },
    { icon: 'cloud-outline',         label: 'ERP Integration',       sub: 'เชื่อมต่อระบบ ERP หลังบ้าน',           color: WebColors.success,  bg: WebColors.successLight, key: 'erp'        },
    { icon: 'sync-outline',          label: 'Sync Monitor',          sub: 'ตรวจสอบการ Sync ข้อมูล',               color: WebColors.success,  bg: WebColors.successLight, key: 'sync'       },
    { icon: 'clipboard-outline',     label: 'Test Tracker',           sub: 'บันทึกผลทดสอบ (Offline)',              color: WebColors.purple,   bg: WebColors.purpleLight,  key: 'testtracker' },
  ];

  return (
    <View style={g.root}>
      <Text style={g.pageTitle}>ตั้งค่า</Text>
      <Text style={g.pageSub}>จัดการการตั้งค่าระบบ</Text>
      <View style={g.settingsGrid}>
        {cards.map((c, i) => (
          <TouchableOpacity key={i} style={g.settingCard} onPress={() => setSubView(c.key)}>
            <View style={[g.settingIcon, { backgroundColor: c.bg }]}>
              <Ionicons name={c.icon as any} size={24} color={c.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={g.settingLabel}>{c.label}</Text>
              <Text style={g.settingSub}>{c.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={WebColors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Shared styles ─────────────────────────────────────────────────────────────
const g = StyleSheet.create({
  root: { gap: 20 },
  pageTitle: { fontSize: 16, fontWeight: '800', color: WebColors.text },
  pageSub: { fontSize: 14, color: WebColors.textSecondary, marginTop: -12 },
  kpiRow: { flexDirection: 'row', gap: 16 },
  kpiCard: { flex: 1, backgroundColor: WebColors.white, borderRadius: 12, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: WebColors.border },
  kpiLabel: { fontSize: 13, color: WebColors.textSecondary },
  kpiValue: { fontSize: 18, fontWeight: '800' },
  kpiBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: WebColors.white, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: WebColors.border, alignSelf: 'flex-start' },
  tab: { paddingHorizontal: 20, paddingVertical: 10 },
  tabActive: { backgroundColor: WebColors.primary },
  tabText: { fontSize: 12, color: WebColors.textSecondary },
  tabTextActive: { color: WebColors.white, fontWeight: '700' },
  table: { backgroundColor: WebColors.white, borderRadius: 12, borderWidth: 1, borderColor: WebColors.border, overflow: 'hidden' },
  thead: { flexDirection: 'row', backgroundColor: WebColors.gray50, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  th: { flex: 1, fontSize: 12, fontWeight: '700', color: WebColors.textSecondary, textTransform: 'uppercase' },
  tr: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: WebColors.border, alignItems: 'center' },
  trAlt: { backgroundColor: WebColors.gray50 },
  td: { flex: 1, fontSize: 13, color: WebColors.text },
  tdCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tdBold: { fontSize: 12, fontWeight: '600', color: WebColors.text },
  tdSub: { fontSize: 13, color: WebColors.textSecondary, marginTop: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 2 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: WebColors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WebColors.white, borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 13, color: WebColors.text },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  primaryBtnText: { fontSize: 13, fontWeight: '700', color: WebColors.white },
  cardGrid: { gap: 12 },
  reportCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border },
  reportIcon: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportLabel: { fontSize: 12, fontWeight: '700', color: WebColors.text },
  reportSub: { fontSize: 13, color: WebColors.textSecondary, marginTop: 2 },
  settingsGrid: { gap: 12 },
  settingCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border },
  settingIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '700', color: WebColors.text },
  settingSub: { fontSize: 12, color: WebColors.textSecondary, marginTop: 2 },
});

// ─── POS Permission & Branch Payment styles ──────────────────────────────────
const pp = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { fontSize: 12, color: WebColors.primary, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  subTitle: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  hint: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff' },
  chipOn: { borderColor: WebColors.primary, backgroundColor: WebColors.primaryLight },
  chipText: { fontSize: 11, color: Colors.textSecondary },
  chipTextOn: { color: WebColors.primary },
  branchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: WebColors.gray50, borderRadius: 8 },
  branchName: { fontSize: 12, color: Colors.text, flex: 1 },
  branchStatus: { fontSize: 10, color: Colors.textSecondary },
  addForm: { backgroundColor: WebColors.gray50, borderRadius: 10, padding: 14, gap: 10, borderWidth: 1, borderColor: WebColors.primary },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: Colors.text },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.border },
  cancelText: { fontSize: 12, color: Colors.textSecondary },
  userCard: { backgroundColor: WebColors.gray50, borderRadius: 10, padding: 12, gap: 8, borderWidth: 1, borderColor: Colors.border },
  userName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  userRole: { fontSize: 11, color: Colors.textSecondary },
  pinBox: { alignItems: 'center', marginHorizontal: 8 },
  pinLabel: { fontSize: 9, color: Colors.textSecondary },
  pinValue: { fontSize: 15, fontWeight: '800', color: WebColors.purple, fontFamily: 'monospace' },
  iconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: WebColors.gray100 },
  permChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  permOn: { backgroundColor: WebColors.successLight },
  permOff: { backgroundColor: '#FEE2E2' },
  empty: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', padding: 20 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  payBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  payIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  payLabel: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.text },
});
