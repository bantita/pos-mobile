/**
 * StockDocListScreen — รายการเอกสาร รับ/เบิกสินค้า
 * รองรับ: กรอง status | ค้นหา | เปิดดู/แก้ไข | สร้างใหม่
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StockDocument, DocType, DocStatus } from '../../types/stockDocument';
import { useStockDocStore } from '../../store/stockDocStore';
import { DocStatusBadge } from '../../components/inventory/DocStatusBadge';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface Props {
  docType: DocType;
  onCreateNew: () => void;
  onOpenDoc: (doc: StockDocument) => void;
  onBack: () => void;
}

const TYPE_CONFIG = {
  receive: {
    title: 'เอกสารรับสินค้า',
    color: Colors.success,
    bgColor: Colors.successLight,
    icon: 'arrow-down-circle-outline',
    prefix: 'RCV',
    emptyText: 'ยังไม่มีเอกสารรับสินค้า',
  },
  issue: {
    title: 'เอกสารเบิกสินค้า',
    color: Colors.category1,
    bgColor: Colors.primaryLight,
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
      Alert.alert('ไม่สามารถยกเลิกได้', 'ยกเลิกได้เฉพาะเอกสารที่เป็น "แบบร่าง" เท่านั้น');
      return;
    }
    Alert.alert('ยืนยันยกเลิก', `ต้องการยกเลิกเอกสาร ${doc.docNo}?`, [
      { text: 'ไม่', style: 'cancel' },
      { text: 'ยกเลิกเอกสาร', style: 'destructive', onPress: () => cancelDocument(doc.id) },
    ]);
  };

  const renderDoc = ({ item: doc }: { item: StockDocument }) => (
    <TouchableOpacity
      style={styles.docCard}
      onPress={() => onOpenDoc(doc)}
      activeOpacity={0.8}
    >
      {/* Top row */}
      <View style={styles.docTop}>
        <View style={[styles.docTypeIcon, { backgroundColor: cfg.bgColor }]}>
          <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docNo}>{doc.docNo}</Text>
          <Text style={styles.docDate}>{formatDateTime(doc.createdAt)}</Text>
        </View>
        <DocStatusBadge status={doc.status} />
      </View>

      {/* Details */}
      <View style={styles.docDetails}>
        <View style={styles.docDetailRow}>
          <Ionicons name="archive-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.docDetailText}>{doc.warehouseName}</Text>
          {doc.toWarehouseName && (
            <>
              <Ionicons name="arrow-forward" size={11} color={Colors.gray400} />
              <Text style={styles.docDetailText}>{doc.toWarehouseName}</Text>
            </>
          )}
        </View>
        {doc.supplierName && (
          <View style={styles.docDetailRow}>
            <Ionicons name="business-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.docDetailText}>{doc.supplierName}</Text>
          </View>
        )}
        {doc.remark ? (
          <View style={styles.docDetailRow}>
            <Ionicons name="chatbubble-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.docDetailText} numberOfLines={1}>{doc.remark}</Text>
          </View>
        ) : null}
      </View>

      {/* Footer */}
      <View style={styles.docFooter}>
        <View style={styles.docStats}>
          <View style={styles.docStat}>
            <Ionicons name="list-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.docStatText}>{doc.totalItems} รายการ</Text>
          </View>
          <View style={styles.docStat}>
            <Ionicons name="cube-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.docStatText}>{doc.totalQtyBase} หน่วย</Text>
          </View>
          {docType === 'receive' && doc.totalCost > 0 && (
            <View style={styles.docStat}>
              <Ionicons name="cash-outline" size={12} color={Colors.primary} />
              <Text style={[styles.docStatText, { color: Colors.primary, fontWeight: '700' }]}>
                ฿{formatCurrency(doc.totalCost)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.docActions}>
          {doc.status === 'draft' && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: cfg.bgColor }]}
                onPress={() => onOpenDoc(doc)}
              >
                <Ionicons name="pencil-outline" size={14} color={cfg.color} />
                <Text style={[styles.actionBtnText, { color: cfg.color }]}>แก้ไข</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDanger]}
                onPress={() => handleCancel(doc)}
              >
                <Ionicons name="close-outline" size={14} color={Colors.danger} />
                <Text style={[styles.actionBtnText, { color: Colors.danger }]}>ยกเลิก</Text>
              </TouchableOpacity>
            </>
          )}
          {doc.status === 'confirmed' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.gray100 }]}
              onPress={() => onOpenDoc(doc)}
            >
              <Ionicons name="eye-outline" size={14} color={Colors.textSecondary} />
              <Text style={[styles.actionBtnText, { color: Colors.textSecondary }]}>ดู</Text>
            </TouchableOpacity>
          )}
          <View style={styles.createdBy}>
            <Ionicons name="person-outline" size={11} color={Colors.gray400} />
            <Text style={styles.createdByText}>{doc.createdBy}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cfg.color }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{cfg.title}</Text>
          <Text style={styles.headerSub}>{counts.all} เอกสาร</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={onCreateNew}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.createBtnText}>สร้างใหม่</Text>
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        {[
          { key: 'all',       label: 'ทั้งหมด', count: counts.all,       color: Colors.text },
          { key: 'draft',     label: 'แบบร่าง', count: counts.draft,     color: Colors.warning },
          { key: 'confirmed', label: 'ยืนยัน',  count: counts.confirmed, color: Colors.success },
          { key: 'cancelled', label: 'ยกเลิก',  count: counts.cancelled, color: Colors.danger },
        ].map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.summaryItem, statusFilter === s.key && { borderBottomColor: s.color, borderBottomWidth: 2.5 }]}
            onPress={() => setStatusFilter(s.key as any)}
          >
            <Text style={[styles.summaryCount, { color: s.color }]}>{s.count}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder={`ค้นหา ${cfg.prefix}... หรือ Supplier`}
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        renderItem={renderDoc}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name={cfg.icon as any} size={56} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>{cfg.emptyText}</Text>
            <TouchableOpacity style={[styles.emptyCreateBtn, { backgroundColor: cfg.color }]} onPress={onCreateNew}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
              <Text style={styles.emptyCreateText}>สร้างเอกสาร{docType === 'receive' ? 'รับ' : 'เบิก'}สินค้า</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  createBtnText: { ...Typography.label, color: Colors.white },
  summaryBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  summaryCount: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  searchRow: { padding: Spacing.md, paddingBottom: Spacing.xs },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 44, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.text },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.md },
  docCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
  docTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  docTypeIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  docInfo: { flex: 1 },
  docNo: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  docDate: { ...Typography.caption, color: Colors.textSecondary },
  docDetails: { gap: 3 },
  docDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  docDetailText: { ...Typography.caption, color: Colors.text },
  docFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border },
  docStats: { flexDirection: 'row', gap: Spacing.md },
  docStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  docStatText: { ...Typography.caption, color: Colors.textSecondary },
  docActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
  actionBtnDanger: { backgroundColor: Colors.dangerLight },
  actionBtnText: { fontSize: 11, fontWeight: '700' },
  createdBy: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  createdByText: { ...Typography.caption, color: Colors.gray400 },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: Spacing.lg },
  emptyTitle: { ...Typography.h3, color: Colors.gray400 },
  emptyCreateBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  emptyCreateText: { ...Typography.button, color: Colors.white },
});
