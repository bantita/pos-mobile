/**
 * TestTrackerScreen — บันทึกผลทดสอบ (Offline-ready)
 * ข้อมูลบันทึกใน local storage ใช้งานได้ทั้ง online/offline
 */
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Palette } from '@/shared/constants/palette';
import { Colors } from '@/shared/ui/tokens';
import { useTestTrackerStore, TestStatus, TestResult, TestRun } from '@/features/settings/application/stores/testTrackerStore';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';

const STATUS_META: Record<TestStatus, { icon: string; color: string; bg: string; label: string }> = {
  pending: { icon: 'ellipse-outline', color: Palette.textSecondary, bg: Palette.gray100, label: 'รอทดสอบ' },
  pass:    { icon: 'checkmark-circle', color: Palette.success, bg: Palette.successLight, label: 'ผ่าน' },
  fail:    { icon: 'close-circle', color: Palette.danger, bg: Palette.dangerLight, label: 'ไม่ผ่าน' },
  skip:    { icon: 'remove-circle', color: Palette.warning, bg: Palette.warningLight, label: 'ข้าม' },
};

export const TestTrackerScreen: React.FC = () => {
  const { runs, currentRunId, createRun, getCurrentRun, updateTestResult, completeRun, deleteRun, getRunStats } = useTestTrackerStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTester, setNewTester] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [alertState, setAlertState] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const currentRun = getCurrentRun();

  const handleCreate = () => {
    if (!newName.trim() || !newTester.trim()) return;
    createRun(newName.trim(), newTester.trim());
    setNewName(''); setNewTester(''); setShowCreate(false);
  };

  // ── ถ้ามี current run → แสดงหน้าทดสอบ
  if (currentRun) {
    const stats = getRunStats(currentRun.id);
    const modules = [...new Set(currentRun.results.map(r => r.module))];
    const filtered = moduleFilter === 'all'
      ? currentRun.results
      : currentRun.results.filter(r => r.module === moduleFilter);

    return (
      <ScrollView style={s.root} contentContainerStyle={s.content}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{currentRun.name}</Text>
            <Text style={s.sub}>ผู้ทดสอบ: {currentRun.tester} · เริ่ม: {new Date(currentRun.startedAt).toLocaleString('th-TH')}</Text>
          </View>
          <TouchableOpacity style={s.completeBtn} onPress={completeRun}>
            <Ionicons name="checkmark-done" size={16} color={Palette.white} />
            <Text style={s.completeBtnText}>จบการทดสอบ</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={[s.statBox, { borderLeftColor: Palette.textSecondary }]}><Text style={s.statNum}>{stats.total}</Text><Text style={s.statLabel}>ทั้งหมด</Text></View>
          <View style={[s.statBox, { borderLeftColor: Palette.success }]}><Text style={[s.statNum, { color: Palette.success }]}>{stats.pass}</Text><Text style={s.statLabel}>ผ่าน</Text></View>
          <View style={[s.statBox, { borderLeftColor: Palette.danger }]}><Text style={[s.statNum, { color: Palette.danger }]}>{stats.fail}</Text><Text style={s.statLabel}>ไม่ผ่าน</Text></View>
          <View style={[s.statBox, { borderLeftColor: Palette.warning }]}><Text style={[s.statNum, { color: Palette.warning }]}>{stats.skip}</Text><Text style={s.statLabel}>ข้าม</Text></View>
          <View style={[s.statBox, { borderLeftColor: Palette.textSecondary }]}><Text style={[s.statNum, { color: Palette.textSecondary }]}>{stats.pending}</Text><Text style={s.statLabel}>รอ</Text></View>
        </View>

        {/* Progress bar */}
        <View style={s.progressBar}>
          {stats.pass > 0 && <View style={[s.progressSeg, { flex: stats.pass, backgroundColor: Palette.success }]} />}
          {stats.fail > 0 && <View style={[s.progressSeg, { flex: stats.fail, backgroundColor: Palette.danger }]} />}
          {stats.skip > 0 && <View style={[s.progressSeg, { flex: stats.skip, backgroundColor: Palette.warning }]} />}
          {stats.pending > 0 && <View style={[s.progressSeg, { flex: stats.pending, backgroundColor: '#e5e7eb' }]} />}
        </View>

        {/* Module filter */}
        <View style={s.filterRow}>
          <TouchableOpacity style={[s.filterPill, moduleFilter === 'all' && s.filterPillActive]} onPress={() => setModuleFilter('all')}>
            <Text style={[s.filterText, moduleFilter === 'all' && s.filterTextActive]}>ทั้งหมด</Text>
          </TouchableOpacity>
          {modules.map(m => (
            <TouchableOpacity key={m} style={[s.filterPill, moduleFilter === m && s.filterPillActive]} onPress={() => setModuleFilter(m)}>
              <Text style={[s.filterText, moduleFilter === m && s.filterTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Test cases */}
        <View style={s.card}>
          {filtered.map((test, i) => {
            const meta = STATUS_META[test.status];
            return (
              <View key={test.id} style={[s.testRow, i < filtered.length - 1 && s.testRowBorder]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                    <Text style={s.testTitle}>{test.id} — {test.title}</Text>
                  </View>
                  <Text style={s.testDesc}>{test.description}</Text>
                  {test.note && (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5 }}>
                      <Ionicons name="document-text-outline" size={13} color={Palette.warning} />
                      <Text style={[s.testNote, { flex: 1 }]}>{test.note}</Text>
                    </View>
                  )}
                  {test.testedAt && <Text style={s.testDate}>ทดสอบ: {new Date(test.testedAt).toLocaleString('th-TH')}</Text>}
                </View>
                {/* Action buttons */}
                <View style={s.actionRow}>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: Palette.successLight }]} onPress={() => updateTestResult(test.id, 'pass')}>
                    <Ionicons name="checkmark" size={16} color={Palette.success} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: Palette.dangerLight }]} onPress={() => updateTestResult(test.id, 'fail')}>
                    <Ionicons name="close" size={16} color={Palette.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: Palette.warningLight }]} onPress={() => updateTestResult(test.id, 'skip')}>
                    <Ionicons name="remove" size={16} color={Palette.warning} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: Palette.gray100 }]} onPress={() => {
                    const note = prompt('หมายเหตุ:', test.note || '');
                    if (note !== null) updateTestResult(test.id, test.status, note);
                  }}>
                    <Ionicons name="create-outline" size={16} color={Palette.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  // ── ไม่มี current run → แสดงรายการ runs + สร้างใหม่
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Test Tracker</Text>
          <Text style={s.sub}>บันทึกผลการทดสอบ · Offline-ready · เก็บในเครื่อง</Text>
        </View>
        <TouchableOpacity style={s.completeBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={16} color={Palette.white} />
          <Text style={s.completeBtnText}>เริ่มทดสอบใหม่</Text>
        </TouchableOpacity>
      </View>

      {/* Create form */}
      {showCreate && (
        <View style={[s.card, { gap: 12 }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>สร้าง Test Run ใหม่</Text>
          <TextInput style={s.input} placeholder="ชื่อ Test Run (เช่น Sprint 5 - UAT)" value={newName} onChangeText={setNewName} placeholderTextColor={Palette.textSecondary} />
          <TextInput style={s.input} placeholder="ชื่อผู้ทดสอบ" value={newTester} onChangeText={setNewTester} placeholderTextColor={Palette.textSecondary} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: Palette.gray100 }} onPress={() => setShowCreate(false)}>
              <Text style={{ fontSize: 12, color: Palette.textSecondary }}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.completeBtn} onPress={handleCreate}>
              <Ionicons name="play" size={14} color={Palette.white} />
              <Text style={s.completeBtnText}>เริ่มทดสอบ</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Past runs */}
      {runs.length === 0 ? (
        <View style={[s.card, { alignItems: 'center', paddingVertical: 40 }]}>
          <Ionicons name="clipboard-outline" size={40} color="#d1d5db" />
          <Text style={{ fontSize: 13, color: Palette.textSecondary, marginTop: 12 }}>ยังไม่มีผลทดสอบ</Text>
          <Text style={{ fontSize: 11, color: '#d1d5db', marginTop: 4 }}>กด "เริ่มทดสอบใหม่" เพื่อเริ่มบันทึก</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {runs.map(run => {
            const stats = getRunStats(run.id);
            const pct = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;
            return (
              <View key={run.id} style={s.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text }}>{run.name}</Text>
                    <Text style={{ fontSize: 11, color: Palette.textSecondary }}>{run.tester} · {new Date(run.startedAt).toLocaleDateString('th-TH')}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: run.status === 'completed' ? Palette.successLight : Palette.warningLight }]}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: run.status === 'completed' ? Palette.success : '#d97706' }}>
                      {run.status === 'completed' ? 'เสร็จ' : 'กำลังทดสอบ'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: Palette.success }}>✓ {stats.pass}</Text>
                  <Text style={{ fontSize: 11, color: Palette.danger }}>✗ {stats.fail}</Text>
                  <Text style={{ fontSize: 11, color: Palette.warning }}>— {stats.skip}</Text>
                  <Text style={{ fontSize: 11, color: Palette.textSecondary }}>○ {stats.pending}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.text }}>{pct}% ผ่าน</Text>
                </View>
                {/* Progress */}
                <View style={[s.progressBar, { marginTop: 8 }]}>
                  {stats.pass > 0 && <View style={[s.progressSeg, { flex: stats.pass, backgroundColor: Palette.success }]} />}
                  {stats.fail > 0 && <View style={[s.progressSeg, { flex: stats.fail, backgroundColor: Palette.danger }]} />}
                  {stats.skip > 0 && <View style={[s.progressSeg, { flex: stats.skip, backgroundColor: Palette.warning }]} />}
                  {stats.pending > 0 && <View style={[s.progressSeg, { flex: stats.pending, backgroundColor: '#e5e7eb' }]} />}
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {run.status === 'in_progress' && (
                    <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: Palette.primary }} onPress={() => useTestTrackerStore.setState({ currentRunId: run.id })}>
                      <Text style={{ fontSize: 11, color: Palette.white, fontWeight: '600' }}>ดำเนินต่อ</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: Palette.purpleLight, flexDirection: 'row', alignItems: 'center', gap: 5 }} onPress={() => {
                    const json = useTestTrackerStore.getState().exportRun(run.id);
                    if (json) {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(json);
                        setAlertState({ visible: true, title: 'คัดลอกแล้ว', message: 'คัดลอกผลทดสอบแล้ว! ส่งให้ Admin paste ใน "นำเข้าผลทดสอบ"' });
                      } else {
                        prompt('คัดลอก JSON นี้ส่งให้ Admin:', json);
                      }
                    }
                  }}>
                    <Ionicons name="paper-plane-outline" size={13} color={Palette.purple} />
                    <Text style={{ fontSize: 11, color: Palette.purple, fontWeight: '600' }}>ส่งผลให้ Admin</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: Palette.dangerLight }} onPress={() => deleteRun(run.id)}>
                    <Text style={{ fontSize: 11, color: Palette.danger, fontWeight: '600' }}>ลบ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <Ionicons name="save-outline" size={13} color={Palette.textSecondary} />
        <Text style={{ fontSize: 10, color: Palette.textSecondary, textAlign: 'center' }}>
          ข้อมูลบันทึกในเครื่อง (Offline) — ไม่ต้องเชื่อมต่อ Internet
        </Text>
      </View>

      {/* ── Admin: ดูผลจากทีม ── */}
      <AdminSharedResults />
    </ScrollView>
  );
};

const AdminSharedResults: React.FC = () => {
  const { sharedRuns, importSharedRun, deleteSharedRun, getRunStats } = useTestTrackerStore();
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [alertState, setAlertState] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importSharedRun(importText.trim());
    if (ok) { setAlertState({ visible: true, title: 'สำเร็จ', message: 'นำเข้าผลทดสอบสำเร็จ!' }); setImportText(''); setShowImport(false); }
    else { setAlertState({ visible: true, title: 'ผิดพลาด', message: 'JSON ไม่ถูกต้อง' }); }
  };

  if (sharedRuns.length === 0 && !showImport) {
    return (
      <View style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Ionicons name="people" size={18} color={Palette.purple} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>Admin: ดูผลทดสอบจากทีม</Text>
        </View>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: Palette.purpleLight, alignSelf: 'flex-start' }} onPress={() => setShowImport(true)}>
          <Ionicons name="download-outline" size={16} color={Palette.purple} />
          <Text style={{ fontSize: 12, color: Palette.purple, fontWeight: '600' }}>นำเข้าผลทดสอบ (Paste JSON)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="people" size={18} color={Palette.purple} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>Admin: ผลทดสอบจากทีม ({sharedRuns.length})</Text>
        </View>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: Palette.purpleLight }} onPress={() => setShowImport(!showImport)}>
          <Ionicons name="download-outline" size={14} color={Palette.purple} />
          <Text style={{ fontSize: 11, color: Palette.purple, fontWeight: '600' }}>นำเข้า</Text>
        </TouchableOpacity>
      </View>

      {showImport && (
        <View style={[s.card, { gap: 10, marginBottom: 12, borderColor: Palette.purple }]}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.text }}>Paste JSON ที่ได้จาก Tester:</Text>
          <TextInput
            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            value={importText}
            onChangeText={setImportText}
            placeholder='วาง JSON ที่ copy มาจากปุ่ม "ส่งผลให้ Admin"'
            placeholderTextColor={Palette.textSecondary}
            multiline
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, backgroundColor: Palette.gray100 }} onPress={() => setShowImport(false)}>
              <Text style={{ fontSize: 11, color: Palette.textSecondary }}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, backgroundColor: Palette.purple }} onPress={handleImport}>
              <Ionicons name="checkmark" size={14} color={Palette.white} />
              <Text style={{ fontSize: 11, color: Palette.white, fontWeight: '600' }}>นำเข้า</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Shared runs */}
      {sharedRuns.map(run => {
        const stats = getRunStats(run.id);
        const pct = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;
        return (
          <View key={run.id} style={[s.card, { marginBottom: 10, borderLeftWidth: 3, borderLeftColor: Palette.purple }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text }}>{run.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="person-outline" size={12} color={Palette.textSecondary} />
                  <Text style={{ fontSize: 11, color: Palette.textSecondary }}>{run.tester} · {new Date(run.startedAt).toLocaleDateString('th-TH')}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: pct >= 80 ? Palette.success : pct >= 50 ? Palette.warning : Palette.danger }}>{pct}%</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: Palette.success }}>✓ {stats.pass}</Text>
              <Text style={{ fontSize: 11, color: Palette.danger }}>✗ {stats.fail}</Text>
              <Text style={{ fontSize: 11, color: Palette.warning }}>— {stats.skip}</Text>
              <Text style={{ fontSize: 11, color: Palette.textSecondary }}>○ {stats.pending}</Text>
            </View>
            {/* แสดง failed tests */}
            {run.results.filter(t => t.status === 'fail').length > 0 && (
              <View style={{ marginTop: 8, backgroundColor: '#fef2f2', borderRadius: 8, padding: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Ionicons name="close-circle-outline" size={12} color={Palette.danger} />
                  <Text style={{ fontSize: 10, fontWeight: '600', color: Palette.danger }}>ไม่ผ่าน:</Text>
                </View>
                {run.results.filter(t => t.status === 'fail').map(t => (
                  <Text key={t.id} style={{ fontSize: 10, color: '#7f1d1d' }}>• {t.id}: {t.title}{t.note ? ` — ${t.note}` : ''}</Text>
                ))}
              </View>
            )}
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 6 }} onPress={() => deleteSharedRun(run.id)}>
              <Text style={{ fontSize: 10, color: Palette.textSecondary }}>ลบ</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <AlertDialog visible={alertState.visible} onClose={() => setAlertState({ visible: false, title: '', message: '' })} title={alertState.title} message={alertState.message} variant="info" />
    </View>
  );
};

const s: Record<string, any> = {
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  completeBtnText: { fontSize: 12, fontWeight: '600', color: Palette.white },

  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: Palette.white, borderRadius: 8, padding: 12, borderLeftWidth: 3, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 12, color: Palette.textSecondary, marginTop: 2 },

  progressBar: { height: 6, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#e5e7eb' },
  progressSeg: { height: '100%' },

  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: Palette.gray100 },
  filterPillActive: { backgroundColor: Palette.primary },
  filterText: { fontSize: 13, color: Palette.textSecondary },
  filterTextActive: { color: Palette.white, fontWeight: '600' },

  card: { backgroundColor: Palette.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f4f4f5' },
  testRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  testRowBorder: { borderBottomWidth: 1, borderBottomColor: Palette.gray100 },
  testTitle: { fontSize: 12, fontWeight: '600', color: Colors.text },
  testDesc: { fontSize: 13, color: Palette.textSecondary, marginTop: 2, marginLeft: 26 },
  testNote: { fontSize: 12, color: Palette.purple, marginTop: 3, marginLeft: 26, fontStyle: 'italic' },
  testDate: { fontSize: 12, color: Palette.textSecondary, marginTop: 2, marginLeft: 26 },

  actionRow: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: Colors.text },
};
