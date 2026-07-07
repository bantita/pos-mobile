import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog, AppButton, AppModal } from '@/shared/ui/index';
import { cn } from '@/shared/lib/cn';
import { formatCurrency } from '@/shared/lib/format';
import React, { useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '@/features/sale/application/stores/cartStore';

interface CartScreenProps {
  onCheckout: () => void;
  onBack: () => void;
  onDiscount: () => void;
  onHoldBill: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({ onCheckout, onBack, onDiscount, onHoldBill }) => {
  const { items, removeItem, updateQty, getItemCount, getGrandTotal, clearCart } = useCartStore();
  type CartItem = (typeof items)[number];
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteTarget, setNoteTarget] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

  const itemCount = getItemCount();
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const discountTotal = 0;
  const grandTotal = getGrandTotal();

  const handleSaveNote = () => {
    setShowNoteModal(false);
    setNoteText('');
  };

  const CartSummary = useMemo(() => (
    <View className="border-t border-slate-100 bg-white px-5 pb-6 pt-4 shadow-lg" style={{ boxShadow: '0 18px 48px rgba(15, 23, 42, 0.14)' }}>
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-bold text-slate-500">รวม ({itemCount} รายการ)</Text>
          <Text className="text-sm font-bold text-slate-900">฿{formatCurrency(subtotal)}</Text>
        </View>
        {discountTotal > 0 && (
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-emerald-600">ส่วนลด</Text>
            <Text className="text-sm font-bold text-emerald-600">-฿{formatCurrency(discountTotal)}</Text>
          </View>
        )}
        <View className="my-1 h-px bg-slate-100" />
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-extrabold text-slate-950">ยอดรวมทั้งสิ้น</Text>
          <Text className="text-xl font-extrabold text-rose-600">฿{formatCurrency(grandTotal)}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        <TouchableOpacity className="min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200" onPress={onHoldBill}>
          <Text className="text-sm font-bold text-slate-700">พักบิล</Text>
        </TouchableOpacity>
        <TouchableOpacity className="min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200" onPress={onDiscount}>
          <Text className="text-sm font-bold text-slate-700">ส่วนลด</Text>
        </TouchableOpacity>
        <AppButton label="ชำระเงิน" onPress={onCheckout} variant="success" size="lg" fullWidth style={{ flex: 2 }} />
      </View>
    </View>
  ), [itemCount, subtotal, discountTotal, grandTotal, onCheckout, onDiscount, onHoldBill]);

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={onBack} className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
            <Ionicons name="chevron-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-lg font-extrabold text-slate-950">ตะกร้าสินค้า</Text>
        </View>
        {itemCount > 0 && (
          <TouchableOpacity className="min-h-10 flex-row items-center gap-1 rounded-full bg-rose-50 px-4 py-2" onPress={() => setShowClearConfirm(true)}>
            <Ionicons name="trash-outline" size={14} color="#e11d48" />
            <Text className="text-xs font-bold text-rose-600">ล้างทั้งหมด</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cart Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id + (item.technicianId ?? '')}
        contentContainerClassName="p-4 pb-4"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center gap-4 py-20">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-rose-50">
              <Ionicons name="cart-outline" size={40} color="#e11d48" />
            </View>
            <Text className="text-base font-bold text-slate-400">ยังไม่มีสินค้าในตะกร้า</Text>
            <TouchableOpacity className="rounded-xl bg-rose-500 px-6 py-3" onPress={onBack}>
              <Text className="text-sm font-bold text-white">เลือกสินค้า</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={itemCount > 0 ? CartSummary : null}
        renderItem={({ item }) => {
          const p = item.product;
          return (
          <View className="mb-3 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <View className="flex-row gap-3 p-4">
              {/* Thumb */}
              <View className="h-16 w-16 items-center justify-center rounded-xl bg-rose-50">
                <Ionicons name="cube-outline" size={28} color="#e11d48" />
              </View>

              {/* Info */}
              <View className="flex-1 gap-1">
                <Text className="text-sm font-bold text-slate-950" numberOfLines={2}>{p.name}</Text>
                <Text className="text-xs font-bold text-slate-500">
                  ฿{formatCurrency(p.price)} / {p.unit}
                </Text>
                {item.technicianName && (
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="person-outline" size={12} color="#7c3aed" />
                    <Text className="text-xs font-bold text-violet-600">{item.technicianName}</Text>
                  </View>
                )}
              </View>

              {/* Qty Controls */}
              <View className="items-end gap-1">
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    className="h-10 w-10 items-center justify-center rounded-lg bg-slate-100"
                    onPress={() => item.qty > 1 ? updateQty(p.id, item.qty - 1) : setShowRemoveConfirm(p.id)}
                  >
                    <Ionicons name="remove" size={18} color="#64748b" />
                  </TouchableOpacity>
                  <Text className="min-w-[32px] text-center text-sm font-extrabold text-slate-950">{item.qty}</Text>
                  <TouchableOpacity
                    className="h-10 w-10 items-center justify-center rounded-lg bg-rose-50"
                    onPress={() => updateQty(p.id, item.qty + 1)}
                  >
                    <Ionicons name="add" size={18} color="#e11d48" />
                  </TouchableOpacity>
                </View>
                <Text className="text-sm font-extrabold text-rose-600">฿{formatCurrency(p.price * item.qty)}</Text>
              </View>
            </View>

            {/* Action row */}
            <View className="flex-row border-t border-slate-50 px-4 py-2">
              <TouchableOpacity
                className="min-h-10 flex-row items-center gap-1 rounded-lg px-3 py-2"
                onPress={() => { setNoteTarget(p.id); setShowNoteModal(true); }}
              >
                <Ionicons name="document-text-outline" size={14} color="#64748b" />
                <Text className="text-xs font-bold text-slate-500">เพิ่มโน๊ต</Text>
              </TouchableOpacity>
              <View className="flex-1" />
              <TouchableOpacity className="min-h-10 flex-row items-center gap-1 rounded-lg px-3 py-2" onPress={() => setShowRemoveConfirm(p.id)}>
                <Ionicons name="trash-outline" size={14} color="#e11d48" />
                <Text className="text-xs font-bold text-rose-600">ลบ</Text>
              </TouchableOpacity>
            </View>
          </View>
          );
        }}
      />

      {/* Alert: Clear Cart */}
      <AlertDialog
        visible={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="ล้างตะกร้าสินค้า"
        message="คุณแน่ใจหรือไม่ที่จะลบสินค้าทั้งหมดในตะกร้า?"
        variant="danger"
        confirmLabel="ลบทั้งหมด"
        cancelLabel="ยกเลิก"
        onConfirm={clearCart}
        onCancel={() => {}}
      />

      {/* Alert: Remove Item */}
      <AlertDialog
        visible={!!showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(null)}
        title="ลบสินค้า"
        message="คุณแน่ใจหรือไม่ที่จะลบสินค้านี้ออกจากตะกร้า?"
        variant="warning"
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        onConfirm={() => { if (showRemoveConfirm) removeItem(showRemoveConfirm); }}
        onCancel={() => {}}
      />

      {/* Note Modal */}
      <AppModal visible={showNoteModal} onClose={() => setShowNoteModal(false)} title="เพิ่มโน๊ต" size="sm">
        <TextInput
          className="min-h-[100px] rounded-xl border border-slate-200 bg-[#f6f7fb] p-3 text-sm font-bold text-slate-900"
          placeholder="พิมพ์โน๊ต..."
          placeholderTextColor="#94a3b8"
          value={noteText}
          onChangeText={setNoteText}
          multiline
          textAlignVertical="top"
        />
        <View className="mt-4 flex-row gap-3">
          <TouchableOpacity className="min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-200" onPress={() => setShowNoteModal(false)}>
            <Text className="text-sm font-bold text-slate-700">ยกเลิก</Text>
          </TouchableOpacity>
          <TouchableOpacity className="min-h-10 flex-1 items-center justify-center rounded-xl bg-rose-500" onPress={handleSaveNote}>
            <Text className="text-sm font-bold text-white">บันทึก</Text>
          </TouchableOpacity>
        </View>
      </AppModal>
    </SafeAreaView>
  );
};
