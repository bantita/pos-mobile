/**
 * WebTestTrackerScreen — บันทึกผลทดสอบ (Offline-ready)
 * ข้อมูลบันทึกใน local storage ใช้งานได้ทั้ง online/offline
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors } from '../../design-system/tokens';
import { useTestTrackerStore, TestStatus, TestResult, TestRun } from '../../store/testTrackerStore';

const STATUS_META: Record<TestStatus, { icon: string; color: string; bg: string; label: string }> = {
  pending: { icon: 'ellipse-outline', color: WebColors.textSecondary, bg: WebColors.gray100, label: 'รอทดสอบ' },
  pass:    { icon: 'checkmark-circle', color: WebColors.success, bg: WebColors.successLight, label: 'ผ่าน' },
  fail:    { icon: 'close-circle', color: WebColors.danger, bg: WebColors.dangerLight, label: 'ไม่ผ่าน' },
  skip:    { icon: 'remove-circle', color: WebColors.warning, bg: WebColors.warningLight, label: 'ข้าม' },
};

export const WebTestTrackerScreen: React.FC = () => {
  const { runs, currentRunId, createRun, getCurrentRun, updateTestResult, completeRun, deleteRun, getRunStats } = useTestTrackerStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTester, setNewTester] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [editNote, setEditNote] = useState<{ id: string; note: string } | null>(null);

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
            <Ionicons name="checkmark-done" size={16} color={WebColors.white} />
            <Text style={s.completeBtnText}>จบการทดสอบ</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={[s.statBox, { borderLeftColor: WebColors.textSecondary }]}><Text style={s.statNum}>{stats.total}</Text><Text style={s.statLabel}>ทั้งหมด</Text></View>
          <View style={[s.statBox, { borderLeftColor: WebColors.success }]}><Text style={[s.statNum, { color: WebColors.success }]}>{stats.pass}</Text><Text style={s.statLabel}>ผ่าน</Text></View>
          <View style={[s.statBox, { borderLeftColor: WebColors.danger }]}><Text style={[s.statNum, { color: WebColors.danger }]}>{stats.fail}</Text><Text style={s.statLabel}>ไม่ผ่าน</Text></View>
          <View style={[s.statBox, { borderLeftColor: WebColors.warning }]}><Text style={[s.statNum, { color: WebColors.warning }]}>{stats.skip}</Text><Text style={s.statLabel}>ข้าม</Text></View>
          <View style={[s.statBox, { borderLeftColor: WebColors.textSecondary }]}><Text style={[s.statNum, { color: WebColors.textSecondary }]}>{stats.pending}</Text><Text style={s.statLabel}>รอ</Text></View>
        </View>

        {/* Progress bar */}
        <View style={s.progressBar}>
          {stats.pass > 0 && <View style={[s.progressSeg, { flex: stats.pass, backgroundColor: WebColors.success }]} />}
          {stats.fail > 0 && <View style={[s.progressSeg, { flex: stats.fail, backgroundColor: WebColors.danger }]} />}
          {stats.skip > 0 && <View style={[s.progressSeg, { flex: stats.skip, backgroundColor: WebColors.warning }]} />}
          {stats.pending > 0 && <View style={[s.progressSeg, { flex: stats.pending, backgroundColor: '#E5E7EB' }]} />}
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
                  {test.note && <Text style={s.testNote}>📝 {test.note}</Text>}
                  {test.testedAt && <Text style={s.testDate}>ทดสอบ: {new Date(test.testedAt).toLocaleString('th-TH')}</Text>}
                </View>
                {/* Action buttons */}
                <View style={s.actionRow}>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: WebColors.successLight }]} onPress={() => updateTestResult(test.id, 'pass')}>
                    <Ionicons name="checkmark" size={14} color={WebColors.success} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: WebColors.dangerLight }]} onPress={() => updateTestResult(test.id, 'fail')}>
                    <Ionicons name="close" size={14} color={WebColors.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: WebColors.warningLight }]} onPress={() => updateTestResult(test.id, 'skip')}>
                    <Ionicons name="remove" size={14} color={WebColors.warning} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: WebColors.gray100 }]} onPress={() => {
                    const note = prompt('หมายเหตุ:', test.note || '');
                    if (note !== null) updateTestResult(test.id, test.status, note);
                  }}>
                    <Ionicons name="create-outline" size={14} color={WebColors.textSecondary} />
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
          <Ionicons name="add" size={16} color={WebColors.white} />
          <Text style={s.completeBtnText}>เริ่มทดสอบใหม่</Text>
        </TouchableOpacity>
      </View>

      {/* Create form */}
      {showCreate && (
        <View style={[s.card, { gap: 12 }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>สร้าง Test Run ใหม่</Text>
          <TextInput style={s.input} placeholder="ชื่อ Test Run (เช่น Sprint 5 - UAT)" value={newName} onChangeText={setNewName} placeholderTextColor={WebColors.textSecondary} />
          <TextInput style={s.input} placeholder="ชื่อผู้ทดสอบ" value={newTester} onChangeText={setNewTester} placeholderTextColor={WebColors.textSecondary} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: WebColors.gray100 }} onPress={() => setShowCreate(false)}>
              <Text style={{ fontSize: 12, color: WebColors.textSecondary }}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.completeBtn} onPress={handleCreate}>
              <Ionicons name="play" size={14} color={WebColors.white} />
              <Text style={s.completeBtnText}>เริ่มทดสอบ</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Past runs */}
      {runs.length === 0 ? (
        <View style={[s.card, { alignItems: 'center', paddingVertical: 40 }]}>
          <Ionicons name="clipboard-outline" size={40} color="#D1D5DB" />
          <Text style={{ fontSize: 13, color: WebColors.textSecondary, marginTop: 12 }}>ยังไม่มีผลทดสอบ</Text>
          <Text style={{ fontSize: 11, color: '#D1D5DB', marginTop: 4 }}>กด "เริ่มทดสอบใหม่" เพื่อเริ่มบันทึก</Text>
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
                    <Text style={{ fontSize: 11, color: WebColors.textSecondary }}>{run.tester} · {new Date(run.startedAt).toLocaleDateString('th-TH')}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: run.status === 'completed' ? WebColors.successLight : WebColors.warningLight }]}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: run.status === 'completed' ? WebColors.success : '#D97706' }}>
                      {run.status === 'completed' ? 'เสร็จ' : 'กำลังทดสอบ'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: WebColors.success }}>✓ {stats.pass}</Text>
                  <Text style={{ fontSize: 11, color: WebColors.danger }}>✗ {stats.fail}</Text>
                  <Text style={{ fontSize: 11, color: WebColors.warning }}>— {stats.skip}</Text>
                  <Text style={{ fontSize: 11, color: WebColors.textSecondary }}>○ {stats.pending}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.text }}>{pct}% ผ่าน</Text>
                </View>
                {/* Progress */}
                <View style={[s.progressBar, { marginTop: 8 }]}>
                  {stats.pass > 0 && <View style={[s.progressSeg, { flex: stats.pass, backgroundColor: WebColors.success }]} />}
                  {stats.fail > 0 && <View style={[s.progressSeg, { flex: stats.fail, backgroundColor: WebColors.danger }]} />}
                  {stats.skip > 0 && <View style={[s.progressSeg, { flex: stats.skip, backgroundColor: WebColors.warning }]} />}
                  {stats.pending > 0 && <View style={[s.progressSeg, { flex: stats.pending, backgroundColor: '#E5E7EB' }]} />}
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {run.status === 'in_progress' && (
                    <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: WebColors.primary }} onPress={() => useTestTrackerStore.setState({ currentRunId: run.id })}>
                      <Text style={{ fontSize: 11, color: WebColors.white, fontWeight: '600' }}>ดำเนินต่อ</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: WebColors.purpleLight }} onPress={() => {
                    const json = useTestTrackerStore.getState().exportRun(run.id);
                    if (json) {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(json);
                        alert('คัดลอกผลทดสอบแล้ว! ส่งให้ Admin paste ใน "นำเข้าผลทดสอบ"');
                      } else {
                        prompt('คัดลอก JSON นี้ส่งให้ Admin:', json);
                      }
                    }
                  }}>
                    <Text style={{ fontSize: 11, color: WebColors.purple, fontWeight: '600' }}>📤 ส่งผลให้ Admin</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: WebColors.dangerLight }} onPress={() => deleteRun(run.id)}>
                    <Text style={{ fontSize: 11, color: WebColors.danger, fontWeight: '600' }}>ลบ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Text style={{ fontSize: 10, color: WebColors.textSecondary, marginTop: 16, textAlign: 'center' }}>
        💾 ข้อมูลบันทึกในเครื่อง (Offline) — ไม่ต้องเชื่อมต่อ Internet
      </Text>

      {/* ── Admin: ดูผลจากทีม ── */}
      <AdminSharedResults />
    </ScrollView>
  );
};

const AdminSharedResults: React.FC = () => {
  const { sharedRuns, importSharedRun, deleteSharedRun, getRunStats } = useTestTrackerStore();
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importSharedRun(importText.trim());
    if (ok) { alert('นำเข้าผลทดสอบสำเร็จ!'); setImportText(''); setShowImport(false); }
    else { alert('JSON ไม่ถูกต้อง'); }
  };

  if (sharedRuns.length === 0 && !showImport) {
    return (
      <View style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Ionicons name="people" size={18} color={WebColors.purple} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>Admin: ดูผลทดสอบจากทีม</Text>
        </View>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: WebColors.purpleLight, alignSelf: 'flex-start' }} onPress={() => setShowImport(true)}>
          <Ionicons name="download-outline" size={16} color={WebColors.purple} />
          <Text style={{ fontSize: 12, color: WebColors.purple, fontWeight: '600' }}>นำเข้าผลทดสอบ (Paste JSON)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="people" size={18} color={WebColors.purple} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>Admin: ผลทดสอบจากทีม ({sharedRuns.length})</Text>
        </View>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: WebColors.purpleLight }} onPress={() => setShowImport(!showImport)}>
          <Ionicons name="download-outline" size={14} color={WebColors.purple} />
          <Text style={{ fontSize: 11, color: WebColors.purple, fontWeight: '600' }}>นำเข้า</Text>
        </TouchableOpacity>
      </View>

      {showImport && (
        <View style={[s.card, { gap: 10, marginBottom: 12, borderColor: WebColors.purple }]}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.text }}>Paste JSON ที่ได้จาก Tester:</Text>
          <TextInput
            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            value={importText}
            onChangeText={setImportText}
            placeholder='วาง JSON ที่ copy มาจากปุ่ม "ส่งผลให้ Admin"'
            placeholderTextColor={WebColors.textSecondary}
            multiline
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, backgroundColor: WebColors.gray100 }} onPress={() => setShowImport(false)}>
              <Text style={{ fontSize: 11, color: WebColors.textSecondary }}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, backgroundColor: WebColors.purple }} onPress={handleImport}>
              <Ionicons name="checkmark" size={14} color={WebColors.white} />
              <Text style={{ fontSize: 11, color: WebColors.white, fontWeight: '600' }}>นำเข้า</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Shared runs */}
      {sharedRuns.map(run => {
        const stats = getRunStats(run.id);
        const pct = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;
        return (
          <View key={run.id} style={[s.card, { marginBottom: 10, borderLeftWidth: 3, borderLeftColor: WebColors.purple }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text }}>{run.name}</Text>
                <Text style={{ fontSize: 11, color: WebColors.textSecondary }}>👤 {run.tester} · {new Date(run.startedAt).toLocaleDateString('th-TH')}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: pct >= 80 ? WebColors.success : pct >= 50 ? WebColors.warning : WebColors.danger }}>{pct}%</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: WebColors.success }}>✓ {stats.pass}</Text>
              <Text style={{ fontSize: 11, color: WebColors.danger }}>✗ {stats.fail}</Text>
              <Text style={{ fontSize: 11, color: WebColors.warning }}>— {stats.skip}</Text>
              <Text style={{ fontSize: 11, color: WebColors.textSecondary }}>○ {stats.pending}</Text>
            </View>
            {/* แสดง failed tests */}
            {run.results.filter(t => t.status === 'fail').length > 0 && (
              <View style={{ marginTop: 8, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: WebColors.danger, marginBottom: 4 }}>❌ ไม่ผ่าน:</Text>
                {run.results.filter(t => t.status === 'fail').map(t => (
                  <Text key={t.id} style={{ fontSize: 10, color: '#7F1D1D' }}>• {t.id}: {t.title}{t.note ? ` — ${t.note}` : ''}</Text>
                ))}
              </View>
            )}
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 6 }} onPress={() => deleteSharedRun(run.id)}>
              <Text style={{ fontSize: 10, color: WebColors.textSecondary }}>ลบ</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WebColors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  completeBtnText: { fontSize: 12, fontWeight: '600', color: WebColors.white },

  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: WebColors.white, borderRadius: 8, padding: 12, borderLeftWidth: 3, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 9, color: WebColors.textSecondary, marginTop: 2 },

  progressBar: { height: 6, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#E5E7EB' },
  progressSeg: { height: '100%' },

  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: WebColors.gray100 },
  filterPillActive: { backgroundColor: WebColors.primary },
  filterText: { fontSize: 11, color: WebColors.textSecondary },
  filterTextActive: { color: WebColors.white, fontWeight: '600' },

  card: { backgroundColor: WebColors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F0EDED' },
  testRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  testRowBorder: { borderBottomWidth: 1, borderBottomColor: WebColors.gray100 },
  testTitle: { fontSize: 12, fontWeight: '600', color: Colors.text },
  testDesc: { fontSize: 11, color: WebColors.textSecondary, marginTop: 2, marginLeft: 26 },
  testNote: { fontSize: 10, color: WebColors.purple, marginTop: 3, marginLeft: 26, fontStyle: 'italic' },
  testDate: { fontSize: 9, color: WebColors.textSecondary, marginTop: 2, marginLeft: 26 },

  actionRow: { flexDirection: 'row', gap: 4 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: Colors.text },
});
