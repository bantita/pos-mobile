import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { usePurchaseStore } from '@/features/purchase/application/stores/purchaseStore';

const fmt = (n: number) => n.toLocaleString('th-TH');

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: '#d1fae5', text: '#10b981', label: 'ใช้งาน' },
  inactive: { bg: '#f3f4f6', text: '#9ca3af', label: 'ระงับ' },
  draft: { bg: '#f3f4f6', text: '#9ca3af', label: 'ร่าง' },
  submitted: { bg: '#dbeafe', text: '#3b82f6', label: 'รออนุมัติ' },
  approved: { bg: '#d1fae5', text: '#10b981', label: 'อนุมัติ' },
  rejected: { bg: '#fee2e2', text: '#ef4444', label: 'ไม่อนุมัติ' },
  converted: { bg: '#f3e8ff', text: '#7c3aed', label: 'สร้าง PO แล้ว' },
  partial_receive: { bg: '#fef3c7', text: '#ea580c', label: 'รับบางส่วน' },
  completed: { bg: '#d1fae5', text: '#10b981', label: 'เสร็จสิ้น' },
  cancelled: { bg: '#fee2e2', text: '#ef4444', label: 'ยกเลิก' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <View className={cn('px-2 py-0.5 rounded-xl')} style={{ backgroundColor: c.bg }}>
      <Text className={cn('text-sm font-bold')} style={{ color: c.text }}>{c.label}</Text>
    </View>
  );
};

type TabKey = 'supplier' | 'pr' | 'po' | 'receive';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'supplier', label: 'Supplier', icon: 'business-outline' },
  { key: 'pr', label: 'PR', icon: 'document-text-outline' },
  { key: 'po', label: 'PO', icon: 'cart-outline' },
  { key: 'receive', label: 'รับสินค้า', icon: 'cube-outline' },
];

const TableHead: React.FC<{ cols: { label: string; flex: number }[] }> = ({ cols }) => (
  <View className={cn('flex-row bg-rose-50 px-3.5 py-2.5 border-b border-gray-200 rounded-t-2xl')}>
    {cols.map(c => <Text key={c.label} className={cn('text-sm font-bold text-gray-500')} style={{ flex: c.flex }}>{c.label}</Text>)}
  </View>
);

export const PurchaseScreen: React.FC = () => {
  const { suppliers, requisitions, purchaseOrders, receives } = usePurchaseStore();
  const [activeTab, setActiveTab] = useState<TabKey>('supplier');
  const receivablePOs = purchaseOrders.filter(po => po.status === 'approved' || po.status === 'partial_receive');

  return (
    <View className={cn('flex-1 bg-[#f6f7fb] p-5 gap-4')}>
      <View className={cn('flex-row items-center justify-between bg-rose-600 rounded-2xl px-5 py-4 shadow-lg shadow-rose-500/40')}>
        <Text className={cn('text-lg font-extrabold text-white')}>จัดซื้อจัดจ้าง</Text>
        <View className={cn('flex-row gap-4')}>
          <View className={cn('items-center gap-0.5')}>
            <Text className={cn('text-sm font-bold text-white/80')}>Supplier</Text>
            <Text className={cn('text-sm font-extrabold text-white')}>{suppliers.length}</Text>
          </View>
          <View className={cn('items-center gap-0.5')}>
            <Text className={cn('text-sm font-bold text-white/80')}>PR รอรุณุมัติ</Text>
            <Text className={cn('text-sm font-extrabold')} style={{ color: '#fbbf24' }}>{requisitions.filter(r => r.status === 'submitted').length}</Text>
          </View>
          <View className={cn('items-center gap-0.5')}>
            <Text className={cn('text-sm font-bold text-white/80')}>PO รอรับ</Text>
            <Text className={cn('text-sm font-extrabold')} style={{ color: '#7dd3fc' }}>{receivablePOs.length}</Text>
          </View>
        </View>
      </View>

      <View className={cn('flex-row gap-1.5')}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            className={cn('flex-row items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-sm')}
            style={activeTab === t.key ? { backgroundColor: '#e11d48', borderColor: '#e11d48' } : {}}
            onPress={() => setActiveTab(t.key)}>
            <Ionicons name={t.icon as any} size={16} color={activeTab === t.key ? '#fafafa' : '#6b7280'} />
            <Text className={cn('text-sm font-bold')} style={{ color: activeTab === t.key ? '#fafafa' : '#6b7280' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className={cn('flex-1 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm')}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {activeTab === 'supplier' && (
            <View>
              <TableHead cols={[
                { label: 'ชื่อ Supplier', flex: 2 },
                { label: 'รหัส', flex: 1 },
                { label: 'เบอร์', flex: 1 },
                { label: 'เงื่อนไขชำระ', flex: 1 },
                { label: 'สถานะ', flex: 0.7 },
              ]} />
              {suppliers.map((sup, idx) => (
                <View key={sup.id} className={cn('flex-row px-3.5 py-2.5 border-b border-gray-200 items-center')} style={idx % 2 === 1 ? { backgroundColor: '#fdf2f8' } : {}}>
                  <Text className={cn('text-sm font-semibold text-gray-900 flex-[2]')}>{sup.name}</Text>
                  <Text className={cn('text-sm font-medium text-gray-900 flex-1')}>{sup.supplierCode}</Text>
                  <Text className={cn('text-sm font-medium text-gray-900 flex-1')}>{sup.phone || '-'}</Text>
                  <Text className={cn('text-sm font-medium text-gray-900 flex-1')}>{sup.paymentTerms || '-'}</Text>
                  <View className={cn('flex-[0.7]')}><StatusBadge status={sup.isActive ? 'active' : 'inactive'} /></View>
                </View>
              ))}
              {suppliers.length === 0 && <Text className={cn('text-sm font-medium text-gray-500 text-center py-10')}>ยังไม่มีข้อมูล Supplier</Text>}
            </View>
          )}

          {activeTab === 'pr' && (
            <View>
              <TableHead cols={[
                { label: 'เลขที่ PR', flex: 1.2 },
                { label: 'สถานะ', flex: 0.8 },
                { label: 'เหตุผล', flex: 2 },
                { label: 'รายการ', flex: 0.6 },
                { label: 'ผู้ขอ', flex: 1 },
                { label: 'วันที่', flex: 1 },
              ]} />
              {requisitions.map((pr, idx) => (
                <View key={pr.id} className={cn('flex-row px-3.5 py-2.5 border-b border-gray-200 items-center')} style={idx % 2 === 1 ? { backgroundColor: '#fdf2f8' } : {}}>
                  <Text className={cn('text-sm font-semibold text-gray-900 flex-[1.2]')}>{pr.prNo}</Text>
                  <View className={cn('flex-[0.8]')}><StatusBadge status={pr.status} /></View>
                  <Text className={cn('text-sm font-medium text-gray-900 flex-[2]')} numberOfLines={1}>{pr.reason}</Text>
                  <Text className={cn('text-sm font-medium text-gray-900 flex-[0.6] text-center')}>{pr.items.length}</Text>
                  <Text className={cn('text-sm font-medium text-gray-900 flex-1')}>{pr.requestedBy}</Text>
                  <Text className={cn('text-sm font-medium text-gray-900 flex-1')}>{new Date(pr.requestedAt).toLocaleDateString('th-TH')}</Text>
                </View>
              ))}
              {requisitions.length === 0 && <Text className={cn('text-sm font-medium text-gray-500 text-center py-10')}>ไม่มีใบ PR</Text>}
            </View>
          )}

          {activeTab === 'po' && (
            <View>
              <TableHead cols={[
                { label: 'เลขที่ PO', flex: 1.2 },
                { label: 'Supplier', flex: 1.5 },
                { label: 'สถานะ', flex: 0.8 },
                { label: 'ยอดรวม', flex: 1 },
                { label: 'กำหนดส่ง', flex: 1 },
              ]} />
              {purchaseOrders.map((po, idx) => (
                <View key={po.id} className={cn('flex-row px-3.5 py-2.5 border-b border-gray-200 items-center')} style={idx % 2 === 1 ? { backgroundColor: '#fdf2f8' } : {}}>
                  <Text className={cn('text-sm font-semibold text-gray-900 flex-[1.2]')}>{po.poNo}</Text>
                  <Text className={cn('text-sm font-medium text-gray-900 flex-[1.5]')}>{po.supplierName}</Text>
                  <View className={cn('flex-[0.8]')}><StatusBadge status={po.status} /></View>
                  <Text className={cn('text-sm font-bold flex-1')} style={{ color: '#e11d48' }}>฿{fmt(po.grandTotal)}</Text>
                  <Text className={cn('text-sm font-medium text-gray-900 flex-1')}>{po.deliveryDate}</Text>
                </View>
              ))}
              {purchaseOrders.length === 0 && <Text className={cn('text-sm font-medium text-gray-500 text-center py-10')}>ไม่มีใบ PO</Text>}
            </View>
          )}

          {activeTab === 'receive' && (
            <View>
              <Text className={cn('text-sm font-bold text-gray-900 mb-2.5')}>PO ที่รอรับสินค้า</Text>
              <TableHead cols={[
                { label: 'เลขที่ PO', flex: 1.2 },
                { label: 'Supplier', flex: 1.5 },
                { label: 'สถานะ', flex: 0.8 },
                { label: 'รายการ', flex: 0.6 },
                { label: 'ยอดรวม', flex: 1 },
                { label: 'รับสินค้า', flex: 0.8 },
              ]} />
              {receivablePOs.map((po, idx) => (
                <View key={po.id} className={cn('flex-row px-3.5 py-2.5 border-b border-gray-200 items-center')} style={idx % 2 === 1 ? { backgroundColor: '#fdf2f8' } : {}}>
                  <Text className={cn('text-sm font-semibold text-gray-900 flex-[1.2]')}>{po.poNo}</Text>
                  <Text className={cn('text-sm font-medium text-gray-900 flex-[1.5]')}>{po.supplierName}</Text>
                  <View className={cn('flex-[0.8]')}><StatusBadge status={po.status} /></View>
                  <Text className={cn('text-sm font-medium text-gray-900 flex-[0.6] text-center')}>{po.items.length}</Text>
                  <Text className={cn('text-sm font-bold flex-1')} style={{ color: '#e11d48' }}>฿{fmt(po.grandTotal)}</Text>
                  <View className={cn('flex-[0.8]')}>
                    <TouchableOpacity className={cn('flex-row items-center gap-1 bg-rose-500 px-3.5 py-2 rounded-xl shadow-sm')}>
                      <Ionicons name="checkmark-done-outline" size={14} color="#fafafa" />
                      <Text className={cn('text-sm font-bold text-white')}>รับสินค้า</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {receivablePOs.length === 0 && <Text className={cn('text-sm font-medium text-gray-500 text-center py-10')}>ไม่มี PO ที่รอรับสินค้า</Text>}
              {receives.length > 0 && (
                <View className={cn('mt-5')}>
                  <Text className={cn('text-sm font-bold text-gray-900 mb-2.5')}>ประวัติการรับสินค้า</Text>
                  <TableHead cols={[
                    { label: 'เลขที่รับ', flex: 1.2 },
                    { label: 'อ้างอิง PO', flex: 1 },
                    { label: 'รายการ', flex: 0.6 },
                    { label: 'ผู้รับ', flex: 1 },
                    { label: 'วันที่รับ', flex: 1 },
                  ]} />
                  {receives.map((rcv, idx) => (
                    <View key={rcv.id} className={cn('flex-row px-3.5 py-2.5 border-b border-gray-200 items-center')} style={idx % 2 === 1 ? { backgroundColor: '#fdf2f8' } : {}}>
                      <Text className={cn('text-sm font-semibold text-gray-900 flex-[1.2]')}>{rcv.receiveNo}</Text>
                      <Text className={cn('text-sm font-medium text-gray-900 flex-1')}>{rcv.poNo}</Text>
                      <Text className={cn('text-sm font-medium text-gray-900 flex-[0.6] text-center')}>{rcv.items.length}</Text>
                      <Text className={cn('text-sm font-medium text-gray-900 flex-1')}>{rcv.receivedBy}</Text>
                      <Text className={cn('text-sm font-medium text-gray-900 flex-1')}>{new Date(rcv.receivedAt).toLocaleDateString('th-TH')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};
