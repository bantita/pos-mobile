import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from '@/shared/tw/index';

import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import * as couponStore from '@/features/coupon/application/stores/couponStore';
import { LookupCheckbox } from '@/shared/components/ui/LookupCheckbox';
import { PromoGenericTable, TableColumn, TableRow } from '@/features/promotion/presentation/screens/components/PromoGenericTable';

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
  selectedBranches: string[];
  onToggleBranch: (id: string) => void;
  onOpenBranchModal: () => void;
  branches: Array<{ id: string; name: string }>;
  selectedDays: string[];
  onToggleDay: (day: string) => void;
  timeStart: string;
  timeEnd: string;
  onTimeStartChange: (v: string) => void;
  onTimeEndChange: (v: string) => void;
  selectedProducts: ConditionProduct[];
  onOpenProductModal: () => void;
  onRemoveProduct: (id: string) => void;
  promoGroup: string;
  onOpenPromoGroupPicker: () => void;
  purchaseAmount: string;
  purchaseAmountTo: string;
  purchaseType: string;
  onPurchaseAmountChange: (v: string) => void;
  onPurchaseAmountToChange: (v: string) => void;
  onOpenPurchaseTypePicker: () => void;
  excludedProducts: ConditionProduct[];
  onOpenExcludedModal: () => void;
  onRemoveExcluded: (id: string) => void;
  pointExchangeRate: string;
  pointExchangeMin: string;
  onPointExchangeRateChange: (v: string) => void;
  onPointExchangeMinChange: (v: string) => void;
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
      <Text className={cn('text-lg font-semibold text-slate-950 mb-3')}>2) เงื่อนไข</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className={cn('mb-2')}>
        <View className={cn('flex-row gap-1')}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              className={cn('px-3 py-2 border-b-2 border-b-transparent', activeTab === tab && 'border-b-rose-500')}
              onPress={() => setActiveTab(tab)}
            >
              <Text className={cn('text-base text-slate-500', activeTab === tab && 'text-rose-600 font-semibold')}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View className={cn('py-2')}>
        {activeTab === 'สมาชิก' && (
          <View>
            <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>ระดับสมาชิก</Text>
            <View className={cn('flex-row flex-wrap gap-2 mt-2')}>
              {MEMBER_TIERS.map(tier => (
                <TouchableOpacity
                  key={tier}
                  className={cn('px-3 py-2 rounded-full border', memberTier === tier ? 'bg-rose-500 border-rose-500' : 'border-slate-200')}
                  onPress={() => setMemberTier(tier)}
                >
                  <Text className={cn('text-base', memberTier === tier ? 'text-white' : 'text-slate-950')}>{tier}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'ร้านค้า' && (
          <View>
            <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>เลือกร้านค้า/สาขา</Text>
            <Text className={cn('text-xs text-slate-500 italic mt-1')}>* ถ้าใช้ทุกสาขาให้ข้ามขั้นตอนนี้</Text>
            <TouchableOpacity className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base text-slate-950 bg-white flex-row items-center justify-between min-h-[44px]')} onPress={props.onOpenBranchModal}>
              <Text className={cn('text-base text-slate-950 flex-1', props.selectedBranches.length === 0 && 'text-slate-500')}>
                {props.selectedBranches.length === 0 ? 'กดเพื่อเลือกสาขา' : `เลือกแล้ว ${props.selectedBranches.length} สาขา`}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#9ca3af" />
            </TouchableOpacity>
            {props.selectedBranches.length > 0 && (
              <View className={cn('flex-row flex-wrap gap-1 mt-2')}>
                {props.selectedBranches.map(id => {
                  const b = props.branches.find(x => x.id === id);
                  return b ? (
                    <View key={id} className={cn('flex-row items-center gap-1 bg-rose-50 px-2 py-1 rounded-full')}>
                      <Text className={cn('text-xs text-rose-600 font-medium')}>{b.name}</Text>
                      <TouchableOpacity onPress={() => props.onToggleBranch(id)}>
                        <Ionicons name="close-circle" size={14} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  ) : null;
                })}
              </View>
            )}
          </View>
        )}

        {activeTab === 'วัน' && (
          <View>
            <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>เลือกวันที่มีผล</Text>
            <View className={cn('flex-row flex-wrap gap-2 mt-1')}>
              {DAYS_OF_WEEK.map(day => (
                <TouchableOpacity
                  key={day}
                  className={cn('w-10 h-10 rounded-full border items-center justify-center', props.selectedDays.includes(day) ? 'bg-rose-500 border-rose-500' : 'border-slate-200')}
                  onPress={() => props.onToggleDay(day)}
                >
                  <Text className={cn('text-base', props.selectedDays.includes(day) ? 'text-white font-semibold' : 'text-slate-950')}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {props.selectedDays.length === 0 && <Text className={cn('text-xs text-slate-500 italic mt-1')}>* ไม่เลือก = มีผลทุกวัน</Text>}
          </View>
        )}

        {activeTab === 'เวลา' && (
          <View>
            <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>เวลาเริ่มต้น</Text>
            <TextInput className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base text-slate-950 bg-white flex-row items-center justify-between min-h-[44px]')} value={props.timeStart} onChangeText={props.onTimeStartChange} placeholder="HH:MM" placeholderTextColor="#57534e" />
            <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>เวลาสิ้นสุด</Text>
            <TextInput className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base text-slate-950 bg-white flex-row items-center justify-between min-h-[44px]')} value={props.timeEnd} onChangeText={props.onTimeEndChange} placeholder="HH:MM" placeholderTextColor="#57534e" />
            {!props.timeStart && !props.timeEnd && <Text className={cn('text-xs text-slate-500 italic mt-1')}>* ไม่กรอก = มีผลตลอดวัน</Text>}
          </View>
        )}

        {activeTab === 'สินค้า' && isType12 && (
          <View>
            <View className={cn('flex-row gap-3 items-end')}>
              <View style={{ flex: 1 }}>
                <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>กลุ่มสินค้าโปรโมชั่น</Text>
                <TouchableOpacity className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base text-slate-950 bg-white flex-row items-center justify-between min-h-[44px]')} onPress={props.onOpenPromoGroupPicker}>
                  <Text className={cn('text-base flex-1', !props.promoGroup ? 'text-slate-500' : 'text-slate-950')}>
                    {props.promoGroup || 'เลือกกลุ่มสินค้า'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 px-3 py-2 rounded-xl mt-2')} onPress={props.onOpenProductModal}>
                <Ionicons name="add-circle-outline" size={18} color="#fafafa" />
                <Text className={cn('text-base text-white font-medium')}>เลือกสินค้า</Text>
              </TouchableOpacity>
            </View>
            <PromoGenericTable columns={productCols} rows={productRows} onRemove={props.onRemoveProduct} />
          </View>
        )}

        {activeTab === 'ยอดซื้อ' && isType12 && (
          <View>
            <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>ประเภทเงื่อนไข</Text>
            <TouchableOpacity className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base text-slate-950 bg-white flex-row items-center justify-between min-h-[44px]')} onPress={props.onOpenPurchaseTypePicker}>
              <Text className={cn('text-base text-slate-950 flex-1')}>{props.purchaseType}</Text>
              <Ionicons name="chevron-down" size={18} color="#9ca3af" />
            </TouchableOpacity>
            <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>ยอดซื้อ (บาท)</Text>
            <TextInput className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base text-slate-950 bg-white flex-row items-center justify-between min-h-[44px]')} value={props.purchaseAmount} onChangeText={props.onPurchaseAmountChange} placeholder="0.00" placeholderTextColor="#57534e" keyboardType="numeric" />
            <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>ยอดซื้อถึง (บาท)</Text>
            <TextInput className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base text-slate-950 bg-white flex-row items-center justify-between min-h-[44px]')} value={props.purchaseAmountTo} onChangeText={props.onPurchaseAmountToChange} placeholder="0.00" placeholderTextColor="#57534e" keyboardType="numeric" />
          </View>
        )}

        {activeTab === 'สินค้าไม่ร่วม' && isType12 && (
          <View>
            <View className={cn('flex-row gap-3 items-end')}>
              <View style={{ flex: 1 }}>
                <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>กลุ่มสินค้าโปรโมชั่น</Text>
                <TouchableOpacity className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base bg-white flex-row items-center justify-between min-h-[44px]')} onPress={() => {}}>
                  <Text className={cn('text-base flex-1 text-slate-500')}>เลือกกลุ่มสินค้า</Text>
                  <Ionicons name="chevron-down" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 px-3 py-2 rounded-xl mt-2')} onPress={props.onOpenExcludedModal}>
                <Ionicons name="add-circle-outline" size={18} color="#fafafa" />
                <Text className={cn('text-base text-white font-medium')}>เลือกสินค้า</Text>
              </TouchableOpacity>
            </View>
            <PromoGenericTable columns={excludedCols} rows={excludedRows} onRemove={props.onRemoveExcluded} />
          </View>
        )}

        {activeTab === 'แลกคะแนน' && isType34 && (
          <View>
            <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>อัตราแลกคะแนน (คะแนน ต่อ 1 บาท)</Text>
            <TextInput className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base text-slate-950 bg-white flex-row items-center justify-between min-h-[44px]')} value={props.pointExchangeRate} onChangeText={props.onPointExchangeRateChange} placeholder="เช่น 10" placeholderTextColor="#57534e" keyboardType="numeric" />
            <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>คะแนนขั้นต่ำที่ใช้แลก</Text>
            <TextInput className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base text-slate-950 bg-white flex-row items-center justify-between min-h-[44px]')} value={props.pointExchangeMin} onChangeText={props.onPointExchangeMinChange} placeholder="0" placeholderTextColor="#57534e" keyboardType="numeric" />
          </View>
        )}

        {activeTab === 'คูปอง' && isType12 && (
          <View style={{ gap: 8 }}>
            <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>เลือกแคมเปญคูปอง</Text>
            <Text className={cn('text-xs text-slate-500 italic mt-1')}>ผูกโปรโมชั่นนี้กับแคมเปญคูปองที่สร้างไว้ ลูกค้าต้องใช้รหัสคูปองจึงจะได้สิทธิ์</Text>
            <LookupCheckbox
              items={couponStore.getCampaigns().map(c => ({ id: c.id, label: c.name, sub: c.prefix, extra: `${c.totalQuantity} ใบ` }))}
              selectedIds={props.selectedCouponCampaigns ?? []}
              onChange={props.onCouponCampaignsChange ?? (() => {})}
              placeholder="เลือกแคมเปญคูปอง..."
              title="เลือกแคมเปญคูปอง"
              columns={['ชื่อแคมเปญ', 'Prefix', 'จำนวน']}
            />
            {(props.selectedCouponCampaigns ?? []).length > 0 && (
              <View className={cn('bg-green-100 rounded-lg p-[10px] gap-1')}>
                <Text className={cn('text-xs font-semibold text-green-600')}>เชื่อมแล้ว:</Text>
                {(props.selectedCouponCampaigns ?? []).map(id => {
                  const c = couponStore.getCampaign(id);
                  return c ? <Text key={id} className={cn('text-xs text-green-700')}>• {c.name} ({c.prefix}) — ลูกค้าใช้รหัสคูปอง prefix "{c.prefix}" ที่หน้า POS</Text> : null;
                })}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};
