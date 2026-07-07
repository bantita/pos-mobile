import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { cn } from '@/shared/lib/cn';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';

const TODAY = new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });

const MOCK = {
  kpi: { sales: 48320, bills: 156, avg: 310, profit: 12080, voids: 2 },
  payments: [
    { method: 'เงินสด', bills: 98, amount: 32100, pct: 66 },
    { method: 'QR Code', bills: 35, amount: 10500, pct: 22 },
    { method: 'บัตรเครดิต', bills: 15, amount: 4500, pct: 9 },
    { method: 'โอนเงิน', bills: 8, amount: 1220, pct: 3 },
  ],
  stock: { itemsSold: 45, qtySold: 312, lowStock: 3, outOfStock: 1, syncStatus: 'synced' as const, lastSync: '22:30' },
  crm: { earned: 1250, redeemed: 320, newMembers: 3, upgrades: 1, coupons: 8, couponDiscount: 450 },
  shifts: [
    { name: 'สมศักดิ์ ขยัน', open: '08:00', close: '15:00', sales: 28500, diff: 50 },
    { name: 'สมหญิง จริงใจ', open: '15:00', close: '22:00', sales: 19820, diff: -20 },
  ],
  cashMov: [
    { time: '09:30', type: 'in', amount: 5000, reason: 'เพิ่มเงินทอน', by: 'สมชาย' },
    { time: '14:15', type: 'out', amount: 3000, reason: 'นำฝากธนาคาร', by: 'สมหญิง' },
    { time: '18:00', type: 'out', amount: 2000, reason: 'จ่ายค่าของ', by: 'สมชาย' },
  ],
  topProducts: [
    { code: 'P001', name: 'น้ำดื่มสิงห์ 600ml', qty: 85, revenue: 850, profit: 340 },
    { code: 'P004', name: 'มาม่า หมูสับ', qty: 60, revenue: 420, profit: 180 },
    { code: 'P005', name: 'เลย์ รสออริจินัล', qty: 45, revenue: 900, profit: 270 },
    { code: 'P002', name: 'น้ำอัดลม Pepsi', qty: 38, revenue: 570, profit: 228 },
    { code: 'P003', name: 'ขนมปังกรอบ', qty: 25, revenue: 625, profit: 175 },
  ],
  voids: [
    { time: '11:30', bill: '#1e3a8a88', product: 'แชมพู H&S', amount: 89, reason: 'ลูกค้าเปลี่ยนใจ', by: 'MGR' },
    { time: '16:45', bill: '#17171700', product: 'สบู่ Dove', amount: 45, reason: 'สินค้าชำรุด', by: 'MGR' },
  ],
};

const fmt = (n: number) => n.toLocaleString();

const KPI: React.FC<{ label: string; value: string; color?: string; icon: string }> = ({ label, value, color, icon }) => (
  <View className={cn('flex-1 bg-white rounded-2xl p-3.5 items-center gap-1 border border-slate-200 shadow-sm')}>
    <Ionicons name={icon as any} size={20} color={color || '#6b7280'} />
    <Text className={cn('text-sm font-extrabold text-slate-800')} style={color ? { color } : {}}>{value}</Text>
    <Text className={cn('text-sm font-medium text-slate-500')}>{label}</Text>
  </View>
);

export const DailySummaryScreen: React.FC = () => {
  const [date] = useState(TODAY);
  const [alertDialog, setAlertDialog] = useState({ visible: false, title: '', message: '' });
  const d = MOCK;
  const showAlert = (title: string, message: string) => setAlertDialog({ visible: true, title, message });

  return (
    <ScrollView className={cn('flex-1 bg-[#f6f7fb]')} contentContainerStyle={{ padding: 24, gap: 16 }}>
      <View className={cn('bg-rose-600 rounded-2xl p-4 mb-2 shadow-lg shadow-rose-500/40')}>
        <View className={cn('flex-row items-center justify-between')}>
          <View>
            <Text className={cn('text-lg font-extrabold text-white')}>รายงานสรุปประจำวัน</Text>
            <Text className={cn('text-sm font-medium text-white/80')}>วันที่ {date}</Text>
          </View>
          <View className={cn('flex-row gap-2')}>
            <TouchableOpacity className={cn('flex-row items-center gap-1 px-4 py-2 rounded-xl bg-white/20')} onPress={() => showAlert('ส่งออก PDF', 'กำลังเตรียมรายงาน PDF...')}>
              <Ionicons name="document-text-outline" size={14} color="#fff" />
              <Text className={cn('text-sm font-bold text-white')}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity className={cn('flex-row items-center gap-1 px-4 py-2 rounded-xl bg-white/20')} onPress={() => showAlert('ส่งออก Excel', 'กำลังเตรียมรายงาน Excel...')}>
              <Ionicons name="grid-outline" size={14} color="#fff" />
              <Text className={cn('text-sm font-bold text-white')}>Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity className={cn('flex-row items-center gap-1 px-4 py-2 rounded-xl bg-white/20')} onPress={() => showAlert('พิมพ์', 'กำลังเปิดหน้าต่างพิมพ์...')}>
              <Ionicons name="print-outline" size={14} color="#fff" />
              <Text className={cn('text-sm font-bold text-white')}>พิมพ์</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className={cn('flex-row gap-2.5')}>
        <KPI label="ยอดขายรวม" value={`฿${fmt(d.kpi.sales)}`} color="#e11d48" icon="cash-outline" />
        <KPI label="จำนวนบิล" value={`${d.kpi.bills} บิล`} color="#0ea5e9" icon="receipt-outline" />
        <KPI label="เฉลี่ย/บิล" value={`฿${fmt(d.kpi.avg)}`} color="#7c3aed" icon="trending-up-outline" />
        <KPI label="กำไรขั้นต้น" value={`฿${fmt(d.kpi.profit)}`} color="#16a34a" icon="arrow-up-circle-outline" />
        <KPI label="ยกเลิก/คืน" value={`${d.kpi.voids} รายการ`} color="#ef4444" icon="close-circle-outline" />
      </View>

      <View className={cn('bg-white rounded-2xl p-4 border border-slate-200 shadow-sm gap-2.5')}>
        <Text className={cn('text-sm font-extrabold text-slate-800')}>ยอดขายแยกตามประเภทชำระเงิน</Text>
        <View className={cn('rounded-xl overflow-hidden border border-slate-200')}>
          <View className={cn('flex-row bg-[#f6f7fb] py-2 px-2.5 border-b border-slate-200')}>
            {['ประเภทชำระ', 'จำนวนบิล', 'ยอดเงิน', 'สัดส่วน'].map((h, i) => (
              <Text key={i} className={cn('flex-1 text-sm font-bold text-slate-500')}>{h}</Text>
            ))}
          </View>
          {d.payments.map((p, i) => (
            <View key={i} className={cn('flex-row items-center py-2 px-2.5 border-b border-slate-100', i % 2 === 1 && 'bg-rose-50/50')}>
              <Text className={cn('flex-1 text-sm font-semibold text-slate-700')}>{p.method}</Text>
              <Text className={cn('flex-1 text-sm font-medium text-slate-700')}>{p.bills}</Text>
              <Text className={cn('flex-1 text-sm font-medium text-slate-700')}>฿{fmt(p.amount)}</Text>
              <View className={cn('flex-1 flex-row items-center gap-1.5')}>
                <View className={cn('flex-1 h-1.5 bg-slate-200 rounded-full')}>
                  <View className={cn('h-1.5 rounded-full bg-rose-500')} style={{ width: `${p.pct}%` }} />
                </View>
                <Text className={cn('text-sm font-medium text-gray-500')}>{p.pct}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={cn('bg-white rounded-2xl p-4 border border-slate-200 shadow-sm gap-2.5')}>
        <View className={cn('flex-row items-center justify-between')}>
          <Text className={cn('text-sm font-extrabold text-slate-800')}>คลังสินค้า</Text>
          <View className={cn('flex-row items-center gap-1 px-2 py-0.5 rounded-md', d.stock.syncStatus === 'synced' ? 'bg-emerald-50' : 'bg-amber-50')}>
            <Ionicons name={d.stock.syncStatus === 'synced' ? 'checkmark-circle' : 'time'} size={12} color={d.stock.syncStatus === 'synced' ? '#10b981' : '#d97706'} />
            <Text className={cn('text-sm font-bold')} style={{ color: d.stock.syncStatus === 'synced' ? '#10b981' : '#d97706' }}>
              {d.stock.syncStatus === 'synced' ? `Synced ${d.stock.lastSync}` : 'Pending'}
            </Text>
          </View>
        </View>
        <View className={cn('flex-row gap-2')}>
          <View className={cn('flex-1 bg-rose-50 rounded-xl p-2.5 items-center border border-slate-200')}>
            <Text className={cn('text-sm font-extrabold text-slate-800')}>{d.stock.itemsSold}</Text>
            <Text className={cn('text-sm font-medium text-slate-500 mt-0.5')}>SKU ที่ขาย</Text>
          </View>
          <View className={cn('flex-1 bg-rose-50 rounded-xl p-2.5 items-center border border-slate-200')}>
            <Text className={cn('text-sm font-extrabold text-slate-800')}>{d.stock.qtySold}</Text>
            <Text className={cn('text-sm font-medium text-slate-500 mt-0.5')}>ขายได้ทั้งหมด</Text>
          </View>
          <View className={cn('flex-1 bg-rose-50 rounded-xl p-2.5 items-center border border-slate-200')}>
            <Text className={cn('text-sm font-extrabold text-amber-500')}>{d.stock.lowStock} รายการ</Text>
            <Text className={cn('text-sm font-medium text-slate-500 mt-0.5')}>ใกล้หมด</Text>
          </View>
          <View className={cn('flex-1 bg-rose-50 rounded-xl p-2.5 items-center border border-slate-200')}>
            <Text className={cn('text-sm font-extrabold text-red-500')}>{d.stock.outOfStock} รายการ</Text>
            <Text className={cn('text-sm font-medium text-slate-500 mt-0.5')}>หมดสต๊อก</Text>
          </View>
        </View>
      </View>

      <View className={cn('bg-white rounded-2xl p-4 border border-slate-200 shadow-sm gap-2.5')}>
        <Text className={cn('text-sm font-extrabold text-slate-800')}>กิจกรรม CRM</Text>
        <View className={cn('flex-row gap-2')}>
          <View className={cn('flex-1 bg-rose-50 rounded-xl p-2.5 items-center border border-slate-200')}>
            <Text className={cn('text-sm font-extrabold text-amber-500')}>+{fmt(d.crm.earned)}</Text>
            <Text className={cn('text-sm font-medium text-slate-500 mt-0.5')}>แต้มสะสม</Text>
          </View>
          <View className={cn('flex-1 bg-rose-50 rounded-xl p-2.5 items-center border border-slate-200')}>
            <Text className={cn('text-sm font-extrabold text-red-500')}>-{fmt(d.crm.redeemed)}</Text>
            <Text className={cn('text-sm font-medium text-slate-500 mt-0.5')}>แต้มใช้แล้ว</Text>
          </View>
          <View className={cn('flex-1 bg-rose-50 rounded-xl p-2.5 items-center border border-slate-200')}>
            <Text className={cn('text-sm font-extrabold text-sky-600')}>{d.crm.newMembers}</Text>
            <Text className={cn('text-sm font-medium text-slate-500 mt-0.5')}>สมาชิกใหม่</Text>
          </View>
          <View className={cn('flex-1 bg-rose-50 rounded-xl p-2.5 items-center border border-slate-200')}>
            <Text className={cn('text-sm font-extrabold text-violet-600')}>{d.crm.upgrades}</Text>
            <Text className={cn('text-sm font-medium text-slate-500 mt-0.5')}>อัปเกรด</Text>
          </View>
          <View className={cn('flex-1 bg-rose-50 rounded-xl p-2.5 items-center border border-slate-200')}>
            <Text className={cn('text-sm font-extrabold text-emerald-500')}>{d.crm.coupons}</Text>
            <Text className={cn('text-sm font-medium text-slate-500 mt-0.5')}>คูปอง</Text>
          </View>
          <View className={cn('flex-1 bg-rose-50 rounded-xl p-2.5 items-center border border-slate-200')}>
            <Text className={cn('text-sm font-extrabold text-slate-800')}>฿{fmt(d.crm.couponDiscount)}</Text>
            <Text className={cn('text-sm font-medium text-slate-500 mt-0.5')}>ส่วนลดคูปอง</Text>
          </View>
        </View>
      </View>

      <View className={cn('bg-white rounded-2xl p-4 border border-slate-200 shadow-sm gap-2.5')}>
        <Text className={cn('text-sm font-extrabold text-slate-800')}>กะทำงาน</Text>
        <View className={cn('rounded-xl overflow-hidden border border-slate-200')}>
          <View className={cn('flex-row bg-[#f6f7fb] py-2 px-2.5 border-b border-slate-200')}>
            {['กะ', 'พนักงาน', 'เปิด', 'ปิด', 'ยอดขาย', 'ผลต่าง'].map((h, i) => (
              <Text key={i} className={cn('flex-1 text-sm font-bold text-slate-500')}>{h}</Text>
            ))}
          </View>
          {d.shifts.map((sh, i) => (
            <View key={i} className={cn('flex-row items-center py-2 px-2.5 border-b border-slate-100', i % 2 === 1 && 'bg-rose-50/50')}>
              <Text className={cn('flex-1 text-sm font-medium text-slate-700')}>กะ {i + 1}</Text>
              <Text className={cn('flex-1 text-sm font-semibold text-slate-700')}>{sh.name}</Text>
              <Text className={cn('flex-1 text-sm font-medium text-slate-700')}>{sh.open}</Text>
              <Text className={cn('flex-1 text-sm font-medium text-slate-700')}>{sh.close}</Text>
              <Text className={cn('flex-1 text-sm font-bold text-rose-500')}>฿{fmt(sh.sales)}</Text>
              <Text className={cn('flex-1 text-sm font-bold', sh.diff >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                {sh.diff >= 0 ? '+' : ''}฿{fmt(sh.diff)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className={cn('bg-white rounded-2xl p-4 border border-slate-200 shadow-sm gap-2.5')}>
        <Text className={cn('text-sm font-extrabold text-slate-800')}>เคลื่อนไหว-เงินสดในเครื่อง</Text>
        <View className={cn('rounded-xl overflow-hidden border border-slate-200')}>
          <View className={cn('flex-row bg-[#f6f7fb] py-2 px-2.5 border-b border-slate-200')}>
            {['เวลา', 'ประเภท', 'จำนวนเงิน', 'เหตุผล', 'โดย'].map((h, i) => (
              <Text key={i} className={cn('flex-1 text-sm font-bold text-slate-500')}>{h}</Text>
            ))}
          </View>
          {d.cashMov.map((m, i) => (
            <View key={i} className={cn('flex-row items-center py-2 px-2.5 border-b border-slate-100', i % 2 === 1 && 'bg-rose-50/50')}>
              <Text className={cn('flex-1 text-sm font-medium text-slate-700')}>{m.time}</Text>
              <View className={cn('flex-1')}>
                <View className={cn('px-2 py-0.5 rounded-md self-start', m.type === 'in' ? 'bg-emerald-50' : 'bg-red-50')}>
                  <Text className={cn('text-sm font-bold', m.type === 'in' ? 'text-emerald-500' : 'text-red-500')}>
                    {m.type === 'in' ? 'นำเข้า' : 'ถอนออก'}
                  </Text>
                </View>
              </View>
              <Text className={cn('flex-1 text-sm font-bold', m.type === 'in' ? 'text-emerald-500' : 'text-red-500')}>
                {m.type === 'in' ? '+' : '-'}฿{fmt(m.amount)}
              </Text>
              <Text className={cn('flex-1 text-sm font-medium text-slate-700')}>{m.reason}</Text>
              <Text className={cn('flex-1 text-sm font-medium text-slate-700')}>{m.by}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={cn('flex-row gap-4')}>
        <View className={cn('flex-[2] bg-white rounded-2xl p-4 border border-slate-200 shadow-sm gap-2.5')}>
          <Text className={cn('text-sm font-extrabold text-slate-800')}>สินค้าขายดี Top 5</Text>
          <View className={cn('rounded-xl overflow-hidden border border-slate-200')}>
            <View className={cn('flex-row bg-[#f6f7fb] py-2 px-2.5 border-b border-slate-200')}>
              {['#', 'ชื่อสินค้า', 'จำนวน', 'รายได้', 'กำไร'].map((h, i) => (
                <Text key={i} className={cn('text-sm font-bold text-slate-500', i === 1 ? 'flex-[2]' : 'flex-1')}>{h}</Text>
              ))}
            </View>
            {d.topProducts.map((p, i) => (
              <View key={i} className={cn('flex-row items-center py-2 px-2.5 border-b border-slate-100', i % 2 === 1 && 'bg-rose-50/50')}>
                <Text className={cn('flex-1 text-sm font-bold text-slate-700')}>{i + 1}</Text>
                <Text className={cn('flex-[2] text-sm font-medium text-slate-700')}>{p.name}</Text>
                <Text className={cn('flex-1 text-sm font-medium text-slate-700')}>{p.qty}</Text>
                <Text className={cn('flex-1 text-sm font-medium text-slate-700')}>฿{fmt(p.revenue)}</Text>
                <Text className={cn('flex-1 text-sm font-semibold text-emerald-500')}>฿{fmt(p.profit)}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className={cn('flex-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm gap-2.5')}>
          <Text className={cn('text-sm font-extrabold text-slate-800')}>ยกเลิก/คืนสินค้า</Text>
          {d.voids.map((v, i) => (
            <View key={i} className={cn('border-b border-slate-100 py-2 gap-0.5')}>
              <Text className={cn('text-sm font-medium text-slate-400')}>{v.time} | {v.bill}</Text>
              <Text className={cn('text-sm font-semibold text-slate-800')}>{v.product} - ฿{v.amount}</Text>
              <Text className={cn('text-sm font-medium text-slate-500')}>{v.reason} (ดำเนินการ: {v.by})</Text>
            </View>
          ))}
        </View>
      </View>

      <AlertDialog
        visible={alertDialog.visible}
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant="info"
      />
    </ScrollView>
  );
};
