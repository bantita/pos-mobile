/**
 * CRMScreen — CRM Back-Office (no internal sidebar)
 * Uses horizontal tab/dropdown menu at the top instead of nested sidebar.
 * Panels: Members, Add, Levels, Points, Coupons, Campaigns, etc.
 */
import { useMemberStore } from '@/features/member/application/stores/memberStore';
import { MOCK_LEVEL_CONFIGS } from '@/features/member/data/mocks/mockMembers';
import { MemberLevel } from '@/features/member/domain/member';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import React, { useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
type MenuKey =
  | 'members' | 'add-member' | 'levels' | 'points' | 'point-adjust'
  | 'coupons' | 'campaigns' | 'communication' | 'gamification'
  | 'segments' | 'history' | 'wallet' | 'reports' | 'settings';

const MENUS: { key: MenuKey; label: string; icon: string }[] = [
  { key: 'members',       label: 'ข้อมูลสมาชิก',    icon: 'people-outline' },
  { key: 'add-member',    label: 'เพิ่มสมาชิก',     icon: 'person-add-outline' },
  { key: 'levels',        label: 'ระดับสมาชิก',     icon: 'ribbon-outline' },
  { key: 'points',        label: 'ตั้งค่าคะแนน',    icon: 'star-outline' },
  { key: 'point-adjust',  label: 'ปรับปรุงคะแนน',   icon: 'swap-horizontal-outline' },
  { key: 'coupons',       label: 'คูปอง / Voucher', icon: 'pricetag-outline' },
  { key: 'campaigns',     label: 'Campaign',        icon: 'megaphone-outline' },
  { key: 'communication', label: 'Communication',   icon: 'chatbubbles-outline' },
  { key: 'gamification',  label: 'Gamification',    icon: 'game-controller-outline' },
  { key: 'segments',      label: 'Segment ลูกค้า',  icon: 'layers-outline' },
  { key: 'history',       label: 'ประวัติการซื้อ',   icon: 'receipt-outline' },
  { key: 'wallet',        label: 'Wallet / Credit', icon: 'wallet-outline' },
  { key: 'reports',       label: 'รายงาน',          icon: 'bar-chart-outline' },
  { key: 'settings',      label: 'ตั้งค่า CRM',     icon: 'settings-outline' },
];

// ─── Level styles ─────────────────────────────────────────────────────────────
const LEVEL_STYLE: Record<MemberLevel, { label: string; color: string; bg: string }> = {
  member:   { label: 'Member',   color: '#e11d48', bg: '#fff1f2' },
  silver:   { label: 'Silver',   color: '#64748b', bg: '#f1f5f9' },
  gold:     { label: 'Gold',     color: '#a16207', bg: '#fef9c3' },
  platinum: { label: 'Platinum', color: '#7c3aed', bg: '#f3e8ff' },
  vip:      { label: 'VIP',      color: '#dc2626', bg: '#fee2e2' },
};

// ─── Shared Helpers ───────────────────────────────────────────────────────────
const Badge: React.FC<{ text: string; color: string; bg: string }> = ({ text, color, bg }) => (
  <View className={cn('px-2.5 py-0.5 rounded-md')} style={{ backgroundColor: bg }}>
    <Text className={cn('text-xs font-bold')} style={{ color }}>{text}</Text>
  </View>
);

const KpiCard: React.FC<{ label: string; value: string | number; color?: string; icon?: string }> = ({ label, value, color = '#1e293b', icon }) => (
  <View className={cn('flex-1 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm min-w-[160px]')}>
    <View className={cn('flex-row items-center gap-2 mb-2')}>
      {icon && <Ionicons name={icon as any} size={18} color={color} />}
      <Text className={cn('text-xs font-semibold text-slate-500')}>{label}</Text>
    </View>
    <Text className={cn('text-2xl font-extrabold')} style={{ color }}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </Text>
  </View>
);

const Field: React.FC<{
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; required?: boolean; flex?: number; type?: string;
}> = ({ label, value, onChange, placeholder, required, flex, type }) => (
  <View style={flex ? { flex } : undefined}>
    <Text className={cn('text-xs font-semibold text-slate-600 mb-1.5')}>
      {label}{required && <Text className={cn('text-rose-500')}> *</Text>}
    </Text>
    <TextInput
      className={cn('h-11 border border-slate-200 rounded-xl px-4 text-sm text-slate-900 bg-white')}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#a1a1aa"
      {...(type && Platform.OS === 'web' ? { type } as any : {})}
    />
  </View>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={{ minWidth: 140 }}>
    <Text className={cn('text-xs text-slate-500')}>{label}</Text>
    <Text className={cn('text-sm font-semibold text-slate-800 mt-0.5')}>{value}</Text>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — No internal sidebar, uses horizontal tabs
// ═══════════════════════════════════════════════════════════════════════════════
export const CRMScreen: React.FC = () => {
  const [menu, setMenu] = useState<MenuKey>('members');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentMenu = MENUS.find((m) => m.key === menu)!;

  return (
    <View className={cn('flex-1 bg-[#f8fafc]')}>
      {/* ─── Top Tab Bar ─── */}
      <View className={cn('bg-white border-b border-slate-100 px-4 pt-3 pb-0')}>
        {/* Title row + dropdown trigger for mobile */}
        <View className={cn('flex-row items-center gap-3', isMobile ? 'mb-2' : 'mb-3')}>
          <View className={cn('w-9 h-9 rounded-xl bg-rose-50 items-center justify-center')}>
            <Ionicons name="heart" size={18} color="#e11d48" />
          </View>
          <Text className={cn('text-lg font-bold text-slate-900')}>CRM</Text>

          {/* Mobile: dropdown trigger */}
          {isMobile && (
            <TouchableOpacity
              className={cn('ml-auto flex-row items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50')}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Ionicons name={currentMenu.icon as any} size={14} color="#e11d48" />
              <Text className={cn('text-xs font-bold text-slate-700')}>{currentMenu.label}</Text>
              <Ionicons name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={12} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* Desktop: horizontal scrollable tabs */}
        {!isMobile && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 2, paddingBottom: 0 }}
          >
            {MENUS.map((m) => {
              const active = menu === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  className={cn(
                    'flex-row items-center gap-1.5 px-4 py-2.5 rounded-t-lg border-b-2',
                    active ? 'border-rose-500 bg-rose-50/50' : 'border-transparent',
                  )}
                  onPress={() => setMenu(m.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={m.icon as any} size={15} color={active ? '#e11d48' : '#64748b'} />
                  <Text className={cn('text-[13px]', active ? 'font-bold text-rose-700' : 'font-medium text-slate-600')}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ─── Mobile Dropdown Overlay ─── */}
      {isMobile && dropdownOpen && (
        <View className={cn('absolute inset-0 z-50')} style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Backdrop */}
          <TouchableOpacity
            className={cn('absolute inset-0 bg-black/30')}
            activeOpacity={1}
            onPress={() => setDropdownOpen(false)}
          />
          {/* Menu */}
          <View className={cn('mx-4 mt-16 bg-white rounded-xl border border-slate-200 shadow-xl p-2 max-h-[70%]')}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {MENUS.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  className={cn('flex-row items-center gap-2.5 px-3 py-2.5 rounded-lg', menu === m.key && 'bg-rose-50')}
                  onPress={() => { setMenu(m.key); setDropdownOpen(false); }}
                >
                  <Ionicons name={m.icon as any} size={16} color={menu === m.key ? '#e11d48' : '#64748b'} />
                  <Text className={cn('text-sm', menu === m.key ? 'font-bold text-rose-700' : 'text-slate-700')}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* ─── Content ─── */}
      <ScrollView
        className={cn('flex-1')}
        contentContainerStyle={{ padding: isMobile ? 16 : 28, paddingTop: isMobile ? 16 : 24, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {menu === 'members' && <MembersPanel />}
        {menu === 'add-member' && <AddMemberPanel />}
        {menu === 'levels' && <LevelsPanel />}
        {menu === 'points' && <PointsPanel />}
        {menu === 'point-adjust' && <PointAdjustPanel />}
        {menu === 'coupons' && <PlaceholderPanel title="คูปอง / Voucher" icon="pricetag-outline" desc="จัดการคูปองส่วนลดและ Voucher สำหรับสมาชิก" />}
        {menu === 'campaigns' && <PlaceholderPanel title="Campaign" icon="megaphone-outline" desc="สร้างและจัดการแคมเปญการตลาดสำหรับสมาชิก" />}
        {menu === 'communication' && <PlaceholderPanel title="Communication" icon="chatbubbles-outline" desc="ส่งข้อความ LINE / SMS / Email ถึงสมาชิก" />}
        {menu === 'gamification' && <PlaceholderPanel title="Gamification" icon="game-controller-outline" desc="Stamp Card, Lucky Draw และกิจกรรมสะสมแต้ม" />}
        {menu === 'segments' && <PlaceholderPanel title="Segment ลูกค้า" icon="layers-outline" desc="แบ่งกลุ่มลูกค้าตามพฤติกรรมการซื้อ" />}
        {menu === 'history' && <PlaceholderPanel title="ประวัติการซื้อ" icon="receipt-outline" desc="ดูประวัติการซื้อทั้งหมดของสมาชิก" />}
        {menu === 'wallet' && <PlaceholderPanel title="Wallet / Credit" icon="wallet-outline" desc="ระบบเติมเงิน Wallet และ Store Credit" />}
        {menu === 'reports' && <PlaceholderPanel title="รายงาน CRM" icon="bar-chart-outline" desc="รายงานภาพรวมสมาชิก, คะแนน, การใช้งาน" />}
        {menu === 'settings' && <PlaceholderPanel title="ตั้งค่า CRM" icon="settings-outline" desc="ตั้งค่าระบบ CRM ทั่วไป" />}
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MEMBERS PANEL
// ═══════════════════════════════════════════════════════════════════════════════
const MembersPanel: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { members, searchMembers, updateMember } = useMemberStore();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBirthday, setEditBirthday] = useState('');

  const list = search.trim() ? searchMembers(search) : members;
  const activeCount = members.filter((m) => m.isActive).length;
  const suspendedCount = members.length - activeCount;
  const newMonth = members.filter((m) => {
    const d = new Date(m.joinDate);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  const selected = selectedId ? members.find((m) => m.id === selectedId) : null;

  const startEdit = () => {
    if (!selected) return;
    setEditName(selected.name);
    setEditPhone(selected.phone);
    setEditEmail(selected.email || '');
    setEditBirthday(selected.birthday || '');
    setEditMode(true);
  };

  const saveEdit = () => {
    if (!selected) return;
    updateMember(selected.id, {
      name: editName, phone: editPhone,
      email: editEmail || undefined, birthday: editBirthday || undefined,
    });
    setEditMode(false);
  };

  // ─── Detail View ──
  if (selected) {
    const levelStyle = LEVEL_STYLE[selected.level];
    const levelCfg = MOCK_LEVEL_CONFIGS.find((c) => c.level === selected.level);
    return (
      <View>
        <TouchableOpacity className={cn('flex-row items-center gap-2 mb-5')} onPress={() => { setSelectedId(null); setEditMode(false); }}>
          <Ionicons name="arrow-back" size={18} color="#e11d48" />
          <Text className={cn('text-sm font-semibold text-rose-600')}>กลับรายชื่อสมาชิก</Text>
        </TouchableOpacity>

        {/* Header */}
        <View className={cn('flex-row items-center gap-4 mb-6')}>
          <View className={cn('w-14 h-14 rounded-full items-center justify-center')} style={{ backgroundColor: levelStyle.bg }}>
            <Text className={cn('text-xl font-bold')} style={{ color: levelStyle.color }}>{selected.name.charAt(0)}</Text>
          </View>
          <View className={cn('flex-1')}>
            <Text className={cn('text-lg font-bold text-slate-900')}>{selected.name}</Text>
            <Text className={cn('text-sm text-slate-500')}>{selected.memberNo} · สมาชิกตั้งแต่ {selected.joinDate}</Text>
          </View>
          <Badge text={levelStyle.label} color={levelStyle.color} bg={levelStyle.bg} />
        </View>

        {/* Actions */}
        <View className={cn('flex-row gap-2 mb-6')}>
          <TouchableOpacity className={cn('flex-row items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200')} onPress={startEdit}>
            <Ionicons name="create-outline" size={16} color="#475569" />
            <Text className={cn('text-sm font-semibold text-slate-700')}>แก้ไข</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={cn('flex-row items-center gap-2 px-4 py-2.5 rounded-xl border')}
            style={{ backgroundColor: selected.isActive ? '#fef3c7' : '#d1fae5', borderColor: selected.isActive ? '#f59e0b' : '#10b981' }}
            onPress={() => { updateMember(selected.id, { isActive: !selected.isActive, status: selected.isActive ? 'suspended' : 'active' }); setSelectedId(null); }}
          >
            <Ionicons name={selected.isActive ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={selected.isActive ? '#d97706' : '#059669'} />
            <Text className={cn('text-sm font-semibold')} style={{ color: selected.isActive ? '#d97706' : '#059669' }}>{selected.isActive ? 'ระงับ' : 'เปิดใช้'}</Text>
          </TouchableOpacity>
        </View>

        {/* Edit form */}
        {editMode && (
          <View className={cn('bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-6')} style={{ gap: 14 }}>
            <Text className={cn('text-sm font-bold text-slate-800')}>แก้ไขข้อมูลสมาชิก</Text>
            <View className={cn('flex-row gap-4')}>
              <Field label="ชื่อ-สกุล" value={editName} onChange={setEditName} required flex={1} />
              <Field label="เบอร์โทร" value={editPhone} onChange={setEditPhone} required flex={1} />
              <Field label="Email" value={editEmail} onChange={setEditEmail} flex={1} />
              <Field label="วันเกิด" value={editBirthday} onChange={setEditBirthday} flex={1} type="date" />
            </View>
            <View className={cn('flex-row gap-3 mt-1')}>
              <TouchableOpacity className={cn('flex-row items-center gap-2 bg-rose-600 rounded-xl px-5 py-2.5')} onPress={saveEdit}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text className={cn('text-sm font-bold text-white')}>บันทึก</Text>
              </TouchableOpacity>
              <TouchableOpacity className={cn('px-5 py-2.5 rounded-xl bg-slate-100')} onPress={() => setEditMode(false)}>
                <Text className={cn('text-sm font-medium text-slate-600')}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* KPIs */}
        <View className={cn('flex-row gap-3 mb-6 flex-wrap')}>
          <KpiCard label="ระดับ" value={levelStyle.label} color={levelStyle.color} icon="ribbon-outline" />
          <KpiCard label="คะแนนสะสม" value={selected.pointBalance} color="#d97706" icon="star-outline" />
          <KpiCard label="ยอดซื้อรวม" value={`฿${selected.totalSpent.toLocaleString()}`} color="#7c3aed" icon="wallet-outline" />
          <KpiCard label="สถานะ" value={selected.isActive ? 'Active' : 'ระงับ'} color={selected.isActive ? '#059669' : '#dc2626'} icon="ellipse" />
        </View>

        {/* Info card */}
        <View className={cn('bg-white rounded-2xl p-6 border border-slate-100 shadow-sm')}>
          <Text className={cn('text-sm font-bold text-slate-800 mb-4')}>ข้อมูลสมาชิก</Text>
          <View className={cn('flex-row flex-wrap gap-x-10 gap-y-4')}>
            <InfoItem label="เบอร์โทร" value={selected.phone} />
            <InfoItem label="Email" value={selected.email || '—'} />
            <InfoItem label="วันเกิด" value={selected.birthday || '—'} />
            <InfoItem label="ส่วนลด" value={`${levelCfg?.discountPercent || 0}%`} />
            <InfoItem label="อัตราแต้ม" value={`x${levelCfg?.earnMultiplier || 1}`} />
            <InfoItem label="แต้มหมดอายุ" value={`${levelCfg?.expireDays || 365} วัน`} />
          </View>
        </View>
      </View>
    );
  }

  // ─── List View ──
  return (
    <View>
      {/* KPI Row */}
      <View className={cn('flex-row gap-3 mb-6 flex-wrap')}>
        <KpiCard label="สมาชิกทั้งหมด" value={members.length} color="#e11d48" icon="people-outline" />
        <KpiCard label="สมาชิกใหม่เดือนนี้" value={newMonth} color="#7c3aed" icon="person-add-outline" />
        <KpiCard label="Active" value={activeCount} color="#059669" icon="checkmark-circle-outline" />
        <KpiCard label="Suspended" value={suspendedCount} color="#dc2626" icon="close-circle-outline" />
      </View>

      {/* Search */}
      <View className={cn('flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-12 mb-5 shadow-sm')}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          className={cn('flex-1 ml-3 text-sm text-slate-800')}
          placeholder="ค้นหาชื่อ, เบอร์โทร, หมายเลขสมาชิก..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      </View>

      {/* Table */}
      <View className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden')}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 980 }}>
            {/* Header */}
            <View className={cn('flex-row items-center bg-slate-50 border-b border-slate-100 px-5 h-12')}>
              <Text className={cn('text-xs font-semibold text-slate-500')} style={{ width: 100 }}>รหัส</Text>
              <Text className={cn('text-xs font-semibold text-slate-500')} style={{ width: 150 }}>ชื่อ</Text>
              <Text className={cn('text-xs font-semibold text-slate-500')} style={{ width: 120 }}>เบอร์โทร</Text>
              <Text className={cn('text-xs font-semibold text-slate-500')} style={{ width: 170 }}>Email</Text>
              <Text className={cn('text-xs font-semibold text-slate-500 text-center')} style={{ width: 80 }}>ระดับ</Text>
              <Text className={cn('text-xs font-semibold text-slate-500 text-right')} style={{ width: 80 }}>คะแนน</Text>
              <Text className={cn('text-xs font-semibold text-slate-500 text-right')} style={{ width: 90 }}>ยอดซื้อ</Text>
              <Text className={cn('text-xs font-semibold text-slate-500 text-center')} style={{ width: 70 }}>สถานะ</Text>
              <Text className={cn('text-xs font-semibold text-slate-500')} style={{ width: 95 }}>วันสมัคร</Text>
            </View>
            {/* Rows */}
            {list.map((m, i) => {
              const lvl = LEVEL_STYLE[m.level];
              return (
                <TouchableOpacity
                  key={m.id}
                  className={cn('flex-row items-center px-5 h-12 border-b border-slate-50', i % 2 === 1 && 'bg-slate-50/40')}
                  onPress={() => setSelectedId(m.id)}
                  activeOpacity={0.7}
                >
                  <Text className={cn('text-sm text-slate-600')} style={{ width: 100 }} numberOfLines={1}>{m.memberNo}</Text>
                  <Text className={cn('text-sm font-medium text-slate-800')} style={{ width: 150 }} numberOfLines={1}>{m.name}</Text>
                  <Text className={cn('text-sm text-slate-600')} style={{ width: 120 }} numberOfLines={1}>{m.phone}</Text>
                  <Text className={cn('text-sm text-slate-500')} style={{ width: 170 }} numberOfLines={1}>{m.email || '—'}</Text>
                  <View style={{ width: 80, alignItems: 'center' }}>
                    <Badge text={lvl.label} color={lvl.color} bg={lvl.bg} />
                  </View>
                  <Text className={cn('text-sm font-medium text-slate-700 text-right')} style={{ width: 80 }}>{m.pointBalance.toLocaleString()}</Text>
                  <Text className={cn('text-sm font-medium text-slate-700 text-right')} style={{ width: 90 }}>{m.totalSpent.toLocaleString()}</Text>
                  <View style={{ width: 70, alignItems: 'center' }}>
                    <View className={cn('flex-row items-center gap-1')}>
                      <View className={cn('w-2 h-2 rounded-full')} style={{ backgroundColor: m.isActive ? '#10b981' : '#ef4444' }} />
                      <Text className={cn('text-xs text-slate-600')}>{m.isActive ? 'Active' : 'ระงับ'}</Text>
                    </View>
                  </View>
                  <Text className={cn('text-sm text-slate-500')} style={{ width: 95 }} numberOfLines={1}>{m.joinDate}</Text>
                </TouchableOpacity>
              );
            })}
            {list.length === 0 && (
              <View className={cn('py-16 items-center')}>
                <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                <Text className={cn('text-sm text-slate-400 mt-3')}>ไม่พบสมาชิก</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ADD MEMBER
// ═══════════════════════════════════════════════════════════════════════════════
const AddMemberPanel: React.FC = () => {
  const { addMember } = useMemberStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) return;
    addMember({
      name: name.trim(), phone: phone.trim(),
      email: email || undefined, birthday: dob || undefined,
      level: 'member', isActive: true, shopId: 'shop-01', branchId: 'b1',
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); setName(''); setPhone(''); setEmail(''); setDob(''); setGender(''); setAddress(''); }, 2000);
  };

  return (
    <View>
      <Text className={cn('text-lg font-bold text-slate-900 mb-1')}>เพิ่มสมาชิกใหม่</Text>
      <Text className={cn('text-sm text-slate-500 mb-6')}>กรอกข้อมูลเพื่อลงทะเบียนสมาชิกใหม่</Text>

      <View className={cn('bg-white rounded-2xl p-7 border border-slate-100 shadow-sm')} style={{ gap: 18 }}>
        <View className={cn('flex-row gap-4')}>
          <Field label="ชื่อ-สกุล" value={name} onChange={setName} required flex={1} placeholder="กรอกชื่อ-นามสกุล" />
          <Field label="เบอร์โทร" value={phone} onChange={setPhone} required flex={1} placeholder="08x-xxx-xxxx" />
          <Field label="Email" value={email} onChange={setEmail} flex={1} placeholder="email@example.com" />
        </View>
        <View className={cn('flex-row gap-4')}>
          <Field label="วันเกิด" value={dob} onChange={setDob} flex={1} type="date" placeholder="YYYY-MM-DD" />
          <View style={{ flex: 1 }}>
            <Text className={cn('text-xs font-semibold text-slate-600 mb-1.5')}>เพศ</Text>
            <View className={cn('flex-row gap-2')}>
              {['ชาย', 'หญิง', 'อื่นๆ'].map((g) => (
                <TouchableOpacity
                  key={g}
                  className={cn('px-4 py-2.5 rounded-xl border', gender === g ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200')}
                  onPress={() => setGender(g)}
                >
                  <Text className={cn('text-sm', gender === g ? 'font-bold text-rose-700' : 'text-slate-600')}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Field label="ที่อยู่" value={address} onChange={setAddress} flex={1} placeholder="ที่อยู่ (ถ้ามี)" />
        </View>

        <View className={cn('flex-row items-center gap-3 mt-2')}>
          <TouchableOpacity className={cn('flex-row items-center gap-2 bg-rose-600 rounded-xl px-6 py-3')} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text className={cn('text-sm font-bold text-white')}>บันทึกสมาชิก</Text>
          </TouchableOpacity>
          {saved && <Text className={cn('text-sm font-semibold text-emerald-600')}>บันทึกเรียบร้อย</Text>}
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. LEVELS
// ═══════════════════════════════════════════════════════════════════════════════
const LevelsPanel: React.FC = () => (
  <View>
    <Text className={cn('text-lg font-bold text-slate-900 mb-1')}>ระดับสมาชิก</Text>
    <Text className={cn('text-sm text-slate-500 mb-6')}>ตั้งค่าเงื่อนไขเลื่อนระดับและสิทธิประโยชน์</Text>
    <View className={cn('flex-row gap-4 flex-wrap')}>
      {MOCK_LEVEL_CONFIGS.map((cfg) => {
        const style = LEVEL_STYLE[cfg.level] || { label: cfg.label, color: '#64748b', bg: '#f1f5f9' };
        return (
          <View key={cfg.level} className={cn('bg-white rounded-2xl p-6 border border-slate-100 shadow-sm')} style={{ minWidth: 220, flex: 1 }}>
            <View className={cn('flex-row items-center gap-3 mb-4')}>
              <View className={cn('w-10 h-10 rounded-xl items-center justify-center')} style={{ backgroundColor: style.bg }}>
                <Ionicons name="ribbon" size={20} color={style.color} />
              </View>
              <Text className={cn('text-base font-bold')} style={{ color: style.color }}>{cfg.label}</Text>
            </View>
            <View style={{ gap: 8 }}>
              <InfoItem label="ยอดซื้อขั้นต่ำ" value={`฿${cfg.minSpent.toLocaleString()}`} />
              <InfoItem label="จำนวนบิลขั้นต่ำ" value={`${cfg.minBills} บิล`} />
              <InfoItem label="ส่วนลด" value={`${cfg.discountPercent}%`} />
              <InfoItem label="ตัวคูณคะแนน" value={`x${cfg.earnMultiplier}`} />
              <InfoItem label="แต้มหมดอายุ" value={`${cfg.expireDays} วัน`} />
            </View>
          </View>
        );
      })}
    </View>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 4. POINTS SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
const PointsPanel: React.FC = () => {
  const { pointConfig } = useMemberStore();
  return (
    <View>
      <Text className={cn('text-lg font-bold text-slate-900 mb-1')}>ตั้งค่าคะแนน</Text>
      <Text className={cn('text-sm text-slate-500 mb-6')}>กำหนดอัตราสะสมและแลกคะแนน</Text>
      <View className={cn('flex-row gap-4 flex-wrap')}>
        <View className={cn('bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex-1')} style={{ minWidth: 240 }}>
          <View className={cn('flex-row items-center gap-3 mb-3')}>
            <View className={cn('w-10 h-10 rounded-xl bg-amber-50 items-center justify-center')}>
              <Ionicons name="star" size={20} color="#d97706" />
            </View>
            <Text className={cn('text-sm font-bold text-slate-800')}>อัตราสะสมคะแนน</Text>
          </View>
          <Text className={cn('text-3xl font-extrabold text-amber-600')}>{pointConfig.earnRate} บาท</Text>
          <Text className={cn('text-xs text-slate-500 mt-1')}>ต่อ 1 คะแนน</Text>
        </View>
        <View className={cn('bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex-1')} style={{ minWidth: 240 }}>
          <View className={cn('flex-row items-center gap-3 mb-3')}>
            <View className={cn('w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center')}>
              <Ionicons name="gift" size={20} color="#059669" />
            </View>
            <Text className={cn('text-sm font-bold text-slate-800')}>อัตราแลกคะแนน</Text>
          </View>
          <Text className={cn('text-3xl font-extrabold text-emerald-600')}>{pointConfig.redeemRate} บาท</Text>
          <Text className={cn('text-xs text-slate-500 mt-1')}>ต่อ 1 คะแนน</Text>
        </View>
        <View className={cn('bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex-1')} style={{ minWidth: 240 }}>
          <View className={cn('flex-row items-center gap-3 mb-3')}>
            <View className={cn('w-10 h-10 rounded-xl bg-violet-50 items-center justify-center')}>
              <Ionicons name="swap-horizontal" size={20} color="#7c3aed" />
            </View>
            <Text className={cn('text-sm font-bold text-slate-800')}>ขั้นต่ำแลกคะแนน</Text>
          </View>
          <Text className={cn('text-3xl font-extrabold text-violet-600')}>{pointConfig.minRedeemPoints}</Text>
          <Text className={cn('text-xs text-slate-500 mt-1')}>คะแนน</Text>
        </View>
        <View className={cn('bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex-1')} style={{ minWidth: 240 }}>
          <View className={cn('flex-row items-center gap-3 mb-3')}>
            <View className={cn('w-10 h-10 rounded-xl bg-rose-50 items-center justify-center')}>
              <Ionicons name="time" size={20} color="#e11d48" />
            </View>
            <Text className={cn('text-sm font-bold text-slate-800')}>คะแนนหมดอายุ</Text>
          </View>
          <Text className={cn('text-3xl font-extrabold text-rose-600')}>{pointConfig.pointExpireDays || '∞'}</Text>
          <Text className={cn('text-xs text-slate-500 mt-1')}>{pointConfig.pointExpireDays ? 'วัน' : 'ไม่หมดอายุ'}</Text>
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. POINT ADJUST
// ═══════════════════════════════════════════════════════════════════════════════
const PointAdjustPanel: React.FC = () => {
  const { members, searchMembers } = useMemberStore();
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [reason, setReason] = useState('');

  const list = search.trim() ? searchMembers(search) : members.slice(0, 10);
  const selected = selectedMemberId ? members.find((m) => m.id === selectedMemberId) : null;

  return (
    <View>
      <Text className={cn('text-lg font-bold text-slate-900 mb-1')}>ปรับปรุงคะแนน</Text>
      <Text className={cn('text-sm text-slate-500 mb-6')}>เพิ่มหรือลดคะแนนสมาชิกด้วยตนเอง</Text>

      <View className={cn('bg-white rounded-2xl p-7 border border-slate-100 shadow-sm')} style={{ gap: 18 }}>
        <View>
          <Text className={cn('text-xs font-semibold text-slate-600 mb-1.5')}>ค้นหาสมาชิก</Text>
          <View className={cn('flex-row items-center border border-slate-200 rounded-xl px-4 h-11 bg-white')}>
            <Ionicons name="search-outline" size={16} color="#94a3b8" />
            <TextInput
              className={cn('flex-1 ml-3 text-sm text-slate-800')}
              placeholder="พิมพ์ชื่อหรือเบอร์โทร..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          {search.trim() !== '' && (
            <View className={cn('mt-2 border border-slate-100 rounded-xl overflow-hidden')}>
              {list.slice(0, 5).map((m) => (
                <TouchableOpacity
                  key={m.id}
                  className={cn('flex-row items-center gap-3 px-4 py-3 border-b border-slate-50', selectedMemberId === m.id && 'bg-rose-50')}
                  onPress={() => { setSelectedMemberId(m.id); setSearch(''); }}
                >
                  <Text className={cn('text-sm font-medium text-slate-800')}>{m.name}</Text>
                  <Text className={cn('text-xs text-slate-500')}>{m.phone}</Text>
                  <Badge text={LEVEL_STYLE[m.level].label} color={LEVEL_STYLE[m.level].color} bg={LEVEL_STYLE[m.level].bg} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {selected && (
          <View className={cn('bg-slate-50 rounded-xl p-4 flex-row items-center gap-3')}>
            <Ionicons name="person-circle" size={32} color="#e11d48" />
            <View className={cn('flex-1')}>
              <Text className={cn('text-sm font-bold text-slate-800')}>{selected.name}</Text>
              <Text className={cn('text-xs text-slate-500')}>คะแนนปัจจุบัน: {selected.pointBalance.toLocaleString()}</Text>
            </View>
            <Badge text={LEVEL_STYLE[selected.level].label} color={LEVEL_STYLE[selected.level].color} bg={LEVEL_STYLE[selected.level].bg} />
          </View>
        )}

        <View className={cn('flex-row gap-4')}>
          <Field label="จำนวนคะแนน (+/-)" value={adjustPoints} onChange={setAdjustPoints} flex={1} placeholder="เช่น +100 หรือ -50" />
          <Field label="เหตุผล" value={reason} onChange={setReason} flex={2} placeholder="ระบุเหตุผลการปรับคะแนน" />
        </View>

        <TouchableOpacity className={cn('flex-row items-center gap-2 self-start bg-rose-600 rounded-xl px-6 py-3')} disabled={!selected}>
          <Ionicons name="swap-horizontal" size={18} color="#fff" />
          <Text className={cn('text-sm font-bold text-white')}>ปรับคะแนน</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLACEHOLDER
// ═══════════════════════════════════════════════════════════════════════════════
const PlaceholderPanel: React.FC<{ title: string; icon: string; desc: string }> = ({ title, icon, desc }) => (
  <View className={cn('flex-1 items-center justify-center py-20')}>
    <View className={cn('w-20 h-20 rounded-2xl bg-rose-50 items-center justify-center mb-5')}>
      <Ionicons name={icon as any} size={32} color="#f43f5e" />
    </View>
    <Text className={cn('text-lg font-bold text-slate-800 mb-2')}>{title}</Text>
    <Text className={cn('text-sm text-slate-500 text-center max-w-[360px]')}>{desc}</Text>
    <View className={cn('mt-6 flex-row items-center gap-2 bg-slate-100 rounded-xl px-5 py-2.5')}>
      <Ionicons name="construct-outline" size={16} color="#64748b" />
      <Text className={cn('text-sm font-medium text-slate-600')}>กำลังพัฒนา</Text>
    </View>
  </View>
);
