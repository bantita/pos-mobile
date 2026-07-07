/**
 * ServiceStaffPopup — เลือกช่าง/พนักงานบริการ
 * แสดงเมื่อกดสินค้าประเภท service ใน POS
 * ทุกครั้งที่เลือกสินค้าบริการ จะ popup ให้เลือกช่างใหม่เสมอ
 */
import React from 'react';
import { View, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { Technician } from '@/features/settings/domain/store';
import { Text } from '@/shared/tw/index';

interface ServiceStaffPopupProps {
  visible: boolean;
  productName: string;
  technicians: Technician[];
  onSelect: (tech: Technician) => void;
  onClose: () => void;
}

export const ServiceStaffPopup: React.FC<ServiceStaffPopupProps> = ({
  visible, productName, technicians, onSelect, onClose,
}) => {
  const available = technicians.filter((t) => t.status === 'available');
  const unavailable = technicians.filter((t) => t.status === 'unavailable');

  const renderTechnician = (tech: Technician, isAvailable: boolean) => (
    <TouchableOpacity
      key={tech.id}
      className={cn('flex-row items-center gap-3 p-4 rounded-xl border', isAvailable ? 'border-slate-200' : 'opacity-50 border-slate-200')}
      style={{ backgroundColor: '#fafafa' }}
      onPress={() => isAvailable && onSelect(tech)}
      disabled={!isAvailable}
      activeOpacity={0.7}
    >
      <View className={cn('w-11 h-11 rounded-full items-center justify-center', isAvailable ? 'bg-rose-500' : 'bg-gray-300')}>
        <Ionicons
          name="person"
          size={24}
          color={isAvailable ? '#fafafa' : '#9ca3af'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text className={cn('text-xs font-semibold font-bold', isAvailable ? 'text-slate-950' : 'text-gray-400')}>
          {tech.name}
        </Text>
        <Text className={cn('text-xs text-slate-500')}>{tech.position}</Text>
      </View>
      {isAvailable ? (
        <View className={cn('flex-row items-center gap-1 px-2 py-1 rounded-full')} style={{ backgroundColor: '#ecfdf5' }}>
          <View className={cn('w-[6px] h-[6px] rounded-full bg-emerald-500')} />
          <Text className={cn('text-xs font-semibold text-emerald-600')}>ว่าง</Text>
        </View>
      ) : (
        <View className={cn('flex-row items-center gap-1 px-2 py-1 rounded-full bg-gray-100')}>
          <View className={cn('w-[6px] h-[6px] rounded-full bg-gray-400')} />
          <Text className={cn('text-xs font-semibold text-gray-400')}>ไม่ว่าง</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className={cn('flex-1 justify-end')} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View className={cn('bg-white p-4')} style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' }}>
          {/* Handle */}
          <View className={cn('w-10 h-1 rounded-sm self-center mb-3')} style={{ backgroundColor: '#e5e7eb' }} />

          {/* Header */}
          <View className={cn('flex-row items-center gap-2 mb-4')}>
            <View className={cn('w-10 h-10 rounded-full items-center justify-center')} style={{ backgroundColor: '#fee2e2' }}>
              <Ionicons name="cut-outline" size={20} color="#f87171" />
            </View>
            <View style={{ flex: 1 }}>
              <Text className={cn('text-lg font-semibold text-slate-950')}>เลือกพนักงานบริการ</Text>
              <Text className={cn('text-xs text-slate-500 mt-0.5')}>สินค้า: {productName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className={cn('p-1')}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Available */}
          {available.length > 0 && (
            <View className={cn('mb-3 gap-2')}>
              <Text className={cn('text-xs font-semibold text-gray-600 uppercase mb-1')}>
                พนักงานว่าง ({available.length})
              </Text>
              {available.map((t) => renderTechnician(t, true))}
            </View>
          )}

          {/* Unavailable */}
          {unavailable.length > 0 && (
            <View className={cn('mb-3 gap-2')}>
              <Text className={cn('text-xs font-semibold uppercase mb-1')} style={{ color: '#9ca3af' }}>
                ไม่ว่าง ({unavailable.length})
              </Text>
              {unavailable.map((t) => renderTechnician(t, false))}
            </View>
          )}

          {/* Empty state */}
          {technicians.length === 0 && (
            <View className={cn('items-center py-5 gap-2')}>
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text className={cn('text-base text-gray-400')}>ยังไม่มีพนักงานบริการ</Text>
              <Text className={cn('text-xs text-gray-300')}>เพิ่มพนักงานได้ที่เมนูตั้งค่า</Text>
            </View>
          )}

          {/* Cancel */}
          <TouchableOpacity className={cn('items-center py-3 border-t border-t-slate-200 mt-2')} onPress={onClose}>
            <Text className={cn('text-base font-semibold text-rose-600')}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
