import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { StockDocument, DocType, DocStatus, DocItem } from '@/features/inventory/domain/stockDocument';
import { Product } from '@/features/product/domain/product';
import { Warehouse } from '@/features/inventory/domain/warehouse';
import { Supplier } from '@/features/purchase/domain/supplier';
import { DocStatusBadge } from '@/features/inventory/presentation/components/DocStatusBadge';
import { formatCurrency } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface Props {
  docType: DocType;
  existingDoc?: StockDocument | null;
  allProducts: Product[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  onSave: (doc: StockDocument) => void;
  onConfirmSave: (doc: StockDocument) => void;
  onBack: () => void;
  onAddProduct: () => void;
}

export const StockDocFormScreen: React.FC<Props> = ({
  docType,
  existingDoc = null,
  allProducts,
  warehouses,
  suppliers,
  onSave,
  onConfirmSave,
  onBack,
  onAddProduct,
}) => {
  const isEdit = !!existingDoc;
  const cfg = {
    receive: { titlePrefix: 'รับ', color: '#0f766e', bgColor: '#d1fae5', icon: 'arrow-down-circle-outline' as const },
    issue: { titlePrefix: 'เบิก', color: '#f87171', bgColor: '#fee2e2', icon: 'arrow-up-circle-outline' as const },
  }[docType];

  const [warehouseId] = useState<string>(existingDoc?.warehouseId ?? warehouses[0]?.id ?? '');
  const [toWarehouseId] = useState<string>(existingDoc?.toWarehouseId ?? warehouses.find(w => w.id !== warehouses[0]?.id)?.id ?? '');
  const [supplierId] = useState<string>(existingDoc?.supplierId ?? suppliers[0]?.id ?? '');
  const [remark, setRemark] = useState(existingDoc?.remark ?? '');
  const [date] = useState(existingDoc?.createdAt ?? new Date());
  const [items, setItems] = useState<DocItem[]>(existingDoc?.items ?? []);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
  const selectedToWarehouse = warehouses.find((w) => w.id === toWarehouseId);
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const totalItems = items.length;
  const totalQtyBase = items.reduce((sum, it) => sum + (it.qtyBase ?? 0), 0);
  const totalCost = items.reduce((sum, it) => sum + (it.costPrice ?? 0) * (it.qtyBase ?? 0), 0);

  const buildDoc = (status: DocStatus): StockDocument => ({
    id: existingDoc?.id ?? `tmp_${Date.now()}`,
    docNo: existingDoc?.docNo ?? '',
    revNo: existingDoc?.revNo ?? 0,
    docType,
    status,
    warehouseId,
    warehouseName: selectedWarehouse?.name ?? '',
    toWarehouseId,
    toWarehouseName: docType === 'issue' ? selectedToWarehouse?.name : undefined,
    supplierId,
    supplierName: selectedSupplier?.name ?? undefined,
    createdAt: date,
    createdBy: existingDoc?.createdBy ?? 'ผู้ใช้',
    updatedAt: new Date(),
    items,
    totalQtyBase,
    totalItems,
    totalCost,
    remark,
    originalDocId: existingDoc?.originalDocId,
    revisionHistory: existingDoc?.revisionHistory ?? [],
  });

  const showAlert = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogVisible(true);
  };

  const validate = (): boolean => {
    if (!warehouseId) {
      showAlert('กรุณาเลือกคลังต้นทาง', '');
      return false;
    }
    if (items.length === 0) {
      showAlert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ', '');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(buildDoc('draft'));
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirmSave(buildDoc('confirmed'));
  };

  const handleAddProduct = () => {
    const product = allProducts[items.length % allProducts.length];
    if (!product) {
      showAlert('ไม่พบสินค้าให้เพิ่ม', '');
      return;
    }

    const uom = product.uoms.find(item => item.isDefault) ?? product.uoms[0];
    const ratio = uom?.ratio ?? 1;
    const qty = 1;

    setItems(prev => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        uomId: uom?.id ?? 'base',
        unit: uom?.unit ?? product.unit,
        ratio,
        onHandQty: product.stockQty,
        qty,
        qtyBase: qty * ratio,
        costPrice: uom?.costPrice ?? product.costPrice,
      },
    ]);
    onAddProduct();
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <AlertDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title={dialogTitle}
        message={dialogMessage}
        variant="warning"
        onConfirm={() => setDialogVisible(false)}
      />

      <View className={cn('flex-row items-center gap-2 px-3 py-3')} style={{ backgroundColor: cfg.color }}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View className={cn('flex-1')}>
          <Text className={cn('text-lg font-extrabold text-white')}>
            {isEdit ? `แก้ไขเอกสาร${cfg.titlePrefix}สินค้า` : `สร้างเอกสาร${cfg.titlePrefix}สินค้า`}
          </Text>
          {isEdit && <Text className={cn('text-xs font-medium text-white/75')}>{existingDoc!.docNo}</Text>}
        </View>
        {isEdit && existingDoc && (
          <DocStatusBadge status={existingDoc.status} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName={cn('p-3 gap-3 pb-10')}>
        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>ข้อมูลคลังสินค้า</Text>

          <View className={cn('flex-row items-center gap-3')}>
            <View className={cn('w-9 h-9 rounded-lg items-center justify-center', cfg.bgColor)}>
              <Ionicons name="archive-outline" size={18} color={cfg.color} />
            </View>
            <View className={cn('flex-1')}>
              <Text className={cn('text-xs font-medium text-slate-500')}>คลัง{docType === 'receive' ? 'ปลายทาง' : 'ต้นทาง'}</Text>
              <Text className={cn('text-base font-bold text-slate-950')}>
                {selectedWarehouse?.name ?? '—'}
              </Text>
            </View>
          </View>

          {docType === 'issue' && (
            <View className={cn('flex-row items-center gap-3')}>
              <View className={cn('w-9 h-9 rounded-lg items-center justify-center bg-amber-100')}>
                <Ionicons name="arrow-forward-outline" size={18} color="#a16207" />
              </View>
              <View className={cn('flex-1')}>
                <Text className={cn('text-xs font-medium text-slate-500')}>คลังปลายทาง</Text>
                <Text className={cn('text-base font-bold text-slate-950')}>
                  {selectedToWarehouse?.name ?? '—'}
                </Text>
              </View>
            </View>
          )}

          {docType === 'receive' && (
            <View className={cn('flex-row items-center gap-3')}>
              <View className={cn('w-9 h-9 rounded-lg items-center justify-center bg-violet-100')}>
                <Ionicons name="business-outline" size={18} color="#6b21a8" />
              </View>
              <View className={cn('flex-1')}>
                <Text className={cn('text-xs font-medium text-slate-500')}>Supplier</Text>
                <Text className={cn('text-base font-bold text-slate-950')}>
                  {selectedSupplier?.name ?? '—'}
                </Text>
              </View>
            </View>
          )}

          <View className={cn('flex-row items-start gap-3')}>
            <View className={cn('w-9 h-9 rounded-lg items-center justify-center bg-[#f6f7fb]')}>
              <Ionicons name="chatbubble-outline" size={18} color="#57534e" />
            </View>
            <View className={cn('flex-1')}>
              <Text className={cn('text-xs font-medium text-slate-500 mb-[2px]')}>หมายเหตุ</Text>
              <TextInput
                className={cn('text-base font-medium text-slate-950 border-b border-slate-200 pb-1')}
                placeholder="ระบุหมายเหตุ (ถ้ามี)"
                placeholderTextColor="#9ca3af"
                value={remark}
                onChangeText={setRemark}
                multiline
              />
            </View>
          </View>
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <View className={cn('flex-row items-center justify-between')}>
            <Text className={cn('text-xs font-bold text-slate-950')}>รายการสินค้า ({items.length} รายการ)</Text>
            <TouchableOpacity
              className={cn('flex-row items-center gap-1 rounded-xl px-3 py-2')}
              style={{ backgroundColor: cfg.bgColor }}
              onPress={handleAddProduct}
            >
              <Ionicons name="add" size={16} color={cfg.color} />
              <Text className={cn('text-xs font-bold')} style={{ color: cfg.color }}>เพิ่มสินค้า</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View className={cn('items-center py-8 gap-2 border-2 border-dashed border-slate-200 rounded-xl')}>
              <Ionicons name="cube-outline" size={40} color="#d1d5db" />
              <Text className={cn('text-lg font-bold text-gray-300')}>ยังไม่มีรายการสินค้า</Text>
              <Text className={cn('text-xs font-medium text-gray-300')}>กด "เพิ่มสินค้า" เพื่อเลือกสินค้า</Text>
            </View>
          ) : (
            items.map((item, idx) => {
              const prod = allProducts.find((p) => p.id === item.productId);
              return (
                <View key={idx} className={cn('flex-row items-center gap-2 bg-[#f6f7fb] rounded-xl p-3')}>
                  <View className={cn('flex-1 gap-[2px]')}>
                    <Text className={cn('text-base font-bold text-slate-950')}>{prod?.name ?? 'ไม่พบสินค้า'}</Text>
                    <View className={cn('flex-row gap-3')}>
                      <Text className={cn('text-xs font-medium text-slate-500')}>จำนวน: <Text className={cn('font-bold text-slate-950')}>{item.qtyBase} {prod?.unit ?? 'หน่วย'}</Text></Text>
                      {docType === 'receive' && item.costPrice !== undefined && (
                        <Text className={cn('text-xs font-medium text-slate-500')}>ราคาทุน: <Text className={cn('font-bold text-rose-600')}>฿{formatCurrency(item.costPrice)}</Text></Text>
                      )}
                    </View>
                    <View className={cn('flex-row gap-3')}>
                      {prod?.barcode && <Text className={cn('text-xs font-medium text-slate-500')}>Barcode: {prod.barcode}</Text>}
                    </View>
                  </View>
                  <TouchableOpacity className={cn('p-2')} onPress={() => removeItem(idx)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        <View className={cn('bg-white rounded-2xl p-3 gap-2 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>สรุป</Text>
          <View className={cn('flex-row justify-between')}>
            <Text className={cn('text-base font-medium text-slate-500')}>จำนวนรายการ</Text>
            <Text className={cn('text-base font-bold text-slate-950')}>{totalItems}</Text>
          </View>
          <View className={cn('flex-row justify-between')}>
            <Text className={cn('text-base font-medium text-slate-500')}>จำนวนรวม (หน่วยฐาน)</Text>
            <Text className={cn('text-base font-bold text-slate-950')}>{totalQtyBase}</Text>
          </View>
          {docType === 'receive' && (
            <View className={cn('flex-row justify-between')}>
              <Text className={cn('text-base font-medium text-slate-500')}>มูลค่ารวม</Text>
              <Text className={cn('text-xl font-extrabold text-rose-600')}>฿{formatCurrency(totalCost)}</Text>
            </View>
          )}
        </View>

        <View className={cn('gap-3')}>
          <TouchableOpacity
            className={cn('flex-row items-center justify-center gap-2 rounded-xl py-3 bg-emerald-500 shadow-lg shadow-emerald-500/40')}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color="#fafafa" />
            <Text className={cn('text-base font-bold text-white')}>
              {isEdit ? 'บันทึกและยืนยันเอกสาร' : 'สร้างและยืนยันเอกสาร'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={cn('flex-row items-center justify-center gap-2 rounded-xl py-3 bg-rose-500 shadow-lg shadow-rose-500/40')}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Ionicons name="save-outline" size={22} color="#fafafa" />
            <Text className={cn('text-base font-bold text-white')}>บันทึกแบบร่าง</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={cn('flex-row items-center justify-center gap-2 rounded-xl py-3 border border-slate-200 bg-white')}
            onPress={onBack}
            activeOpacity={0.85}
          >
            <Ionicons name="close-outline" size={22} color="#57534e" />
            <Text className={cn('text-base font-bold text-slate-950')}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
