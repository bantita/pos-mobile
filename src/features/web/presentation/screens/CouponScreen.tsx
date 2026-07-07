import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import * as couponStore from '@/features/coupon/application/stores/couponStore';
import { CouponStatus } from '@/features/coupon/domain/coupon';
import { generateCouponCodes } from '@/features/coupon/domain/services/CouponGenerator';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';

type ViewMode = 'list' | 'create' | 'detail';

export const CouponScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [view, setView] = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const showAlert = (title: string, msg: string) => {
    setAlertTitle(title);
    setAlertMsg(msg);
    setAlertVisible(true);
  };

  const campaigns = couponStore.getCampaigns();

  const handleCreate = () => {
    if (!name.trim() || !prefix.trim() || !expiryDate.trim()) {
      showAlert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบ (ชื่อ, Prefix, วันหมดอายุ)');
      return;
    }
    const qty = parseInt(quantity) || 100;
    const id = `campaign-${Date.now()}`;
    const now = new Date().toISOString();
    const expiry = expiryDate.trim().replace(/[\s\/]/g, '-');
    couponStore.addCampaign({
      id, name: name.trim(), promotionId: id,
      prefix: prefix.trim().toUpperCase(), totalQuantity: qty,
      expiryDate: expiry,
      limits: { limitType: 'per_bill', perBillLimit: 1 },
      sharingPercent: 0, contactPerson: '', remark: '',
      createdAt: now, createdBy: 'admin', updatedAt: now,
    });
    const existing = couponStore.getAllExistingCodeSet();
    const result = generateCouponCodes({ prefix: prefix.trim().toUpperCase(), quantity: qty, existingCodes: existing });
    const codes = result.codes.map(code => ({
      code, campaignId: id, status: CouponStatus.ACTIVE,
      expiryDate: expiry, createdAt: now,
      statusHistory: [{ fromStatus: 'NEW' as const, toStatus: CouponStatus.ACTIVE, timestamp: now, actor: 'admin' }],
    }));
    couponStore.addCodes(codes);
    showAlert('สำเร็จ', `สร้างแคมเปญ "${name.trim()}" แล้ว\nGen คูปอง ${qty} ใบ (Prefix: ${prefix.trim().toUpperCase()})`);
    setName('');
    setPrefix('');
    setQuantity('100');
    setExpiryDate('');
    setRefreshKey(k => k + 1);
    setView('list');
  };

  if (view === 'detail' && selectedId) {
    const campaign = couponStore.getCampaign(selectedId);
    const stats = couponStore.getCampaignStats(selectedId);
    const codes = couponStore.getCodesByCampaign(selectedId);
    return (
      <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerClassName={cn('p-5 gap-4')}>
        <TouchableOpacity className={cn('flex-row items-center gap-1 mb-1')} onPress={() => setView('list')}>
          <Ionicons name="arrow-back" size={18} color="#e11d48" />
          <Text className={cn('text-xs font-bold text-rose-600')}>กลับ</Text>
        </TouchableOpacity>
        <Text className={cn('text-base font-extrabold text-slate-800')}>{campaign?.name || ''}</Text>
        <View className={cn('flex-row gap-2 mb-2')}>
          <TouchableOpacity className={cn('flex-row items-center gap-1 px-3.5 py-2 rounded-xl border border-rose-300 bg-white')} onPress={() => { const q = '100'; if (q) { const qty2 = parseInt(q) || 100; const ex = couponStore.getAllExistingCodeSet(); const r = generateCouponCodes({ prefix: campaign?.prefix || '', quantity: qty2, existingCodes: ex }); const now2 = new Date().toISOString(); couponStore.addCodes(r.codes.map(code => ({ code, campaignId: selectedId, status: CouponStatus.ACTIVE, expiryDate: campaign?.expiryDate || '', createdAt: now2, statusHistory: [{ fromStatus: 'NEW' as const, toStatus: CouponStatus.ACTIVE, timestamp: now2, actor: 'admin' }] }))); setRefreshKey(k => k + 1); showAlert('สำเร็จ', `Gen คูปอง ${qty2} ใบ เพิ่มแล้ว`); } }}>
            <Ionicons name="color-wand-outline" size={16} color="#e11d48" />
            <Text className={cn('text-sm font-bold text-rose-600')}>Gen เพิ่ม</Text>
          </TouchableOpacity>
          <TouchableOpacity className={cn('flex-row items-center gap-1 px-3.5 py-2 rounded-xl border border-rose-300 bg-white')} onPress={() => showAlert('Import CSV', 'รูปแบบ: code,status,expiryDate')}>
            <Ionicons name="cloud-upload-outline" size={16} color="#e11d48" />
            <Text className={cn('text-sm font-bold text-rose-600')}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity className={cn('flex-row items-center gap-1 px-3.5 py-2 rounded-xl border border-rose-300 bg-white')} onPress={() => { const codes2 = couponStore.getCodesByCampaign(selectedId); const csv = ['code,status,expiryDate,usageDate,billNumber,branch'].concat(codes2.map(c => `${c.code},${c.status},${c.expiryDate},${c.usageDate || ''},${c.billNumber || ''},-`)).join('\n'); showAlert('Export', `ส่งออก ${codes2.length} รายการ\n\n${csv.slice(0, 600)}`); }}>
            <Ionicons name="download-outline" size={16} color="#e11d48" />
            <Text className={cn('text-sm font-bold text-rose-600')}>Export</Text>
          </TouchableOpacity>
        </View>
        <View className={cn('flex-row gap-4 mb-2')}>
          <View className={cn('items-center')}><Text className={cn('text-base font-extrabold text-slate-800')}>{stats.total}</Text><Text className={cn('text-xs text-slate-500 font-medium')}>ทั้งหมด</Text></View>
          <View className={cn('items-center')}><Text className={cn('text-base font-extrabold text-emerald-600')}>{stats.active}</Text><Text className={cn('text-xs text-slate-500 font-medium')}>ใช้งาน</Text></View>
          <View className={cn('items-center')}><Text className={cn('text-base font-extrabold text-slate-500')}>{stats.used}</Text><Text className={cn('text-xs text-slate-500 font-medium')}>ใช้แล้ว</Text></View>
          <View className={cn('items-center')}><Text className={cn('text-base font-extrabold text-amber-600')}>{stats.expired}</Text><Text className={cn('text-xs text-slate-500 font-medium')}>หมดอายุ</Text></View>
        </View>
        <View className={cn('bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden')}>
          <View className={cn('flex-row bg-rose-50 px-3 py-2')}>
            <Text className={cn('text-xs font-bold text-rose-700 flex-[2]')}>คูปอง</Text>
            <Text className={cn('text-xs font-bold text-rose-700 flex-1')}>สถานะ</Text>
            <Text className={cn('text-xs font-bold text-rose-700 flex-1')}>หมดอายุ</Text>
            <Text className={cn('text-xs font-bold text-rose-700 flex-1')}>ใช้เมื่อ</Text>
            <Text className={cn('text-xs font-bold text-rose-700 flex-1')}>บิล</Text>
            <Text className={cn('text-xs font-bold text-rose-700 flex-1')}>สาขา</Text>
          </View>
          {codes.slice(0, 100).map(c => (
            <View key={c.code} className={cn('flex-row px-3 py-2 border-t border-rose-50')}>
              <Text className={cn('text-xs font-medium text-slate-700 flex-[2]')}>{c.code}</Text>
              <Text className={cn('text-xs flex-1', c.status === 'ACTIVE' ? 'text-emerald-600 font-bold' : 'text-slate-500 font-medium')}>{c.status === 'ACTIVE' ? 'ใช้ได้' : c.status === 'USED' ? 'ใช้แล้ว' : c.status}</Text>
              <Text className={cn('text-xs text-slate-700 font-medium flex-1')}>{c.expiryDate?.split('T')[0] || '-'}</Text>
              <Text className={cn('text-xs text-slate-700 font-medium flex-1')}>{c.usageDate?.split('T')[0] || '-'}</Text>
              <Text className={cn('text-xs text-slate-700 font-medium flex-1')}>-</Text>
              <Text className={cn('text-xs text-slate-700 font-medium flex-1')}>{c.billNumber || '-'}</Text>
            </View>
          ))}
          {codes.length > 100 && <Text className={cn('text-xs text-slate-400 text-center py-2 font-medium')}>แสดง 100 จาก {codes.length} รายการ</Text>}
        </View>
      </ScrollView>
    );
  }

  if (view === 'create') {
    return (
      <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerClassName={cn('p-5 gap-4')}>
        <TouchableOpacity className={cn('flex-row items-center gap-1 mb-1')} onPress={() => setView('list')}>
          <Ionicons name="arrow-back" size={18} color="#e11d48" />
          <Text className={cn('text-xs font-bold text-rose-600')}>กลับ</Text>
        </TouchableOpacity>
        <Text className={cn('text-base font-extrabold text-slate-800')}>สร้างแคมเปญคูปอง</Text>
        <View className={cn('bg-white rounded-2xl shadow-sm border border-rose-100 p-5 gap-3')}>
          <Text className={cn('text-xs font-bold text-slate-600')}>ชื่อแคมเปญ *</Text>
          <TextInput className={cn('border border-rose-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-rose-50')} value={name} onChangeText={setName} placeholder="เช่น ส่วนลดคูปอง T21" />
          <View className={cn('flex-row gap-3')}>
            <View className={cn('flex-1')}>
              <Text className={cn('text-xs font-bold text-slate-600')}>Prefix *</Text>
              <TextInput className={cn('border border-rose-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-rose-50')} value={prefix} onChangeText={setPrefix} placeholder="NVSC" autoCapitalize="characters" />
            </View>
            <View className={cn('flex-1')}>
              <Text className={cn('text-xs font-bold text-slate-600')}>จำนวน *</Text>
              <TextInput className={cn('border border-rose-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-rose-50')} value={quantity} onChangeText={setQuantity} placeholder="100" keyboardType="numeric" />
            </View>
          </View>
          <View className={cn('flex-row gap-3')}>
            <View className={cn('flex-1')}>
              <Text className={cn('text-xs font-bold text-slate-600')}>วันที่เริ่ม</Text>
              <TextInput className={cn('border border-rose-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-rose-50')} value={startDate} onChangeText={setStartDate} placeholder="ไม่ระบุ" onFocus={(e: any) => { if (e.target) e.target.type = 'datetime-local'; }} />
            </View>
            <View className={cn('flex-1')}>
              <Text className={cn('text-xs font-bold text-slate-600')}>วันหมดอายุ *</Text>
              <TextInput className={cn('border border-rose-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-rose-50')} value={expiryDate} onChangeText={setExpiryDate} placeholder="2025-12-31" onFocus={(e: any) => { if (e.target) e.target.type = 'datetime-local'; }} />
            </View>
          </View>
          <Text className={cn('text-xs font-bold text-slate-600')}>เงื่อนไขเพิ่มเติม</Text>
          <TextInput className={cn('border border-rose-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 bg-rose-50')} value={''} placeholder="ส่วนลด (ไม่ระบุ = ใช้ตามโปรฯ)" />
          <View className={cn('flex-row gap-2 mt-2')}>
            <TouchableOpacity className={cn('flex-row items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 shadow-sm')} onPress={handleCreate}>
              <Ionicons name="color-wand-outline" size={16} color="#fafafa" />
              <Text className={cn('text-xs font-bold text-white')}>Gen คูปอง</Text>
            </TouchableOpacity>
            <TouchableOpacity className={cn('flex-row items-center gap-1 px-3 py-2 rounded-xl border border-rose-300 bg-white')} onPress={() => showAlert('Import CSV', 'รูปแบบ: code,status,expiryDate')}>
              <Ionicons name="cloud-upload-outline" size={14} color="#e11d48" />
              <Text className={cn('text-xs font-bold text-rose-600')}>Import</Text>
            </TouchableOpacity>
            <TouchableOpacity className={cn('flex-row items-center gap-1 px-3 py-2 rounded-xl border border-rose-300 bg-white')} onPress={() => showAlert('Export', 'บันทึกแคมเปญก่อน Export')}>
              <Ionicons name="download-outline" size={14} color="#e11d48" />
              <Text className={cn('text-xs font-bold text-rose-600')}>Export</Text>
            </TouchableOpacity>
          </View>
          <View className={cn('flex-row justify-end gap-2.5 mt-2')}>
            <TouchableOpacity className={cn('px-4 py-2 rounded-xl border border-rose-200 bg-white')} onPress={() => setView('list')}>
              <Text className={cn('text-xs font-semibold text-slate-600')}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity className={cn('flex-row items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 shadow-sm')} onPress={handleCreate}>
              <Ionicons name="checkmark" size={16} color="#fafafa" />
              <Text className={cn('text-xs font-bold text-white')}>สร้างแคมเปญ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerClassName={cn('p-5 gap-4')}>
      <TouchableOpacity className={cn('flex-row items-center gap-1 mb-1')} onPress={() => { if (onBack) onBack(); }}>
        <Ionicons name="arrow-back" size={18} color="#e11d48" />
        <Text className={cn('text-xs font-bold text-rose-600')}>กลับ</Text>
      </TouchableOpacity>
      <View className={cn('flex-row justify-between items-center')}>
        <Text className={cn('text-base font-extrabold text-slate-800')}>แคมเปญคูปอง</Text>
        <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 px-3.5 py-2 rounded-lg shadow-sm')} onPress={() => setView('create')}>
          <Ionicons name="add-outline" size={18} color="#fafafa" />
          <Text className={cn('text-xs font-bold text-white')}>สร้างแคมเปญ</Text>
        </TouchableOpacity>
      </View>
      {campaigns.length === 0 ? (
        <View className={cn('items-center py-16 gap-2.5')}>
          <Ionicons name="ticket-outline" size={48} color="#fecdd3" />
          <Text className={cn('text-xs text-slate-400 font-medium')}>ยังไม่มีแคมเปญคูปอง</Text>
        </View>
      ) : (
        <View className={cn('flex-row flex-wrap gap-3.5')}>
          {campaigns.map(c => {
            const stats = couponStore.getCampaignStats(c.id);
            return (
              <TouchableOpacity key={c.id} className={cn('w-[300px] bg-white rounded-2xl shadow-sm border border-rose-100 p-3.5 gap-2')} onPress={() => { setSelectedId(c.id); setView('detail'); }}>
                <View className={cn('flex-row justify-between items-center')}>
                  <Text className={cn('text-xs font-bold text-slate-800 flex-1')}>{c.name}</Text>
                  <Text className={cn('text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-xl')}>{c.prefix}</Text>
                </View>
                <View className={cn('flex-row gap-3')}>
                  <Text className={cn('text-xs text-slate-500 font-medium')}>{stats.total} คูปอง</Text>
                  <Text className={cn('text-xs font-bold text-emerald-600')}>{stats.active} ใช้ได้</Text>
                  <Text className={cn('text-xs font-medium text-slate-500')}>{stats.used} ใช้แล้ว</Text>
                </View>
                <Text className={cn('text-xs text-slate-500 font-medium')}>หมดอายุ: {c.expiryDate.split('T')[0]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <AlertDialog visible={alertVisible} onClose={() => setAlertVisible(false)} title={alertTitle} message={alertMsg} variant="info" />
    </ScrollView>
  );
};
