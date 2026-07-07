import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from '@/shared/tw/index';

import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { PromoGenericTable, TableColumn, TableRow } from '@/features/promotion/presentation/screens/components/PromoGenericTable';

export interface DiscountProduct {
  id: string;
  code: string;
  name: string;
  unit: string;
  condition: string;
  qty: string;
  promoGroupName: string;
  discountPerUnit: string;
  discountPercent: string;
  discount: string;
  discountBill: boolean;
  salePrice: string;
}

export interface FreeProduct {
  id: string;
  code: string;
  name: string;
  unit: string;
  condition: string;
  qty: string;
}

interface Props {
  promoType: string;
  headerDiscount: boolean;
  onToggleHeaderDiscount: () => void;
  headerDiscountAmount: string;
  headerDiscountPercent: string;
  onHeaderDiscountAmountChange: (v: string) => void;
  onHeaderDiscountPercentChange: (v: string) => void;
  discountProducts: DiscountProduct[];
  onOpenDiscountProductModal: () => void;
  onRemoveDiscountProduct: (id: string) => void;
  onUpdateDiscountProduct: (id: string, field: keyof DiscountProduct, value: string | boolean) => void;
  freebieProducts: FreeProduct[];
  onOpenFreebieModal: () => void;
  onRemoveFreebieProduct: (id: string) => void;
  promoGroup: string;
  onOpenPromoGroupPicker: () => void;
  onOpenExcludedDiscountModal: () => void;
  rewardPoints: string;
  onRewardPointsChange: (v: string) => void;
}

export const PromoRewardSection: React.FC<Props> = (props) => {
  const isPointType = props.promoType === 'รับคะแนน, ของกำนัล';
  const isExchangeType = props.promoType === 'คะแนนแลกสินค้า, ส่วนลด' || props.promoType === 'ใช้คะแนนชำระ';

  const discountCols: TableColumn[] = [
    { label: 'ลำดับ', width: 40 },
    { label: 'สินค้า', width: 70 },
    { label: 'ชื่อสินค้า', width: 120 },
    { label: 'หน่วย', width: 50 },
    { label: 'เงื่อนไข', width: 60 },
    { label: 'จำนวน', width: 60 },
    { label: 'ส่วนลด/หน่วย', width: 80 },
    { label: '%ส่วนลด', width: 70 },
    { label: 'ส่วนลด', width: 70 },
    { label: 'มูลค่าขาย', width: 80 },
  ];

  const discountRows: TableRow[] = props.discountProducts.map((p, i) => ({
    id: p.id,
    cells: [
      i + 1, p.code, p.name, p.unit, p.condition || '-', p.qty,
      p.discountPerUnit || '0', p.discountPercent || '0', p.discount || '0', p.salePrice || '0',
    ],
  }));

  const freebieCols: TableColumn[] = [
    { label: 'ลำดับ', width: 40 },
    { label: 'รหัส', width: 70 },
    { label: 'ชื่อสินค้า', width: 140 },
    { label: 'หน่วย', width: 60 },
    { label: 'จำนวน', width: 60 },
  ];

  const freebieRows: TableRow[] = props.freebieProducts.map((p, i) => ({
    id: p.id,
    cells: [i + 1, p.code, p.name, p.unit, p.qty],
  }));

  return (
    <View>
      <Text className={cn('text-lg font-semibold text-slate-950 mb-3')}>3) รางวัล/ส่วนลด</Text>

      {isPointType && (
        <View>
          <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>คะแนนที่ได้รับ</Text>
          <TextInput
            className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base text-slate-950 bg-white flex-row items-center justify-between min-h-[44px]')}
            value={props.rewardPoints}
            onChangeText={props.onRewardPointsChange}
            placeholder="0"
            placeholderTextColor="#57534e"
            keyboardType="numeric"
          />
        </View>
      )}

      {!isPointType && (
        <View>
          <TouchableOpacity className={cn('flex-row items-center mt-2 gap-2')} onPress={props.onToggleHeaderDiscount}>
            <Ionicons
              name={props.headerDiscount ? 'checkbox' : 'square-outline'}
              size={20}
              color={props.headerDiscount ? '#f87171' : '#9ca3af'}
            />
            <Text className={cn('text-base text-slate-950')}>ส่วนลดหัวบิล</Text>
          </TouchableOpacity>

          {props.headerDiscount && (
            <View>
              <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>จำนวนเงินส่วนลดหัวบิล (บาท)</Text>
              <TextInput
                className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base text-slate-950 bg-white flex-row items-center justify-between min-h-[44px]')}
                value={props.headerDiscountAmount}
                onChangeText={props.onHeaderDiscountAmountChange}
                placeholder="0.00"
                keyboardType="numeric"
              />
              <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-2')}>หรือ % ส่วนลดหัวบิล</Text>
              <TextInput
                className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base text-slate-950 bg-white flex-row items-center justify-between min-h-[44px]')}
                value={props.headerDiscountPercent}
                onChangeText={props.onHeaderDiscountPercentChange}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          )}

          <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-3')}>กลุ่มสินค้าโปรโมชั่น (ส่วนลด)</Text>
          <TouchableOpacity className={cn('border border-slate-200 rounded-xl px-3 py-[10px] text-base bg-white flex-row items-center justify-between min-h-[44px]')} onPress={props.onOpenPromoGroupPicker}>
            <Text className={cn('text-base flex-1', !props.promoGroup ? 'text-slate-500' : 'text-slate-950')}>
              {props.promoGroup || 'เลือกกลุ่มสินค้า'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 px-3 py-2 rounded-xl self-start mt-2')} onPress={props.onOpenDiscountProductModal}>
            <Ionicons name="add-circle-outline" size={18} color="#fafafa" />
            <Text className={cn('text-base text-white font-medium')}>เลือกสินค้า</Text>
          </TouchableOpacity>

          <PromoGenericTable columns={discountCols} rows={discountRows} onRemove={props.onRemoveDiscountProduct} />

          <Text className={cn('text-xs font-semibold text-slate-500 mb-1 mt-3')}>สินค้าไม่ร่วมรายการ (ส่วนลด)</Text>
          <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 px-3 py-2 rounded-xl self-start mt-2')} onPress={props.onOpenExcludedDiscountModal}>
            <Ionicons name="remove-circle-outline" size={18} color="#fafafa" />
            <Text className={cn('text-base text-white font-medium')}>เลือกสินค้าที่ไม่ร่วมส่วนลด</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        <Text className={cn('text-xs font-semibold text-slate-950 font-semibold mb-2')}>ของแถม (ส่วนลด 100%)</Text>
        <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 px-3 py-2 rounded-xl self-start mt-2')} onPress={props.onOpenFreebieModal}>
          <Ionicons name="add-circle-outline" size={18} color="#fafafa" />
          <Text className={cn('text-base text-white font-medium')}>เลือกสินค้าของแถม</Text>
        </TouchableOpacity>
        <PromoGenericTable columns={freebieCols} rows={freebieRows} onRemove={props.onRemoveFreebieProduct} />
      </View>
    </View>
  );
};
