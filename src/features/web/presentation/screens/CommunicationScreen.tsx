import React, { useState, useMemo } from 'react';
import { Modal } from 'react-native';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { useCommunicationStore } from '@/features/communication/application/stores/communicationStore';
import { usePromoStore } from '@/features/promotion/application/stores/promoStore';
import { CommChannel } from '@/features/communication/domain/communication';

type TabKey = 'dashboard' | 'broadcast' | 'contacts' | 'templates' | 'settings';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'ภาพรวม', icon: 'grid-outline' },
  { key: 'broadcast', label: 'Broadcast', icon: 'paper-plane-outline' },
  { key: 'contacts', label: 'Contacts', icon: 'people-outline' },
  { key: 'templates', label: 'Templates', icon: 'document-outline' },
  { key: 'settings', label: 'ตั้งค่า', icon: 'cog-outline' },
];

const channelMeta = (ch: CommChannel) => {
  const map: Record<CommChannel, { icon: string; color: string; label: string }> = {
    line: { icon: 'chatbubble-ellipses', color: '#0f766e', label: 'LINE' },
    sms: { icon: 'chatbox', color: '#6b21a8', label: 'SMS' },
    push: { icon: 'notifications', color: '#a16207', label: 'Push' },
    email: { icon: 'mail', color: '#6b21a8', label: 'Email' },
  };
  return map[ch];
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

const Pill: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <View className={cn('rounded-xl px-2 py-0.5')} style={[{ backgroundColor: color + '14' }]}>
    <Text className={cn('text-sm font-bold')} style={[{ color }]}>{label}</Text>
  </View>
);

const Metric: React.FC<{ value: string | number; label: string; sub?: string }> = ({ value, label, sub }) => (
  <View className={cn('bg-white rounded-2xl p-4 min-w-[110px] border border-slate-100 shadow-sm')}>
    <Text className={cn('text-lg font-extrabold text-slate-800')}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
    <Text className={cn('text-sm font-medium text-slate-500 mt-0.5')}>{label}</Text>
    {sub && <Text className={cn('text-xs font-medium text-slate-300 mt-px')}>{sub}</Text>}
  </View>
);

export const CommunicationScreen: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('dashboard');

  return (
    <View className={cn('flex-1 bg-[#f6f7fb]')}>
      <View className={cn('bg-rose-600 px-6 py-3')}>
        <Text className={cn('text-lg font-extrabold text-white')}>Communication Hub</Text>
      </View>

      <View className={cn('flex-row bg-white px-6 border-b border-slate-100 shadow-sm')}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              className={cn('flex-row items-center gap-1.5 py-3 px-3.5 border-b-2 border-transparent -mb-px', active && 'border-rose-500')}
              onPress={() => setTab(t.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={t.icon as any} size={15} color={active ? '#e11d48' : '#57534e'} />
              <Text className={cn('text-xs font-medium', active ? 'font-bold text-rose-600' : 'text-slate-500')}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView className={cn('flex-1')} contentContainerStyle={{ padding: 28, maxWidth: 960 }}>
        {tab === 'dashboard' && <DashboardPanel />}
        {tab === 'broadcast' && <BroadcastPanel />}
        {tab === 'contacts' && <ContactsPanel />}
        {tab === 'templates' && <TemplatesPanel />}
        {tab === 'settings' && <SettingsPanel />}
      </ScrollView>
    </View>
  );
};

const DashboardPanel: React.FC = () => {
  const { stats, broadcasts } = useCommunicationStore();
  const recent = broadcasts.filter(b => b.status === 'sent').slice(0, 5);

  return (
    <View>
      <Text className={cn('text-lg font-extrabold text-slate-800 tracking-tight')}>Communication</Text>
      <Text className={cn('text-xs font-medium text-slate-500 mt-0.5 mb-5')}>ภาพรวมการสื่อสารกับลูกค้า</Text>

      <View className={cn('flex-row flex-wrap gap-3 mb-2')}>
        <Metric value={stats.totalLineFriends} label="LINE Friends" />
        <Metric value={stats.activeLineFriends} label="Active" />
        <Metric value={stats.broadcastThisMonth} label="ส่งเดือนนี้" />
        <Metric value={stats.broadcastQuotaLeft} label="Quota เหลือ" />
        <Metric value={stats.smsCredits} label="SMS Credit" />
        <Metric value={`${stats.avgOpenRate}%`} label="Open Rate" />
        <Metric value={`${stats.avgClickRate}%`} label="Click Rate" />
      </View>

      <Text className={cn('text-sm font-bold text-slate-500 uppercase tracking-wide mb-2.5 mt-6')}>ส่งล่าสุด</Text>
      <View className={cn('bg-white rounded-2xl p-4 border border-slate-100 shadow-sm')}>
        {recent.map((b, i) => {
          const cm = channelMeta(b.channel);
          return (
            <View key={b.id} className={cn('flex-row items-center py-3 gap-2.5', i < recent.length - 1 && 'border-b border-slate-50')}>
              <View className={cn('w-1.5 h-1.5 rounded-full')} style={[{ backgroundColor: cm.color }]} />
              <View className={cn('flex-1')}>
                <Text className={cn('text-xs font-medium text-slate-800')}>{b.name}</Text>
                <Text className={cn('text-xs font-medium text-slate-400 mt-px')}>{cm.label} · ส่ง {b.sentCount.toLocaleString()} · เปิด {b.openCount.toLocaleString()}</Text>
              </View>
              <Text className={cn('text-xs font-medium text-slate-300')}>{b.sentAt ? fmtDate(b.sentAt) : ''}</Text>
            </View>
          );
        })}
        {recent.length === 0 && <Text className={cn('text-xs font-medium text-slate-300 text-center py-6')}>ยังไม่มีรายการ</Text>}
      </View>
    </View>
  );
};

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
      <View className={cn('flex-row justify-between items-start mb-4')}>
        <View>
          <Text className={cn('text-lg font-extrabold text-slate-800 tracking-tight')}>Broadcast</Text>
          <Text className={cn('text-xs font-medium text-slate-500 mt-0.5 mb-5')}>ส่งข้อความหาลูกค้าผ่าน LINE, SMS, Push</Text>
        </View>
        <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 px-3.5 py-2.5 rounded-xl shadow-sm')} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={16} color="#fafafa" />
          <Text className={cn('text-xs font-bold text-white')}>สร้างใหม่</Text>
        </TouchableOpacity>
      </View>

      <View className={cn('flex-row gap-1.5 mb-1')}>
        {(['all', 'line', 'sms', 'push'] as const).map(f => (
          <TouchableOpacity
            key={f}
            className={cn('px-3.5 py-2 rounded-full border', filter === f ? 'bg-rose-500 border-rose-500' : 'bg-white border-slate-200')}
            onPress={() => setFilter(f)}
          >
            <Text className={cn('text-xs font-bold', filter === f ? 'text-white' : 'text-slate-500')}>
              {f === 'all' ? 'ทั้งหมด' : f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className={cn('bg-white rounded-2xl p-4 border border-slate-100 shadow-sm')}>
        {filtered.map((b, i) => {
          const cm = channelMeta(b.channel);
          const isPending = b.status === 'draft' || b.status === 'scheduled';
          return (
            <View key={b.id} className={cn('flex-row items-center py-3 gap-2.5', i < filtered.length - 1 && 'border-b border-slate-50')}>
              <View className={cn('w-1.5 h-1.5 rounded-full')} style={[{ backgroundColor: cm.color }]} />
              <View className={cn('flex-1')}>
                <Text className={cn('text-xs font-medium text-slate-800')}>{b.name}</Text>
                <Text className={cn('text-xs font-medium text-slate-400 mt-px')}>
                  {cm.label} · เป้าหมาย {b.targetCount.toLocaleString()} · ส่ง {b.sentCount.toLocaleString()}
                </Text>
                {b.attachedCouponName ? (
                  <View className={cn('mt-0.5 flex-row items-center gap-1')}>
                    <Ionicons name="ticket-outline" size={11} color="#94a3b8" />
                    <Text className={cn('text-xs font-medium text-slate-400')}>{b.attachedCouponName}</Text>
                  </View>
                ) : null}
              </View>
              <Pill label={b.status === 'sent' ? 'ส่งแล้ว' : b.status === 'scheduled' ? 'รอส่ง' : b.status === 'draft' ? 'ร่าง' : b.status} color={b.status === 'sent' ? '#0f766e' : b.status === 'scheduled' ? '#a16207' : '#57534e'} />
              {isPending && (
                <View className={cn('flex-row gap-1.5 ml-2')}>
                  <TouchableOpacity onPress={() => sendBroadcast(b.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="paper-plane" size={15} color="#16a34a" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => (b.status === 'draft' ? deleteBroadcast : cancelBroadcast)(b.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={15} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              )}
              {!isPending && <Text className={cn('text-xs font-medium text-slate-300 ml-2')}>{b.sentAt ? fmtDate(b.sentAt) : ''}</Text>}
            </View>
          );
        })}
        {filtered.length === 0 && <Text className={cn('text-xs font-medium text-slate-300 text-center py-6')}>ไม่มีรายการ</Text>}
      </View>

      <Modal visible={showModal} transparent animationType="fade">
        <View className={cn('flex-1 bg-[rgba(15,23,42,0.4)] items-center justify-center')}>
          <View className={cn('bg-white rounded-2xl p-7 w-[460px] max-h-[85%]')}>
            <Text className={cn('text-base font-extrabold text-slate-800 mb-5')}>สร้าง Broadcast</Text>

            <Text className={cn('text-sm font-bold text-slate-500 mb-1.5 mt-3.5')}>ชื่อ</Text>
            <TextInput className={cn('border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-white')} value={newName} onChangeText={setNewName} placeholder="ชื่อ Campaign" placeholderTextColor="#cbd5e1" />

            <Text className={cn('text-sm font-bold text-slate-500 mb-1.5 mt-3.5')}>ช่องทาง</Text>
            <View className={cn('flex-row gap-1.5 mb-1')}>
              {(['line', 'sms', 'push'] as CommChannel[]).map(ch => {
                const cm = channelMeta(ch);
                const sel = newChannel === ch;
                return (
                  <TouchableOpacity
                    key={ch}
                    className={cn('px-3.5 py-2 rounded-full bg-white border', sel ? 'border-rose-500' : 'border-slate-200')}
                    style={[sel && { backgroundColor: cm.color + '18' }]}
                    onPress={() => setNewChannel(ch)}
                  >
                    <Text className={cn('text-xs font-bold', sel ? 'text-rose-600' : 'text-slate-500')}>{cm.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className={cn('text-sm font-bold text-slate-500 mb-1.5 mt-3.5')}>ข้อความ</Text>
            <TextInput className={cn('border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-white')} value={newContent} onChangeText={setNewContent} placeholder="เนื้อหาข้อความ..." placeholderTextColor="#cbd5e1" multiline style={{ height: 80, textAlignVertical: 'top' }} />

            <Text className={cn('text-sm font-bold text-slate-500 mb-1.5 mt-3.5')}>แนบคูปอง</Text>
            <View className={cn('flex-row gap-1.5 mb-1 flex-wrap')}>
              <TouchableOpacity className={cn('px-3.5 py-2 rounded-full bg-white border', !newCouponId ? 'bg-rose-500 border-rose-500' : 'border-slate-200')} onPress={() => setNewCouponId('')}>
                <Text className={cn('text-xs font-bold', !newCouponId ? 'text-white' : 'text-slate-500')}>ไม่แนบ</Text>
              </TouchableOpacity>
              {activeCoupons.map(c => (
                <TouchableOpacity key={c.id} className={cn('px-3.5 py-2 rounded-full bg-white border', newCouponId === c.id ? 'bg-rose-500 border-rose-500' : 'border-slate-200')} onPress={() => setNewCouponId(c.id)}>
                  <Text className={cn('text-xs font-bold', newCouponId === c.id ? 'text-white' : 'text-slate-500')} numberOfLines={1}>{c.couponCode || c.promoCode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className={cn('flex-row justify-end gap-2 mt-5')}>
              <TouchableOpacity className={cn('px-4 py-2.5 rounded-xl border border-slate-200 bg-white')} onPress={() => setShowModal(false)}>
                <Text className={cn('text-xs font-bold text-slate-500')}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 px-4 py-2.5 rounded-xl shadow-sm')} onPress={handleCreate}>
                <Text className={cn('text-xs font-bold text-white')}>สร้าง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
      <Text className={cn('text-lg font-extrabold text-slate-800 tracking-tight')}>LINE Contacts</Text>
      <Text className={cn('text-xs font-medium text-slate-500 mt-0.5 mb-5')}>
        {contacts.filter(c => c.status === 'friend').length} เพื่อน · {contacts.filter(c => c.linkedMemberId).length} ผูกสมาชิก
      </Text>

      <TextInput className={cn('border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-white')} value={kw} onChangeText={setKw} placeholder="ค้นหาชื่อ, เบอร์โทร, tag..." placeholderTextColor="#94a3b8" style={{ marginBottom: 12 }} />

      <View className={cn('flex-row gap-1.5 mb-1')} style={{ marginBottom: 16 }}>
        <TouchableOpacity className={cn('px-3.5 py-2 rounded-full bg-white border', !tagFilter ? 'bg-rose-500 border-rose-500' : 'border-slate-200')} onPress={() => setTagFilter('')}>
          <Text className={cn('text-xs font-bold', !tagFilter ? 'text-white' : 'text-slate-500')}>ทั้งหมด</Text>
        </TouchableOpacity>
        {allTags.map(t => (
          <TouchableOpacity key={t} className={cn('px-3.5 py-2 rounded-full bg-white border', tagFilter === t ? 'bg-rose-500 border-rose-500' : 'border-slate-200')} onPress={() => setTagFilter(tagFilter === t ? '' : t)}>
            <Text className={cn('text-xs font-bold', tagFilter === t ? 'text-white' : 'text-slate-500')}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className={cn('bg-white rounded-2xl p-4 border border-slate-100 shadow-sm')}>
        {list.map((c, i) => (
          <View key={c.id} className={cn('flex-row items-center py-3 gap-2.5', i < list.length - 1 && 'border-b border-slate-50')}>
            <View className={cn('w-8 h-8 rounded-full bg-rose-50 items-center justify-center')}>
              <Text className={cn('text-xs font-bold text-rose-500')}>{c.displayName.charAt(0)}</Text>
            </View>
            <View className={cn('flex-1')}>
              <Text className={cn('text-xs font-medium text-slate-800')}>{c.displayName}</Text>
              <Text className={cn('text-xs font-medium text-slate-400 mt-px')}>{c.phone || 'ไม่มีเบอร์'}{c.linkedMemberId ? ` · ผูก ${c.linkedMemberId}` : ''}</Text>
            </View>
            <View className={cn('flex-row gap-1')}>
              {c.tags.slice(0, 2).map(t => (
                <Pill key={t} label={t} color="#7c3aed" />
              ))}
            </View>
            <Text className={cn('text-xs font-medium text-slate-300')}>{fmtDate(c.followedAt)}</Text>
          </View>
        ))}
        {list.length === 0 && <Text className={cn('text-xs font-medium text-slate-300 text-center py-6')}>ไม่พบรายชื่อ</Text>}
      </View>
    </View>
  );
};

const TemplatesPanel: React.FC = () => {
  const { templates, deleteTemplate } = useCommunicationStore();
  const [channelFilter, setChannelFilter] = useState<'all' | CommChannel>('all');

  const filtered = useMemo(() => {
    if (channelFilter === 'all') return templates;
    return templates.filter(t => t.channel === channelFilter);
  }, [templates, channelFilter]);

  return (
    <View>
      <Text className={cn('text-lg font-extrabold text-slate-800 tracking-tight')}>Templates</Text>
      <Text className={cn('text-xs font-medium text-slate-500 mt-0.5 mb-5')}>ข้อความสำเร็จรูปที่ใช้ซ้ำได้</Text>

      <View className={cn('flex-row gap-1.5 mb-1')} style={{ marginBottom: 16 }}>
        {(['all', 'line', 'sms', 'push'] as const).map(f => (
          <TouchableOpacity
            key={f}
            className={cn('px-3.5 py-2 rounded-full bg-white border', channelFilter === f ? 'bg-rose-500 border-rose-500' : 'border-slate-200')}
            onPress={() => setChannelFilter(f)}
          >
            <Text className={cn('text-xs font-bold', channelFilter === f ? 'text-white' : 'text-slate-500')}>{f === 'all' ? 'ทั้งหมด' : f.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className={cn('gap-2.5')}>
        {filtered.map(t => {
          const cm = channelMeta(t.channel);
          return (
            <View key={t.id} className={cn('bg-white rounded-2xl p-4 border border-slate-100 shadow-sm gap-2')}>
              <View className={cn('flex-row items-center gap-2')}>
                <Ionicons name={cm.icon as any} size={14} color={cm.color} />
                <Text className={cn('text-xs font-bold text-slate-800')}>{t.name}</Text>
                {t.attachedCouponId && <Pill label="คูปอง" color="#ea580c" />}
              </View>
              <Text className={cn('text-xs font-medium text-slate-500 leading-5')} numberOfLines={2}>{t.content}</Text>
              <View className={cn('flex-row justify-between items-center')}>
                <Text className={cn('text-xs font-medium text-slate-300')}>{fmtDate(t.createdAt)}</Text>
                <TouchableOpacity onPress={() => deleteTemplate(t.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={14} color="#cbd5e1" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {filtered.length === 0 && <Text className={cn('text-xs font-medium text-slate-300 text-center py-6')}>ไม่มี Template</Text>}
      </View>
    </View>
  );
};

const SettingsPanel: React.FC = () => {
  const { lineConfig, smsConfig } = useCommunicationStore();

  const ConfigRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View className={cn('flex-row justify-between items-center py-2.5 border-b border-slate-50')}>
      <Text className={cn('text-xs font-medium text-slate-500')}>{label}</Text>
      <Text className={cn('text-xs font-bold text-slate-800')}>{value}</Text>
    </View>
  );

  return (
    <View>
      <Text className={cn('text-lg font-extrabold text-slate-800 tracking-tight')}>ตั้งค่า</Text>
      <Text className={cn('text-xs font-medium text-slate-500 mt-0.5 mb-5')}>การเชื่อมต่อ LINE OA, SMS, Push</Text>

      <View className={cn('bg-white rounded-2xl p-4 border border-slate-100 shadow-sm')} style={{ marginBottom: 16 }}>
        <View className={cn('flex-row items-center gap-2 mb-3')}>
          <View className={cn('w-2 h-2 rounded-full bg-emerald-500')} />
          <Text className={cn('text-xs font-bold text-slate-800')}>LINE Official Account</Text>
        </View>
        <ConfigRow label="OA Name" value={lineConfig.oaName} />
        <ConfigRow label="Basic ID" value={lineConfig.basicId} />
        <ConfigRow label="Friends" value={`${lineConfig.friendCount.toLocaleString()} คน`} />
        <ConfigRow label="Broadcast" value={`${lineConfig.broadcastUsed} / ${lineConfig.broadcastQuota} ต่อเดือน`} />
      </View>

      <View className={cn('bg-white rounded-2xl p-4 border border-slate-100 shadow-sm')} style={{ marginBottom: 16 }}>
        <View className={cn('flex-row items-center gap-2 mb-3')}>
          <View className={cn('w-2 h-2 rounded-full bg-violet-500')} />
          <Text className={cn('text-xs font-bold text-slate-800')}>SMS</Text>
        </View>
        <ConfigRow label="Provider" value={smsConfig.provider} />
        <ConfigRow label="Sender" value={smsConfig.senderName} />
        <ConfigRow label="Credit" value={`${smsConfig.creditBalance.toLocaleString()} ข้อความ`} />
        <ConfigRow label="ราคา" value={`฿${smsConfig.costPerMessage.toFixed(2)} / ข้อความ`} />
      </View>

      <View className={cn('bg-white rounded-2xl p-4 border border-slate-100 shadow-sm')}>
        <View className={cn('flex-row items-center gap-2 mb-3')}>
          <View className={cn('w-2 h-2 rounded-full bg-amber-500')} />
          <Text className={cn('text-xs font-bold text-slate-800')}>Push Notification</Text>
        </View>
        <ConfigRow label="Platform" value="Firebase Cloud Messaging" />
        <ConfigRow label="สถานะ" value="เปิดใช้งาน" />
      </View>
    </View>
  );
};
