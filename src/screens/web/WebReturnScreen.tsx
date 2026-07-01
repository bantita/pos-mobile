/**
 * WebReturnScreen — คืนสินค้า (Partial Return/Refund)
 * Flow: ค้นหาบิล → เลือกสินค้าที่จะคืน → ระบุจำนวน + เหตุผล → ยืนยัน → คืนเงิน + คืนสต๊อก
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { useSaleHistoryStore, SaleRecord } from '../../store/saleHistoryStore';
import { useProductStore } from '../../store/productStore';

const fmt = (n: number) => n.toLocaleString();

export const WebReturnScreen: React.FC = () => {
  const { sales, returnItems, getSaleByNo } = useSaleHistoryStore();
  const { deductStock } = useProductStore();
  const [step, setStep] = useState<'search' | 'select' | 'confirm' | 'done'>('search');
  const [billSearch, setBillSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState<SaleRecord | null>(null);
  const [returnList, setReturnList] = useState<{ productId: string; name: string; maxQty: number; qty: number; unitPrice: number; checked: boolean }[]>([]);
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'credit'>('cash');

  // Mock items for demo (since SaleRecord.items may be empty in mock)
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
      alert(found ? 'บิลนี้ถูกยกเลิก/คืนแล้ว' : 'ไม่พบเลขบิลนี้');
    }
  };

  const toggleItem = (idx: number) => {
    setReturnList(prev => prev.map((r, i) => i === idx ? { ...r, checked: !r.checked, qty: !r.checked ? r.maxQty : 0 } : r));
  };
  const setQty = (idx: number, val: string) => {
    const n = Math.min(parseInt(val) || 0, returnList[idx].maxQty);
    setReturnList(prev => prev.map((r, i) => i === idx ? { ...r, qty: n } : r));
  };

  const checkedItems = returnList.filter(r => r.checked && r.qty > 0);
  const totalRefund = checkedItems.reduce((sum, r) => sum + r.qty * r.unitPrice, 0);

  const handleConfirm = () => {
    if (checkedItems.length === 0) { alert('กรุณาเลือกสินค้าที่จะคืน'); return; }
    if (!reason.trim()) { alert('กรุณาระบุเหตุผลการคืน'); return; }
    // Return items in store
    const items = checkedItems.map(r => ({ productId: r.productId, qty: r.qty, amount: r.qty * r.unitPrice }));
    returnItems(selectedBill!.saleNo, items);
    // Restore stock
    items.forEach(i => deductStock(i.productId, -i.qty)); // negative = add back
    setStep('done');
  };

  // ─── STEP: DONE ──
  if (step === 'done') {
    return (
      <ScrollView style={s.root} contentContainerStyle={s.content}>
        <View style={s.doneCard}>
          <Ionicons name="checkmark-circle" size={56} color={WebColors.success} />
          <Text style={s.doneTitle}>คืนสินค้าสำเร็จ</Text>
          <Text style={s.doneSub}>บิล {selectedBill?.saleNo}</Text>
          <Text style={s.doneAmount}>คืนเงิน ฿{fmt(totalRefund)} ({refundMethod === 'cash' ? 'เงินสด' : 'เครดิต'})</Text>
          <Text style={s.doneSub}>{checkedItems.length} รายการ · เหตุผล: {reason}</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => { setStep('search'); setSelectedBill(null); setBillSearch(''); setReason(''); }}>
            <Text style={s.primaryBtnText}>คืนสินค้ารายการใหม่</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.title}>คืนสินค้า / Refund</Text>
      <Text style={s.subtitle}>คืนสินค้าบางรายการจากบิลเดิม — คืนเงิน + คืนสต๊อก</Text>

      {/* Step 1: ค้นหาบิล */}
      {step === 'search' && (
        <View style={s.card}>
          <Text style={s.cardTitle}>ค้นหาบิลที่ต้องการคืน</Text>
          <View style={s.searchRow}>
            <Ionicons name="receipt-outline" size={16} color={WebColors.textSecondary} />
            <TextInput style={s.searchInput} value={billSearch} onChangeText={setBillSearch} placeholder="กรอกเลขบิล เช่น INV20670622002" placeholderTextColor={WebColors.textSecondary} onSubmitEditing={handleSearchBill} />
            <TouchableOpacity style={s.searchBtn} onPress={handleSearchBill}><Ionicons name="search" size={16} color={WebColors.white} /></TouchableOpacity>
          </View>
          <Text style={s.hint}>ทดสอบ: INV20670622002, INV20670622004</Text>

          {/* Recent completed bills */}
          <Text style={[s.cardTitle, { marginTop: 16 }]}>บิลล่าสุดที่คืนได้</Text>
          {sales.filter(sl => sl.status === 'completed').slice(0, 5).map(sl => (
            <TouchableOpacity key={sl.id} style={s.billRow} onPress={() => { setBillSearch(sl.saleNo); }}>
              <Text style={s.billNo}>{sl.saleNo}</Text>
              <Text style={s.billInfo}>฿{fmt(sl.grandTotal)} · {sl.cashierName}</Text>
              <Text style={s.billDate}>{new Date(sl.createdAt).toLocaleDateString('th-TH')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Step 2: เลือกสินค้าที่จะคืน */}
      {step === 'select' && selectedBill && (
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={s.cardTitle}>เลือกสินค้าที่จะคืน</Text>
              <Text style={s.hint}>บิล: {selectedBill.saleNo} · ยอด ฿{fmt(selectedBill.grandTotal)}</Text>
            </View>
            <TouchableOpacity onPress={() => setStep('search')}><Text style={s.linkBtn}>← เปลี่ยนบิล</Text></TouchableOpacity>
          </View>

          {returnList.map((item, idx) => (
            <View key={idx} style={[s.itemRow, item.checked && s.itemRowChecked]}>
              <TouchableOpacity style={[s.checkbox, item.checked && s.checkboxChecked]} onPress={() => toggleItem(idx)}>
                {item.checked && <Ionicons name="checkmark" size={12} color={WebColors.white} />}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.name}</Text>
                <Text style={s.itemSub}>฿{item.unitPrice} × {item.maxQty} ชิ้น (ในบิล)</Text>
              </View>
              {item.checked && (
                <View style={s.qtyBox}>
                  <Text style={s.qtyLabel}>คืน:</Text>
                  <TextInput style={s.qtyInput} value={String(item.qty)} onChangeText={v => setQty(idx, v)} keyboardType="number-pad" />
                  <Text style={s.qtyLabel}>/{item.maxQty}</Text>
                </View>
              )}
              <Text style={[s.itemAmount, item.checked && { color: WebColors.danger }]}>
                {item.checked ? `-฿${fmt(item.qty * item.unitPrice)}` : `฿${fmt(item.maxQty * item.unitPrice)}`}
              </Text>
            </View>
          ))}

          {/* เหตุผล + refund method */}
          <View style={{ marginTop: 12 }}>
            <Text style={s.fieldLabel}>เหตุผลการคืน <Text style={{ color: WebColors.danger }}>*</Text></Text>
            <TextInput style={s.input} value={reason} onChangeText={setReason} placeholder="เช่น สินค้าชำรุด, ลูกค้าเปลี่ยนใจ" placeholderTextColor={WebColors.gray300} />
          </View>
          <View style={{ marginTop: 8 }}>
            <Text style={s.fieldLabel}>คืนเงินโดย</Text>
            <View style={s.chipRow}>
              <TouchableOpacity style={[s.chip, refundMethod === 'cash' && s.chipActive]} onPress={() => setRefundMethod('cash')}><Text style={[s.chipText, refundMethod === 'cash' && { color: WebColors.white }]}>เงินสด</Text></TouchableOpacity>
              <TouchableOpacity style={[s.chip, refundMethod === 'credit' && s.chipActive]} onPress={() => setRefundMethod('credit')}><Text style={[s.chipText, refundMethod === 'credit' && { color: WebColors.white }]}>เครดิต/Wallet</Text></TouchableOpacity>
            </View>
          </View>

          {/* Summary + Confirm */}
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>ยอดคืนทั้งหมด:</Text>
            <Text style={s.summaryVal}>฿{fmt(totalRefund)}</Text>
          </View>
          <TouchableOpacity style={[s.primaryBtn, checkedItems.length === 0 && { opacity: 0.4 }]} disabled={checkedItems.length === 0} onPress={handleConfirm}>
            <Ionicons name="return-down-back" size={16} color={WebColors.white} />
            <Text style={s.primaryBtnText}>ยืนยันคืนสินค้า ({checkedItems.length} รายการ)</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: WebColors.gray50 },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 17, fontWeight: '800', color: WebColors.text },
  subtitle: { fontSize: 13, color: WebColors.textSecondary },
  card: { backgroundColor: WebColors.white, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: WebColors.border, gap: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  hint: { fontSize: 15, color: WebColors.textSecondary },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WebColors.gray50, borderRadius: 8, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: WebColors.border },
  searchInput: { flex: 1, fontSize: 13, color: '#334155' },
  searchBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: WebColors.primary, alignItems: 'center', justifyContent: 'center' },
  billRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: WebColors.gray100, gap: 12 },
  billNo: { fontSize: 15, fontWeight: '700', color: WebColors.primary },
  billInfo: { flex: 1, fontSize: 15, color: WebColors.textSecondary },
  billDate: { fontSize: 14, color: WebColors.textSecondary },
  linkBtn: { fontSize: 15, color: WebColors.primary, fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, borderBottomWidth: 1, borderBottomColor: WebColors.gray100 },
  itemRowChecked: { backgroundColor: '#FEF2F2' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: WebColors.gray300, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: WebColors.danger, borderColor: WebColors.danger },
  itemName: { fontSize: 15, fontWeight: '600', color: WebColors.text },
  itemSub: { fontSize: 14, color: WebColors.textSecondary },
  itemAmount: { fontSize: 15, fontWeight: '700', color: '#334155' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyLabel: { fontSize: 14, color: WebColors.textSecondary },
  qtyInput: { width: 36, height: 26, borderWidth: 1, borderColor: WebColors.danger, borderRadius: 4, textAlign: 'center', fontSize: 15, color: WebColors.danger, fontWeight: '700' },
  fieldLabel: { fontSize: 15, fontWeight: '600', color: WebColors.textSecondary, marginBottom: 4 },
  input: { height: 36, borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, fontSize: 13, color: WebColors.text },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: WebColors.gray100, borderWidth: 1, borderColor: WebColors.border },
  chipActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  chipText: { fontSize: 15, fontWeight: '600', color: WebColors.textSecondary },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: WebColors.border, marginTop: 8 },
  summaryLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  summaryVal: { fontSize: 17, fontWeight: '800', color: WebColors.danger },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: WebColors.danger, borderRadius: 8, paddingVertical: 12, marginTop: 8 },
  primaryBtnText: { fontSize: 13, fontWeight: '700', color: WebColors.white },
  doneCard: { backgroundColor: WebColors.white, borderRadius: 12, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: WebColors.border },
  doneTitle: { fontSize: 17, fontWeight: '800', color: WebColors.success },
  doneSub: { fontSize: 15, color: WebColors.textSecondary },
  doneAmount: { fontSize: 19, fontWeight: '800', color: WebColors.danger },
});
