/**
 * StockDocDetailScreen — ดูรายละเอียด + Revise เอกสาร
 * - เอกสาร confirmed → ปุ่ม "Revise" → modal กรอกเหตุผล → สร้าง revision draft ใหม่
 * - แสดง Revision History timeline
 * - ปุ่มแก้ไขเฉพาะ draft
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StockDocument } from '../../types/stockDocument';
import { useStockDocStore } from '../../store/stockDocStore';
import { DocStatusBadge } from '../../components/inventory/DocStatusBadge';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface Props {
  doc: StockDocument;
  onBack: () => void;
  onEdit: () => void;
  onOpenDoc: (docId: string) => void;   // เปิด revision ใหม่ที่สร้าง
}

// ─── Revise Modal ──────────────────────────────────────────────────────────────
const REVISE_REASONS = [
  'แก้ไขจำนวนสินค้า',
  'แก้ไขราคา',
  'เพิ่ม/ลบรายการสินค้า',
  'แก้ไขข้อมูล Supplier',
  'แก้ไขคลังสินค้า',
  'อื่นๆ',
];

interface ReviseModalProps {
  visible: boolean;
  docNo: string;
  revNo: number;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

const ReviseModal: React.FC<ReviseModalProps> = ({ visible, docNo, revNo, onConfirm, onClose }) => {
  const [selected, setSelected] = useState('');
  const [custom, setCustom]     = useState('');
  const reason = selected === 'อื่นๆ' ? custom : selected;

  const handleConfirm = () => {
    if (!reason.trim()) { Alert.alert('กรุณาระบุเหตุผล'); return; }
    onConfirm(reason.trim());
    setSelected(''); setCustom('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={rm.overlay}>
        <View style={rm.sheet}>
          <View style={rm.handle} />

          {/* Warning banner */}
          <View style={rm.warnBanner}>
            <Ionicons name="warning-outline" size={20} color={Colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={rm.warnTitle}>Revise เอกสาร {docNo}</Text>
              <Text style={rm.warnSub}>
                จะสร้าง Rev.{revNo + 1} ใหม่เป็น draft{'\n'}
                เอกสารปัจจุบัน (Rev.{revNo}) จะถูกเปลี่ยนสถานะเป็น "Revised"
              </Text>
            </View>
          </View>

          <Text style={rm.label}>เหตุผลที่ Revise *</Text>

          {/* Reason chips */}
          <View style={rm.chipGrid}>
            {REVISE_REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[rm.chip, selected === r && rm.chipActive]}
                onPress={() => setSelected(r)}
              >
                {selected === r && <Ionicons name="checkmark-circle" size={13} color={Colors.white} />}
                <Text style={[rm.chipText, selected === r && rm.chipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selected === 'อื่นๆ' && (
            <TextInput
              style={rm.customInput}
              placeholder="ระบุเหตุผล..."
              placeholderTextColor={Colors.gray400}
              value={custom}
              onChangeText={setCustom}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              autoFocus
            />
          )}

          <View style={rm.actions}>
            <TouchableOpacity style={rm.cancelBtn} onPress={onClose}>
              <Text style={rm.cancelText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[rm.confirmBtn, !reason.trim() && rm.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!reason.trim()}
            >
              <Ionicons name="refresh-circle-outline" size={18} color={Colors.white} />
              <Text style={rm.confirmText}>สร้าง Revision</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const rm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, gap: Spacing.md },
  handle: { width: 40, height: 4, backgroundColor: Colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xs },
  warnBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md, padding: Spacing.md },
  warnTitle: { ...Typography.label, color: Colors.warning, fontWeight: '700' },
  warnSub: { ...Typography.caption, color: Colors.warning, lineHeight: 18, marginTop: 2 },
  label: { ...Typography.label, color: Colors.gray700 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.body2, color: Colors.text },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  customInput: { backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.body1, color: Colors.text, minHeight: 70 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border },
  cancelText: { ...Typography.button, color: Colors.textSecondary },
  confirmBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  confirmBtnDisabled: { backgroundColor: Colors.gray300 },
  confirmText: { ...Typography.button, color: Colors.white },
});

// ─── Revision Timeline ─────────────────────────────────────────────────────────
interface RevTimelineProps {
  chain: StockDocument[];
  currentId: string;
  onOpen: (docId: string) => void;
}

const RevTimeline: React.FC<RevTimelineProps> = ({ chain, currentId, onOpen }) => {
  if (chain.length <= 1) return null;
  return (
    <View style={rtl.container}>
      <Text style={rtl.title}>
        <Ionicons name="git-branch-outline" size={14} color={Colors.primary} /> Revision History
      </Text>
      {chain.map((d, idx) => {
        const isCurrent = d.id === currentId;
        const isLast = idx === chain.length - 1;
        const statusColor = {
          draft: Colors.warning, confirmed: Colors.success,
          cancelled: Colors.danger, revised: Colors.gray400,
        }[d.status];

        return (
          <View key={d.id} style={rtl.row}>
            {/* Timeline line */}
            <View style={rtl.lineCol}>
              <View style={[rtl.dot, { backgroundColor: statusColor }, isCurrent && rtl.dotCurrent]} />
              {!isLast && <View style={rtl.line} />}
            </View>
            {/* Content */}
            <TouchableOpacity
              style={[rtl.card, isCurrent && rtl.cardCurrent]}
              onPress={() => !isCurrent && onOpen(d.id)}
              activeOpacity={isCurrent ? 1 : 0.8}
            >
              <View style={rtl.cardTop}>
                <Text style={rtl.revLabel}>
                  {d.revNo === 0 ? 'ต้นฉบับ' : `Rev.${d.revNo}`}
                  {isCurrent && <Text style={rtl.currentTag}> ← ดูอยู่</Text>}
                </Text>
                <DocStatusBadge status={d.status} size="sm" />
              </View>
              <Text style={rtl.revDate}>{formatDateTime(d.createdAt)} โดย {d.createdBy}</Text>
              {d.reviseReason && (
                <View style={rtl.reasonRow}>
                  <Ionicons name="chatbubble-outline" size={11} color={Colors.textSecondary} />
                  <Text style={rtl.reasonText}>{d.reviseReason}</Text>
                </View>
              )}
              {!isCurrent && (
                <View style={rtl.openBtn}>
                  <Ionicons name="open-outline" size={12} color={Colors.primary} />
                  <Text style={rtl.openBtnText}>เปิด</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const rtl = StyleSheet.create({
  container: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.xs, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  title: { ...Typography.label, color: Colors.primary, fontWeight: '700', marginBottom: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.sm },
  lineCol: { width: 24, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  dotCurrent: { width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: Colors.white, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 },
  line: { width: 2, flex: 1, backgroundColor: Colors.gray200, marginTop: 2 },
  card: { flex: 1, backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md, padding: Spacing.sm, gap: 3, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  cardCurrent: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  revLabel: { ...Typography.label, color: Colors.text },
  currentTag: { color: Colors.primary, fontWeight: '700', fontSize: 11 },
  revDate: { ...Typography.caption, color: Colors.textSecondary },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reasonText: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-end', backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderWidth: 1, borderColor: Colors.primary },
  openBtnText: { fontSize: 10, color: Colors.primary, fontWeight: '700' },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export const StockDocDetailScreen: React.FC<Props> = ({ doc, onBack, onEdit, onOpenDoc }) => {
  const { reviseDocument, getRevisionChain } = useStockDocStore();
  const [showReviseModal, setShowReviseModal] = useState(false);

  const isReceive   = doc.docType === 'receive';
  const headerColor = isReceive ? Colors.success : Colors.category1;
  const totalCost   = doc.items.reduce((s, i) => s + i.qty * i.costPrice, 0);
  const revChain    = getRevisionChain(doc.id);

  const canRevise = doc.status === 'confirmed';
  const canEdit   = doc.status === 'draft';

  const handleRevise = (reason: string) => {
    setShowReviseModal(false);
    const newDoc = reviseDocument(doc.id, reason, 'พนักงาน');
    Alert.alert(
      '✅ สร้าง Revision สำเร็จ',
      `สร้าง ${doc.docNo} Rev.${newDoc.revNo} เป็น draft แล้ว\nสามารถแก้ไขได้ทันที`,
      [
        { text: 'ดูทีหลัง', style: 'cancel' },
        { text: 'เปิดแก้ไข', onPress: () => onOpenDoc(newDoc.id) },
      ]
    );
  };

  const handlePrint = () => Alert.alert('พิมพ์เอกสาร', `กำลังพิมพ์ ${doc.docNo}${doc.revNo > 0 ? ` Rev.${doc.revNo}` : ''}`);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: headerColor }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{doc.docNo}</Text>
            {doc.revNo > 0 && (
              <View style={styles.revBadge}>
                <Text style={styles.revBadgeText}>Rev.{doc.revNo}</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSub}>{isReceive ? 'ใบรับสินค้า' : 'ใบเบิกสินค้า'}</Text>
        </View>

        <TouchableOpacity onPress={handlePrint} style={styles.headerBtn}>
          <Ionicons name="print-outline" size={20} color={Colors.white} />
        </TouchableOpacity>

        {/* Revise button */}
        {canRevise && (
          <TouchableOpacity
            style={styles.reviseBtn}
            onPress={() => setShowReviseModal(true)}
          >
            <Ionicons name="refresh-circle-outline" size={16} color={Colors.white} />
            <Text style={styles.reviseBtnText}>Revise</Text>
          </TouchableOpacity>
        )}

        {/* Edit button (draft only) */}
        {canEdit && (
          <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={16} color={Colors.white} />
            <Text style={styles.editBtnText}>แก้ไข</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Status Banner ── */}
        {doc.status === 'revised' && (
          <View style={styles.revisedBanner}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.revisedBannerText}>
              เอกสารนี้ถูก Revise แล้ว มี Rev.{doc.revNo + 1} ที่ใช้งานอยู่
            </Text>
            {revChain.length > 0 && (
              <TouchableOpacity
                style={styles.revisedBannerBtn}
                onPress={() => {
                  const latest = revChain[revChain.length - 1];
                  if (latest.id !== doc.id) onOpenDoc(latest.id);
                }}
              >
                <Text style={styles.revisedBannerBtnText}>ดู Rev.ล่าสุด</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Meta Card ── */}
        <View style={styles.metaCard}>
          <View style={styles.metaTopRow}>
            <DocStatusBadge status={doc.status} />
            {doc.revNo > 0 && (
              <View style={styles.revNoBadge}>
                <Ionicons name="git-branch-outline" size={12} color={Colors.primary} />
                <Text style={styles.revNoText}>Revision {doc.revNo}</Text>
              </View>
            )}
          </View>

          {doc.reviseReason && (
            <View style={styles.revReasonBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.primary} />
              <Text style={styles.revReasonText}>เหตุผล: {doc.reviseReason}</Text>
            </View>
          )}

          {[
            { label: isReceive ? 'คลังรับ' : 'คลังเบิก', value: doc.warehouseName, icon: 'archive-outline' },
            ...(doc.toWarehouseName ? [{ label: 'คลังปลายทาง', value: doc.toWarehouseName, icon: 'navigate-outline' }] : []),
            ...(doc.supplierName    ? [{ label: 'Supplier',     value: doc.supplierName,    icon: 'business-outline' }] : []),
            ...(doc.remark          ? [{ label: 'หมายเหตุ',     value: doc.remark,           icon: 'chatbubble-outline' }] : []),
          ].map((row, i) => (
            <View key={i} style={styles.metaRow}>
              <View style={styles.metaLabelRow}>
                <Ionicons name={row.icon as any} size={13} color={Colors.textSecondary} />
                <Text style={styles.metaLabel}>{row.label}</Text>
              </View>
              <Text style={styles.metaValue}>{row.value}</Text>
            </View>
          ))}

          <View style={styles.metaDivider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>สร้างโดย</Text>
            <Text style={styles.metaValue}>{doc.createdBy} · {formatDateTime(doc.createdAt)}</Text>
          </View>
          {doc.confirmedBy && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>ยืนยันโดย</Text>
              <Text style={styles.metaValue}>{doc.confirmedBy} · {formatDateTime(doc.confirmedAt!)}</Text>
            </View>
          )}
        </View>

        {/* ── Revision Timeline ── */}
        <RevTimeline chain={revChain} currentId={doc.id} onOpen={onOpenDoc} />

        {/* ── Items Table ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>รายการสินค้า ({doc.items.length})</Text>

          {/* Table header */}
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 2.5 }]}>สินค้า</Text>
            <Text style={[styles.th, { flex: 0.9, textAlign: 'center' }]}>หน่วย</Text>
            <Text style={[styles.th, { flex: 0.7, textAlign: 'center' }]}>จำนวน</Text>
            {isReceive && <Text style={[styles.th, { flex: 1.1, textAlign: 'right' }]}>มูลค่า</Text>}
          </View>

          {doc.items.map((item, idx) => (
            <View key={item.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
              <View style={{ flex: 2.5 }}>
                <Text style={styles.tdName} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.tdCode}>{item.productCode}</Text>
                {item.ratio > 1 && (
                  <Text style={styles.tdRatio}>= {item.qtyBase} หน่วยฐาน</Text>
                )}
              </View>
              <View style={[{ flex: 0.9 }, styles.tdCenter]}>
                <View style={[styles.unitPill, item.ratio > 1 && { backgroundColor: Colors.warningLight }]}>
                  <Text style={[styles.unitPillText, item.ratio > 1 && { color: Colors.warning }]}>{item.unit}</Text>
                </View>
              </View>
              <Text style={[styles.tdCenter, styles.tdQty, { flex: 0.7 }]}>{item.qty}</Text>
              {isReceive && (
                <Text style={[styles.tdRight, styles.tdCost, { flex: 1.1 }]}>
                  ฿{formatCurrency(item.qty * item.costPrice)}
                </Text>
              )}
            </View>
          ))}

          {/* Grand total */}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>รวมทั้งหมด</Text>
            <Text style={styles.grandTotalQty}>{doc.totalQtyBase} หน่วยฐาน</Text>
            {isReceive && <Text style={styles.grandTotalCost}>฿{formatCurrency(totalCost)}</Text>}
          </View>
        </View>

        {/* ── Summary Cards ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summCard, { borderTopColor: headerColor }]}>
            <Text style={[styles.summNum, { color: headerColor }]}>{doc.totalItems}</Text>
            <Text style={styles.summCaption}>รายการ</Text>
          </View>
          <View style={[styles.summCard, { borderTopColor: Colors.primary }]}>
            <Text style={[styles.summNum, { color: Colors.primary }]}>{doc.totalQtyBase}</Text>
            <Text style={styles.summCaption}>หน่วยฐาน</Text>
          </View>
          {isReceive && (
            <View style={[styles.summCard, { borderTopColor: Colors.success }]}>
              <Text style={[styles.summNum, { color: Colors.success }]} numberOfLines={1}>
                ฿{formatCurrency(totalCost)}
              </Text>
              <Text style={styles.summCaption}>มูลค่ารวม</Text>
            </View>
          )}
        </View>

        {/* ── Action bar (bottom) ── */}
        {(canRevise || canEdit) && (
          <View style={styles.bottomActions}>
            {canEdit && (
              <TouchableOpacity style={[styles.bottomBtn, { backgroundColor: headerColor }]} onPress={onEdit}>
                <Ionicons name="pencil-outline" size={18} color={Colors.white} />
                <Text style={styles.bottomBtnText}>แก้ไขเอกสาร</Text>
              </TouchableOpacity>
            )}
            {canRevise && (
              <TouchableOpacity
                style={[styles.bottomBtn, styles.bottomBtnRevise]}
                onPress={() => setShowReviseModal(true)}
              >
                <Ionicons name="refresh-circle-outline" size={18} color={Colors.primary} />
                <Text style={[styles.bottomBtnText, { color: Colors.primary }]}>
                  Revise เอกสาร (สร้าง Rev.{doc.revNo + 1})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Revise Modal */}
      <ReviseModal
        visible={showReviseModal}
        docNo={doc.docNo}
        revNo={doc.revNo}
        onConfirm={handleRevise}
        onClose={() => setShowReviseModal(false)}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  revBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: BorderRadius.full, paddingHorizontal: 7, paddingVertical: 2 },
  revBadgeText: { fontSize: 11, color: Colors.white, fontWeight: '800' },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  headerBtn: { padding: Spacing.xs },
  reviseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  reviseBtnText: { fontSize: 12, color: Colors.white, fontWeight: '700' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  editBtnText: { fontSize: 12, color: Colors.white, fontWeight: '700' },
  scroll: { padding: Spacing.md, gap: Spacing.md },

  // Revised banner
  revisedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md, padding: Spacing.md,
    borderLeftWidth: 4, borderLeftColor: Colors.primary,
  },
  revisedBannerText: { ...Typography.body2, color: Colors.primary, flex: 1 },
  revisedBannerBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  revisedBannerBtnText: { fontSize: 11, color: Colors.white, fontWeight: '700' },

  // Meta Card
  metaCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  metaTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  revNoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  revNoText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  revReasonBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, padding: Spacing.sm },
  revReasonText: { ...Typography.body2, color: Colors.primary, flex: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  metaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaLabel: { ...Typography.body2, color: Colors.textSecondary, width: 100 },
  metaValue: { ...Typography.body2, color: Colors.text, fontWeight: '500', flex: 1, textAlign: 'right' },
  metaDivider: { height: 1, backgroundColor: Colors.border },

  // Items table
  section: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  sectionTitle: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  tableHead: { flexDirection: 'row', backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  th: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xs, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableRowAlt: { backgroundColor: Colors.backgroundSecondary },
  tdName: { ...Typography.body2, color: Colors.text, fontWeight: '500' },
  tdCode: { ...Typography.caption, color: Colors.textSecondary },
  tdRatio: { fontSize: 9, color: Colors.primary },
  tdCenter: { alignItems: 'center' },
  tdRight: { textAlign: 'right' },
  tdQty: { ...Typography.label, color: Colors.text, fontWeight: '700', textAlign: 'center' },
  tdCost: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  unitPill: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  unitPillText: { fontSize: 10, color: Colors.primary, fontWeight: '700' },
  grandTotal: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
  },
  grandTotalLabel: { ...Typography.label, color: Colors.text, flex: 1 },
  grandTotalQty: { ...Typography.label, color: Colors.text },
  grandTotalCost: { ...Typography.label, color: Colors.primary, fontWeight: '800', marginLeft: Spacing.md },

  // Summary cards
  summaryRow: { flexDirection: 'row', gap: Spacing.sm },
  summCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderTopWidth: 3, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  summNum: { fontSize: 20, fontWeight: '800' },
  summCaption: { ...Typography.caption, color: Colors.textSecondary },

  // Bottom actions
  bottomActions: { gap: Spacing.sm },
  bottomBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  bottomBtnRevise: { backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.primary },
  bottomBtnText: { ...Typography.button, color: Colors.white },
});
