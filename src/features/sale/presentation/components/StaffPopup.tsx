/**
 * StaffPopup — Modal showing available technicians for service product selection
 */
import React from 'react';
import { View, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Technician } from '@/features/settings/domain/store';
import * as staffStore from '@/features/settings/application/stores/staffStore';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

interface Props {
  visible: boolean;
  onSelect: (technicianId: string, technicianName: string) => void;
  onClose: () => void;
  productName?: string;
}

export const StaffPopup: React.FC<Props> = ({ visible, onSelect, onClose, productName }) => {
  const technicians = staffStore.getAvailableTechnicians();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className={cn('flex-1 justify-center items-center')} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View className={cn('bg-white rounded-xl overflow-hidden')} style={{ width: '85%', maxWidth: 380, maxHeight: '70%' }}>
          <View className={cn('flex-row justify-between items-center p-4 border-b border-b-neutral-200')}>
            <Text className={cn('text-base font-bold')} style={{ color: '#27272a' }}>เลือกช่าง/พนักงานบริการ</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#27272a" />
            </TouchableOpacity>
          </View>
          {productName && <Text className={cn('text-xs px-4 pt-2')} style={{ color: '#78716c' }}>สินค้า: {productName}</Text>}
          
          {technicians.length === 0 ? (
            <View className={cn('items-center py-10 gap-2')}>
              <Ionicons name="people-outline" size={36} color="#d6d3d1" />
              <Text className={cn('text-xs')} style={{ color: '#a3a3a3' }}>ไม่มีช่างว่างอยู่ตอนนี้</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 300 }}>
              {technicians.map(tech => (
                <TouchableOpacity key={tech.id} className={cn('flex-row items-center gap-3 px-4 py-3 border-b border-b-neutral-100')} onPress={() => onSelect(tech.id, tech.name)}>
                  <View className={cn('w-9 h-9 rounded-full items-center justify-center')} style={{ backgroundColor: '#f87171' }}>
                    <Ionicons name="person" size={20} color="#fafafa" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className={cn('text-sm font-semibold')} style={{ color: '#27272a' }}>{tech.name}</Text>
                    <Text className={cn('text-xs')} style={{ color: '#71717a' }}>{tech.position}</Text>
                  </View>
                  <View className={cn('w-2 h-2 rounded-full')} style={{ backgroundColor: '#22c55e' }} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};
