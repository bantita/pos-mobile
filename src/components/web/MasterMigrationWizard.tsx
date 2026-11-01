/**
 * MasterMigrationWizard (เว็บ) — หน้าตรวจสอบข้อมูลก่อนนำเข้ามาสเตอร์
 *
 *   1 เลือกไฟล์ → 2 ตรวจสอบข้อมูล (ไมเกรต) → 3 ยืนยัน → 4 ผลลัพธ์
 *
 * แสดงผลอย่างเดียว — state/การบันทึกอยู่ใน useMasterMigration, การเทียบข้อมูลอยู่ใน
 * buildMigrationPlan (utils/masterImportExport) ใช้ร่วมกับหน้า mobile
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import {
  CHANGE_KIND_LABELS, ChangeKind, ENTITY_LABELS, MIGRATION_ACTION_LABELS, MIGRATION_FILTERS,
  MigrationAction, MigrationFilter, MigrationPlan, MigrationRecord, MigrationResult,
  UomChange, UomView, VariantChange, VariantView, confirmSummaryText, formatMigrationValue,
} from '../../utils/masterImportExport';
import { MIGRATION_STEPS, MasterMigrationFlow } from '../../hooks/useMasterMigration';

export interface MasterMigrationWizardProps {
  flow: MasterMigrationFlow;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ACTION_TONE: Record<MigrationAction, { fg: string; bg: string }> = {
  create: { fg: WebColors.success, bg: WebColors.successLight },
  update: { fg: WebColors.info, bg: WebColors.infoLight },
  unchanged: { fg: WebColors.textSecondary, bg: WebColors.gray100 },
  error: { fg: WebColors.danger, bg: WebColors.dangerLight },
};
const KIND_TONE: Record<ChangeKind, { fg: string; bg: string }> = {
  added: ACTION_TONE.create,
  changed: ACTION_TONE.update,
  removed: ACTION_TONE.error,
  same: ACTION_TONE.unchanged,
};
const EMPTY = '(ว่าง)';
const show = (s: string | undefined) => (s === undefined || s === '' ? EMPTY : s);

// ─── Small building blocks ───────────────────────────────────────────────────
const Tag: React.FC<{ label: string; tone: { fg: string; bg: string } }> = ({ label, tone }) => (
  <View style={[st.tag, { backgroundColor: tone.bg }]}>
    <Text style={[st.tagText, { color: tone.fg }]} numberOfLines={1}>{label}</Text>
  </View>
);

type BtnVariant = 'primary' | 'secondary' | 'outline' | 'danger';
interface BtnProps {
  label: string;
  onPress: () => void;
  variant?: BtnVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}
const Btn: React.FC<BtnProps> = ({ label, onPress, variant = 'primary', icon, loading = false, disabled = false, accessibilityLabel }) => {
  const off = disabled || loading;
  const fg = variant === 'primary' || variant === 'danger' ? WebColors.white : variant === 'outline' ? WebColors.primary : WebColors.text;
  return (
    <TouchableOpacity
      style={[st.btn, st[`btn_${variant}`], off && st.btnDisabled]}
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: off, busy: loading }}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : (
        <>
          {icon && <Ionicons name={icon} size={16} color={fg} />}
          <Text style={[st.btnText, { color: fg }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const StepBar: React.FC<{ current: number }> = ({ current }) => (
  <View
    style={st.stepBar}
    accessibilityRole="progressbar"
    accessibilityLabel={`ขั้นตอนที่ ${current} จาก ${MIGRATION_STEPS.length}: ${MIGRATION_STEPS[current - 1]}`}
    accessibilityValue={{ min: 1, max: MIGRATION_STEPS.length, now: current }}
  >
    {MIGRATION_STEPS.map((label, i) => {
      const n = i + 1;
      const done = n < current;
      const active = n === current;
      return (
        <React.Fragment key={label}>
          {i > 0 && <View style={[st.stepLine, (done || active) && st.stepLineDone]} />}
          <View style={st.stepItem}>
            <View style={[st.stepDot, done && st.stepDotDone, active && st.stepDotActive]}>
              {done
                ? <Ionicons name="checkmark" size={14} color={WebColors.white} />
                : <Text style={[st.stepNum, active && st.stepNumActive]}>{n}</Text>}
            </View>
            <Text style={[st.stepLabel, active && st.stepLabelActive]} numberOfLines={1}>{label}</Text>
          </View>
        </React.Fragment>
      );
    })}
  </View>
);

const StatCard: React.FC<{ label: string; value: number; tone: { fg: string; bg: string }; active?: boolean; onPress?: () => void }> = ({ label, value, tone, active, onPress }) => (
  <TouchableOpacity
    style={[st.stat, { backgroundColor: tone.bg }, active && { borderColor: tone.fg }]}
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole="button"
    accessibilityLabel={`${label} ${value} รายการ`}
    accessibilityState={{ selected: !!active }}
  >
    <Text style={[st.statValue, { color: tone.fg }]}>{value.toLocaleString('th-TH')}</Text>
    <Text style={st.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const MastersBox: React.FC<{ masters: MigrationPlan['mastersToCreate']; title: string }> = ({ masters, title }) => {
  const groups: [string, string[]][] = [['หมวดหมู่', masters.categories], ['แบรนด์', masters.brands], ['ผู้จำหน่าย', masters.suppliers]];
  const total = groups.reduce((n, [, l]) => n + l.length, 0);
  if (total === 0) return null;
  return (
    <View style={st.mastersBox}>
      <Text style={st.mastersTitle}>{title} {total} รายการ</Text>
      {groups.filter(([, l]) => l.length > 0).map(([g, l]) => (
        <View key={g} style={st.mastersRow}>
          <Text style={st.mastersGroup}>{g} ({l.length}):</Text>
          <View style={st.chipWrap}>
            {l.map(n => <Tag key={n} label={n} tone={{ fg: WebColors.purple, bg: WebColors.white }} />)}
          </View>
        </View>
      ))}
    </View>
  );
};

/** ค่าเดิม → ค่าใหม่ (เมื่อเปลี่ยน) หรือค่าเดียว */
const ChangeText: React.FC<{ before?: string; after?: string; changed: boolean; removed?: boolean }> = ({ before, after, changed, removed }) => {
  if (removed) return <Text style={[st.cellText, st.oldValue]}>{show(before)}</Text>;
  if (changed) {
    return (
      <Text style={st.cellText}>
        <Text style={st.oldValue}>{show(before)}</Text>
        <Text style={st.arrow}>  →  </Text>
        <Text style={st.newValue}>{show(after)}</Text>
      </Text>
    );
  }
  return <Text style={st.cellText}>{show(after ?? before)}</Text>;
};

// ─── Product detail (UOM + variants) ─────────────────────────────────────────
const UOM_COLS: { key: keyof UomView; label: string; flex: number }[] = [
  { key: 'ratio', label: 'อัตราส่วน', flex: 1 },
  { key: 'costPrice', label: 'ราคาทุน', flex: 1 },
  { key: 'salePrice', label: 'ราคาขาย', flex: 1 },
  { key: 'barcodes', label: 'บาร์โค้ด', flex: 3 },
];
const VARIANT_COLS: { key: keyof VariantView; label: string; flex: number }[] = [
  { key: 'sku', label: 'SKU', flex: 2 },
  { key: 'barcode', label: 'บาร์โค้ด', flex: 2 },
  { key: 'price', label: 'ราคา', flex: 1 },
  { key: 'stockQty', label: 'สต๊อก', flex: 1 },
];

const UomTable: React.FC<{ list: UomChange[] }> = ({ list }) => (
  <View style={st.subTable}>
    <Text style={st.subTitle}>หน่วยนับ ({list.length})</Text>
    <View style={[st.subRow, st.subHead]}>
      <Text style={[st.subHeadText, { flex: 2 }]}>หน่วย</Text>
      {UOM_COLS.map(c => <Text key={c.key} style={[st.subHeadText, { flex: c.flex }]}>{c.label}</Text>)}
      <Text style={[st.subHeadText, { flex: 1 }]}>การเปลี่ยนแปลง</Text>
    </View>
    {list.map(u => {
      const view = u.after ?? u.before;
      const flags = [view?.isBase ? 'หน่วยหลัก' : '', view?.isDefault ? 'เริ่มต้น POS' : ''].filter(Boolean).join(' · ');
      const flagChanged = u.changedFields.includes('isBase') || u.changedFields.includes('isDefault');
      return (
        <View key={`${u.kind}-${u.unit}`} style={[st.subRow, u.kind !== 'same' && { backgroundColor: KIND_TONE[u.kind].bg }]}>
          <View style={{ flex: 2, gap: 2 }}>
            <Text style={[st.cellText, st.bold, u.kind === 'removed' && st.oldValue]}>{u.unit}</Text>
            {flags !== '' && <Text style={[st.cellHint, flagChanged && st.newValue]}>{flags}{flagChanged ? ' (เปลี่ยน)' : ''}</Text>}
          </View>
          {UOM_COLS.map(c => (
            <View key={c.key} style={{ flex: c.flex }}>
              <ChangeText
                before={u.before ? formatMigrationValue(u.before[c.key]) : undefined}
                after={u.after ? formatMigrationValue(u.after[c.key]) : undefined}
                changed={u.changedFields.includes(c.key)}
                removed={u.kind === 'removed'}
              />
            </View>
          ))}
          <View style={{ flex: 1 }}><Tag label={CHANGE_KIND_LABELS[u.kind]} tone={KIND_TONE[u.kind]} /></View>
        </View>
      );
    })}
  </View>
);

const VariantTable: React.FC<{ list: VariantChange[] }> = ({ list }) => (
  <View style={st.subTable}>
    <Text style={st.subTitle}>ตัวเลือกสินค้า / variants ({list.length})</Text>
    <View style={[st.subRow, st.subHead]}>
      <Text style={[st.subHeadText, { flex: 3 }]}>ตัวเลือก</Text>
      {VARIANT_COLS.map(c => <Text key={c.key} style={[st.subHeadText, { flex: c.flex }]}>{c.label}</Text>)}
      <Text style={[st.subHeadText, { flex: 1 }]}>การเปลี่ยนแปลง</Text>
    </View>
    {list.map(v => (
      <View key={`${v.kind}-${v.key}`} style={[st.subRow, v.kind !== 'same' && { backgroundColor: KIND_TONE[v.kind].bg }]}>
        <Text style={[st.cellText, st.bold, { flex: 3 }, v.kind === 'removed' && st.oldValue]}>{v.key}</Text>
        {VARIANT_COLS.map(c => (
          <View key={c.key} style={{ flex: c.flex }}>
            <ChangeText
              before={v.before ? formatMigrationValue(v.before[c.key]) : undefined}
              after={v.after ? formatMigrationValue(v.after[c.key]) : undefined}
              changed={v.changedFields.includes(c.key)}
              removed={v.kind === 'removed'}
            />
          </View>
        ))}
        <View style={{ flex: 1 }}><Tag label={CHANGE_KIND_LABELS[v.kind]} tone={KIND_TONE[v.kind]} /></View>
      </View>
    ))}
  </View>
);

// ─── Record row ──────────────────────────────────────────────────────────────
const RecordRow: React.FC<{ r: MigrationRecord; expanded: boolean; onToggle: () => void }> = ({ r, expanded, onToggle }) => {
  const canExpand = r.action !== 'error' && (r.uomChanges.length > 0 || r.variantChanges.length > 0);
  const tone = ACTION_TONE[r.action];
  return (
    <View style={[st.recordWrap, r.action === 'error' && st.recordError]}>
      <View style={st.recordRow}>
        <View style={st.colStatus}><Tag label={MIGRATION_ACTION_LABELS[r.action]} tone={tone} /></View>
        <View style={st.colKey}>
          <Text style={[st.cellText, st.bold]} numberOfLines={2}>{r.key}</Text>
          {r.name ? <Text style={st.cellHint} numberOfLines={2}>{r.name}</Text> : null}
          {r.rows.length > 0 && <Text style={st.cellHint}>แถว {r.rows.join(', ')}</Text>}
        </View>
        <View style={st.colDetail}>
          {r.action === 'update' && r.changedFields.map(f => (
            <View key={f.field} style={st.changeLine}>
              <Text style={st.changeLabel}>{f.label}:</Text>
              <View style={st.flex1}><ChangeText before={f.before} after={f.after} changed /></View>
            </View>
          ))}
          {(r.action === 'create' || r.action === 'unchanged') && (
            <Text style={st.cellText}>
              {r.fields.filter(f => f.value !== '').map(f => `${f.label}: ${f.value}`).join('  ·  ')}
            </Text>
          )}
          {r.action === 'error' && (
            <>
              <Tag label="จะถูกข้าม" tone={tone} />
              {r.errors.map((e, i) => <Text key={`${e.row}-${i}`} style={st.errorText}>• {e.message}</Text>)}
            </>
          )}
        </View>
        <View style={st.colExpand}>
          {canExpand && (
            <TouchableOpacity
              style={st.iconBtn}
              onPress={onToggle}
              accessibilityRole="button"
              accessibilityLabel={expanded ? `ซ่อนรายละเอียด ${r.key}` : `ดูหน่วยนับและตัวเลือกของ ${r.key}`}
              accessibilityState={{ expanded }}
            >
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={WebColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {expanded && canExpand && (
        <View style={st.detail}>
          {r.uomChanges.length > 0 && <UomTable list={r.uomChanges} />}
          {r.variantChanges.length > 0
            ? <VariantTable list={r.variantChanges} />
            : <Text style={st.cellHint}>ไม่มีการเปลี่ยนแปลงตัวเลือกสินค้า</Text>}
        </View>
      )}
    </View>
  );
};

// ─── Review (step 2) ─────────────────────────────────────────────────────────
const ReviewBody: React.FC<{ flow: MasterMigrationFlow; mp: MigrationPlan }> = ({ flow, mp }) => {
  const s = mp.summary;
  const counts: Record<MigrationFilter, number> = { all: s.total, create: s.create, update: s.update, unchanged: s.unchanged, error: s.error };
  return (
    <ScrollView style={st.body} contentContainerStyle={st.bodyContent}>
      {flow.error !== '' && flow.step === 2 && (
        <View style={st.bannerError} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={16} color={WebColors.danger} />
          <Text style={st.bannerErrorText}>{flow.error}</Text>
          <TouchableOpacity style={st.iconBtn} onPress={() => flow.setError('')} accessibilityRole="button" accessibilityLabel="ปิดข้อความ">
            <Ionicons name="close" size={16} color={WebColors.danger} />
          </TouchableOpacity>
        </View>
      )}

      <View style={st.statRow}>
        <StatCard label="ทั้งหมด" value={s.total} tone={{ fg: WebColors.text, bg: WebColors.gray50 }} active={flow.filter === 'all'} onPress={() => flow.setFilter('all')} />
        <StatCard label="เพิ่มใหม่" value={s.create} tone={ACTION_TONE.create} active={flow.filter === 'create'} onPress={() => flow.setFilter('create')} />
        <StatCard label="อัปเดต" value={s.update} tone={ACTION_TONE.update} active={flow.filter === 'update'} onPress={() => flow.setFilter('update')} />
        <StatCard label="ไม่เปลี่ยนแปลง" value={s.unchanged} tone={ACTION_TONE.unchanged} active={flow.filter === 'unchanged'} onPress={() => flow.setFilter('unchanged')} />
        <StatCard label="ข้อผิดพลาด (ข้าม)" value={s.error} tone={s.error > 0 ? ACTION_TONE.error : ACTION_TONE.unchanged} active={flow.filter === 'error'} onPress={() => flow.setFilter('error')} />
      </View>

      <MastersBox masters={mp.mastersToCreate} title="มาสเตอร์ที่จะสร้างใหม่" />

      <View style={st.tabs} accessibilityRole="tablist">
        {MIGRATION_FILTERS.map(f => {
          const active = flow.filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[st.tab, active && st.tabActive]}
              onPress={() => flow.setFilter(f.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[st.tabText, active && st.tabTextActive]}>{f.label} ({counts[f.key].toLocaleString('th-TH')})</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={st.table}>
        <View style={[st.recordRow, st.tableHead]}>
          <Text style={[st.headText, st.colStatus]}>สถานะ</Text>
          <Text style={[st.headText, st.colKey]}>รหัส/ชื่อ</Text>
          <Text style={[st.headText, st.colDetail]}>ข้อมูล / ค่าเดิม → ค่าใหม่</Text>
          <View style={st.colExpand} />
        </View>
        {flow.pageItems.length === 0 ? (
          <View style={st.empty}>
            <Ionicons name="file-tray-outline" size={40} color={WebColors.border} />
            <Text style={st.emptyText}>ไม่มีข้อมูล</Text>
          </View>
        ) : flow.pageItems.map(r => (
          <RecordRow key={r.id} r={r} expanded={flow.expanded.has(r.id)} onToggle={() => flow.toggleExpanded(r.id)} />
        ))}
      </View>

      {flow.pageCount > 1 && (
        <View style={st.pager}>
          <Btn label="ก่อนหน้า" variant="secondary" icon="chevron-back" onPress={() => flow.setPage(flow.page - 1)} disabled={flow.page <= 1} />
          <Text style={st.pagerText}>หน้า {flow.page} / {flow.pageCount} · {flow.filteredCount.toLocaleString('th-TH')} รายการ</Text>
          <Btn label="ถัดไป" variant="secondary" icon="chevron-forward" onPress={() => flow.setPage(flow.page + 1)} disabled={flow.page >= flow.pageCount} />
        </View>
      )}
    </ScrollView>
  );
};

// ─── Confirm (step 3) ────────────────────────────────────────────────────────
const ConfirmDialog: React.FC<{ flow: MasterMigrationFlow; mp: MigrationPlan; label: string }> = ({ flow, mp, label }) => (
  <View style={st.confirmOverlay}>
    <View style={st.confirmBox} accessibilityViewIsModal accessibilityLabel={`ยืนยันนำเข้า${label}`}>
      <Text style={st.confirmTitle} accessibilityRole="header">ยืนยันนำเข้า{label}</Text>
      <Text style={st.confirmSummary}>{confirmSummaryText(mp)}</Text>
      <View style={st.warnBox} accessibilityRole="alert">
        <Ionicons name="warning" size={18} color={WebColors.warning} />
        <Text style={st.warnText}>
          ข้อมูลเดิมที่ตรงกันจะถูกเขียนทับ และไม่สามารถย้อนกลับได้อัตโนมัติ — แนะนำให้ดาวน์โหลดข้อมูลสำรองก่อนนำเข้า
        </Text>
      </View>
      {flow.error !== '' && (
        <View style={st.bannerError} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={16} color={WebColors.danger} />
          <Text style={st.bannerErrorText}>{flow.error}</Text>
        </View>
      )}
      <Btn
        label="ดาวน์โหลดข้อมูลสำรองก่อนนำเข้า (.xlsx)"
        variant="outline"
        icon="cloud-download-outline"
        onPress={flow.downloadBackup}
        loading={flow.busy === 'backup'}
        disabled={flow.busy !== null && flow.busy !== 'backup'}
      />
      <View style={st.confirmFooter}>
        <Btn label="ยกเลิก" variant="secondary" onPress={flow.cancelConfirm} disabled={flow.busy === 'apply'} />
        <Btn label="ยืนยันนำเข้า" variant="primary" icon="checkmark" onPress={flow.confirm} loading={flow.busy === 'apply'} disabled={flow.busy === 'backup'} />
      </View>
    </View>
  </View>
);

// ─── Result (step 4) ─────────────────────────────────────────────────────────
const MAX_SKIPPED_SHOWN = 50;
const ResultBody: React.FC<{ flow: MasterMigrationFlow; res: MigrationResult; label: string; isProduct: boolean }> = ({ flow, res, label, isProduct }) => (
  <ScrollView style={st.body} contentContainerStyle={st.bodyContent}>
    <View style={st.resultHead}>
      <Ionicons name="checkmark-circle" size={48} color={WebColors.success} />
      <Text style={st.resultTitle}>นำเข้า{label}สำเร็จ</Text>
    </View>
    {flow.error !== '' && (
      <View style={st.bannerError} accessibilityRole="alert">
        <Ionicons name="alert-circle" size={16} color={WebColors.danger} />
        <Text style={st.bannerErrorText}>{flow.error}</Text>
      </View>
    )}
    <View style={st.statRow}>
      <StatCard label="เพิ่มใหม่" value={res.created} tone={ACTION_TONE.create} />
      <StatCard label="อัปเดต" value={res.updated} tone={ACTION_TONE.update} />
      <StatCard label="ไม่เปลี่ยนแปลง" value={res.unchanged} tone={ACTION_TONE.unchanged} />
      {isProduct && <StatCard label="สร้างมาสเตอร์ใหม่" value={res.mastersCreated} tone={{ fg: WebColors.purple, bg: WebColors.purpleLight }} />}
      <StatCard label="ข้าม (ข้อผิดพลาด)" value={res.skipped} tone={res.skipped > 0 ? ACTION_TONE.error : ACTION_TONE.unchanged} />
    </View>
    <MastersBox masters={res.mastersCreatedNames} title="มาสเตอร์ที่สร้างใหม่" />
    {res.errorRecords.length > 0 && (
      <View style={st.skipBox}>
        <View style={st.skipHead}>
          <Text style={st.skipTitle}>รายการที่ถูกข้าม ({res.errorRecords.length})</Text>
          <Btn label="ดาวน์โหลดรายการข้อผิดพลาด (.xlsx)" variant="outline" icon="document-text-outline" onPress={flow.downloadErrors} loading={flow.busy === 'errors'} />
        </View>
        {res.errorRecords.slice(0, MAX_SKIPPED_SHOWN).map(r => (
          <View key={r.id} style={st.skipItem}>
            <Text style={[st.cellText, st.bold]}>{r.key}</Text>
            {r.errors.map((e, i) => <Text key={`${e.row}-${i}`} style={st.errorText}>• {e.message}</Text>)}
          </View>
        ))}
        {res.errorRecords.length > MAX_SKIPPED_SHOWN && (
          <Text style={st.cellHint}>และอีก {res.errorRecords.length - MAX_SKIPPED_SHOWN} รายการ — ดูทั้งหมดในไฟล์ข้อผิดพลาด</Text>
        )}
      </View>
    )}
  </ScrollView>
);

// ─── Wizard ──────────────────────────────────────────────────────────────────
export const MasterMigrationWizard: React.FC<MasterMigrationWizardProps> = ({ flow }) => {
  const mp = flow.migration;
  const visible = flow.step >= 2 && mp !== null;
  const label = ENTITY_LABELS[flow.entity];
  const close = flow.step === 3 ? flow.cancelConfirm : flow.step === 4 ? flow.reset : flow.back;
  const blockedHint = mp && !flow.canProceed
    ? (mp.summary.error > 0 && mp.summary.unchanged === 0 ? 'ทุกรายการมีข้อผิดพลาด กรุณาแก้ไขไฟล์แล้วนำเข้าใหม่' : 'ไม่มีรายการที่ต้องบันทึก — ข้อมูลในไฟล์ตรงกับในระบบแล้ว')
    : '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={st.overlay}>
        <View style={st.modal}>
          <View style={st.header}>
            <View style={st.flex1}>
              <Text style={st.title}>นำเข้า{label} — {flow.step === 4 ? 'ผลลัพธ์' : 'ตรวจสอบข้อมูล (ไมเกรต)'}</Text>
              <Text style={st.sub} numberOfLines={1}>{flow.fileName}</Text>
            </View>
            <TouchableOpacity style={st.iconBtn} onPress={close} disabled={flow.busy === 'apply'} accessibilityRole="button" accessibilityLabel="ปิด">
              <Ionicons name="close" size={20} color={WebColors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={st.stepWrap}><StepBar current={flow.step} /></View>

          {mp && flow.step === 4 && flow.result
            ? <ResultBody flow={flow} res={flow.result} label={label} isProduct={flow.entity === 'product'} />
            : mp && <ReviewBody flow={flow} mp={mp} />}

          <View style={st.footer}>
            {flow.step === 4 ? (
              <>
                <View style={st.flex1} />
                <Btn label="นำเข้าไฟล์ใหม่" variant="secondary" icon="cloud-upload-outline" onPress={() => { flow.reset(); void flow.pickAndReview(); }} />
                <Btn label="เสร็จสิ้น" onPress={flow.reset} />
              </>
            ) : (
              <>
                <Text style={[st.footerHint, st.flex1]}>{blockedHint}</Text>
                <Btn label="ย้อนกลับ" variant="secondary" icon="arrow-back" onPress={flow.back} disabled={flow.busy === 'apply'} accessibilityLabel="ย้อนกลับไปเลือกไฟล์ (ไม่บันทึก)" />
                <Btn label="ดำเนินการต่อ" icon="arrow-forward" onPress={flow.proceed} disabled={!flow.canProceed || flow.step === 3} />
              </>
            )}
          </View>
        </View>
        {flow.step === 3 && mp && <ConfirmDialog flow={flow} mp={mp} label={label} />}
      </View>
    </Modal>
  );
};

const st = StyleSheet.create({
  flex1: { flex: 1 },
  bold: { fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: WebColors.overlay, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: WebColors.cardBg, borderRadius: 12, width: '100%', maxWidth: 1100, height: '92%', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  title: { fontSize: 15, fontWeight: '800', color: WebColors.text },
  sub: { fontSize: 12, color: WebColors.textSecondary },
  stepWrap: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: WebColors.border, backgroundColor: WebColors.gray50 },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 12 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: WebColors.border },
  footerHint: { fontSize: 12, color: WebColors.textSecondary },
  iconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  // step bar
  stepBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  stepLine: { flex: 1, height: 2, backgroundColor: WebColors.border },
  stepLineDone: { backgroundColor: WebColors.primary },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: WebColors.white, borderWidth: 1, borderColor: WebColors.border },
  stepDotDone: { backgroundColor: WebColors.success, borderColor: WebColors.success },
  stepDotActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  stepNum: { fontSize: 12, fontWeight: '700', color: WebColors.textSecondary },
  stepNumActive: { color: WebColors.white },
  stepLabel: { fontSize: 12, color: WebColors.textSecondary, flexShrink: 1 },
  stepLabelActive: { color: WebColors.primary, fontWeight: '700' },
  // buttons
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  btn_primary: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  btn_secondary: { backgroundColor: WebColors.cardBg, borderColor: WebColors.border },
  btn_outline: { backgroundColor: WebColors.cardBg, borderColor: WebColors.primary },
  btn_danger: { backgroundColor: WebColors.danger, borderColor: WebColors.danger },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 13, fontWeight: '700' },
  // tags
  tag: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, fontWeight: '700' },
  // stats
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flex: 1, minWidth: 120, minHeight: 44, borderRadius: 8, padding: 12, alignItems: 'center', gap: 2, borderWidth: 2, borderColor: 'transparent' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: WebColors.textSecondary, textAlign: 'center' },
  // masters
  mastersBox: { backgroundColor: WebColors.purpleLight, borderRadius: 8, padding: 12, gap: 6 },
  mastersTitle: { fontSize: 12, fontWeight: '700', color: WebColors.purple },
  mastersRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  mastersGroup: { fontSize: 12, fontWeight: '600', color: WebColors.text },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 },
  // tabs
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  tab: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: WebColors.primary },
  tabText: { fontSize: 13, color: WebColors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: WebColors.primary },
  // table
  table: { borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, overflow: 'hidden' },
  tableHead: { backgroundColor: WebColors.gray50, borderBottomWidth: 1, borderBottomColor: WebColors.border },
  headText: { fontSize: 12, fontWeight: '700', color: WebColors.textSecondary },
  recordWrap: { borderBottomWidth: 1, borderBottomColor: WebColors.border },
  recordError: { backgroundColor: WebColors.dangerLight },
  recordRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  colStatus: { flex: 1, minWidth: 80 },
  colKey: { flex: 2, gap: 2 },
  colDetail: { flex: 6, gap: 4 },
  colExpand: { minWidth: 44, alignItems: 'center' },
  cellText: { fontSize: 12, color: WebColors.text, lineHeight: 18 },
  cellHint: { fontSize: 11, color: WebColors.textSecondary },
  oldValue: { color: WebColors.textSecondary, textDecorationLine: 'line-through' },
  newValue: { color: WebColors.primary, fontWeight: '700' },
  arrow: { color: WebColors.textSecondary },
  changeLine: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  changeLabel: { fontSize: 12, fontWeight: '600', color: WebColors.textSecondary },
  errorText: { fontSize: 12, color: WebColors.danger },
  detail: { paddingHorizontal: 12, paddingBottom: 12, gap: 12, backgroundColor: WebColors.gray50 },
  subTable: { borderWidth: 1, borderColor: WebColors.border, borderRadius: 8, overflow: 'hidden', backgroundColor: WebColors.white },
  subTitle: { fontSize: 12, fontWeight: '700', color: WebColors.text, padding: 8 },
  subHead: { backgroundColor: WebColors.gray100 },
  subHeadText: { fontSize: 11, fontWeight: '700', color: WebColors.textSecondary },
  subRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: WebColors.border },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: WebColors.textSecondary },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' },
  pagerText: { fontSize: 12, color: WebColors.textSecondary },
  // banners
  bannerError: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WebColors.dangerLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  bannerErrorText: { flex: 1, fontSize: 12, color: WebColors.danger },
  // confirm
  confirmOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: WebColors.overlay, alignItems: 'center', justifyContent: 'center', padding: 20 },
  confirmBox: { backgroundColor: WebColors.cardBg, borderRadius: 12, width: '100%', maxWidth: 520, padding: 20, gap: 12 },
  confirmTitle: { fontSize: 16, fontWeight: '800', color: WebColors.text },
  confirmSummary: { fontSize: 14, fontWeight: '700', color: WebColors.primary, lineHeight: 22 },
  warnBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: WebColors.warningLight, borderRadius: 8, padding: 12 },
  warnText: { flex: 1, fontSize: 12, color: WebColors.text, lineHeight: 18 },
  confirmFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' },
  // result
  resultHead: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  resultTitle: { fontSize: 16, fontWeight: '800', color: WebColors.success },
  skipBox: { backgroundColor: WebColors.dangerLight, borderRadius: 8, padding: 12, gap: 8 },
  skipHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  skipTitle: { fontSize: 13, fontWeight: '700', color: WebColors.danger },
  skipItem: { gap: 2 },
});
