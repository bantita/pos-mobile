/**
 * WebPOSScreen — หน้าขายสินค้า Web Desktop
 * - Product grid + Cart sidebar
 * - ส่วนลดรายการ / ส่วนลดท้ายบิล / เปลี่ยนราคา
 * - ประเภทชำระเพิ่มเติม
 * - ใบกำกับ / บิลย้อนหลัง / ยกเลิกบิล
 */
import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, Modal, ScrollView, Dimensions, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors, Space, Radius, Shadow, Font } from '../../design-system/tokens';
import { MOCK_PRODUCTS } from '../../data/mockProducts';
import { useCartStore } from '../../store/cartStore';
import { useCustomerDisplayStore } from '../../store/customerDisplayStore';
import { useProductStore } from '../../store/productStore';
import { useMemberStore } from '../../store/memberStore';
import { usePromoStore } from '../../store/promoStore';
import { useWalletStore } from '../../store/walletStore';
import { useSaleHistoryStore } from '../../store/saleHistoryStore';
import { useShiftStore } from '../../store/shiftStore';
import { usePOSPermissionStore, POSAction, POS_ACTION_LABELS } from '../../store/posPermissionStore';
import { logAction } from '../../store/auditLogStore';
import { Product, CartItem, Payment } from '../../types/sale';
import { Member } from '../../types/member';
import { ProductUOM } from '../../types/product';
import { WebCustomerDisplayScreen } from './WebCustomerDisplayScreen';
import { useReceiptStore } from '../../store/receiptStore';
import { StaffPopup } from '../../components/sale/StaffPopup';
import { getStoreType, useStoreConfigStore } from '../../store/storeConfigStore';
import { getFeaturesByStoreType } from '../../utils/storeFeatures';
import { setTechnicians } from '../../store/staffStore';
import { MOCK_TECHNICIANS } from '../../data/mockStaff';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PaymentType { id: string; label: string; icon: string; color: string }

interface InvoiceItem { name: string; qty: number; unitPrice: number; disc: number; total: number }
interface Invoice {
  id: string; billNo: string; date: string; time: string;
  cashier: string; payMethod: string; items: InvoiceItem[];
  subtotal: number; discount: number; vat: number; grand: number;
  status: 'paid' | 'cancelled' | 'void_note' | 'full_tax';
  cancelReason?: string;
  refBillNo?: string;
  memberName?: string;
  buyerInfo?: {
    name: string; addr: string; taxId: string; branch: string;
  };
  receiptImages?: string[];
}

// ─── Mock Invoice Data ────────────────────────────────────────────────────────
const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv001', billNo: 'INV-2569-0001',
    date: '08/06/2569', time: '10:25', cashier: 'สมชาย ใจดี',
    payMethod: 'เงินสด', status: 'paid',
    items: [
      { name: 'น้ำดื่มสิงห์ 600ml', qty: 3, unitPrice: 10, disc: 0, total: 30 },
      { name: 'ขนมปังกรอบ 7-11',    qty: 2, unitPrice: 25, disc: 5, total: 45 },
      { name: 'มาม่า หมูสับ',        qty: 5, unitPrice: 7,  disc: 0, total: 35 },
    ],
    subtotal: 115, discount: 5, vat: 7.7, grand: 110,
  },
  {
    id: 'inv002', billNo: 'INV-2569-0002',
    date: '08/06/2569', time: '11:02', cashier: 'สมชาย ใจดี',
    payMethod: 'QR Code', status: 'paid',
    items: [
      { name: 'น้ำตัดลม Pepsi 325ml', qty: 2, unitPrice: 15, disc: 0, total: 30 },
      { name: 'เลย์ รสออริจินัล',      qty: 1, unitPrice: 20, disc: 0, total: 20 },
    ],
    subtotal: 50, discount: 0, vat: 3.27, grand: 50,
  },
  {
    id: 'inv003', billNo: 'INV-2569-0003',
    date: '08/06/2569', time: '11:45', cashier: 'สมหญิง จริงใจ',
    payMethod: 'โอน', status: 'cancelled', cancelReason: 'ลูกค้าเปลี่ยนใจ',
    items: [
      { name: 'สบู่ Dove ก้อน',          qty: 2, unitPrice: 45, disc: 0, total: 90 },
      { name: 'แชมพู Head & Shoulders', qty: 1, unitPrice: 89, disc: 10, total: 79 },
    ],
    subtotal: 179, discount: 10, vat: 11.15, grand: 169,
  },
  {
    id: 'inv004', billNo: 'INV-2569-0004',
    date: '08/06/2569', time: '13:18', cashier: 'สมชาย ใจดี',
    payMethod: 'เงินสด', status: 'paid',
    items: [
      { name: 'น้ำดื่มสิงห์ 600ml', qty: 6, unitPrice: 10, disc: 0, total: 60 },
      { name: 'มาม่า หมูสับ',        qty: 3, unitPrice: 7,  disc: 0, total: 21 },
      { name: 'ขนมปังกรอบ 7-11',    qty: 1, unitPrice: 25, disc: 0, total: 25 },
      { name: 'เลย์ รสออริจินัล',    qty: 2, unitPrice: 20, disc: 5, total: 35 },
    ],
    subtotal: 146, discount: 5, vat: 9.38, grand: 141,
  },
  {
    id: 'inv005', billNo: 'INV-2569-0005',
    date: '08/06/2569', time: '14:55', cashier: 'สมหญิง จริงใจ',
    payMethod: 'เงินสด', status: 'paid',
    items: [
      { name: 'น้ำตัดลม Pepsi 325ml', qty: 4, unitPrice: 15, disc: 0, total: 60 },
    ],
    subtotal: 60, discount: 0, vat: 3.93, grand: 60,
  },
];

const DEFAULT_PAY_TYPES: PaymentType[] = [
  { id: 'cash',     label: 'เงินสด',   icon: 'cash-outline',             color: WebColors.success },
  { id: 'transfer', label: 'โอน',      icon: 'phone-portrait-outline',   color: WebColors.purple },
  { id: 'qr',       label: 'QR',       icon: 'qr-code-outline',          color: WebColors.info },
  { id: 'wallet',   label: 'Wallet',   icon: 'wallet-outline',           color: WebColors.warning },
];

const CATS = ['ทั้งหมด', 'เครื่องดื่ม', 'อาหาร', 'ขนม', 'ของใช้'];
const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

const toCartProduct = (m: typeof MOCK_PRODUCTS[0], uom: ProductUOM): Product => ({
  id: `${m.id}_${uom.id}`, code: m.code, barcode: uom.barcodes[0] ?? m.barcode,
  name: uom.ratio > 1 ? `${m.name} (${uom.unit})` : m.name,
  category: m.categoryName, price: uom.salePrice, cost: uom.costPrice,
  vatIncluded: m.vatIncluded, vatRate: m.vatRate, unit: uom.unit,
  stockQty: Math.floor(m.stockQty / uom.ratio),
});

// Base products computed inside component (reactive to productStore)

// ─── Cart Item Row ─────────────────────────────────────────────────────────────
// ─── Cart Item Row ─────────────────────────────────────────────────────────────
interface CartItemProps {
  item: CartItem;
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onDiscount: (id: string) => void;
  onChangePrice: (id: string) => void;
  itemDiscounts: Record<string, number>;
  itemDiscTypes: Record<string, 'amount' | 'percent'>;
  customPrices: Record<string, number>;
}

// ── Inline NumPad Popup ───────────────────────────────────────────────────────
const QtyNumPad: React.FC<{
  current: number;
  onConfirm: (n: number) => void;
  onClose: () => void;
}> = ({ current, onConfirm, onClose }) => {
  const [val, setVal] = React.useState(String(current));

  const press = (k: string) => {
    if (k === '⌫') { setVal(v => v.length > 1 ? v.slice(0, -1) : '0'); return; }
    if (k === 'C')  { setVal('0'); return; }
    if (k === '✓')  { const n = parseInt(val, 10); if (n > 0) onConfirm(n); onClose(); return; }
    setVal(v => v === '0' ? k : v.length < 4 ? v + k : v);
  };

  const keys = ['7','8','9','4','5','6','1','2','3','C','0','⌫'];

  return (
    <Modal visible transparent animationType="fade">
      <TouchableOpacity
        style={qnp.backdrop}
        onPress={onClose}
        activeOpacity={1}
      >
        <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation?.()}>
          <View style={qnp.box}>
            {/* Display */}
            <View style={qnp.displayBox}>
              <Text style={qnp.displayText}>{val}</Text>
            </View>
            {/* Grid */}
            <View style={qnp.grid}>
              {keys.map(k => (
                <TouchableOpacity
                  key={k}
                  style={[qnp.key, k === 'C' && qnp.keyRed]}
                  onPress={() => press(k)}
                  activeOpacity={0.7}
                >
                  <Text style={[qnp.keyText, k === 'C' && { color: '#fff' }]}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Confirm */}
            <TouchableOpacity style={qnp.confirm} onPress={() => press('✓')} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={qnp.confirmText}>ยืนยัน</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const qnp = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  box: {
    backgroundColor: '#fff', borderRadius: 18,
    padding: 18, width: 260, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 16,
  },
  displayBox: {
    backgroundColor: WebColors.gray50, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: WebColors.border,
    alignItems: 'flex-end',
  },
  displayText: { fontSize: 20, fontWeight: '800', color: WebColors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: {
    width: '30%', aspectRatio: 1.6,
    borderRadius: 12, backgroundColor: WebColors.gray100,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: WebColors.border,
  },
  keyRed:   { backgroundColor: WebColors.danger, borderColor: WebColors.danger },
  keyText:  { fontSize: 16, fontWeight: '700', color: WebColors.text },
  confirm: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: WebColors.success,
    borderRadius: 12, paddingVertical: 14,
  },
  confirmText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});

const CartItemRow: React.FC<CartItemProps> = ({
  item, onQtyChange, onRemove, onDiscount, onChangePrice,
  itemDiscounts, itemDiscTypes, customPrices,
}) => {
  const [showNumPad, setShowNumPad] = React.useState(false);
  const discVal  = itemDiscounts[item.product.id] ?? 0;
  const discType = itemDiscTypes[item.product.id] ?? 'amount';
  const usePrice = customPrices[item.product.id] ?? item.unitPrice;
  const discAmt  = discType === 'percent' ? usePrice * (discVal / 100) : discVal;
  const netPrice = Math.max(0, usePrice - discAmt);
  const subtotal = netPrice * item.qty;

  return (
    <View style={cs.row}>
      {showNumPad && (
        <QtyNumPad
          current={item.qty}
          onConfirm={(n) => onQtyChange(item.product.id, n)}
          onClose={() => setShowNumPad(false)}
        />
      )}      <View style={cs.nameCol}>
        <Text style={cs.name} numberOfLines={1}>{item.product.name}</Text>
        {item.technicianName && (
          <Text style={cs.techName}>🧑‍🔧 {item.technicianName}</Text>
        )}
        <View style={cs.metaRow}>
          <Text style={cs.meta}>฿{fmt(usePrice)}</Text>
          {discAmt > 0 && (
            <Text style={cs.discMeta}>
              {' '}-{discType === 'percent' ? `${discVal}%` : `฿${fmt(discAmt)}`}
            </Text>
          )}
        </View>
      </View>
      <View style={cs.qtyRow}>
        <TouchableOpacity style={cs.qBtn} onPress={() => onQtyChange(item.product.id, item.qty - 1)}>
          <Ionicons name="remove" size={12} color={WebColors.primary} />
        </TouchableOpacity>
        {/* กดที่ตัวเลขเพื่อเปิด numpad */}
        <TouchableOpacity onPress={() => setShowNumPad(true)}>
          <Text style={[cs.qty, { textDecorationLine: 'underline' }]}>{item.qty}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cs.qBtn} onPress={() => onQtyChange(item.product.id, item.qty + 1)}>
          <Ionicons name="add" size={12} color={WebColors.primary} />
        </TouchableOpacity>
      </View>
      <Text style={cs.sub}>฿{fmt(subtotal)}</Text>
      <View style={cs.actions}>
        <TouchableOpacity style={cs.actionBtn} onPress={() => onChangePrice(item.product.id)}>
          <Ionicons name="pricetag-outline" size={12} color="#F59E0B" />
        </TouchableOpacity>
        <TouchableOpacity style={cs.actionBtn} onPress={() => onDiscount(item.product.id)}>
          <Ionicons name="cut-outline" size={12} color={WebColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[cs.actionBtn, { backgroundColor: WebColors.dangerLight }]} onPress={() => onRemove(item.product.id)}>
          <Ionicons name="trash-outline" size={12} color={WebColors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
const cs = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: WebColors.border, gap: 6 },
  nameCol: { flex: 1 },
  name: { fontSize: 12, fontWeight: '500', color: WebColors.text },
  techName: { fontSize: 13, color: WebColors.danger, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: 13, color: WebColors.textSecondary },
  discMeta: { fontSize: 13, color: WebColors.danger },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qBtn: { width: 20, height: 20, borderRadius: 8, backgroundColor: WebColors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: WebColors.primary },
  qty: { fontSize: 12, fontWeight: '700', minWidth: 22, textAlign: 'center', color: WebColors.text },
  sub: { fontSize: 12, fontWeight: '700', color: WebColors.primary, minWidth: 58, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 3 },
  actionBtn: { width: 22, height: 22, borderRadius: 8, backgroundColor: WebColors.primaryLight, alignItems: 'center', justifyContent: 'center' },
});

// ─── Payment Settings Modal ────────────────────────────────────────────────────
const PaymentSettingsModal: React.FC<{
  visible: boolean;
  payTypes: PaymentType[];
  onSave: (types: PaymentType[]) => void;
  onClose: () => void;
}> = ({ visible, payTypes, onSave, onClose }) => {
  const [types, setTypes] = useState<PaymentType[]>(payTypes);
  const [newLabel, setNewLabel] = useState('');

  const addType = () => {
    if (!newLabel.trim()) return;
    setTypes(prev => [...prev, { id: `pay_${Date.now()}`, label: newLabel.trim(), icon: 'card-outline', color: WebColors.primary }]);
    setNewLabel('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={pm.overlay}>
        <View style={pm.sheet}>
          <View style={pm.header}>
            <Text style={pm.title}>ตั้งค่าประเภทชำระเงิน</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color={WebColors.textSecondary} /></TouchableOpacity>
          </View>
          <Text style={pm.sub}>เพิ่ม/ลบ ประเภทชำระเงินที่ต้องการแสดง</Text>
          {types.map((t, i) => (
            <View key={t.id} style={pm.typeRow}>
              <Ionicons name={t.icon as any} size={18} color={t.color} />
              <Text style={pm.typeLabel}>{t.label}</Text>
              {i >= 3 && (
                <TouchableOpacity style={pm.removeBtn} onPress={() => setTypes(prev => prev.filter(x => x.id !== t.id))}>
                  <Ionicons name="close-circle" size={16} color={WebColors.danger} />
                </TouchableOpacity>
              )}
              {i < 3 && <Text style={pm.defaultTag}>ค่าเริ่มต้น</Text>}
            </View>
          ))}
          <View style={pm.addRow}>
            <TextInput style={pm.addInput} value={newLabel} onChangeText={setNewLabel} placeholder="ชื่อประเภทชำระใหม่ เช่น Rabbit Card" placeholderTextColor={WebColors.textDisabled} />
            <TouchableOpacity style={pm.addBtn} onPress={addType}>
              <Ionicons name="add" size={16} color="#fff" /><Text style={pm.addBtnText}>เพิ่ม</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={pm.saveBtn} onPress={() => { onSave(types); onClose(); }}>
            <Text style={pm.saveBtnText}>บันทึก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  sheet: { backgroundColor: '#fff', borderRadius: 14, padding: 24, width: 420, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  sub: { fontSize: 12, color: WebColors.textSecondary, marginTop: -6 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  typeLabel: { flex: 1, fontSize: 12, color: WebColors.text },
  removeBtn: { padding: 2 },
  defaultTag: { fontSize: 12, color: WebColors.textDisabled, backgroundColor: WebColors.gray100, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 12, color: WebColors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 14, height: 40 },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  saveBtn: { backgroundColor: WebColors.primary, borderRadius: 12, height: 46, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

// ─── Print Receipt 80mm ───────────────────────────────────────────────────────
function printReceipt80mm(invoice: {
  billNo: string; date: string; time: string; cashier: string; payMethod: string;
  items: { name: string; qty: number; unitPrice: number; disc: number; total: number }[];
  subtotal: number; discount: number; vat: number; grand: number;
  status: string; cancelReason?: string;
  buyerInfo?: { name: string; addr: string; taxId: string; branch: string };
  memberInfo?: { name: string; memberNo: string; pointBalance: number; walletBalance: number; pointsEarned?: number };
}, billType: 'receipt' | 'tax_short' | 'tax_full', paperSize: '58mm' | '80mm' | 'A4' = '80mm') {

  // ── อ่าน config จาก receiptStore ──────────────────────────────────────────
  const cfg = useReceiptStore.getState().config;
  const shopName   = cfg.shopName   || SHOP_NAME;
  const shopAddr   = cfg.shopAddr   || SHOP_ADDR;
  const shopTel    = cfg.shopTel    || SHOP_TEL;
  const shopTaxId  = cfg.shopTaxId  || SHOP_TAX_ID;
  const shopBranch = cfg.shopBranch || SHOP_BRANCH;
  const posRegNo   = cfg.posRegNo   || POS_REG_NO;
  const headerText = cfg.headerText || '';
  const footerText = cfg.footerText || `ขอบคุณที่ใช้บริการ 🙏`;
  const headerLogo = cfg.headerLogo || '';
  const showLogo   = cfg.showLogo ?? true;
  const paper      = cfg.paperSize  || paperSize;

  const W = paper === '80mm' ? '72mm' : paper === '58mm' ? '50mm' : '190mm';
  const fmtN = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });
  const taxIdFmt = (id: string) => id.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
  const grandEx = invoice.grand / 1.07;
  const vatAmt  = invoice.grand - grandEx;

  // ── Logo HTML ──────────────────────────────────────────────────────────────
  const logoHtml = showLogo && headerLogo
    ? `<div style="text-align:center;margin-bottom:4px"><img src="${headerLogo}" style="max-width:180px;max-height:72px;" /></div>`
    : '';

  const itemRows = invoice.items.map(i => `
    <tr>
      <td style="padding:2px 0">${i.name}</td>
      <td style="text-align:center">${i.qty}</td>
      <td style="text-align:right">${fmtN(i.unitPrice)}</td>
      <td style="text-align:right;color:${i.disc>0?'#c00':'#999'}">${i.disc>0?`-${fmtN(i.disc)}`:'-'}</td>
      <td style="text-align:right;font-weight:bold">${fmtN(i.total)}</td>
    </tr>`).join('');

  const docTitle = billType === 'receipt' ? 'ใบเสร็จรับเงิน'
    : billType === 'tax_short' ? 'ใบกำกับภาษีอย่างย่อ' : 'ใบกำกับภาษี';

  const buyerSection = billType === 'tax_full' && invoice.buyerInfo ? `
    <div class="section">
      <b>ข้อมูลผู้ซื้อ</b><br/>
      ${invoice.buyerInfo.name}<br/>
      ${invoice.buyerInfo.addr}<br/>
      เลขประจำตัวผู้เสียภาษี: ${taxIdFmt(invoice.buyerInfo.taxId)} (${invoice.buyerInfo.branch})
    </div>` : '';

  const vatSection = billType !== 'receipt' ? `
    <tr><td>มูลค่าก่อน VAT</td><td style="text-align:right">${fmtN(grandEx)}</td></tr>
    <tr style="color:#7C3AED;font-weight:bold"><td>VAT 7%</td><td style="text-align:right">${fmtN(vatAmt)}</td></tr>` : '';

  const html = `<!DOCTYPE html><html lang="th"><head>
  <meta charset="UTF-8"/>
  <title>${docTitle}</title>
  <style>
    @page { size: ${paper} auto; margin: 3mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'TH SarabunPSK','Sarabun','Courier New',monospace;
      font-size: 12px; width: ${W}; margin: 0 auto; color: #000;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .dash { border-top: 1px dashed #000; margin: 4px 0; }
    .solid { border-top: 2px solid #000; margin: 4px 0; }
    .section { margin: 3px 0; font-size: 11px; }
    .header-text { font-style: italic; font-size: 11px; }
    .doc-title {
      font-size: 14px; font-weight: bold; text-align: center;
      border: 2px solid #000; padding: 4px; margin: 5px 0;
    }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { border-bottom: 1px solid #000; padding: 3px 0; text-align: left; font-size: 11px; }
    td { padding: 2px 0; vertical-align: top; }
    .sum-row td { padding: 2px 0; }
    .grand-row { font-size: 15px; font-weight: bold; }
    .footer { text-align: center; margin-top: 8px; font-size: 12px; }
    @media print { body { width: ${W}; } }
  </style>
  </head><body>
  ${logoHtml}
  <div class="center bold" style="font-size:15px">${shopName}</div>
  <div class="center section">${shopAddr}</div>
  <div class="center section">โทร ${shopTel}</div>
  ${billType !== 'receipt' ? `<div class="center section">เลขประจำตัวผู้เสียภาษี: ${taxIdFmt(shopTaxId)} (${shopBranch})</div>
  <div class="center section">หมายเลขรหัสเครื่อง: ${posRegNo}</div>` : ''}
  ${headerText ? `<div class="center header-text">${headerText}</div>` : ''}
  <div class="doc-title">${docTitle}</div>
  ${invoice.cancelReason ? '<div class="center bold" style="color:red;font-size:16px">** ยกเลิก **</div>' : ''}
  ${buyerSection}
  <div class="dash"></div>
  <table>
    <tr><td>เลขที่</td><td style="text-align:right">${invoice.billNo}</td></tr>
    <tr><td>วันที่</td><td style="text-align:right">${invoice.date} ${invoice.time} น.</td></tr>
    <tr><td>แคชเชียร์</td><td style="text-align:right">${invoice.cashier}</td></tr>
    <tr><td>ชำระด้วย</td><td style="text-align:right">${invoice.payMethod}</td></tr>
  </table>
  <div class="dash"></div>
  <table>
    <thead>
      <tr>
        <th>รายการ</th>
        <th style="text-align:center;width:24px">จน.</th>
        <th style="text-align:right;width:52px">ราคา</th>
        <th style="text-align:right;width:44px">ส่วนลด</th>
        <th style="text-align:right;width:56px">รวม</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="dash"></div>
  <table class="sum-row">
    <tr><td>ยอดรวม</td><td style="text-align:right">${fmtN(invoice.subtotal)}</td></tr>
    ${invoice.discount > 0 ? `<tr style="color:red"><td>ส่วนลด</td><td style="text-align:right">-${fmtN(invoice.discount)}</td></tr>` : ''}
    ${vatSection}
  </table>
  <div class="solid"></div>
  <table class="grand-row">
    <tr><td>ยอดสุทธิ</td><td style="text-align:right">${fmtN(invoice.grand)}</td></tr>
  </table>
  <div class="dash"></div>
  ${invoice.memberInfo ? `<div style="font-size:11px;margin-bottom:6px">
  <div class="row"><span>สมาชิก:</span><span>${invoice.memberInfo.name} (${invoice.memberInfo.memberNo})</span></div>
  ${invoice.memberInfo.pointsEarned ? `<div class="row"><span>คะแนนที่ได้รับ:</span><span>+${invoice.memberInfo.pointsEarned} pts</span></div>` : ''}
  <div class="row"><span>คะแนนคงเหลือ:</span><span>${invoice.memberInfo.pointBalance.toLocaleString()} pts</span></div>
  <div class="row"><span>Wallet คงเหลือ:</span><span>฿${invoice.memberInfo.walletBalance.toLocaleString()}</span></div>
  </div><div class="dash"></div>` : ''}
  <div class="footer">${footerText}<br/><span style="font-size:10px">${shopName}${shopBranch ? ' · ' + shopBranch : ''}</span></div>
  </body></html>`;

  const w = (window as any).open('', '_blank', 'width=460,height=680');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

// ─── Invoice Detail Tabs Component ───────────────────────────────────────────
const SHOP_NAME    = 'ร้านสะดวกซื้อ ABC';
const SHOP_ADDR    = '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110';
const SHOP_TAX_ID  = '0105560123456';   // เลขประจำตัวผู้เสียภาษี 13 หลัก
const SHOP_BRANCH  = 'สำนักงานใหญ่';
const SHOP_TEL     = '02-123-4567';
// หมายเลขรหัสเครื่อง POS — ถ้าว่างคือร้านไม่ได้จด VAT → ออกได้แค่ใบเสร็จรับเงิน
const POS_REG_NO   = 'POS-001';        // ตั้งค่าที่นี่ — ถ้าไม่มีให้เป็น '' เพื่อทดสอบ

type BillType = 'receipt' | 'tax_short' | 'tax_full';

const InvoiceDetailTabs: React.FC<{
  invoice: Invoice | null;
  receiptFileRef: React.MutableRefObject<any>;
  previewImage: string | null;
  setPreviewImage: (v: string | null) => void;
  onAttach: (uri: string) => void;
  onRemoveAttach: (uri: string) => void;
  onCancel: () => void;
  onClose: () => void;
  onCreateFullTaxInvoice?: (buyer: { buyerName: string; buyerAddr: string; buyerTaxId: string; buyerBranch: string }) => void;
  onCancelFullTaxInvoice?: (fullTaxBillNo: string) => void; // ยกเลิกใบกำกับภาษีเต็ม
  fullTaxLinked?: string; // เลขบิล full_tax ที่เชื่อมโยงกับบิลนี้ (ถ้ามี)
}> = ({ invoice, receiptFileRef, previewImage, setPreviewImage, onAttach, onRemoveAttach, onCancel, onClose, onCreateFullTaxInvoice, onCancelFullTaxInvoice, fullTaxLinked }) => {
  const [tab,      setTab]      = useState<'receipt' | 'attach'>('receipt');
  const [billType, setBillType] = useState<BillType>('receipt');
  const [showFullForm,   setShowFullForm]   = useState(false);
  const [buyerName,      setBuyerName]      = useState('');
  const [buyerAddr,      setBuyerAddr]      = useState('');
  const [buyerTaxId,     setBuyerTaxId]     = useState('');
  const [buyerBranch,    setBuyerBranch]    = useState('สำนักงานใหญ่');

  // ── โหลดข้อมูลเมื่อเปิดบิลใหม่ ──────────────────────────────────────────
  React.useEffect(() => {
    if (!invoice) return;
    if (invoice.status === 'full_tax') {
      setBillType('tax_full');
      setShowFullForm(false);
      if (invoice.buyerInfo) {
        setBuyerName(invoice.buyerInfo.name);
        setBuyerAddr(invoice.buyerInfo.addr);
        setBuyerTaxId(invoice.buyerInfo.taxId);
        setBuyerBranch(invoice.buyerInfo.branch);
      }
    } else {
      // auto-select: มี POS_REG_NO → tax_short, ไม่มี → receipt
      setBillType(POS_REG_NO ? 'tax_short' : 'receipt');
      setShowFullForm(false);
      setBuyerName('');
      setBuyerAddr('');
      setBuyerTaxId('');
      setBuyerBranch('สำนักงานใหญ่');
    }
  }, [invoice?.id]);

  if (!invoice) return null;
  const isPaid    = invoice.status === 'paid';
  const isFullTax = invoice.status === 'full_tax';

  // ✅ มีหมายเลขรหัสเครื่อง → ออกใบกำกับภาษีได้
  const canIssueTax = !!POS_REG_NO;

  // คำนวณ VAT แยก (ราคาไม่รวม VAT)
  const grandEx  = invoice.grand / 1.07;          // ราคาไม่รวม VAT
  const vatAmt   = invoice.grand - grandEx;         // VAT 7%
  const discEx   = invoice.discount / 1.07;

  // ─── Helper: ตัวเลขบาท ─────────────────────────────────────────────────
  const taxIdFmt = (id: string) =>
    id.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');

  // ถ้าเป็น full_tax ให้ใช้ refBillNo เป็นเลขเอกสารอ้างอิง (บิลอย่างย่อต้นฉบับ)
  const shortBillNo = isFullTax ? (invoice.refBillNo ?? invoice.billNo) : invoice.billNo;

  return (
    <>
      {/* Tab bar */}
      <View style={iv.detailTabBar}>
        <TouchableOpacity
          style={[iv.detailTab, tab === 'receipt' && iv.detailTabActive]}
          onPress={() => setTab('receipt')}
        >
          <Ionicons name="receipt-outline" size={14}
            color={tab === 'receipt' ? WebColors.primary : WebColors.textSecondary} />
          <Text style={[iv.detailTabText, tab === 'receipt' && iv.detailTabTextActive]}>บิลที่ออก</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[iv.detailTab, tab === 'attach' && iv.detailTabActive]}
          onPress={() => setTab('attach')}
        >
          <Ionicons name="attach-outline" size={14}
            color={tab === 'attach' ? WebColors.primary : WebColors.textSecondary} />
          <Text style={[iv.detailTabText, tab === 'attach' && iv.detailTabTextActive]}>
            รูปแนบ {(invoice.receiptImages?.length ?? 0) > 0 ? `(${invoice.receiptImages!.length})` : ''}
          </Text>
        </TouchableOpacity>

        {/* ── ปุ่มพิมพ์ 80mm ── */}
        <TouchableOpacity
          style={[iv.detailTab, { marginLeft: 'auto' as any, backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 12 }]}
          onPress={() => Platform.OS === 'web' && printReceipt80mm(invoice, billType)}
        >
          <Ionicons name="print-outline" size={14} color="#fff" />
          <Text style={[iv.detailTabText, { color: '#fff', fontWeight: '700' }]}>พิมพ์บิล</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab: บิลที่ออก ── */}
      {tab === 'receipt' && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

          {/* Bill type selector */}
          <View style={iv.billTypeBar}>
            {isFullTax ? (
              /* บิล full_tax — selector พิเศษ */
              <>
                {!canIssueTax && (
                  <TouchableOpacity
                    style={[iv.billTypeBtn, billType === 'receipt' && iv.billTypeBtnActive]}
                    onPress={() => setBillType('receipt')}
                  >
                    <Ionicons name="document-text-outline" size={13}
                      color={billType === 'receipt' ? WebColors.primary : WebColors.textSecondary} />
                    <Text style={[iv.billTypeTxt, billType === 'receipt' && iv.billTypeTxtActive]}>ใบเสร็จรับเงิน</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[iv.billTypeBtn, billType === 'tax_short' && iv.billTypeBtnActive]}
                  onPress={() => setBillType('tax_short')}
                >
                  <Ionicons name="newspaper-outline" size={13}
                    color={billType === 'tax_short' ? WebColors.primary : WebColors.textSecondary} />
                  <Text style={[iv.billTypeTxt, billType === 'tax_short' && iv.billTypeTxtActive]}>ใบกำกับภาษีอย่างย่อ</Text>
                </TouchableOpacity>
                {/* กดได้ — สลับไปดูใบกำกับเต็ม */}
                <TouchableOpacity
                  style={[iv.billTypeBtn,
                    billType === 'tax_full'
                      ? { backgroundColor: WebColors.purple, borderColor: WebColors.purple }
                      : { borderColor: WebColors.purple, backgroundColor: WebColors.purpleLight },
                  ]}
                  onPress={() => { setBillType('tax_full'); setShowFullForm(false); }}
                >
                  <Ionicons name="document-outline" size={13}
                    color={billType === 'tax_full' ? WebColors.white : WebColors.purple} />
                  <Text style={[iv.billTypeTxt, { color: billType === 'tax_full' ? WebColors.white : WebColors.purple, fontWeight: '700' }]}>
                    ใบกำกับภาษีเต็ม ✓
                  </Text>
                </TouchableOpacity>
              </>
            ) : canIssueTax ? (
              /* มี POS_REG_NO → เลือกได้ระหว่าง ใบกำกับอย่างย่อ และ เต็มรูปแบบ เท่านั้น */
              ([
                { key: 'tax_short', label: 'ใบกำกับภาษีอย่างย่อ', icon: 'newspaper-outline'   },
                { key: 'tax_full',  label: 'ใบกำกับภาษีเต็มรูปแบบ', icon: 'document-outline'  },
              ] as { key: BillType; label: string; icon: string }[]).map(b => (
                <TouchableOpacity
                  key={b.key}
                  style={[iv.billTypeBtn, billType === b.key && iv.billTypeBtnActive]}
                  onPress={() => { setBillType(b.key); if (b.key === 'tax_full') setShowFullForm(true); }}
                >
                  <Ionicons name={b.icon as any} size={13}
                    color={billType === b.key ? WebColors.primary : WebColors.textSecondary} />
                  <Text style={[iv.billTypeTxt, billType === b.key && iv.billTypeTxtActive]}>{b.label}</Text>
                </TouchableOpacity>
              ))
            ) : (
              /* ไม่มี POS_REG_NO → ออกได้แค่ใบเสร็จรับเงิน */
              <>
                <View style={[iv.billTypeBtn, { backgroundColor: WebColors.primary, borderColor: WebColors.primary }]}>
                  <Ionicons name="document-text-outline" size={13} color="#fff" />
                  <Text style={[iv.billTypeTxt, { color: '#fff' }]}>ใบเสร็จรับเงิน ✓</Text>
                </View>
                {/* แสดง badge แจ้งเหตุผล */}
                <View style={iv.noTaxBadge}>
                  <Ionicons name="information-circle-outline" size={12} color="#92400E" />
                  <Text style={iv.noTaxText}>ไม่มีหมายเลขรหัสเครื่อง — ออกได้เฉพาะใบเสร็จรับเงิน</Text>
                </View>
              </>
            )}
          </View>

          {/* ─── ใบกำกับภาษีเต็ม — form กรอกข้อมูลผู้ซื้อ ─── */}
          {billType === 'tax_full' && showFullForm && (
            <View style={iv.fullFormCard}>
              <Text style={iv.fullFormTitle}>ข้อมูลผู้ซื้อ (สำหรับใบกำกับภาษีเต็ม)</Text>

              {/* ชื่อ */}
              <View style={iv.fullFormField}>
                <Text style={iv.fullFormLabel}>ชื่อ / บริษัท *</Text>
                <TextInput
                  style={[iv.fullFormInput, !buyerName.trim() && buyerName !== '' && iv.fullFormInputErr]}
                  value={buyerName} onChangeText={setBuyerName}
                  placeholder="ชื่อผู้ซื้อหรือบริษัท" placeholderTextColor={WebColors.textDisabled}
                />
                {!buyerName.trim() && buyerName !== '' && (
                  <View style={iv.fieldError}>
                    <Ionicons name="alert-circle-outline" size={12} color={WebColors.danger} />
                    <Text style={iv.fieldErrorText}>กรุณากรอกชื่อ / บริษัท</Text>
                  </View>
                )}
              </View>

              {/* ที่อยู่ */}
              <View style={iv.fullFormField}>
                <Text style={iv.fullFormLabel}>ที่อยู่ *</Text>
                <TextInput
                  style={[iv.fullFormInput, { height: 64, textAlignVertical: 'top', paddingTop: 8 },
                    !buyerAddr.trim() && buyerAddr !== '' && iv.fullFormInputErr]}
                  value={buyerAddr} onChangeText={setBuyerAddr} multiline
                  placeholder="ที่อยู่ผู้ซื้อ" placeholderTextColor={WebColors.textDisabled}
                />
                {!buyerAddr.trim() && buyerAddr !== '' && (
                  <View style={iv.fieldError}>
                    <Ionicons name="alert-circle-outline" size={12} color={WebColors.danger} />
                    <Text style={iv.fieldErrorText}>กรุณากรอกที่อยู่</Text>
                  </View>
                )}
              </View>

              <View style={iv.fullFormRow}>
                {/* เลขภาษี */}
                <View style={{ flex: 1 }}>
                  <Text style={iv.fullFormLabel}>
                    เลขประจำตัวผู้เสียภาษี / บัตรประชาชน * (13 หลัก)
                  </Text>
                  <TextInput
                    style={[iv.fullFormInput,
                      buyerTaxId.length > 0 && buyerTaxId.length !== 13 && iv.fullFormInputErr,
                      buyerTaxId.length === 13 && { borderColor: WebColors.success },
                    ]}
                    value={buyerTaxId}
                    onChangeText={v => setBuyerTaxId(v.replace(/\D/g, '').slice(0, 13))}
                    placeholder="0000000000000"
                    placeholderTextColor={WebColors.textDisabled}
                    keyboardType="number-pad"
                    maxLength={13}
                  />
                  {/* แสดง progress bar ตัวเลข */}
                  {buyerTaxId.length > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={{ flex: 1, height: 4, backgroundColor: WebColors.border, borderRadius: 2, overflow: 'hidden' as any }}>
                        <View style={{
                          height: 4, borderRadius: 2,
                          width: `${(buyerTaxId.length / 13) * 100}%` as any,
                          backgroundColor: buyerTaxId.length === 13 ? WebColors.success : buyerTaxId.length >= 10 ? '#F59E0B' : WebColors.danger,
                        }} />
                      </View>
                      <Text style={{
                        fontSize: 13, fontWeight: '700',
                        color: buyerTaxId.length === 13 ? WebColors.success : buyerTaxId.length >= 10 ? '#F59E0B' : WebColors.danger,
                        minWidth: 40,
                      }}>
                        {buyerTaxId.length}/13
                      </Text>
                    </View>
                  )}
                  {buyerTaxId.length > 0 && buyerTaxId.length !== 13 && (
                    <View style={iv.fieldError}>
                      <Ionicons name="alert-circle-outline" size={12} color={WebColors.danger} />
                      <Text style={iv.fieldErrorText}>
                        ต้องการอีก {13 - buyerTaxId.length} หลัก
                        {' '}(กรอกมา {buyerTaxId.length} หลัก)
                      </Text>
                    </View>
                  )}
                  {buyerTaxId.length === 13 && (
                    <View style={iv.fieldOk}>
                      <Ionicons name="checkmark-circle-outline" size={12} color={WebColors.success} />
                      <Text style={iv.fieldOkText}>ครบ 13 หลัก ✓</Text>
                    </View>
                  )}
                </View>
                {/* สาขา */}
                <View style={{ width: 140 }}>
                  <Text style={iv.fullFormLabel}>สาขา</Text>
                  <TextInput style={iv.fullFormInput} value={buyerBranch} onChangeText={setBuyerBranch}
                    placeholder="สำนักงานใหญ่" placeholderTextColor={WebColors.textDisabled} />
                </View>
              </View>

              {/* Summary validation banner */}
              {(buyerName !== '' || buyerAddr !== '' || buyerTaxId !== '') &&
               (!buyerName.trim() || !buyerAddr.trim() || buyerTaxId.length !== 13) && (
                <View style={iv.formWarnBox}>
                  <Ionicons name="information-circle-outline" size={14} color="#92400E" />
                  <View style={{ flex: 1, gap: 2 }}>
                    {!buyerName.trim() && <Text style={iv.formWarnText}>• ยังไม่ได้กรอกชื่อ / บริษัท</Text>}
                    {!buyerAddr.trim() && <Text style={iv.formWarnText}>• ยังไม่ได้กรอกที่อยู่</Text>}
                    {buyerTaxId.length > 0 && buyerTaxId.length !== 13 && (
                      <Text style={iv.formWarnText}>
                        • เลขประจำตัวผู้เสียภาษีต้องครบ 13 หลัก (กรอกมา {buyerTaxId.length} หลัก)
                      </Text>
                    )}
                    {buyerTaxId.length === 0 && (
                      <Text style={iv.formWarnText}>• ยังไม่ได้กรอกเลขประจำตัวผู้เสียภาษี</Text>
                    )}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[iv.fullFormBtn,
                  (!buyerName.trim() || !buyerAddr.trim() || buyerTaxId.length !== 13) &&
                  { backgroundColor: WebColors.gray300, opacity: 0.6 },
                ]}
                disabled={!buyerName.trim() || !buyerAddr.trim() || buyerTaxId.length !== 13}
                onPress={() => {
                  const buyer = {
                    buyerName: buyerName.trim(),
                    buyerAddr: buyerAddr.trim(),
                    buyerTaxId: buyerTaxId.trim(),
                    buyerBranch: buyerBranch.trim(),
                  };
                  setShowFullForm(false);
                  if (invoice && onCreateFullTaxInvoice) {
                    onCreateFullTaxInvoice(buyer);
                  }
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={iv.fullFormBtnTxt}>ยืนยันข้อมูลผู้ซื้อ</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ─── RECEIPT CARD ─── */}
          <View style={iv.receiptCard}>

            {/* ══ ใบเสร็จรับเงิน ══ */}
            {billType === 'receipt' && (
              <>
                <View style={iv.rcHeader}>
                  <View style={iv.rcShopIcon}>
                    <Ionicons name="storefront" size={24} color={WebColors.primary} />
                  </View>
                  <Text style={iv.rcShopName}>{SHOP_NAME}</Text>
                  <Text style={iv.rcShopSub}>{SHOP_ADDR}</Text>
                  <Text style={iv.rcShopSub}>โทร {SHOP_TEL}</Text>
                  <View style={iv.rcDocTypeBadge}>
                    <Text style={iv.rcDocTypeText}>ใบเสร็จรับเงิน</Text>
                  </View>
                  {invoice.cancelReason && <View style={iv.cancelStamp}><Text style={iv.cancelStampText}>ยกเลิก</Text></View>}
                </View>
                <View style={iv.rcDividerDash} />
                {/* เลขบิล/วันที่ */}
                <View style={iv.rcInfoGrid}>
                  <View style={iv.rcInfoRow}><Text style={iv.rcInfoKey}>เลขที่</Text><Text style={iv.rcInfoVal}>{invoice.billNo}</Text></View>
                  <View style={iv.rcInfoRow}><Text style={iv.rcInfoKey}>วันที่</Text><Text style={iv.rcInfoVal}>{invoice.date} {invoice.time} น.</Text></View>
                  <View style={iv.rcInfoRow}><Text style={iv.rcInfoKey}>แคชเชียร์</Text><Text style={iv.rcInfoVal}>{invoice.cashier}</Text></View>
                  <View style={iv.rcInfoRow}><Text style={iv.rcInfoKey}>ชำระด้วย</Text><Text style={iv.rcInfoVal}>{invoice.payMethod}</Text></View>
                </View>
                <View style={iv.rcDividerDash} />
                {/* Items */}
                <View style={iv.rcItemsHead}>
                  <Text style={[iv.rcItemH, { flex: 1 }]}>รายการ</Text>
                  <Text style={[iv.rcItemH, { width: 32, textAlign: 'center' }]}>จำนวน</Text>
                  <Text style={[iv.rcItemH, { width: 68, textAlign: 'right' }]}>ราคา/ชิ้น</Text>
                  <Text style={[iv.rcItemH, { width: 52, textAlign: 'right' }]}>ส่วนลด</Text>
                  <Text style={[iv.rcItemH, { width: 70, textAlign: 'right' }]}>รวม</Text>
                </View>
                {invoice.items.map((item, idx) => (
                  <View key={idx} style={[iv.rcItemRow, idx % 2 === 1 && { backgroundColor: '#FAFAFA' }]}>
                    <Text style={[iv.rcItemCell, { flex: 1 }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[iv.rcItemCell, { width: 32, textAlign: 'center' }]}>{item.qty}</Text>
                    <Text style={[iv.rcItemCell, { width: 68, textAlign: 'right' }]}>฿{fmt(item.unitPrice)}</Text>
                    <Text style={[iv.rcItemCell, { width: 52, textAlign: 'right', color: item.disc > 0 ? WebColors.danger : WebColors.textDisabled }]}>
                      {item.disc > 0 ? `-฿${fmt(item.disc)}` : '-'}
                    </Text>
                    <Text style={[iv.rcItemCell, { width: 70, textAlign: 'right', fontWeight: '700' }]}>฿{fmt(item.total)}</Text>
                  </View>
                ))}
                <View style={iv.rcDividerDash} />
                <View style={iv.rcSummary}>
                  <View style={iv.rcSumRow}><Text style={iv.rcSumLbl}>ยอดรวมสินค้า</Text><Text style={iv.rcSumVal}>฿{fmt(invoice.subtotal)}</Text></View>
                  {invoice.discount > 0 && <View style={iv.rcSumRow}><Text style={[iv.rcSumLbl, { color: WebColors.danger }]}>ส่วนลด</Text><Text style={[iv.rcSumVal, { color: WebColors.danger }]}>-฿{fmt(invoice.discount)}</Text></View>}
                  <View style={iv.rcGrandRow}>
                    <Text style={iv.rcGrandLbl}>ยอดสุทธิ</Text>
                    <Text style={iv.rcGrandVal}>฿{fmt(invoice.grand)}</Text>
                  </View>
                </View>
                <View style={iv.rcDividerDash} />
                <Text style={iv.rcFooter}>ขอบคุณที่ใช้บริการ 🙏</Text>
                <Text style={iv.rcFooterSub}>{SHOP_NAME}</Text>
              </>
            )}

            {/* ══ ใบกำกับภาษีอย่างย่อ ══ */}
            {billType === 'tax_short' && (
              <>
                <View style={iv.rcHeader}>
                  <View style={iv.rcShopIcon}>
                    <Ionicons name="storefront" size={24} color="#7C3AED" />
                  </View>
                  <Text style={iv.rcShopName}>{SHOP_NAME}</Text>
                  <Text style={iv.rcShopSub}>{SHOP_ADDR}</Text>
                  <Text style={iv.rcShopSub}>โทร {SHOP_TEL}</Text>
                  <Text style={iv.rcShopSub}>เลขประจำตัวผู้เสียภาษี {taxIdFmt(SHOP_TAX_ID)} ({SHOP_BRANCH})</Text>
                  {POS_REG_NO && (
                    <Text style={iv.rcShopSub}>หมายเลขรหัสเครื่อง: {POS_REG_NO}</Text>
                  )}
                  <View style={[iv.rcDocTypeBadge, { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' }]}>
                    <Text style={[iv.rcDocTypeText, { color: '#7C3AED' }]}>ใบกำกับภาษีอย่างย่อ</Text>
                  </View>
                  {invoice.cancelReason && <View style={iv.cancelStamp}><Text style={iv.cancelStampText}>ยกเลิก</Text></View>}
                </View>
                <View style={iv.rcDividerDash} />
                <View style={iv.rcInfoGrid}>
                  <View style={iv.rcInfoRow}><Text style={iv.rcInfoKey}>เลขที่</Text><Text style={iv.rcInfoVal}>{shortBillNo}</Text></View>
                  <View style={iv.rcInfoRow}><Text style={iv.rcInfoKey}>วันที่</Text><Text style={iv.rcInfoVal}>{invoice.date} {invoice.time} น.</Text></View>
                  <View style={iv.rcInfoRow}><Text style={iv.rcInfoKey}>แคชเชียร์</Text><Text style={iv.rcInfoVal}>{invoice.cashier}</Text></View>
                  <View style={iv.rcInfoRow}><Text style={iv.rcInfoKey}>ชำระด้วย</Text><Text style={iv.rcInfoVal}>{invoice.payMethod}</Text></View>
                </View>
                <View style={iv.rcDividerDash} />
                <View style={iv.rcItemsHead}>
                  <Text style={[iv.rcItemH, { flex: 1 }]}>รายการ</Text>
                  <Text style={[iv.rcItemH, { width: 32, textAlign: 'center' }]}>จำนวน</Text>
                  <Text style={[iv.rcItemH, { width: 68, textAlign: 'right' }]}>ราคา/ชิ้น</Text>
                  <Text style={[iv.rcItemH, { width: 52, textAlign: 'right' }]}>ส่วนลด</Text>
                  <Text style={[iv.rcItemH, { width: 70, textAlign: 'right' }]}>รวม</Text>
                </View>
                {invoice.items.map((item, idx) => (
                  <View key={idx} style={[iv.rcItemRow, idx % 2 === 1 && { backgroundColor: '#FAFAFA' }]}>
                    <Text style={[iv.rcItemCell, { flex: 1 }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[iv.rcItemCell, { width: 32, textAlign: 'center' }]}>{item.qty}</Text>
                    <Text style={[iv.rcItemCell, { width: 68, textAlign: 'right' }]}>฿{fmt(item.unitPrice)}</Text>
                    <Text style={[iv.rcItemCell, { width: 52, textAlign: 'right', color: item.disc > 0 ? WebColors.danger : WebColors.textDisabled }]}>
                      {item.disc > 0 ? `-฿${fmt(item.disc)}` : '-'}
                    </Text>
                    <Text style={[iv.rcItemCell, { width: 70, textAlign: 'right', fontWeight: '700' }]}>฿{fmt(item.total)}</Text>
                  </View>
                ))}
                <View style={iv.rcDividerDash} />
                <View style={iv.rcSummary}>
                  <View style={iv.rcSumRow}><Text style={iv.rcSumLbl}>ยอดรวมสินค้า (รวม VAT)</Text><Text style={iv.rcSumVal}>฿{fmt(invoice.subtotal)}</Text></View>
                  {invoice.discount > 0 && <View style={iv.rcSumRow}><Text style={[iv.rcSumLbl, { color: WebColors.danger }]}>ส่วนลด</Text><Text style={[iv.rcSumVal, { color: WebColors.danger }]}>-฿{fmt(invoice.discount)}</Text></View>}
                  <View style={iv.rcSumRow}><Text style={iv.rcSumLbl}>มูลค่าก่อน VAT</Text><Text style={iv.rcSumVal}>฿{fmt(grandEx)}</Text></View>
                  <View style={[iv.rcSumRow, { backgroundColor: '#F5F3FF', borderRadius: 8, padding: 5, marginVertical: 2 }]}>
                    <Text style={[iv.rcSumLbl, { color: '#7C3AED', fontWeight: '700' }]}>ภาษีมูลค่าเพิ่ม 7%</Text>
                    <Text style={[iv.rcSumVal, { color: '#7C3AED', fontWeight: '700' }]}>฿{fmt(vatAmt)}</Text>
                  </View>
                  <View style={iv.rcGrandRow}>
                    <Text style={iv.rcGrandLbl}>ยอดสุทธิ (รวม VAT)</Text>
                    <Text style={[iv.rcGrandVal, { color: '#7C3AED' }]}>฿{fmt(invoice.grand)}</Text>
                  </View>
                </View>
                <View style={iv.rcDividerDash} />
                {/* ปุ่มออกใบกำกับภาษีเต็ม — ซ่อนถ้าออกไปแล้ว */}
                {!isFullTax && !fullTaxLinked && (
                  <TouchableOpacity
                    style={iv.upgradeFullBtn}
                    onPress={() => { setBillType('tax_full'); setShowFullForm(true); }}
                  >
                    <Ionicons name="document-outline" size={14} color="#7C3AED" />
                    <Text style={iv.upgradeFullBtnTxt}>ออกใบกำกับภาษีเต็มรูปแบบ</Text>
                    <Ionicons name="arrow-forward" size={13} color="#7C3AED" />
                  </TouchableOpacity>
                )}
                {/* ออกไปแล้ว — แสดง badge + ปุ่มยกเลิก */}
                {!isFullTax && fullTaxLinked && (
                  <View style={{ gap: 8 }}>
                    <View style={[iv.upgradeFullBtn, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
                      <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                      <Text style={[iv.upgradeFullBtnTxt, { color: '#15803D', flex: 1 }]}>
                        ออกใบกำกับภาษีเต็ม {fullTaxLinked} แล้ว
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[iv.upgradeFullBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                      onPress={() => onCancelFullTaxInvoice?.(fullTaxLinked)}
                    >
                      <Ionicons name="close-circle-outline" size={14} color={WebColors.danger} />
                      <Text style={[iv.upgradeFullBtnTxt, { color: WebColors.danger }]}>
                        ยกเลิกใบกำกับภาษีเต็ม (เพื่อออกใหม่)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {isFullTax && (
                  <View style={[iv.upgradeFullBtn, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
                    <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                    <Text style={[iv.upgradeFullBtnTxt, { color: '#15803D' }]}>
                      ออกใบกำกับภาษีเต็ม {invoice.billNo} แล้ว
                    </Text>
                  </View>
                )}
                <Text style={iv.rcFooter}>ขอบคุณที่ใช้บริการ 🙏</Text>
                <Text style={iv.rcFooterSub}>{SHOP_NAME} · เลขที่ {taxIdFmt(SHOP_TAX_ID)}</Text>
              </>
            )}

            {/* ══ ใบกำกับภาษีเต็มรูปแบบ ══ */}
            {billType === 'tax_full' && !showFullForm && (
              <>
                {/* หัวกระดาษ */}
                <View style={[iv.rcHeader, { backgroundColor: '#EDE9FE' }]}>
                  <View style={[iv.rcDocTypeBadge, { backgroundColor: '#7C3AED', borderColor: '#7C3AED', marginBottom: 6 }]}>
                    <Text style={[iv.rcDocTypeText, { color: '#fff', fontSize: 12 }]}>ใบกำกับภาษี</Text>
                  </View>
                  <View style={iv.rcShopIcon}>
                    <Ionicons name="storefront" size={24} color="#7C3AED" />
                  </View>
                  <Text style={iv.rcShopName}>{SHOP_NAME}</Text>
                  <Text style={iv.rcShopSub}>{SHOP_ADDR}</Text>
                  <Text style={iv.rcShopSub}>โทร {SHOP_TEL}</Text>
                  <Text style={[iv.rcShopSub, { fontWeight: '700', color: '#7C3AED' }]}>
                    เลขประจำตัวผู้เสียภาษี {taxIdFmt(SHOP_TAX_ID)}
                  </Text>
                  <Text style={iv.rcShopSub}>{SHOP_BRANCH}</Text>
                  {invoice.cancelReason && <View style={iv.cancelStamp}><Text style={iv.cancelStampText}>ยกเลิก</Text></View>}
                </View>

                <View style={iv.rcDividerDash} />

                {/* ข้อมูลผู้ซื้อ */}
                {(() => {
                  // ดึงจาก invoice.buyerInfo ถ้ามี (บิล full_tax ที่บันทึกแล้ว)
                  // ถ้าไม่มีใช้ state (กรณีกำลัง preview ก่อนบันทึก)
                  const bName   = invoice.buyerInfo?.name   || buyerName   || '—';
                  const bAddr   = invoice.buyerInfo?.addr   || buyerAddr   || '—';
                  const bTaxId  = invoice.buyerInfo?.taxId  || buyerTaxId  || '';
                  const bBranch = invoice.buyerInfo?.branch || buyerBranch || '';
                  return (
                    <View style={iv.fullBuyerBox}>
                      <Text style={iv.fullBuyerTitle}>ข้อมูลผู้ซื้อ</Text>
                      <View style={iv.rcInfoRow}>
                        <Text style={iv.rcInfoKey}>ชื่อ/บริษัท</Text>
                        <Text style={iv.rcInfoVal}>{bName}</Text>
                      </View>
                      <View style={iv.rcInfoRow}>
                        <Text style={iv.rcInfoKey}>ที่อยู่</Text>
                        <Text style={[iv.rcInfoVal, { flex: 1, flexWrap: 'wrap' }]}>{bAddr}</Text>
                      </View>
                      <View style={iv.rcInfoRow}>
                        <Text style={iv.rcInfoKey}>เลขภาษี/บัตรปชช.</Text>
                        <Text style={iv.rcInfoVal}>{bTaxId ? taxIdFmt(bTaxId) : '—'}</Text>
                      </View>
                      {bBranch ? (
                        <View style={iv.rcInfoRow}>
                          <Text style={iv.rcInfoKey}>สาขา</Text>
                          <Text style={iv.rcInfoVal}>{bBranch}</Text>
                        </View>
                      ) : null}
                      <TouchableOpacity style={iv.editBuyerBtn} onPress={() => setShowFullForm(true)}>
                        <Ionicons name="pencil-outline" size={12} color={WebColors.primary} />
                        <Text style={iv.editBuyerBtnTxt}>แก้ไขข้อมูลผู้ซื้อ</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}

                <View style={iv.rcDividerDash} />

                {/* เลขที่เอกสาร */}
                <View style={iv.rcInfoGrid}>
                  <View style={iv.rcInfoRow}><Text style={iv.rcInfoKey}>เลขที่ใบกำกับภาษี</Text><Text style={iv.rcInfoVal}>{invoice.billNo}</Text></View>
                  <View style={iv.rcInfoRow}><Text style={iv.rcInfoKey}>วันที่ออก</Text><Text style={iv.rcInfoVal}>{invoice.date}</Text></View>
                  <View style={iv.rcInfoRow}><Text style={iv.rcInfoKey}>แคชเชียร์</Text><Text style={iv.rcInfoVal}>{invoice.cashier}</Text></View>
                  <View style={iv.rcInfoRow}><Text style={iv.rcInfoKey}>ชำระด้วย</Text><Text style={iv.rcInfoVal}>{invoice.payMethod}</Text></View>
                </View>

                <View style={iv.rcDividerDash} />

                {/* รายการสินค้า — แสดงแยก VAT */}
                <View style={iv.rcItemsHead}>
                  <Text style={[iv.rcItemH, { flex: 1 }]}>รายการสินค้า/บริการ</Text>
                  <Text style={[iv.rcItemH, { width: 28, textAlign: 'center' }]}>จำนวน</Text>
                  <Text style={[iv.rcItemH, { width: 72, textAlign: 'right' }]}>ราคา/หน่วย</Text>
                  <Text style={[iv.rcItemH, { width: 70, textAlign: 'right' }]}>รวม (ไม่รวม VAT)</Text>
                </View>
                {invoice.items.map((item, idx) => {
                  const exVat = item.total / 1.07;
                  return (
                    <View key={idx} style={[iv.rcItemRow, idx % 2 === 1 && { backgroundColor: '#FAFAFA' }]}>
                      <Text style={[iv.rcItemCell, { flex: 1 }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[iv.rcItemCell, { width: 28, textAlign: 'center' }]}>{item.qty}</Text>
                      <Text style={[iv.rcItemCell, { width: 72, textAlign: 'right' }]}>฿{fmt(item.unitPrice / 1.07)}</Text>
                      <Text style={[iv.rcItemCell, { width: 70, textAlign: 'right', fontWeight: '700' }]}>฿{fmt(exVat)}</Text>
                    </View>
                  );
                })}

                <View style={iv.rcDividerDash} />

                {/* Summary แยก VAT ชัดเจน */}
                <View style={iv.rcSummary}>
                  <View style={iv.rcSumRow}><Text style={iv.rcSumLbl}>มูลค่าสินค้า (ก่อน VAT)</Text><Text style={iv.rcSumVal}>฿{fmt(grandEx)}</Text></View>
                  {invoice.discount > 0 && (
                    <View style={iv.rcSumRow}>
                      <Text style={[iv.rcSumLbl, { color: WebColors.danger }]}>ส่วนลด (ก่อน VAT)</Text>
                      <Text style={[iv.rcSumVal, { color: WebColors.danger }]}>-฿{fmt(discEx)}</Text>
                    </View>
                  )}
                  <View style={iv.rcSumRow}><Text style={iv.rcSumLbl}>มูลค่าฐานภาษี</Text><Text style={iv.rcSumVal}>฿{fmt(grandEx)}</Text></View>
                  {/* VAT แสดงเด่นชัด */}
                  <View style={[iv.rcSumRow, { backgroundColor: '#F5F3FF', borderRadius: 8, padding: 8, marginVertical: 4 }]}>
                    <View>
                      <Text style={[iv.rcSumLbl, { color: '#7C3AED', fontWeight: '800', fontSize: 12 }]}>ภาษีมูลค่าเพิ่ม (VAT 7%)</Text>
                      <Text style={{ fontSize: 12, color: '#7C3AED' }}>คำนวณจากมูลค่าฐานภาษี</Text>
                    </View>
                    <Text style={[iv.rcSumVal, { color: '#7C3AED', fontWeight: '900', fontSize: 12 }]}>฿{fmt(vatAmt)}</Text>
                  </View>
                  <View style={[iv.rcGrandRow, { borderTopColor: '#7C3AED' }]}>
                    <Text style={iv.rcGrandLbl}>ยอดสุทธิ (รวม VAT 7%)</Text>
                    <Text style={[iv.rcGrandVal, { color: '#7C3AED' }]}>฿{fmt(invoice.grand)}</Text>
                  </View>
                </View>

                <View style={iv.rcDividerDash} />
                <Text style={iv.rcFooter}>ขอบคุณที่ใช้บริการ 🙏</Text>
                <Text style={iv.rcFooterSub}>
                  {SHOP_NAME} · เลขที่ {taxIdFmt(SHOP_TAX_ID)} ({SHOP_BRANCH})
                </Text>
              </>
            )}

            {/* กรณี tax_full แต่ยังไม่กรอกข้อมูลผู้ซื้อ */}
            {billType === 'tax_full' && showFullForm && (
              <View style={{ padding: 24, alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-outline" size={40} color={WebColors.border} />
                <Text style={{ fontSize: 12, color: WebColors.textSecondary }}>กรอกข้อมูลผู้ซื้อด้านบนก่อน</Text>
              </View>
            )}

          </View>
        </ScrollView>
      )}

      {/* ── Tab: รูปแนบ ── */}
      {tab === 'attach' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          <View style={iv.attachHeader}>
            <Text style={iv.attachTitle}>รูปใบเสร็จ / เอกสารแนบ</Text>
            {Platform.OS === 'web' && (
              <input
                ref={receiptFileRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                multiple
                onChange={(e: any) => {
                  const files: File[] = Array.from(e.target.files ?? []);
                  files.forEach(file => {
                    const url = URL.createObjectURL(file);
                    onAttach(url);
                  });
                  e.target.value = '';
                }}
              />
            )}
            <TouchableOpacity
              style={iv.attachBtn}
              onPress={() => Platform.OS === 'web'
                ? (receiptFileRef.current as HTMLInputElement)?.click()
                : undefined}
            >
              <Ionicons name="attach-outline" size={14} color={WebColors.primary} />
              <Text style={iv.attachBtnText}>แนบไฟล์</Text>
            </TouchableOpacity>
          </View>

          {(invoice.receiptImages?.length ?? 0) === 0 ? (
            <View style={iv.attachEmpty}>
              <Ionicons name="images-outline" size={40} color={WebColors.border} />
              <Text style={iv.attachEmptyText}>ยังไม่มีรูปแนบ</Text>
              <Text style={{ fontSize: 13, color: WebColors.textDisabled }}>กดปุ่ม "แนบไฟล์" เพื่อเพิ่มรูปใบเสร็จหรือเอกสาร</Text>
            </View>
          ) : (
            <View style={iv.thumbGrid}>
              {invoice.receiptImages!.map((uri, idx) => (
                <View key={idx} style={iv.thumbWrap}>
                  <TouchableOpacity onPress={() => setPreviewImage(uri)} activeOpacity={0.8}>
                    <Image source={{ uri }} style={iv.thumb} resizeMode="cover" />
                    <View style={iv.thumbOverlay}>
                      <Ionicons name="eye-outline" size={18} color="#fff" />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={iv.thumbDel} onPress={() => onRemoveAttach(uri)}>
                    <Ionicons name="close-circle" size={18} color={WebColors.danger} />
                  </TouchableOpacity>
                  <Text style={iv.thumbLabel} numberOfLines={1}>ไฟล์ {idx + 1}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Actions — real */}
      <View style={iv.detailActions}>
        <TouchableOpacity style={iv.actionClose} onPress={onClose}>
          <Text style={iv.actionCloseText}>ปิด</Text>
        </TouchableOpacity>
        <TouchableOpacity style={iv.actionPrint}>
          <Ionicons name="print-outline" size={15} color={WebColors.textSecondary} />
          <Text style={iv.actionPrintText}>พิมพ์</Text>
        </TouchableOpacity>
        {/* ปุ่มใบกำกับภาษีเต็ม — แสดงเฉพาะมี POS_REG_NO และไม่ใช่ void_note/full_tax */}
        {canIssueTax && invoice.status !== 'void_note' && invoice.status !== 'full_tax' && (
          fullTaxLinked ? (
            /* มี full_tax แล้ว — ปุ่ม disabled */
            <View style={[iv.actionFull, { opacity: 0.45, backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="lock-closed-outline" size={14} color="#6B7280" />
              <Text style={[iv.actionFullText, { color: '#6B7280' }]}>ออกแล้ว ({fullTaxLinked})</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[iv.actionFull, billType === 'tax_full' && !showFullForm && { backgroundColor: '#7C3AED' }]}
              onPress={() => { setTab('receipt'); setBillType('tax_full'); setShowFullForm(true); }}
            >
              <Ionicons name="document-text-outline" size={14}
                color={billType === 'tax_full' && !showFullForm ? '#fff' : '#7C3AED'} />
              <Text style={[iv.actionFullText, billType === 'tax_full' && !showFullForm && { color: '#fff' }]}>
                ใบกำกับภาษีเต็ม
              </Text>
            </TouchableOpacity>
          )
        )}
        {/* ถ้าเป็นบิล full_tax — ปุ่มแก้ไขข้อมูลผู้ซื้อ */}
        {isFullTax && (
          <TouchableOpacity
            style={iv.actionFull}
            onPress={() => { setTab('receipt'); setShowFullForm(true); }}
          >
            <Ionicons name="pencil-outline" size={14} color="#7C3AED" />
            <Text style={iv.actionFullText}>แก้ไขผู้ซื้อ</Text>
          </TouchableOpacity>
        )}
        {/* ถ้าบิล paid มี full_tax แล้ว — ปุ่มยกเลิกใบกำกับภาษีเต็ม */}
        {!isFullTax && fullTaxLinked && invoice.status !== 'void_note' && (
          <TouchableOpacity
            style={[iv.actionFull, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
            onPress={() => onCancelFullTaxInvoice?.(fullTaxLinked)}
          >
            <Ionicons name="close-circle-outline" size={14} color={WebColors.danger} />
            <Text style={[iv.actionFullText, { color: WebColors.danger }]}>ยกเลิกใบกำกับเต็ม</Text>
          </TouchableOpacity>
        )}
        {isPaid && (
          <TouchableOpacity style={iv.actionCancel} onPress={onCancel}>
            <Ionicons name="close-circle-outline" size={14} color="#fff" />
            <Text style={iv.actionCancelText}>ยกเลิกบิล</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
interface POSProps { onExit?: () => void }

// ─── Top-Up Panel (ดูรายการเติมเงิน + ยกเลิก) ────────────────────────────────
const TopUpPanel: React.FC = () => {
  const { transactions, balances } = useWalletStore();
  const { members } = useMemberStore();
  const topups = transactions.filter(t => t.type === 'topup' || t.type === 'refund');

  const handleRefund = (tx: any) => {
    if (!confirm(`ยกเลิกการเติมเงิน ฿${Math.abs(tx.amount).toLocaleString()} ?\n${tx.description}`)) return;
    useWalletStore.getState().refund(tx.memberId, Math.abs(tx.amount), `REFUND-${tx.id}`, 'cashier');
    logAction('POS', 'ยกเลิกเติมเงิน', `ยกเลิก ฿${Math.abs(tx.amount)} ของ ${tx.memberId}`, { txId: tx.id });
    alert('ยกเลิกเรียบร้อย — คืนเงินเข้า Wallet แล้ว');
  };

  return (
    <View style={{ gap: 8, padding: 8 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>รายการเติมเงิน ({topups.length})</Text>
      {topups.length === 0 ? (
        <Text style={{ fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>ยังไม่มีรายการเติมเงิน</Text>
      ) : (
        topups.map((tx, i) => {
          const member = members.find(m => m.id === tx.memberId);
          return (
            <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 8 }}>
              <Ionicons name={tx.type === 'topup' ? 'add-circle' : 'remove-circle'} size={16} color={tx.type === 'topup' ? '#16A34A' : '#DC2626'} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.text }}>{member?.name || tx.memberId}</Text>
                <Text style={{ fontSize: 10, color: Colors.textSecondary }}>{new Date(tx.createdAt).toLocaleString('th-TH')} · {tx.description}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: tx.type === 'topup' ? '#16A34A' : '#DC2626' }}>
                {tx.type === 'topup' ? '+' : ''}฿{Math.abs(tx.amount).toLocaleString()}
              </Text>
              {tx.type === 'topup' && (
                <TouchableOpacity style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FEE2E2' }} onPress={() => handleRefund(tx)}>
                  <Text style={{ fontSize: 9, color: '#DC2626', fontWeight: '600' }}>ยกเลิก</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}
    </View>
  );
};

// ─── Cash Count Form (นับเหรียญ/ธนบัตร) ─────────────────────────────────────
const DENOMINATIONS = [
  { label: 'เหรียญ 25 สต.', value: 0.25 },
  { label: 'เหรียญ 50 สต.', value: 0.5 },
  { label: 'เหรียญ 1 บาท', value: 1 },
  { label: 'เหรียญ 2 บาท', value: 2 },
  { label: 'เหรียญ 5 บาท', value: 5 },
  { label: 'เหรียญ 10 บาท', value: 10 },
  { label: 'ธนบัตร 20 บาท', value: 20 },
  { label: 'ธนบัตร 50 บาท', value: 50 },
  { label: 'ธนบัตร 100 บาท', value: 100 },
  { label: 'ธนบัตร 500 บาท', value: 500 },
  { label: 'ธนบัตร 1000 บาท', value: 1000 },
];

const CashCountForm: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [counts, setCounts] = useState<Record<number, string>>({});

  const total = DENOMINATIONS.reduce((sum, d) => sum + d.value * (parseInt(counts[d.value] || '0') || 0), 0);

  React.useEffect(() => { onChange(String(Math.round(total))); }, [total]);

  return (
    <View style={{ gap: 3 }}>
      {DENOMINATIONS.map(d => (
        <View key={d.value} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ width: 120, fontSize: 11, color: Colors.text }}>{d.label}</Text>
          <TextInput
            style={{ width: 60, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, textAlign: 'center' }}
            value={counts[d.value] || ''}
            onChangeText={v => setCounts(prev => ({ ...prev, [d.value]: v }))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#D1D5DB"
          />
          <Text style={{ fontSize: 10, color: Colors.textSecondary, width: 70, textAlign: 'right' }}>
            = ฿{(d.value * (parseInt(counts[d.value] || '0') || 0)).toLocaleString()}
          </Text>
        </View>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 6, marginTop: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: WebColors.primary }}>รวม: ฿{total.toLocaleString()}</Text>
      </View>
    </View>
  );
};

// ─── Main POS ─────────────────────────────────────────────────────────────────

export const WebPOSScreen: React.FC<POSProps> = ({ onExit }) => {
  const { items, addItem, addServiceItem, removeItem, updateQty, clearCart, holdBill, recallBill, holdBills } = useCartStore();
  const { mode: displayMode, setMode: setDisplayMode } = useCustomerDisplayStore();
  const { products: masterProducts } = useProductStore();
  const shift = useShiftStore();
  const posPerms = usePOSPermissionStore();
  const [showOpenShift, setShowOpenShift] = useState(!shift.isShiftOpen());
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [shiftOpenAmt, setShiftOpenAmt] = useState('1000');
  const [shiftCloseAmt, setShiftCloseAmt] = useState('');
  const [cashMoveType, setCashMoveType] = useState<'in' | 'out'>('out');
  const [cashMoveAmt, setCashMoveAmt] = useState('');
  const [cashMoveReason, setCashMoveReason] = useState('');
  const [showCashMove, setShowCashMove] = useState(false);
  const [showHoldList, setShowHoldList] = useState(false);
  // PIN auth
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinAction, setPinAction] = useState<POSAction | null>(null);
  const [pinCallback, setPinCallback] = useState<(() => void) | null>(null);

  /** ตรวจสิทธิ์ก่อนทำ action — ถ้าไม่ได้เปิดระบบสิทธิ์ ทำได้เลย / ถ้าเปิด ถาม PIN */
  const requirePermission = (action: POSAction, callback: () => void) => {
    // ตรวจว่า action นี้ต้องใช้สิทธิ์ไหม (สาขา → บริษัท → ไม่ต้อง)
    if (!posPerms.isActionRequired(action)) {
      callback(); // ไม่ต้องใช้สิทธิ์ ทำได้เลย
      return;
    }
    setPinAction(action);
    setPinCallback(() => callback);
    setPinInput('');
    setShowPinModal(true);
  };

  const handlePinSubmit = () => {
    if (!pinAction || !pinCallback) return;
    const result = posPerms.checkPermission(pinInput, pinAction);
    if (result.allowed) {
      logAction('POS', `ใช้สิทธิ์: ${POS_ACTION_LABELS[pinAction]}`, `${result.user?.name} (PIN: ${pinInput.slice(0,2)}**) อนุมัติ "${POS_ACTION_LABELS[pinAction]}"`, { user: result.user?.name, action: pinAction });
      setShowPinModal(false);
      pinCallback();
    } else {
      logAction('POS', `สิทธิ์ถูกปฏิเสธ: ${POS_ACTION_LABELS[pinAction]}`, result.message || 'PIN ไม่ถูกต้อง', { action: pinAction, pin: pinInput.slice(0,2) + '**' });
      alert(result.message || 'PIN ไม่ถูกต้องหรือไม่มีสิทธิ์');
    }
    setPinInput('');
  };

  // ALL_BASE reactive — อัปเดตเมื่อ productStore เปลี่ยน
  const ALL_BASE = useMemo(() =>
    masterProducts.map(m => toCartProduct(m, m.uoms[0]))
  , [masterProducts]);
  const [posTab, setPosTab]           = useState<'pos' | 'invoice'>('pos'); // tab หลัก
  const [search, setSearch]           = useState('');
  const [cat, setCat]                 = useState('ทั้งหมด');
  const [gridView, setGridView]       = useState(true);
  const [showDisplay, setShowDisplay] = useState(false);
  const [gridWidth, setGridWidth]     = useState(0);

  // ── Staff Popup (service products) ──────────────────────────────────────────
  const [staffPopupVisible, setStaffPopupVisible] = useState(false);
  const [pendingServiceProduct, setPendingServiceProduct] = useState<any>(null);

  // Load demo technicians on mount
  React.useEffect(() => { setTechnicians(MOCK_TECHNICIANS); }, []);

  // ── Barcode scan ──────────────────────────────────────────────────────────
  const searchRef = useRef<any>(null);
  const [scanFlash, setScanFlash] = useState<string | null>(null);

  // ── Product tap — handles service product staff popup logic ──────────────
  const handleProductTap = useCallback((p: Product) => {
    const baseId = p.id.split('_')[0];
    const master = masterProducts.find(m => m.id === baseId);
    if (master?.productType === 'service') {
      setPendingServiceProduct(p);
      setStaffPopupVisible(true);
    } else {
      addItem(p);
    }
  }, [masterProducts, addItem]);

  const handleBarcodeSubmit = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // ค้น ALL_BASE ทุก product ทุก UOM (multi-barcode support)
    const found = (() => {
      for (const master of masterProducts) {
        for (const uom of master.uoms) {
          if (uom.barcodes.includes(trimmed)) {
            return toCartProduct(master, uom);
          }
        }
      }
      return ALL_BASE.find(p => p.barcode === trimmed);
    })();

    if (found) {
      if (found.stockQty > 0) {
        handleProductTap(found);
        setScanFlash(`✅ ${found.name}`);
      } else {
        setScanFlash(`❌ ${found.name} — สินค้าหมด`);
      }
      setSearch('');
      setTimeout(() => setScanFlash(null), 1600);
    } else {
      // ไม่เจอ barcode → ใช้เป็น keyword filter ปกติ
      setSearch(trimmed);
    }
    setTimeout(() => searchRef.current?.focus(), 80);
  }, [handleProductTap]);

  // Per-item overrides
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>({});   // disc per unit
  const [itemDiscTypes, setItemDiscTypes] = useState<Record<string, 'amount'|'percent'>>({});
  const [customPrices,  setCustomPrices]  = useState<Record<string, number>>({});   // override price

  // Bill-level discount
  const [billDiscount, setBillDiscount]     = useState(0);
  const [billDiscType, setBillDiscType]     = useState<'amount' | 'percent'>('amount');

  // Payment types
  const [payTypes, setPayTypes]   = useState<PaymentType[]>(DEFAULT_PAY_TYPES);
  const [showPaySettings, setShowPaySettings] = useState(false);

  // ── CRM & Promotion ─────────────────────────────────────────────────────────
  const { members, selectedMember, selectMember, searchMembers, earnPoints, redeemPoints, pointConfig } = useMemberStore();
  const { validateCoupon, applyCoupon } = usePromoStore();
  const { getBalance: getWalletBalance, topUp: walletTopUp, pay: walletPay } = useWalletStore();
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberSearch, setMemberSearch]       = useState('');
  const [showTopUpModal, setShowTopUpModal]   = useState(false);
  const [topUpAmount, setTopUpAmount]         = useState('');
  const [showWalletPay, setShowWalletPay]     = useState(false);
  const [couponCode, setCouponCode]           = useState('');
  const [couponError, setCouponError]         = useState('');
  const [couponDiscount, setCouponDiscount]   = useState(0);
  const [couponPromoName, setCouponPromoName] = useState('');
  const [showPointRedeem, setShowPointRedeem] = useState(false);
  const [pointsToUse, setPointsToUse]        = useState('');
  const [pointDiscount, setPointDiscount]     = useState(0);

  const memberSearchResults = useMemo(() => {
    if (!memberSearch.trim()) return members.filter(m => m.isActive);
    return searchMembers(memberSearch).filter(m => m.isActive);
  }, [memberSearch, members]);

  const handleValidateCoupon = () => {
    if (!couponCode.trim()) return;
    const result = validateCoupon(couponCode, afterDisc, selectedMember?.level);
    if (result.valid && result.promotion) {
      const promo = result.promotion;
      let disc = 0;
      if (promo.discountPercent) {
        disc = afterDisc * (promo.discountPercent / 100);
        if (promo.maxDiscount && disc > promo.maxDiscount) disc = promo.maxDiscount;
      } else if (promo.discountAmount) {
        disc = promo.discountAmount;
      }
      setCouponDiscount(disc);
      setCouponPromoName(promo.name);
      setCouponError('');
    } else {
      setCouponDiscount(0);
      setCouponPromoName('');
      setCouponError(result.error || 'คูปองไม่ถูกต้อง');
    }
  };

  const handleApplyPoints = () => {
    const pts = parseInt(pointsToUse) || 0;
    if (pts <= 0 || !selectedMember) return;
    if (pts > selectedMember.pointBalance) return;
    if (pts < pointConfig.minRedeemPoints) return;
    setPointDiscount(pts * pointConfig.redeemRate);
    setShowPointRedeem(false);
  };

  const resetCrmState = () => {
    selectMember(null);
    setCouponCode('');
    setCouponError('');
    setCouponDiscount(0);
    setCouponPromoName('');
    setPointsToUse('');
    setPointDiscount(0);
  };

  // Modals
  // UOM Picker
  const [uomPickerProduct, setUomPickerProduct] = useState<Product | null>(null);

  const [discModal, setDiscModal]       = useState<string | null>(null); // productId
  const [discModalType, setDiscModalType] = useState<'amount'|'percent'>('amount');
  const [priceModal, setPriceModal]     = useState<string | null>(null);
  const [billDiscModal, setBillDiscModal] = useState(false);
  const [payModal, setPayModal]         = useState(false);

  // Temp inputs
  const [discInput, setDiscInput]   = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [billDiscInput, setBillDiscInput] = useState('');
  const [payMethod, setPayMethod]   = useState('');
  const [receivedAmt, setReceivedAmt] = useState('');
  // Split payment
  const [splitPayments, setSplitPayments] = useState<{ method: string; label: string; amount: number }[]>([]);

  // Filtered products
  const filtered = useMemo(() => ALL_BASE.filter(p => {
    const matchCat = cat === 'ทั้งหมด' || p.category === cat;
    const matchS   = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    return matchCat && matchS;
  }), [search, cat]);

  // Calculations
  const subtotal = items.reduce((s, i) => {
    const price    = customPrices[i.product.id] ?? i.unitPrice;
    const discVal  = itemDiscounts[i.product.id] ?? 0;
    const discType = itemDiscTypes[i.product.id] ?? 'amount';
    const discAmt  = discType === 'percent' ? price * (discVal / 100) : discVal;
    return s + Math.max(0, price - discAmt) * i.qty;
  }, 0);
  const billDiscAmt = billDiscType === 'percent' ? subtotal * (billDiscount / 100) : billDiscount;
  const afterDisc   = Math.max(0, subtotal - billDiscAmt);
  const vat         = afterDisc * 0.07;
  const grandTotal  = Math.max(0, afterDisc - couponDiscount - pointDiscount);
  const received    = parseFloat(receivedAmt) || 0;
  const change      = received >= grandTotal ? received - grandTotal : 0;

  // ── Sync ส่วนลด + ราคาที่แก้ไข เข้า cartStore เพื่อให้จอ 2 แสดงถูกต้อง ──
  React.useEffect(() => {
    // Sync bill-level discount เข้า cartStore
    const { setDiscount } = useCartStore.getState();
    if (billDiscount > 0) {
      setDiscount({ type: billDiscType, value: billDiscount });
    } else {
      setDiscount(null);
    }

    // Broadcast ไปจอ 2 (กรณีเปิดหน้าต่างแยก)
    const displayItemsPayload = items.map(i => {
      const usePrice = customPrices[i.product.id] ?? i.unitPrice;
      const discVal  = itemDiscounts[i.product.id] ?? 0;
      const dType    = itemDiscTypes[i.product.id] ?? 'amount';
      const discAmt  = dType === 'percent' ? usePrice * (discVal / 100) : discVal;
      const netPrice = Math.max(0, usePrice - discAmt);
      return {
        id:        i.product.id,
        name:      i.product.name,
        unitPrice: usePrice,
        qty:       i.qty,
        discAmt,
        subtotal:  netPrice * i.qty,
      };
    });

    const itemDiscountTotal = items.reduce((s, i) => {
      const price   = customPrices[i.product.id] ?? i.unitPrice;
      const discVal = itemDiscounts[i.product.id] ?? 0;
      const dType   = itemDiscTypes[i.product.id] ?? 'amount';
      return s + (dType === 'percent' ? price * (discVal / 100) : discVal) * i.qty;
    }, 0);

    useCustomerDisplayStore.getState().broadcastDisplay({
      mode:             displayMode as any,
      displayItems:     displayItemsPayload,
      discountOverride: billDiscAmt + itemDiscountTotal,
      grandOverride:    grandTotal,
      memberInfo:       selectedMember ? { name: selectedMember.name, level: selectedMember.level, points: selectedMember.pointBalance, wallet: getWalletBalance(selectedMember.id) } : null,
    });
  }, [billDiscount, billDiscType, items.length, JSON.stringify(itemDiscounts),
      JSON.stringify(itemDiscTypes), JSON.stringify(customPrices), displayMode, selectedMember]);

  // 5 columns — use percentage-based width
  const cardWidth = '18.4%' as any;

  // ── Invoice state (ดึงจาก saleHistoryStore เพื่อให้ตรงกับประวัติขาย) ──────
  const saleHistory = useSaleHistoryStore(s => s.sales);
  const invoicesFromHistory = useMemo<Invoice[]>(() => {
    return saleHistory.map(sale => {
      const d = new Date(sale.createdAt);
      const pad = (n: number) => String(n).padStart(2, '0');
      const thai = d.getFullYear() + 543;
      return {
        id: sale.id,
        billNo: sale.saleNo,
        date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${thai}`,
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
        cashier: sale.cashierName,
        payMethod: sale.payments.map(p => p.method === 'cash' ? 'เงินสด' : p.method === 'qr' ? 'QR Code' : p.method === 'credit' ? 'บัตร' : p.method === 'transfer' ? 'โอน' : p.method).join(' + '),
        items: (sale.items || []).map(i => ({ name: i.product.name, qty: i.qty, unitPrice: i.unitPrice, disc: i.discountAmount, total: i.subtotal })),
        subtotal: sale.subtotal,
        discount: sale.discountTotal,
        vat: sale.vatAmount,
        grand: sale.grandTotal,
        status: sale.status === 'completed' ? 'paid' as const : 'cancelled' as const,
        memberName: sale.memberName,
      };
    });
  }, [saleHistory]);
  const [extraInvoices, setExtraInvoices] = useState<Invoice[]>([]);
  const invoices = useMemo(() => [...extraInvoices, ...invoicesFromHistory], [extraInvoices, invoicesFromHistory]);
  const setInvoices = (fn: (prev: Invoice[]) => Invoice[]) => setExtraInvoices(fn);
  const [invSearch, setInvSearch]       = useState('');
  const [invFilter, setInvFilter] = useState<'all' | 'paid' | 'cancelled' | 'void_note' | 'full_tax' | 'topup'>('all');
  const [selectedInv, setSelectedInv]   = useState<Invoice | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);
  const receiptFileRef = useRef<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filteredInv = useMemo(() => invoices.filter(inv => {
    const matchSearch = !invSearch
      || inv.billNo.toLowerCase().includes(invSearch.toLowerCase())
      || inv.cashier.includes(invSearch)
      || inv.payMethod.includes(invSearch)
      || (inv.refBillNo ?? '').toLowerCase().includes(invSearch.toLowerCase());
    const matchFilter = invFilter === 'all' || invFilter === 'topup' || inv.status === invFilter;
    return matchSearch && matchFilter;
  }), [invoices, invSearch, invFilter]);

  const handleCancelBill = () => {
    if (!cancelTarget || !cancelReason.trim()) return;

    // ── คำนวณเลขรันนิ่งถัดไป ──────────────────────────────────────────────
    const nextNo = (list: Invoice[]) => {
      const nums = list
        .map(inv => {
          const m = inv.billNo.match(/(\d+)$/);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter(n => !isNaN(n));
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      return String(max + 1).padStart(4, '0');
    };

    // ── วันที่/เวลาปัจจุบัน ────────────────────────────────────────────────
    const now  = new Date();
    const pad  = (n: number) => String(n).padStart(2, '0');
    const thai = now.getFullYear() + 543;
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${thai}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    setInvoices(prev => {
      // 1. mark บิลต้นฉบับเป็น cancelled
      const updated = prev.map(inv =>
        inv.id === cancelTarget.id
          ? { ...inv, status: 'cancelled' as const, cancelReason: cancelReason.trim() }
          : inv
      );

      // 2. สร้างใบยกเลิก (Void Note) เป็นบิลใหม่
      const prefix    = cancelTarget.billNo.replace(/\d+$/, '');   // "INV-2569-"
      const newNo     = nextNo(updated);
      const voidNote: Invoice = {
        id:           `void_${Date.now()}`,
        billNo:       `${prefix}${newNo}`,
        date:         dateStr,
        time:         timeStr,
        cashier:      cancelTarget.cashier,
        payMethod:    cancelTarget.payMethod,
        status:       'void_note',
        cancelReason: cancelReason.trim(),
        refBillNo:    cancelTarget.billNo,
        // รายการเป็นลบ (ยกเลิก)
        items:        cancelTarget.items.map(i => ({ ...i, total: -i.total })),
        subtotal:     -cancelTarget.subtotal,
        discount:     -cancelTarget.discount,
        vat:          -cancelTarget.vat,
        grand:        -cancelTarget.grand,
      };

      return [...updated, voidNote];
    });

    setShowCancelModal(false);
    setSelectedInv(null);
    setCancelReason('');
    setCancelTarget(null);
  };

  // ── แนบรูปใบเสร็จ ──
  const handleAttachReceipt = (uri: string) => {
    if (!selectedInv) return;
    const updated = { ...selectedInv, receiptImages: [...(selectedInv.receiptImages ?? []), uri] };
    setSelectedInv(updated);
    setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
  };
  const handleRemoveReceipt = (uri: string) => {
    if (!selectedInv) return;
    const updated = { ...selectedInv, receiptImages: (selectedInv.receiptImages ?? []).filter(u => u !== uri) };
    setSelectedInv(updated);
    setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
  };

  return (
    <View style={s.outerRoot}>
      {/* ── เปิดกะ Modal ── */}
      {showOpenShift && !shift.isShiftOpen() && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 400, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.text, textAlign: 'center' }}>เปิดกะ — นับเงินตั้งต้นในลิ้นชัก</Text>
            <Text style={{ fontSize: 11, color: Colors.textSecondary, textAlign: 'center' }}>ใส่จำนวนเหรียญ/ธนบัตรแต่ละประเภท</Text>
            <CashCountForm value={shiftOpenAmt} onChange={setShiftOpenAmt} />
            <TouchableOpacity style={{ backgroundColor: WebColors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }} onPress={() => { shift.openShift({ posId: 'pos-001', posName: 'POS 1', cashierName: 'แคชเชียร์', openingAmount: parseInt(shiftOpenAmt) || 0 }); setShowOpenShift(false); }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>เปิดกะ (฿{(parseInt(shiftOpenAmt) || 0).toLocaleString()})</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Tab bar ── */}
      <View style={s.tabBar}>
        {/* ── ปุ่มออก Kiosk (ประตู) ── */}
        {onExit && (
          <TouchableOpacity
            style={s.exitKioskBtn}
            onPress={onExit}
            activeOpacity={0.8}
          >
            <Ionicons name="exit-outline" size={18} color="#fff" />
          </TouchableOpacity>
        )}
        {/* ── ปุ่มเต็มจอ ── */}
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
            onPress={() => {
              const el = document.documentElement;
              if (!document.fullscreenElement) { el.requestFullscreen?.(); }
              else { document.exitFullscreen?.(); }
            }}
          >
            <Ionicons name="expand-outline" size={16} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.tabBtn, posTab === 'pos' && s.tabBtnActive]}
          onPress={() => setPosTab('pos')}
        >
          <Ionicons name="cart-outline" size={15} color={posTab === 'pos' ? WebColors.primary : WebColors.textSecondary} />
          <Text style={[s.tabBtnText, posTab === 'pos' && s.tabBtnTextActive]}>ขายสินค้า</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, posTab === 'invoice' && s.tabBtnActive]}
          onPress={() => setPosTab('invoice')}
        >
          <Ionicons name="receipt-outline" size={15} color={posTab === 'invoice' ? WebColors.primary : WebColors.textSecondary} />
          <Text style={[s.tabBtnText, posTab === 'invoice' && s.tabBtnTextActive]}>ใบกำกับ / บิลย้อนหลัง</Text>
          {invoices.filter(i => i.status === 'paid').length > 0 && (
            <View style={s.tabBadge}>
              <Text style={s.tabBadgeText}>{invoices.filter(i => i.status === 'paid').length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ปุ่มพักบิล (รวมปุ่มเดียว) */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: holdBills.length > 0 ? '#EDE9FE' : '#F3F4F6', borderWidth: 1, borderColor: holdBills.length > 0 ? '#7C3AED' : '#E5E7EB' }}
          onPress={() => {
            if (holdBills.length > 0) {
              setShowHoldList(true);
            } else if (items.length > 0) {
              holdBill(); logAction('POS', 'พักบิล', `พักบิล ${items.length} รายการ ฿${grandTotal.toLocaleString()}`);
            }
          }}
        >
          <Ionicons name="layers-outline" size={14} color={holdBills.length > 0 ? '#7C3AED' : '#6B7280'} />
          <Text style={{ fontSize: 11, color: holdBills.length > 0 ? '#7C3AED' : '#6B7280', fontWeight: '600' }}>
            {holdBills.length > 0 ? `พักบิล (${holdBills.length})` : 'พักบิล'}
          </Text>
        </TouchableOpacity>

        {/* Shift buttons */}
        <View style={{ flexDirection: 'row', marginLeft: 'auto', gap: 6, alignItems: 'center' }}>
          {shift.isShiftOpen() && (
            <>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: '#FEF3C7' }} onPress={() => setShowCashMove(true)}>
                <Ionicons name="swap-vertical" size={12} color="#D97706" />
                <Text style={{ fontSize: 10, color: '#D97706', fontWeight: '600' }}>เงินเข้า/ออก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: '#FEE2E2' }} onPress={() => setShowCloseShift(true)}>
                <Ionicons name="lock-closed" size={12} color="#DC2626" />
                <Text style={{ fontSize: 10, color: '#DC2626', fontWeight: '600' }}>ปิดกะ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ── ปิดกะ Modal ── */}
      <Modal visible={showCloseShift} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 40 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 420, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.text, textAlign: 'center' }}>ปิดกะ — นับเงินในลิ้นชัก</Text>
            <View style={{ backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, gap: 4 }}>
              <Text style={{ fontSize: 11, color: '#16A34A' }}>เงินตั้งต้น: ฿{shift.currentShift?.openingAmount.toLocaleString()}</Text>
              <Text style={{ fontSize: 11, color: '#16A34A' }}>ยอดขายเงินสด: ฿{shift.currentShift?.cashSalesTotal.toLocaleString()}</Text>
              <Text style={{ fontSize: 11, color: '#16A34A' }}>เงินเข้า/ออก: {shift.currentShift?.movements.length} รายการ</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#16A34A' }}>คาดหวังในลิ้นชัก: ฿{shift.getExpectedCash().toLocaleString()}</Text>
            </View>
            <Text style={{ fontSize: 11, color: Colors.textSecondary }}>นับเงินจริงในลิ้นชัก:</Text>
            <CashCountForm value={shiftCloseAmt} onChange={setShiftCloseAmt} />
            {shiftCloseAmt && parseInt(shiftCloseAmt) !== shift.getExpectedCash() && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, color: (parseInt(shiftCloseAmt) - shift.getExpectedCash()) >= 0 ? '#16A34A' : '#DC2626', textAlign: 'center', fontWeight: '700' }}>
                  ผลต่าง: ฿{((parseInt(shiftCloseAmt) || 0) - shift.getExpectedCash()).toLocaleString()} {(parseInt(shiftCloseAmt) || 0) < shift.getExpectedCash() ? '(ขาด)' : '(เกิน)'}
                </Text>
                <TextInput style={{ borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, backgroundColor: '#FEF2F2' }} value={cashMoveReason} onChangeText={setCashMoveReason} placeholder="หมายเหตุ (บังคับ ถ้าเงินไม่ตรง)" placeholderTextColor="#9CA3AF" />
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 4 }}>
              <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6' }} onPress={() => { setShowCloseShift(false); setShiftCloseAmt(''); setCashMoveReason(''); }}>
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#DC2626' }} onPress={() => {
                const amt = parseInt(shiftCloseAmt) || 0;
                if (amt !== shift.getExpectedCash() && !cashMoveReason.trim()) { alert('กรุณาใส่หมายเหตุเมื่อเงินไม่ตรง'); return; }
                shift.closeShift(amt);
                setShowCloseShift(false); setShiftCloseAmt(''); setCashMoveReason('');
                alert(`ปิดกะเรียบร้อย!\nนับได้: ฿${amt.toLocaleString()}\nคาดหวัง: ฿${shift.getExpectedCash().toLocaleString()}`);
              }}>
                <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>ปิดกะ</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── รายการบิลพัก Modal ── */}
      <Modal visible={showHoldList} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 440, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>บิลพักทั้งหมด ({holdBills.length})</Text>
              <TouchableOpacity onPress={() => setShowHoldList(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {items.length > 0 && (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, backgroundColor: '#EDE9FE', marginBottom: 12 }}
                onPress={() => { holdBill(); logAction('POS', 'พักบิล', `พักบิล ${items.length} รายการ`); }}
              >
                <Ionicons name="add-circle" size={16} color="#7C3AED" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#7C3AED' }}>พักบิลปัจจุบัน ({items.length} รายการ, ฿{grandTotal.toLocaleString()})</Text>
              </TouchableOpacity>
            )}

            <ScrollView style={{ maxHeight: 320 }}>
              {holdBills.map((bill, idx) => {
                const total = bill.items.reduce((s, it) => s + it.subtotal, 0);
                return (
                  <View key={bill.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: idx % 2 === 0 ? '#F8FAFC' : '#fff', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 6, gap: 10 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#7C3AED20', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#7C3AED' }}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>{bill.items.length} รายการ · ฿{total.toLocaleString()}</Text>
                      <Text style={{ fontSize: 10, color: '#94A3B8' }}>{bill.remark || `บิลพัก #${idx + 1}`}</Text>
                    </View>
                    <TouchableOpacity
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#7C3AED' }}
                      onPress={() => {
                        if (items.length > 0) holdBill();
                        recallBill(bill.id);
                        setShowHoldList(false);
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>เรียกคืน</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { useCartStore.getState().deleteHoldBill(bill.id); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
              {holdBills.length === 0 && (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Ionicons name="layers-outline" size={32} color="#CBD5E1" />
                  <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>ไม่มีบิลพัก</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── เงินเข้า/ออก Modal ── */}
      <Modal visible={showCashMove} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 360, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.text, textAlign: 'center' }}>เงินเข้า/ออกลิ้นชัก</Text>
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: cashMoveType === 'in' ? '#DCFCE7' : '#F3F4F6', alignItems: 'center' }} onPress={() => setCashMoveType('in')}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: cashMoveType === 'in' ? '#16A34A' : '#6B7280' }}>+ นำเงินเข้า</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: cashMoveType === 'out' ? '#FEE2E2' : '#F3F4F6', alignItems: 'center' }} onPress={() => setCashMoveType('out')}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: cashMoveType === 'out' ? '#DC2626' : '#6B7280' }}>- นำเงินออก</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, textAlign: 'center' }} value={cashMoveAmt} onChangeText={setCashMoveAmt} keyboardType="numeric" placeholder="จำนวนเงิน" />
            <TextInput style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 }} value={cashMoveReason} onChangeText={setCashMoveReason} placeholder="หมายเหตุ (เช่น ทอนเงินลูกค้า, ฝากธนาคาร)" />
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
              <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6' }} onPress={() => { setShowCashMove(false); setCashMoveAmt(''); setCashMoveReason(''); }}>
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: WebColors.primary }} onPress={() => { shift.addCashMovement(cashMoveType, parseInt(cashMoveAmt) || 0, cashMoveReason || (cashMoveType === 'in' ? 'นำเงินเข้า' : 'นำเงินออก')); setShowCashMove(false); setCashMoveAmt(''); setCashMoveReason(''); }}>
                <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {posTab === 'invoice' && (
        <View style={s.invRoot}>
          {/* Toolbar */}
          <View style={s.invToolbar}>
            <View style={s.invSearch}>
              <Ionicons name="search-outline" size={14} color={WebColors.textSecondary} />
              <TextInput
                style={s.invSearchInput}
                placeholder="ค้นหาเลขบิล, แคชเชียร์, ประเภทชำระ..."
                placeholderTextColor={WebColors.textDisabled}
                value={invSearch} onChangeText={setInvSearch}
              />
            </View>
            {/* Filter tabs */}
            <View style={s.invFilters}>
              {([
                { key: 'all',       label: 'ทั้งหมด'      },
                { key: 'paid',      label: 'สำเร็จ'        },
                { key: 'full_tax',  label: 'ใบกำกับภาษี'  },
                { key: 'void_note', label: 'ใบยกเลิก'      },
                { key: 'cancelled', label: 'ยกเลิก'        },
                { key: 'topup',     label: 'เติมเงิน'      },
              ] as const).map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[s.invFilterBtn, invFilter === f.key && s.invFilterBtnActive]}
                  onPress={() => setInvFilter(f.key)}
                >
                  <Text style={[s.invFilterText, invFilter === f.key && s.invFilterTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* KPI row */}
          <View style={s.invKpiRow}>
            {[
              { label: 'บิลทั้งหมด',     value: invoices.length,                                                                    color: WebColors.primary, icon: 'receipt-outline'          },
              { label: 'สำเร็จ',          value: invoices.filter(i => i.status === 'paid').length,                                   color: WebColors.success, icon: 'checkmark-circle-outline'  },
              { label: 'ใบกำกับภาษี',    value: invoices.filter(i => i.status === 'full_tax').length,                               color: '#7C3AED',         icon: 'document-text-outline'     },
              { label: 'ยอดรวมวันนี้',   value: `฿${fmt(invoices.filter(i => i.status === 'paid' || i.status === 'full_tax').reduce((s, i) => s + i.grand, 0))}`, color: WebColors.primary, icon: 'cash-outline' },
            ].map((k, i) => (
              <View key={i} style={s.invKpiCard}>
                <Ionicons name={k.icon as any} size={20} color={k.color + '80'} />
                <View>
                  <Text style={s.invKpiLabel}>{k.label}</Text>
                  <Text style={[s.invKpiValue, { color: k.color }]}>{k.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Table */}
          <View style={s.invTable}>
            <View style={s.invThead}>
              {['เลขบิล', 'วันที่/เวลา', 'แคชเชียร์', 'ชำระ', 'สมาชิก', 'ยอดรวม/สถานะ', 'จัดการ'].map((h, i) => (
                <Text key={i} style={[s.invTh, i === 0 && { flex: 1.4 }, i === 5 && { textAlign: 'right' }]}>{h}</Text>
              ))}
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredInv.length === 0 ? (
                <View style={s.invEmpty}>
                  <Ionicons name="receipt-outline" size={40} color={WebColors.border} />
                  <Text style={s.invEmptyText}>ไม่พบบิล</Text>
                </View>
              ) : invFilter === 'topup' ? (
                <TopUpPanel />
              ) : (
                filteredInv.map((inv, idx) => {
                  const isPaid      = inv.status === 'paid';
                  const isVoid      = inv.status === 'void_note';
                  const isFullTax   = inv.status === 'full_tax';
                  const isCancelled = inv.status === 'cancelled';

                  const stBg    = isPaid ? '#D1FAE5' : isVoid ? '#FEF3C7' : isFullTax ? '#EDE9FE' : '#FEE2E2';
                  const stDot   = isPaid ? '#16A34A' : isVoid ? '#F59E0B' : isFullTax ? '#7C3AED' : WebColors.danger;
                  const stLabel = isPaid ? 'สำเร็จ' : isVoid ? 'ใบยกเลิก' : isFullTax ? 'ใบกำกับภาษี' : 'ยกเลิก';

                  return (
                    <View
                      key={inv.id}
                      style={[
                        s.invTr,
                        idx % 2 === 1 && s.invTrAlt,
                        isVoid     && { backgroundColor: '#FFFBEB' },
                        isFullTax  && { backgroundColor: '#F5F3FF' },
                      ]}
                    >
                      {/* เลขบิล */}
                      <View style={[s.invTdCol, { flex: 1.4 }]}>
                        <Ionicons
                          name={isVoid ? 'close-circle-outline' : isFullTax ? 'document-text-outline' : 'receipt-outline'}
                          size={13}
                          color={isVoid ? '#F59E0B' : isFullTax ? '#7C3AED' : WebColors.primary}
                        />
                        <View>
                          <Text style={[s.invBillNo,
                            isVoid    && { color: '#B45309' },
                            isFullTax && { color: '#7C3AED' },
                          ]}>
                            {inv.billNo}
                          </Text>
                          {(isVoid || isFullTax) && inv.refBillNo && (
                            <Text style={{ fontSize: 12, color: isFullTax ? '#7C3AED' : '#B45309' }}>
                              {isFullTax ? '📎 อ้างอิง: ' : '↩ ยกเลิก: '}{inv.refBillNo}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={s.invTdCol}>
                        <Text style={s.invTdBold}>{inv.date}</Text>
                        <Text style={s.invTdSub}>{inv.time} น.</Text>
                      </View>
                      <Text style={s.invTd}>{inv.cashier}</Text>
                      <View style={s.invTdCol}>
                        <Ionicons name={
                          inv.payMethod === 'เงินสด' ? 'cash-outline'
                          : inv.payMethod === 'QR Code' ? 'qr-code-outline'
                          : 'phone-portrait-outline'
                        } size={13} color={WebColors.textSecondary} />
                        <Text style={s.invTd}>{inv.payMethod}</Text>
                      </View>
                      {/* สมาชิก */}
                      <Text style={[s.invTd, { fontSize: 11 }]}>{(inv as any).memberName || '—'}</Text>
                      <Text style={[
                        s.invTd,
                        { textAlign: 'right', fontWeight: '700' },
                        isVoid     ? { color: '#B45309' }
                        : isFullTax ? { color: '#7C3AED' }
                        : { color: WebColors.primary },
                      ]}>
                        {isVoid ? '-' : ''}฿{fmt(Math.abs(inv.grand))}
                      </Text>
                      <View style={s.invTd}>
                        <View style={[s.statusBadge, { backgroundColor: stBg }]}>
                          <View style={[s.statusDot, { backgroundColor: stDot }]} />
                          <Text style={[s.statusText, { color: stDot }]}>{stLabel}</Text>
                        </View>
                      </View>
                      <View style={[s.invTd, { flexDirection: 'row', gap: 4 }]}>
                        <TouchableOpacity
                          style={s.invActionBtn}
                          onPress={() => setSelectedInv(inv)}
                        >
                          <Ionicons name="eye-outline" size={13} color={WebColors.primary} />
                        </TouchableOpacity>
                        {isPaid && (
                          <TouchableOpacity
                            style={[s.invActionBtn, { backgroundColor: '#FEE2E2' }]}
                            onPress={() => { setCancelTarget(inv); setShowCancelModal(true); setCancelReason(''); }}
                          >
                            <Ionicons name="close-circle-outline" size={13} color={WebColors.danger} />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={s.invActionBtn}>
                          <Ionicons name="print-outline" size={13} color={WebColors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* ── POS content ── */}
      {posTab === 'pos' && (<>
    <View style={s.root}>
      {/* ── Left: Product area ── */}
      <View style={s.left} onLayout={e => setGridWidth(e.nativeEvent.layout.width)}>
        {/* Search + view toggle */}
        <View style={s.searchRow}>
          <View style={[s.searchBar, scanFlash !== null && { borderColor: scanFlash.startsWith('✅') ? '#16A34A' : '#EF4444', borderWidth: 2 }]}>
            <Ionicons
              name="barcode-outline"
              size={17}
              color={scanFlash !== null ? (scanFlash.startsWith('✅') ? '#16A34A' : '#EF4444') : WebColors.textSecondary}
            />
            <TextInput
              ref={searchRef}
              style={s.searchInput}
              placeholder="สแกนบาร์โค้ด หรือพิมพ์ชื่อสินค้า..."
              placeholderTextColor={WebColors.textDisabled}
              value={search}
              onChangeText={v => {
                setSearch(v);
                setScanFlash(null);
              }}
              onSubmitEditing={e => handleBarcodeSubmit(e.nativeEvent.text)}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(''); searchRef.current?.focus(); }}>
                <Ionicons name="close-circle" size={16} color={WebColors.textDisabled} />
              </TouchableOpacity>
            )}
          </View>
          <View style={s.viewToggle}>
            <TouchableOpacity style={[s.viewBtn, gridView && s.viewBtnActive]} onPress={() => setGridView(true)}>
              <Ionicons name="grid-outline" size={15} color={gridView ? WebColors.primary : WebColors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.viewBtn, !gridView && s.viewBtnActive]} onPress={() => setGridView(false)}>
              <Ionicons name="list-outline" size={15} color={!gridView ? WebColors.primary : WebColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan flash banner */}
        {scanFlash !== null && (
          <View style={[s.scanFlash, { backgroundColor: scanFlash.startsWith('✅') ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[s.scanFlashText, { color: scanFlash.startsWith('✅') ? '#15803D' : '#DC2626' }]}>
              {scanFlash}
            </Text>
          </View>
        )}

        {/* Category tabs */}
        <View style={s.catRow}>
          {CATS.map(c => (
            <TouchableOpacity key={c} style={[s.catChip, cat === c && s.catChipActive]} onPress={() => setCat(c)}>
              <Text style={[s.catText, cat === c && s.catTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Product grid — custom 5-col grid ทุกการ์ดกว้างเท่ากัน แถวไม่เต็มเว้นว่าง */}
        {gridView ? (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {filtered.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="search-outline" size={40} color={WebColors.border} />
                <Text style={s.emptyText}>ไม่พบสินค้า</Text>
              </View>
            ) : (
              <View style={s.grid5Wrap}>
                {filtered.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[s.productCard, { width: cardWidth }, p.stockQty === 0 && { opacity: 0.4 }]}
                    onPress={() => {
                      if (p.stockQty === 0) return;
                      const baseId = p.id.split('_')[0];
                      const master = masterProducts.find(m => m.id === baseId);
                      if (master && master.uoms.length > 1) {
                        setUomPickerProduct(p);
                      } else {
                        handleProductTap(p);
                      }
                    }}
                    disabled={p.stockQty === 0}
                    activeOpacity={0.75}
                  >
                    <View style={s.productImg}>
                      <Ionicons name="cube-outline" size={28} color={WebColors.primary} />
                      {p.stockQty === 0 && (
                        <View style={s.outBadge}><Text style={s.outBadgeText}>หมด</Text></View>
                      )}
                      {p.stockQty > 0 && p.stockQty <= 5 && (
                        <View style={s.lowBadge}><Text style={s.lowBadgeText}>{p.stockQty}</Text></View>
                      )}
                    </View>
                    <View style={s.productInfo}>
                      <Text style={s.productName} numberOfLines={2}>{p.name}</Text>
                      <Text style={s.productCat} numberOfLines={1}>{p.category}</Text>
                      <View style={s.productBottom}>
                        <Text style={s.productPrice}>฿{p.price}</Text>
                        <Text style={[s.productStock, p.stockQty <= 5 && { color: WebColors.danger }]}>
                          {p.stockQty > 0 ? p.stockQty : ''}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={p => p.id}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            renderItem={({ item: p }) => (
              <TouchableOpacity
                style={[s.listRow, p.stockQty === 0 && { opacity: 0.4 }]}
                onPress={() => {
                  if (p.stockQty === 0) return;
                  const baseId = p.id.split('_')[0];
                  const master = masterProducts.find(m => m.id === baseId);
                  if (master && master.uoms.length > 1) {
                    setUomPickerProduct(p);
                  } else {
                    handleProductTap(p);
                  }
                }}
                disabled={p.stockQty === 0}
              >
                <View style={s.listIcon}>
                  <Ionicons name="cube-outline" size={20} color={WebColors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.listName} numberOfLines={1}>{p.name}</Text>
                  <Text style={s.listCat}>{p.category} · {p.unit}</Text>
                </View>
                <Text style={s.listPrice}>฿{p.price}</Text>
                <Text style={[s.listStock, p.stockQty <= 5 && { color: WebColors.danger }]}>
                  {p.stockQty} ชิ้น
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="search-outline" size={40} color={WebColors.border} />
                <Text style={s.emptyText}>ไม่พบสินค้า</Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── Right: Cart ── */}
      <View style={s.cart}>
        {/* Cart header */}
        <View style={s.cartHeader}>
          <View style={s.cartHeaderLeft}>
            <Ionicons name="cart-outline" size={18} color={WebColors.text} />
            <Text style={s.cartTitle}>ตะกร้าสินค้า</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {/* จอที่ 2 toggle */}
            <TouchableOpacity
              style={[s.display2Btn, showDisplay && s.display2BtnActive]}
              onPress={() => setShowDisplay(!showDisplay)}
            >
              <Ionicons name="tv-outline" size={15} color={showDisplay ? WebColors.white : WebColors.primary} />
              <Text style={[s.display2BtnText, showDisplay && { color: WebColors.white }]}>จอ 2</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearCart}>
              <Ionicons name="trash-outline" size={18} color={WebColors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Member Selection Badge ── */}
        <View style={s.crmRow}>
          {selectedMember ? (
            <View style={s.memberBadge}>
              <Ionicons name="person-circle" size={16} color={WebColors.primary} />
              <Text style={s.memberBadgeName} numberOfLines={1}>{selectedMember.name}</Text>
              <View style={[s.levelBadge, { backgroundColor: selectedMember.level === 'platinum' ? '#7C3AED' : selectedMember.level === 'gold' ? '#F59E0B' : '#6B7280' }]}>
                <Text style={s.levelBadgeText}>{selectedMember.level}</Text>
              </View>
              <Text style={s.memberPoints}>{selectedMember.pointBalance} pts</Text>
              <Text style={{ fontSize: 13, color: Colors.textSecondary }}>฿{selectedMember.totalSpent.toLocaleString()}</Text>
              <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '600' }}>💰{getWalletBalance(selectedMember.id).toLocaleString()}</Text>
              <TouchableOpacity onPress={() => { selectMember(null); setPointDiscount(0); setPointsToUse(''); }}>
                <Ionicons name="close-circle" size={16} color={WebColors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.memberSelectBtn} onPress={() => { setShowMemberModal(true); setMemberSearch(''); }}>
              <Ionicons name="people-outline" size={14} color={WebColors.primary} />
              <Text style={s.memberSelectBtnText}>เลือกสมาชิก</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Items */}
        {items.length === 0 ? (
          <View style={s.cartEmpty}>
            <Ionicons name="cart-outline" size={48} color={WebColors.border} />
            <Text style={s.emptyText}>ไม่มีสินค้าในตะกร้า</Text>
          </View>
        ) : (
          <FlatList
            data={items} style={{ flex: 1 }} keyExtractor={i => i.product.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <CartItemRow
                item={item}
                onQtyChange={updateQty}
                onRemove={removeItem}
                onDiscount={(id) => {
                  setDiscModal(id);
                  setDiscModalType(itemDiscTypes[id] ?? 'amount');
                  setDiscInput(String(itemDiscounts[id] ?? 0));
                }}
                onChangePrice={(id) => { setPriceModal(id); setPriceInput(String(customPrices[id] ?? items.find(i => i.product.id === id)?.unitPrice ?? 0)); }}
                itemDiscounts={itemDiscounts}
                itemDiscTypes={itemDiscTypes}
                customPrices={customPrices}
              />
            )}
          />
        )}

        {/* Summary */}
        <View style={s.summary}>
          <View style={s.sumRow}><Text style={s.sumLabel}>ยอดรวม</Text><Text style={s.sumVal}>฿{fmt(subtotal)}</Text></View>
          <View style={s.sumRow}>
            <TouchableOpacity onPress={() => { setBillDiscModal(true); setBillDiscInput(String(billDiscount)); }}>
              <Text style={[s.sumLabel, { color: WebColors.primary, textDecorationLine: 'underline' }]}>
                ส่วนลด{billDiscType === 'percent' ? ` (${billDiscount}%)` : ''}
              </Text>
            </TouchableOpacity>
            <Text style={[s.sumVal, { color: WebColors.danger }]}>-฿{fmt(billDiscAmt)}</Text>
          </View>
          {couponDiscount > 0 && (
            <View style={s.sumRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="pricetag" size={12} color="#7C3AED" />
                <Text style={[s.sumLabel, { color: '#7C3AED' }]}>คูปอง ({couponPromoName})</Text>
              </View>
              <Text style={[s.sumVal, { color: '#7C3AED' }]}>-฿{fmt(couponDiscount)}</Text>
            </View>
          )}
          {pointDiscount > 0 && (
            <View style={s.sumRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={[s.sumLabel, { color: '#F59E0B' }]}>แลกคะแนน</Text>
              </View>
              <Text style={[s.sumVal, { color: '#F59E0B' }]}>-฿{fmt(pointDiscount)}</Text>
            </View>
          )}
          <View style={s.sumRow}><Text style={s.sumLabel}>VAT 7%</Text><Text style={s.sumVal}>฿{fmt(vat)}</Text></View>
          <View style={[s.sumRow, s.sumTotalRow]}>
            <Text style={s.sumTotalLabel}>รวมทั้งสิ้น</Text>
            <Text style={s.sumTotalVal}>฿{fmt(grandTotal)}</Text>
          </View>
        </View>

        {/* ── Coupon Input ── */}
        <View style={s.crmRow}>
          <View style={s.couponRow}>
            <TextInput
              style={s.couponInput}
              value={couponCode}
              onChangeText={(v) => { setCouponCode(v); setCouponError(''); }}
              placeholder="รหัสคูปอง"
              placeholderTextColor={WebColors.textDisabled}
            />
            <TouchableOpacity
              style={[s.couponBtn, !couponCode.trim() && { opacity: 0.5 }]}
              onPress={handleValidateCoupon}
              disabled={!couponCode.trim()}
            >
              <Text style={s.couponBtnText}>ใช้คูปอง</Text>
            </TouchableOpacity>
          </View>
          {couponError ? (
            <View style={s.couponErrRow}>
              <Ionicons name="alert-circle" size={12} color={WebColors.danger} />
              <Text style={s.couponErrText}>{couponError}</Text>
            </View>
          ) : null}
          {couponDiscount > 0 && (
            <View style={s.couponSuccessRow}>
              <Ionicons name="checkmark-circle" size={12} color={WebColors.success} />
              <Text style={s.couponSuccessText}>ลด ฿{fmt(couponDiscount)} ({couponPromoName})</Text>
              <TouchableOpacity onPress={() => { setCouponDiscount(0); setCouponCode(''); setCouponPromoName(''); }}>
                <Ionicons name="close-circle" size={14} color={WebColors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          {/* Point Redemption + Wallet Top-up Buttons */}
          {selectedMember && pointDiscount === 0 && (
            <>
              <TouchableOpacity style={s.pointRedeemBtn} onPress={() => { setShowPointRedeem(true); setPointsToUse(''); }}>
                <Ionicons name="star-outline" size={14} color="#F59E0B" />
                <Text style={s.pointRedeemBtnText}>ใช้คะแนน ({selectedMember.pointBalance} pts)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.pointRedeemBtn, { backgroundColor: '#DCFCE7', borderColor: '#16A34A' }]} onPress={() => { const cartItems = useCartStore.getState().items; if (cartItems.length > 0) { useCartStore.getState().holdBill('เติมเงิน Wallet'); } setShowTopUpModal(true); }}>
                <Ionicons name="wallet-outline" size={14} color="#16A34A" />
                <Text style={[s.pointRedeemBtnText, { color: '#16A34A' }]}>เติมเงิน Wallet (฿{getWalletBalance(selectedMember.id).toLocaleString()})</Text>
              </TouchableOpacity>
            </>
          )}
          {pointDiscount > 0 && (
            <View style={s.couponSuccessRow}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={[s.couponSuccessText, { color: '#F59E0B' }]}>ใช้ {pointsToUse} คะแนน = ลด ฿{fmt(pointDiscount)}</Text>
              <TouchableOpacity onPress={() => { setPointDiscount(0); setPointsToUse(''); }}>
                <Ionicons name="close-circle" size={14} color={WebColors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Pay buttons */}
        <View style={s.payArea}>
          <View style={s.payRow}>
            {payTypes.map(pt => (
              <TouchableOpacity
                key={pt.id}
                style={[s.payBtn, { backgroundColor: pt.color }]}
                onPress={() => { setPayMethod(pt.id); setPayModal(true); setReceivedAmt(''); setDisplayMode('payment_pending'); useCustomerDisplayStore.getState().broadcastDisplay({ mode: 'payment_pending', payMethodLabel: pt.label, syncedGrand: grandTotal }); }}
                disabled={items.length === 0}
              >
                <Ionicons name={pt.icon as any} size={15} color="#fff" />
                <Text style={s.payBtnText}>{pt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Settings + Hold */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          </View>
        </View>
      </View>

      {/* ── Item Discount Modal ── */}
      <Modal visible={!!discModal} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={[m.box, { width: 360 }]}>
            <Text style={m.title}>ส่วนลดรายการสินค้า</Text>
            <Text style={m.sub} numberOfLines={1}>{items.find(i => i.product.id === discModal)?.product.name}</Text>
            <View style={m.typeToggle}>
              <TouchableOpacity style={[m.typeBtn, discModalType === 'amount' && m.typeBtnActive]} onPress={() => setDiscModalType('amount')}>
                <Text style={[m.typeBtnText, discModalType === 'amount' && { color: '#fff' }]}>จำนวนเงิน (฿)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.typeBtn, discModalType === 'percent' && m.typeBtnActive]} onPress={() => setDiscModalType('percent')}>
                <Text style={[m.typeBtnText, discModalType === 'percent' && { color: '#fff' }]}>เปอร์เซ็นต์ (%)</Text>
              </TouchableOpacity>
            </View>
            {/* Display */}
            <View style={m.displayBox}>
              <Text style={m.displayVal}>{discModalType === 'amount' ? '฿' : ''}{discInput || '0'}{discModalType === 'percent' ? ' %' : ''}</Text>
              {discModalType === 'percent' && parseFloat(discInput) > 0 && discModal && (() => {
                const price = customPrices[discModal] ?? items.find(i => i.product.id === discModal)?.unitPrice ?? 0;
                return <Text style={m.calcText}>= ลด ฿{fmt(price * (parseFloat(discInput) / 100))} ต่อชิ้น</Text>;
              })()}
            </View>
            <NumPad value={discInput || '0'} onChange={v => setDiscInput(v === '0' ? '' : v)} />
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setDiscModal(null)}>
                <Text style={m.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={m.okBtn} onPress={() => {
                if (discModal) {
                  setItemDiscounts(prev => ({ ...prev, [discModal]: parseFloat(discInput) || 0 }));
                  setItemDiscTypes(prev => ({ ...prev, [discModal]: discModalType }));
                }
                setDiscModal(null);
              }}>
                <Text style={m.okText}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Change Price Modal ── */}
      <Modal visible={!!priceModal} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={[m.box, { width: 360 }]}>
            <Text style={m.title}>เปลี่ยนราคา</Text>
            <Text style={m.sub}>{items.find(i => i.product.id === priceModal)?.product.name}</Text>
            <View style={m.displayBox}>
              <Text style={m.displayVal}>฿ {priceInput || '0'}</Text>
            </View>
            <NumPad value={priceInput || '0'} onChange={v => setPriceInput(v === '0' ? '' : v)} />
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setPriceModal(null)}><Text style={m.cancelText}>ยกเลิก</Text></TouchableOpacity>
              <TouchableOpacity style={m.okBtn} onPress={() => {
                if (priceModal) { setCustomPrices(prev => ({ ...prev, [priceModal]: parseFloat(priceInput) || 0 })); }
                setPriceModal(null);
              }}><Text style={m.okText}>ตกลง</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Bill Discount Modal ── */}
      <Modal visible={billDiscModal} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={[m.box, { width: 360 }]}>
            <Text style={m.title}>ส่วนลดท้ายบิล</Text>
            <View style={m.typeToggle}>
              <TouchableOpacity style={[m.typeBtn, billDiscType === 'amount' && m.typeBtnActive]} onPress={() => setBillDiscType('amount')}>
                <Text style={[m.typeBtnText, billDiscType === 'amount' && { color: '#fff' }]}>จำนวนเงิน (฿)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.typeBtn, billDiscType === 'percent' && m.typeBtnActive]} onPress={() => setBillDiscType('percent')}>
                <Text style={[m.typeBtnText, billDiscType === 'percent' && { color: '#fff' }]}>เปอร์เซ็นต์ (%)</Text>
              </TouchableOpacity>
            </View>
            <View style={m.displayBox}>
              <Text style={m.displayVal}>{billDiscType === 'amount' ? '฿' : ''}{billDiscInput || '0'}{billDiscType === 'percent' ? ' %' : ''}</Text>
              {billDiscType === 'percent' && parseFloat(billDiscInput) > 0 && (
                <Text style={m.calcText}>= ลด ฿{fmt(subtotal * (parseFloat(billDiscInput) / 100))}</Text>
              )}
            </View>
            <NumPad value={billDiscInput || '0'} onChange={v => setBillDiscInput(v === '0' ? '' : v)} />
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setBillDiscModal(false)}><Text style={m.cancelText}>ยกเลิก</Text></TouchableOpacity>
              <TouchableOpacity style={m.okBtn} onPress={() => { setBillDiscount(parseFloat(billDiscInput) || 0); setBillDiscModal(false); }}>
                <Text style={m.okText}>ใช้ส่วนลด</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Payment Modal ── */}
      <Modal visible={payModal} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={[m.box, { width: 420 }]}>
            <Text style={m.title}>ชำระเงิน</Text>
            <View style={m.totalBox}>
              <Text style={m.totalLabel}>ยอดที่ต้องชำระ</Text>
              <Text style={m.totalAmt}>฿{fmt(grandTotal)}</Text>
            </View>

            {/* Split payments list */}
            {splitPayments.length > 0 && (
              <View style={{ marginBottom: 8, gap: 4 }}>
                {splitPayments.map((sp, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: '600' }}>{sp.label}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#16A34A' }}>฿{sp.amount.toLocaleString()}</Text>
                      <TouchableOpacity onPress={() => setSplitPayments(prev => prev.filter((_, idx) => idx !== i))}>
                        <Ionicons name="close-circle" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary }}>ชำระแล้ว:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#16A34A' }}>฿{splitPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary }}>คงเหลือ:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: (grandTotal - splitPayments.reduce((s, p) => s + p.amount, 0)) <= 0 ? '#16A34A' : WebColors.primary }}>
                    ฿{Math.max(0, grandTotal - splitPayments.reduce((s, p) => s + p.amount, 0)).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {/* เพิ่มช่องทางชำระ */}
            <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 }}>
              {splitPayments.length === 0 ? 'เลือกวิธีชำระ:' : 'เพิ่มช่องทาง:'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {payTypes.map(pt => (
                <TouchableOpacity key={pt.id} style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 }, payMethod === pt.id ? { backgroundColor: pt.color + '18', borderColor: pt.color } : { borderColor: Colors.border }]} onPress={() => setPayMethod(pt.id)}>
                  <Ionicons name={pt.icon as any} size={13} color={pt.color} />
                  <Text style={{ fontSize: 11, color: pt.color, fontWeight: '600' }}>{pt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* จำนวนเงินสำหรับวิธีที่เลือก */}
            {payMethod && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 4 }}>จำนวนเงิน ({payTypes.find(p => p.id === payMethod)?.label}):</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[m.input, { flex: 1, marginBottom: 0 }]}
                    value={receivedAmt}
                    onChangeText={setReceivedAmt}
                    placeholder={`ใส่จำนวน (คงเหลือ ฿${Math.max(0, grandTotal - splitPayments.reduce((s, p) => s + p.amount, 0)).toLocaleString()})`}
                    placeholderTextColor={WebColors.textDisabled}
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: '#16A34A', paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center' }}
                    onPress={() => {
                      const amt = parseFloat(receivedAmt) || 0;
                      if (amt <= 0) return;
                      const label = payTypes.find(p => p.id === payMethod)?.label || payMethod;
                      setSplitPayments(prev => [...prev, { method: payMethod, label, amount: amt }]);
                      setReceivedAmt('');
                    }}
                  >
                    <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>+ เพิ่ม</Text>
                  </TouchableOpacity>
                </View>
                {/* Quick amounts */}
                {payMethod === 'cash' && (
                  <View style={[m.quickRow, { marginTop: 6 }]}>
                    {[20, 50, 100, 500, 1000].map(q => (
                      <TouchableOpacity key={q} style={m.quickBtn} onPress={() => setReceivedAmt(String(q))}>
                        <Text style={m.quickText}>฿{q}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={[m.quickBtn, { backgroundColor: WebColors.primaryLight }]} onPress={() => setReceivedAmt(String(Math.max(0, grandTotal - splitPayments.reduce((s, p) => s + p.amount, 0))))}>
                      <Text style={[m.quickText, { color: WebColors.primary }]}>เต็มจำนวน</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {payMethod === 'wallet' && selectedMember && (
                  <Text style={{ fontSize: 10, color: '#92400E', marginTop: 4 }}>💰 Wallet: ฿{getWalletBalance(selectedMember.id).toLocaleString()}</Text>
                )}
              </View>
            )}

            {/* เงินทอน (กรณีจ่ายเกิน) */}
            {splitPayments.reduce((s, p) => s + p.amount, 0) > grandTotal && (
              <View style={m.changeBox}>
                <Text style={m.changeLabel}>เงินทอน</Text>
                <Text style={m.changeAmt}>฿{fmt(splitPayments.reduce((s, p) => s + p.amount, 0) - grandTotal)}</Text>
              </View>
            )}

            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => { setPayModal(false); setSplitPayments([]); }}><Text style={m.cancelText}>ยกเลิก</Text></TouchableOpacity>
              <TouchableOpacity
                style={[m.okBtn, splitPayments.reduce((s, p) => s + p.amount, 0) < grandTotal && m.okBtnDisabled]}
                disabled={splitPayments.reduce((s, p) => s + p.amount, 0) < grandTotal}
                onPress={() => {
                  // ── สร้าง invoice สำหรับพิมพ์ ──
                  const now  = new Date();
                  const pad  = (n: number) => String(n).padStart(2, '0');
                  const thai = now.getFullYear() + 543;
                  const newInvoice = {
                    billNo:    `INV-${thai}-${String(invoices.length + 1).padStart(4,'0')}`,
                    date:      `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${thai}`,
                    time:      `${pad(now.getHours())}:${pad(now.getMinutes())}`,
                    cashier:   'แคชเชียร์',
                    payMethod: splitPayments.map(sp => sp.label).join(' + '),
                    items:     items.map(i => {
                      const usePrice = customPrices[i.product.id] ?? i.unitPrice;
                      const discVal  = itemDiscounts[i.product.id] ?? 0;
                      const dType    = itemDiscTypes[i.product.id] ?? 'amount';
                      const discAmt  = dType === 'percent' ? usePrice * (discVal / 100) : discVal;
                      return { name: i.product.name, qty: i.qty, unitPrice: usePrice, disc: discAmt, total: Math.max(0, usePrice - discAmt) * i.qty };
                    }),
                    subtotal: subtotal,
                    discount: billDiscAmt,
                    vat:      vat,
                    grand:    grandTotal,
                    status:   'paid' as const,
                    memberName: selectedMember?.name,
                    memberInfo: selectedMember ? {
                      name: selectedMember.name,
                      memberNo: selectedMember.memberNo,
                      pointBalance: selectedMember.pointBalance + Math.floor(grandTotal / pointConfig.earnRate),
                      walletBalance: getWalletBalance(selectedMember.id) - (payMethod === 'wallet' ? grandTotal : 0),
                      pointsEarned: Math.floor(grandTotal / pointConfig.earnRate),
                    } : undefined,
                  };

                  // ── ตรวจสอบ Wallet ก่อนดำเนินการ ──
                  const walletSplit = splitPayments.find(sp => sp.method === 'wallet');
                  if (walletSplit) {
                    if (!selectedMember) {
                      alert('กรุณาเลือกสมาชิกก่อนชำระผ่าน Wallet');
                      return;
                    }
                    const walletBal = getWalletBalance(selectedMember.id);
                    if (walletBal < walletSplit.amount) {
                      alert(`ยอดเงินใน Wallet ไม่เพียงพอ (คงเหลือ ฿${walletBal.toLocaleString()}, ต้องชำระ ฿${walletSplit.amount.toLocaleString()})`);
                      return;
                    }
                    walletPay(selectedMember.id, walletSplit.amount, newInvoice.billNo, 'แคชเชียร์');
                  }

                  // ── พิมพ์ PDF อัตโนมัติ (web) ──
                  if (Platform.OS === 'web') {
                    printReceipt80mm(newInvoice, POS_REG_NO ? 'tax_short' : 'receipt', '80mm');
                  }

                  // ── CRM: Earn points + apply coupon ──
                  if (selectedMember) {
                    earnPoints(selectedMember.id, grandTotal, newInvoice.billNo, 'แคชเชียร์');
                    if (pointDiscount > 0) {
                      redeemPoints(selectedMember.id, parseInt(pointsToUse) || 0, newInvoice.billNo, 'แคชเชียร์');
                    }
                  }
                  if (couponDiscount > 0 && couponCode) {
                    applyCoupon(couponCode, newInvoice.billNo, couponDiscount, selectedMember?.id);
                  }

                  // ── บันทึกลงประวัติขาย ──
                  const cashAmount = splitPayments.filter(sp => sp.method === 'cash').reduce((s, p) => s + p.amount, 0);
                  if (cashAmount > 0) shift.addCashSale(cashAmount);
                  shift.addBill();
                  logAction('POS', 'ขายสินค้า', `บิล ${newInvoice.billNo} ยอด ฿${grandTotal.toLocaleString()} ชำระ: ${splitPayments.map(sp => `${sp.label} ฿${sp.amount}`).join(', ')}`, { billNo: newInvoice.billNo, grandTotal, payments: splitPayments });
                  useSaleHistoryStore.getState().addSale({
                    id: `sale_${Date.now()}`,
                    saleNo: newInvoice.billNo,
                    items: items,
                    payments: splitPayments.map(sp => ({ method: sp.method, amount: sp.amount })) as Payment[],
                    discount: billDiscount > 0 ? { type: billDiscType, value: billDiscount } : null,
                    subtotal, discountTotal: billDiscAmt + couponDiscount + pointDiscount,
                    serviceCharge: 0, vatAmount: vat, grandTotal,
                    receivedAmount: splitPayments.reduce((s, p) => s + p.amount, 0),
                    changeAmount: Math.max(0, splitPayments.reduce((s, p) => s + p.amount, 0) - grandTotal),
                    cashierName: 'แคชเชียร์', posName: 'POS 1',
                    memberName: selectedMember?.name, pointsEarned: selectedMember ? Math.floor(grandTotal / pointConfig.earnRate) : 0,
                    status: 'completed', createdAt: new Date(),
                  });

                  setPayModal(false);
                  setSplitPayments([]);

                  // ── จอ 2: แสดง "ชำระเรียบร้อย" ──
                  setDisplayMode('payment_success');
                  useCustomerDisplayStore.getState().broadcastDisplay({ mode: 'payment_success', paidAmount: grandTotal, changeAmount: change });
                  // กลับไป idle หลัง 5 วินาที
                  setTimeout(() => {
                    setDisplayMode('idle');
                    useCustomerDisplayStore.getState().broadcastDisplay({ mode: 'idle' });
                  }, 5000);

                  clearCart();
                  setItemDiscounts({});
                  setCustomPrices({});
                  setBillDiscount(0);
                  setReceivedAmt('');
                  resetCrmState();
                }}
              >
                <Text style={m.okText}>ยืนยัน & พิมพ์บิล</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Settings Modal */}
      <PaymentSettingsModal
        visible={showPaySettings}
        payTypes={payTypes}
        onSave={setPayTypes}
        onClose={() => setShowPaySettings(false)}
      />

      {/* ── Customer Display Panel (จอที่ 2) ── */}
      <Modal visible={showDisplay} transparent animationType="slide">
        <View style={s.displayOverlay}>
          <View style={s.displayPanel}>
            {/* Header bar — เหลือแค่ชื่อ + ปุ่มเปิดหน้าต่างใหม่ + ปิด */}
            <View style={s.displayModeBar}>
              <Text style={s.displayModeTitle}>จอที่ 2 — Customer Display</Text>
              {/* ปุ่มเปิด URL แยก (สำหรับลาก window ไปจอ HDMI) */}
              {Platform.OS === 'web' && (
                <TouchableOpacity
                  style={[s.displayModeBtn, { backgroundColor: WebColors.primary, flexDirection: 'row', gap: 6, paddingHorizontal: 12 }]}
                  onPress={() => {
                    const w = (window as any).open(
                      window.location.href.split('?')[0] + '?display=1',
                      'CustomerDisplay',
                      'width=1280,height=720,menubar=no,toolbar=no,status=no,scrollbars=no'
                    );
                    if (w) w.focus();
                  }}
                >
                  <Ionicons name="tv-outline" size={14} color="#fff" />
                  <Text style={[s.displayModeBtnText, { color: '#fff' }]}>เปิดหน้าต่างแยก</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.displayCloseBtn} onPress={() => setShowDisplay(false)}>
                <Ionicons name="close" size={18} color={WebColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Display content */}
            <View style={s.displayContent}>
              <WebCustomerDisplayScreen
                mode={displayMode as any}
                embedded
                onClose={() => setShowDisplay(false)}
                discountOverride={billDiscAmt + items.reduce((s, i) => {
                  const price   = customPrices[i.product.id] ?? i.unitPrice;
                  const discVal = itemDiscounts[i.product.id] ?? 0;
                  const dType   = itemDiscTypes[i.product.id] ?? 'amount';
                  return s + (dType === 'percent' ? price * (discVal / 100) : discVal) * i.qty;
                }, 0)}
                grandOverride={grandTotal}
                displayItems={items.map(i => {
                  const usePrice = customPrices[i.product.id] ?? i.unitPrice;
                  const discVal  = itemDiscounts[i.product.id] ?? 0;
                  const dType    = itemDiscTypes[i.product.id] ?? 'amount';
                  const discAmt  = dType === 'percent' ? usePrice * (discVal / 100) : discVal;
                  const netPrice = Math.max(0, usePrice - discAmt);
                  return {
                    id:        i.product.id,
                    name:      i.product.name,
                    unitPrice: usePrice,
                    qty:       i.qty,
                    discAmt:   discAmt,
                    subtotal:  netPrice * i.qty,
                  };
                })}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>

      {/* ── Member Search Modal ── */}
      <Modal visible={showMemberModal} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={[m.box, { width: 520, maxHeight: 620 }]}>
            <Text style={m.title}>เลือกสมาชิก</Text>
            <View style={s.couponRow}>
              <TextInput
                style={[s.couponInput, { flex: 1 }]}
                value={memberSearch}
                onChangeText={setMemberSearch}
                placeholder="🔍 ค้นหาชื่อ / เบอร์โทร / เลขสมาชิก"
                placeholderTextColor={WebColors.textDisabled}
                autoFocus
              />
            </View>
            <ScrollView style={{ maxHeight: 440, marginTop: 8 }} showsVerticalScrollIndicator={false}>
              {memberSearchResults.length === 0 ? (
                <Text style={{ textAlign: 'center', color: WebColors.textSecondary, padding: 20 }}>ไม่พบสมาชิก</Text>
              ) : (
                memberSearchResults.map((mem: Member) => {
                  // คำนวณคูปองที่สมาชิกใช้ได้
                  const availableCoupons = usePromoStore.getState().promotions.filter(p =>
                    p.status === 'active' &&
                    (p.type === 'coupon' || p.couponCode) &&
                    (!p.applicableLevels || p.applicableLevels.length === 0 || p.applicableLevels.includes(mem.level)) &&
                    (!p.couponLimit || (p.couponUsed ?? 0) < p.couponLimit)
                  );
                  return (
                    <TouchableOpacity
                      key={mem.id}
                      style={s.memberListItem}
                      onPress={() => { selectMember(mem); setShowMemberModal(false); }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: WebColors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="person" size={18} color={WebColors.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={s.memberListName}>{mem.name}</Text>
                          <View style={[s.levelBadge, { backgroundColor: mem.level === 'platinum' ? '#7C3AED' : mem.level === 'gold' ? '#F59E0B' : mem.level === 'silver' ? '#6B7280' : Colors.textMuted }]}>
                            <Text style={s.levelBadgeText}>{mem.level}</Text>
                          </View>
                        </View>
                        <Text style={s.memberListSub}>{mem.phone} · {mem.memberNo}</Text>
                        {/* ข้อมูลเพิ่มเติม */}
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 3 }}>
                          <Text style={{ fontSize: 12, color: '#F59E0B' }}>⭐ {mem.pointBalance} แต้ม</Text>
                          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>💰 ซื้อสะสม ฿{mem.totalSpent.toLocaleString()}</Text>
                          {mem.lastPurchaseDate && (
                            <Text style={{ fontSize: 12, color: Colors.textMuted }}>📅 ซื้อล่าสุด {new Date(mem.lastPurchaseDate).toLocaleDateString('th-TH')}</Text>
                          )}
                        </View>
                        {/* คูปองที่ใช้ได้ */}
                        {availableCoupons.length > 0 && (
                          <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                            <Ionicons name="pricetag" size={10} color="#2E7D32" />
                            {availableCoupons.slice(0, 3).map(cp => (
                              <View key={cp.id} style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8 }}>
                                <Text style={{ fontSize: 12, color: '#2E7D32' }}>{cp.couponCode || cp.promoCode}</Text>
                              </View>
                            ))}
                            {availableCoupons.length > 3 && (
                              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>+{availableCoupons.length - 3} อื่นๆ</Text>
                            )}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            <TouchableOpacity style={m.cancelBtn} onPress={() => setShowMemberModal(false)}>
              <Text style={m.cancelText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Point Redemption Modal ── */}
      <Modal visible={showPointRedeem} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={[m.box, { width: 360 }]}>
            <Text style={m.title}>ใช้คะแนนแลกส่วนลด</Text>
            {selectedMember && (
              <>
                <Text style={m.sub}>คะแนนคงเหลือ: {selectedMember.pointBalance} คะแนน</Text>
                <Text style={{ fontSize: 13, color: WebColors.textSecondary, marginTop: -4, marginBottom: 8 }}>
                  อัตราแลก: 1 คะแนน = {pointConfig.redeemRate} บาท | ขั้นต่ำ {pointConfig.minRedeemPoints} คะแนน
                </Text>
                <TextInput
                  style={m.input}
                  value={pointsToUse}
                  onChangeText={setPointsToUse}
                  placeholder={`จำนวนคะแนน (สูงสุด ${selectedMember.pointBalance})`}
                  placeholderTextColor={WebColors.textDisabled}
                  keyboardType="number-pad"
                />
                {parseInt(pointsToUse) > 0 && (
                  <Text style={{ fontSize: 12, color: '#F59E0B', fontWeight: '600', marginTop: 4 }}>
                    = ส่วนลด ฿{fmt((parseInt(pointsToUse) || 0) * pointConfig.redeemRate)}
                  </Text>
                )}
              </>
            )}
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setShowPointRedeem(false)}>
                <Text style={m.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.okBtn, (!(parseInt(pointsToUse) > 0) || (parseInt(pointsToUse) > (selectedMember?.pointBalance ?? 0))) && m.okBtnDisabled]}
                disabled={!(parseInt(pointsToUse) > 0) || (parseInt(pointsToUse) > (selectedMember?.pointBalance ?? 0)) || (parseInt(pointsToUse) < pointConfig.minRedeemPoints)}
                onPress={handleApplyPoints}
              >
                <Text style={m.okText}>ยืนยัน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      </>)}  {/* end posTab === 'pos' */}

      {/* ── Invoice Detail Modal ── */}
      <Modal visible={!!selectedInv} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={[m.box, { width: 580, maxHeight: '92%' as any, padding: 0, overflow: 'hidden' as any }]}>

            {/* Header */}
            <View style={iv.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={iv.modalTitle}>{selectedInv?.billNo}</Text>
                <Text style={iv.modalSub}>
                  {selectedInv?.date}  {selectedInv?.time} น. • {selectedInv?.cashier}
                  {selectedInv?.refBillNo ? `  •  อ้างอิง: ${selectedInv.refBillNo}` : ''}
                </Text>
              </View>
              <View style={iv.modalBadges}>
                {/* Status badge */}
                {(() => {
                  const st = selectedInv?.status;
                  const cfg =
                    st === 'paid'      ? { bg: '#D1FAE5', dot: '#16A34A', label: 'ชำระแล้ว'       } :
                    st === 'full_tax'  ? { bg: '#EDE9FE', dot: '#7C3AED', label: 'ใบกำกับภาษีเต็ม' } :
                    st === 'void_note' ? { bg: '#FEF3C7', dot: '#F59E0B', label: 'ใบยกเลิก'        } :
                                        { bg: '#FEE2E2', dot: WebColors.danger, label: 'ยกเลิกแล้ว' };
                  return (
                    <View style={[iv.badge, { backgroundColor: cfg.bg }]}>
                      <View style={[iv.badgeDot, { backgroundColor: cfg.dot }]} />
                      <Text style={[iv.badgeText, { color: cfg.dot }]}>{cfg.label}</Text>
                    </View>
                  );
                })()}
                <View style={iv.payBadge}>
                  <Ionicons name="card-outline" size={12} color={WebColors.primary} />
                  <Text style={iv.payBadgeText}>{selectedInv?.payMethod}</Text>
                </View>
              </View>
              <TouchableOpacity style={iv.closeBtn} onPress={() => setSelectedInv(null)}>
                <Ionicons name="close" size={18} color={WebColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Tab bar */}
            {(() => {
              // Tab state ใน closure — ใช้ nested component ง่ายกว่า
              return null;
            })()}
            <InvoiceDetailTabs
              invoice={selectedInv}
              receiptFileRef={receiptFileRef}
              previewImage={previewImage}
              setPreviewImage={setPreviewImage}
              onAttach={handleAttachReceipt}
              onRemoveAttach={handleRemoveReceipt}
              onCancel={() => { setCancelTarget(selectedInv!); setShowCancelModal(true); setCancelReason(''); }}
              onClose={() => setSelectedInv(null)}
              onCreateFullTaxInvoice={(buyer) => {
                if (!selectedInv) return;

                // ถ้าบิลนี้เป็น full_tax แล้ว → update buyerInfo
                if (selectedInv.status === 'full_tax') {
                  const updated = {
                    ...selectedInv,
                    buyerInfo: {
                      name: buyer.buyerName,
                      addr: buyer.buyerAddr,
                      taxId: buyer.buyerTaxId,
                      branch: buyer.buyerBranch,
                    },
                  };
                  setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
                  setSelectedInv(updated);
                  return;
                }

                // บิล paid → สร้างบิล full_tax ใหม่ เลขรันต่อ
                const nums = invoices.map(inv => {
                  const m = inv.billNo.match(/(\d+)$/);
                  return m ? parseInt(m[1], 10) : 0;
                });
                const nextNo = String(Math.max(0, ...nums) + 1).padStart(4, '0');
                const prefix = selectedInv.billNo.replace(/\d+$/, '');
                const now    = new Date();
                const pad    = (n: number) => String(n).padStart(2, '0');
                const thai   = now.getFullYear() + 543;

                const fullTaxInv: Invoice = {
                  id:         `ftax_${Date.now()}`,
                  billNo:     `${prefix}${nextNo}`,
                  date:       `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${thai}`,
                  time:       `${pad(now.getHours())}:${pad(now.getMinutes())}`,
                  cashier:    selectedInv.cashier,
                  payMethod:  selectedInv.payMethod,
                  status:     'full_tax',
                  refBillNo:  selectedInv.billNo,
                  buyerInfo:  {
                    name:   buyer.buyerName,
                    addr:   buyer.buyerAddr,
                    taxId:  buyer.buyerTaxId,
                    branch: buyer.buyerBranch,
                  },
                  items:      selectedInv.items,
                  subtotal:   selectedInv.subtotal,
                  discount:   selectedInv.discount,
                  vat:        selectedInv.vat,
                  grand:      selectedInv.grand,
                };
                setInvoices(prev => [...prev, fullTaxInv]);
                setSelectedInv(fullTaxInv);
              }}
              fullTaxLinked={
                // หาว่า invoice นี้มีบิล full_tax ที่ active (ไม่ถูกยกเลิก) ที่อ้างอิงมาไหม
                invoices.find(inv =>
                  inv.status === 'full_tax' &&
                  inv.refBillNo === selectedInv?.billNo
                )?.billNo
              }
              onCancelFullTaxInvoice={(fullTaxBillNo) => {
                // mark full_tax invoice เป็น cancelled
                setInvoices(prev => prev.map(inv =>
                  inv.billNo === fullTaxBillNo
                    ? { ...inv, status: 'cancelled', cancelReason: 'ยกเลิกเพื่อออกใบกำกับภาษีใหม่' }
                    : inv
                ));
                // กลับไปที่ invoice ต้นฉบับ (paid) และเปิดฟอร์ม
                if (selectedInv && selectedInv.status === 'paid') {
                  // ยังอยู่ที่บิล paid อยู่แล้ว — reload
                  setSelectedInv({ ...selectedInv });
                }
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── Receipt Image Preview Modal ── */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => setPreviewImage(null)}
          activeOpacity={1}
        >
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{ width: '85%', height: '80%', borderRadius: 12 }}
              resizeMode="contain"
            />
          )}
          <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 12 }}>
            แตะที่ใดก็ได้เพื่อปิด
          </Text>
        </TouchableOpacity>
      </Modal>

      {/* ── Cancel Bill Modal ── */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={[m.box, { width: 400 }]}>
            <Text style={[m.title, { color: WebColors.danger }]}>ยกเลิกบิล</Text>
            <View style={iv.cancelWarn}>
              <Ionicons name="warning-outline" size={18} color="#F97316" />
              <Text style={iv.cancelWarnText}>
                การยกเลิกบิล {cancelTarget?.billNo} ไม่สามารถย้อนกลับได้
              </Text>
            </View>
            <Text style={m.sub}>เหตุผลที่ยกเลิก *</Text>
            <TextInput
              style={[m.input, { height: 80, textAlignVertical: 'top', paddingTop: 10, textAlign: 'left' }]}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="ระบุเหตุผล เช่น ลูกค้าเปลี่ยนใจ, บิลผิด..."
              placeholderTextColor={WebColors.textDisabled}
              multiline
            />
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setShowCancelModal(false)}>
                <Text style={m.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.okBtn, { backgroundColor: WebColors.danger }, !cancelReason.trim() && { backgroundColor: '#FCA5A5' }]}
                disabled={!cancelReason.trim()}
                onPress={handleCancelBill}
              >
                <Text style={m.okText}>ยืนยันยกเลิกบิล</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── UOM Picker Modal ── */}
      <Modal visible={!!uomPickerProduct} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={[m.box, { width: 360 }]}>
            <Text style={m.title}>เลือกหน่วย</Text>
            <Text style={m.sub}>{uomPickerProduct?.name?.replace(/ \(.*\)/, '')}</Text>
            {(() => {
              const baseId = uomPickerProduct?.id?.split('_')[0];
              const master = masterProducts.find(mp => mp.id === baseId);
              return master?.uoms.map(uom => {
                const prod = toCartProduct(master, uom);
                return (
                  <TouchableOpacity
                    key={uom.id}
                    style={[m.cancelBtn, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }]}
                    onPress={() => { handleProductTap(prod); setUomPickerProduct(null); }}
                  >
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: WebColors.text }}>{uom.unit}</Text>
                      <Text style={{ fontSize: 13, color: WebColors.textSecondary }}>
                        {uom.ratio > 1 ? `1 ${uom.unit} = ${uom.ratio} ${master.unit}` : 'หน่วยพื้นฐาน'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: WebColors.primary }}>฿{uom.salePrice}</Text>
                  </TouchableOpacity>
                );
              });
            })()}
            <TouchableOpacity style={m.cancelBtn} onPress={() => setUomPickerProduct(null)}>
              <Text style={m.cancelText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── PIN Authorization Modal ── */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={[m.box, { width: 300 }]}>
            <Text style={m.title}>ใส่ PIN เพื่อยืนยัน</Text>
            <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginBottom: 8 }}>
              {pinAction ? POS_ACTION_LABELS[pinAction] : ''}
            </Text>
            <TextInput
              style={[m.input, { textAlign: 'center', fontSize: 24, fontWeight: '800', letterSpacing: 8 }]}
              value={pinInput}
              onChangeText={t => { if (t.length <= 4) setPinInput(t); }}
              keyboardType="numeric"
              placeholder="● ● ● ●"
              placeholderTextColor="#D1D5DB"
              secureTextEntry
              maxLength={4}
              autoFocus
              onSubmitEditing={handlePinSubmit}
            />
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => { setShowPinModal(false); setPinInput(''); }}>
                <Text style={m.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.okBtn, pinInput.length < 4 && m.okBtnDisabled]} disabled={pinInput.length < 4} onPress={handlePinSubmit}>
                <Text style={m.okText}>ยืนยัน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Wallet Top-Up Modal ── */}
      <Modal visible={showTopUpModal} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={[m.box, { width: 340 }]}>
            <Text style={m.title}>เติมเงิน Wallet</Text>
            {selectedMember && (
              <>
                <Text style={m.sub}>สมาชิก: {selectedMember.name}</Text>
                <Text style={{ fontSize: 12, color: '#16A34A', marginBottom: 8 }}>ยอดคงเหลือ: ฿{getWalletBalance(selectedMember.id).toLocaleString()}</Text>
                <TextInput
                  style={m.input}
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                  placeholder="จำนวนเงินที่เติม (บาท)"
                  placeholderTextColor={WebColors.textDisabled}
                  keyboardType="number-pad"
                />
                {parseInt(topUpAmount) > 0 && (
                  <Text style={{ fontSize: 12, color: '#16A34A', marginTop: 4 }}>
                    ยอดหลังเติม: ฿{(getWalletBalance(selectedMember.id) + (parseInt(topUpAmount) || 0)).toLocaleString()}
                  </Text>
                )}
              </>
            )}
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => { setShowTopUpModal(false); setTopUpAmount(''); }}>
                <Text style={m.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.okBtn, !(parseInt(topUpAmount) > 0) && m.okBtnDisabled]}
                disabled={!(parseInt(topUpAmount) > 0)}
                onPress={() => {
                  if (selectedMember && parseInt(topUpAmount) > 0) {
                    const amt = parseInt(topUpAmount);
                    walletTopUp(selectedMember.id, amt, 'cashier');
                    logAction('POS', 'เติมเงิน Wallet', `เติม ฿${amt.toLocaleString()} ให้ ${selectedMember.name}`, { memberId: selectedMember.id, amount: amt });
                    setShowTopUpModal(false); setTopUpAmount('');

                    // พิมพ์ใบเสร็จเติมเงิน
                    if (Platform.OS === 'web') {
                      const now = new Date();
                      const receiptHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>ใบเสร็จเติมเงิน</title>
<style>body{font-family:'Sarabun',sans-serif;font-size:14px;max-width:300px;margin:20px auto;padding:20px}
.center{text-align:center}.line{border-top:1px dashed #000;margin:10px 0}
.row{display:flex;justify-content:space-between;margin:4px 0}.bold{font-weight:700}
.big{font-size:20px;font-weight:800}</style></head><body>
<div class="center"><h3>ใบเสร็จเติมเงิน Wallet</h3>
<p>${useStoreConfigStore?.getState?.()?.storeName || 'Xcellence POS'}</p></div>
<div class="line"></div>
<div class="row"><span>วันที่:</span><span>${now.toLocaleDateString('th-TH')} ${now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</span></div>
<div class="row"><span>สมาชิก:</span><span>${selectedMember.name}</span></div>
<div class="row"><span>เลขสมาชิก:</span><span>${selectedMember.memberNo}</span></div>
<div class="line"></div>
<div class="row bold"><span>เติมเงิน:</span><span class="big">฿${amt.toLocaleString()}</span></div>
<div class="row"><span>ยอดคงเหลือ:</span><span>฿${getWalletBalance(selectedMember.id).toLocaleString()}</span></div>
<div class="line"></div>
<div class="center"><p>ขอบคุณที่ใช้บริการ</p></div>
</body></html>`;
                      const w = window.open('', '_blank', 'width=350,height=500');
                      if (w) { w.document.write(receiptHtml); w.document.close(); setTimeout(() => w.print(), 400); }
                    }

                    alert(`เติมเงิน ฿${amt.toLocaleString()} สำเร็จ!\nยอดคงเหลือ: ฿${getWalletBalance(selectedMember.id).toLocaleString()}`);
                  }
                }}
              >
                <Text style={m.okText}>เติมเงิน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Staff Popup for service products ── */}
      <StaffPopup
        visible={staffPopupVisible}
        productName={pendingServiceProduct?.name}
        onSelect={(techId, techName) => {
          if (pendingServiceProduct) {
            addServiceItem(pendingServiceProduct, techId, techName);
          }
          setPendingServiceProduct(null);
          setStaffPopupVisible(false);
        }}
        onClose={() => { setPendingServiceProduct(null); setStaffPopupVisible(false); }}
      />
    </View>
  );
};

// ─── Numpad Component ─────────────────────────────────────────────────────────
const NumPad: React.FC<{
  value: string;
  onChange: (v: string) => void;
  allowDecimal?: boolean;
}> = ({ value, onChange, allowDecimal = true }) => {
  const press = (k: string) => {
    if (k === '⌫') { onChange(value.slice(0, -1) || '0'); return; }
    if (k === 'C')  { onChange('0'); return; }
    if (k === '.') {
      if (!allowDecimal || value.includes('.')) return;
      onChange(value + '.');
      return;
    }
    const next = value === '0' ? k : value + k;
    // max 7 digits before decimal
    const parts = next.split('.');
    if (parts[0].length > 7) return;
    if (parts[1] && parts[1].length > 2) return;
    onChange(next);
  };

  const KEYS = ['7','8','9','4','5','6','1','2','3','C','0','⌫'];

  return (
    <View style={np.pad}>
      {KEYS.map(k => (
        <TouchableOpacity
          key={k}
          style={[
            np.key,
            k === 'C'  && np.keyRed,
            k === '⌫' && np.keyGray,
          ]}
          onPress={() => press(k)}
          activeOpacity={0.7}
        >
          <Text style={[
            np.keyTxt,
            k === 'C'  && { color: '#EF4444' },
            k === '⌫' && { color: Colors.textSecondary },
          ]}>
            {k}
          </Text>
        </TouchableOpacity>
      ))}
      {allowDecimal && (
        <TouchableOpacity style={[np.key, np.keyGray]} onPress={() => press('.')}>
          <Text style={[np.keyTxt, { color: Colors.textSecondary }]}>.</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
const np = StyleSheet.create({
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  key: {
    width: '30%', aspectRatio: 1.8,
    borderRadius: 12, backgroundColor: WebColors.gray100,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: WebColors.border,
  },
  keyRed:  { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  keyGray: { backgroundColor: Colors.border, borderColor: '#CBD5E1' },
  keyTxt:  { fontSize: 14, fontWeight: '700', color: WebColors.text },
});

// ─── Shared Modal Styles ──────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  box: { backgroundColor: '#fff', borderRadius: 14, padding: 24, width: 340, gap: 14 },
  title: { fontSize: 13, fontWeight: '700', color: WebColors.text },
  sub: { fontSize: 12, color: WebColors.textSecondary, marginTop: -8 },
  input: { borderWidth: 1.5, borderColor: WebColors.border, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 14, fontWeight: '700', color: WebColors.text, textAlign: 'center' },
  calcText: { fontSize: 12, color: WebColors.textSecondary, textAlign: 'center' },
  typeToggle: { flexDirection: 'row', backgroundColor: WebColors.gray100, borderRadius: 8, padding: 3, gap: 3 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  typeBtnActive: { backgroundColor: WebColors.primary },
  typeBtnText: { fontSize: 12, fontWeight: '600', color: WebColors.textSecondary },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: WebColors.border, alignItems: 'center' },
  cancelText: { fontSize: 12, fontWeight: '600', color: WebColors.textSecondary },
  okBtn: { flex: 1.5, paddingVertical: 12, borderRadius: 12, backgroundColor: WebColors.primary, alignItems: 'center' },
  okBtnDisabled: { backgroundColor: '#A5B4FC' },
  okText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  totalBox: { backgroundColor: WebColors.primaryLight, borderRadius: 12, padding: 16, alignItems: 'center', gap: 4 },
  totalLabel: { fontSize: 12, color: WebColors.primary },
  totalAmt: { fontSize: 20, fontWeight: '900', color: WebColors.primary },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: WebColors.gray100, borderWidth: 1, borderColor: WebColors.border },
  quickText: { fontSize: 12, fontWeight: '600', color: WebColors.text },
  changeBox: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  changeLabel: { fontSize: 12, fontWeight: '600', color: '#16A34A' },
  changeAmt: { fontSize: 16, fontWeight: '800', color: '#16A34A' },
  // Numpad display
  displayBox: {
    backgroundColor: WebColors.gray100, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'flex-end', gap: 2,
    borderWidth: 1.5, borderColor: WebColors.border,
    minHeight: 56,
  },
  displayVal: { fontSize: 18, fontWeight: '800', color: WebColors.text },
});

// ─── Screen Styles ─────────────────────────────────────────────────────────────
const GAP_STYLE = 10;
const s = StyleSheet.create({
  outerRoot: { flex: 1, flexDirection: 'column', backgroundColor: WebColors.contentBg, height: '100%' as any },

  // Tab bar
  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
    paddingHorizontal: 16, gap: 4, alignItems: 'center',
  },
  exitKioskBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: WebColors.danger,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 11,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: WebColors.primary },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: WebColors.textSecondary },
  tabBtnTextActive: { color: WebColors.primary },
  tabBadge: {
    backgroundColor: WebColors.primary, borderRadius: 12,
    paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center',
  },
  tabBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Invoice panel
  invRoot: { flex: 1, padding: 20, gap: 16 },
  invToolbar: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  invSearch: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 8,
    borderWidth: 1, borderColor: WebColors.border,
    paddingHorizontal: 12, height: 40,
  },
  invSearchInput: { flex: 1, fontSize: 12, color: WebColors.text },
  invFilters: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, overflow: 'hidden' },
  invFilterBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  invFilterBtnActive: { backgroundColor: WebColors.primary },
  invFilterText: { fontSize: 12, color: WebColors.textSecondary, fontWeight: '500' },
  invFilterTextActive: { color: '#fff', fontWeight: '700' },

  // KPI
  invKpiRow: { flexDirection: 'row', gap: 12 },
  invKpiCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: WebColors.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  invKpiLabel: { fontSize: 13, color: WebColors.textSecondary },
  invKpiValue: { fontSize: 16, fontWeight: '800' },

  // Table
  invTable: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: WebColors.border, overflow: 'hidden' as any },
  invThead: {
    flexDirection: 'row', backgroundColor: WebColors.gray50,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
  },
  invTh: { flex: 1, fontSize: 13, fontWeight: '700', color: WebColors.textSecondary, textTransform: 'uppercase' },
  invTr: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: WebColors.border, alignItems: 'center' },
  invTrAlt: { backgroundColor: WebColors.gray50 },
  invTd: { flex: 1, fontSize: 12, color: WebColors.text },
  invTdCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  invTdBold: { fontSize: 12, fontWeight: '600', color: WebColors.text },
  invTdSub: { fontSize: 13, color: WebColors.textSecondary },
  invBillNo: { fontSize: 12, fontWeight: '700', color: WebColors.primary },
  invActionBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: WebColors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 13, fontWeight: '700' },
  invEmpty: { alignItems: 'center', padding: 48, gap: 10 },
  invEmptyText: { fontSize: 12, color: WebColors.textSecondary },

  root: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, backgroundColor: WebColors.contentBg },
  left: { flex: 1, minWidth: 300, flexDirection: 'column', padding: 12, gap: 8, overflow: 'hidden' as any },
  cart: { width: '35%' as any, minWidth: 280, maxWidth: 450, backgroundColor: '#fff', borderLeftWidth: 1, borderLeftColor: WebColors.border, flexDirection: 'column' },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 12, color: WebColors.text },
  // Scan flash
  scanFlash: {
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7,
    flexDirection: 'row', alignItems: 'center',
  },
  scanFlashText: { fontSize: 12, fontWeight: '700' },
  viewToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: WebColors.border },
  viewBtn: { padding: 10, borderRadius: 7 },
  viewBtnActive: { backgroundColor: WebColors.primaryLight },
  catRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  catChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: WebColors.border },
  catChipActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  catText: { fontSize: 12, color: WebColors.textSecondary, fontWeight: '500' },
  catTextActive: { color: '#fff', fontWeight: '700' },
  // Grid wrapper — flexWrap + 5 คอลัม
  grid5Wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 8,
  },
  // Grid card — width คำนวณจาก onLayout (override ด้วย inline style)
  productCard: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: WebColors.border,
    overflow: 'hidden' as any,
  },
  productImg: {
    backgroundColor: WebColors.primaryLight,
    height: 80,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  outBadge: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  outBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  lowBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  lowBadgeText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  productInfo: { padding: 8, gap: 3 },
  productName: { fontSize: 13, fontWeight: '500', color: WebColors.text, lineHeight: 16 },
  productCat:  { fontSize: 12, color: WebColors.textSecondary },
  productBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  productPrice: { fontSize: 12, fontWeight: '700', color: WebColors.primary },
  productStock: { fontSize: 13, fontWeight: '600', color: WebColors.success },
  // List row
  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: WebColors.border, padding: 10, gap: 10 },
  listIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: WebColors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  listName: { fontSize: 12, fontWeight: '600', color: WebColors.text },
  listCat: { fontSize: 13, color: WebColors.textSecondary },
  listPrice: { fontSize: 12, fontWeight: '700', color: WebColors.primary },
  listStock: { fontSize: 13, fontWeight: '600', color: WebColors.success, minWidth: 50, textAlign: 'right' },
  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 12, color: WebColors.textSecondary },
  // Cart header
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  cartHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartTitle: { fontSize: 12, fontWeight: '700', color: WebColors.text },
  cartEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  // จอที่ 2 button
  display2Btn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  display2BtnActive: { backgroundColor: WebColors.primary },
  display2BtnText: { fontSize: 13, fontWeight: '700', color: WebColors.primary },
  // Customer Display Modal
  displayOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  displayPanel: { width: '85%', height: '88%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' as any },
  displayModeBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: WebColors.gray50, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  displayModeTitle: { fontSize: 12, fontWeight: '700', color: WebColors.text, marginRight: 4 },
  displayModeBtns: { flex: 1, flexDirection: 'row', gap: 6 },
  displayModeBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: WebColors.gray100, borderWidth: 1, borderColor: WebColors.border },
  displayModeBtnText: { fontSize: 13, fontWeight: '600', color: WebColors.textSecondary },
  displayCloseBtn: { padding: 4 },
  displayContent: { flex: 1 },
  // Summary
  summary: { padding: 14, borderTopWidth: 1, borderTopColor: WebColors.border, gap: 6 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumLabel: { fontSize: 12, color: WebColors.textSecondary },
  sumVal: { fontSize: 12, color: WebColors.text },
  sumTotalRow: { borderTopWidth: 1, borderTopColor: WebColors.border, paddingTop: 8, marginTop: 4 },
  sumTotalLabel: { fontSize: 12, fontWeight: '700', color: WebColors.text },
  sumTotalVal: { fontSize: 16, fontWeight: '800', color: WebColors.primary },
  // Pay
  payArea: { padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: WebColors.border },
  payRow: { flexDirection: 'row', gap: 8 },
  payBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 8, paddingVertical: 10 },
  payBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  paySettingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  paySettingsText: { fontSize: 13, color: WebColors.textSecondary },

  // ── CRM & Promotion ──────────────────────────────────────────────────────
  crmRow: { paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  memberSelectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: WebColors.primary, borderRadius: 8,
    paddingVertical: 7, backgroundColor: WebColors.primaryLight,
  },
  memberSelectBtnText: { fontSize: 13, fontWeight: '700', color: WebColors.primary },
  memberBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: WebColors.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: WebColors.primary + '40',
  },
  memberBadgeName: { fontSize: 13, fontWeight: '700', color: WebColors.text, flex: 1 },
  levelBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  levelBadgeText: { fontSize: 12, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  memberPoints: { fontSize: 13, color: '#F59E0B', fontWeight: '600' },
  couponRow: { flexDirection: 'row', gap: 6 },
  couponInput: {
    flex: 1, borderWidth: 1.5, borderColor: WebColors.border, borderRadius: 8,
    paddingHorizontal: 10, height: 34, fontSize: 13, color: WebColors.text, backgroundColor: '#fff',
  },
  couponBtn: {
    backgroundColor: '#7C3AED', borderRadius: 8,
    paddingHorizontal: 12, height: 34, alignItems: 'center', justifyContent: 'center',
  },
  couponBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  couponErrRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  couponErrText: { fontSize: 13, color: WebColors.danger },
  couponSuccessRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2,
    backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  couponSuccessText: { fontSize: 13, color: WebColors.success, fontWeight: '600', flex: 1 },
  pointRedeemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#F59E0B', borderRadius: 8,
    paddingVertical: 6, backgroundColor: '#FEF3C7',
  },
  pointRedeemBtnText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  memberListItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
  },
  memberListName: { fontSize: 12, fontWeight: '600', color: WebColors.text },
  memberListSub: { fontSize: 13, color: WebColors.textSecondary },
});

// ─── Invoice Modal Styles ─────────────────────────────────────────────────────
const iv = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
  payBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: WebColors.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  payBadgeText: { fontSize: 13, fontWeight: '600', color: WebColors.primary },
  cancelNote: { fontSize: 13, color: WebColors.textSecondary, width: '100%', marginTop: 2 },

  thead: {
    flexDirection: 'row', backgroundColor: WebColors.gray50,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, marginBottom: 2,
  },
  th: { fontSize: 13, fontWeight: '700', color: WebColors.textSecondary, textTransform: 'uppercase' },
  tr: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
  },
  trAlt: { backgroundColor: WebColors.gray50 },
  td: { flex: 1, fontSize: 12, color: WebColors.text },

  summary: {
    backgroundColor: WebColors.gray50, borderRadius: 12,
    padding: 14, gap: 6,
  },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumLbl: { fontSize: 12, color: WebColors.textSecondary },
  sumVal: { fontSize: 12, color: WebColors.text },
  divider: { height: 1, backgroundColor: WebColors.border, marginVertical: 2 },
  grandLbl: { fontSize: 12, fontWeight: '700', color: WebColors.text },
  grandVal: { fontSize: 14, fontWeight: '800', color: WebColors.primary },

  cancelWarn: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFF7ED', borderRadius: 8,
    padding: 10, borderWidth: 1, borderColor: '#FED7AA',
  },
  cancelWarnText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  // ── Modal header ───────────────────────────────────────────────────────────
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 16, borderBottomWidth: 1, borderBottomColor: WebColors.border,
    backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 13, fontWeight: '800', color: WebColors.text },
  modalSub: { fontSize: 13, color: WebColors.textSecondary, marginTop: 2 },
  modalBadges: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: WebColors.gray100,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Tab bar ────────────────────────────────────────────────────────────────
  detailTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
    backgroundColor: '#fff',
  },
  detailTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 11,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  detailTabActive: { borderBottomColor: WebColors.primary },
  detailTabText: { fontSize: 12, fontWeight: '600', color: WebColors.textSecondary },
  detailTabTextActive: { color: WebColors.primary },

  // ── Bill type selector ────────────────────────────────────────────────────
  billTypeBar: {
    flexDirection: 'row', gap: 6, padding: 12,
    backgroundColor: WebColors.gray50,
    borderBottomWidth: 1, borderBottomColor: WebColors.border,
    flexWrap: 'wrap',
  },
  billTypeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: WebColors.border,
    backgroundColor: '#fff',
  },
  billTypeBtnActive: { borderColor: WebColors.primary, backgroundColor: WebColors.primaryLight },
  billTypeTxt: { fontSize: 13, fontWeight: '600', color: WebColors.textSecondary },
  billTypeTxtActive: { color: WebColors.primary },

  // ── Full form (ใบกำกับภาษีเต็ม) ──────────────────────────────────────────
  fullFormCard: {
    margin: 12, padding: 14, gap: 10,
    backgroundColor: '#F5F3FF', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#7C3AED40',
  },
  fullFormTitle: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  fullFormField: { gap: 4 },
  fullFormRow: { flexDirection: 'row', gap: 10 },
  fullFormLabel: { fontSize: 13, fontWeight: '700', color: WebColors.textSecondary, textTransform: 'uppercase' },
  fullFormInput: {
    borderWidth: 1.5, borderColor: '#7C3AED50', borderRadius: 8,
    paddingHorizontal: 10, height: 40, fontSize: 12,
    color: WebColors.text, backgroundColor: '#fff',
  },
  fullFormBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 11,
  },
  fullFormBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  // inline field errors
  fieldError: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3,
  },
  fieldErrorText: { fontSize: 13, color: WebColors.danger, fontWeight: '600' },
  fieldOk: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3,
  },
  fieldOkText: { fontSize: 13, color: WebColors.success, fontWeight: '600' },
  fullFormInputErr: { borderColor: WebColors.danger, borderWidth: 1.5 },
  // summary warning box
  formWarnBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEF3C7', borderRadius: 8,
    padding: 10, borderWidth: 1, borderColor: '#FDE68A',
  },
  formWarnText: { fontSize: 13, color: '#92400E', lineHeight: 18 },
  // No tax badge
  noTaxBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF3C7', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#FDE68A', flex: 1,
  },
  noTaxText: { fontSize: 13, color: '#92400E', flex: 1, lineHeight: 16 },

  // ── Doc type badge ────────────────────────────────────────────────────────
  rcDocTypeBadge: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1.5, borderColor: WebColors.primary,
    backgroundColor: WebColors.primaryLight, marginTop: 4,
  },
  rcDocTypeText: { fontSize: 12, fontWeight: '800', color: WebColors.primary },

  // ── Upgrade to full button ────────────────────────────────────────────────
  upgradeFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    margin: 12, padding: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  upgradeFullBtnTxt: { fontSize: 12, fontWeight: '700', color: '#7C3AED', flex: 1, textAlign: 'center' },

  // ── Full buyer box ────────────────────────────────────────────────────────
  fullBuyerBox: {
    margin: 12, padding: 12, gap: 5,
    backgroundColor: '#F5F3FF', borderRadius: 12,
    borderWidth: 1, borderColor: '#7C3AED30',
  },
  fullBuyerTitle: { fontSize: 13, fontWeight: '800', color: '#7C3AED', marginBottom: 4 },
  editBuyerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-end', marginTop: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: WebColors.primary,
    backgroundColor: WebColors.primaryLight,
  },
  editBuyerBtnTxt: { fontSize: 13, fontWeight: '700', color: WebColors.primary },

  // ── Receipt card ───────────────────────────────────────────────────────────
  receiptCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1, borderColor: WebColors.border,
    overflow: 'hidden' as any,
    position: 'relative' as any,
  },
  rcHeader: {
    alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16, gap: 4,
    backgroundColor: WebColors.primaryLight,
  },
  rcShopIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2, borderColor: WebColors.primary + '30',
  },
  rcShopName: { fontSize: 14, fontWeight: '800', color: WebColors.primary },
  rcShopSub: { fontSize: 13, color: WebColors.textSecondary },
  cancelStamp: {
    position: 'absolute' as any, top: 12, right: 12,
    backgroundColor: WebColors.danger, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    transform: [{ rotate: '15deg' }],
  },
  cancelStampText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  rcDividerDash: {
    height: 1, marginHorizontal: 0,
    borderTopWidth: 1, borderTopColor: WebColors.border,
    borderStyle: 'dashed' as any,
  },
  rcInfoGrid: { paddingHorizontal: 16, paddingVertical: 10, gap: 5 },
  rcInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 0 },
  rcInfoKey: { fontSize: 13, color: WebColors.textSecondary, width: 130, paddingRight: 8 },
  rcInfoVal: { fontSize: 13, fontWeight: '600', color: WebColors.text, flex: 1 },
  rcItemsHead: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: WebColors.gray50,
    borderTopWidth: 1, borderTopColor: WebColors.border,
  },
  rcItemH: { fontSize: 12, fontWeight: '700', color: WebColors.textSecondary, textTransform: 'uppercase' },
  rcItemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  rcItemCell: { fontSize: 13, color: WebColors.text },
  rcSummary: { paddingHorizontal: 16, paddingVertical: 10, gap: 5 },
  rcSumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rcSumLbl: { fontSize: 13, color: WebColors.textSecondary },
  rcSumVal: { fontSize: 13, color: WebColors.text },
  rcGrandRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 4, paddingTop: 8,
    borderTopWidth: 2, borderTopColor: WebColors.primary,
  },
  rcGrandLbl: { fontSize: 12, fontWeight: '800', color: WebColors.text },
  rcGrandVal: { fontSize: 16, fontWeight: '900', color: WebColors.primary },
  rcFooter: { textAlign: 'center', fontSize: 12, color: WebColors.text, paddingTop: 10 },
  rcFooterSub: { textAlign: 'center', fontSize: 13, color: WebColors.textSecondary, paddingBottom: 16 },

  // ── Attach tab ─────────────────────────────────────────────────────────────
  thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  // ── Actions bar ────────────────────────────────────────────────────────────
  detailActions: {
    flexDirection: 'row', gap: 8, padding: 12,
    borderTopWidth: 1, borderTopColor: WebColors.border,
    backgroundColor: '#fff',
  },
  actionClose: {
    flex: 1, height: 42, borderRadius: 12,
    borderWidth: 1.5, borderColor: WebColors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  actionCloseText: { fontSize: 12, fontWeight: '600', color: WebColors.textSecondary },
  actionPrint: {
    flex: 1, height: 42, borderRadius: 12,
    borderWidth: 1.5, borderColor: WebColors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: '#fff',
  },
  actionPrintText: { fontSize: 12, fontWeight: '600', color: WebColors.textSecondary },
  actionCancel: {
    flex: 1.4, height: 42, borderRadius: 12,
    backgroundColor: WebColors.danger,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  actionCancelText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  // ปุ่มใบกำกับภาษีเต็ม
  actionFull: {
    flex: 1.3, height: 42, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#7C3AED',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: '#F5F3FF',
  },
  actionFullText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },

  // ── Receipt attachment (kept for compat) ───────────────────────────────────
  attachSection: {
    borderWidth: 1, borderColor: WebColors.border, borderRadius: 12,
    padding: 10, gap: 8, backgroundColor: WebColors.gray50,
  },
  attachHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attachTitle: { flex: 1, fontSize: 12, fontWeight: '700', color: WebColors.text },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: WebColors.primary, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: WebColors.primaryLight,
  },
  attachBtnText: { fontSize: 13, fontWeight: '700', color: WebColors.primary },
  attachEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 },
  attachEmptyText: { fontSize: 12, color: WebColors.textSecondary },
  thumbRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  thumbWrap: { alignItems: 'center', gap: 4, width: 88 },
  thumb: { width: 88, height: 88, borderRadius: 8, borderWidth: 1, borderColor: WebColors.border },
  thumbOverlay: {
    position: 'absolute' as any, bottom: 0, left: 0, right: 0, height: 30,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  thumbDel: { position: 'absolute' as any, top: -7, right: -7, backgroundColor: '#fff', borderRadius: 12 },
  thumbLabel: { fontSize: 12, color: WebColors.textSecondary, width: 88, textAlign: 'center' },
});
