import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { cn } from '@/shared/lib/cn';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { useProductStore } from '@/features/product/application/stores/productStore';
import { SaleRecord, useSaleHistoryStore } from '@/features/sale/application/stores/saleHistoryStore';

const fmt = (n: number) => n.toLocaleString();

export const ReturnScreen: React.FC = () => {
  const { returnItems, getSaleByNo } = useSaleHistoryStore();
  const { deductStock } = useProductStore();
  const [step, setStep] = useState<'search' | 'select' | 'confirm' | 'done'>('search');
  const [billSearch, setBillSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState<SaleRecord | null>(null);
  const [returnList, setReturnList] = useState<{ productId: string; name: string; maxQty: number; qty: number; unitPrice: number; checked: boolean }[]>([]);
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'credit'>('cash');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const showAlert = (title: string, msg: string) => {
    setAlertTitle(title);
    setAlertMsg(msg);
    setAlertVisible(true);
  };

  const DEMO_ITEMS = [
    { productId: 'p1', name: 'น้ำดื่มสิงห์ 600ml', qty: 3, unitPrice: 10 },
    { productId: 'p2', name: 'น้ำอัดลม Pepsi 325ml', qty: 2, unitPrice: 15 },
    { productId: 'p5', name: 'เลย์ รสออริจินัล', qty: 1, unitPrice: 20 },
    { productId: 'p6', name: 'สบู่ Dove', qty: 1, unitPrice: 45 },
  ];

  const handleSearchBill = () => {
    const found = getSaleByNo(billSearch.trim());
    if (found && found.status === 'completed') {
      setSelectedBill(found);
      const items = found.items.length > 0
        ? found.items.map(i => ({ productId: i.product.id, name: i.product.name, maxQty: i.qty, qty: 0, unitPrice: i.unitPrice, checked: false }))
        : DEMO_ITEMS.map(i => ({ ...i, maxQty: i.qty, qty: 0, checked: false }));
      setReturnList(items);
      setStep('select');
    } else {
      showAlert('ไม่พบบิล', found ? 'บิลนี้ถูกยกเลิก/คืนแล้ว' : 'ไม่พบเลขบิลนี้');
    }
  };

  const toggleItem = (idx: number) => {
    setReturnList(prev => prev.map((r, i) => i === idx ? { ...r, checked: !r.checked, qty: !r.checked ? r.maxQty : 0 } : r));
  };

  const setQty = (idx: number, val: string) => {
    const n = Math.min(parseInt(val) || 0, returnList[idx].maxQty);
    setReturnList(prev => prev.map((r, i) => i === idx ? { ...r, qty: n } : r));
  };

  const totalRefund = returnList.filter(r => r.checked).reduce((s, r) => s + r.qty * r.unitPrice, 0);

  const handleConfirm = () => {
    if (!reason.trim()) { showAlert('แจ้งเตือน', 'กรุณากรอกเหตุผลการคืน'); return; }
    const checked = returnList.filter(r => r.checked && r.qty > 0);
    if (checked.length === 0) { showAlert('แจ้งเตือน', 'กรุณาเลือกรายการที่ต้องการคืน'); return; }
    checked.forEach(c => deductStock(c.productId, -c.qty));
    returnItems(
      selectedBill!.saleNo,
      checked.map(c => ({ productId: c.productId, qty: c.qty, amount: c.qty * c.unitPrice })),
    );
    showAlert('ดำเนินการสำเร็จ', `คืนสินค้าแล้ว!\nรายการ ${checked.length} รายการ\nยอด refund ฿${fmt(totalRefund)}\nวิธีคืน: ${refundMethod === 'cash' ? 'เงินสด' : 'เครดิต'}`);
    setStep('done');
  };

  if (step === 'done') {
    return (
      <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerClassName={cn('p-5 gap-4')}>
        <View className={cn('items-center py-16')}>
          <Ionicons name="checkmark-circle" size={64} color="#10b981" />
          <Text className={cn('text-base font-extrabold text-slate-800 mt-4')}>ดำเนินการคืนสินค้าแล้ว</Text>
          <Text className={cn('text-xs text-slate-500 font-medium mt-1')}>ระบบได้ปรับปรุงสต็อกและบันทึกข้อมูลแล้ว</Text>
          <TouchableOpacity className={cn('mt-6 bg-rose-500 rounded-xl px-6 py-3 shadow-sm')} onPress={() => { setStep('search'); setBillSearch(''); setSelectedBill(null); setReturnList([]); setReason(''); }}>
            <Text className={cn('text-xs font-bold text-white')}>ทำรายการคืนใหม่</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerClassName={cn('p-5 gap-4')}>
      <Text className={cn('text-base font-extrabold text-slate-800')}>คืนสินค้า</Text>
      <Text className={cn('text-xs text-slate-500 font-medium -mt-3')}>{'ค้นหาบิล → เลือกรายการ → ยืนยัน'}</Text>

      {step === 'search' && (
        <View className={cn('bg-white rounded-2xl p-5 shadow-sm border border-rose-100 gap-3')}>
          <Text className={cn('text-xs font-bold text-slate-800')}>ค้นหาบิลที่ต้องการคืน</Text>
          <View className={cn('flex-row gap-2')}>
            <TextInput className={cn('flex-1 border border-rose-200 rounded-xl px-3 h-10 text-xs font-medium text-slate-800 bg-rose-50')} value={billSearch} onChangeText={setBillSearch} placeholder="เช่น INV-001" placeholderTextColor="#cbd5e1" />
            <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-xl px-4 shadow-sm')} onPress={handleSearchBill}>
              <Ionicons name="search" size={16} color="#fafafa" />
              <Text className={cn('text-xs font-bold text-white')}>ค้นหา</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 'select' && (
        <>
          <View className={cn('bg-white rounded-2xl p-5 shadow-sm border border-rose-100 gap-2')}>
            <Text className={cn('text-xs font-bold text-slate-800')}>{selectedBill?.saleNo || '???'}</Text>
            <Text className={cn('text-xs text-slate-500 font-medium')}>{selectedBill ? new Date(selectedBill.createdAt).toLocaleString('th-TH') : ''}</Text>
          </View>

          <View className={cn('bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden')}>
            <View className={cn('flex-row bg-rose-50 py-2 px-3 border-b border-rose-100')}>
              {['เลือก', 'รายการ', 'จำนวน', 'คืน', 'ราคา', 'รวม'].map((h, i) => (
                <Text key={i} className={cn('flex-1 text-xs font-bold text-rose-700')} style={i === 1 ? { flex: 2 } : {}}>{h}</Text>
              ))}
            </View>
            {returnList.map((r, idx) => (
              <TouchableOpacity key={r.productId} className={cn('flex-row items-center py-2 px-3 border-b border-rose-50', idx % 2 === 1 && 'bg-rose-50/30')} onPress={() => toggleItem(idx)}>
                <View className={cn('flex-1')}>
                  <View className={cn('w-5 h-5 rounded border-2 items-center justify-center')} style={{ borderColor: r.checked ? '#e11d48' : '#cbd5e1', backgroundColor: r.checked ? '#e11d48' : 'transparent' }}>
                    {r.checked && <Ionicons name="checkmark" size={14} color="#fafafa" />}
                  </View>
                </View>
                <Text className={cn('flex-[2] text-xs font-medium text-slate-700')}>{r.name}</Text>
                <Text className={cn('flex-1 text-xs text-slate-700')}>{r.maxQty}</Text>
                <View className={cn('flex-1')}>
                  <TextInput className={cn('w-16 h-9 border border-slate-200 rounded-lg text-sm text-center text-slate-700 bg-white font-medium')} value={String(r.qty)} onChangeText={v => setQty(idx, v)} keyboardType="numeric" editable={r.checked} />
                </View>
                <Text className={cn('flex-1 text-xs text-slate-700 font-medium')}>฿{fmt(r.unitPrice)}</Text>
                <Text className={cn('flex-1 text-xs font-bold text-slate-700')}>฿{fmt(r.qty * r.unitPrice)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className={cn('bg-white rounded-2xl p-5 shadow-sm border border-rose-100 gap-3')}>
            <Text className={cn('text-xs font-bold text-slate-800')}>เหตุผลการคืน *</Text>
            <TextInput className={cn('border border-rose-200 rounded-xl px-3 h-10 text-xs font-medium text-slate-800 bg-rose-50')} value={reason} onChangeText={setReason} placeholder="ระบุเหตุผล..." placeholderTextColor="#cbd5e1" />
            <Text className={cn('text-xs font-semibold text-slate-600')}>วิธีการคืนเงิน</Text>
            <View className={cn('flex-row gap-2')}>
              {(['cash', 'credit'] as const).map(m => (
                <TouchableOpacity key={m} className={cn('flex-row items-center gap-1.5 px-4 py-2 rounded-xl border', refundMethod === m ? 'bg-rose-500 border-rose-500' : 'bg-white border-rose-200')} onPress={() => setRefundMethod(m)}>
                  <Text className={cn('text-xs font-bold', refundMethod === m ? 'text-white' : 'text-slate-600')}>{m === 'cash' ? 'เงินสด' : 'เครดิต'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className={cn('flex-row items-center justify-between py-2 border-t border-rose-100')}>
              <Text className={cn('text-xs font-bold text-slate-800')}>ยอด refund</Text>
              <Text className={cn('text-base font-extrabold text-rose-600')}>฿{fmt(totalRefund)}</Text>
            </View>
            <TouchableOpacity className={cn('bg-rose-500 rounded-xl py-3 items-center shadow-sm')} onPress={handleConfirm}>
              <Text className={cn('text-xs font-bold text-white')}>ยืนยันการคืนสินค้า</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <AlertDialog visible={alertVisible} onClose={() => setAlertVisible(false)} title={alertTitle} message={alertMsg} variant="info" />
    </ScrollView>
  );
};
