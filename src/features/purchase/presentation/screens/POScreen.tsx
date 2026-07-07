import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { usePurchaseStore } from '@/features/purchase/application/stores/purchaseStore';
import { PurchaseOrder, POStatus } from '@/features/purchase/domain/purchase';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

interface Props {
  onBack?: () => void;
}

type TabFilter = 'draft' | 'approved' | 'partial_receive' | 'completed';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'แบบร่าง', color: '#4b5563', bg: '#e5e7eb' },
  approved: { label: 'อนุมัติ', color: '#0f766e', bg: '#d1fae5' },
  partial_receive: { label: 'รับบางส่วน', color: '#a16207', bg: '#fed7aa' },
  completed: { label: 'เสร็จสิ้น', color: '#0284c7', bg: '#e0f2fe' },
  cancelled: { label: 'ยกเลิก', color: '#ef4444', bg: '#ffe4e6' },
};

const formatCurrency = (n: number) =>
  n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const POScreen: React.FC<Props> = ({ onBack }) => {
  const { purchaseOrders } = usePurchaseStore();
  const [activeTab, setActiveTab] = useState<TabFilter>('approved');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  const filtered = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === activeTab);
  }, [purchaseOrders, activeTab]);

  const showAlert = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogVisible(true);
  };

  const handleCreate = () => {
    showAlert('สร้าง PO', 'ฟีเจอร์สร้างใบสั่งซื้อจะพร้อมใช้งานเร็วๆ นี้');
  };

  const handleTapPO = (po: PurchaseOrder) => {
    const itemsList = po.items
      .map((i) => `• ${i.productName} x${i.orderQty} ${i.unit} (รับแล้ว ${i.receivedQty})`)
      .join('\n');
    showAlert(
      po.poNo,
      `Supplier: ${po.supplierName}\nสถานะ: ${STATUS_CONFIG[po.status]?.label ?? po.status}\nยอดรวม: ฿${formatCurrency(po.grandTotal)}\nกำหนดส่ง: ${po.deliveryDate}\n\nรายการ:\n${itemsList}`,
    );
  };

  const renderPO = ({ item: po }: { item: PurchaseOrder }) => {
    const cfg = STATUS_CONFIG[po.status] ?? STATUS_CONFIG.draft;
    const date = po.deliveryDate
      ? new Date(po.deliveryDate).toLocaleDateString('th-TH', {
          day: 'numeric', month: 'short', year: '2-digit',
        })
      : '-';

    return (
      <TouchableOpacity
        className={cn('bg-white rounded-2xl p-3 gap-2 shadow-sm')}
        onPress={() => handleTapPO(po)} activeOpacity={0.8}
      >
        <View className={cn('flex-row items-center gap-2')}>
          <View className={cn('w-11 h-11 rounded-xl bg-emerald-100 items-center justify-center')}>
            <Ionicons name="cart-outline" size={22} color="#0f766e" />
          </View>
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-bold text-slate-950')}>{po.poNo}</Text>
            <Text className={cn('text-xs font-medium text-slate-500')} numberOfLines={1}>{po.supplierName}</Text>
          </View>
          <View className={cn('rounded-full px-2 py-[3px]')} style={{ backgroundColor: cfg.bg }}>
            <Text className={cn('text-[11px] font-bold')} style={{ color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>

        <View className={cn('gap-[3px]', 'pl-14')}>
          <View className={cn('flex-row items-center gap-[5px]')}>
            <Ionicons name="cash-outline" size={13} color="#f87171" />
            <Text className={cn('text-xs font-bold text-rose-600')}>
              ฿{formatCurrency(po.grandTotal)}
            </Text>
          </View>
          <View className={cn('flex-row items-center gap-[5px]')}>
            <Ionicons name="calendar-outline" size={13} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-950')}>กำหนดส่ง: {date}</Text>
          </View>
        </View>

        <View className={cn('flex-row items-center gap-4 pt-1 border-t border-slate-200')}>
          <View className={cn('flex-row items-center gap-[3px]')}>
            <Ionicons name="list-outline" size={12} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-500')}>{po.items.length} รายการ</Text>
          </View>
          <View className={cn('flex-row items-center gap-[3px]')}>
            <Ionicons name="cube-outline" size={12} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-500')}>
              {po.items.reduce((sum, i) => sum + i.receivedQty, 0)}/{po.items.reduce((sum, i) => sum + i.orderQty, 0)} หน่วย
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'draft', label: 'Draft' },
    { key: 'approved', label: 'Approved' },
    { key: 'partial_receive', label: 'Partial' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <SafeAreaView className={cn('flex-1', 'bg-rose-50')} edges={['top']}>
      <AlertDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title={dialogTitle}
        message={dialogMessage}
        variant="info"
        onConfirm={() => setDialogVisible(false)}
      />

      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3')}>
        {onBack && (
          <TouchableOpacity onPress={onBack} className={cn('p-1')}>
            <Ionicons name="arrow-back" size={24} color="#fafafa" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>ใบสั่งซื้อ (PO)</Text>
          <Text className={cn('text-xs font-medium text-white/75')}>Purchase Order · {purchaseOrders.length} รายการ</Text>
        </View>
        <TouchableOpacity
          className={cn('flex-row items-center gap-1 bg-white/20 rounded-xl px-2 py-1 border border-white/40')}
          onPress={handleCreate}
        >
          <Ionicons name="add" size={18} color="#fafafa" />
          <Text className={cn('text-xs font-bold text-white')}>สร้าง PO</Text>
        </TouchableOpacity>
      </View>

      <View className={cn('flex-row bg-white border-b border-slate-200')}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            className={cn('flex-1 items-center py-2 border-b-[2.5px]', activeTab === t.key ? 'border-b-rose-500' : 'border-transparent')}
            onPress={() => setActiveTab(t.key)}
          >
            <Text className={cn('text-xs font-bold text-slate-500', activeTab === t.key && 'text-rose-600 font-bold')}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(po) => po.id}
        renderItem={renderPO}
        contentContainerClassName={cn('px-3 py-3 gap-2')}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center py-20 gap-4')}>
            <Ionicons name="cart-outline" size={56} color="#d1d5db" />
            <Text className={cn('text-xl font-bold text-gray-400')}>ไม่มีใบสั่งซื้อในสถานะนี้</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
