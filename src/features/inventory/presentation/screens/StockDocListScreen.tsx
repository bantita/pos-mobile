import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput } from '@/shared/tw/index';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { StockDocument, DocType, DocStatus } from '@/features/inventory/domain/stockDocument';
import { useStockDocStore } from '@/features/inventory/application/stores/stockDocStore';
import { DocStatusBadge } from '@/features/inventory/presentation/components/DocStatusBadge';
import { formatCurrency, formatDateTime } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface Props {
  docType: DocType;
  onCreateNew: () => void;
  onOpenDoc: (doc: StockDocument) => void;
  onBack: () => void;
}

const TYPE_CONFIG = {
  receive: {
    title: 'เอกสารรับสินค้า',
    color: '#0f766e',
    bgColor: '#d1fae5',
    icon: 'arrow-down-circle-outline',
    prefix: 'RCV',
    emptyText: 'ยังไม่มีเอกสารรับสินค้า',
  },
  issue: {
    title: 'เอกสารเบิกสินค้า',
    color: '#f87171',
    bgColor: '#fee2e2',
    icon: 'arrow-up-circle-outline',
    prefix: 'ISS',
    emptyText: 'ยังไม่มีเอกสารเบิกสินค้า',
  },
};

export const StockDocListScreen: React.FC<Props> = ({ docType, onCreateNew, onOpenDoc, onBack }) => {
  const { getDocsByType, cancelDocument } = useStockDocStore();
  const cfg = TYPE_CONFIG[docType];
  const allDocs = getDocsByType(docType);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'all'>('all');
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<StockDocument | null>(null);
  const [alertDialog, setAlertDialog] = useState({ visible: false, title: '', message: '' });

  const filtered = useMemo(() => {
    return allDocs.filter((d) => {
      const matchSearch = !search ||
        d.docNo.toLowerCase().includes(search.toLowerCase()) ||
        (d.supplierName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (d.toWarehouseName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        d.warehouseName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [allDocs, search, statusFilter]);

  const counts = {
    all: allDocs.length,
    draft: allDocs.filter(d => d.status === 'draft').length,
    confirmed: allDocs.filter(d => d.status === 'confirmed').length,
    cancelled: allDocs.filter(d => d.status === 'cancelled').length,
  };

  const handleCancel = (doc: StockDocument) => {
    if (doc.status !== 'draft') {
      setAlertDialog({
        visible: true,
        title: 'ไม่สามารถยกเลิกได้',
        message: 'ยกเลิกได้เฉพาะเอกสารที่เป็น "แบบร่าง" เท่านั้น',
      });
      return;
    }
    setCancelTarget(doc);
    setCancelDialogVisible(true);
  };

  const confirmCancel = () => {
    if (cancelTarget) {
      cancelDocument(cancelTarget.id);
      setCancelTarget(null);
    }
  };

  const renderDoc = ({ item: doc }: { item: StockDocument }) => (
    <TouchableOpacity
      className={cn('bg-white rounded-2xl p-3 gap-2 shadow-sm')}
      onPress={() => onOpenDoc(doc)}
      activeOpacity={0.8}
    >
      <View className={cn('flex-row items-center gap-2')}>
        <View className={cn('w-11 h-11 rounded-xl items-center justify-center')} style={{ backgroundColor: cfg.bgColor }}>
          <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
        </View>
        <View className={cn('flex-1')}>
          <Text className={cn('text-xs font-bold text-slate-950')}>{doc.docNo}</Text>
          <Text className={cn('text-xs font-medium text-slate-500')}>{formatDateTime(doc.createdAt)}</Text>
        </View>
        <DocStatusBadge status={doc.status} />
      </View>

      <View className={cn('gap-[3px]')}>
        <View className={cn('flex-row items-center gap-[5px]')}>
          <Ionicons name="archive-outline" size={13} color="#57534e" />
          <Text className={cn('text-xs font-medium text-slate-950')}>{doc.warehouseName}</Text>
          {doc.toWarehouseName && (
            <>
              <Ionicons name="arrow-forward" size={11} color="#9ca3af" />
              <Text className={cn('text-xs font-medium text-slate-950')}>{doc.toWarehouseName}</Text>
            </>
          )}
        </View>
        {doc.supplierName && (
          <View className={cn('flex-row items-center gap-[5px]')}>
            <Ionicons name="business-outline" size={13} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-950')}>{doc.supplierName}</Text>
          </View>
        )}
        {doc.remark ? (
          <View className={cn('flex-row items-center gap-[5px]')}>
            <Ionicons name="chatbubble-outline" size={13} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-950')} numberOfLines={1}>{doc.remark}</Text>
          </View>
        ) : null}
      </View>

      <View className={cn('flex-row items-center justify-between pt-1 border-t border-slate-200')}>
        <View className={cn('flex-row gap-3')}>
          <View className={cn('flex-row items-center gap-[3px]')}>
            <Ionicons name="list-outline" size={12} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-500')}>{doc.totalItems} รายการ</Text>
          </View>
          <View className={cn('flex-row items-center gap-[3px]')}>
            <Ionicons name="cube-outline" size={12} color="#57534e" />
            <Text className={cn('text-xs font-medium text-slate-500')}>{doc.totalQtyBase} หน่วย</Text>
          </View>
          {docType === 'receive' && doc.totalCost > 0 && (
            <View className={cn('flex-row items-center gap-[3px]')}>
              <Ionicons name="cash-outline" size={12} color="#f87171" />
              <Text className={cn('text-xs font-bold text-rose-600')}>
                ฿{formatCurrency(doc.totalCost)}
              </Text>
            </View>
          )}
        </View>

        <View className={cn('flex-row items-center gap-2')}>
          {doc.status === 'draft' && (
            <>
              <TouchableOpacity
                className={cn('flex-row items-center gap-1 rounded-lg px-2 py-[5px]')}
                style={{ backgroundColor: cfg.bgColor }}
                onPress={() => onOpenDoc(doc)}
              >
                <Ionicons name="pencil-outline" size={14} color={cfg.color} />
                <Text className={cn('text-xs font-bold')} style={{ color: cfg.color }}>แก้ไข</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={cn('flex-row items-center gap-1 rounded-lg px-2 py-[5px] bg-rose-50')}
                onPress={() => handleCancel(doc)}
              >
                <Ionicons name="close-outline" size={14} color="#ef4444" />
                <Text className={cn('text-xs font-bold text-rose-600')}>ยกเลิก</Text>
              </TouchableOpacity>
            </>
          )}
          {doc.status === 'confirmed' && (
            <TouchableOpacity
              className={cn('flex-row items-center gap-1 rounded-lg px-2 py-[5px] bg-neutral-100')}
              onPress={() => onOpenDoc(doc)}
            >
              <Ionicons name="eye-outline" size={14} color="#57534e" />
              <Text className={cn('text-xs font-bold text-slate-500')}>ดู</Text>
            </TouchableOpacity>
          )}
          <View className={cn('flex-row items-center gap-[3px]')}>
            <Ionicons name="person-outline" size={11} color="#9ca3af" />
            <Text className={cn('text-xs font-medium text-gray-400')}>{doc.createdBy}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className={cn('flex-1', 'bg-[#f6f7fb]')} edges={['top']}>
      <ConfirmModal
        visible={cancelDialogVisible}
        onClose={() => { setCancelDialogVisible(false); setCancelTarget(null); }}
        title="ยืนยันยกเลิก"
        message={cancelTarget ? `ต้องการยกเลิกเอกสาร ${cancelTarget.docNo}?` : ''}
        variant="danger"
        confirmLabel="ยกเลิกเอกสาร"
        onConfirm={confirmCancel}
      />

      <AlertDialog
        visible={alertDialog.visible}
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant="warning"
        onConfirm={() => setAlertDialog({ visible: false, title: '', message: '' })}
      />

      <View className={cn('flex-row items-center gap-2 px-3 py-3')} style={{ backgroundColor: cfg.color }}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View className={cn('flex-1')}>
          <Text className={cn('text-lg font-extrabold text-white')}>{cfg.title}</Text>
          <Text className={cn('text-xs font-medium text-white/75')}>{counts.all} เอกสาร</Text>
        </View>
        <TouchableOpacity className={cn('flex-row items-center gap-1 rounded-xl px-4 py-2.5 border min-h-10')}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)' }}
          onPress={onCreateNew}>
          <Ionicons name="add" size={20} color="#fafafa" />
          <Text className={cn('text-xs font-bold text-white')}>สร้างใหม่</Text>
        </TouchableOpacity>
      </View>

      <View className={cn('flex-row bg-white border-b border-slate-200')}>
        {[
          { key: 'all',       label: 'ทั้งหมด', count: counts.all,       color: '#292524' },
          { key: 'draft',     label: 'แบบร่าง', count: counts.draft,     color: '#a16207' },
          { key: 'confirmed', label: 'ยืนยัน',  count: counts.confirmed, color: '#0f766e' },
          { key: 'cancelled', label: 'ยกเลิก',  count: counts.cancelled, color: '#ef4444' },
        ].map((s) => (
          <TouchableOpacity
            key={s.key}
            className={cn('flex-1 items-center py-2 border-b-2 border-transparent')}
            style={statusFilter === s.key ? { borderBottomColor: s.color, borderBottomWidth: 2.5 } : {}}
            onPress={() => setStatusFilter(s.key as any)}
          >
            <Text className={cn('text-xl font-extrabold')} style={{ color: s.color }}>{s.count}</Text>
            <Text className={cn('text-xs font-medium text-slate-500')}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className={cn('px-3 pb-1 pt-3')}>
        <View className={cn('flex-row items-center gap-2 bg-white rounded-xl px-3 h-11 border border-slate-200')}>
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            className={cn('flex-1 text-base font-medium text-slate-950')}
            placeholder={`ค้นหา ${cfg.prefix}... หรือ Supplier`}
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        renderItem={renderDoc}
        contentContainerClassName={cn('px-3 pb-5 gap-3')}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center py-20 gap-4')}>
            <Ionicons name={cfg.icon as any} size={56} color="#d1d5db" />
            <Text className={cn('text-xl font-bold text-gray-300')}>{cfg.emptyText}</Text>
            <TouchableOpacity className={cn('flex-row items-center gap-1 rounded-xl px-5 py-3 shadow-lg')} style={{ backgroundColor: cfg.color, shadowColor: cfg.color, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, boxShadow: '0 14px 40px rgba(15, 23, 42, 0.12)' }} onPress={onCreateNew}>
              <Ionicons name="add-circle-outline" size={18} color="#fafafa" />
              <Text className={cn('text-base font-bold text-white')}>สร้างเอกสาร{docType === 'receive' ? 'รับ' : 'เบิก'}สินค้า</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};
