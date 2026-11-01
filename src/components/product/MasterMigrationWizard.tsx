/**
 * MasterMigrationWizard (mobile) — ขั้น 2–4 ของการนำเข้ามาสเตอร์ แสดงใน Card ของหน้า ImportExportScreen
 *
 *   2 ตรวจสอบข้อมูล (ไมเกรต) → 3 ยืนยัน (ConfirmModal) → 4 ผลลัพธ์
 *
 * แสดงผลอย่างเดียว — state อยู่ใน useMasterMigration, การเทียบข้อมูลอยู่ใน buildMigrationPlan
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Badge, Button, ConfirmModal } from '../ui';
import type { BadgeVariant } from '../ui';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, ComponentSize, Spacing } from '../../constants/spacing';
import {
  CHANGE_KIND_LABELS, ChangeKind, ENTITY_LABELS, MIGRATION_ACTION_LABELS, MIGRATION_FILTERS,
  MigrationAction, MigrationFilter, MigrationPlan, MigrationRecord, MigrationResult,
  UOM_FIELD_LABELS, UomChange, VARIANT_FIELD_LABELS, VariantChange, confirmSummaryText, formatMigrationValue,
} from '../../utils/masterImportExport';
import { MasterMigrationFlow } from '../../hooks/useMasterMigration';

export interface MobileMigrationWizardProps {
  flow: MasterMigrationFlow;
}

const ACTION_VARIANT: Record<MigrationAction, BadgeVariant> = {
  create: 'success', update: 'info', unchanged: 'neutral', error: 'danger',
};
const KIND_VARIANT: Record<ChangeKind, BadgeVariant> = {
  added: 'success', changed: 'info', removed: 'danger', same: 'neutral',
};
const EMPTY = '(ว่าง)';
const show = (s: string | undefined) => (s === undefined || s === '' ? EMPTY : s);

const ChangeLine: React.FC<{ label: string; before?: string; after?: string; changed: boolean; removed?: boolean }> = ({ label, before, after, changed, removed }) => (
  <Text style={styles.line}>
    <Text style={styles.lineLabel}>{label}: </Text>
    {removed
      ? <Text style={styles.oldValue}>{show(before)}</Text>
      : changed
        ? <>
            <Text style={styles.oldValue}>{show(before)}</Text>
            <Text style={styles.arrow}>  →  </Text>
            <Text style={styles.newValue}>{show(after)}</Text>
          </>
        : <Text>{show(after ?? before)}</Text>}
  </Text>
);

const UomList: React.FC<{ list: UomChange[] }> = ({ list }) => (
  <View style={styles.subBox}>
    <Text style={styles.subTitle}>หน่วยนับ ({list.length})</Text>
    {list.map(u => {
      const view = u.after ?? u.before;
      return (
        <View key={`${u.kind}-${u.unit}`} style={styles.subItem}>
          <View style={styles.subHead}>
            <Text style={[styles.subName, u.kind === 'removed' && styles.oldValue]}>
              {u.unit}{view?.isBase ? ' · หน่วยหลัก' : ''}{view?.isDefault ? ' · เริ่มต้น POS' : ''}
            </Text>
            <Badge label={CHANGE_KIND_LABELS[u.kind]} variant={KIND_VARIANT[u.kind]} />
          </View>
          {(['ratio', 'costPrice', 'salePrice', 'barcodes'] as const).map(k => (
            <ChangeLine
              key={k}
              label={UOM_FIELD_LABELS[k]}
              before={u.before ? formatMigrationValue(u.before[k]) : undefined}
              after={u.after ? formatMigrationValue(u.after[k]) : undefined}
              changed={u.changedFields.includes(k)}
              removed={u.kind === 'removed'}
            />
          ))}
          {(['isBase', 'isDefault'] as const).filter(k => u.changedFields.includes(k)).map(k => (
            <ChangeLine key={k} label={UOM_FIELD_LABELS[k]} before={formatMigrationValue(u.before?.[k])} after={formatMigrationValue(u.after?.[k])} changed />
          ))}
        </View>
      );
    })}
  </View>
);

const VariantList: React.FC<{ list: VariantChange[] }> = ({ list }) => (
  <View style={styles.subBox}>
    <Text style={styles.subTitle}>ตัวเลือกสินค้า / variants ({list.length})</Text>
    {list.map(v => (
      <View key={`${v.kind}-${v.key}`} style={styles.subItem}>
        <View style={styles.subHead}>
          <Text style={[styles.subName, v.kind === 'removed' && styles.oldValue]}>{v.key}</Text>
          <Badge label={CHANGE_KIND_LABELS[v.kind]} variant={KIND_VARIANT[v.kind]} />
        </View>
        {(['sku', 'barcode', 'price', 'stockQty'] as const).map(k => (
          <ChangeLine
            key={k}
            label={VARIANT_FIELD_LABELS[k]}
            before={v.before ? formatMigrationValue(v.before[k]) : undefined}
            after={v.after ? formatMigrationValue(v.after[k]) : undefined}
            changed={v.changedFields.includes(k)}
            removed={v.kind === 'removed'}
          />
        ))}
      </View>
    ))}
  </View>
);

const RecordCard: React.FC<{ r: MigrationRecord; expanded: boolean; onToggle: () => void }> = ({ r, expanded, onToggle }) => {
  const canExpand = r.action !== 'error' && (r.uomChanges.length > 0 || r.variantChanges.length > 0);
  return (
    <View style={[styles.record, r.action === 'error' && styles.recordError]}>
      <View style={styles.recordHead}>
        <Badge label={MIGRATION_ACTION_LABELS[r.action]} variant={ACTION_VARIANT[r.action]} />
        <View style={styles.flex1}>
          <Text style={styles.recordKey} numberOfLines={2}>{r.key}</Text>
          {r.name ? <Text style={styles.hint} numberOfLines={2}>{r.name}</Text> : null}
          {r.rows.length > 0 && <Text style={styles.hint}>แถว {r.rows.join(', ')}</Text>}
        </View>
        {canExpand && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onToggle}
            accessibilityRole="button"
            accessibilityLabel={expanded ? `ซ่อนรายละเอียด ${r.key}` : `ดูหน่วยนับและตัวเลือกของ ${r.key}`}
            accessibilityState={{ expanded }}
          >
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={ComponentSize.icon.md} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {r.action === 'update' && r.changedFields.map(f => (
        <ChangeLine key={f.field} label={f.label} before={f.before} after={f.after} changed />
      ))}
      {(r.action === 'create' || r.action === 'unchanged') && (
        <Text style={styles.line}>{r.fields.filter(f => f.value !== '').map(f => `${f.label}: ${f.value}`).join(' · ')}</Text>
      )}
      {r.action === 'error' && (
        <>
          <Badge label="จะถูกข้าม" variant="danger" />
          {r.errors.map((e, i) => <Text key={`${e.row}-${i}`} style={styles.errorText}>• {e.message}</Text>)}
        </>
      )}
      {expanded && canExpand && (
        <View style={styles.detail}>
          {r.uomChanges.length > 0 && <UomList list={r.uomChanges} />}
          {r.variantChanges.length > 0
            ? <VariantList list={r.variantChanges} />
            : <Text style={styles.hint}>ไม่มีการเปลี่ยนแปลงตัวเลือกสินค้า</Text>}
        </View>
      )}
    </View>
  );
};

const Stat: React.FC<{ label: string; value: number; color: string; active?: boolean; onPress?: () => void }> = ({ label, value, color, active, onPress }) => (
  <TouchableOpacity
    style={[styles.stat, { borderColor: active ? color : Colors.border }]}
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole="button"
    accessibilityLabel={`${label} ${value} รายการ`}
    accessibilityState={{ selected: !!active }}
  >
    <Text style={[styles.statValue, { color: value > 0 ? color : Colors.gray400 }]}>{value.toLocaleString('th-TH')}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const MastersBox: React.FC<{ masters: MigrationPlan['mastersToCreate']; title: string }> = ({ masters, title }) => {
  const groups: [string, string[]][] = [['หมวดหมู่', masters.categories], ['แบรนด์', masters.brands], ['ผู้จำหน่าย', masters.suppliers]];
  const total = groups.reduce((n, [, l]) => n + l.length, 0);
  if (total === 0) return null;
  return (
    <View style={styles.mastersBox}>
      <Text style={styles.mastersTitle}>{title} {total} รายการ</Text>
      {groups.filter(([, l]) => l.length > 0).map(([g, l]) => (
        <Text key={g} style={styles.line}><Text style={styles.lineLabel}>{g}: </Text>{l.join(', ')}</Text>
      ))}
    </View>
  );
};

const ReviewStep: React.FC<{ flow: MasterMigrationFlow; mp: MigrationPlan }> = ({ flow, mp }) => {
  const s = mp.summary;
  const counts: Record<MigrationFilter, number> = { all: s.total, create: s.create, update: s.update, unchanged: s.unchanged, error: s.error };
  const label = ENTITY_LABELS[flow.entity];
  return (
    <View style={styles.section}>
      {flow.error !== '' && flow.step === 2 && <Alert type="error" message={flow.error} onDismiss={() => flow.setError('')} />}
      <View style={styles.statGrid}>
        <Stat label="ทั้งหมด" value={s.total} color={Colors.text} active={flow.filter === 'all'} onPress={() => flow.setFilter('all')} />
        <Stat label="เพิ่มใหม่" value={s.create} color={Colors.success} active={flow.filter === 'create'} onPress={() => flow.setFilter('create')} />
        <Stat label="อัปเดต" value={s.update} color={Colors.info} active={flow.filter === 'update'} onPress={() => flow.setFilter('update')} />
        <Stat label="ไม่เปลี่ยนแปลง" value={s.unchanged} color={Colors.textSecondary} active={flow.filter === 'unchanged'} onPress={() => flow.setFilter('unchanged')} />
        <Stat label="ข้อผิดพลาด (ข้าม)" value={s.error} color={Colors.danger} active={flow.filter === 'error'} onPress={() => flow.setFilter('error')} />
      </View>
      <MastersBox masters={mp.mastersToCreate} title="มาสเตอร์ที่จะสร้างใหม่" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityRole="tablist">
        {MIGRATION_FILTERS.map(f => {
          const active = flow.filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => flow.setFilter(f.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label} ({counts[f.key]})</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {flow.pageItems.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="file-tray-outline" size={ComponentSize.icon.xl} color={Colors.gray400} />
          <Text style={styles.hint}>ไม่มีข้อมูล</Text>
        </View>
      ) : flow.pageItems.map(r => (
        <RecordCard key={r.id} r={r} expanded={flow.expanded.has(r.id)} onToggle={() => flow.toggleExpanded(r.id)} />
      ))}

      {flow.pageCount > 1 && (
        <View style={styles.pager}>
          <Button title="ก่อนหน้า" variant="secondary" onPress={() => flow.setPage(flow.page - 1)} disabled={flow.page <= 1} style={styles.flex1} />
          <Text style={styles.hint}>หน้า {flow.page}/{flow.pageCount}</Text>
          <Button title="ถัดไป" variant="secondary" onPress={() => flow.setPage(flow.page + 1)} disabled={flow.page >= flow.pageCount} style={styles.flex1} />
        </View>
      )}

      {!flow.canProceed && (
        <Text style={styles.hint} accessibilityRole="alert">
          {s.error > 0 && s.unchanged === 0 ? 'ทุกรายการมีข้อผิดพลาด กรุณาแก้ไขไฟล์แล้วนำเข้าใหม่' : 'ไม่มีรายการที่ต้องบันทึก — ข้อมูลในไฟล์ตรงกับในระบบแล้ว'}
        </Text>
      )}
      <View style={styles.row}>
        <Button title="ย้อนกลับ" variant="secondary" onPress={flow.back} style={styles.flex1} />
        <Button title="ดำเนินการต่อ" onPress={flow.proceed} disabled={!flow.canProceed} style={styles.flex1} />
      </View>

      <ConfirmModal
        visible={flow.step === 3}
        title={`ยืนยันนำเข้า${label}`}
        confirmLabel="ยืนยันนำเข้า"
        cancelLabel="ยกเลิก"
        onConfirm={flow.confirm}
        onCancel={flow.cancelConfirm}
        loading={flow.busy === 'apply'}
        confirmDisabled={flow.busy === 'backup'}
      >
        <Text style={styles.confirmSummary}>{confirmSummaryText(mp)}</Text>
        <Alert type="warning" message="ข้อมูลเดิมที่ตรงกันจะถูกเขียนทับ และไม่สามารถย้อนกลับได้อัตโนมัติ — แนะนำให้ดาวน์โหลดข้อมูลสำรองก่อนนำเข้า" />
        {flow.error !== '' && flow.step === 3 && <Alert type="error" message={flow.error} />}
        <Button
          title="ดาวน์โหลดข้อมูลสำรองก่อนนำเข้า (.xlsx)"
          variant="outline"
          onPress={() => { void flow.downloadBackup(); }}
          loading={flow.busy === 'backup'}
          disabled={flow.busy === 'apply'}
          fullWidth
        />
      </ConfirmModal>
    </View>
  );
};

const MAX_SKIPPED_SHOWN = 30;
const ResultStep: React.FC<{ flow: MasterMigrationFlow; res: MigrationResult }> = ({ flow, res }) => (
  <View style={styles.section}>
    <View style={styles.resultHead}>
      <Ionicons name="checkmark-circle" size={ComponentSize.avatar.lg} color={Colors.success} />
      <Text style={styles.resultTitle}>นำเข้า{ENTITY_LABELS[flow.entity]}สำเร็จ</Text>
    </View>
    {flow.error !== '' && <Alert type="error" message={flow.error} onDismiss={() => flow.setError('')} />}
    <View style={styles.statGrid}>
      <Stat label="เพิ่มใหม่" value={res.created} color={Colors.success} />
      <Stat label="อัปเดต" value={res.updated} color={Colors.info} />
      <Stat label="ไม่เปลี่ยนแปลง" value={res.unchanged} color={Colors.textSecondary} />
      {flow.entity === 'product' && <Stat label="สร้างมาสเตอร์ใหม่" value={res.mastersCreated} color={Colors.lavenderDark} />}
      <Stat label="ข้าม (ข้อผิดพลาด)" value={res.skipped} color={Colors.danger} />
    </View>
    <MastersBox masters={res.mastersCreatedNames} title="มาสเตอร์ที่สร้างใหม่" />
    {res.errorRecords.length > 0 && (
      <View style={styles.skipBox}>
        <Text style={styles.skipTitle}>รายการที่ถูกข้าม ({res.errorRecords.length})</Text>
        {res.errorRecords.slice(0, MAX_SKIPPED_SHOWN).map(r => (
          <View key={r.id}>
            <Text style={styles.recordKey}>{r.key}</Text>
            {r.errors.map((e, i) => <Text key={`${e.row}-${i}`} style={styles.errorText}>• {e.message}</Text>)}
          </View>
        ))}
        {res.errorRecords.length > MAX_SKIPPED_SHOWN && (
          <Text style={styles.hint}>และอีก {res.errorRecords.length - MAX_SKIPPED_SHOWN} รายการ — ดูทั้งหมดในไฟล์ข้อผิดพลาด</Text>
        )}
        <Button title="ดาวน์โหลดรายการข้อผิดพลาด (.xlsx)" variant="outline" onPress={() => { void flow.downloadErrors(); }} loading={flow.busy === 'errors'} fullWidth />
      </View>
    )}
    <View style={styles.row}>
      <Button title="นำเข้าไฟล์ใหม่" variant="secondary" onPress={() => { flow.reset(); void flow.pickAndReview(); }} style={styles.flex1} />
      <Button title="เสร็จสิ้น" onPress={flow.reset} style={styles.flex1} />
    </View>
  </View>
);

export const MobileMigrationWizard: React.FC<MobileMigrationWizardProps> = ({ flow }) => {
  const mp = flow.migration;
  if (!mp || flow.step < 2) return null;
  return (
    <View style={styles.section}>
      <View style={styles.fileRow}>
        <Ionicons name="document-text" size={ComponentSize.icon.lg} color={Colors.success} />
        <View style={styles.flex1}>
          <Text style={styles.recordKey} numberOfLines={1}>{flow.fileName}</Text>
          <Text style={styles.hint}>{flow.step === 4 ? 'ผลลัพธ์การนำเข้า' : 'ตรวจสอบข้อมูลก่อนนำเข้า (ยังไม่บันทึก)'}</Text>
        </View>
        {flow.step !== 4 && (
          <TouchableOpacity onPress={flow.back} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="ยกเลิกไฟล์นี้ (ไม่บันทึก)">
            <Ionicons name="close-circle" size={ComponentSize.icon.lg} color={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>
      {flow.step === 4 && flow.result ? <ResultStep flow={flow} res={flow.result} /> : <ReviewStep flow={flow} mp={mp} />}
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  section: { gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  hint: { ...Typography.caption, color: Colors.textSecondary },
  iconBtn: { minWidth: ComponentSize.button.md, minHeight: ComponentSize.button.md, alignItems: 'center', justifyContent: 'center' },
  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.successLight, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stat: {
    flexGrow: 1, flexBasis: '30%', minHeight: ComponentSize.button.md, alignItems: 'center',
    borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 2, backgroundColor: Colors.surface,
  },
  statValue: { ...Typography.h3 },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  mastersBox: { backgroundColor: Colors.lavender, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.xs },
  mastersTitle: { ...Typography.label, color: Colors.lavenderDark },
  chips: { gap: Spacing.sm },
  chip: {
    minHeight: ComponentSize.button.md, paddingHorizontal: Spacing.md, justifyContent: 'center',
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { ...Typography.body2, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },
  record: { gap: Spacing.xs, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  recordError: { backgroundColor: Colors.dangerLight, borderColor: Colors.danger },
  recordHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  recordKey: { ...Typography.label, color: Colors.text },
  line: { ...Typography.caption, color: Colors.text },
  lineLabel: { fontWeight: '600', color: Colors.textSecondary },
  oldValue: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  newValue: { color: Colors.primary, fontWeight: '700' },
  arrow: { color: Colors.textSecondary },
  errorText: { ...Typography.caption, color: Colors.danger },
  detail: { gap: Spacing.sm, marginTop: Spacing.xs },
  subBox: { gap: Spacing.xs, padding: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.backgroundSecondary },
  subTitle: { ...Typography.label, color: Colors.text },
  subItem: { gap: Spacing.xs / 2, paddingVertical: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  subHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  subName: { ...Typography.label, color: Colors.text, flex: 1 },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  pager: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  confirmSummary: { ...Typography.subtitle2, color: Colors.primary, fontWeight: '700' },
  resultHead: { alignItems: 'center', gap: Spacing.xs },
  resultTitle: { ...Typography.h3, color: Colors.success },
  skipBox: { backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm },
  skipTitle: { ...Typography.label, color: Colors.danger },
});
