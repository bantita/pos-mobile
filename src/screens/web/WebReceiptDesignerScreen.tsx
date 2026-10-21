/**
 * WebReceiptDesignerScreen — ดีไซเนอร์รูปแบบบิลแบบ Crystal Reports (เว็บเท่านั้น)
 *
 * โครงหน้า: Toolbar (บน) + Canvas (กลาง) + Inspector (ขวา)
 * - รูปแบบบิลเป็น "กลาง" ตัวเดียว ใช้ร่วมทุกสาขา (แก้ที่ส่วนกลาง)
 * - ลาก/ย่อ-ขยาย ทำบน ReceiptCanvas (เว็บเท่านั้น) — หน้าจอ snap 2mm + clamp ขอบกระดาษ
 * - บน native คืนหน้า read-only พร้อม preview จาก template ที่บันทึกไว้
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { ReceiptCanvas } from '../../components/receipt/ReceiptCanvas';
import { buildTemplateHtml, makeSampleData } from '../../utils/receiptTemplate';
import {
  useReceiptStore,
  PAPER_PRESETS,
  DEFAULT_TEMPLATE,
  PaperPresetId,
  PaperSpec,
  ReceiptElement,
  ReceiptElementType,
  ReceiptFieldKey,
  ReceiptTemplate,
  ElementAlign,
  LineStyle,
} from '../../store/receiptStore';

// ─── ป้ายกำกับภาษาไทย ──────────────────────────────────────────────────────────

const FIELD_LABELS: Record<ReceiptFieldKey, string> = {
  shopName: 'ชื่อร้าน',
  shopAddr: 'ที่อยู่ร้าน',
  shopTel: 'เบอร์โทร',
  shopTaxId: 'เลขประจำตัวผู้เสียภาษี',
  shopBranch: 'สาขา',
  posRegNo: 'เลขทะเบียน POS',
  headerText: 'ข้อความหัวบิล',
  footerText: 'ข้อความท้ายบิล',
  docTitle: 'ชื่อเอกสาร',
  billNo: 'เลขที่บิล',
  dateTime: 'วันที่/เวลา',
  cashier: 'พนักงานขาย',
  payMethod: 'วิธีชำระเงิน',
  items: 'รายการสินค้า',
  buyerName: 'ชื่อผู้ซื้อ',
  buyerAddr: 'ที่อยู่ผู้ซื้อ',
  buyerTaxId: 'เลขภาษีผู้ซื้อ',
  buyerBranch: 'สาขาผู้ซื้อ',
  subtotal: 'ยอดรวม',
  discount: 'ส่วนลด',
  preVatAmount: 'มูลค่าก่อนภาษี',
  vat: 'ภาษีมูลค่าเพิ่ม',
  total: 'ยอดสุทธิ',
  cancelReason: 'เหตุผลยกเลิก',
  logo: 'โลโก้',
  qr: 'คิวอาร์โค้ด',
};

// ฟิลด์ที่ให้เลือกใน dropdown ของ element ชนิด 'field'
const FIELD_KEYS: ReceiptFieldKey[] = [
  'shopName', 'shopAddr', 'shopTel', 'shopTaxId', 'shopBranch', 'posRegNo',
  'headerText', 'footerText', 'docTitle', 'billNo', 'dateTime', 'cashier',
  'payMethod', 'items', 'buyerName', 'buyerAddr', 'buyerTaxId', 'buyerBranch',
  'subtotal', 'discount', 'preVatAmount', 'vat', 'total', 'cancelReason',
];

const PRESET_OPTIONS: { id: PaperPresetId; label: string }[] = [
  { id: '58mm', label: '58มม.' },
  { id: '80mm', label: '80มม.' },
  { id: 'A4', label: 'A4' },
  { id: 'A5', label: 'A5' },
  { id: 'custom', label: 'กำหนดเอง' },
];

const ZOOM_OPTIONS = [0.75, 1, 1.5];

const ALIGN_OPTIONS: { id: ElementAlign; icon: string }[] = [
  { id: 'left', icon: 'text-outline' },
  { id: 'center', icon: 'reorder-two-outline' },
  { id: 'right', icon: 'text-outline' },
];

// เมนู "เพิ่มองค์ประกอบ" — map ชนิด/ฟิลด์เริ่มต้น
const ADD_ELEMENTS: { label: string; type: ReceiptElementType; field?: ReceiptFieldKey }[] = [
  { label: 'ข้อความ', type: 'text' },
  { label: 'ฟิลด์', type: 'field', field: 'shopName' },
  { label: 'เส้น', type: 'line' },
  { label: 'กรอบ', type: 'box' },
  { label: 'โลโก้', type: 'image', field: 'logo' },
  { label: 'QR', type: 'qr', field: 'qr' },
];

// สไตล์เส้น/กรอบ — ไว้คาด/แบ่งข้อมูล
const LINE_STYLES: { val: LineStyle; label: string }[] = [
  { val: 'solid',  label: 'ทึบ' },
  { val: 'dashed', label: 'ประ' },
  { val: 'dotted', label: 'จุด' },
  { val: 'double', label: 'คู่' },
];

// ─── ค่าคงที่/validation (design §6) ────────────────────────────────────────────

const SNAP_MM = 2;
const snap = (v: number) => Math.round(v / SNAP_MM) * SNAP_MM;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const CUSTOM_W_MIN = 20, CUSTOM_W_MAX = 400;
const CUSTOM_H_MIN = 20, CUSTOM_H_MAX = 2000;
const FONT_MIN = 6, FONT_MAX = 72;
const BORDER_MIN = 0.1, BORDER_MAX = 3;
const TEXT_MAX = 500;

// ─── หน้าจอหลัก ─────────────────────────────────────────────────────────────────

export const WebReceiptDesignerScreen: React.FC = () => {
  const config = useReceiptStore((s) => s.config);
  const setTemplate = useReceiptStore((s) => s.setTemplate);
  const setPaper = useReceiptStore((s) => s.setPaper);
  const addElement = useReceiptStore((s) => s.addElement);
  const updateElement = useReceiptStore((s) => s.updateElement);
  const moveElement = useReceiptStore((s) => s.moveElement);
  const resizeElement = useReceiptStore((s) => s.resizeElement);
  const removeElement = useReceiptStore((s) => s.removeElement);
  const duplicateElement = useReceiptStore((s) => s.duplicateElement);

  const template: ReceiptTemplate = config.template ?? DEFAULT_TEMPLATE;
  const paper = template.paper;

  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [saved, setSaved] = useState(false);
  const [paperError, setPaperError] = useState('');

  const data = useMemo(() => makeSampleData(config), [config]);
  const selected = template.elements.find((e) => e.id === selectedId) ?? null;

  // ── native fallback ────────────────────────────────────────────────────────
  if (Platform.OS !== 'web') {
    return (
      <View style={s.nativeWrap}>
        <Ionicons name="desktop-outline" size={40} color={WebColors.textSecondary} />
        <Text style={s.nativeNote}>
          การออกแบบรูปแบบบิลใช้งานได้บนเวอร์ชันเว็บเท่านั้น — การพิมพ์จะใช้รูปแบบกลางที่บันทึกไว้
        </Text>
        <View style={s.nativePreview}>
          <ReceiptCanvas template={template} data={data} mode="preview" zoom={1} />
        </View>
      </View>
    );
  }

  // ── helpers (web) ────────────────────────────────────────────────────────────

  const handleAdd = (item: typeof ADD_ELEMENTS[number]) => {
    const wMm = item.type === 'line' ? paper.widthMm - 2 * paper.marginMm : 40;
    const hMm = item.type === 'line' ? 1 : item.type === 'image' || item.type === 'qr' ? 20 : 8;
    const id = addElement({
      type: item.type,
      field: item.field,
      text: item.type === 'text' ? 'ข้อความใหม่' : undefined,
      xMm: paper.marginMm,
      yMm: paper.marginMm,
      wMm,
      hMm,
      style: {
        fontSize: 11,
        bold: false,
        align: 'left',
        border: item.type === 'box',
        borderWidthMm: 0.3,
      },
    });
    setSelectedId(id);
    setShowAddMenu(false);
  };

  const commitMove = (id: string, xMm: number, yMm: number) => {
    const el = template.elements.find((e) => e.id === id);
    if (!el) return;
    const maxX = Math.max(0, paper.widthMm - el.wMm);
    const maxY = paper.heightMm != null ? Math.max(0, paper.heightMm - el.hMm) : 100000;
    moveElement(id, clamp(snap(xMm), 0, maxX), clamp(snap(yMm), 0, maxY));
  };

  const commitResize = (id: string, wMm: number, hMm: number) => {
    const el = template.elements.find((e) => e.id === id);
    if (!el) return;
    const maxW = Math.max(SNAP_MM, paper.widthMm - el.xMm);
    const maxH = paper.heightMm != null ? Math.max(SNAP_MM, paper.heightMm - el.yMm) : 100000;
    resizeElement(id, clamp(snap(wMm), SNAP_MM, maxW), clamp(snap(hMm), SNAP_MM, maxH));
  };

  const changePreset = (id: PaperPresetId) => {
    setPaperError('');
    if (id === 'custom') {
      setPaper({ preset: 'custom', widthMm: paper.widthMm, heightMm: paper.heightMm, marginMm: paper.marginMm });
    } else {
      setPaper({ ...PAPER_PRESETS[id] });
    }
  };

  const changeCustomDim = (which: 'w' | 'h', raw: string) => {
    if (which === 'h' && raw.trim() === '') {
      // ว่าง = auto
      setPaperError('');
      setPaper({ ...paper, preset: 'custom', heightMm: null });
      return;
    }
    const n = Number(raw);
    if (!isFinite(n) || n <= 0) {
      setPaperError('ขนาดกระดาษไม่ถูกต้อง');
      return;
    }
    if (which === 'w') {
      if (n < CUSTOM_W_MIN || n > CUSTOM_W_MAX) {
        setPaperError(`ความกว้างไม่ถูกต้อง (${CUSTOM_W_MIN}–${CUSTOM_W_MAX} มม.)`);
        return;
      }
      setPaperError('');
      setPaper({ ...paper, preset: 'custom', widthMm: n });
    } else {
      if (n < CUSTOM_H_MIN || n > CUSTOM_H_MAX) {
        setPaperError(`ความสูงไม่ถูกต้อง (${CUSTOM_H_MIN}–${CUSTOM_H_MAX} มม.)`);
        return;
      }
      setPaperError('');
      setPaper({ ...paper, preset: 'custom', heightMm: n });
    }
  };

  const toggleAutoHeight = () => {
    setPaper({ ...paper, preset: 'custom', heightMm: paper.heightMm != null ? null : 100 });
  };

  const handleSave = () => {
    setTemplate(template);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePreviewPrint = () => {
    const html = buildTemplateHtml(template, data);
    const w = (window as any).open('', '_blank', 'width=460,height=680');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  // ── inspector editors ─────────────────────────────────────────────────────
  const patchStyle = (patch: Partial<ReceiptElement['style']>) => {
    if (!selected) return;
    updateElement(selected.id, { style: { ...selected.style, ...patch } });
  };

  const setNumericPos = (field: 'xMm' | 'yMm' | 'wMm' | 'hMm', raw: string) => {
    if (!selected) return;
    const n = Number(raw);
    if (!isFinite(n)) return;
    if (field === 'xMm' || field === 'yMm') {
      moveElement(
        selected.id,
        field === 'xMm' ? Math.max(0, n) : selected.xMm,
        field === 'yMm' ? Math.max(0, n) : selected.yMm,
      );
    } else {
      resizeElement(
        selected.id,
        field === 'wMm' ? Math.max(SNAP_MM, n) : selected.wMm,
        field === 'hMm' ? Math.max(SNAP_MM, n) : selected.hMm,
      );
    }
  };

  return (
    <View style={s.root}>
      {/* ── Toolbar ── */}
      <View style={s.toolbar}>
        {/* paper preset */}
        <View style={s.toolGroup}>
          {PRESET_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[s.segBtn, paper.preset === p.id && s.segBtnActive]}
              onPress={() => changePreset(p.id)}
            >
              <Text style={[s.segText, paper.preset === p.id && s.segTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* custom dims */}
        {paper.preset === 'custom' && (
          <View style={s.toolGroup}>
            <Text style={s.toolLabel}>กว้าง</Text>
            <TextInput
              style={s.dimInput}
              defaultValue={String(paper.widthMm)}
              keyboardType="numeric"
              onEndEditing={(e) => changeCustomDim('w', e.nativeEvent.text)}
            />
            <Text style={s.toolLabel}>สูง</Text>
            <TextInput
              style={s.dimInput}
              defaultValue={paper.heightMm != null ? String(paper.heightMm) : ''}
              placeholder="auto"
              placeholderTextColor={WebColors.textDisabled}
              keyboardType="numeric"
              editable={paper.heightMm != null}
              onEndEditing={(e) => changeCustomDim('h', e.nativeEvent.text)}
            />
            <TouchableOpacity style={s.chkRow} onPress={toggleAutoHeight}>
              <Ionicons
                name={paper.heightMm == null ? 'checkbox-outline' : 'square-outline'}
                size={18}
                color={WebColors.primary}
              />
              <Text style={s.toolLabel}>สูงอัตโนมัติ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* add element */}
        <View style={s.addWrap}>
          <TouchableOpacity style={s.toolBtn} onPress={() => setShowAddMenu((v) => !v)}>
            <Ionicons name="add-circle-outline" size={16} color={WebColors.text} />
            <Text style={s.toolBtnText}>เพิ่มองค์ประกอบ</Text>
          </TouchableOpacity>
          {showAddMenu && (
            <View style={s.addMenu}>
              {ADD_ELEMENTS.map((item) => (
                <TouchableOpacity key={item.label} style={s.addMenuItem} onPress={() => handleAdd(item)}>
                  <Text style={s.addMenuText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* zoom */}
        <View style={s.toolGroup}>
          {ZOOM_OPTIONS.map((z) => (
            <TouchableOpacity
              key={z}
              style={[s.segBtn, zoom === z && s.segBtnActive]}
              onPress={() => setZoom(z)}
            >
              <Text style={[s.segText, zoom === z && s.segTextActive]}>{z}x</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {/* central note chip */}
        <View style={s.noteChip}>
          <Ionicons name="globe-outline" size={13} color={WebColors.info} />
          <Text style={s.noteChipText}>รูปแบบบิลกลาง ใช้ร่วมกันทุกสาขา</Text>
        </View>

        <TouchableOpacity style={s.ghostBtn} onPress={handlePreviewPrint}>
          <Ionicons name="print-outline" size={16} color={WebColors.text} />
          <Text style={s.ghostBtnText}>ดูตัวอย่าง & พิมพ์</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.primaryBtn} onPress={handleSave}>
          <Ionicons name="save-outline" size={16} color="#fff" />
          <Text style={s.primaryBtnText}>บันทึกรูปแบบบิล</Text>
        </TouchableOpacity>
      </View>

      {saved && (
        <View style={s.toast}>
          <Ionicons name="checkmark-circle" size={16} color={WebColors.success} />
          <Text style={s.toastText}>บันทึกรูปแบบบิลแล้ว ✓</Text>
        </View>
      )}
      {!!paperError && (
        <View style={s.errorBar}>
          <Ionicons name="alert-circle-outline" size={15} color={WebColors.danger} />
          <Text style={s.errorText}>{paperError}</Text>
        </View>
      )}

      {/* ── Body: canvas + inspector ── */}
      <View style={s.body}>
        <ScrollView style={s.canvasScroll} contentContainerStyle={s.canvasContent}>
          <ReceiptCanvas
            template={template}
            data={data}
            mode="edit"
            zoom={zoom}
            selectedId={selectedId ?? undefined}
            onSelect={setSelectedId}
            onMove={commitMove}
            onResize={commitResize}
          />
        </ScrollView>

        {/* Inspector */}
        <ScrollView style={s.inspector} contentContainerStyle={{ padding: 14, gap: 12 }}>
          {!selected ? (
            <Text style={s.inspectorHint}>
              เลือกองค์ประกอบบนบิลเพื่อแก้ไขคุณสมบัติ หรือกด "เพิ่มองค์ประกอบ" เพื่อเริ่มออกแบบ
            </Text>
          ) : (
            <>
              <Text style={s.inspectorTitle}>คุณสมบัติองค์ประกอบ</Text>

              {/* content: text OR field */}
              {selected.type === 'text' && (
                <View style={s.field}>
                  <Text style={s.fieldLabel}>ข้อความ</Text>
                  <TextInput
                    style={s.textArea}
                    multiline
                    defaultValue={selected.text ?? ''}
                    maxLength={TEXT_MAX}
                    onEndEditing={(e) =>
                      updateElement(selected.id, { text: e.nativeEvent.text.slice(0, TEXT_MAX) })
                    }
                  />
                </View>
              )}
              {selected.type === 'field' && (
                <View style={s.field}>
                  <Text style={s.fieldLabel}>ฟิลด์ข้อมูล</Text>
                  <View style={s.fieldDropdown}>
                    {FIELD_KEYS.map((key) => (
                      <TouchableOpacity
                        key={key}
                        style={[s.fieldOpt, selected.field === key && s.fieldOptActive]}
                        onPress={() => updateElement(selected.id, { field: key })}
                      >
                        <Text
                          style={[s.fieldOptText, selected.field === key && s.fieldOptTextActive]}
                        >
                          {FIELD_LABELS[key]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* position x/y/w/h */}
              <View style={s.row4}>
                {(['xMm', 'yMm', 'wMm', 'hMm'] as const).map((f) => (
                  <View key={f} style={s.numField}>
                    <Text style={s.numLabel}>
                      {f === 'xMm' ? 'X' : f === 'yMm' ? 'Y' : f === 'wMm' ? 'กว้าง' : 'สูง'}
                    </Text>
                    <TextInput
                      style={s.numInput}
                      keyboardType="numeric"
                      defaultValue={String(selected[f])}
                      onEndEditing={(e) => setNumericPos(f, e.nativeEvent.text)}
                    />
                  </View>
                ))}
              </View>

              {/* fontSize + bold */}
              <View style={s.rowBetween}>
                <View style={[s.numField, { flex: 1 }]}>
                  <Text style={s.numLabel}>ขนาดฟอนต์</Text>
                  <TextInput
                    style={s.numInput}
                    keyboardType="numeric"
                    defaultValue={String(selected.style.fontSize)}
                    onEndEditing={(e) => {
                      const n = Number(e.nativeEvent.text);
                      if (isFinite(n)) patchStyle({ fontSize: clamp(n, FONT_MIN, FONT_MAX) });
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={[s.toggleBtn, selected.style.bold && s.toggleBtnActive]}
                  onPress={() => patchStyle({ bold: !selected.style.bold })}
                >
                  <Text style={[s.toggleText, selected.style.bold && s.toggleTextActive]}>ตัวหนา</Text>
                </TouchableOpacity>
              </View>

              {/* align */}
              <View style={s.field}>
                <Text style={s.fieldLabel}>การจัดวาง</Text>
                <View style={s.toolGroup}>
                  {ALIGN_OPTIONS.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      style={[s.segBtn, selected.style.align === a.id && s.segBtnActive]}
                      onPress={() => patchStyle({ align: a.id })}
                    >
                      <Text style={[s.segText, selected.style.align === a.id && s.segTextActive]}>
                        {a.id === 'left' ? 'ซ้าย' : a.id === 'center' ? 'กลาง' : 'ขวา'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* border */}
              <View style={s.rowBetween}>
                <TouchableOpacity
                  style={[s.toggleBtn, selected.style.border && s.toggleBtnActive]}
                  onPress={() => patchStyle({ border: !selected.style.border })}
                >
                  <Ionicons
                    name={selected.style.border ? 'checkbox-outline' : 'square-outline'}
                    size={16}
                    color={selected.style.border ? '#fff' : WebColors.text}
                  />
                  <Text style={[s.toggleText, selected.style.border && s.toggleTextActive]}>
                    กรอบ
                  </Text>
                </TouchableOpacity>
                <View style={[s.numField, { flex: 1 }]}>
                  <Text style={s.numLabel}>ความหนากรอบ (มม.)</Text>
                  <TextInput
                    style={s.numInput}
                    keyboardType="numeric"
                    defaultValue={String(selected.style.borderWidthMm)}
                    onEndEditing={(e) => {
                      const n = Number(e.nativeEvent.text);
                      if (isFinite(n)) patchStyle({ borderWidthMm: clamp(n, BORDER_MIN, BORDER_MAX) });
                    }}
                  />
                </View>
              </View>

              {/* line/border style — แสดงเมื่อเป็นเส้น/กรอบ หรือเปิดกรอบ */}
              {(selected.type === 'line' || selected.type === 'box' || selected.style.border) && (
                <View style={s.numField}>
                  <Text style={s.numLabel}>รูปแบบเส้น</Text>
                  <View style={s.toolGroup}>
                    {LINE_STYLES.map((ls) => {
                      const active = (selected.style.lineStyle || 'solid') === ls.val;
                      return (
                        <TouchableOpacity
                          key={ls.val}
                          style={[s.segBtn, active && s.segBtnActive]}
                          onPress={() => patchStyle({ lineStyle: ls.val })}
                        >
                          <Text style={[s.segText, active && s.segTextActive]}>{ls.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* actions */}
              <View style={s.rowBetween}>
                <TouchableOpacity
                  style={s.dupBtn}
                  onPress={() => {
                    const nid = duplicateElement(selected.id);
                    if (nid) setSelectedId(nid);
                  }}
                >
                  <Ionicons name="copy-outline" size={15} color={WebColors.text} />
                  <Text style={s.dupBtnText}>ทำซ้ำ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.delBtn}
                  onPress={() => {
                    removeElement(selected.id);
                    setSelectedId(null);
                  }}
                >
                  <Ionicons name="trash-outline" size={15} color="#fff" />
                  <Text style={s.delBtnText}>ลบ</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: WebColors.contentBg },

  // native fallback
  nativeWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, backgroundColor: WebColors.contentBg },
  nativeNote: { fontSize: 14, color: WebColors.textSecondary, textAlign: 'center', lineHeight: 22 },
  nativePreview: { marginTop: 10 },

  // toolbar
  toolbar: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: WebColors.cardBg,
    borderBottomWidth: 1, borderBottomColor: WebColors.cardBorder,
    zIndex: 1000, ...(Platform.OS === 'web' ? { elevation: 1000 } as any : {}),
  },
  toolGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  toolLabel: { fontSize: 12, color: WebColors.textSecondary },
  segBtn: {
    paddingHorizontal: 10, height: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, borderWidth: 1, borderColor: WebColors.cardBorder, backgroundColor: WebColors.white,
  },
  segBtnActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  segText: { fontSize: 12, color: WebColors.text },
  segTextActive: { color: '#fff', fontWeight: '700' },
  dimInput: {
    width: 56, height: 32, borderRadius: 6, borderWidth: 1, borderColor: WebColors.cardBorder,
    paddingHorizontal: 8, fontSize: 12, color: WebColors.text, backgroundColor: WebColors.white,
  },
  chkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  addWrap: { position: 'relative', zIndex: 1000, ...(Platform.OS === 'web' ? { elevation: 1000 } as any : {}) },
  toolBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 10,
    borderRadius: 6, borderWidth: 1, borderColor: WebColors.cardBorder, backgroundColor: WebColors.white,
  },
  toolBtnText: { fontSize: 12, color: WebColors.text, fontWeight: '600' },
  addMenu: {
    position: 'absolute', top: 36, left: 0, minWidth: 160,
    backgroundColor: WebColors.white, borderRadius: 8, borderWidth: 1, borderColor: WebColors.cardBorder,
    paddingVertical: 4, zIndex: 1000,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 14px rgba(0,0,0,0.14)' as any, elevation: 1000 } as any : {}),
  },
  addMenuItem: { paddingHorizontal: 12, paddingVertical: 9 },
  addMenuText: { fontSize: 13, color: WebColors.text },

  noteChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, height: 30, borderRadius: 15,
    backgroundColor: WebColors.infoLight,
  },
  noteChipText: { fontSize: 11, color: WebColors.info, fontWeight: '600' },

  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: WebColors.cardBorder, backgroundColor: WebColors.white,
  },
  ghostBtnText: { fontSize: 12, color: WebColors.text, fontWeight: '600' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 14,
    borderRadius: 8, backgroundColor: WebColors.primary,
  },
  primaryBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: WebColors.successLight,
  },
  toastText: { fontSize: 13, color: WebColors.success, fontWeight: '600' },
  errorBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: WebColors.dangerLight,
  },
  errorText: { fontSize: 13, color: WebColors.danger },

  // body
  body: { flex: 1, flexDirection: 'row' },
  canvasScroll: { flex: 1, backgroundColor: WebColors.gray100 },
  canvasContent: { alignItems: 'center', padding: 24 },

  // inspector
  inspector: {
    width: 280, flexShrink: 0,
    backgroundColor: WebColors.cardBg,
    borderLeftWidth: 1, borderLeftColor: WebColors.cardBorder,
  },
  inspectorHint: { fontSize: 13, color: WebColors.textSecondary, lineHeight: 20 },
  inspectorTitle: { fontSize: 14, fontWeight: '700', color: WebColors.text },

  field: { gap: 6 },
  fieldLabel: { fontSize: 12, color: WebColors.textSecondary, fontWeight: '600' },
  textArea: {
    minHeight: 60, borderRadius: 8, borderWidth: 1, borderColor: WebColors.cardBorder,
    padding: 8, fontSize: 13, color: WebColors.text, backgroundColor: WebColors.white,
    textAlignVertical: 'top',
  },
  fieldDropdown: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 5,
    borderRadius: 8, borderWidth: 1, borderColor: WebColors.cardBorder, padding: 6,
    backgroundColor: WebColors.white,
  },
  fieldOpt: {
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, backgroundColor: WebColors.gray100,
  },
  fieldOptActive: { backgroundColor: WebColors.primary },
  fieldOptText: { fontSize: 11, color: WebColors.text },
  fieldOptTextActive: { color: '#fff', fontWeight: '700' },

  row4: { flexDirection: 'row', gap: 6 },
  rowBetween: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  numField: { flex: 1, gap: 4 },
  numLabel: { fontSize: 11, color: WebColors.textSecondary },
  numInput: {
    height: 32, borderRadius: 6, borderWidth: 1, borderColor: WebColors.cardBorder,
    paddingHorizontal: 8, fontSize: 12, color: WebColors.text, backgroundColor: WebColors.white,
  },

  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 12,
    borderRadius: 6, borderWidth: 1, borderColor: WebColors.cardBorder, backgroundColor: WebColors.white,
  },
  toggleBtnActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  toggleText: { fontSize: 12, color: WebColors.text },
  toggleTextActive: { color: '#fff', fontWeight: '700' },

  dupBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    height: 36, borderRadius: 8, borderWidth: 1, borderColor: WebColors.cardBorder, backgroundColor: WebColors.white,
  },
  dupBtnText: { fontSize: 12, color: WebColors.text, fontWeight: '600' },
  delBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    height: 36, borderRadius: 8, backgroundColor: WebColors.danger,
  },
  delBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
});
