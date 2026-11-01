/**
 * useMasterMigration — state machine กลางของการนำเข้ามาสเตอร์ (ใช้ทั้งเว็บและ mobile)
 *
 *   1 เลือกไฟล์ → 2 ตรวจสอบข้อมูล (ไมเกรต) → 3 ยืนยัน → 4 ผลลัพธ์
 *
 * ไม่มีการเขียน store จนกว่าจะกด "ยืนยันนำเข้า" (confirm) ในขั้นที่ 3 เท่านั้น
 * ก่อนบันทึกจะสร้างแผนใหม่จากไฟล์เดิมเทียบกับข้อมูลล่าสุด — ถ้าต่างจากที่ตรวจสอบ ให้กลับไปตรวจสอบอีกครั้ง
 */
import { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  MasterEntity, MigrationFilter, MigrationPlan, MigrationRecord, MigrationResult, Workbook,
  applyMigration, buildMigrationPlan, canProceed, filterRecords, migrationSignature, pageRecords,
} from '../utils/masterImportExport';
import { ImportFileError, pickFile, readFileToWorkbook } from '../utils/spreadsheetIO';
import {
  downloadBackup as downloadBackupFile, downloadErrorFile, getImportContext, storePorts,
} from '../utils/masterPorts';

export type MigrationStep = 1 | 2 | 3 | 4;
export type MigrationBusy = 'read' | 'apply' | 'backup' | 'errors' | null;

export const MIGRATION_STEPS = ['เลือกไฟล์', 'ตรวจสอบข้อมูล (ไมเกรต)', 'ยืนยัน', 'ผลลัพธ์'] as const;

export const STALE_DATA_MESSAGE = 'ข้อมูลในระบบมีการเปลี่ยนแปลงระหว่างตรวจสอบ กรุณาตรวจสอบอีกครั้ง';

export interface UseMasterMigrationOptions {
  /** เรียกหลังบันทึกสำเร็จ */
  onApplied?: (result: MigrationResult) => void;
}

export interface MasterMigrationFlow {
  entity: MasterEntity;
  step: MigrationStep;
  migration: MigrationPlan | null;
  fileName: string;
  filter: MigrationFilter;
  setFilter: (f: MigrationFilter) => void;
  page: number;
  pageCount: number;
  setPage: (p: number) => void;
  /** รายการในหน้าปัจจุบัน (หลังกรอง) */
  pageItems: MigrationRecord[];
  /** จำนวนรายการหลังกรอง */
  filteredCount: number;
  expanded: ReadonlySet<string>;
  toggleExpanded: (id: string) => void;
  busy: MigrationBusy;
  error: string;
  setError: (msg: string) => void;
  result: MigrationResult | null;
  canProceed: boolean;
  pickAndReview: () => Promise<void>;
  back: () => void;
  proceed: () => void;
  cancelConfirm: () => void;
  confirm: () => void;
  downloadBackup: () => Promise<void>;
  downloadErrors: () => Promise<void>;
  reset: () => void;
}

export function useMasterMigration(entity: MasterEntity, opts: UseMasterMigrationOptions = {}): MasterMigrationFlow {
  const { onApplied } = opts;
  const [step, setStep] = useState<MigrationStep>(1);
  const [migration, setMigration] = useState<MigrationPlan | null>(null);
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [fileName, setFileName] = useState('');
  const [filter, setFilterState] = useState<MigrationFilter>('all');
  const [page, setPageState] = useState(1);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = useState<MigrationBusy>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<MigrationResult | null>(null);

  const filtered = useMemo(() => (migration ? filterRecords(migration.records, filter) : []), [migration, filter]);
  const paged = useMemo(() => pageRecords(filtered, page), [filtered, page]);

  const reset = useCallback(() => {
    setStep(1);
    setMigration(null);
    setWorkbook(null);
    setFileName('');
    setFilterState('all');
    setPageState(1);
    setExpanded(new Set());
    setBusy(null);
    setError('');
    setResult(null);
  }, []);

  const openReview = (mp: MigrationPlan) => {
    setMigration(mp);
    setFilterState('all');
    setPageState(1);
    setExpanded(new Set());
    setStep(2);
  };

  const pickAndReview = useCallback(async () => {
    setError('');
    setResult(null);
    if (Platform.OS !== 'web') { setError('นำเข้าไฟล์ได้เฉพาะบนเว็บ'); return; }
    const file = await pickFile();
    if (!file) return;
    setBusy('read');
    try {
      const wb = await readFileToWorkbook(entity, file);
      const mp = buildMigrationPlan(entity, wb, getImportContext());
      if (mp.fileErrors.length > 0) {
        setError(mp.fileErrors.join('\n'));
        setStep(1);
        return;
      }
      setWorkbook(wb);
      setFileName(file.name);
      openReview(mp);
    } catch (e) {
      setError(e instanceof ImportFileError ? e.message : 'อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบรูปแบบไฟล์');
    } finally {
      setBusy(null);
    }
  }, [entity]);

  /** ขั้น 2 → 1: ยกเลิกไฟล์นี้ (ไม่มีการบันทึก) */
  const back = useCallback(() => { reset(); }, [reset]);

  const proceed = useCallback(() => {
    if (migration && canProceed(migration)) { setError(''); setStep(3); }
  }, [migration]);

  const cancelConfirm = useCallback(() => { setStep(2); }, []);

  const confirm = useCallback(() => {
    if (!migration || !workbook || !canProceed(migration)) return;
    setBusy('apply');
    setError('');
    try {
      // ตรวจข้อมูลล่าสุดก่อนบันทึก: ถ้าแผนเปลี่ยน ให้ผู้ใช้ตรวจสอบใหม่
      const fresh = buildMigrationPlan(entity, workbook, getImportContext());
      if (migrationSignature(fresh) !== migrationSignature(migration)) {
        openReview(fresh);
        setError(STALE_DATA_MESSAGE);
        return;
      }
      const res = applyMigration(fresh, storePorts);
      setMigration(fresh);
      setResult(res);
      setStep(4);
      onApplied?.(res);
    } catch {
      setError('บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }, [entity, migration, workbook, onApplied]);

  const downloadBackup = useCallback(async () => {
    setBusy('backup');
    try {
      await downloadBackupFile(entity);
    } catch {
      setError('ดาวน์โหลดข้อมูลสำรองไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }, [entity]);

  const downloadErrors = useCallback(async () => {
    if (!migration) return;
    setBusy('errors');
    try {
      await downloadErrorFile(migration);
    } catch {
      setError('ดาวน์โหลดรายการข้อผิดพลาดไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }, [migration]);

  const setFilter = useCallback((f: MigrationFilter) => { setFilterState(f); setPageState(1); }, []);
  const setPage = useCallback((p: number) => { setPageState(p); }, []);
  const toggleExpanded = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  return {
    entity, step, migration, fileName,
    filter, setFilter,
    page: paged.page, pageCount: paged.pageCount, setPage,
    pageItems: paged.items, filteredCount: filtered.length,
    expanded, toggleExpanded,
    busy, error, setError, result,
    canProceed: migration ? canProceed(migration) : false,
    pickAndReview, back, proceed, cancelConfirm, confirm, downloadBackup, downloadErrors, reset,
  };
}
