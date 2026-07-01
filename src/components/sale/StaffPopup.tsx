/**
 * StaffPopup — Modal showing available technicians for service product selection
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Technician } from '../../types/store';
import * as staffStore from '../../store/staffStore';

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
      <View style={s.overlay}>
        <View style={s.modal}>
          <View style={s.header}>
            <Text style={s.title}>เลือกช่าง/พนักงานบริการ</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>
          {productName && <Text style={s.subtitle}>สินค้า: {productName}</Text>}
          
          {technicians.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="people-outline" size={36} color="#ccc" />
              <Text style={s.emptyText}>ไม่มีช่างว่างอยู่ตอนนี้</Text>
            </View>
          ) : (
            <ScrollView style={s.list}>
              {technicians.map(tech => (
                <TouchableOpacity key={tech.id} style={s.techRow} onPress={() => onSelect(tech.id, tech.name)}>
                  <View style={s.avatar}>
                    <Ionicons name="person" size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.techName}>{tech.name}</Text>
                    <Text style={s.techPosition}>{tech.position}</Text>
                  </View>
                  <View style={s.statusDot} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderRadius: 14, width: '85%', maxWidth: 380, maxHeight: '70%', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 16, fontWeight: '700', color: '#333' },
  subtitle: { fontSize: 12, color: '#666', paddingHorizontal: 16, paddingTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 13, color: '#999' },
  list: { maxHeight: 300 },
  techRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E57373', alignItems: 'center', justifyContent: 'center' },
  techName: { fontSize: 14, fontWeight: '600', color: '#333' },
  techPosition: { fontSize: 11, color: '#888' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
});
