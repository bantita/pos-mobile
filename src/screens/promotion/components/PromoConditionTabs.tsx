/**
 * PromoConditionTabs — Dynamic condition tabs for promotion form
 * Type 1&2: สมาชิก, ร้านค้า, วัน, เวลา, สินค้า, ยอดซื้อ, สินค้าไม่ร่วม
 * Type 3&4: สมาชิก, ร้านค้า, วัน, เวลา, แลกคะแนน
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import * as couponStore from '../../../store/couponStore';
import { LookupCheckbox } from '../../../components/ui/LookupCheckbox';
import { PromoGenericTable, TableColumn, TableRow } from './PromoGenericTable';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ConditionProduct {
  id: string;
  code: string;
  name: string;
  unit: string;
  conditionType: string;
  qty: string;
  qtyTo: string;
  condition: string;
  promoGroupName: string;
}

interface Props {
  promoType: string;
  // Branch
  selectedBranches: string[];
  onToggleBranch: (id: string) => void;
  onOpenBranchModal: () => void;
  branches: Array<{ id: string; name: string }>;
  // Days
  selectedDays: string[];
  onToggleDay: (day: string) => void;
  // Time
  timeStart: string;
  timeEnd: string;
  onTimeStartChange: (v: string) => void;
  onTimeEndChange: (v: string) => void;
  // Products (Type 1&2)
  selectedProducts: ConditionProduct[];
  onOpenProductModal: () => void;
  onRemoveProduct: (id: string) => void;
  // Promo group
  promoGroup: string;
  onOpenPromoGroupPicker: () => void;
  // Purchase (Type 1&2)
  purchaseAmount: string;
  purchaseAmountTo: string;
  purchaseType: string;
  onPurchaseAmountChange: (v: string) => void;
  onPurchaseAmountToChange: (v: string) => void;
  onOpenPurchaseTypePicker: () => void;
  // Excluded (Type 1&2)
  excludedProducts: ConditionProduct[];
  onOpenExcludedModal: () => void;
  onRemoveExcluded: (id: string) => void;
  // Points exchange (Type 3&4)
  pointExchangeRate: string;
  pointExchangeMin: string;
  onPointExchangeRateChange: (v: string) => void;
  onPointExchangeMinChange: (v: string) => void;
  // Coupon campaigns
  selectedCouponCampaigns?: string[];
  onCouponCampaignsChange?: (ids: string[]) => void;
}

const DAYS_OF_WEEK = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
const MEMBER_TIERS = ['ทุกระดับ', 'Silver', 'Gold', 'Platinum', 'Diamond'];

export const PromoConditionTabs: React.FC<Props> = (props) => {
  const isType12 = props.promoType === 'โปรโมชั่น' || props.promoType === 'รับคะแนน, ของกำนัล';
  const isType34 = props.promoType === 'คะแนนแลกสินค้า, ส่วนลด' || props.promoType === 'ใช้คะแนนชำระ';

  const tabs12 = ['สมาชิก', 'ร้านค้า', 'วัน', 'เวลา', 'สินค้า', 'ยอดซื้อ', 'สินค้าไม่ร่วม', 'คูปอง'];
  const tabs34 = ['สมาชิก', 'ร้านค้า', 'วัน', 'เวลา', 'แลกคะแนน'];
  const tabs = isType12 ? tabs12 : tabs34;

  const [activeTab, setActiveTab] = useState('สมาชิก');
  const [memberTier, setMemberTier] = useState('ทุกระดับ');

  // Product table columns
  const productCols: TableColumn[] = [
    { label: 'ลำดับ', width: 40 },
    { label: 'กลุ่มสินค้าฯ', width: 110 },
    { label: 'สินค้า', width: 70 },
    { label: 'ชื่อสินค้า', width: 120 },
    { label: 'หน่วย', width: 50 },
    { label: 'เงื่อนไข', width: 60 },
    { label: 'ประเภท', width: 80 },
    { label: 'จำนวน', width: 60 },
    { label: 'ถึง', width: 60 },
  ];

  const excludedCols: TableColumn[] = [
    { label: 'ลำดับ', width: 40 },
    { label: 'กลุ่มสินค้าฯ', width: 120 },
    { label: 'สินค้า', width: 70 },
    { label: 'ชื่อสินค้า', width: 140 },
    { label: 'หน่วย', width: 60 },
  ];

  const productRows: TableRow[] = props.selectedProducts.map((p, i) => ({
    id: p.id,
    cells: [i + 1, p.promoGroupName || '-', p.code, p.name, p.unit, p.condition || '-', p.conditionType, p.qty, p.qtyTo || '-'],
  }));

  const excludedRows: TableRow[] = props.excludedProducts.map((p, i) => ({
    id: p.id,
    cells: [i + 1, p.promoGroupName || '-', p.code, p.name, p.unit],
  }));

  return (
    <View>
      <Text style={s.sectionHeader}>2) เงื่อนไข</Text>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
        <View style={s.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Tab Content */}
      <View style={s.tabContent}>
        {/* สมาชิก */}
        {activeTab === 'สมาชิก' && (
          <View>
            <Text style={s.fieldLabel}>ระดับสมาชิก</Text>
            <View style={s.tierRow}>
              {MEMBER_TIERS.map(tier => (
                <TouchableOpacity
                  key={tier}
                  style={[s.tierChip, memberTier === tier && s.tierChipActive]}
                  onPress={() => setMemberTier(tier)}
                >
                  <Text style={[s.tierChipText, memberTier === tier && s.tierChipTextActive]}>{tier}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ร้านค้า */}
        {activeTab === 'ร้านค้า' && (
          <View>
            <Text style={s.fieldLabel}>เลือกร้านค้า/สาขา</Text>
            <Text style={s.noteText}>* ถ้าใช้ทุกสาขาให้ข้ามขั้นตอนนี้</Text>
            <TouchableOpacity style={s.input} onPress={props.onOpenBranchModal}>
              <Text style={[s.inputText, props.selectedBranches.length === 0 && { color: Colors.textDisabled }]}>
                {props.selectedBranches.length === 0 ? 'กดเพื่อเลือกสาขา' : `เลือกแล้ว ${props.selectedBranches.length} สาขา`}
              </Text>
              <Ionicons name="chevron-down" size={18} color={Colors.gray400} />
            </TouchableOpacity>
            {props.selectedBranches.length > 0 && (
              <View style={s.chipsRow}>
                {props.selectedBranches.map(id => {
                  const b = props.branches.find(x => x.id === id);
                  return b ? (
                    <View key={id} style={s.chip}>
                      <Text style={s.chipText}>{b.name}</Text>
                      <TouchableOpacity onPress={() => props.onToggleBranch(id)}>
                        <Ionicons name="close-circle" size={14} color={Colors.gray500} />
                      </TouchableOpacity>
                    </View>
                  ) : null;
                })}
              </View>
            )}
          </View>
        )}

        {/* วัน */}
        {activeTab === 'วัน' && (
          <View>
            <Text style={s.fieldLabel}>เลือกวันที่มีผล</Text>
            <View style={s.daysRow}>
              {DAYS_OF_WEEK.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[s.dayChip, props.selectedDays.includes(day) && s.dayChipActive]}
                  onPress={() => props.onToggleDay(day)}
                >
                  <Text style={[s.dayText, props.selectedDays.includes(day) && s.dayTextActive]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {props.selectedDays.length === 0 && <Text style={s.noteText}>* ไม่เลือก = มีผลทุกวัน</Text>}
          </View>
        )}

        {/* เวลา */}
        {activeTab === 'เวลา' && (
          <View>
            <Text style={s.fieldLabel}>เวลาเริ่มต้น</Text>
            <TextInput style={s.input} value={props.timeStart} onChangeText={props.onTimeStartChange} placeholder="HH:MM" placeholderTextColor={Colors.textDisabled} />
            <Text style={s.fieldLabel}>เวลาสิ้นสุด</Text>
            <TextInput style={s.input} value={props.timeEnd} onChangeText={props.onTimeEndChange} placeholder="HH:MM" placeholderTextColor={Colors.textDisabled} />
            {!props.timeStart && !props.timeEnd && <Text style={s.noteText}>* ไม่กรอก = มีผลตลอดวัน</Text>}
          </View>
        )}

        {/* สินค้า (Type 1&2) */}
        {activeTab === 'สินค้า' && isType12 && (
          <View>
            <View style={s.rowEnd}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>กลุ่มสินค้าโปรโมชั่น</Text>
                <TouchableOpacity style={s.input} onPress={props.onOpenPromoGroupPicker}>
                  <Text style={[s.inputText, !props.promoGroup && { color: Colors.textDisabled }]}>
                    {props.promoGroup || 'เลือกกลุ่มสินค้า'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.selectBtn} onPress={props.onOpenProductModal}>
                <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
                <Text style={s.selectBtnText}>เลือกสินค้า</Text>
              </TouchableOpacity>
            </View>
            <PromoGenericTable columns={productCols} rows={productRows} onRemove={props.onRemoveProduct} />
          </View>
        )}

        {/* ยอดซื้อ (Type 1&2) */}
        {activeTab === 'ยอดซื้อ' && isType12 && (
          <View>
            <Text style={s.fieldLabel}>ประเภทเงื่อนไข</Text>
            <TouchableOpacity style={s.input} onPress={props.onOpenPurchaseTypePicker}>
              <Text style={s.inputText}>{props.purchaseType}</Text>
              <Ionicons name="chevron-down" size={18} color={Colors.gray400} />
            </TouchableOpacity>
            <Text style={s.fieldLabel}>ยอดซื้อ (บาท)</Text>
            <TextInput style={s.input} value={props.purchaseAmount} onChangeText={props.onPurchaseAmountChange} placeholder="0.00" placeholderTextColor={Colors.textDisabled} keyboardType="numeric" />
            <Text style={s.fieldLabel}>ยอดซื้อถึง (บาท)</Text>
            <TextInput style={s.input} value={props.purchaseAmountTo} onChangeText={props.onPurchaseAmountToChange} placeholder="0.00" placeholderTextColor={Colors.textDisabled} keyboardType="numeric" />
          </View>
        )}

        {/* สินค้าไม่ร่วม (Type 1&2) */}
        {activeTab === 'สินค้าไม่ร่วม' && isType12 && (
          <View>
            <View style={s.rowEnd}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>กลุ่มสินค้าโปรโมชั่น</Text>
                <TouchableOpacity style={s.input} onPress={() => {}}>
                  <Text style={[s.inputText, { color: Colors.textDisabled }]}>เลือกกลุ่มสินค้า</Text>
                  <Ionicons name="chevron-down" size={18} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.selectBtn} onPress={props.onOpenExcludedModal}>
                <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
                <Text style={s.selectBtnText}>เลือกสินค้า</Text>
              </TouchableOpacity>
            </View>
            <PromoGenericTable columns={excludedCols} rows={excludedRows} onRemove={props.onRemoveExcluded} />
          </View>
        )}

        {/* แลกคะแนน (Type 3&4) */}
        {activeTab === 'แลกคะแนน' && isType34 && (
          <View>
            <Text style={s.fieldLabel}>อัตราแลกคะแนน (คะแนน ต่อ 1 บาท)</Text>
            <TextInput style={s.input} value={props.pointExchangeRate} onChangeText={props.onPointExchangeRateChange} placeholder="เช่น 10" placeholderTextColor={Colors.textDisabled} keyboardType="numeric" />
            <Text style={s.fieldLabel}>คะแนนขั้นต่ำที่ใช้แลก</Text>
            <TextInput style={s.input} value={props.pointExchangeMin} onChangeText={props.onPointExchangeMinChange} placeholder="0" placeholderTextColor={Colors.textDisabled} keyboardType="numeric" />
          </View>
        )}

        {/* คูปอง (Type 1&2) */}
        {activeTab === 'คูปอง' && isType12 && (
          <View style={{ gap: 8 }}>
            <Text style={s.fieldLabel}>เลือกแคมเปญคูปอง</Text>
            <Text style={s.noteText}>ผูกโปรโมชั่นนี้กับแคมเปญคูปองที่สร้างไว้ ลูกค้าต้องใช้รหัสคูปองจึงจะได้สิทธิ์</Text>
            <LookupCheckbox
              items={couponStore.getCampaigns().map(c => ({ id: c.id, label: c.name, sub: c.prefix, extra: `${c.totalQuantity} ใบ` }))}
              selectedIds={props.selectedCouponCampaigns ?? []}
              onChange={props.onCouponCampaignsChange ?? (() => {})}
              placeholder="เลือกแคมเปญคูปอง..."
              title="เลือกแคมเปญคูปอง"
              columns={['ชื่อแคมเปญ', 'Prefix', 'จำนวน']}
            />
            {(props.selectedCouponCampaigns ?? []).length > 0 && (
              <View style={{ backgroundColor: '#DCFCE7', borderRadius: 8, padding: 10, gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#16A34A' }}>เชื่อมแล้ว:</Text>
                {(props.selectedCouponCampaigns ?? []).map(id => {
                  const c = couponStore.getCampaign(id);
                  return c ? <Text key={id} style={{ fontSize: 11, color: '#15803D' }}>• {c.name} ({c.prefix}) — ลูกค้าใช้รหัสคูปอง prefix "{c.prefix}" ที่หน้า POS</Text> : null;
                })}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  sectionHeader: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  tabScroll: { marginBottom: Spacing.sm },
  tabRow: { flexDirection: 'row', gap: Spacing.xs },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { ...Typography.body2, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '600' },
  tabContent: { paddingVertical: Spacing.sm },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  noteText: { ...Typography.caption, color: Colors.textDisabled, fontStyle: 'italic', marginTop: Spacing.xs },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, ...Typography.body2, color: Colors.text, backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  inputText: { ...Typography.body2, color: Colors.text, flex: 1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  chipText: { ...Typography.caption, color: Colors.primary, fontWeight: '500' },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  dayChip: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText: { ...Typography.body2, color: Colors.text },
  dayTextActive: { color: Colors.white, fontWeight: '600' },
  tierRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  tierChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  tierChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tierChipText: { ...Typography.body2, color: Colors.text },
  tierChipTextActive: { color: Colors.white },
  rowEnd: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  selectBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, marginTop: Spacing.sm },
  selectBtnText: { ...Typography.body2, color: Colors.white, fontWeight: '500' },
});
