/**
 * WebCRMScreen — CRM Back-Office (ChocoCRM-inspired)
 * Features: สมาชิก, เพิ่มสมาชิก, ระดับ, ตั้งค่าแต้ม, คูปอง, แคมเปญ, Gamification,
 *           Segment, ประวัติ, Wallet, รายงาน, ตั้งค่า
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Modal, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors, Space, Radius, Shadow, Font } from '../../design-system/tokens';
import { useMemberStore } from '../../store/memberStore';
import { usePromoStore } from '../../store/promoStore';
import { useCommunicationStore } from '../../store/communicationStore';
import { useSaleHistoryStore } from '../../store/saleHistoryStore';
import { MOCK_LEVEL_CONFIGS } from '../../data/mockMembers';

type MenuKey = 'members' | 'add-member' | 'levels' | 'points' | 'point-adjust' | 'coupons'
  | 'campaigns' | 'communication' | 'gamification' | 'segments' | 'history' | 'wallet' | 'reports' | 'settings';

const MENUS: { key: MenuKey; label: string; icon: string }[] = [
  { key: 'members', label: 'ข้อมูลสมาชิก', icon: 'people-outline' },
  { key: 'add-member', label: 'เพิ่มสมาชิก', icon: 'person-add-outline' },
  { key: 'levels', label: 'ระดับสมาชิก', icon: 'ribbon-outline' },
  { key: 'points', label: 'ตั้งค่าคะแนน', icon: 'star-outline' },
  { key: 'point-adjust', label: 'ปรับปรุงคะแนน', icon: 'swap-horizontal-outline' },
  { key: 'coupons', label: 'คูปอง / Voucher', icon: 'pricetag-outline' },
  { key: 'campaigns', label: 'Campaign', icon: 'megaphone-outline' },
  { key: 'communication', label: 'Communication', icon: 'chatbubbles-outline' },
  { key: 'gamification', label: 'Gamification', icon: 'game-controller-outline' },
  { key: 'segments', label: 'Segment ลูกค้า', icon: 'layers-outline' },
  { key: 'history', label: 'ประวัติการซื้อ', icon: 'receipt-outline' },
  { key: 'wallet', label: 'Wallet / Credit', icon: 'wallet-outline' },
  { key: 'reports', label: 'รายงาน', icon: 'bar-chart-outline' },
  { key: 'settings', label: 'ตั้งค่า CRM', icon: 'settings-outline' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const Badge: React.FC<{ text: string; color: string; bg: string }> = ({ text, color, bg }) => (
  <View style={[cs.badge, { backgroundColor: bg }]}><Text style={[cs.badgeText, { color }]}>{text}</Text></View>
);
const KPI: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color }) => (
  <View style={cs.kpi}><Text style={[cs.kpiVal, color ? { color } : undefined]}>{typeof value === 'number' ? value.toLocaleString() : value}</Text><Text style={cs.kpiLabel}>{label}</Text></View>
);
const Field: React.FC<{ label: string; value: string; onChange?: (v: string) => void; placeholder?: string; required?: boolean; flex?: number; type?: string }> = ({ label, value, onChange, placeholder, required, flex, type }) => (
  <View style={[cs.field, flex ? { flex } : undefined]}>
    <Text style={cs.fieldLabel}>{label}{required && <Text style={{ color: WebColors.danger }}> *</Text>}</Text>
    <TextInput style={cs.fieldInput} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={WebColors.gray300} {...(type && Platform.OS === 'web' ? { type } as any : {})} />
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const WebCRMScreen: React.FC = () => {
  const [menu, setMenu] = useState<MenuKey>('members');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={[cs.root, isMobile && { flexDirection: 'column' }]}>
      {/* Sidebar */}
      {!isMobile && <View style={cs.sidebar}>
        <View style={cs.sideHeader}>
          <Ionicons name="heart-circle" size={24} color={WebColors.primary} />
          <Text style={cs.sideTitle}>CRM</Text>
        </View>
        {MENUS.map(m => (
          <TouchableOpacity key={m.key} style={[cs.menuItem, menu === m.key && cs.menuItemActive]} onPress={() => setMenu(m.key)}>
            <Ionicons name={m.icon as any} size={16} color={menu === m.key ? WebColors.primary : Colors.textSecondary} />
            <Text style={[cs.menuText, menu === m.key && cs.menuTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>}

      {/* Mobile CRM tabs */}
      {isMobile && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: WebColors.white }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 8, gap: 4, alignItems: 'center' }}>
            {MENUS.map(m => (
              <TouchableOpacity key={m.key} onPress={() => setMenu(m.key)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: menu === m.key ? WebColors.primary : 'transparent' }}>
                <Text style={{ fontSize: 12, color: menu === m.key ? WebColors.primary : Colors.textSecondary, fontWeight: menu === m.key ? '600' : '400' }}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Content */}
      <ScrollView style={cs.content} contentContainerStyle={{ padding: isMobile ? 12 : 24, gap: 16 }}>
        {menu === 'members' && <MembersPanel />}
        {menu === 'add-member' && <AddMemberPanel />}
        {menu === 'levels' && <LevelsPanel />}
        {menu === 'points' && <PointsSettingsPanel />}
        {menu === 'point-adjust' && <PointAdjustPanel />}
        {menu === 'coupons' && <CouponsPanel />}
        {menu === 'campaigns' && <CampaignsPanel />}
        {menu === 'communication' && <CommunicationPanel />}
        {menu === 'gamification' && <GamificationPanel />}
        {menu === 'segments' && <SegmentsPanel />}
        {menu === 'history' && <HistoryPanel />}
        {menu === 'wallet' && <WalletPanel />}
        {menu === 'reports' && <ReportsPanel />}
        {menu === 'settings' && <SettingsPanel />}
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MEMBERS LISTING + DETAIL
// ═══════════════════════════════════════════════════════════════════════════════
const MembersPanel: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { members, searchMembers, updateMember } = useMemberStore();
  const [kw, setKw] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const list = kw.trim() ? searchMembers(kw) : members;
  const active = members.filter(m => m.isActive).length;
  const suspended = members.length - active;
  const newMonth = members.filter(m => { const d = new Date(m.joinDate), n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length;

  const selected = selectedId ? members.find(m => m.id === selectedId) : null;

  const startEdit = () => {
    if (!selected) return;
    setEditName(selected.name);
    setEditPhone(selected.phone);
    setEditEmail(selected.email || '');
    setEditBirthday(selected.birthday || '');
    setEditAddress(selected.address || '');
    setEditMode(true);
  };

  const saveEdit = () => {
    if (!selected) return;
    updateMember(selected.id, {
      name: editName,
      phone: editPhone,
      email: editEmail || undefined,
      birthday: editBirthday || undefined,
      address: editAddress || undefined,
    });
    setEditMode(false);
  };

  // ─── Detail View ──
  if (selected) {
    const levelCfg = MOCK_LEVEL_CONFIGS.find(c => c.level === selected.level);
    return (
      <View>
        <TouchableOpacity style={cs.backRow} onPress={() => setSelectedId(null)}>
          <Ionicons name="arrow-back" size={16} color={WebColors.primary} />
          <Text style={cs.backText}>กลับรายชื่อสมาชิก</Text>
        </TouchableOpacity>
        <Text style={cs.pageTitle}>{selected.name}</Text>
        <Text style={cs.subtitle}>{selected.memberNo} · สมาชิกตั้งแต่ {selected.joinDate}</Text>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.border, borderWidth: 1, borderColor: Colors.border }}
            onPress={startEdit}>
            <Ionicons name="create-outline" size={14} color={WebColors.primary} /><Text style={{ fontSize: 13, color: WebColors.primary, fontWeight: '600' }}>แก้ไข</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: selected.isActive ? WebColors.warningLight : WebColors.successLight, borderWidth: 1, borderColor: selected.isActive ? WebColors.warning : WebColors.success }}
            onPress={() => { useMemberStore.getState().updateMember(selected.id, { isActive: !selected.isActive, status: selected.isActive ? 'suspended' : 'active' }); setSelectedId(null); }}>
            <Ionicons name={selected.isActive ? 'pause-circle-outline' : 'play-circle-outline'} size={14} color={selected.isActive ? WebColors.warning : WebColors.success} />
            <Text style={{ fontSize: 13, color: selected.isActive ? WebColors.warning : WebColors.success, fontWeight: '600' }}>{selected.isActive ? 'ระงับ' : 'เปิดใช้'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: WebColors.dangerLight, borderWidth: 1, borderColor: WebColors.danger }}
            onPress={() => { if (confirm('ลบสมาชิก ' + selected.name + '?')) { useMemberStore.getState().updateMember(selected.id, { isActive: false, status: 'suspended' }); setSelectedId(null); } }}>
            <Ionicons name="trash-outline" size={14} color={WebColors.danger} /><Text style={{ fontSize: 13, color: WebColors.danger, fontWeight: '600' }}>ลบ</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Form */}
        {editMode && (
          <View style={[cs.card, { marginBottom: 12, gap: 10 }]}>
            <Text style={cs.cardTitle}>แก้ไขข้อมูลสมาชิก</Text>
            <View style={cs.formRow}>
              <Field label="ชื่อ-สกุล" value={editName} onChange={setEditName} required flex={1} />
              <Field label="เบอร์โทร" value={editPhone} onChange={setEditPhone} required flex={1} />
              <Field label="Email" value={editEmail} onChange={setEditEmail} flex={1} />
            </View>
            <View style={cs.formRow}>
              <Field label="วันเกิด" value={editBirthday} onChange={setEditBirthday} flex={1} type="date" />
              <Field label="ที่อยู่" value={editAddress} onChange={setEditAddress} flex={2} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={cs.primaryBtn} onPress={saveEdit}>
                <Ionicons name="checkmark" size={14} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>บันทึก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.border }} onPress={() => setEditMode(false)}>
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Info Cards */}
        <View style={cs.kpiRow}>
          <KPI label="ระดับ" value={levelCfg?.label || selected.level} color={levelCfg?.color || '#999'} />
          <KPI label="คะแนนสะสม" value={selected.pointBalance} color={WebColors.warning} />
          <KPI label="ยอดซื้อรวม" value={`฿${selected.totalSpent.toLocaleString()}`} color={WebColors.purple} />
          <KPI label="สถานะ" value={selected.isActive ? 'Active' : 'ระงับ'} color={selected.isActive ? WebColors.success : WebColors.danger} />
        </View>

        {/* Member Info */}
        <View style={cs.card}>
          <Text style={cs.cardTitle}>ข้อมูลสมาชิก</Text>
          <View style={cs.detailGrid}>
            <View style={cs.detailItem}><Text style={cs.detailLbl}>เบอร์โทร</Text><Text style={cs.detailVal}>{selected.phone}</Text></View>
            <View style={cs.detailItem}><Text style={cs.detailLbl}>Email</Text><Text style={cs.detailVal}>{selected.email || '-'}</Text></View>
            <View style={cs.detailItem}><Text style={cs.detailLbl}>ระดับถัดไป</Text><Text style={cs.detailVal}>{levelCfg ? `ซื้อเพิ่ม ฿${Math.max(0, (MOCK_LEVEL_CONFIGS[(MOCK_LEVEL_CONFIGS.indexOf(levelCfg) + 1)]?.minSpent || 999999) - selected.totalSpent).toLocaleString()}` : '—'}</Text></View>
            <View style={cs.detailItem}><Text style={cs.detailLbl}>ส่วนลดปัจจุบัน</Text><Text style={cs.detailVal}>{levelCfg?.discountPercent || 0}%</Text></View>
            <View style={cs.detailItem}><Text style={cs.detailLbl}>อัตราแต้ม</Text><Text style={cs.detailVal}>x{levelCfg?.earnMultiplier || 1}</Text></View>
            <View style={cs.detailItem}><Text style={cs.detailLbl}>แต้มหมดอายุ</Text><Text style={cs.detailVal}>{levelCfg?.expireDays || 365} วัน</Text></View>
          </View>
        </View>

        {/* Point History */}
        <View style={cs.card}>
          <Text style={cs.cardTitle}>ประวัติคะแนน (ล่าสุด)</Text>
          <View style={cs.table}>
            <View style={cs.thead}>
              {['วันที่','รายการ','แต้ม','ยอดคงเหลือ'].map((h,i) => <Text key={i} style={cs.th}>{h}</Text>)}
            </View>
            {[
              { date: '15/06/2567', desc: 'ซื้อสินค้า บิล #1205', pts: '+50', bal: selected.pointBalance },
              { date: '12/06/2567', desc: 'แลกคูปอง BIRTH20', pts: '-200', bal: selected.pointBalance - 50 },
              { date: '08/06/2567', desc: 'ซื้อสินค้า บิล #1198', pts: '+120', bal: selected.pointBalance + 150 },
              { date: '01/06/2567', desc: 'โบนัสวันเกิด x2', pts: '+80', bal: selected.pointBalance + 30 },
            ].map((h, i) => (
              <View key={i} style={[cs.tr, i % 2 === 1 && cs.trAlt]}>
                <Text style={cs.td}>{h.date}</Text>
                <Text style={[cs.td, { flex: 2 }]}>{h.desc}</Text>
                <Text style={[cs.td, { color: h.pts.startsWith('+') ? WebColors.success : WebColors.danger, fontWeight: '700' }]}>{h.pts}</Text>
                <Text style={cs.td}>{h.bal.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Purchase History */}
        <View style={cs.card}>
          <Text style={cs.cardTitle}>ประวัติการซื้อ (ล่าสุด)</Text>
          <View style={cs.table}>
            <View style={cs.thead}>
              {['วันที่','เลขบิล','จำนวนสินค้า','ยอดเงิน','ชำระ'].map((h,i) => <Text key={i} style={cs.th}>{h}</Text>)}
            </View>
            {[
              { date: '15/06/2567', bill: '#1205', items: 5, amount: 1250, pay: 'เงินสด' },
              { date: '08/06/2567', bill: '#1198', items: 3, amount: 3000, pay: 'QR Code' },
              { date: '28/05/2567', bill: '#1185', items: 8, amount: 4500, pay: 'บัตรเครดิต' },
            ].map((h, i) => (
              <View key={i} style={[cs.tr, i % 2 === 1 && cs.trAlt]}>
                <Text style={cs.td}>{h.date}</Text>
                <Text style={cs.td}>{h.bill}</Text>
                <Text style={cs.td}>{h.items} ชิ้น</Text>
                <Text style={[cs.td, { fontWeight: '600' }]}>฿{h.amount.toLocaleString()}</Text>
                <Text style={cs.td}>{h.pay}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ─── List View ──
  return (
    <View>
      <Text style={cs.pageTitle}>ข้อมูลสมาชิก</Text>
      <View style={cs.kpiRow}>
        <KPI label="สมาชิกทั้งหมด" value={members.length} color={WebColors.primary} />
        <KPI label="สมาชิกใหม่เดือนนี้" value={newMonth} color={WebColors.info} />
        <KPI label="Active" value={active} color={WebColors.success} />
        <KPI label="Suspended" value={suspended} color={WebColors.danger} />
      </View>
      <View style={cs.searchRow}>
        <Ionicons name="search" size={15} color={WebColors.textSecondary} />
        <TextInput style={cs.searchInput} placeholder="ค้นหาชื่อ, เบอร์โทร, หมายเลขสมาชิก..." value={kw} onChangeText={setKw} placeholderTextColor={WebColors.textSecondary} />
      </View>
      {isMobile ? (
        <View style={{ gap: 10 }}>
          {list.map((m) => {
            const levelCfg = MOCK_LEVEL_CONFIGS.find(c => c.level === m.level);
            return (
              <TouchableOpacity key={m.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F0E2DA' }} onPress={() => setSelectedId(m.id)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#3A2E2B' }}>{m.name}</Text>
                  <Badge text={m.isActive ? 'Active' : 'ระงับ'} color={m.isActive ? WebColors.success : WebColors.danger} bg={m.isActive ? WebColors.successLight : WebColors.dangerLight} />
                </View>
                <Text style={{ fontSize: 13, color: '#6B5B57', marginTop: 2 }}>{m.phone}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge text={levelCfg?.label || m.level} color={WebColors.white} bg={levelCfg?.color || '#999'} />
                  <Text style={{ fontSize: 12, color: '#6B5B57' }}>⭐ {m.pointBalance.toLocaleString()} แต้ม</Text>
                  <Text style={{ fontSize: 12, color: '#6B5B57' }}>฿{m.totalSpent.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {list.length === 0 && <Text style={cs.empty}>ไม่พบสมาชิก</Text>}
        </View>
      ) : (
      <View style={cs.table}>
        <View style={cs.thead}>
          <Text style={[cs.th, { width: 90 }]}>รหัส</Text>
          <Text style={[cs.th, { flex: 1.5 }]}>ชื่อ</Text>
          <Text style={[cs.th, { width: 100 }]}>เบอร์โทร</Text>
          <Text style={[cs.th, { flex: 1.5 }]}>Email</Text>
          <Text style={[cs.th, { width: 70 }]}>ระดับ</Text>
          <Text style={[cs.th, { width: 60, textAlign: 'right' }]}>คะแนน</Text>
          <Text style={[cs.th, { width: 80, textAlign: 'right' }]}>ยอดซื้อ</Text>
          <Text style={[cs.th, { width: 70, textAlign: 'center', marginLeft: 12 }]}>สถานะ</Text>
          <Text style={[cs.th, { width: 85 }]}>วันสมัคร</Text>
        </View>
        {list.map((m, i) => (
          <TouchableOpacity key={m.id} style={[cs.tr, i % 2 === 1 && cs.trAlt]} onPress={() => setSelectedId(m.id)}>
            <Text style={[cs.td, { width: 90 }]} numberOfLines={1}>{m.memberNo}</Text>
            <Text style={[cs.td, { flex: 1.5, fontWeight: '600' }]} numberOfLines={1}>{m.name}</Text>
            <Text style={[cs.td, { width: 100 }]} numberOfLines={1}>{m.phone}</Text>
            <Text style={[cs.td, { flex: 1.5 }]} numberOfLines={1}>{m.email || '-'}</Text>
            <View style={[cs.td, { width: 70 }]}><Badge text={MOCK_LEVEL_CONFIGS.find(c => c.level === m.level)?.label || m.level} color={WebColors.white} bg={MOCK_LEVEL_CONFIGS.find(c => c.level === m.level)?.color || '#999'} /></View>
            <Text style={[cs.td, { width: 60, textAlign: 'right' }]}>{m.pointBalance.toLocaleString()}</Text>
            <Text style={[cs.td, { width: 80, textAlign: 'right' }]}>{m.totalSpent.toLocaleString()}</Text>
            <View style={[cs.td, { width: 70, alignItems: 'center', marginLeft: 12 }]}><Badge text={m.isActive ? 'Active' : 'ระงับ'} color={m.isActive ? WebColors.success : WebColors.danger} bg={m.isActive ? WebColors.successLight : WebColors.dangerLight} /></View>
            <Text style={[cs.td, { width: 85 }]} numberOfLines={1}>{m.joinDate}</Text>
          </TouchableOpacity>
        ))}
        {list.length === 0 && <Text style={cs.empty}>ไม่พบสมาชิก</Text>}
      </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ADD MEMBER
// ═══════════════════════════════════════════════════════════════════════════════
const AddMemberPanel: React.FC = () => {
  const { addMember, members } = useMemberStore();
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [email, setEmail] = useState('');
  const [dob, setDob] = useState(''); const [gender, setGender] = useState(''); const [lineId, setLineId] = useState('');
  const [address, setAddress] = useState(''); const [remark, setRemark] = useState(''); const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) { alert('กรุณากรอกชื่อและเบอร์โทร'); return; }
    addMember({ name, phone, email: email || undefined, level: 'member', isActive: true, status: 'active' } as any);
    setSaved(true); setTimeout(() => { setSaved(false); setName(''); setPhone(''); setEmail(''); setDob(''); setGender(''); setLineId(''); setAddress(''); setRemark(''); }, 2000);
  };

  return (
    <View>
      <Text style={cs.pageTitle}>เพิ่มสมาชิกใหม่</Text>
      <View style={cs.card}>
        <View style={cs.formRow}><Field label="ชื่อ-สกุล" value={name} onChange={setName} required flex={1} /><Field label="เบอร์โทร" value={phone} onChange={setPhone} required placeholder="08x-xxx-xxxx" flex={1} /><Field label="Email" value={email} onChange={setEmail} flex={1} /></View>
        <View style={cs.formRow}><Field label="วันเกิด" value={dob} onChange={setDob} placeholder="YYYY-MM-DD" flex={1} type="date" /><Field label="Line ID" value={lineId} onChange={setLineId} flex={1} />
          <View style={[cs.field, { flex: 1 }]}><Text style={cs.fieldLabel}>เพศ</Text><View style={cs.chipRow}>{['ชาย','หญิง','อื่นๆ'].map(g => <TouchableOpacity key={g} style={[cs.chip, gender === g && cs.chipAct]} onPress={() => setGender(g)}><Text style={[cs.chipTxt, gender === g && cs.chipTxtAct]}>{g}</Text></TouchableOpacity>)}</View></View>
        </View>
        <View style={cs.formRow}><Field label="ที่อยู่" value={address} onChange={setAddress} flex={2} /><Field label="หมายเหตุ" value={remark} onChange={setRemark} flex={1} /></View>
        <View style={cs.formFooter}>{saved && <Text style={cs.saved}>✓ บันทึกเรียบร้อย</Text>}<TouchableOpacity style={cs.primaryBtn} onPress={handleSave}><Ionicons name="checkmark-circle" size={16} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>บันทึกสมาชิก</Text></TouchableOpacity></View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. LEVELS (ระดับสมาชิก — ตั้งค่าเงื่อนไข + แก้ไขได้)
// ═══════════════════════════════════════════════════════════════════════════════
const LevelsPanel: React.FC = () => {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ minSpent: '', minBills: '', discount: '', multiplier: '', expiry: '' });

  const startEdit = (cfg: any) => {
    setEditing(cfg.level);
    setEditValues({ minSpent: String(cfg.minSpent), minBills: String(cfg.minBills), discount: String(cfg.discountPercent), multiplier: String(cfg.earnMultiplier), expiry: String(cfg.expiryDays) });
  };

  return (
    <View>
      <Text style={cs.pageTitle}>ระดับสมาชิก</Text>
      <Text style={cs.subtitle}>กำหนดเงื่อนไขการอัปเกรดระดับอัตโนมัติ (กดที่การ์ดเพื่อแก้ไข)</Text>
      <View style={cs.levelGrid}>
        {MOCK_LEVEL_CONFIGS.map(cfg => (
          <TouchableOpacity key={cfg.level} style={cs.levelCard} onPress={() => startEdit(cfg)}>
            <View style={[cs.levelBar, { backgroundColor: cfg.color }]} />
            <Text style={cs.levelName}>{cfg.label}</Text>
            {editing === cfg.level ? (
              <View style={{ gap: 6 }}>
                <Field label="ยอดซื้อขั้นต่ำ (฿)" value={editValues.minSpent} onChange={v => setEditValues(p => ({ ...p, minSpent: v }))} />
                <Field label="จำนวนบิล" value={editValues.minBills} onChange={v => setEditValues(p => ({ ...p, minBills: v }))} />
                <Field label="ส่วนลด (%)" value={editValues.discount} onChange={v => setEditValues(p => ({ ...p, discount: v }))} />
                <Field label="อัตราแต้ม (x)" value={editValues.multiplier} onChange={v => setEditValues(p => ({ ...p, multiplier: v }))} />
                <Field label="หมดอายุ (วัน)" value={editValues.expiry} onChange={v => setEditValues(p => ({ ...p, expiry: v }))} />
                <TouchableOpacity style={cs.primaryBtn} onPress={() => { setEditing(null); alert('บันทึกระดับ ' + cfg.label + ' เรียบร้อย'); }}>
                  <Text style={cs.primaryBtnTxt}>บันทึก</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 4 }}>
                <View style={cs.levelRow}><Text style={cs.levelLbl}>ยอดซื้อขั้นต่ำ</Text><Text style={cs.levelVal}>{cfg.minSpent.toLocaleString()} ฿</Text></View>
                <View style={cs.levelRow}><Text style={cs.levelLbl}>จำนวนบิล</Text><Text style={cs.levelVal}>{cfg.minBills} บิล</Text></View>
                <View style={cs.levelRow}><Text style={cs.levelLbl}>ส่วนลด</Text><Text style={cs.levelVal}>{cfg.discountPercent}%</Text></View>
                <View style={cs.levelRow}><Text style={cs.levelLbl}>อัตราแต้ม</Text><Text style={cs.levelVal}>x{cfg.earnMultiplier}</Text></View>
                <View style={cs.levelRow}><Text style={cs.levelLbl}>หมดอายุ</Text><Text style={cs.levelVal}>{cfg.expireDays} วัน</Text></View>
                <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 4 }}>กดเพื่อแก้ไข</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. POINTS SETTINGS (ตั้งค่าคะแนน/แต้ม)
// ═══════════════════════════════════════════════════════════════════════════════
const PointsSettingsPanel: React.FC = () => {
  const [earnRate, setEarnRate] = useState('25'); // ทุก X บาท ได้ 1 แต้ม
  const [redeemRate, setRedeemRate] = useState('1'); // 1 แต้ม = X บาท
  const [expiryDays, setExpiryDays] = useState('365');
  const [minRedeem, setMinRedeem] = useState('100');
  const [enabled, setEnabled] = useState(true);
  const [birthday, setBirthday] = useState(true);
  const [birthdayBonus, setBirthdayBonus] = useState('2'); // x2

  return (
    <View>
      <Text style={cs.pageTitle}>ตั้งค่าคะแนนสะสม</Text>
      <Text style={cs.subtitle}>กำหนดอัตราการได้รับ/แลกแต้ม และเงื่อนไขต่างๆ</Text>
      <View style={cs.card}>
        <Text style={cs.cardTitle}>การสะสมแต้ม</Text>
        <View style={cs.switchRow}><Text style={cs.switchLbl}>เปิดใช้ระบบคะแนน</Text><Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: WebColors.primary, false: Colors.border }} /></View>
        <View style={cs.formRow}>
          <Field label="ทุกกี่บาทได้ 1 แต้ม" value={earnRate} onChange={setEarnRate} placeholder="25" flex={1} />
          <Field label="1 แต้ม = กี่บาท (แลก)" value={redeemRate} onChange={setRedeemRate} placeholder="1" flex={1} />
          <Field label="แต้มหมดอายุ (วัน)" value={expiryDays} onChange={setExpiryDays} placeholder="365" flex={1} />
        </View>
        <Field label="แต้มขั้นต่ำที่แลกได้" value={minRedeem} onChange={setMinRedeem} placeholder="100" />
      </View>
      <View style={cs.card}>
        <Text style={cs.cardTitle}>โบนัสพิเศษ</Text>
        <View style={cs.switchRow}><Text style={cs.switchLbl}>โบนัสวันเกิด</Text><Switch value={birthday} onValueChange={setBirthday} trackColor={{ true: WebColors.primary, false: Colors.border }} /></View>
        {birthday && <Field label="ตัวคูณวันเกิด (เท่า)" value={birthdayBonus} onChange={setBirthdayBonus} placeholder="2" />}
      </View>
      <TouchableOpacity style={cs.primaryBtn}><Ionicons name="checkmark-circle" size={16} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>บันทึกการตั้งค่า</Text></TouchableOpacity>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4.5 POINT ADJUSTMENT (ปรับปรุงคะแนน — เพิ่ม/ลดแต้มสมาชิก)
// ═══════════════════════════════════════════════════════════════════════════════
const PointAdjustPanel: React.FC = () => {
  const { members } = useMemberStore();
  const [selectedMember, setSelectedMember] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([
    { date: '22/06/2567', member: 'สมชาย ใจดี', type: 'add', amount: 500, reason: 'โบนัสพิเศษลูกค้า VIP', by: 'admin' },
    { date: '20/06/2567', member: 'สภาพร แสงทอง', type: 'deduct', amount: 200, reason: 'แก้ไขคะแนนผิดพลาด', by: 'manager' },
    { date: '18/06/2567', member: 'วิชัย ศรีสุข', type: 'add', amount: 100, reason: 'ชดเชยปัญหาบริการ', by: 'admin' },
  ]);

  const filteredMembers = members.filter(m => {
    if (!search) return true;
    return `${m.name} ${m.memberNo} ${m.phone}`.toLowerCase().includes(search.toLowerCase());
  });

  const selMember = members.find(m => m.id === selectedMember);

  const handleSubmit = () => {
    if (!selectedMember) { alert('กรุณาเลือกสมาชิก'); return; }
    if (!amount || parseInt(amount) <= 0) { alert('กรุณากรอกจำนวนคะแนน'); return; }
    if (!reason.trim()) { alert('กรุณากรอกเหตุผล'); return; }
    const mem = members.find(m => m.id === selectedMember);
    setHistory(prev => [{ date: new Date().toLocaleDateString('th-TH'), member: mem?.name || '', type: adjustType, amount: parseInt(amount), reason, by: 'admin' }, ...prev]);
    alert(`${adjustType === 'add' ? 'เพิ่ม' : 'หัก'} ${amount} คะแนน ให้ ${mem?.name} เรียบร้อย`);
    setAmount(''); setReason(''); setSelectedMember('');
  };

  return (
    <View>
      <Text style={cs.pageTitle}>ปรับปรุงคะแนน</Text>
      <Text style={cs.subtitle}>เพิ่มหรือหักคะแนนสมาชิกด้วยตนเอง (Manual Adjustment)</Text>

      <View style={cs.card}>
        <Text style={cs.cardTitle}>ปรับปรุงคะแนนสมาชิก</Text>

        {/* เลือกสมาชิก */}
        <View style={cs.field}>
          <Text style={cs.fieldLabel}>ค้นหา/เลือกสมาชิก <Text style={{ color: WebColors.danger }}>*</Text></Text>
          <TextInput style={cs.fieldInput} value={search} onChangeText={setSearch} placeholder="พิมพ์ชื่อ, เบอร์โทร, รหัสสมาชิก..." placeholderTextColor={WebColors.gray300} />
        </View>
        {search.trim() !== '' && (
          <View style={{ maxHeight: 120, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginBottom: 8 }}>
            <ScrollView nestedScrollEnabled>
              {filteredMembers.slice(0, 5).map(m => (
                <TouchableOpacity key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: selectedMember === m.id ? WebColors.infoLight : WebColors.white }}
                  onPress={() => { setSelectedMember(m.id); setSearch(m.name); }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text }}>{m.name}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted }}>{m.memberNo} · {m.phone} · {m.pointBalance} แต้ม</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {selMember && (
          <View style={{ flexDirection: 'row', gap: 12, backgroundColor: WebColors.successLight, borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: WebColors.success, fontWeight: '600' }}>เลือก: {selMember.name}</Text>
            <Text style={{ fontSize: 13, color: WebColors.success }}>คะแนนปัจจุบัน: {selMember.pointBalance.toLocaleString()}</Text>
          </View>
        )}

        {/* ประเภท */}
        <View style={cs.field}>
          <Text style={cs.fieldLabel}>ประเภทการปรับ</Text>
          <View style={cs.chipRow}>
            <TouchableOpacity style={[cs.chip, adjustType === 'add' && { backgroundColor: WebColors.success, borderColor: WebColors.success }]} onPress={() => setAdjustType('add')}>
              <Text style={[cs.chipTxt, adjustType === 'add' && cs.chipTxtAct]}>+ เพิ่มคะแนน</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[cs.chip, adjustType === 'deduct' && { backgroundColor: WebColors.danger, borderColor: WebColors.danger }]} onPress={() => setAdjustType('deduct')}>
              <Text style={[cs.chipTxt, adjustType === 'deduct' && cs.chipTxtAct]}>- หักคะแนน</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={cs.formRow}>
          <Field label="จำนวนคะแนน" value={amount} onChange={setAmount} placeholder="เช่น 500" required flex={1} />
          <Field label="เหตุผล / หมายเหตุ" value={reason} onChange={setReason} placeholder="ระบุเหตุผลการปรับปรุง" required flex={2} />
        </View>

        <View style={cs.formFooter}>
          <TouchableOpacity style={cs.primaryBtn} onPress={handleSubmit}>
            <Ionicons name="swap-horizontal" size={14} color={WebColors.white} />
            <Text style={cs.primaryBtnTxt}>{adjustType === 'add' ? 'เพิ่มคะแนน' : 'หักคะแนน'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* History */}
      <View style={cs.card}>
        <Text style={cs.cardTitle}>ประวัติการปรับปรุงคะแนน</Text>
        <View style={cs.table}>
          <View style={cs.thead}>
            {['วันที่', 'สมาชิก', 'ประเภท', 'คะแนน', 'เหตุผล', 'โดย'].map((h, i) => <Text key={i} style={[cs.th, i === 4 && { flex: 2 }]}>{h}</Text>)}
          </View>
          {history.map((h, i) => (
            <View key={i} style={[cs.tr, i % 2 === 1 && cs.trAlt]}>
              <Text style={cs.td}>{h.date}</Text>
              <Text style={[cs.td, { fontWeight: '600' }]}>{h.member}</Text>
              <View style={cs.td}><Badge text={h.type === 'add' ? 'เพิ่ม' : 'หัก'} color={h.type === 'add' ? WebColors.success : WebColors.danger} bg={h.type === 'add' ? WebColors.successLight : WebColors.dangerLight} /></View>
              <Text style={[cs.td, { fontWeight: '700', color: h.type === 'add' ? WebColors.success : WebColors.danger }]}>{h.type === 'add' ? '+' : '-'}{h.amount}</Text>
              <Text style={[cs.td, { flex: 2 }]}>{h.reason}</Text>
              <Text style={cs.td}>{h.by}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. COUPONS (มีฟอร์มสร้างคูปอง)
// ═══════════════════════════════════════════════════════════════════════════════
const CouponsPanel: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [cpCode, setCpCode] = useState(''); const [cpDesc, setCpDesc] = useState('');
  const [cpType, setCpType] = useState<'%' | 'Fixed'>('%'); const [cpValue, setCpValue] = useState('');
  const [cpLimit, setCpLimit] = useState(''); const [cpMinSpend, setCpMinSpend] = useState('');
  const [cpExpiry, setCpExpiry] = useState(''); const [cpLevel, setCpLevel] = useState('');

  // ดึงคูปองจาก Promotion Store
  const { promotions, createPromotion } = usePromoStore();
  const { sendCouponCampaign, stats: commStats } = useCommunicationStore();
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendCouponId, setSendCouponId] = useState('');
  const [sendChannel, setSendChannel] = useState<'line' | 'sms' | 'push'>('line');
  const [sendMsg, setSendMsg] = useState('');

  const couponPromos = promotions.filter(p => p.type === 'coupon' || p.couponCode);

  const handleCreateCoupon = () => {
    if (!cpCode.trim() || !cpValue.trim()) { alert('กรุณากรอกรหัสและส่วนลด'); return; }
    createPromotion({
      promoCode: cpCode.toUpperCase(),
      name: cpDesc || `คูปอง ${cpCode}`,
      description: cpDesc,
      type: 'coupon',
      status: 'active',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: cpExpiry || '2026-12-31',
      couponCode: cpCode.toUpperCase(),
      couponLimit: parseInt(cpLimit) || 100,
      couponUsed: 0,
      minPurchase: parseInt(cpMinSpend) || 0,
      discountPercent: cpType === '%' ? parseFloat(cpValue) : undefined,
      discountAmount: cpType === 'Fixed' ? parseFloat(cpValue) : undefined,
      applicableLevels: cpLevel ? [cpLevel.toLowerCase()] : undefined,
      stackable: false,
      priority: 5,
      createdBy: 'admin',
      shopId: 'shop-01',
    });
    alert('สร้างคูปอง "' + cpCode + '" สำเร็จ! (บันทึกใน Promotion Store)');
    setShowForm(false); setCpCode(''); setCpDesc(''); setCpValue(''); setCpLimit('');
  };

  const handleSendCoupon = () => {
    const promo = promotions.find(p => p.id === sendCouponId);
    if (!promo) return;
    sendCouponCampaign({
      name: `ส่งคูปอง ${promo.couponCode || promo.promoCode}`,
      channel: sendChannel,
      couponId: promo.id,
      couponName: promo.name,
      couponCode: promo.couponCode || promo.promoCode,
      message: sendMsg || `🎫 คูปองพิเศษ! ใช้รหัส ${promo.couponCode || promo.promoCode} รับส่วนลดทันที`,
      target: { type: 'all' },
    });
    alert(`ส่งคูปอง "${promo.name}" ผ่าน ${sendChannel.toUpperCase()} สำเร็จ!`);
    setShowSendModal(false); setSendCouponId(''); setSendMsg('');
  };

  return (
    <View>
      <Text style={cs.pageTitle}>คูปอง / Voucher</Text>
      <Text style={cs.subtitle}>สร้างและจัดการคูปองส่วนลด — เชื่อมกับ Promotion Store และส่งผ่าน LINE/SMS/Push</Text>

      {showForm && (
        <View style={cs.card}>
          <Text style={cs.cardTitle}>สร้างคูปองใหม่</Text>
          <View style={cs.formRow}>
            <Field label="รหัสคูปอง" value={cpCode} onChange={setCpCode} required placeholder="เช่น SAVE20" flex={1} />
            <Field label="คำอธิบาย" value={cpDesc} onChange={setCpDesc} required placeholder="เช่น ลด 20% สมาชิก Gold" flex={2} />
          </View>
          <View style={cs.formRow}>
            <View style={[cs.field, { flex: 1 }]}>
              <Text style={cs.fieldLabel}>ประเภทส่วนลด <Text style={{ color: WebColors.danger }}>*</Text></Text>
              <View style={cs.chipRow}>
                <TouchableOpacity style={[cs.chip, cpType === '%' && cs.chipAct]} onPress={() => setCpType('%')}><Text style={[cs.chipTxt, cpType === '%' && cs.chipTxtAct]}>เปอร์เซ็นต์ (%)</Text></TouchableOpacity>
                <TouchableOpacity style={[cs.chip, cpType === 'Fixed' && cs.chipAct]} onPress={() => setCpType('Fixed')}><Text style={[cs.chipTxt, cpType === 'Fixed' && cs.chipTxtAct]}>จำนวนเงิน (฿)</Text></TouchableOpacity>
              </View>
            </View>
            <Field label={cpType === '%' ? 'ส่วนลด (%)' : 'ส่วนลด (฿)'} value={cpValue} onChange={setCpValue} required placeholder="เช่น 20" flex={1} />
            <Field label="จำนวนจำกัด (ใบ)" value={cpLimit} onChange={setCpLimit} placeholder="เช่น 100" flex={1} />
          </View>
          <View style={cs.formRow}>
            <Field label="ยอดขั้นต่ำ (฿)" value={cpMinSpend} onChange={setCpMinSpend} placeholder="0 = ไม่มีขั้นต่ำ" flex={1} />
            <Field label="วันหมดอายุ" value={cpExpiry} onChange={setCpExpiry} placeholder="YYYY-MM-DD" flex={1} />
            <Field label="ระดับสมาชิก (ว่าง=ทุกคน)" value={cpLevel} onChange={setCpLevel} placeholder="เช่น Gold" flex={1} />
          </View>
          <View style={cs.formFooter}>
            <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => setShowForm(false)}><Text style={{ color: Colors.textSecondary }}>ยกเลิก</Text></TouchableOpacity>
            <TouchableOpacity style={cs.primaryBtn} onPress={handleCreateCoupon}>
              <Ionicons name="checkmark-circle" size={14} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>สร้างคูปอง</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* คูปองจาก Promotion Store */}
      <View style={cs.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={cs.cardTitle}>คูปองจาก Promotion Store ({couponPromos.length})</Text>
        </View>
        <View style={cs.couponGrid}>
          {couponPromos.map((c) => (
            <View key={c.id} style={cs.couponCard}>
              <View style={cs.couponTop}>
                <Text style={cs.couponCode}>{c.couponCode || c.promoCode}</Text>
                <Badge text={c.status === 'active' ? 'Active' : c.status} color={c.status === 'active' ? WebColors.success : Colors.textMuted} bg={c.status === 'active' ? WebColors.successLight : Colors.border} />
              </View>
              <Text style={cs.couponDesc}>{c.name}</Text>
              <Text style={cs.couponMeta}>
                ใช้แล้ว {c.couponUsed ?? c.usageCount}/{c.couponLimit ?? '∞'} · 
                {c.discountPercent ? ` ลด ${c.discountPercent}%` : ` ลด ฿${c.discountAmount}`}
              </Text>
              {/* ปุ่มส่งคูปอง */}
              {c.status === 'active' && (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: WebColors.successLight, borderRadius: 8 }}
                  onPress={() => { setSendCouponId(c.id); setShowSendModal(true); }}
                >
                  <Ionicons name="send" size={12} color={WebColors.success} />
                  <Text style={{ fontSize: 13, color: WebColors.success, fontWeight: '600' }}>ส่งคูปองผ่าน LINE/SMS</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>
      {!showForm && <TouchableOpacity style={cs.primaryBtn} onPress={() => setShowForm(true)}><Ionicons name="add-circle" size={16} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>สร้างคูปองใหม่</Text></TouchableOpacity>}

      {/* Send Coupon Modal */}
      <Modal visible={showSendModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: WebColors.white, borderRadius: 12, padding: 24, width: 440 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 12 }}>📨 ส่งคูปองผ่าน Campaign</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 12 }}>คูปอง: {promotions.find(p => p.id === sendCouponId)?.name}</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 }}>ช่องทาง</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {(['line', 'sms', 'push'] as const).map(ch => (
                <TouchableOpacity
                  key={ch}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: sendChannel === ch ? (ch === 'line' ? WebColors.success : ch === 'sms' ? WebColors.info : WebColors.warning) : Colors.border, backgroundColor: sendChannel === ch ? (ch === 'line' ? WebColors.success + '12' : ch === 'sms' ? WebColors.info + '12' : WebColors.warning + '12') : WebColors.white }}
                  onPress={() => setSendChannel(ch)}
                >
                  <Ionicons name={ch === 'line' ? 'chatbubble-ellipses' : ch === 'sms' ? 'chatbox' : 'notifications'} size={14} color={ch === 'line' ? WebColors.success : ch === 'sms' ? WebColors.info : WebColors.warning} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: ch === 'line' ? WebColors.success : ch === 'sms' ? WebColors.info : WebColors.warning }}>{ch.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 }}>ข้อความ (ไม่บังคับ)</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, fontSize: 13, height: 60, textAlignVertical: 'top', marginBottom: 12 }}
              value={sendMsg} onChangeText={setSendMsg}
              placeholder="ข้อความที่ส่งพร้อมคูปอง..."
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.border }} onPress={() => setShowSendModal(false)}>
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={cs.primaryBtn} onPress={handleSendCoupon}>
                <Ionicons name="send" size={14} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>ส่งคูปอง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. CAMPAIGNS (มีฟอร์มสร้าง)
// ═══════════════════════════════════════════════════════════════════════════════
const CampaignsPanel: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [cName, setCName] = useState(''); const [cChannel, setCChannel] = useState('LINE'); const [cTarget, setCTarget] = useState(''); const [cMsg, setCMsg] = useState('');
  const [cCouponCode, setCCouponCode] = useState('');
  const [cCouponDiscount, setCCouponDiscount] = useState('');
  const [cCouponType, setCCouponType] = useState<'%' | 'Fixed'>('%');
  const { createPromotion } = usePromoStore();
  const { sendCouponCampaign } = useCommunicationStore();

  const campaigns = [
    { name: 'Welcome Series', channel: 'LINE', target: 'สมาชิกใหม่', status: 'Active', sent: 156 },
    { name: 'Birthday Offer', channel: 'SMS', target: 'เกิดเดือนนี้', status: 'Active', sent: 34 },
    { name: 'Win-back', channel: 'Email', target: 'ไม่ซื้อ 30 วัน', status: 'Draft', sent: 0 },
    { name: 'VIP Exclusive', channel: 'LINE', target: 'ระดับ Gold+', status: 'Paused', sent: 89 },
  ];

  const handleCreateCampaign = () => {
    if (!cName.trim()) return;

    // ถ้ามีคูปองแนบ → สร้างโปรโมชั่นจริงเข้า promoStore (POS ใช้ได้ทันที)
    let couponId = '';
    let couponName = '';
    if (cCouponCode.trim() && cCouponDiscount.trim()) {
      const promo = createPromotion({
        promoCode: cCouponCode.toUpperCase(),
        name: `${cName} — คูปอง ${cCouponCode.toUpperCase()}`,
        description: `คูปองจากแคมเปญ "${cName}"`,
        type: 'coupon',
        status: 'active',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        couponCode: cCouponCode.toUpperCase(),
        couponLimit: 500,
        couponUsed: 0,
        discountPercent: cCouponType === '%' ? parseFloat(cCouponDiscount) : undefined,
        discountAmount: cCouponType === 'Fixed' ? parseFloat(cCouponDiscount) : undefined,
        stackable: false,
        priority: 5,
        createdBy: 'admin',
        shopId: 'shop-01',
      });
      couponId = promo.id;
      couponName = promo.name;
    }

    // ส่ง broadcast ผ่าน Communication
    sendCouponCampaign({
      name: cName,
      channel: cChannel.toLowerCase() as any,
      couponId: couponId,
      couponName: couponName,
      couponCode: cCouponCode.toUpperCase(),
      message: cMsg || `🎁 ${cName} — ใช้รหัส ${cCouponCode.toUpperCase()} รับส่วนลดทันที!`,
      target: { type: 'all' },
    });

    alert(`สร้างแคมเปญ "${cName}" สำเร็จ!\n` +
      (couponId ? `✅ คูปอง "${cCouponCode.toUpperCase()}" พร้อมใช้ที่ POS แล้ว\n` : '') +
      `📨 ส่งผ่าน ${cChannel} แล้ว`);

    setShowForm(false); setCName(''); setCMsg(''); setCTarget(''); setCCouponCode(''); setCCouponDiscount('');
  };

  return (
    <View>
      <Text style={cs.pageTitle}>Campaign Marketing</Text>
      <Text style={cs.subtitle}>สร้างแคมเปญส่งข้อความ SMS / LINE / Email ถึงสมาชิก</Text>

      {showForm && (
        <View style={cs.card}>
          <Text style={cs.cardTitle}>สร้างแคมเปญใหม่</Text>
          <View style={cs.formRow}>
            <Field label="ชื่อแคมเปญ" value={cName} onChange={setCName} required flex={1} />
            <View style={[cs.field, { flex: 1 }]}>
              <Text style={cs.fieldLabel}>ช่องทาง <Text style={{ color: WebColors.danger }}>*</Text></Text>
              <View style={cs.chipRow}>
                {['LINE','SMS','Email'].map(ch => <TouchableOpacity key={ch} style={[cs.chip, cChannel === ch && cs.chipAct]} onPress={() => setCChannel(ch)}><Text style={[cs.chipTxt, cChannel === ch && cs.chipTxtAct]}>{ch}</Text></TouchableOpacity>)}
              </View>
            </View>
          </View>
          <View style={cs.formRow}>
            <Field label="กลุ่มเป้าหมาย" value={cTarget} onChange={setCTarget} placeholder="เช่น สมาชิกใหม่, Gold+" flex={1} />
            <Field label="ข้อความ" value={cMsg} onChange={setCMsg} placeholder="เนื้อหาที่จะส่ง..." flex={2} />
          </View>
          {/* แนบคูปอง (สร้างเข้า promoStore → POS ใช้ได้ทันที) */}
          <View style={[cs.card, { backgroundColor: WebColors.warningLight, borderColor: WebColors.warning, marginTop: 8 }]}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: WebColors.warning, marginBottom: 6 }}>🎫 แนบคูปอง (POS ใช้ได้ทันที)</Text>
            <View style={cs.formRow}>
              <Field label="รหัสคูปอง" value={cCouponCode} onChange={setCCouponCode} placeholder="เช่น WELCOME50" flex={1} />
              <View style={[cs.field, { flex: 1 }]}>
                <Text style={cs.fieldLabel}>ประเภท</Text>
                <View style={cs.chipRow}>
                  <TouchableOpacity style={[cs.chip, cCouponType === '%' && cs.chipAct]} onPress={() => setCCouponType('%')}><Text style={[cs.chipTxt, cCouponType === '%' && cs.chipTxtAct]}>%</Text></TouchableOpacity>
                  <TouchableOpacity style={[cs.chip, cCouponType === 'Fixed' && cs.chipAct]} onPress={() => setCCouponType('Fixed')}><Text style={[cs.chipTxt, cCouponType === 'Fixed' && cs.chipTxtAct]}>฿</Text></TouchableOpacity>
                </View>
              </View>
              <Field label="ส่วนลด" value={cCouponDiscount} onChange={setCCouponDiscount} placeholder={cCouponType === '%' ? 'เช่น 20' : 'เช่น 50'} flex={1} />
            </View>
            <Text style={{ fontSize: 10, color: WebColors.warning }}>ถ้ากรอกรหัส+ส่วนลด → ระบบสร้างคูปองจริง ใช้ได้ที่ POS ทันที (หมดอายุ 90 วัน)</Text>
          </View>
          <View style={cs.formFooter}>
            <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => setShowForm(false)}><Text style={{ color: Colors.textSecondary }}>ยกเลิก</Text></TouchableOpacity>
            <TouchableOpacity style={cs.primaryBtn} onPress={handleCreateCampaign}>
              <Ionicons name="send" size={14} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>สร้างแคมเปญ</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={cs.card}>
        {campaigns.map((c, i) => (
          <View key={i} style={[cs.tr, i % 2 === 1 && cs.trAlt]}>
            <Text style={[cs.td, { flex: 1.5, fontWeight: '600' }]}>{c.name}</Text>
            <View style={cs.td}><Badge text={c.channel} color="#1976D2" bg="#E3F2FD" /></View>
            <Text style={cs.td}>{c.target}</Text>
            <View style={cs.td}><Badge text={c.status} color={c.status === 'Active' ? WebColors.success : c.status === 'Draft' ? Colors.textSecondary : WebColors.warning} bg={c.status === 'Active' ? WebColors.successLight : c.status === 'Draft' ? Colors.border : WebColors.warningLight} /></View>
            <Text style={cs.td}>{c.sent} sent</Text>
          </View>
        ))}
      </View>
      {!showForm && <TouchableOpacity style={cs.primaryBtn} onPress={() => setShowForm(true)}><Ionicons name="add-circle" size={16} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>สร้างแคมเปญใหม่</Text></TouchableOpacity>}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6.5. COMMUNICATION (LINE Broadcast, SMS, Push — สรุปภาพรวม + ลิงก์ไปหน้าหลัก)
// ═══════════════════════════════════════════════════════════════════════════════
const CommunicationPanel: React.FC = () => {
  const { stats, broadcasts, contacts, sendCouponCampaign } = useCommunicationStore();
  const { promotions } = usePromoStore();
  const recentBroadcasts = broadcasts.filter(b => b.status === 'sent').slice(0, 3);
  const activeCoupons = promotions.filter(p => p.status === 'active' && (p.type === 'coupon' || p.couponCode));
  const [quickCouponId, setQuickCouponId] = useState('');

  const handleQuickSend = () => {
    const promo = promotions.find(p => p.id === quickCouponId);
    if (!promo) { alert('เลือกคูปองก่อน'); return; }
    sendCouponCampaign({
      name: `Quick Send: ${promo.couponCode || promo.promoCode}`,
      channel: 'line',
      couponId: promo.id,
      couponName: promo.name,
      couponCode: promo.couponCode || promo.promoCode,
      message: `🎫 คุณได้รับคูปอง ${promo.couponCode || promo.promoCode}! ${promo.name}`,
      target: { type: 'all' },
    });
    alert(`ส่งคูปอง "${promo.name}" ผ่าน LINE สำเร็จ!`);
    setQuickCouponId('');
  };

  return (
    <View>
      <Text style={cs.pageTitle}>Communication Hub</Text>
      <Text style={cs.subtitle}>ส่งข้อความ / คูปอง ผ่าน LINE Broadcast, SMS, Push Notification</Text>

      {/* Quick Stats */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <View style={{ backgroundColor: WebColors.white, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', minWidth: 110 }}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#06C755" />
          <Text style={{ fontSize: 13, fontWeight: '700', marginTop: 4 }}>{stats.totalLineFriends.toLocaleString()}</Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>LINE Friends</Text>
        </View>
        <View style={{ backgroundColor: WebColors.white, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', minWidth: 110 }}>
          <Ionicons name="megaphone" size={20} color="#FF9800" />
          <Text style={{ fontSize: 13, fontWeight: '700', marginTop: 4 }}>{stats.broadcastThisMonth}</Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Broadcast เดือนนี้</Text>
        </View>
        <View style={{ backgroundColor: WebColors.white, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', minWidth: 110 }}>
          <Ionicons name="ticket" size={20} color="#2196F3" />
          <Text style={{ fontSize: 13, fontWeight: '700', marginTop: 4 }}>{stats.broadcastQuotaLeft}</Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Quota เหลือ</Text>
        </View>
        <View style={{ backgroundColor: WebColors.white, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', minWidth: 110 }}>
          <Ionicons name="eye" size={20} color="#00BCD4" />
          <Text style={{ fontSize: 13, fontWeight: '700', marginTop: 4 }}>{stats.avgOpenRate}%</Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Open Rate</Text>
        </View>
        <View style={{ backgroundColor: WebColors.white, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', minWidth: 110 }}>
          <Ionicons name="chatbox" size={20} color="#9C27B0" />
          <Text style={{ fontSize: 13, fontWeight: '700', marginTop: 4 }}>{stats.smsCredits.toLocaleString()}</Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>SMS Credit</Text>
        </View>
      </View>

      {/* Quick Send Coupon */}
      <View style={cs.card}>
        <Text style={cs.cardTitle}>⚡ ส่งคูปองด่วน (LINE Broadcast)</Text>
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 8 }}>เลือกคูปองจาก Promotion Store แล้วส่งให้ LINE Friends ทั้งหมด</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {activeCoupons.map(c => (
            <TouchableOpacity
              key={c.id}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: quickCouponId === c.id ? WebColors.success : Colors.border, backgroundColor: quickCouponId === c.id ? WebColors.success + '12' : Colors.background }}
              onPress={() => setQuickCouponId(c.id)}
            >
              <Ionicons name="pricetag" size={12} color={quickCouponId === c.id ? WebColors.success : Colors.textSecondary} />
              <Text style={{ fontSize: 13, color: quickCouponId === c.id ? WebColors.success : Colors.textSecondary, fontWeight: quickCouponId === c.id ? '600' : '400' }} numberOfLines={1}>
                {c.couponCode || c.promoCode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[cs.primaryBtn, { alignSelf: 'flex-start' }]} onPress={handleQuickSend}>
          <Ionicons name="send" size={14} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>ส่งผ่าน LINE</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Broadcasts */}
      <View style={cs.card}>
        <Text style={cs.cardTitle}>📨 Broadcast ล่าสุด</Text>
        {recentBroadcasts.map(b => (
          <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <Ionicons name={b.channel === 'line' ? 'chatbubble-ellipses' : b.channel === 'sms' ? 'chatbox' : 'notifications'} size={16} color={b.channel === 'line' ? WebColors.success : b.channel === 'sms' ? WebColors.info : WebColors.warning} />
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '500' }}>{b.name}</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary }}>ส่ง {b.sentCount.toLocaleString()} · เปิด {b.openCount.toLocaleString()}</Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>{b.sentAt ? new Date(b.sentAt).toLocaleDateString('th-TH') : ''}</Text>
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 8 }}>
        💡 สำหรับจัดการ Broadcast, Contacts, Templates เต็มรูปแบบ ไปที่เมนู "Communication" บน Sidebar หลัก
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. GAMIFICATION (มีฟอร์มสร้าง)
// ═══════════════════════════════════════════════════════════════════════════════
const GamificationPanel: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [gName, setGName] = useState(''); const [gType, setGType] = useState('Wheel'); const [gReward, setGReward] = useState('');

  const games = [
    { name: 'วงล้อนำโชค', type: 'Wheel', status: 'Active', plays: 345 },
    { name: 'สุ่มกล่องรางวัล', type: 'Lucky Box', status: 'Active', plays: 128 },
    { name: 'Check-in รับแต้ม', type: 'Check-in', status: 'Active', plays: 890 },
    { name: 'Scratch Card ปีใหม่', type: 'Scratch', status: 'Ended', plays: 500 },
  ];

  return (
    <View>
      <Text style={cs.pageTitle}>Gamification</Text>
      <Text style={cs.subtitle}>สร้างเกมส์และกิจกรรมเพื่อดึงดูดลูกค้า (Wheel of Fortune, สุ่มรางวัล, Check-in)</Text>

      {showForm && (
        <View style={cs.card}>
          <Text style={cs.cardTitle}>สร้างเกมใหม่</Text>
          <View style={cs.formRow}>
            <Field label="ชื่อเกม" value={gName} onChange={setGName} required flex={1} />
            <View style={[cs.field, { flex: 1 }]}>
              <Text style={cs.fieldLabel}>ประเภท <Text style={{ color: WebColors.danger }}>*</Text></Text>
              <View style={cs.chipRow}>
                {['Wheel','Lucky Box','Check-in','Scratch','Quiz'].map(t => <TouchableOpacity key={t} style={[cs.chip, gType === t && cs.chipAct]} onPress={() => setGType(t)}><Text style={[cs.chipTxt, gType === t && cs.chipTxtAct]}>{t}</Text></TouchableOpacity>)}
              </View>
            </View>
          </View>
          <Field label="รางวัล (เช่น 50 แต้ม, คูปอง ลด 20%)" value={gReward} onChange={setGReward} placeholder="ระบุรางวัล" />
          <View style={cs.formFooter}>
            <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => setShowForm(false)}><Text style={{ color: Colors.textSecondary }}>ยกเลิก</Text></TouchableOpacity>
            <TouchableOpacity style={cs.primaryBtn} onPress={() => { alert('สร้างเกม "' + gName + '" (' + gType + ') สำเร็จ!'); setShowForm(false); setGName(''); setGReward(''); }}>
              <Ionicons name="game-controller" size={14} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>สร้างเกม</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={cs.card}>
        <View style={cs.couponGrid}>
          {games.map((g, i) => (
            <View key={i} style={cs.couponCard}>
              <View style={cs.couponTop}><Text style={cs.couponCode}>{g.name}</Text><Badge text={g.status} color={g.status === 'Active' ? WebColors.success : Colors.textMuted} bg={g.status === 'Active' ? WebColors.successLight : Colors.border} /></View>
              <Text style={cs.couponDesc}>ประเภท: {g.type}</Text>
              <Text style={cs.couponMeta}>เล่นแล้ว {g.plays} ครั้ง</Text>
            </View>
          ))}
        </View>
      </View>
      {!showForm && <TouchableOpacity style={cs.primaryBtn} onPress={() => setShowForm(true)}><Ionicons name="add-circle" size={16} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>สร้างเกมใหม่</Text></TouchableOpacity>}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 8. SEGMENTS
// ═══════════════════════════════════════════════════════════════════════════════
const SegmentsPanel: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [segName, setSegName] = useState('');
  const [segRule, setSegRule] = useState('');
  const CONDITION_TYPES = [
    { id: 'total_spend', label: 'ยอดซื้อ', unit: 'บาท' },
    { id: 'register_days', label: 'สมัคร', unit: 'วัน' },
    { id: 'last_purchase', label: 'ซื้อครั้งสุด', unit: 'วัน' },
    { id: 'purchase_count', label: 'ซื้อ (ครั้ง/เดือน)', unit: 'ครั้ง' },
    { id: 'birthday', label: 'วันเกิดเดือนนี้', unit: '' },
    { id: 'level', label: 'ระดับสมาชิก', unit: '' },
    { id: 'wallet', label: 'Wallet', unit: 'บาท' },
    { id: 'coupon_used', label: 'ใช้คูปอง', unit: 'ครั้ง' },
    { id: 'category_buy', label: 'ซื้อหมวดสินค้า', unit: 'ครั้ง' },
  ];
  const OPERATORS = ['>', '<', '=', '≥', '≤'];
  const [condType, setCondType] = useState('');
  const [condOp, setCondOp] = useState('>');
  const [condValue, setCondValue] = useState('');
  const [segments, setSegments] = useState([
    { name: 'ลูกค้า VIP', rule: 'ยอดซื้อ > 50,000', count: 24 },
    { name: 'ลูกค้าใหม่ (30 วัน)', rule: 'สมัคร < 30 วัน', count: 8 },
    { name: 'ไม่กลับมา 60 วัน', rule: 'ซื้อล่าสุด > 60 วัน', count: 15 },
    { name: 'วันเกิดเดือนนี้', rule: 'เกิดเดือนปัจจุบัน', count: 3 },
  ]);

  const handleAdd = () => {
    if (!segName.trim()) { alert('กรุณากรอกชื่อ Segment'); return; }
    if (!condType) { alert('กรุณาเลือกเงื่อนไข'); return; }
    const ct = CONDITION_TYPES.find(c => c.id === condType);
    const rule = ct?.unit ? `${ct.label} ${condOp} ${condValue || '?'} ${ct.unit}` : ct?.label || '';
    setSegments(prev => [...prev, { name: segName, rule, count: 0 }]);
    setSegName(''); setCondType(''); setCondOp('>'); setCondValue(''); setSegRule(''); setShowForm(false);
  };

  return (
    <View>
      <Text style={cs.pageTitle}>Segment ลูกค้า</Text>
      <Text style={cs.subtitle}>แบ่งกลุ่มลูกค้าอัตโนมัติตามพฤติกรรม — สร้างเงื่อนไขเอง</Text>

      {showForm && (
        <View style={cs.card}>
          <Text style={cs.cardTitle}>สร้าง Segment ใหม่</Text>
          <View style={cs.formRow}>
            <Field label="ชื่อ Segment" value={segName} onChange={setSegName} required placeholder="เช่น ลูกค้า VIP" flex={1} />
          </View>
          <Text style={cs.fieldLabel}>เงื่อนไข <Text style={{ color: WebColors.danger }}>*</Text></Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            {/* เลือกประเภทเงื่อนไข */}
            <View style={{ borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, overflow: 'hidden' }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 400 }}>
                <View style={{ flexDirection: 'row' }}>
                  {CONDITION_TYPES.map(ct => (
                    <TouchableOpacity key={ct.id} style={[cs.chip, condType === ct.id && { backgroundColor: WebColors.primary, borderColor: WebColors.primary }]} onPress={() => setCondType(ct.id)}>
                      <Text style={[cs.chipTxt, condType === ct.id && cs.chipTxtAct]}>{ct.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
          {condType && CONDITION_TYPES.find(c => c.id === condType)?.unit && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              {/* Operator */}
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {OPERATORS.map(op => (
                  <TouchableOpacity key={op} style={[cs.chip, { minWidth: 32, alignItems: 'center' }, condOp === op && { backgroundColor: WebColors.purple, borderColor: WebColors.purple }]} onPress={() => setCondOp(op)}>
                    <Text style={[cs.chipTxt, { fontSize: 14, fontWeight: '700' }, condOp === op && cs.chipTxtAct]}>{op}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Value */}
              <TextInput style={[cs.fieldInput, { width: 100 }]} value={condValue} onChangeText={setCondValue} placeholder="ค่า" placeholderTextColor={WebColors.gray300} keyboardType="numeric" />
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{CONDITION_TYPES.find(c => c.id === condType)?.unit}</Text>
            </View>
          )}
          {condType && !CONDITION_TYPES.find(c => c.id === condType)?.unit && (
            <Text style={{ fontSize: 11, color: WebColors.success, marginBottom: 8 }}>เงื่อนไข: {CONDITION_TYPES.find(c => c.id === condType)?.label}</Text>
          )}
          <View style={cs.formFooter}>
            <TouchableOpacity onPress={() => setShowForm(false)}><Text style={{ color: Colors.textSecondary }}>ยกเลิก</Text></TouchableOpacity>
            <TouchableOpacity style={cs.primaryBtn} onPress={handleAdd}><Ionicons name="checkmark-circle" size={14} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>สร้าง Segment</Text></TouchableOpacity>
          </View>
        </View>
      )}

      <View style={cs.card}>
        <View style={cs.table}>
          <View style={cs.thead}>{['Segment', 'เงื่อนไข', 'จำนวน', 'จัดการ'].map((h, i) => <Text key={i} style={[cs.th, i === 1 && { flex: 2 }]}>{h}</Text>)}</View>
          {segments.map((seg, i) => (
            <View key={i} style={[cs.tr, i % 2 === 1 && cs.trAlt]}>
              <Text style={[cs.td, { fontWeight: '600' }]}>{seg.name}</Text>
              <Text style={[cs.td, { flex: 2 }]}>{seg.rule}</Text>
              <Text style={cs.td}>{seg.count} คน</Text>
              <View style={[cs.td, { flexDirection: 'row', gap: 8 }]}>
                <TouchableOpacity onPress={() => { const newRule = prompt('แก้ไขเงื่อนไข:', seg.rule); if (newRule) setSegments(prev => prev.map((s, idx) => idx === i ? { ...s, rule: newRule } : s)); }}>
                  <Ionicons name="create-outline" size={14} color={WebColors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { if (confirm('ลบ Segment "' + seg.name + '"?')) setSegments(prev => prev.filter((_, idx) => idx !== i)); }}>
                  <Ionicons name="trash-outline" size={14} color={WebColors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
      {!showForm && <TouchableOpacity style={cs.primaryBtn} onPress={() => setShowForm(true)}><Ionicons name="add-circle" size={16} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>สร้าง Segment ใหม่</Text></TouchableOpacity>}
    </View>
  );
};

// 9-12: Simple placeholders
const HistoryPanel: React.FC = () => {
  const { sales } = useSaleHistoryStore();
  const memberSales = sales.filter(s => s.memberName);
  const totalAmount = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const fmt = (n: number) => n.toLocaleString();
  const fmtDate = (d: Date) => new Date(d).toLocaleDateString('th-TH');

  return (
    <View>
      <Text style={cs.pageTitle}>ประวัติการซื้อ</Text>
      <Text style={cs.subtitle}>ดูประวัติการซื้อของสมาชิกแต่ละคน + ยอดรวมทั้งระบบ</Text>

      <View style={cs.kpiRow}>
        <KPI label="ยอดซื้อรวมทั้งหมด" value={`฿${fmt(totalAmount)}`} color={WebColors.primary} />
        <KPI label="บิลทั้งหมด" value={`${sales.length} บิล`} color={WebColors.info} />
        <KPI label="บิลที่มีสมาชิก" value={`${memberSales.length} บิล`} color={WebColors.success} />
        <KPI label="เฉลี่ย/บิล" value={sales.length > 0 ? `฿${fmt(Math.round(totalAmount / sales.length))}` : '—'} color={WebColors.purple} />
      </View>

      <View style={cs.card}>
        <Text style={cs.cardTitle}>รายการบิลล่าสุด ({sales.length} รายการ)</Text>
        <View style={cs.table}>
          <View style={cs.thead}>
            {['เลขบิล', 'วันที่', 'ยอดรวม', 'ชำระ', 'สมาชิก', 'พนักงาน', 'สถานะ'].map((h, i) => (
              <Text key={i} style={[cs.th, i === 0 && { flex: 1.5 }]}>{h}</Text>
            ))}
          </View>
          {sales.slice(0, 20).map((sale, i) => (
            <View key={sale.id} style={[cs.tr, i % 2 === 1 && cs.trAlt]}>
              <Text style={[cs.td, { flex: 1.5, color: WebColors.primary, fontWeight: '600' }]}>{sale.saleNo}</Text>
              <Text style={cs.td}>{fmtDate(sale.createdAt)}</Text>
              <Text style={[cs.td, { fontWeight: '700' }]}>฿{fmt(sale.grandTotal)}</Text>
              <Text style={cs.td}>{sale.payments.map(p => p.method === 'cash' ? 'เงินสด' : p.method === 'qr' ? 'QR' : p.method === 'credit' ? 'บัตร' : 'โอน').join('+')}</Text>
              <Text style={cs.td}>{sale.memberName || '—'}</Text>
              <Text style={cs.td}>{sale.cashierName}</Text>
              <Text style={[cs.td, { color: sale.status === 'completed' ? WebColors.success : WebColors.danger, fontWeight: '600' }]}>
                {sale.status === 'completed' ? 'สำเร็จ' : sale.status === 'voided' ? 'ยกเลิก' : 'คืน'}
              </Text>
            </View>
          ))}
          {sales.length === 0 && <Text style={{ padding: 16, textAlign: 'center', color: Colors.textSecondary, fontSize: 12 }}>ยังไม่มีข้อมูลการขาย</Text>}
        </View>
      </View>
    </View>
  );
};
const WalletPanel: React.FC = () => {
  const { members } = useMemberStore();
  const [selectedId, setSelectedId] = useState('');
  const [action, setAction] = useState<'topup' | 'deduct'>('topup');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([
    { date: '22/06/67', member: 'สมชาย ใจดี', type: 'topup', amount: 1000, note: 'เติมเงิน', bal: 3500 },
    { date: '21/06/67', member: 'สภาพร แสงทอง', type: 'deduct', amount: 200, note: 'ชำระค่าสินค้า', bal: 1800 },
    { date: '20/06/67', member: 'สมชาย ใจดี', type: 'topup', amount: 2000, note: 'เติมเงินครั้งแรก', bal: 2500 },
    { date: '19/06/67', member: 'วิชัย ศรีสุข', type: 'topup', amount: 500, note: 'เติมเงิน', bal: 500 },
  ]);

  const filtered = members.filter(m => !search || `${m.name} ${m.memberNo} ${m.phone}`.toLowerCase().includes(search.toLowerCase()));
  const selMember = members.find(m => m.id === selectedId);

  const handleSubmit = () => {
    if (!selectedId) { alert('กรุณาเลือกสมาชิก'); return; }
    if (!amount || parseInt(amount) <= 0) { alert('กรุณากรอกจำนวนเงิน'); return; }
    const mem = members.find(m => m.id === selectedId);
    setHistory(prev => [{ date: new Date().toLocaleDateString('th-TH'), member: mem?.name || '', type: action, amount: parseInt(amount), note: note || (action === 'topup' ? 'เติมเงิน' : 'ใช้เงิน'), bal: action === 'topup' ? 4500 : 3300 }, ...prev]);
    alert(`${action === 'topup' ? 'เติมเงิน' : 'หักเงิน'} ฿${amount} ให้ ${mem?.name} เรียบร้อย`);
    setAmount(''); setNote('');
  };

  return (
    <View>
      <Text style={cs.pageTitle}>Wallet / Credit</Text>
      <Text style={cs.subtitle}>ระบบเติมเงิน/เครดิตสำหรับสมาชิก — ใช้จ่ายแทนเงินสดที่ร้าน</Text>

      <View style={cs.kpiRow}>
        <KPI label="ยอด Wallet รวม" value="฿85,000" color={WebColors.purple} />
        <KPI label="สมาชิกที่มี Wallet" value="45 คน" color={WebColors.info} />
        <KPI label="เติมเดือนนี้" value="฿12,500" color={WebColors.success} />
        <KPI label="ใช้เดือนนี้" value="฿8,200" color={WebColors.warning} />
      </View>

      {/* Form */}
      <View style={cs.card}>
        <Text style={cs.cardTitle}>เติมเงิน / หักเงิน</Text>
        <View style={cs.field}>
          <Text style={cs.fieldLabel}>ค้นหาสมาชิก</Text>
          <TextInput style={cs.fieldInput} value={search} onChangeText={setSearch} placeholder="ชื่อ, เบอร์, รหัส..." placeholderTextColor={WebColors.gray300} />
        </View>
        {search.trim() !== '' && (
          <View style={{ maxHeight: 100, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginBottom: 8 }}>
            <ScrollView nestedScrollEnabled>
              {filtered.slice(0, 5).map(m => (
                <TouchableOpacity key={m.id} style={{ paddingVertical: 6, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: selectedId === m.id ? '#EFF6FF' : WebColors.white }} onPress={() => { setSelectedId(m.id); setSearch(m.name); }}>
                  <Text style={{ fontSize: 13, fontWeight: '600' }}>{m.name} <Text style={{ color: Colors.textMuted, fontWeight: '400' }}>{m.memberNo}</Text></Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {selMember && <Text style={{ fontSize: 13, color: WebColors.success, marginBottom: 8 }}>เลือก: {selMember.name} ({selMember.memberNo})</Text>}

        <View style={cs.field}>
          <Text style={cs.fieldLabel}>ประเภท</Text>
          <View style={cs.chipRow}>
            <TouchableOpacity style={[cs.chip, action === 'topup' && { backgroundColor: WebColors.success, borderColor: WebColors.success }]} onPress={() => setAction('topup')}><Text style={[cs.chipTxt, action === 'topup' && cs.chipTxtAct]}>+ เติมเงิน</Text></TouchableOpacity>
            <TouchableOpacity style={[cs.chip, action === 'deduct' && { backgroundColor: WebColors.danger, borderColor: WebColors.danger }]} onPress={() => setAction('deduct')}><Text style={[cs.chipTxt, action === 'deduct' && cs.chipTxtAct]}>- หักเงิน/ใช้เงิน</Text></TouchableOpacity>
          </View>
        </View>
        <View style={cs.formRow}>
          <Field label="จำนวนเงิน (฿)" value={amount} onChange={setAmount} placeholder="เช่น 1000" required flex={1} />
          <Field label="หมายเหตุ" value={note} onChange={setNote} placeholder="เช่น เติมเงิน, ชำระค่าสินค้า" flex={2} />
        </View>
        <View style={cs.formFooter}>
          <TouchableOpacity style={cs.primaryBtn} onPress={handleSubmit}><Ionicons name={action === 'topup' ? 'add-circle' : 'remove-circle'} size={14} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>{action === 'topup' ? 'เติมเงิน' : 'หักเงิน'}</Text></TouchableOpacity>
        </View>
      </View>

      {/* History */}
      <View style={cs.card}>
        <Text style={cs.cardTitle}>ประวัติ Wallet ล่าสุด</Text>
        <View style={cs.table}>
          <View style={cs.thead}>{['วันที่', 'สมาชิก', 'ประเภท', 'จำนวน', 'หมายเหตุ', 'คงเหลือ'].map((h, i) => <Text key={i} style={cs.th}>{h}</Text>)}</View>
          {history.map((h, i) => (
            <View key={i} style={[cs.tr, i % 2 === 1 && cs.trAlt]}>
              <Text style={cs.td}>{h.date}</Text>
              <Text style={[cs.td, { fontWeight: '600' }]}>{h.member}</Text>
              <View style={cs.td}><Badge text={h.type === 'topup' ? 'เติม' : 'ใช้'} color={h.type === 'topup' ? WebColors.success : WebColors.danger} bg={h.type === 'topup' ? WebColors.successLight : WebColors.dangerLight} /></View>
              <Text style={[cs.td, { fontWeight: '700', color: h.type === 'topup' ? WebColors.success : WebColors.danger }]}>{h.type === 'topup' ? '+' : '-'}฿{h.amount.toLocaleString()}</Text>
              <Text style={cs.td}>{h.note}</Text>
              <Text style={[cs.td, { fontWeight: '600' }]}>฿{h.bal.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
const ReportsPanel: React.FC = () => (
  <View>
    <Text style={cs.pageTitle}>รายงาน CRM</Text>
    <Text style={cs.subtitle}>Dashboard สรุปผลการดำเนินงาน CRM ประจำเดือน</Text>

    {/* KPI Row */}
    <View style={cs.kpiRow}>
      <KPI label="Member Retention" value="78%" color={WebColors.success} />
      <KPI label="Avg. Lifetime Value" value="฿12,500" color={WebColors.purple} />
      <KPI label="Active Rate" value="85%" color={WebColors.info} />
      <KPI label="Redeem Rate" value="42%" color={WebColors.warning} />
      <KPI label="สมาชิกทั้งหมด" value="1,250" color={WebColors.primary} />
    </View>

    {/* สรุปแต้ม */}
    <View style={cs.card}>
      <Text style={cs.cardTitle}>สรุปคะแนนสะสม (เดือนนี้)</Text>
      <View style={cs.table}>
        <View style={cs.thead}>{['รายการ', 'จำนวน (แต้ม)', 'ธุรกรรม', 'เฉลี่ย/ครั้ง'].map((h, i) => <Text key={i} style={cs.th}>{h}</Text>)}</View>
        {[
          { label: 'แต้มที่แจก', pts: '38,500', txn: '1,250', avg: '30.8' },
          { label: 'แต้มที่ใช้/แลก', pts: '12,800', txn: '320', avg: '40.0' },
          { label: 'แต้มหมดอายุ', pts: '5,200', txn: '—', avg: '—' },
          { label: 'แต้มคงเหลือรวม', pts: '285,000', txn: '—', avg: '228/คน' },
        ].map((r, i) => (
          <View key={i} style={[cs.tr, i % 2 === 1 && cs.trAlt]}>
            <Text style={[cs.td, { fontWeight: '600' }]}>{r.label}</Text>
            <Text style={cs.td}>{r.pts}</Text>
            <Text style={cs.td}>{r.txn}</Text>
            <Text style={cs.td}>{r.avg}</Text>
          </View>
        ))}
      </View>
    </View>

    {/* สรุประดับสมาชิก */}
    <View style={cs.card}>
      <Text style={cs.cardTitle}>สมาชิกแยกตามระดับ</Text>
      <View style={cs.table}>
        <View style={cs.thead}>{['ระดับ', 'จำนวน (คน)', 'สัดส่วน', 'ยอดซื้อเฉลี่ย', 'อัปเกรดเดือนนี้'].map((h, i) => <Text key={i} style={cs.th}>{h}</Text>)}</View>
        {[
          { level: 'Member', count: '820', pct: '65.6%', avg: '฿2,500', up: '—' },
          { level: 'Silver', count: '250', pct: '20.0%', avg: '฿8,500', up: '+12' },
          { level: 'Gold', count: '120', pct: '9.6%', avg: '฿22,000', up: '+5' },
          { level: 'Platinum', count: '45', pct: '3.6%', avg: '฿55,000', up: '+2' },
          { level: 'VIP', count: '15', pct: '1.2%', avg: '฿120,000', up: '+1' },
        ].map((r, i) => (
          <View key={i} style={[cs.tr, i % 2 === 1 && cs.trAlt]}>
            <Text style={[cs.td, { fontWeight: '600' }]}>{r.level}</Text>
            <Text style={cs.td}>{r.count}</Text>
            <Text style={cs.td}>{r.pct}</Text>
            <Text style={cs.td}>{r.avg}</Text>
            <Text style={[cs.td, { color: WebColors.success, fontWeight: '600' }]}>{r.up}</Text>
          </View>
        ))}
      </View>
    </View>

    {/* คูปอง */}
    <View style={cs.card}>
      <Text style={cs.cardTitle}>รายงานคูปอง (เดือนนี้)</Text>
      <View style={cs.table}>
        <View style={cs.thead}>{['คูปอง', 'แจกไป', 'ใช้แล้ว', 'ส่วนลดรวม', 'Conversion'].map((h, i) => <Text key={i} style={cs.th}>{h}</Text>)}</View>
        {[
          { code: 'WELCOME50', issued: 100, used: 23, discount: '฿1,150', conv: '23%' },
          { code: 'BIRTH20', issued: 50, used: 8, discount: '฿960', conv: '16%' },
          { code: 'VIP100', issued: 30, used: 5, discount: '฿500', conv: '17%' },
          { code: 'NEWYEAR', issued: 200, used: 200, discount: '฿18,000', conv: '100%' },
        ].map((r, i) => (
          <View key={i} style={[cs.tr, i % 2 === 1 && cs.trAlt]}>
            <Text style={[cs.td, { fontWeight: '700', color: WebColors.primary }]}>{r.code}</Text>
            <Text style={cs.td}>{r.issued}</Text>
            <Text style={cs.td}>{r.used}</Text>
            <Text style={cs.td}>{r.discount}</Text>
            <Text style={[cs.td, { fontWeight: '600' }]}>{r.conv}</Text>
          </View>
        ))}
      </View>
    </View>

    {/* สมาชิกใหม่รายเดือน */}
    <View style={cs.card}>
      <Text style={cs.cardTitle}>สมาชิกใหม่ (6 เดือนล่าสุด)</Text>
      <View style={cs.table}>
        <View style={cs.thead}>{['เดือน', 'สมาชิกใหม่', 'Active', 'ยอดซื้อรวม', 'Retention'].map((h, i) => <Text key={i} style={cs.th}>{h}</Text>)}</View>
        {[
          { month: 'ม.ค. 67', newMem: 45, active: 42, spent: '฿125,000', ret: '93%' },
          { month: 'ก.พ. 67', newMem: 38, active: 35, spent: '฿98,000', ret: '92%' },
          { month: 'มี.ค. 67', newMem: 52, active: 48, spent: '฿156,000', ret: '92%' },
          { month: 'เม.ย. 67', newMem: 60, active: 54, spent: '฿180,000', ret: '90%' },
          { month: 'พ.ค. 67', newMem: 55, active: 50, spent: '฿165,000', ret: '91%' },
          { month: 'มิ.ย. 67', newMem: 48, active: 46, spent: '฿142,000', ret: '96%' },
        ].map((r, i) => (
          <View key={i} style={[cs.tr, i % 2 === 1 && cs.trAlt]}>
            <Text style={[cs.td, { fontWeight: '600' }]}>{r.month}</Text>
            <Text style={cs.td}>{r.newMem}</Text>
            <Text style={[cs.td, { color: WebColors.success }]}>{r.active}</Text>
            <Text style={cs.td}>{r.spent}</Text>
            <Text style={[cs.td, { fontWeight: '600', color: WebColors.info }]}>{r.ret}</Text>
          </View>
        ))}
      </View>
    </View>

    {/* Campaign Performance */}
    <View style={cs.card}>
      <Text style={cs.cardTitle}>ผลแคมเปญ (เดือนนี้)</Text>
      <View style={cs.table}>
        <View style={cs.thead}>{['แคมเปญ', 'ช่องทาง', 'ส่งแล้ว', 'เปิดอ่าน', 'กดลิงก์', 'ยอดขาย'].map((h, i) => <Text key={i} style={cs.th}>{h}</Text>)}</View>
        {[
          { name: 'Welcome Series', ch: 'LINE', sent: 156, open: '82%', click: '45%', sales: '฿28,500' },
          { name: 'Birthday Offer', ch: 'SMS', sent: 34, open: '95%', click: '62%', sales: '฿15,200' },
          { name: 'Win-back', ch: 'Email', sent: 89, open: '35%', click: '12%', sales: '฿5,800' },
          { name: 'VIP Exclusive', ch: 'LINE', sent: 15, open: '100%', click: '73%', sales: '฿42,000' },
        ].map((r, i) => (
          <View key={i} style={[cs.tr, i % 2 === 1 && cs.trAlt]}>
            <Text style={[cs.td, { fontWeight: '600' }]}>{r.name}</Text>
            <View style={cs.td}><Badge text={r.ch} color="#1976D2" bg="#E3F2FD" /></View>
            <Text style={cs.td}>{r.sent}</Text>
            <Text style={cs.td}>{r.open}</Text>
            <Text style={cs.td}>{r.click}</Text>
            <Text style={[cs.td, { fontWeight: '700', color: WebColors.success }]}>{r.sales}</Text>
          </View>
        ))}
      </View>
    </View>
  </View>
);
const SettingsPanel: React.FC = () => {
  const [lineOaId, setLineOaId] = useState('@shopname');
  const [lineToken, setLineToken] = useState('');
  const [eCardEnabled, setECardEnabled] = useState(true);
  const [notifyPoints, setNotifyPoints] = useState(true);
  const [notifyLevel, setNotifyLevel] = useState(true);
  const [notifyCoupon, setNotifyCoupon] = useState(true);
  const [notifyBirthday, setNotifyBirthday] = useState(true);

  return (
    <View>
      <Text style={cs.pageTitle}>ตั้งค่า CRM</Text>
      <Text style={cs.subtitle}>ตั้งค่าทั่วไปของระบบ CRM และการเชื่อมต่อ LINE</Text>

      {/* LINE OA Connection */}
      <View style={cs.card}>
        <Text style={cs.cardTitle}>เชื่อมต่อ LINE Official Account</Text>
        <Text style={cs.subtitle}>เชื่อม LINE OA เพื่อส่งข้อความ, บัตรดิจิทัล, แจ้งเตือนถึงลูกค้าผ่าน LINE</Text>
        <View style={cs.formRow}>
          <Field label="LINE OA ID" value={lineOaId} onChange={setLineOaId} placeholder="@yourshop" flex={1} />
          <Field label="Channel Access Token" value={lineToken} onChange={setLineToken} placeholder="ใส่ Token จาก LINE Developer Console" flex={2} />
        </View>
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>* ได้ Token จาก LINE Developers → Messaging API → Channel Access Token</Text>
        <TouchableOpacity style={[cs.primaryBtn, { marginTop: 12 }]} onPress={() => alert('ทดสอบเชื่อมต่อ LINE OA สำเร็จ!')}><Ionicons name="logo-linkedin" size={14} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>ทดสอบเชื่อมต่อ</Text></TouchableOpacity>
      </View>

      {/* Digital Card */}
      <View style={cs.card}>
        <Text style={cs.cardTitle}>บัตรสมาชิกดิจิทัล (e-Card)</Text>
        <Text style={cs.subtitle}>เปิดใช้ e-Card สำหรับสมาชิก — แสดงบน LINE Rich Menu หรือ LIFF App</Text>
        <View style={cs.switchRow}><Text style={cs.switchLbl}>เปิดใช้ e-Card</Text><Switch value={eCardEnabled} onValueChange={setECardEnabled} trackColor={{ true: WebColors.primary, false: Colors.border }} /></View>
        {eCardEnabled && (
          <View style={{ gap: 8, marginTop: 8 }}>
            <Text style={{ fontSize: 13, color: Colors.text }}>วิธีใช้งาน:</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary }}>1. ลูกค้าเพิ่มเพื่อน LINE OA → กดเมนู "บัตรสมาชิก"</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary }}>2. ระบบแสดง e-Card พร้อม QR Code, ระดับ, แต้มคงเหลือ</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary }}>3. พนักงานสแกน QR เพื่อสะสมแต้ม / ใช้คูปอง</Text>
          </View>
        )}
      </View>

      {/* Notifications */}
      <View style={cs.card}>
        <Text style={cs.cardTitle}>การแจ้งเตือนอัตโนมัติ (ผ่าน LINE)</Text>
        <Text style={cs.subtitle}>ระบบจะส่ง notification ถึงลูกค้าผ่าน LINE เมื่อเกิดเหตุการณ์ต่อไปนี้</Text>
        <View style={cs.switchRow}><Text style={cs.switchLbl}>ได้รับแต้ม (หลังซื้อสินค้า)</Text><Switch value={notifyPoints} onValueChange={setNotifyPoints} trackColor={{ true: WebColors.success, false: Colors.border }} /></View>
        <View style={cs.switchRow}><Text style={cs.switchLbl}>อัปเกรดระดับสมาชิก</Text><Switch value={notifyLevel} onValueChange={setNotifyLevel} trackColor={{ true: WebColors.purple, false: Colors.border }} /></View>
        <View style={cs.switchRow}><Text style={cs.switchLbl}>คูปองหมดอายุ (แจ้งล่วงหน้า 3 วัน)</Text><Switch value={notifyCoupon} onValueChange={setNotifyCoupon} trackColor={{ true: WebColors.warning, false: Colors.border }} /></View>
        <View style={cs.switchRow}><Text style={cs.switchLbl}>วันเกิด (ส่งคูปอง + อวยพร)</Text><Switch value={notifyBirthday} onValueChange={setNotifyBirthday} trackColor={{ true: '#EC4899', false: Colors.border }} /></View>
      </View>

      <TouchableOpacity style={cs.primaryBtn} onPress={() => alert('บันทึกตั้งค่า CRM เรียบร้อย')}><Ionicons name="checkmark-circle" size={16} color={WebColors.white} /><Text style={cs.primaryBtnTxt}>บันทึกการตั้งค่า</Text></TouchableOpacity>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const cs = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: Colors.background },
  // Sidebar
  sidebar: { width: 200, minWidth: 180, backgroundColor: WebColors.white, borderRightWidth: 1, borderRightColor: Colors.border, paddingTop: 16 },
  sideHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  sideTitle: { fontSize: 13, fontWeight: '800', color: Colors.text },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  menuItemActive: { backgroundColor: '#FEF2F2', borderRightWidth: 3, borderRightColor: WebColors.primary },
  menuText: { fontSize: 13, color: Colors.textSecondary },
  menuTextActive: { color: WebColors.primary, fontWeight: '700' },
  // Content
  content: { flex: 1 },
  pageTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  // KPI
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  kpi: { flex: 1, backgroundColor: WebColors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  kpiVal: { fontSize: 16, fontWeight: '800', color: Colors.text },
  kpiLabel: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WebColors.white, borderRadius: 8, paddingHorizontal: 12, height: 38, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 12, color: Colors.text },
  // Table
  table: { backgroundColor: WebColors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' as any, minWidth: 800 },
  thead: { flexDirection: 'row', backgroundColor: Colors.background, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  th: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, flex: 1 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  trAlt: { backgroundColor: Colors.background },
  td: { flex: 1, fontSize: 13, color: Colors.text },
  empty: { padding: 24, textAlign: 'center', color: Colors.textMuted, fontSize: 12 },
  // Badge
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  // Card
  card: { backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  // Form
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  field: { marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  fieldInput: { height: 36, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, fontSize: 12, color: Colors.text, backgroundColor: WebColors.white },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.border, borderWidth: 1, borderColor: Colors.border },
  chipAct: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  chipTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTxtAct: { color: WebColors.white },
  formFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  saved: { fontSize: 13, color: WebColors.success, fontWeight: '600' },
  // Buttons
  primaryBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 8 },
  primaryBtnTxt: { fontSize: 12, fontWeight: '700', color: WebColors.white },
  // Switch
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  switchLbl: { fontSize: 12, fontWeight: '600', color: Colors.text },
  // Levels
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  levelCard: { width: 180, backgroundColor: WebColors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  levelBar: { height: 4, borderRadius: 2, marginBottom: 4 },
  levelName: { fontSize: 12, fontWeight: '700', color: Colors.text },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  levelLbl: { fontSize: 13, color: Colors.textSecondary },
  levelVal: { fontSize: 13, fontWeight: '700', color: Colors.text },
  // Coupon
  couponGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  couponCard: { width: 220, backgroundColor: Colors.background, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  couponTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  couponCode: { fontSize: 12, fontWeight: '800', color: Colors.text },
  couponDesc: { fontSize: 13, color: Colors.textSecondary },
  couponMeta: { fontSize: 12, color: Colors.textMuted },
  // Member Detail
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { fontSize: 12, color: WebColors.primary, fontWeight: '600' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  detailItem: { minWidth: 140 },
  detailLbl: { fontSize: 13, color: Colors.textMuted },
  detailVal: { fontSize: 12, fontWeight: '600', color: Colors.text },
});
