/**
 * ReceivePOScreen — รับสินค้าตาม PO
 * M08 Supplier & Purchase
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, Alert, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePurchaseStore } from '../../store/purchaseStore';
import { PurchaseOrder, POItem, POReceiveItem } from '../../types/purchase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props {
  onBack?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'รออนุมัติรับ', color: Colors.success, bg: Colors.successLight },
  partial_receive: { label: 'รับบางส่วน', color: Colors.warning, bg: Colors.warningLight },
};

export const ReceivePOScreen: React.FC<Props> = ({ onBack }) => {
  const { purchaseOrders, receivePO } = usePurchaseStore();
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({});

  const receivablePOs = useMemo(() => {
    return purchaseOrders.filter(
      (po) => po.status === 'approved' || po.status === 'partial_receive'
    );
  }, [purchaseOrders]);

  const handleSelectPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const initial: Record<string, string> = {};
    po.items.forEach((item) => {
      const remaining = item.orderQty - item.receivedQty;
      initial[item.productId] = remaining > 0 ? String(remaining) : '0';
    });
    setReceiveQtys(initial);
  };

  const handleReceive = () => {
    if (!selectedPO) return;

    const items: POReceiveItem[] = selectedPO.items
      .filter((i) => {
        const qty = parseInt(receiveQtys[i.productId] || '0', 10);
        return qty > 0;
      })
      .map((i) => ({
        productId: i.productId,
        productName: i.productName,
        receiveQty: parseInt(receiveQtys[i.productId] || '0', 10),
        unit: i.unit,
        actualCost: i.unitCost,
      }));

    if (items.length === 0) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาระบุจำนวนที่รับอย่างน้อย 1 รายการ');
      return;
    }

    Alert.alert(
      'ยืนยันรับสินค้า',
      `รับสินค้า ${items.length} รายการ จาก ${selectedPO.poNo}`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'บันทึกการรับ',
          onPress: () => {
            receivePO(selectedPO.id, items, 'พนักงาน');
            setSelectedPO(null);
            setReceiveQtys({});
            Alert.alert('สำเร็จ', 'บันทึกการรับสินค้าเรียบร้อยแล้ว');
          },
        },
      ]
    );
  };

  const renderPO = ({ item: po }: { item: PurchaseOrder }) => {
    const cfg = STATUS_CONFIG[po.status] ?? STATUS_CONFIG.approved;
    const totalRemaining = po.items.reduce(
      (sum, i) => sum + (i.orderQty - i.receivedQty), 0
    );

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleSelectPO(po)} activeOpacity={0.8}>
        <View style={styles.cardTop}>
          <View style={styles.iconWrap}>
            <Ionicons name="arrow-down-circle-outline" size={22} color={Colors.success} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.docNo}>{po.poNo}</Text>
            <Text style={styles.supplierName} numberOfLines={1}>{po.supplierName}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>รอรับ: {totalRemaining} หน่วย</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="list-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{po.items.length} รายการสินค้า</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderReceiveItem = (item: POItem) => {
    const remaining = item.orderQty - item.receivedQty;
    return (
      <View key={item.productId} style={styles.receiveItem}>
        <View style={styles.receiveItemInfo}>
          <Text style={styles.receiveItemName} numberOfLines={1}>{item.productName}</Text>
          <Text style={styles.receiveItemSub}>
            สั่ง {item.orderQty} | รับแล้ว {item.receivedQty} | คงเหลือ {remaining} {item.unit}
          </Text>
        </View>
        <View style={styles.receiveInputWrap}>
          <TextInput
            style={styles.receiveInput}
            keyboardType="numeric"
            value={receiveQtys[item.productId] ?? '0'}
            onChangeText={(v) =>
              setReceiveQtys((prev) => ({ ...prev, [item.productId]: v }))
            }
          />
          <Text style={styles.receiveUnit}>{item.unit}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>รับสินค้าตาม PO</Text>
          <Text style={styles.headerSub}>Receive Purchase Order · {receivablePOs.length} PO รอรับ</Text>
        </View>
      </View>

      {/* PO List */}
      <FlatList
        data={receivablePOs}
        keyExtractor={(po) => po.id}
        renderItem={renderPO}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={56} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>ไม่มี PO ที่รอรับสินค้า</Text>
          </View>
        }
      />

      {/* Receive Modal */}
      <Modal visible={!!selectedPO} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                รับสินค้า — {selectedPO?.poNo}
              </Text>
              <TouchableOpacity onPress={() => setSelectedPO(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSupplier}>{selectedPO?.supplierName}</Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedPO?.items.map(renderReceiveItem)}
            </ScrollView>

            <TouchableOpacity style={styles.receiveBtn} onPress={handleReceive} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
              <Text style={styles.receiveBtnText}>บันทึกการรับ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.successDark, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },
  list: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconWrap: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  docNo: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  supplierName: { ...Typography.caption, color: Colors.textSecondary },
  badge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardDetails: { gap: 3, paddingLeft: 56 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { ...Typography.caption, color: Colors.text },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: Spacing.lg },
  emptyTitle: { ...Typography.h3, color: Colors.gray400 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  modalTitle: { ...Typography.h4, color: Colors.text },
  modalSupplier: { ...Typography.body2, color: Colors.textSecondary, marginBottom: Spacing.md },
  modalScroll: { maxHeight: 400 },
  receiveItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  receiveItemInfo: { flex: 1, marginRight: Spacing.md },
  receiveItemName: { ...Typography.label, color: Colors.text },
  receiveItemSub: { ...Typography.caption, color: Colors.textSecondary },
  receiveInputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  receiveInput: {
    width: 60, height: 36, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border, textAlign: 'center',
    ...Typography.label, color: Colors.text,
  },
  receiveUnit: { ...Typography.caption, color: Colors.textSecondary },
  receiveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.success, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, marginTop: Spacing.lg,
  },
  receiveBtnText: { ...Typography.button, color: Colors.white },
});
