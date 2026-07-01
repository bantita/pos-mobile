/**
 * WebCommunicationScreen — Communication Hub (Minimal UI)
 * LINE Broadcast, SMS, Push Notification, LINE OA Contacts
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { useCommunicationStore } from '../../store/communicationStore';
import { usePromoStore } from '../../store/promoStore';
import { CommChannel } from '../../types/communication';

type TabKey = 'dashboard' | 'broadcast' | 'contacts' | 'templates' | 'settings';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'ภาพรวม', icon: 'grid-outline' },
  { key: 'broadcast', label: 'Broadcast', icon: 'paper-plane-outline' },
  { key: 'contacts', label: 'Contacts', icon: 'people-outline' },
  { key: 'templates', label: 'Templates', icon: 'document-outline' },
  { key: 'settings', label: 'ตั้งค่า', icon: 'cog-outline' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const channelMeta = (ch: CommChannel) => {
  const map: Record<CommChannel, { icon: string; color: string; label: string }> = {
    line: { icon: 'chatbubble-ellipses', color: WebColors.success, label: 'LINE' },
    sms: { icon: 'chatbox', color: WebColors.info, label: 'SMS' },
    push: { icon: 'notifications', color: WebColors.warning, label: 'Push' },
    email: { icon: 'mail', color: WebColors.purple, label: 'Email' },
  };
  return map[ch];
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

const Pill: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <View style={[st.pill, { backgroundColor: color + '14' }]}>
    <Text style={[st.pillText, { color }]}>{label}</Text>
  </View>
);

const Metric: React.FC<{ value: string | number; label: string; sub?: string }> = ({ value, label, sub }) => (
  <View style={st.metric}>
    <Text style={st.metricValue}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
    <Text style={st.metricLabel}>{label}</Text>
    {sub && <Text style={st.metricSub}>{sub}</Text>}
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const WebCommunicationScreen: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('dashboard');

  return (
    <View style={st.root}>
      {/* Tab Bar — minimal underline style */}
      <View style={st.tabBar}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity key={t.key} style={[st.tab, active && st.tabActive]} onPress={() => setTab(t.key)} activeOpacity={0.7}>
              <Ionicons name={t.icon as any} size={15} color={active ? WebColors.text : WebColors.textSecondary} />
              <Text style={[st.tabLabel, active && st.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={st.body} contentContainerStyle={st.bodyContent}>
        {tab === 'dashboard' && <DashboardPanel />}
        {tab === 'broadcast' && <BroadcastPanel />}
        {tab === 'contacts' && <ContactsPanel />}
        {tab === 'templates' && <TemplatesPanel />}
        {tab === 'settings' && <SettingsPanel />}
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const DashboardPanel: React.FC = () => {
  const { stats, broadcasts } = useCommunicationStore();
  const recent = broadcasts.filter(b => b.status === 'sent').slice(0, 5);

  return (
    <View>
      <Text style={st.heading}>Communication</Text>
      <Text style={st.subheading}>ภาพรวมการสื่อสารกับลูกค้า</Text>

      {/* Metrics */}
      <View style={st.metricsRow}>
        <Metric value={stats.totalLineFriends} label="LINE Friends" />
        <Metric value={stats.activeLineFriends} label="Active" />
        <Metric value={stats.broadcastThisMonth} label="ส่งเดือนนี้" />
        <Metric value={stats.broadcastQuotaLeft} label="Quota เหลือ" />
        <Metric value={stats.smsCredits} label="SMS Credit" />
        <Metric value={`${stats.avgOpenRate}%`} label="Open Rate" />
        <Metric value={`${stats.avgClickRate}%`} label="Click Rate" />
      </View>

      {/* Recent */}
      <Text style={st.sectionLabel}>ส่งล่าสุด</Text>
      <View style={st.card}>
        {recent.map((b, i) => {
          const cm = channelMeta(b.channel);
          return (
            <View key={b.id} style={[st.listRow, i < recent.length - 1 && st.listRowBorder]}>
              <View style={[st.dot, { backgroundColor: cm.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={st.listTitle}>{b.name}</Text>
                <Text style={st.listMeta}>{cm.label} · ส่ง {b.sentCount.toLocaleString()} · เปิด {b.openCount.toLocaleString()}</Text>
              </View>
              <Text style={st.listDate}>{b.sentAt ? fmtDate(b.sentAt) : ''}</Text>
            </View>
          );
        })}
        {recent.length === 0 && <Text style={st.empty}>ยังไม่มีรายการ</Text>}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BROADCAST
// ═══════════════════════════════════════════════════════════════════════════════
const BroadcastPanel: React.FC = () => {
  const { broadcasts, sendBroadcast, cancelBroadcast, deleteBroadcast, createBroadcast } = useCommunicationStore();
  const { promotions } = usePromoStore();
  const [filter, setFilter] = useState<'all' | CommChannel>('all');
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newChannel, setNewChannel] = useState<CommChannel>('line');
  const [newContent, setNewContent] = useState('');
  const [newCouponId, setNewCouponId] = useState('');

  const filtered = useMemo(() => {
    if (filter === 'all') return broadcasts;
    return broadcasts.filter(b => b.channel === filter);
  }, [broadcasts, filter]);

  const activeCoupons = promotions.filter(p => p.status === 'active' && (p.type === 'coupon' || p.couponCode));

  const handleCreate = () => {
    if (!newName.trim() || !newContent.trim()) return;
    const coupon = activeCoupons.find(c => c.id === newCouponId);
    createBroadcast({
      name: newName, channel: newChannel, content: newContent,
      lineMessageType: coupon ? 'coupon' : 'text',
      attachedCouponId: coupon?.id, attachedCouponName: coupon?.name,
      target: { type: 'all' },
    });
    setNewName(''); setNewContent(''); setNewCouponId(''); setShowModal(false);
  };

  return (
    <View>
      <View style={st.headerRow}>
        <View>
          <Text style={st.heading}>Broadcast</Text>
          <Text style={st.subheading}>ส่งข้อความหาลูกค้าผ่าน LINE, SMS, Push</Text>
        </View>
        <TouchableOpacity style={st.btnPrimary} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={st.btnPrimaryText}>สร้างใหม่</Text>
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <View style={st.pillRow}>
        {(['all', 'line', 'sms', 'push'] as const).map(f => (
          <TouchableOpacity key={f} style={[st.filterPill, filter === f && st.filterPillActive]} onPress={() => setFilter(f)}>
            <Text style={[st.filterPillText, filter === f && st.filterPillTextActive]}>
              {f === 'all' ? 'ทั้งหมด' : f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <View style={st.card}>
        {filtered.map((b, i) => {
          const cm = channelMeta(b.channel);
          const isPending = b.status === 'draft' || b.status === 'scheduled';
          return (
            <View key={b.id} style={[st.listRow, i < filtered.length - 1 && st.listRowBorder]}>
              <View style={[st.dot, { backgroundColor: cm.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={st.listTitle}>{b.name}</Text>
                <Text style={st.listMeta}>
                  {cm.label} · เป้าหมาย {b.targetCount.toLocaleString()} · ส่ง {b.sentCount.toLocaleString()}
                  {b.attachedCouponName ? ` · 🎫 ${b.attachedCouponName}` : ''}
                </Text>
              </View>
              <Pill label={b.status === 'sent' ? 'ส่งแล้ว' : b.status === 'scheduled' ? 'รอส่ง' : b.status === 'draft' ? 'ร่าง' : b.status} color={b.status === 'sent' ? WebColors.success : b.status === 'scheduled' ? WebColors.warning : WebColors.textSecondary} />
              {isPending && (
                <View style={{ flexDirection: 'row', gap: 6, marginLeft: 8 }}>
                  <TouchableOpacity onPress={() => sendBroadcast(b.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="paper-plane" size={15} color="#16A34A" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => (b.status === 'draft' ? deleteBroadcast : cancelBroadcast)(b.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={15} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              )}
              {!isPending && <Text style={[st.listDate, { marginLeft: 8 }]}>{b.sentAt ? fmtDate(b.sentAt) : ''}</Text>}
            </View>
          );
        })}
        {filtered.length === 0 && <Text style={st.empty}>ไม่มีรายการ</Text>}
      </View>

      {/* Create Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={st.overlay}>
          <View style={st.modal}>
            <Text style={st.modalTitle}>สร้าง Broadcast</Text>

            <Text style={st.label}>ชื่อ</Text>
            <TextInput style={st.input} value={newName} onChangeText={setNewName} placeholder="ชื่อ Campaign" placeholderTextColor="#CBD5E1" />

            <Text style={st.label}>ช่องทาง</Text>
            <View style={st.pillRow}>
              {(['line', 'sms', 'push'] as CommChannel[]).map(ch => {
                const cm = channelMeta(ch);
                const sel = newChannel === ch;
                return (
                  <TouchableOpacity key={ch} style={[st.filterPill, sel && { backgroundColor: cm.color + '18', borderColor: cm.color }]} onPress={() => setNewChannel(ch)}>
                    <Text style={[st.filterPillText, sel && { color: cm.color, fontWeight: '600' }]}>{cm.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={st.label}>ข้อความ</Text>
            <TextInput style={[st.input, { height: 80, textAlignVertical: 'top' }]} value={newContent} onChangeText={setNewContent} placeholder="เนื้อหาข้อความ..." placeholderTextColor="#CBD5E1" multiline />

            <Text style={st.label}>แนบคูปอง</Text>
            <View style={[st.pillRow, { flexWrap: 'wrap' }]}>
              <TouchableOpacity style={[st.filterPill, !newCouponId && st.filterPillActive]} onPress={() => setNewCouponId('')}>
                <Text style={[st.filterPillText, !newCouponId && st.filterPillTextActive]}>ไม่แนบ</Text>
              </TouchableOpacity>
              {activeCoupons.map(c => (
                <TouchableOpacity key={c.id} style={[st.filterPill, newCouponId === c.id && st.filterPillActive]} onPress={() => setNewCouponId(c.id)}>
                  <Text style={[st.filterPillText, newCouponId === c.id && st.filterPillTextActive]} numberOfLines={1}>{c.couponCode || c.promoCode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={st.modalFooter}>
              <TouchableOpacity style={st.btnGhost} onPress={() => setShowModal(false)}>
                <Text style={st.btnGhostText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.btnPrimary} onPress={handleCreate}>
                <Text style={st.btnPrimaryText}>สร้าง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACTS
// ═══════════════════════════════════════════════════════════════════════════════
const ContactsPanel: React.FC = () => {
  const { contacts, searchContacts } = useCommunicationStore();
  const [kw, setKw] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const allTags = useMemo(() => {
    const s = new Set<string>();
    contacts.forEach(c => c.tags.forEach(t => s.add(t)));
    return Array.from(s);
  }, [contacts]);

  const list = useMemo(() => {
    let r = kw.trim() ? searchContacts(kw) : contacts.filter(c => c.status === 'friend');
    if (tagFilter) r = r.filter(c => c.tags.includes(tagFilter));
    return r;
  }, [kw, tagFilter, contacts]);

  return (
    <View>
      <Text style={st.heading}>LINE Contacts</Text>
      <Text style={st.subheading}>
        {contacts.filter(c => c.status === 'friend').length} เพื่อน · {contacts.filter(c => c.linkedMemberId).length} ผูกสมาชิก
      </Text>

      {/* Search */}
      <TextInput style={[st.input, { marginBottom: 12 }]} value={kw} onChangeText={setKw} placeholder="ค้นหาชื่อ, เบอร์โทร, tag..." placeholderTextColor="#94A3B8" />

      {/* Tags */}
      <View style={[st.pillRow, { marginBottom: 16 }]}>
        <TouchableOpacity style={[st.filterPill, !tagFilter && st.filterPillActive]} onPress={() => setTagFilter('')}>
          <Text style={[st.filterPillText, !tagFilter && st.filterPillTextActive]}>ทั้งหมด</Text>
        </TouchableOpacity>
        {allTags.map(t => (
          <TouchableOpacity key={t} style={[st.filterPill, tagFilter === t && st.filterPillActive]} onPress={() => setTagFilter(tagFilter === t ? '' : t)}>
            <Text style={[st.filterPillText, tagFilter === t && st.filterPillTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contact List */}
      <View style={st.card}>
        {list.map((c, i) => (
          <View key={c.id} style={[st.listRow, i < list.length - 1 && st.listRowBorder]}>
            <View style={st.avatar}>
              <Text style={st.avatarText}>{c.displayName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.listTitle}>{c.displayName}</Text>
              <Text style={st.listMeta}>{c.phone || 'ไม่มีเบอร์'}{c.linkedMemberId ? ` · ผูก ${c.linkedMemberId}` : ''}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {c.tags.slice(0, 2).map(t => (
                <Pill key={t} label={t} color="#7C3AED" />
              ))}
            </View>
            <Text style={st.listDate}>{fmtDate(c.followedAt)}</Text>
          </View>
        ))}
        {list.length === 0 && <Text style={st.empty}>ไม่พบรายชื่อ</Text>}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════
const TemplatesPanel: React.FC = () => {
  const { templates, deleteTemplate } = useCommunicationStore();
  const [channelFilter, setChannelFilter] = useState<'all' | CommChannel>('all');

  const filtered = useMemo(() => {
    if (channelFilter === 'all') return templates;
    return templates.filter(t => t.channel === channelFilter);
  }, [templates, channelFilter]);

  return (
    <View>
      <Text style={st.heading}>Templates</Text>
      <Text style={st.subheading}>ข้อความสำเร็จรูปที่ใช้ซ้ำได้</Text>

      <View style={[st.pillRow, { marginBottom: 16 }]}>
        {(['all', 'line', 'sms', 'push'] as const).map(f => (
          <TouchableOpacity key={f} style={[st.filterPill, channelFilter === f && st.filterPillActive]} onPress={() => setChannelFilter(f)}>
            <Text style={[st.filterPillText, channelFilter === f && st.filterPillTextActive]}>{f === 'all' ? 'ทั้งหมด' : f.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        {filtered.map(t => {
          const cm = channelMeta(t.channel);
          return (
            <View key={t.id} style={st.templateCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={cm.icon as any} size={14} color={cm.color} />
                <Text style={st.templateName}>{t.name}</Text>
                {t.attachedCouponId && <Pill label="คูปอง" color="#EA580C" />}
              </View>
              <Text style={st.templateBody} numberOfLines={2}>{t.content}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={st.templateDate}>{fmtDate(t.createdAt)}</Text>
                <TouchableOpacity onPress={() => deleteTemplate(t.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={14} color="#CBD5E1" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {filtered.length === 0 && <Text style={st.empty}>ไม่มี Template</Text>}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
const SettingsPanel: React.FC = () => {
  const { lineConfig, smsConfig } = useCommunicationStore();

  const ConfigRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={st.cfgRow}>
      <Text style={st.cfgLabel}>{label}</Text>
      <Text style={st.cfgValue}>{value}</Text>
    </View>
  );

  return (
    <View>
      <Text style={st.heading}>ตั้งค่า</Text>
      <Text style={st.subheading}>การเชื่อมต่อ LINE OA, SMS, Push</Text>

      {/* LINE */}
      <View style={[st.card, { marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={[st.dot, { backgroundColor: WebColors.success, width: 8, height: 8 }]} />
          <Text style={st.cardHeading}>LINE Official Account</Text>
        </View>
        <ConfigRow label="OA Name" value={lineConfig.oaName} />
        <ConfigRow label="Basic ID" value={lineConfig.basicId} />
        <ConfigRow label="Friends" value={`${lineConfig.friendCount.toLocaleString()} คน`} />
        <ConfigRow label="Broadcast" value={`${lineConfig.broadcastUsed} / ${lineConfig.broadcastQuota} ต่อเดือน`} />
      </View>

      {/* SMS */}
      <View style={[st.card, { marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={[st.dot, { backgroundColor: WebColors.info, width: 8, height: 8 }]} />
          <Text style={st.cardHeading}>SMS</Text>
        </View>
        <ConfigRow label="Provider" value={smsConfig.provider} />
        <ConfigRow label="Sender" value={smsConfig.senderName} />
        <ConfigRow label="Credit" value={`${smsConfig.creditBalance.toLocaleString()} ข้อความ`} />
        <ConfigRow label="ราคา" value={`฿${smsConfig.costPerMessage.toFixed(2)} / ข้อความ`} />
      </View>

      {/* Push */}
      <View style={st.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={[st.dot, { backgroundColor: WebColors.warning, width: 8, height: 8 }]} />
          <Text style={st.cardHeading}>Push Notification</Text>
        </View>
        <ConfigRow label="Platform" value="Firebase Cloud Messaging" />
        <ConfigRow label="สถานะ" value="เปิดใช้งาน" />
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES — Minimal, clean, lots of whitespace
// ═══════════════════════════════════════════════════════════════════════════════
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: WebColors.gray50 },

  // Tab bar
  tabBar: { flexDirection: 'row', backgroundColor: WebColors.white, paddingHorizontal: 28, borderBottomWidth: 1, borderBottomColor: WebColors.gray100 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: WebColors.text },
  tabLabel: { fontSize: 13, color: WebColors.textSecondary, fontWeight: '500' },
  tabLabelActive: { color: WebColors.text, fontWeight: '600' },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: 28, maxWidth: 960 },

  // Typography
  heading: { fontSize: 19, fontWeight: '700', color: WebColors.text, letterSpacing: -0.3 },
  subheading: { fontSize: 13, color: WebColors.textSecondary, marginTop: 2, marginBottom: 20 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: WebColors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 24 },

  // Metrics
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  metric: { backgroundColor: WebColors.white, borderRadius: 10, padding: 16, minWidth: 110, borderWidth: 1, borderColor: WebColors.gray100 },
  metricValue: { fontSize: 19, fontWeight: '700', color: WebColors.text },
  metricLabel: { fontSize: 15, color: WebColors.textSecondary, marginTop: 2 },
  metricSub: { fontSize: 14, color: WebColors.gray300, marginTop: 1 },

  // Card
  card: { backgroundColor: WebColors.white, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: WebColors.gray100 },
  cardHeading: { fontSize: 13, fontWeight: '600', color: WebColors.text },

  // List rows
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  listTitle: { fontSize: 13, fontWeight: '500', color: '#1E293B' },
  listMeta: { fontSize: 15, color: '#94A3B8', marginTop: 1 },
  listDate: { fontSize: 15, color: '#CBD5E1' },
  dot: { width: 6, height: 6, borderRadius: 3 },

  // Avatar
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '600', color: '#64748B' },

  // Pill / Badge
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  pillText: { fontSize: 14, fontWeight: '600' },

  // Filter pills
  pillRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
  filterPillActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  filterPillText: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  filterPillTextActive: { color: '#FFF', fontWeight: '600' },

  // Header row
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },

  // Buttons
  btnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0F172A', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  btnPrimaryText: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  btnGhost: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  btnGhostText: { fontSize: 13, color: '#64748B', fontWeight: '500' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: '#FFF', borderRadius: 14, padding: 28, width: 460, maxHeight: '85%' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 20 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 },

  // Form
  label: { fontSize: 15, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1E293B', backgroundColor: '#FFF' },

  // Template card
  templateCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', gap: 8 },
  templateName: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  templateBody: { fontSize: 15, color: '#64748B', lineHeight: 18 },
  templateDate: { fontSize: 14, color: '#CBD5E1' },

  // Settings
  cfgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  cfgLabel: { fontSize: 13, color: '#64748B' },
  cfgValue: { fontSize: 13, color: '#1E293B', fontWeight: '500' },

  // Empty
  empty: { fontSize: 13, color: '#CBD5E1', textAlign: 'center', paddingVertical: 24 },
});
