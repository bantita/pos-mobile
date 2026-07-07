/**
 * CRMScreen — CRM Back-Office (ChocoCRM-inspired)
 * Features: สมาชิก, เพิ่มสมาชิก, ระดับ, ตั้งค่าแต้ม, คูปอง, แคมเปญ, Gamification,
 *           Segment, ประวัติ, Wallet, รายงาน, ตั้งค่า
 */
import { useCommunicationStore } from '@/features/communication/application/stores/communicationStore';
import { useMemberStore } from '@/features/member/application/stores/memberStore';
import { MOCK_LEVEL_CONFIGS } from '@/features/member/data/mocks/mockMembers';
import { usePromoStore } from '@/features/promotion/application/stores/promoStore';
import { useSaleHistoryStore } from '@/features/sale/application/stores/saleHistoryStore';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import React, { useState } from 'react';
import { Modal, Platform, Switch, useWindowDimensions } from 'react-native';

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
  <View className={cn('px-2.5 py-0.5 rounded-md self-start')} style={[{ backgroundColor: bg }]}><Text className={cn('text-xs font-bold')} style={[{ color }]}>{text}</Text></View>
);
const KPI: React.FC<{ label: string; value: string | number; color?: string; style?: any }> = ({ label, value, color, style }) => (
  <View className={cn('flex-1 bg-white rounded-xl p-4 border border-slate-200 items-center')} style={style}>
    <Text className={cn('text-lg font-bold text-slate-950')} style={[color ? { color } : undefined]}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
    <Text className={cn('text-xs text-slate-500 mt-1')}>{label}</Text>
  </View>
);
const Field: React.FC<{ label: string; value: string; onChange?: (v: string) => void; placeholder?: string; required?: boolean; flex?: number; type?: string }> = ({ label, value, onChange, placeholder, required, flex, type }) => (
  <View className={cn('flex-col')} style={[flex ? { flex } : undefined]}>
    <Text className={cn('text-xs font-bold text-slate-500 mb-1')}>{label}{required && <Text style={{ color: '#ef4444' }}> *</Text>}</Text>
    <TextInput className={cn('border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-950 bg-white')} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={'#a8a29e'} {...(type && Platform.OS === 'web' ? { type } as any : {})} />
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const CRMScreen: React.FC = () => {
  const [menu, setMenu] = useState<MenuKey>('members');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View className={cn('flex-1 flex-row bg-[#f6f7fb]')} style={[isMobile && { flexDirection: 'column' }]}>
      {/* Sidebar */}
      {!isMobile && <View className={cn('w-52 bg-white border-r border-slate-200 py-4')}>
        <View className={cn('flex-row items-center gap-2 px-4 pb-3 border-b border-slate-200 mb-2')}>
          <Ionicons name="heart-circle" size={24} color="#f87171" />
          <Text className={cn('text-base font-bold text-slate-950')}>CRM</Text>
        </View>
        {MENUS.map(m => (
          <TouchableOpacity key={m.key} className={cn('flex-row items-center gap-2 px-4 py-2.5 mx-2 mb-0.5 rounded-lg', menu === m.key && 'bg-[#f6f7fb]')} onPress={() => setMenu(m.key)}>
            <Ionicons name={m.icon as any} size={16} color={menu === m.key ? '#f87171' : '#57534e'} />
            <Text className={cn('text-xs', menu === m.key ? 'font-bold text-rose-600' : 'text-slate-950')}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>}

      {/* Mobile CRM tabs */}
      {isMobile && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 58, borderBottomWidth: 1, borderBottomColor: '#e7e5e4', backgroundColor: '#fafafa' }} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 8 }}>
          <View className={cn('flex-row gap-2 items-center')}>
            {MENUS.map(m => (
              <TouchableOpacity key={m.key} onPress={() => setMenu(m.key)} style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: menu === m.key ? '#fb7185' : '#e7e5e4', backgroundColor: menu === m.key ? '#fff1f2' : '#fafafa' }}>
                <Ionicons name={m.icon as any} size={15} color={menu === m.key ? '#f43f5e' : '#64748b'} />
                <Text style={{ fontSize: 12, color: menu === m.key ? '#e11d48' : '#475569', fontWeight: menu === m.key ? '700' : '500' }}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Content */}
      <ScrollView className={cn('flex-1')} contentContainerStyle={{ padding: isMobile ? 12 : 24, gap: 16 }} showsVerticalScrollIndicator={false}>
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
        <TouchableOpacity className={cn('flex-row items-center gap-1.5 mb-3')} onPress={() => setSelectedId(null)}>
          <Ionicons name="arrow-back" size={16} color="#f87171" />
          <Text className={cn('text-xs font-semibold text-rose-600')}>กลับรายชื่อสมาชิก</Text>
        </TouchableOpacity>
        <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>{selected.name}</Text>
        <Text className={cn('text-xs text-slate-500 mb-3')}>{selected.memberNo} · สมาชิกตั้งแต่ {selected.joinDate}</Text>

        {/* Action buttons */}
        <View className={cn('flex-row gap-2 mb-1')}>
          <TouchableOpacity className={cn('flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200')} style={[{ backgroundColor: '#e7e5e4' }]} onPress={startEdit}>
            <Ionicons name="create-outline" size={14} color="#f87171" /><Text className={cn('text-xs font-semibold text-rose-600')}>แก้ไข</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={cn('flex-row items-center gap-1 px-3 py-1.5 rounded-lg border')}
            style={[{ backgroundColor: selected.isActive ? '#fed7aa' : '#d1fae5', borderColor: selected.isActive ? '#a16207' : '#0f766e' }]}
            onPress={() => { useMemberStore.getState().updateMember(selected.id, { isActive: !selected.isActive, status: selected.isActive ? 'suspended' : 'active' }); setSelectedId(null); }}
          >
            <Ionicons name={selected.isActive ? 'pause-circle-outline' : 'play-circle-outline'} size={14} color={selected.isActive ? '#a16207' : '#0f766e'} />
            <Text style={{ fontSize: 13, color: selected.isActive ? '#a16207' : '#0f766e', fontWeight: '600' }}>{selected.isActive ? 'ระงับ' : 'เปิดใช้'}</Text>
          </TouchableOpacity>
          <TouchableOpacity className={cn('flex-row items-center gap-1 px-3 py-1.5 rounded-lg border')} style={[{ backgroundColor: '#ffe4e6', borderColor: '#ef4444' }]}
            onPress={() => { if (confirm('ลบสมาชิก ' + selected.name + '?')) { useMemberStore.getState().updateMember(selected.id, { isActive: false, status: 'suspended' }); setSelectedId(null); } }}>
            <Ionicons name="trash-outline" size={14} color="#ef4444" /><Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>ลบ</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Form */}
        {editMode && (
          <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')} style={{ gap: 10 }}>
            <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>แก้ไขข้อมูลสมาชิก</Text>
            <View className={cn('flex-row gap-3 mb-2')}>
              <Field label="ชื่อ-สกุล" value={editName} onChange={setEditName} required flex={1} />
              <Field label="เบอร์โทร" value={editPhone} onChange={setEditPhone} required flex={1} />
              <Field label="Email" value={editEmail} onChange={setEditEmail} flex={1} />
            </View>
            <View className={cn('flex-row gap-3 mb-2')}>
              <Field label="วันเกิด" value={editBirthday} onChange={setEditBirthday} flex={1} type="date" />
              <Field label="ที่อยู่" value={editAddress} onChange={setEditAddress} flex={2} />
            </View>
            <View className={cn('flex-row gap-2')}>
              <TouchableOpacity className={cn('flex-row items-center gap-1.5 self-start bg-rose-500 rounded-lg px-4 py-2.5 mt-2')} onPress={saveEdit}>
                <Ionicons name="checkmark" size={14} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>บันทึก</Text>
              </TouchableOpacity>
              <TouchableOpacity className={cn('px-4 py-2 rounded-lg')} style={[{ backgroundColor: '#e7e5e4' }]} onPress={() => setEditMode(false)}>
                <Text className={cn('text-xs text-slate-500')}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Info Cards */}
        <View className={cn('flex-row gap-3 mb-4')}>
          <KPI label="ระดับ" value={levelCfg?.label || selected.level} color={levelCfg?.color || '#a3a3a3'} />
          <KPI label="คะแนนสะสม" value={selected.pointBalance} color="#a16207" />
          <KPI label="ยอดซื้อรวม" value={`฿${selected.totalSpent.toLocaleString()}`} color="#6b21a8" />
          <KPI label="สถานะ" value={selected.isActive ? 'Active' : 'ระงับ'} color={selected.isActive ? '#0f766e' : '#ef4444'} />
        </View>

        {/* Member Info */}
        <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
          <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>ข้อมูลสมาชิก</Text>
          <View className={cn('flex-row flex-wrap gap-4')}>
            <View className={cn('min-w-[140px]')}><Text className={cn('text-xs text-slate-500')}>เบอร์โทร</Text><Text className={cn('text-xs font-semibold text-slate-950')}>{selected.phone}</Text></View>
            <View className={cn('min-w-[140px]')}><Text className={cn('text-xs text-slate-500')}>Email</Text><Text className={cn('text-xs font-semibold text-slate-950')}>{selected.email || '-'}</Text></View>
            <View className={cn('min-w-[140px]')}><Text className={cn('text-xs text-slate-500')}>ระดับถัดไป</Text><Text className={cn('text-xs font-semibold text-slate-950')}>{levelCfg ? `ซื้อเพิ่ม ฿${Math.max(0, (MOCK_LEVEL_CONFIGS[(MOCK_LEVEL_CONFIGS.indexOf(levelCfg) + 1)]?.minSpent || 999999) - selected.totalSpent).toLocaleString()}` : '—'}</Text></View>
            <View className={cn('min-w-[140px]')}><Text className={cn('text-xs text-slate-500')}>ส่วนลดปัจจุบัน</Text><Text className={cn('text-xs font-semibold text-slate-950')}>{levelCfg?.discountPercent || 0}%</Text></View>
            <View className={cn('min-w-[140px]')}><Text className={cn('text-xs text-slate-500')}>อัตราแต้ม</Text><Text className={cn('text-xs font-semibold text-slate-950')}>x{levelCfg?.earnMultiplier || 1}</Text></View>
            <View className={cn('min-w-[140px]')}><Text className={cn('text-xs text-slate-500')}>แต้มหมดอายุ</Text><Text className={cn('text-xs font-semibold text-slate-950')}>{levelCfg?.expireDays || 365} วัน</Text></View>
          </View>
        </View>

        {/* Point History */}
        <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
          <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>ประวัติคะแนน (ล่าสุด)</Text>
          <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')} style={{ minWidth: 800 }}>
            <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-3 border-b border-slate-200')}>
              {['วันที่','รายการ','แต้ม','ยอดคงเหลือ'].map((h,i) => <Text key={i} className={cn('text-xs font-bold text-slate-500 flex-1')}>{h}</Text>)}
            </View>
            {[
              { date: '15/06/2567', desc: 'ซื้อสินค้า บิล #1a2e0555', pts: '+50', bal: selected.pointBalance },
              { date: '12/06/2567', desc: 'แลกคูปอง BIRTH20', pts: '-200', bal: selected.pointBalance - 50 },
              { date: '08/06/2567', desc: 'ซื้อสินค้า บิล #1e3a8a88', pts: '+120', bal: selected.pointBalance + 150 },
              { date: '01/06/2567', desc: 'โบนัสวันเกิด x2', pts: '+80', bal: selected.pointBalance + 30 },
            ].map((h, i) => (
              <View key={i} className={cn('flex-row items-center py-2.5 px-3 border-b border-slate-200', i % 2 === 1 && 'bg-[#f6f7fb]')}>
                <Text className={cn('text-xs text-slate-950 flex-1')}>{h.date}</Text>
                <Text className={cn('text-xs text-slate-950')} style={[{ flex: 2 }]}>{h.desc}</Text>
                <Text className={cn('text-xs font-bold')} style={[{ color: h.pts.startsWith('+') ? '#0f766e' : '#ef4444' }]}>{h.pts}</Text>
                <Text className={cn('text-xs text-slate-950 flex-1')}>{h.bal.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Purchase History */}
        <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
          <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>ประวัติการซื้อ (ล่าสุด)</Text>
          <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')} style={{ minWidth: 800 }}>
            <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-3 border-b border-slate-200')}>
              {['วันที่','เลขบิล','จำนวนสินค้า','ยอดเงิน','ชำระ'].map((h,i) => <Text key={i} className={cn('text-xs font-bold text-slate-500 flex-1')}>{h}</Text>)}
            </View>
            {[
              { date: '15/06/2567', bill: '#1a2e0555', items: 5, amount: 1250, pay: 'เงินสด' },
              { date: '08/06/2567', bill: '#1e3a8a88', items: 3, amount: 3000, pay: 'QR Code' },
              { date: '28/05/2567', bill: '#1e3a8a55', items: 8, amount: 4500, pay: 'บัตรเครดิต' },
            ].map((h, i) => (
              <View key={i} className={cn('flex-row items-center py-2.5 px-3 border-b border-slate-200', i % 2 === 1 && 'bg-[#f6f7fb]')}>
                <Text className={cn('text-xs text-slate-950 flex-1')}>{h.date}</Text>
                <Text className={cn('text-xs text-slate-950 flex-1')}>{h.bill}</Text>
                <Text className={cn('text-xs text-slate-950 flex-1')}>{h.items} ชิ้น</Text>
                <Text className={cn('text-xs font-semibold text-slate-950')}>฿{h.amount.toLocaleString()}</Text>
                <Text className={cn('text-xs text-slate-950 flex-1')}>{h.pay}</Text>
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
      <Text className={cn('text-sm font-bold text-slate-800 mb-3')}>ข้อมูลสมาชิก</Text>
      {/* KPI row */}
      <View className={cn('flex-row gap-2.5 mb-3')} style={isMobile ? { flexWrap: 'wrap' } : undefined}>
        <View className={cn('flex-1 bg-white rounded-lg p-3 border border-slate-100 items-center')} style={isMobile ? { flexBasis: '46%', minWidth: 130 } : undefined}>
          <Text className={cn('text-base font-bold text-rose-500')}>{members.length}</Text>
          <Text className={cn('text-[10px] text-slate-500 mt-0.5')}>สมาชิกทั้งหมด</Text>
        </View>
        <View className={cn('flex-1 bg-white rounded-lg p-3 border border-slate-100 items-center')} style={isMobile ? { flexBasis: '46%', minWidth: 130 } : undefined}>
          <Text className={cn('text-base font-bold text-violet-600')}>{newMonth}</Text>
          <Text className={cn('text-[10px] text-slate-500 mt-0.5')}>สมาชิกใหม่เดือนนี้</Text>
        </View>
        <View className={cn('flex-1 bg-white rounded-lg p-3 border border-slate-100 items-center')} style={isMobile ? { flexBasis: '46%', minWidth: 130 } : undefined}>
          <Text className={cn('text-base font-bold text-emerald-600')}>{active}</Text>
          <Text className={cn('text-[10px] text-slate-500 mt-0.5')}>Active</Text>
        </View>
        <View className={cn('flex-1 bg-white rounded-lg p-3 border border-slate-100 items-center')} style={isMobile ? { flexBasis: '46%', minWidth: 130 } : undefined}>
          <Text className={cn('text-base font-bold text-red-500')}>{suspended}</Text>
          <Text className={cn('text-[10px] text-slate-500 mt-0.5')}>Suspended</Text>
        </View>
      </View>
      {/* Search */}
      <View className={cn('flex-row items-center bg-white border border-slate-200 rounded-lg px-3 h-9 mb-3')}>
        <Ionicons name="search" size={14} color="#94a3b8" />
        <TextInput className={cn('flex-1 ml-2 text-xs text-slate-800')} placeholder="ค้นหาชื่อ, เบอร์โทร, หมายเลขสมาชิก..." value={kw} onChangeText={setKw} placeholderTextColor="#94a3b8" />
        {kw ? <TouchableOpacity onPress={() => setKw('')}><Ionicons name="close-circle" size={16} color="#cbd5e1" /></TouchableOpacity> : null}
      </View>
      {/* Table / Cards */}
      {isMobile ? (
        <View style={{ gap: 8 }}>
          {list.map((m) => {
            const levelCfg = MOCK_LEVEL_CONFIGS.find(c => c.level === m.level);
            return (
              <TouchableOpacity key={m.id} className={cn('bg-white rounded-lg p-3 border border-slate-100')} onPress={() => setSelectedId(m.id)}>
                <View className={cn('flex-row items-center justify-between mb-1')}>
                  <Text className={cn('text-xs font-semibold text-slate-800')}>{m.name}</Text>
                  <View className={cn('flex-row items-center gap-1')}><View className={cn('w-1.5 h-1.5 rounded-full')} style={{ backgroundColor: m.isActive ? '#10b981' : '#ef4444' }} /><Text className={cn('text-[10px] text-slate-500')}>{m.isActive ? 'Active' : 'ระงับ'}</Text></View>
                </View>
                <Text className={cn('text-[11px] text-slate-400 mb-1.5')}>{m.phone} · {m.memberNo}</Text>
                <View className={cn('flex-row items-center gap-2')}>
                  <View className={cn('px-2 py-0.5 rounded')} style={{ backgroundColor: levelCfg?.color || '#a3a3a3' }}><Text className={cn('text-[10px] font-bold text-white')}>{levelCfg?.label || m.level}</Text></View>
                  <Text className={cn('text-[11px] text-slate-500')}>{m.pointBalance.toLocaleString()} แต้ม</Text>
                  <Text className={cn('text-[11px] text-slate-500')}>฿{m.totalSpent.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {list.length === 0 && <Text className={cn('text-xs text-slate-400 text-center py-8')}>ไม่พบสมาชิก</Text>}
        </View>
      ) : (
        <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 920 }}>
              {/* Header */}
              <View className={cn('flex-row items-center bg-slate-50 border-b border-slate-200 px-3 h-9')}>
                <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 90 }}>รหัส</Text>
                <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 140 }}>ชื่อ</Text>
                <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 105 }}>เบอร์โทร</Text>
                <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 155 }}>Email</Text>
                <Text className={cn('text-[11px] font-semibold text-slate-500 text-center')} style={{ width: 70 }}>ระดับ</Text>
                <Text className={cn('text-[11px] font-semibold text-slate-500 text-right')} style={{ width: 60 }}>คะแนน</Text>
                <Text className={cn('text-[11px] font-semibold text-slate-500 text-right')} style={{ width: 80 }}>ยอดซื้อ</Text>
                <Text className={cn('text-[11px] font-semibold text-slate-500 text-center')} style={{ width: 60 }}>สถานะ</Text>
                <Text className={cn('text-[11px] font-semibold text-slate-500')} style={{ width: 85 }}>วันสมัคร</Text>
              </View>
              {/* Rows */}
              {list.map((m, i) => {
                const lvl = MOCK_LEVEL_CONFIGS.find(c => c.level === m.level);
                return (
                  <TouchableOpacity key={m.id} className={cn('flex-row items-center px-3 h-10 border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/60')} onPress={() => setSelectedId(m.id)}>
                    <Text className={cn('text-xs text-slate-600')} style={{ width: 90 }} numberOfLines={1}>{m.memberNo}</Text>
                    <Text className={cn('text-xs font-medium text-slate-800')} style={{ width: 140 }} numberOfLines={1}>{m.name}</Text>
                    <Text className={cn('text-xs text-slate-600')} style={{ width: 105 }} numberOfLines={1}>{m.phone}</Text>
                    <Text className={cn('text-xs text-slate-500')} style={{ width: 155 }} numberOfLines={1}>{m.email || '—'}</Text>
                    <View style={{ width: 70, alignItems: 'center' }}><View className={cn('px-2 py-0.5 rounded')} style={{ backgroundColor: lvl?.color || '#a3a3a3' }}><Text className={cn('text-[10px] font-bold text-white')}>{lvl?.label || m.level}</Text></View></View>
                    <Text className={cn('text-xs text-slate-700 text-right')} style={{ width: 60 }}>{m.pointBalance.toLocaleString()}</Text>
                    <Text className={cn('text-xs text-slate-700 text-right')} style={{ width: 80 }}>{m.totalSpent.toLocaleString()}</Text>
                    <View style={{ width: 60, alignItems: 'center' }}><View className={cn('flex-row items-center gap-1')}><View className={cn('w-1.5 h-1.5 rounded-full')} style={{ backgroundColor: m.isActive ? '#10b981' : '#ef4444' }} /><Text className={cn('text-[10px] text-slate-600')}>{m.isActive ? 'Active' : 'ระงับ'}</Text></View></View>
                    <Text className={cn('text-xs text-slate-500')} style={{ width: 85 }} numberOfLines={1}>{m.joinDate}</Text>
                  </TouchableOpacity>
                );
              })}
              {list.length === 0 && <View className={cn('py-8 items-center')}><Text className={cn('text-xs text-slate-400')}>ไม่พบสมาชิก</Text></View>}
            </View>
          </ScrollView>
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
      <Text className={cn('text-sm font-extrabold text-slate-950 mb-4')}>เพิ่มสมาชิกใหม่</Text>
      <View className={cn('bg-white rounded-xl p-5 border border-slate-200')}>
        <View className={cn('flex-row gap-3 mb-2')}><Field label="ชื่อ-สกุล" value={name} onChange={setName} required flex={1} /><Field label="เบอร์โทร" value={phone} onChange={setPhone} required placeholder="08x-xxx-xxxx" flex={1} /><Field label="Email" value={email} onChange={setEmail} flex={1} /></View>
        <View className={cn('flex-row gap-3 mb-2')}><Field label="วันเกิด" value={dob} onChange={setDob} placeholder="YYYY-MM-DD" flex={1} type="date" /><Field label="Line ID" value={lineId} onChange={setLineId} flex={1} />
          <View className={cn('flex-col')} style={{ flex: 1 }}><Text className={cn('text-xs font-bold text-slate-500 mb-1')}>เพศ</Text><View className={cn('flex-row gap-2 flex-wrap')}>{['ชาย','หญิง','อื่นๆ'].map(g => <TouchableOpacity key={g} className={cn('px-3 py-1.5 rounded-lg border border-slate-200 bg-white', gender === g && 'bg-rose-500 border-rose-500')} onPress={() => setGender(g)}><Text className={cn('text-xs text-slate-500', gender === g && 'text-white font-bold')}>{g}</Text></TouchableOpacity>)}</View></View>
        </View>
        <View className={cn('flex-row gap-3 mb-2')}><Field label="ที่อยู่" value={address} onChange={setAddress} flex={2} /><Field label="หมายเหตุ" value={remark} onChange={setRemark} flex={1} /></View>
        <View className={cn('flex-row justify-end items-center gap-3 mt-3')}>{saved && <Text className={cn('text-xs text-emerald-600 font-semibold')}>✓ บันทึกเรียบร้อย</Text>}<TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-lg px-4 py-2.5')} onPress={handleSave}><Ionicons name="checkmark-circle" size={16} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>บันทึกสมาชิก</Text></TouchableOpacity></View>
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
      <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>ระดับสมาชิก</Text>
      <Text className={cn('text-xs text-slate-500 mb-4')}>กำหนดเงื่อนไขการอัปเกรดระดับอัตโนมัติ (กดที่การ์ดเพื่อแก้ไข)</Text>
      <View className={cn('flex-row flex-wrap gap-4')}>
        {MOCK_LEVEL_CONFIGS.map(cfg => (
          <TouchableOpacity key={cfg.level} className={cn('bg-white rounded-xl border border-slate-200 w-[240px]')} onPress={() => startEdit(cfg)}>
            <View className={cn('h-2 rounded-t-xl')} style={[{ backgroundColor: cfg.color }]} />
            <View className={cn('p-4')}>
            <Text className={cn('text-sm font-bold text-slate-950 mb-3')}>{cfg.label}</Text>
            {editing === cfg.level ? (
              <View style={{ gap: 6 }}>
                <Field label="ยอดซื้อขั้นต่ำ (฿)" value={editValues.minSpent} onChange={v => setEditValues(p => ({ ...p, minSpent: v }))} />
                <Field label="จำนวนบิล" value={editValues.minBills} onChange={v => setEditValues(p => ({ ...p, minBills: v }))} />
                <Field label="ส่วนลด (%)" value={editValues.discount} onChange={v => setEditValues(p => ({ ...p, discount: v }))} />
                <Field label="อัตราแต้ม (x)" value={editValues.multiplier} onChange={v => setEditValues(p => ({ ...p, multiplier: v }))} />
                <Field label="หมดอายุ (วัน)" value={editValues.expiry} onChange={v => setEditValues(p => ({ ...p, expiry: v }))} />
                <TouchableOpacity className={cn('self-start bg-rose-500 rounded-lg px-4 py-2.5')} onPress={() => { setEditing(null); alert('บันทึกระดับ ' + cfg.label + ' เรียบร้อย'); }}>
                  <Text className={cn('text-xs font-bold text-white')}>บันทึก</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 4 }}>
                <View className={cn('flex-row justify-between py-1')}><Text className={cn('text-xs text-slate-500')}>ยอดซื้อขั้นต่ำ</Text><Text className={cn('text-xs font-semibold text-slate-950')}>{cfg.minSpent.toLocaleString()} ฿</Text></View>
                <View className={cn('flex-row justify-between py-1')}><Text className={cn('text-xs text-slate-500')}>จำนวนบิล</Text><Text className={cn('text-xs font-semibold text-slate-950')}>{cfg.minBills} บิล</Text></View>
                <View className={cn('flex-row justify-between py-1')}><Text className={cn('text-xs text-slate-500')}>ส่วนลด</Text><Text className={cn('text-xs font-semibold text-slate-950')}>{cfg.discountPercent}%</Text></View>
                <View className={cn('flex-row justify-between py-1')}><Text className={cn('text-xs text-slate-500')}>อัตราแต้ม</Text><Text className={cn('text-xs font-semibold text-slate-950')}>x{cfg.earnMultiplier}</Text></View>
                <View className={cn('flex-row justify-between py-1')}><Text className={cn('text-xs text-slate-500')}>หมดอายุ</Text><Text className={cn('text-xs font-semibold text-slate-950')}>{cfg.expireDays} วัน</Text></View>
                <Text className={cn('text-xs mt-1')} style={[{ color: '#a8a29e' }]}>กดเพื่อแก้ไข</Text>
              </View>
            )}
            </View>
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
      <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>ตั้งค่าคะแนนสะสม</Text>
      <Text className={cn('text-xs text-slate-500 mb-4')}>กำหนดอัตราการได้รับ/แลกแต้ม และเงื่อนไขต่างๆ</Text>
      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <Text className={cn('text-xs font-bold text-slate-950 mb-3')}>การสะสมแต้ม</Text>
        <View className={cn('flex-row items-center justify-between mb-3')}><Text className={cn('text-xs text-slate-950')}>เปิดใช้ระบบคะแนน</Text><Switch value={enabled} onValueChange={setEnabled} /></View>
        <View className={cn('flex-row gap-3 mb-2')}>
          <Field label="ทุกกี่บาทได้ 1 แต้ม" value={earnRate} onChange={setEarnRate} placeholder="25" flex={1} />
          <Field label="1 แต้ม = กี่บาท (แลก)" value={redeemRate} onChange={setRedeemRate} placeholder="1" flex={1} />
          <Field label="แต้มหมดอายุ (วัน)" value={expiryDays} onChange={setExpiryDays} placeholder="365" flex={1} />
        </View>
        <Field label="แต้มขั้นต่ำที่แลกได้" value={minRedeem} onChange={setMinRedeem} placeholder="100" />
      </View>
      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <Text className={cn('text-xs font-bold text-slate-950 mb-3')}>โบนัสพิเศษ</Text>
        <View className={cn('flex-row items-center justify-between mb-3')}><Text className={cn('text-xs text-slate-950')}>โบนัสวันเกิด</Text><Switch value={birthday} onValueChange={setBirthday} /></View>
        {birthday && <Field label="ตัวคูณวันเกิด (เท่า)" value={birthdayBonus} onChange={setBirthdayBonus} placeholder="2" />}
      </View>
      <TouchableOpacity className={cn('flex-row items-center gap-1.5 self-start bg-rose-500 rounded-lg px-4 py-2.5')}><Ionicons name="checkmark-circle" size={16} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>บันทึกการตั้งค่า</Text></TouchableOpacity>
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
      <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>ปรับปรุงคะแนน</Text>
      <Text className={cn('text-xs text-slate-500 mb-4')}>เพิ่มหรือหักคะแนนสมาชิกด้วยตนเอง (Manual Adjustment)</Text>

      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <Text className={cn('text-xs font-bold text-slate-950 mb-3')}>ปรับปรุงคะแนนสมาชิก</Text>

        {/* เลือกสมาชิก */}
        <View className={cn('flex-col mb-3')}>
          <Text className={cn('text-xs font-bold text-slate-500 mb-1')}>ค้นหา/เลือกสมาชิก <Text style={{ color: '#ef4444' }}>*</Text></Text>
          <TextInput className={cn('border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-950 bg-white')} value={search} onChangeText={setSearch} placeholder="พิมพ์ชื่อ, เบอร์โทร, รหัสสมาชิก..." placeholderTextColor={'#a8a29e'} />
        </View>
        {search.trim() !== '' && (
          <View style={{ maxHeight: 120, borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 8, marginBottom: 8 }}>
            <ScrollView nestedScrollEnabled>
              {filteredMembers.slice(0, 5).map(m => (
                <TouchableOpacity key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#e7e5e4', backgroundColor: selectedMember === m.id ? '#f3e8ff' : '#fafafa' }}
                  onPress={() => { setSelectedMember(m.id); setSearch(m.name); }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#292524' }}>{m.name}</Text>
                  <Text style={{ fontSize: 12, color: '#a8a29e' }}>{m.memberNo} · {m.phone} · {m.pointBalance} แต้ม</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {selMember && (
          <View style={{ flexDirection: 'row', gap: 12, backgroundColor: '#d1fae5', borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#0f766e', fontWeight: '600' }}>เลือก: {selMember.name}</Text>
            <Text style={{ fontSize: 13, color: '#0f766e' }}>คะแนนปัจจุบัน: {selMember.pointBalance.toLocaleString()}</Text>
          </View>
        )}

        {/* ประเภท */}
        <View className={cn('flex-col mb-3')}>
          <Text className={cn('text-xs font-bold text-slate-500 mb-1')}>ประเภทการปรับ</Text>
          <View className={cn('flex-row gap-2 flex-wrap')}>
            <TouchableOpacity className={cn('px-3 py-1.5 rounded-lg border border-slate-200 bg-white')} style={[adjustType === 'add' && { backgroundColor: '#d1fae5', borderColor: '#0f766e' }]} onPress={() => setAdjustType('add')}>
              <Text className={cn('text-xs text-slate-500', adjustType === 'add' && 'text-emerald-600 font-bold')}>+ เพิ่มคะแนน</Text>
            </TouchableOpacity>
            <TouchableOpacity className={cn('px-3 py-1.5 rounded-lg border border-slate-200 bg-white')} style={[adjustType === 'deduct' && { backgroundColor: '#ffe4e6', borderColor: '#ef4444' }]} onPress={() => setAdjustType('deduct')}>
              <Text className={cn('text-xs text-slate-500', adjustType === 'deduct' && 'text-rose-600 font-bold')}>- หักคะแนน</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className={cn('flex-row gap-3 mb-2')}>
          <Field label="จำนวนคะแนน" value={amount} onChange={setAmount} placeholder="เช่น 500" required flex={1} />
          <Field label="เหตุผล / หมายเหตุ" value={reason} onChange={setReason} placeholder="ระบุเหตุผลการปรับปรุง" required flex={2} />
        </View>

        <View className={cn('flex-row justify-end items-center gap-3 mt-3')}>
          <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-lg px-4 py-2.5')} onPress={handleSubmit}>
            <Ionicons name="swap-horizontal" size={14} color="#fafafa" />
            <Text className={cn('text-xs font-bold text-white')}>{adjustType === 'add' ? 'เพิ่มคะแนน' : 'หักคะแนน'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* History */}
      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <Text className={cn('text-xs font-bold text-slate-950 mb-3')}>ประวัติการปรับปรุงคะแนน</Text>
        <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')} style={{ minWidth: 800 }}>
          <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-3 border-b border-slate-200')}>
            {['วันที่', 'สมาชิก', 'ประเภท', 'คะแนน', 'เหตุผล', 'โดย'].map((h, i) => <Text key={i} className={cn('text-xs font-bold text-slate-500 flex-1')} style={[i === 4 && { flex: 2 }]}>{h}</Text>)}
          </View>
          {history.map((h, i) => (
            <View key={i} className={cn('flex-row items-center py-2.5 px-3 border-b border-slate-200', i % 2 === 1 && 'bg-[#f6f7fb]')}>
              <Text className={cn('text-xs text-slate-950 flex-1')}>{h.date}</Text>
              <Text className={cn('text-xs font-semibold text-slate-950 flex-1')}>{h.member}</Text>
              <View className={cn('flex-1')}><Badge text={h.type === 'add' ? 'เพิ่ม' : 'หัก'} color={h.type === 'add' ? '#0f766e' : '#ef4444'} bg={h.type === 'add' ? '#d1fae5' : '#ffe4e6'} /></View>
              <Text className={cn('text-xs font-bold flex-1')} style={[{ color: h.type === 'add' ? '#0f766e' : '#ef4444' }]}>{h.type === 'add' ? '+' : '-'}{h.amount}</Text>
              <Text className={cn('text-xs text-slate-950')} style={{ flex: 2 }}>{h.reason}</Text>
              <Text className={cn('text-xs text-slate-950 flex-1')}>{h.by}</Text>
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
      <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>คูปอง / Voucher</Text>
      <Text className={cn('text-xs text-slate-500 mb-4')}>สร้างและจัดการคูปองส่วนลด — เชื่อมกับ Promotion Store และส่งผ่าน LINE/SMS/Push</Text>

      {showForm && (
        <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
          <Text className={cn('text-xs font-bold text-slate-950 mb-3')}>สร้างคูปองใหม่</Text>
          <View className={cn('flex-row gap-3 mb-2')}>
            <Field label="รหัสคูปอง" value={cpCode} onChange={setCpCode} required placeholder="เช่น SAVE20" flex={1} />
            <Field label="คำอธิบาย" value={cpDesc} onChange={setCpDesc} required placeholder="เช่น ลด 20% สมาชิก Gold" flex={2} />
          </View>
          <View className={cn('flex-row gap-3 mb-2')}>
            <View className={cn('flex-col')} style={{ flex: 1 }}>
              <Text className={cn('text-xs font-bold text-slate-500 mb-1')}>ประเภทส่วนลด <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <View className={cn('flex-row gap-2 flex-wrap')}>
                <TouchableOpacity className={cn('px-3 py-1.5 rounded-lg border border-slate-200 bg-white', cpType === '%' && 'bg-rose-500 border-rose-500')} onPress={() => setCpType('%')}><Text className={cn('text-xs text-slate-500', cpType === '%' && 'text-white font-bold')}>เปอร์เซ็นต์ (%)</Text></TouchableOpacity>
                <TouchableOpacity className={cn('px-3 py-1.5 rounded-lg border border-slate-200 bg-white', cpType === 'Fixed' && 'bg-rose-500 border-rose-500')} onPress={() => setCpType('Fixed')}><Text className={cn('text-xs text-slate-500', cpType === 'Fixed' && 'text-white font-bold')}>จำนวนเงิน (฿)</Text></TouchableOpacity>
              </View>
            </View>
            <Field label={cpType === '%' ? 'ส่วนลด (%)' : 'ส่วนลด (฿)'} value={cpValue} onChange={setCpValue} required placeholder="เช่น 20" flex={1} />
            <Field label="จำนวนจำกัด (ใบ)" value={cpLimit} onChange={setCpLimit} placeholder="เช่น 100" flex={1} />
          </View>
          <View className={cn('flex-row gap-3 mb-2')}>
            <Field label="ยอดขั้นต่ำ (฿)" value={cpMinSpend} onChange={setCpMinSpend} placeholder="0 = ไม่มีขั้นต่ำ" flex={1} />
            <Field label="วันหมดอายุ" value={cpExpiry} onChange={setCpExpiry} placeholder="YYYY-MM-DD" flex={1} />
            <Field label="ระดับสมาชิก (ว่าง=ทุกคน)" value={cpLevel} onChange={setCpLevel} placeholder="เช่น Gold" flex={1} />
          </View>
          <View className={cn('flex-row justify-end items-center gap-3 mt-3')}>
            <TouchableOpacity className={cn('px-4 py-2')} onPress={() => setShowForm(false)}><Text className={cn('text-slate-500')} style={{ color: '#57534e' }}>ยกเลิก</Text></TouchableOpacity>
            <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-lg px-4 py-2.5')} onPress={handleCreateCoupon}>
              <Ionicons name="checkmark-circle" size={14} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>สร้างคูปอง</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* คูปองจาก Promotion Store */}
      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <View className={cn('flex-row justify-between items-center mb-2')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>คูปองจาก Promotion Store ({couponPromos.length})</Text>
        </View>
        <View className={cn('flex-row flex-wrap gap-3')}>
          {couponPromos.map((c) => (
            <View key={c.id} className={cn('bg-white rounded-xl border border-slate-200 p-4 w-[220px]')}>
              <View className={cn('flex-row justify-between items-center mb-2')}>
                <Text className={cn('text-xs font-extrabold text-slate-950')}>{c.couponCode || c.promoCode}</Text>
                <Badge text={c.status === 'active' ? 'Active' : c.status} color={c.status === 'active' ? '#0f766e' : '#a8a29e'} bg={c.status === 'active' ? '#d1fae5' : '#e7e5e4'} />
              </View>
              <Text className={cn('text-xs text-slate-500 mb-1')} numberOfLines={1}>{c.name}</Text>
              <Text className={cn('text-xs text-slate-500')}>
                ใช้แล้ว {c.couponUsed ?? c.usageCount}/{c.couponLimit ?? '∞'} · 
                {c.discountPercent ? ` ลด ${c.discountPercent}%` : ` ลด ฿${c.discountAmount}`}
              </Text>
              {c.status === 'active' && (
                <TouchableOpacity
                  className={cn('flex-row items-center gap-1 mt-2 py-1 px-2 rounded-lg self-start')}
                  style={[{ backgroundColor: '#d1fae5' }]}
                  onPress={() => { setSendCouponId(c.id); setShowSendModal(true); }}
                >
                  <Ionicons name="send" size={12} color="#0f766e" />
                  <Text className={cn('text-xs font-semibold text-emerald-600')}>ส่งคูปองผ่าน LINE/SMS</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>
      {!showForm && <TouchableOpacity className={cn('flex-row items-center gap-1.5 self-start bg-rose-500 rounded-lg px-4 py-2.5')} onPress={() => setShowForm(true)}><Ionicons name="add-circle" size={16} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>สร้างคูปองใหม่</Text></TouchableOpacity>}

      {/* Send Coupon Modal */}
      <Modal visible={showSendModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#fafafa', borderRadius: 12, padding: 24, width: 440 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <Ionicons name="paper-plane-outline" size={16} color="#292524" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#292524' }}>ส่งคูปองผ่าน Campaign</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#57534e', marginBottom: 12 }}>คูปอง: {promotions.find(p => p.id === sendCouponId)?.name}</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#57534e', marginBottom: 4 }}>ช่องทาง</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {(['line', 'sms', 'push'] as const).map(ch => (
                <TouchableOpacity
                  key={ch}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: sendChannel === ch ? (ch === 'line' ? '#0f766e' : ch === 'sms' ? '#6b21a8' : '#a16207') : '#e7e5e4', backgroundColor: sendChannel === ch ? (ch === 'line' ? '#0f766e12' : ch === 'sms' ? '#6b21a812' : '#a1620712') : '#fafafa' }}
                  onPress={() => setSendChannel(ch)}
                >
                  <Ionicons name={ch === 'line' ? 'chatbubble-ellipses' : ch === 'sms' ? 'chatbox' : 'notifications'} size={14} color={ch === 'line' ? '#0f766e' : ch === 'sms' ? '#6b21a8' : '#a16207'} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: ch === 'line' ? '#0f766e' : ch === 'sms' ? '#6b21a8' : '#a16207' }}>{ch.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#57534e', marginBottom: 4 }}>ข้อความ (ไม่บังคับ)</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 8, padding: 10, fontSize: 13, height: 60, textAlignVertical: 'top', marginBottom: 12, color: '#292524' }}
              value={sendMsg} onChangeText={setSendMsg}
              placeholder="ข้อความที่ส่งพร้อมคูปอง..."
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity className={cn('px-4 py-2 rounded-lg')} style={[{ backgroundColor: '#e7e5e4' }]} onPress={() => setShowSendModal(false)}>
                <Text className={cn('text-xs text-slate-500')}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-lg px-4 py-2.5')} onPress={handleSendCoupon}>
                <Ionicons name="send" size={14} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>ส่งคูปอง</Text>
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
      (couponId ? `คูปอง "${cCouponCode.toUpperCase()}" พร้อมใช้ที่ POS แล้ว\n` : '') +
      `ส่งผ่าน ${cChannel} แล้ว`);

    setShowForm(false); setCName(''); setCMsg(''); setCTarget(''); setCCouponCode(''); setCCouponDiscount('');
  };

  return (
    <View>
      <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>Campaign Marketing</Text>
      <Text className={cn('text-xs text-slate-500 mb-4')}>สร้างแคมเปญส่งข้อความ SMS / LINE / Email ถึงสมาชิก</Text>

      {showForm && (
        <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
          <Text className={cn('text-xs font-bold text-slate-950 mb-3')}>สร้างแคมเปญใหม่</Text>
          <View className={cn('flex-row gap-3 mb-2')}>
            <Field label="ชื่อแคมเปญ" value={cName} onChange={setCName} required flex={1} />
            <View className={cn('flex-col')} style={{ flex: 1 }}>
              <Text className={cn('text-xs font-bold text-slate-500 mb-1')}>ช่องทาง <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <View className={cn('flex-row gap-2 flex-wrap')}>
                {['LINE','SMS','Email'].map(ch => <TouchableOpacity key={ch} className={cn('px-3 py-1.5 rounded-lg border border-slate-200 bg-white', cChannel === ch && 'bg-rose-500 border-rose-500')} onPress={() => setCChannel(ch)}><Text className={cn('text-xs text-slate-500', cChannel === ch && 'text-white font-bold')}>{ch}</Text></TouchableOpacity>)}
              </View>
            </View>
          </View>
          <View className={cn('flex-row gap-3 mb-2')}>
            <Field label="กลุ่มเป้าหมาย" value={cTarget} onChange={setCTarget} placeholder="เช่น สมาชิกใหม่, Gold+" flex={1} />
            <Field label="ข้อความ" value={cMsg} onChange={setCMsg} placeholder="เนื้อหาที่จะส่ง..." flex={2} />
          </View>
          {/* แนบคูปอง (สร้างเข้า promoStore → POS ใช้ได้ทันที) */}
          <View className={cn('bg-white rounded-xl p-4 mt-2 mb-3')} style={[{ backgroundColor: '#fed7aa', borderColor: '#a16207' }]}>
            <View className={cn('mb-1.5 flex-row items-center gap-1.5')}>
              <Ionicons name="ticket-outline" size={14} color="#a16207" />
              <Text className={cn('text-xs font-semibold')} style={{ color: '#a16207' }}>แนบคูปอง (POS ใช้ได้ทันที)</Text>
            </View>
            <View className={cn('flex-row gap-3 mb-2')}>
              <Field label="รหัสคูปอง" value={cCouponCode} onChange={setCCouponCode} placeholder="เช่น WELCOME50" flex={1} />
              <View className={cn('flex-col')} style={{ flex: 1 }}>
                <Text className={cn('text-xs font-bold text-slate-500 mb-1')}>ประเภท</Text>
                <View className={cn('flex-row gap-2 flex-wrap')}>
                  <TouchableOpacity className={cn('px-3 py-1.5 rounded-lg border border-slate-200 bg-white', cCouponType === '%' && 'bg-rose-500 border-rose-500')} onPress={() => setCCouponType('%')}><Text className={cn('text-xs text-slate-500', cCouponType === '%' && 'text-white font-bold')}>%</Text></TouchableOpacity>
                  <TouchableOpacity className={cn('px-3 py-1.5 rounded-lg border border-slate-200 bg-white', cCouponType === 'Fixed' && 'bg-rose-500 border-rose-500')} onPress={() => setCCouponType('Fixed')}><Text className={cn('text-xs text-slate-500', cCouponType === 'Fixed' && 'text-white font-bold')}>฿</Text></TouchableOpacity>
                </View>
              </View>
              <Field label="ส่วนลด" value={cCouponDiscount} onChange={setCCouponDiscount} placeholder={cCouponType === '%' ? 'เช่น 20' : 'เช่น 50'} flex={1} />
            </View>
            <Text className={cn('text-xs')} style={{ color: '#a16207' }}>ถ้ากรอกรหัส+ส่วนลด → ระบบสร้างคูปองจริง ใช้ได้ที่ POS ทันที (หมดอายุ 90 วัน)</Text>
          </View>
          <View className={cn('flex-row justify-end items-center gap-3 mt-3')}>
            <TouchableOpacity className={cn('px-4 py-2')} onPress={() => setShowForm(false)}><Text className={cn('text-slate-500')}>ยกเลิก</Text></TouchableOpacity>
            <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-lg px-4 py-2.5')} onPress={handleCreateCampaign}>
              <Ionicons name="send" size={14} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>สร้างแคมเปญ</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden mb-3')} style={{ minWidth: 800 }}>
        {campaigns.map((c, i) => (
          <View key={i} className={cn('flex-row items-center py-2.5 px-3 border-b border-slate-200', i % 2 === 1 && 'bg-[#f6f7fb]')}>
            <Text className={cn('text-xs font-semibold text-slate-950')} style={{ flex: 1.5 }}>{c.name}</Text>
            <View className={cn('flex-1')}><Badge text={c.channel} color="#0284c7" bg="#e0f2fe" /></View>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{c.target}</Text>
            <View className={cn('flex-1')}><Badge text={c.status} color={c.status === 'Active' ? '#0f766e' : c.status === 'Draft' ? '#57534e' : '#a16207'} bg={c.status === 'Active' ? '#d1fae5' : c.status === 'Draft' ? '#e7e5e4' : '#fed7aa'} /></View>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{c.sent} sent</Text>
          </View>
        ))}
      </View>
      {!showForm && <TouchableOpacity className={cn('flex-row items-center gap-1.5 self-start bg-rose-500 rounded-lg px-4 py-2.5')} onPress={() => setShowForm(true)}><Ionicons name="add-circle" size={16} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>สร้างแคมเปญใหม่</Text></TouchableOpacity>}
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
      <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>Communication Hub</Text>
      <Text className={cn('text-xs text-slate-500 mb-4')}>ส่งข้อความ / คูปอง ผ่าน LINE Broadcast, SMS, Push Notification</Text>

      {/* Quick Stats */}
      <View className={cn('flex-row gap-3 mb-4 flex-wrap')}>
        <View className={cn('bg-white p-3.5 rounded-lg border border-slate-200 items-center')} style={{ minWidth: 110 }}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#22c55e" />
          <Text className={cn('text-xs font-bold mt-1 text-slate-950')}>{stats.totalLineFriends.toLocaleString()}</Text>
          <Text className={cn('text-xs text-slate-500')}>LINE Friends</Text>
        </View>
        <View className={cn('bg-white p-3.5 rounded-lg border border-slate-200 items-center')} style={{ minWidth: 110 }}>
          <Ionicons name="megaphone" size={20} color="#f59e0b" />
          <Text className={cn('text-xs font-bold mt-1 text-slate-950')}>{stats.broadcastThisMonth}</Text>
          <Text className={cn('text-xs text-slate-500')}>Broadcast เดือนนี้</Text>
        </View>
        <View className={cn('bg-white p-3.5 rounded-lg border border-slate-200 items-center')} style={{ minWidth: 110 }}>
          <Ionicons name="ticket" size={20} color="#0ea5e9" />
          <Text className={cn('text-xs font-bold mt-1 text-slate-950')}>{stats.broadcastQuotaLeft}</Text>
          <Text className={cn('text-xs text-slate-500')}>Quota เหลือ</Text>
        </View>
        <View className={cn('bg-white p-3.5 rounded-lg border border-slate-200 items-center')} style={{ minWidth: 110 }}>
          <Ionicons name="eye" size={20} color="#06b6d4" />
          <Text className={cn('text-xs font-bold mt-1 text-slate-950')}>{stats.avgOpenRate}%</Text>
          <Text className={cn('text-xs text-slate-500')}>Open Rate</Text>
        </View>
        <View className={cn('bg-white p-3.5 rounded-lg border border-slate-200 items-center')} style={{ minWidth: 110 }}>
          <Ionicons name="chatbox" size={20} color="#a21caf" />
          <Text className={cn('text-xs font-bold mt-1 text-slate-950')}>{stats.smsCredits.toLocaleString()}</Text>
          <Text className={cn('text-xs text-slate-500')}>SMS Credit</Text>
        </View>
      </View>

      {/* Quick Send Coupon */}
      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <View className={cn('mb-2 flex-row items-center gap-1.5')}>
          <Ionicons name="flash-outline" size={15} color="#0f172a" />
          <Text className={cn('text-xs font-bold text-slate-950')}>ส่งคูปองด่วน (LINE Broadcast)</Text>
        </View>
        <Text className={cn('text-xs text-slate-500 mb-2')}>เลือกคูปองจาก Promotion Store แล้วส่งให้ LINE Friends ทั้งหมด</Text>
        <View className={cn('flex-row gap-2 flex-wrap mb-2')}>
          {activeCoupons.map(c => (
            <TouchableOpacity
              key={c.id}
              className={cn('flex-row items-center gap-1 px-2.5 py-1.5 rounded-full border')}
              style={[{ borderColor: quickCouponId === c.id ? '#0f766e' : '#e7e5e4', backgroundColor: quickCouponId === c.id ? '#d1fae5' : '#fafaf9' }]}
              onPress={() => setQuickCouponId(c.id)}
            >
              <Ionicons name="pricetag" size={12} color={quickCouponId === c.id ? '#0f766e' : '#57534e'} />
              <Text style={{ fontSize: 13, color: quickCouponId === c.id ? '#0f766e' : '#57534e', fontWeight: quickCouponId === c.id ? '600' : '400' }} numberOfLines={1}>
                {c.couponCode || c.promoCode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity className={cn('flex-row items-center gap-1.5 self-start bg-rose-500 rounded-lg px-4 py-2.5')} onPress={handleQuickSend}>
          <Ionicons name="send" size={14} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>ส่งผ่าน LINE</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Broadcasts */}
      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <View className={cn('mb-2 flex-row items-center gap-1.5')}>
          <Ionicons name="paper-plane-outline" size={15} color="#0f172a" />
          <Text className={cn('text-xs font-bold text-slate-950')}>Broadcast ล่าสุด</Text>
        </View>
        {recentBroadcasts.map(b => (
          <View key={b.id} className={cn('flex-row items-center gap-2 py-2 border-b border-slate-200')}>
            <Ionicons name={b.channel === 'line' ? 'chatbubble-ellipses' : b.channel === 'sms' ? 'chatbox' : 'notifications'} size={16} color={b.channel === 'line' ? '#0f766e' : b.channel === 'sms' ? '#6b21a8' : '#a16207'} />
            <Text className={cn('flex-1 text-xs font-medium text-slate-950')}>{b.name}</Text>
            <Text className={cn('text-xs text-slate-500')}>ส่ง {b.sentCount.toLocaleString()} · เปิด {b.openCount.toLocaleString()}</Text>
            <Text className={cn('text-xs text-slate-500')}>{b.sentAt ? new Date(b.sentAt).toLocaleDateString('th-TH') : ''}</Text>
          </View>
        ))}
      </View>

      <View className={cn('mt-2 flex-row items-start gap-1.5')}>
        <Ionicons name="information-circle-outline" size={14} color="#a8a29e" />
        <Text className={cn('flex-1 text-xs')} style={{ color: '#a8a29e' }}>
          สำหรับจัดการ Broadcast, Contacts, Templates เต็มรูปแบบ ไปที่เมนู "Communication" บน Sidebar หลัก
        </Text>
      </View>
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
      <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>Gamification</Text>
      <Text className={cn('text-xs text-slate-500 mb-4')}>สร้างเกมส์และกิจกรรมเพื่อดึงดูดลูกค้า (Wheel of Fortune, สุ่มรางวัล, Check-in)</Text>

      {showForm && (
        <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
          <Text className={cn('text-xs font-bold text-slate-950 mb-3')}>สร้างเกมใหม่</Text>
          <View className={cn('flex-row gap-3 mb-2')}>
            <Field label="ชื่อเกม" value={gName} onChange={setGName} required flex={1} />
            <View className={cn('flex-col')} style={{ flex: 1 }}>
              <Text className={cn('text-xs font-bold text-slate-500 mb-1')}>ประเภท <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <View className={cn('flex-row gap-2 flex-wrap')}>
                {['Wheel','Lucky Box','Check-in','Scratch','Quiz'].map(t => <TouchableOpacity key={t} className={cn('px-3 py-1.5 rounded-lg border border-slate-200 bg-white', gType === t && 'bg-rose-500 border-rose-500')} onPress={() => setGType(t)}><Text className={cn('text-xs text-slate-500', gType === t && 'text-white font-bold')}>{t}</Text></TouchableOpacity>)}
              </View>
            </View>
          </View>
          <Field label="รางวัล (เช่น 50 แต้ม, คูปอง ลด 20%)" value={gReward} onChange={setGReward} placeholder="ระบุรางวัล" />
          <View className={cn('flex-row justify-end items-center gap-3 mt-3')}>
            <TouchableOpacity className={cn('px-4 py-2')} onPress={() => setShowForm(false)}><Text className={cn('text-slate-500')}>ยกเลิก</Text></TouchableOpacity>
            <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-lg px-4 py-2.5')} onPress={() => { alert('สร้างเกม "' + gName + '" (' + gType + ') สำเร็จ!'); setShowForm(false); setGName(''); setGReward(''); }}>
              <Ionicons name="game-controller" size={14} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>สร้างเกม</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <View className={cn('flex-row flex-wrap gap-3')}>
          {games.map((g, i) => (
            <View key={i} className={cn('bg-white rounded-xl border border-slate-200 p-4 w-[220px]')}>
              <View className={cn('flex-row justify-between items-center mb-2')}><Text className={cn('text-xs font-extrabold text-slate-950')}>{g.name}</Text><Badge text={g.status} color={g.status === 'Active' ? '#0f766e' : '#a8a29e'} bg={g.status === 'Active' ? '#d1fae5' : '#e7e5e4'} /></View>
              <Text className={cn('text-xs text-slate-500 mb-1')}>ประเภท: {g.type}</Text>
              <Text className={cn('text-xs text-slate-500')}>เล่นแล้ว {g.plays} ครั้ง</Text>
            </View>
          ))}
        </View>
      </View>
      {!showForm && <TouchableOpacity className={cn('flex-row items-center gap-1.5 self-start bg-rose-500 rounded-lg px-4 py-2.5')} onPress={() => setShowForm(true)}><Ionicons name="add-circle" size={16} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>สร้างเกมใหม่</Text></TouchableOpacity>}
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
      <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>Segment ลูกค้า</Text>
      <Text className={cn('text-xs text-slate-500 mb-4')}>แบ่งกลุ่มลูกค้าอัตโนมัติตามพฤติกรรม — สร้างเงื่อนไขเอง</Text>

      {showForm && (
        <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
          <Text className={cn('text-xs font-bold text-slate-950 mb-3')}>สร้าง Segment ใหม่</Text>
          <View className={cn('flex-row gap-3 mb-2')}>
            <Field label="ชื่อ Segment" value={segName} onChange={setSegName} required placeholder="เช่น ลูกค้า VIP" flex={1} />
          </View>
          <Text className={cn('text-xs font-bold text-slate-500 mb-2')}>เงื่อนไข <Text style={{ color: '#ef4444' }}>*</Text></Text>
          <View className={cn('flex-row gap-2 items-center flex-wrap mb-2')}>
            {/* เลือกประเภทเงื่อนไข */}
            <View className={cn('border border-slate-200 rounded-lg overflow-hidden')}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 400 }}>
                <View className={cn('flex-row')}>
                  {CONDITION_TYPES.map(ct => (
                    <TouchableOpacity key={ct.id} className={cn('px-3 py-1.5 border-0 bg-white', condType === ct.id && 'bg-rose-500')} onPress={() => setCondType(ct.id)}>
                      <Text className={cn('text-xs text-slate-500', condType === ct.id && 'text-white font-bold')}>{ct.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
          {condType && CONDITION_TYPES.find(c => c.id === condType)?.unit && (
            <View className={cn('flex-row gap-2 items-center mb-2')}>
              {/* Operator */}
              <View className={cn('flex-row gap-1')}>
                {OPERATORS.map(op => (
                  <TouchableOpacity key={op} className={cn('px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white items-center', condOp === op && 'bg-violet-500 border-violet-500')} style={{ minWidth: 32 }} onPress={() => setCondOp(op)}>
                    <Text className={cn('text-xs font-bold text-slate-500', condOp === op && 'text-white')}>{op}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Value */}
              <TextInput className={cn('border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-950 bg-white')} style={{ width: 100 }} value={condValue} onChangeText={setCondValue} placeholder="ค่า" placeholderTextColor="#a8a29e" keyboardType="numeric" />
              <Text className={cn('text-xs text-slate-500')}>{CONDITION_TYPES.find(c => c.id === condType)?.unit}</Text>
            </View>
          )}
          {condType && !CONDITION_TYPES.find(c => c.id === condType)?.unit && (
            <Text className={cn('text-xs text-emerald-600 mb-2')}>เงื่อนไข: {CONDITION_TYPES.find(c => c.id === condType)?.label}</Text>
          )}
          <View className={cn('flex-row justify-end items-center gap-3 mt-3')}>
            <TouchableOpacity onPress={() => setShowForm(false)}><Text className={cn('text-slate-500')}>ยกเลิก</Text></TouchableOpacity>
            <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-lg px-4 py-2.5')} onPress={handleAdd}><Ionicons name="checkmark-circle" size={14} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>สร้าง Segment</Text></TouchableOpacity>
          </View>
        </View>
      )}

      <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden mb-3')} style={{ minWidth: 800 }}>
        <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-3 border-b border-slate-200')}>{['Segment', 'เงื่อนไข', 'จำนวน', 'จัดการ'].map((h, i) => <Text key={i} className={cn('text-xs font-bold text-slate-500 flex-1')} style={[i === 1 && { flex: 2 }]}>{h}</Text>)}</View>
        {segments.map((seg, i) => (
          <View key={i} className={cn('flex-row items-center py-2.5 px-3 border-b border-slate-200', i % 2 === 1 && 'bg-[#f6f7fb]')}>
            <Text className={cn('text-xs font-semibold text-slate-950 flex-1')}>{seg.name}</Text>
            <Text className={cn('text-xs text-slate-950')} style={{ flex: 2 }}>{seg.rule}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{seg.count} คน</Text>
            <View className={cn('flex-row gap-2 flex-1')}>
              <TouchableOpacity onPress={() => { const newRule = prompt('แก้ไขเงื่อนไข:', seg.rule); if (newRule) setSegments(prev => prev.map((s, idx) => idx === i ? { ...s, rule: newRule } : s)); }}>
                <Ionicons name="create-outline" size={14} color="#f87171" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { if (confirm('ลบ Segment "' + seg.name + '"?')) setSegments(prev => prev.filter((_, idx) => idx !== i)); }}>
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
      {!showForm && <TouchableOpacity className={cn('flex-row items-center gap-1.5 self-start bg-rose-500 rounded-lg px-4 py-2.5')} onPress={() => setShowForm(true)}><Ionicons name="add-circle" size={16} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>สร้าง Segment ใหม่</Text></TouchableOpacity>}
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
      <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>ประวัติการซื้อ</Text>
      <Text className={cn('text-xs text-slate-500 mb-4')}>ดูประวัติการซื้อของสมาชิกแต่ละคน + ยอดรวมทั้งระบบ</Text>

      <View className={cn('flex-row gap-3 mb-4')}>
        <KPI label="ยอดซื้อรวมทั้งหมด" value={`฿${fmt(totalAmount)}`} color="#f87171" />
        <KPI label="บิลทั้งหมด" value={`${sales.length} บิล`} color="#6b21a8" />
        <KPI label="บิลที่มีสมาชิก" value={`${memberSales.length} บิล`} color="#0f766e" />
        <KPI label="เฉลี่ย/บิล" value={sales.length > 0 ? `฿${fmt(Math.round(totalAmount / sales.length))}` : '—'} color="#6b21a8" />
      </View>

      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>รายการบิลล่าสุด ({sales.length} รายการ)</Text>
        <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')} style={{ minWidth: 800 }}>
          <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-3 border-b border-slate-200')}>
            {['เลขบิล', 'วันที่', 'ยอดรวม', 'ชำระ', 'สมาชิก', 'พนักงาน', 'สถานะ'].map((h, i) => (
              <Text key={i} className={cn('text-xs font-bold text-slate-500 flex-1')} style={[i === 0 && { flex: 1.5 }]}>{h}</Text>
            ))}
          </View>
          {sales.slice(0, 20).map((sale, i) => (
            <View key={sale.id} className={cn('flex-row items-center py-2.5 px-3 border-b border-slate-200', i % 2 === 1 && 'bg-[#f6f7fb]')}>
              <Text className={cn('text-xs font-semibold text-rose-600')} style={{ flex: 1.5 }}>{sale.saleNo}</Text>
              <Text className={cn('text-xs text-slate-950 flex-1')}>{fmtDate(sale.createdAt)}</Text>
              <Text className={cn('text-xs font-bold text-slate-950 flex-1')}>฿{fmt(sale.grandTotal)}</Text>
              <Text className={cn('text-xs text-slate-950 flex-1')}>{sale.payments.map(p => p.method === 'cash' ? 'เงินสด' : p.method === 'qr' ? 'QR' : p.method === 'credit' ? 'บัตร' : 'โอน').join('+')}</Text>
              <Text className={cn('text-xs text-slate-950 flex-1')}>{sale.memberName || '—'}</Text>
              <Text className={cn('text-xs text-slate-950 flex-1')}>{sale.cashierName}</Text>
              <Text className={cn('text-xs font-semibold flex-1')} style={[{ color: sale.status === 'completed' ? '#0f766e' : '#ef4444' }]}>
                {sale.status === 'completed' ? 'สำเร็จ' : sale.status === 'voided' ? 'ยกเลิก' : 'คืน'}
              </Text>
            </View>
          ))}
          {sales.length === 0 && <Text className={cn('text-xs text-slate-500 text-center py-4')}>ยังไม่มีข้อมูลการขาย</Text>}
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
      <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>Wallet / Credit</Text>
      <Text className={cn('text-xs text-slate-500 mb-4')}>ระบบเติมเงิน/เครดิตสำหรับสมาชิก — ใช้จ่ายแทนเงินสดที่ร้าน</Text>

      <View className={cn('flex-row gap-3 mb-4')}>
        <KPI label="ยอด Wallet รวม" value="฿85,000" color="#6b21a8" />
        <KPI label="สมาชิกที่มี Wallet" value="45 คน" color="#6b21a8" />
        <KPI label="เติมเดือนนี้" value="฿12,500" color="#0f766e" />
        <KPI label="ใช้เดือนนี้" value="฿8,200" color="#a16207" />
      </View>

      {/* Form */}
      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <Text className={cn('text-xs font-bold text-slate-950 mb-3')}>เติมเงิน / หักเงิน</Text>
        <View className={cn('flex-col mb-3')}>
          <Text className={cn('text-xs font-bold text-slate-500 mb-1')}>ค้นหาสมาชิก</Text>
          <TextInput className={cn('border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-950 bg-white')} value={search} onChangeText={setSearch} placeholder="ชื่อ, เบอร์, รหัส..." placeholderTextColor="#a8a29e" />
        </View>
        {search.trim() !== '' && (
          <View style={{ maxHeight: 100, borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 8, marginBottom: 8 }}>
            <ScrollView nestedScrollEnabled>
              {filtered.slice(0, 5).map(m => (
                <TouchableOpacity key={m.id} style={{ paddingVertical: 6, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#e7e5e4', backgroundColor: selectedId === m.id ? '#eff6ff' : '#fafafa' }} onPress={() => { setSelectedId(m.id); setSearch(m.name); }}>
                  <Text className={cn('text-xs font-semibold text-slate-950')}>{m.name} <Text className={cn('font-normal text-slate-500')}>{m.memberNo}</Text></Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {selMember && <Text className={cn('text-xs text-emerald-600 mb-2')}>เลือก: {selMember.name} ({selMember.memberNo})</Text>}

        <View className={cn('flex-col mb-3')}>
          <Text className={cn('text-xs font-bold text-slate-500 mb-1')}>ประเภท</Text>
          <View className={cn('flex-row gap-2 flex-wrap')}>
            <TouchableOpacity className={cn('px-3 py-1.5 rounded-lg border border-slate-200 bg-white')} style={[action === 'topup' && { backgroundColor: '#d1fae5', borderColor: '#0f766e' }]} onPress={() => setAction('topup')}><Text className={cn('text-xs text-slate-500', action === 'topup' && 'text-emerald-600 font-bold')}>+ เติมเงิน</Text></TouchableOpacity>
            <TouchableOpacity className={cn('px-3 py-1.5 rounded-lg border border-slate-200 bg-white')} style={[action === 'deduct' && { backgroundColor: '#ffe4e6', borderColor: '#ef4444' }]} onPress={() => setAction('deduct')}><Text className={cn('text-xs text-slate-500', action === 'deduct' && 'text-rose-600 font-bold')}>- หักเงิน/ใช้เงิน</Text></TouchableOpacity>
          </View>
        </View>
        <View className={cn('flex-row gap-3 mb-2')}>
          <Field label="จำนวนเงิน (฿)" value={amount} onChange={setAmount} placeholder="เช่น 1000" required flex={1} />
          <Field label="หมายเหตุ" value={note} onChange={setNote} placeholder="เช่น เติมเงิน, ชำระค่าสินค้า" flex={2} />
        </View>
        <View className={cn('flex-row justify-end items-center gap-3 mt-3')}>
          <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-lg px-4 py-2.5')} onPress={handleSubmit}><Ionicons name={action === 'topup' ? 'add-circle' : 'remove-circle'} size={14} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>{action === 'topup' ? 'เติมเงิน' : 'หักเงิน'}</Text></TouchableOpacity>
        </View>
      </View>

      {/* History */}
      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <Text className={cn('text-xs font-bold text-slate-950 mb-3')}>ประวัติ Wallet ล่าสุด</Text>
        <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')} style={{ minWidth: 800 }}>
          <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-3 border-b border-slate-200')}>{['วันที่', 'สมาชิก', 'ประเภท', 'จำนวน', 'หมายเหตุ', 'คงเหลือ'].map((h, i) => <Text key={i} className={cn('text-xs font-bold text-slate-500 flex-1')}>{h}</Text>)}</View>
          {history.map((h, i) => (
            <View key={i} className={cn('flex-row items-center py-2.5 px-3 border-b border-slate-200', i % 2 === 1 && 'bg-[#f6f7fb]')}>
              <Text className={cn('text-xs text-slate-950 flex-1')}>{h.date}</Text>
              <Text className={cn('text-xs font-semibold text-slate-950 flex-1')}>{h.member}</Text>
              <View className={cn('flex-1')}><Badge text={h.type === 'topup' ? 'เติม' : 'ใช้'} color={h.type === 'topup' ? '#0f766e' : '#ef4444'} bg={h.type === 'topup' ? '#d1fae5' : '#ffe4e6'} /></View>
              <Text className={cn('text-xs font-bold flex-1')} style={[{ color: h.type === 'topup' ? '#0f766e' : '#ef4444' }]}>{h.type === 'topup' ? '+' : '-'}฿{h.amount.toLocaleString()}</Text>
              <Text className={cn('text-xs text-slate-950 flex-1')}>{h.note}</Text>
              <Text className={cn('text-xs font-semibold text-slate-950 flex-1')}>฿{h.bal.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
const ReportsPanel: React.FC = () => (
  <View>
    <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>รายงาน CRM</Text>
    <Text className={cn('text-xs text-slate-500 mb-4')}>Dashboard สรุปผลการดำเนินงาน CRM ประจำเดือน</Text>

    {/* KPI Row */}
    <View className={cn('flex-row gap-3 mb-4')}>
      <KPI label="Member Retention" value="78%" color="#0f766e" />
      <KPI label="Avg. Lifetime Value" value="฿12,500" color="#6b21a8" />
      <KPI label="Active Rate" value="85%" color="#6b21a8" />
      <KPI label="Redeem Rate" value="42%" color="#a16207" />
      <KPI label="สมาชิกทั้งหมด" value="1,250" color="#f87171" />
    </View>

    {/* สรุปแต้ม */}
    <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
      <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>สรุปคะแนนสะสม (เดือนนี้)</Text>
      <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')} style={{ minWidth: 800 }}>
        <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-3 border-b border-slate-200')}>{['รายการ', 'จำนวน (แต้ม)', 'ธุรกรรม', 'เฉลี่ย/ครั้ง'].map((h, i) => <Text key={i} className={cn('text-xs font-bold text-slate-500 flex-1')}>{h}</Text>)}</View>
        {[
          { label: 'แต้มที่แจก', pts: '38,500', txn: '1,250', avg: '30.8' },
          { label: 'แต้มที่ใช้/แลก', pts: '12,800', txn: '320', avg: '40.0' },
          { label: 'แต้มหมดอายุ', pts: '5,200', txn: '—', avg: '—' },
          { label: 'แต้มคงเหลือรวม', pts: '285,000', txn: '—', avg: '228/คน' },
        ].map((r, i) => (
          <View key={i} className={cn('flex-row items-center py-2.5 px-3 border-b border-slate-200', i % 2 === 1 && 'bg-[#f6f7fb]')}>
            <Text className={cn('text-xs font-semibold text-slate-950 flex-1')}>{r.label}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.pts}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.txn}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.avg}</Text>
          </View>
        ))}
      </View>
    </View>

    {/* สรุประดับสมาชิก */}
    <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
      <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>สมาชิกแยกตามระดับ</Text>
      <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')} style={{ minWidth: 800 }}>
        <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-3 border-b border-slate-200')}>{['ระดับ', 'จำนวน (คน)', 'สัดส่วน', 'ยอดซื้อเฉลี่ย', 'อัปเกรดเดือนนี้'].map((h, i) => <Text key={i} className={cn('text-xs font-bold text-slate-500 flex-1')}>{h}</Text>)}</View>
        {[
          { level: 'Member', count: '820', pct: '65.6%', avg: '฿2,500', up: '—' },
          { level: 'Silver', count: '250', pct: '20.0%', avg: '฿8,500', up: '+12' },
          { level: 'Gold', count: '120', pct: '9.6%', avg: '฿22,000', up: '+5' },
          { level: 'Platinum', count: '45', pct: '3.6%', avg: '฿55,000', up: '+2' },
          { level: 'VIP', count: '15', pct: '1.2%', avg: '฿120,000', up: '+1' },
        ].map((r, i) => (
          <View key={i} className={cn('flex-row items-center py-2.5 px-3 border-b border-slate-200', i % 2 === 1 && 'bg-[#f6f7fb]')}>
            <Text className={cn('text-xs font-semibold text-slate-950 flex-1')}>{r.level}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.count}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.pct}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.avg}</Text>
            <Text className={cn('text-xs font-semibold text-emerald-600 flex-1')}>{r.up}</Text>
          </View>
        ))}
      </View>
    </View>

    {/* คูปอง */}
    <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
      <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>รายงานคูปอง (เดือนนี้)</Text>
      <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')} style={{ minWidth: 800 }}>
        <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-3 border-b border-slate-200')}>{['คูปอง', 'แจกไป', 'ใช้แล้ว', 'ส่วนลดรวม', 'Conversion'].map((h, i) => <Text key={i} className={cn('text-xs font-bold text-slate-500 flex-1')}>{h}</Text>)}</View>
        {[
          { code: 'WELCOME50', issued: 100, used: 23, discount: '฿1,150', conv: '23%' },
          { code: 'BIRTH20', issued: 50, used: 8, discount: '฿960', conv: '16%' },
          { code: 'VIP100', issued: 30, used: 5, discount: '฿500', conv: '17%' },
          { code: 'NEWYEAR', issued: 200, used: 200, discount: '฿18,000', conv: '100%' },
        ].map((r, i) => (
          <View key={i} className={cn('flex-row items-center py-2.5 px-3 border-b border-slate-200', i % 2 === 1 && 'bg-[#f6f7fb]')}>
            <Text className={cn('text-xs font-bold text-rose-600 flex-1')}>{r.code}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.issued}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.used}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.discount}</Text>
            <Text className={cn('text-xs font-semibold text-slate-950 flex-1')}>{r.conv}</Text>
          </View>
        ))}
      </View>
    </View>

    {/* สมาชิกใหม่รายเดือน */}
    <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
      <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>สมาชิกใหม่ (6 เดือนล่าสุด)</Text>
      <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')} style={{ minWidth: 800 }}>
        <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-3 border-b border-slate-200')}>{['เดือน', 'สมาชิกใหม่', 'Active', 'ยอดซื้อรวม', 'Retention'].map((h, i) => <Text key={i} className={cn('text-xs font-bold text-slate-500 flex-1')}>{h}</Text>)}</View>
        {[
          { month: 'ม.ค. 67', newMem: 45, active: 42, spent: '฿125,000', ret: '93%' },
          { month: 'ก.พ. 67', newMem: 38, active: 35, spent: '฿98,000', ret: '92%' },
          { month: 'มี.ค. 67', newMem: 52, active: 48, spent: '฿156,000', ret: '92%' },
          { month: 'เม.ย. 67', newMem: 60, active: 54, spent: '฿180,000', ret: '90%' },
          { month: 'พ.ค. 67', newMem: 55, active: 50, spent: '฿165,000', ret: '91%' },
          { month: 'มิ.ย. 67', newMem: 48, active: 46, spent: '฿142,000', ret: '96%' },
        ].map((r, i) => (
          <View key={i} className={cn('flex-row items-center py-2.5 px-3 border-b border-slate-200', i % 2 === 1 && 'bg-[#f6f7fb]')}>
            <Text className={cn('text-xs font-semibold text-slate-950 flex-1')}>{r.month}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.newMem}</Text>
            <Text className={cn('text-xs text-emerald-600 flex-1')}>{r.active}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.spent}</Text>
            <Text className={cn('text-xs font-semibold text-violet-600 flex-1')}>{r.ret}</Text>
          </View>
        ))}
      </View>
    </View>

    {/* Campaign Performance */}
    <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
      <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>ผลแคมเปญ (เดือนนี้)</Text>
      <View className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden')} style={{ minWidth: 800 }}>
        <View className={cn('flex-row bg-[#f6f7fb] py-2.5 px-3 border-b border-slate-200')}>{['แคมเปญ', 'ช่องทาง', 'ส่งแล้ว', 'เปิดอ่าน', 'กดลิงก์', 'ยอดขาย'].map((h, i) => <Text key={i} className={cn('text-xs font-bold text-slate-500 flex-1')}>{h}</Text>)}</View>
        {[
          { name: 'Welcome Series', ch: 'LINE', sent: 156, open: '82%', click: '45%', sales: '฿28,500' },
          { name: 'Birthday Offer', ch: 'SMS', sent: 34, open: '95%', click: '62%', sales: '฿15,200' },
          { name: 'Win-back', ch: 'Email', sent: 89, open: '35%', click: '12%', sales: '฿5,800' },
          { name: 'VIP Exclusive', ch: 'LINE', sent: 15, open: '100%', click: '73%', sales: '฿42,000' },
        ].map((r, i) => (
          <View key={i} className={cn('flex-row items-center py-2.5 px-3 border-b border-slate-200', i % 2 === 1 && 'bg-[#f6f7fb]')}>
            <Text className={cn('text-xs font-semibold text-slate-950 flex-1')}>{r.name}</Text>
            <View className={cn('flex-1')}><Badge text={r.ch} color="#0284c7" bg="#e0f2fe" /></View>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.sent}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.open}</Text>
            <Text className={cn('text-xs text-slate-950 flex-1')}>{r.click}</Text>
            <Text className={cn('text-xs font-bold text-emerald-600 flex-1')}>{r.sales}</Text>
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
      <Text className={cn('text-sm font-extrabold text-slate-950 mb-1')}>ตั้งค่า CRM</Text>
      <Text className={cn('text-xs text-slate-500 mb-4')}>ตั้งค่าทั่วไปของระบบ CRM และการเชื่อมต่อ LINE</Text>

      {/* LINE OA Connection */}
      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>เชื่อมต่อ LINE Official Account</Text>
        <Text className={cn('text-xs text-slate-500 mb-3')}>เชื่อม LINE OA เพื่อส่งข้อความ, บัตรดิจิทัล, แจ้งเตือนถึงลูกค้าผ่าน LINE</Text>
        <View className={cn('flex-row gap-3 mb-2')}>
          <Field label="LINE OA ID" value={lineOaId} onChange={setLineOaId} placeholder="@yourshop" flex={1} />
          <Field label="Channel Access Token" value={lineToken} onChange={setLineToken} placeholder="ใส่ Token จาก LINE Developer Console" flex={2} />
        </View>
        <Text className={cn('text-xs text-slate-500 mt-1')}>* ได้ Token จาก LINE Developers → Messaging API → Channel Access Token</Text>
        <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-lg px-4 py-2.5 mt-3')} onPress={() => alert('ทดสอบเชื่อมต่อ LINE OA สำเร็จ!')}><Ionicons name="logo-linkedin" size={14} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>ทดสอบเชื่อมต่อ</Text></TouchableOpacity>
      </View>

      {/* Digital Card */}
      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>บัตรสมาชิกดิจิทัล (e-Card)</Text>
        <Text className={cn('text-xs text-slate-500 mb-3')}>เปิดใช้ e-Card สำหรับสมาชิก — แสดงบน LINE Rich Menu หรือ LIFF App</Text>
        <View className={cn('flex-row items-center justify-between mb-2')}><Text className={cn('text-xs text-slate-950')}>เปิดใช้ e-Card</Text><Switch value={eCardEnabled} onValueChange={setECardEnabled} /></View>
        {eCardEnabled && (
          <View style={{ gap: 8, marginTop: 8 }}>
            <Text className={cn('text-xs text-slate-950')}>วิธีใช้งาน:</Text>
            <Text className={cn('text-xs text-slate-500')}>1. ลูกค้าเพิ่มเพื่อน LINE OA → กดเมนู "บัตรสมาชิก"</Text>
            <Text className={cn('text-xs text-slate-500')}>2. ระบบแสดง e-Card พร้อม QR Code, ระดับ, แต้มคงเหลือ</Text>
            <Text className={cn('text-xs text-slate-500')}>3. พนักงานสแกน QR เพื่อสะสมแต้ม / ใช้คูปอง</Text>
          </View>
        )}
      </View>

      {/* Notifications */}
      <View className={cn('bg-white rounded-xl p-5 border border-slate-200 mb-3')}>
        <Text className={cn('text-xs font-bold text-slate-950 mb-2')}>การแจ้งเตือนอัตโนมัติ (ผ่าน LINE)</Text>
        <Text className={cn('text-xs text-slate-500 mb-3')}>ระบบจะส่ง notification ถึงลูกค้าผ่าน LINE เมื่อเกิดเหตุการณ์ต่อไปนี้</Text>
        <View className={cn('flex-row items-center justify-between mb-2')}><Text className={cn('text-xs text-slate-950')}>ได้รับแต้ม (หลังซื้อสินค้า)</Text><Switch value={notifyPoints} onValueChange={setNotifyPoints} /></View>
        <View className={cn('flex-row items-center justify-between mb-2')}><Text className={cn('text-xs text-slate-950')}>อัปเกรดระดับสมาชิก</Text><Switch value={notifyLevel} onValueChange={setNotifyLevel} /></View>
        <View className={cn('flex-row items-center justify-between mb-2')}><Text className={cn('text-xs text-slate-950')}>คูปองหมดอายุ (แจ้งล่วงหน้า 3 วัน)</Text><Switch value={notifyCoupon} onValueChange={setNotifyCoupon} /></View>
        <View className={cn('flex-row items-center justify-between mb-2')}><Text className={cn('text-xs text-slate-950')}>วันเกิด (ส่งคูปอง + อวยพร)</Text><Switch value={notifyBirthday} onValueChange={setNotifyBirthday} /></View>
      </View>

      <TouchableOpacity className={cn('flex-row items-center gap-1.5 self-start bg-rose-500 rounded-lg px-4 py-2.5')} onPress={() => alert('บันทึกตั้งค่า CRM เรียบร้อย')}><Ionicons name="checkmark-circle" size={16} color="#fafafa" /><Text className={cn('text-xs font-bold text-white')}>บันทึกการตั้งค่า</Text></TouchableOpacity>
    </View>
  );
};
