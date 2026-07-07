import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { usePurchaseStore } from '@/features/purchase/application/stores/purchaseStore';
import { PurchaseRequisition, PRStatus } from '@/features/purchase/domain/purchase';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

interface Props {
  onBack?: () => void;
}

type TabFilter = 'all' | 'draft' | 'approved';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'แบบร่าง', color: '#4b5563', bg: '#e5e7eb' },
  submitted: { label: 'ส่งแล้ว', color: '#a16207', bg: '#fed7aa' },
  approved: { label: 'อนุมัติ', color: '#0f766e', bg: '#d1fae5' },
  rejected: { label: 'ปฏิเสธ', color: '#ef4444', bg: '#ffe4e6' },
  converted: { label: 'แปลงแล้ว', color: '#0284c7', bg: '#e0f2fe' },
};

export const PRScreen: React.FC<Props> = ({ onBack }) => {
  const { requisitions } = usePurchaseStore();
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return requisitions;
    return requisitions.filter((pr) => pr.status === activeTab);
  }, [requisitions, activeTab]);

  const showAlert = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogVisible(true);
  };

  const handleCreate = () => {
    showAlert('สร้าง PR', 'ฟีเจอร์สร้างใบขอซื้อจะพร้อมใช้งานเร็วๆ นี้');
  };

  const handleTapPR = (pr: PurchaseRequisition) => {
    const itemsList = pr.items.map((i) => `• ${i.productName} x${i.requestQty} ${i.unit}`).join('\n');
    showAlert(
      pr.prNo,
      `สถานะ: ${STATUS_CONFIG[pr.status]?.label ?? pr.status}\nเหตุผล: ${pr.reason}\nผู้ขอ: ${pr.requestedBy}\n\nรายการ:\n${itemsList}`,
    );
  };

  const renderPR = ({ item: pr }: { item: PurchaseRequisition }) => {
    const cfg = STATUS_CONFIG[pr.status] ?? STATUS_CONFIG.draft;
    const date = new Date(pr.requestedAt).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: '2-digit',
    });

    return (
      <TouchableOpacity
        className={cn('bg-white rounded-2xl p-3 gap-2 shadow-sm')}
        onPress={() => handleTapPR(pr)} activeOpacity={0.8}
      >
        <View className={cn('flex-row items-center gap-2')}>
          <View className={cn('w-11 h-11 rounded-xl bg-amber-100 items-center justify-center')}>
            <Ionicons name="document-text-outline" size={22} color="#a16207" />
          </View>
          <View className={cn('flex-1')}>
            <Text className={cn('text-xs font-bold text-slate-950')}>{pr.prNo}</Text>
            <Text className={cn('text-xs font-medium text-slate-500')}>{date}</Text>
          </View>
          <View className={cn('rounded-full px-2 py-[3px]')} style={{ backgroundColor: cfg.bg }}>
            <Text className={cn('text-[11px] font-bold')} style={{ color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>

        <View className={cn('gap-[3px]', 'pl-14')}>
          <View className={cn('flex-row items-center gap-[5px]')}>
            <Ionicons name="chatbubble-outline" size={13} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-950')} numberOfLines={1}>{pr.reason}</Text>
          </View>
          <View className={cn('flex-row items-center gap-[5px]')}>
            <Ionicons name="person-outline" size={13} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-950')}>{pr.requestedBy}</Text>
          </View>
        </View>

        <View className={cn('flex-row items-center pt-1 border-t border-slate-200')}>
          <View className={cn('flex-row items-center gap-[3px]')}>
            <Ionicons name="list-outline" size={12} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-500')}>{pr.items.length} รายการ</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'draft', label: 'Draft' },
    { key: 'approved', label: 'Approved' },
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
          <Text className={cn('text-lg font-extrabold text-white')}>ใบขอซื้อ (PR)</Text>
          <Text className={cn('text-xs font-medium text-white/75')}>Purchase Requisition · {requisitions.length} รายการ</Text>
        </View>
        <TouchableOpacity
          className={cn('flex-row items-center gap-1 bg-white/20 rounded-xl px-2 py-1 border border-white/40')}
          onPress={handleCreate}
        >
          <Ionicons name="add" size={18} color="#fafafa" />
          <Text className={cn('text-xs font-bold text-white')}>สร้าง PR</Text>
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
        keyExtractor={(pr) => pr.id}
        renderItem={renderPR}
        contentContainerClassName={cn('px-3 py-3 gap-2')}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center py-20 gap-4')}>
            <Ionicons name="document-text-outline" size={56} color="#d1d5db" />
            <Text className={cn('text-xl font-bold text-gray-400')}>ไม่มีใบขอซื้อ</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
