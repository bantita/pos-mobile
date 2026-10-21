/**
 * ReceiptCanvas — แคนวาสรูปแบบบิลที่ใช้ร่วม (shared edit/preview)
 *
 * เป็น "ฝั่ง React" ของ shared renderer: ทั้ง designer (mode='edit') และ
 * native fallback / live preview (mode='preview') ใช้ component ตัวนี้ตัวเดียว
 * โดยเรียก resolveField() + layoutElement() จาก utils/receiptTemplate ตัวเดียวกับ
 * buildTemplateHtml (ฝั่ง print) จึงการันตี WYSIWYG parity
 *
 * การลาก/ย่อ-ขยาย (drag/resize) ทำผ่าน raw DOM pointer events บน View ที่ RNW
 * render เป็น div และถูกครอบด้วย `if (Platform.OS === 'web')` ทั้งหมด —
 * บน native จะไม่มี pointer handler ใด ๆ (mode='preview' เท่านั้น)
 */
import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { WebColors } from '../../constants/webColors';
import {
  PX_PER_MM,
  layoutElement,
  resolveField,
  ReceiptRenderData,
} from '../../utils/receiptTemplate';
import {
  ReceiptTemplate,
  ReceiptElement,
} from '../../store/receiptStore';

export type ReceiptCanvasMode = 'edit' | 'preview';

interface ReceiptCanvasProps {
  template: ReceiptTemplate;
  data: ReceiptRenderData;
  mode: ReceiptCanvasMode;
  zoom: number;
  selectedId?: string;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, xMm: number, yMm: number) => void;
  onResize?: (id: string, wMm: number, hMm: number) => void;
}

/** ทิศของ handle ย่อ-ขยาย (8 จุด: มุม + ขอบ) */
type HandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
const HANDLE_DIRS: HandleDir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

// ─── Element content (สลับตาม kind — ตรรกะเดียวกับ buildTemplateHtml) ──────────

const ItemsRows: React.FC<{ rows: ReceiptRenderData['items']; fontSize: number }> = ({
  rows,
  fontSize,
}) => {
  const money = (n: number) => `฿${(isFinite(n) ? n : 0).toFixed(2)}`;
  return (
    <View style={{ width: '100%' }}>
      {rows.map((r, i) => (
        <View key={i} style={cs.itemRow}>
          <Text style={[cs.itemCell, { flex: 1, textAlign: 'left', fontSize }]} numberOfLines={1}>
            {r.name}
          </Text>
          <Text style={[cs.itemCellFixed, { width: 24, textAlign: 'center', fontSize }]}>
            {r.qty}
          </Text>
          <Text style={[cs.itemCellFixed, { width: 52, textAlign: 'right', fontSize }]}>
            {money(r.unitPrice)}
          </Text>
          <Text style={[cs.itemCellFixed, { width: 44, textAlign: 'right', fontSize }]}>
            {r.disc > 0 ? money(r.disc) : '-'}
          </Text>
          <Text
            style={[cs.itemCellFixed, { width: 56, textAlign: 'right', fontSize, fontWeight: '700' }]}
          >
            {money(r.lineTotal)}
          </Text>
        </View>
      ))}
    </View>
  );
};

const ElementContent: React.FC<{ el: ReceiptElement; data: ReceiptRenderData; zoom: number }> = ({
  el,
  data,
  zoom,
}) => {
  const resolved = resolveField(el, data);
  const s = el.style;
  const fontSize = s.fontSize * zoom;

  switch (resolved.kind) {
    case 'text': {
      if (resolved.value === null) return null; // ว่าง → ไม่มีเนื้อหา (กรอบเปล่าถ้ามี border)
      return (
        <Text
          style={{
            fontSize,
            fontWeight: s.bold ? '700' : '400',
            fontStyle: s.italic ? 'italic' : 'normal',
            textAlign: s.align,
            color: s.color || WebColors.text,
            width: '100%',
          }}
        >
          {resolved.value}
        </Text>
      );
    }
    case 'items':
      return resolved.rows.length === 0 ? null : (
        <ItemsRows rows={resolved.rows} fontSize={fontSize} />
      );
    case 'image':
      return resolved.show && resolved.uri ? (
        <Image
          source={{ uri: resolved.uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      ) : null;
    case 'qr':
      return resolved.payload ? (
        <QRCode
          value={resolved.payload}
          size={Math.max(16, Math.min(el.wMm, el.hMm) * PX_PER_MM * zoom - 2)}
          color={s.color || WebColors.text}
          backgroundColor={WebColors.white}
        />
      ) : null;
    default:
      return null;
  }
};

// ─── Canvas ────────────────────────────────────────────────────────────────────

export const ReceiptCanvas: React.FC<ReceiptCanvasProps> = ({
  template,
  data,
  mode,
  zoom,
  selectedId,
  onSelect,
  onMove,
  onResize,
}) => {
  const { paper, elements } = template;
  const k = PX_PER_MM * zoom;
  const widthPx = paper.widthMm * k;

  // ความสูง: fixed เมื่อมี heightMm, ไม่งั้น content-driven (max bottom + margin)
  const contentBottomMm = elements.reduce((m, e) => Math.max(m, e.yMm + e.hMm), 0);
  const heightMm = paper.heightMm != null ? paper.heightMm : contentBottomMm + paper.marginMm;
  const heightPx = Math.max(heightMm, 10) * k;

  const sorted = [...elements].sort((a, b) => a.z - b.z);
  const isEdit = mode === 'edit';

  // ── drag/resize state (web only) ──────────────────────────────────────────
  const drag = useRef<{
    kind: 'move' | 'resize';
    dir?: HandleDir;
    id: string;
    startX: number;
    startY: number;
    xMm: number;
    yMm: number;
    wMm: number;
    hMm: number;
  } | null>(null);

  const beginMove = (e: ReceiptElement, clientX: number, clientY: number) => {
    drag.current = {
      kind: 'move',
      id: e.id,
      startX: clientX,
      startY: clientY,
      xMm: e.xMm,
      yMm: e.yMm,
      wMm: e.wMm,
      hMm: e.hMm,
    };
  };

  const beginResize = (e: ReceiptElement, dir: HandleDir, clientX: number, clientY: number) => {
    drag.current = {
      kind: 'resize',
      dir,
      id: e.id,
      startX: clientX,
      startY: clientY,
      xMm: e.xMm,
      yMm: e.yMm,
      wMm: e.wMm,
      hMm: e.hMm,
    };
  };

  const onPointerMove = (clientX: number, clientY: number) => {
    const d = drag.current;
    if (!d) return;
    const dxMm = (clientX - d.startX) / k;
    const dyMm = (clientY - d.startY) / k;
    if (d.kind === 'move') {
      onMove?.(d.id, d.xMm + dxMm, d.yMm + dyMm);
      return;
    }
    // resize: ปรับ w/h (และ x/y เมื่อลากขอบบน/ซ้าย) ตามทิศ
    const dir = d.dir!;
    let xMm = d.xMm;
    let yMm = d.yMm;
    let wMm = d.wMm;
    let hMm = d.hMm;
    if (dir.includes('e')) wMm = d.wMm + dxMm;
    if (dir.includes('s')) hMm = d.hMm + dyMm;
    if (dir.includes('w')) {
      wMm = d.wMm - dxMm;
      xMm = d.xMm + dxMm;
    }
    if (dir.includes('n')) {
      hMm = d.hMm - dyMm;
      yMm = d.yMm + dyMm;
    }
    if (dir.includes('w') || dir.includes('n')) onMove?.(d.id, xMm, yMm);
    onResize?.(d.id, wMm, hMm);
  };

  const endDrag = () => {
    drag.current = null;
  };

  // props สำหรับ View ของ element ตอน edit บนเว็บ — pointer handlers ที่ RNW
  // ส่งต่อไปยัง div จริง. การ cast ไปขอบเขต DOM ของ RNW ทำที่จุดนี้จุดเดียว
  // (documented) ตามกฎ "ไม่ใช้ any พร่ำเพรื่อ"
  const webDragProps = (el: ReceiptElement): object => {
    if (Platform.OS !== 'web' || !isEdit) return {};
    return {
      onPointerDown: (ev: { clientX: number; clientY: number; stopPropagation: () => void; currentTarget: { setPointerCapture?: (id: number) => void }; pointerId?: number }) => {
        ev.stopPropagation();
        onSelect?.(el.id);
        beginMove(el, ev.clientX, ev.clientY);
        try {
          if (ev.pointerId != null) ev.currentTarget.setPointerCapture?.(ev.pointerId);
        } catch {
          /* บาง browser ไม่รองรับ pointer capture — ปล่อยผ่าน */
        }
      },
      onPointerMove: (ev: { clientX: number; clientY: number }) => onPointerMove(ev.clientX, ev.clientY),
      onPointerUp: endDrag,
      onLostPointerCapture: endDrag,
    };
  };

  const webHandleProps = (el: ReceiptElement, dir: HandleDir): object => {
    if (Platform.OS !== 'web' || !isEdit) return {};
    return {
      onPointerDown: (ev: { clientX: number; clientY: number; stopPropagation: () => void; currentTarget: { setPointerCapture?: (id: number) => void }; pointerId?: number }) => {
        ev.stopPropagation();
        onSelect?.(el.id);
        beginResize(el, dir, ev.clientX, ev.clientY);
        try {
          if (ev.pointerId != null) ev.currentTarget.setPointerCapture?.(ev.pointerId);
        } catch {
          /* no-op */
        }
      },
      onPointerMove: (ev: { clientX: number; clientY: number }) => onPointerMove(ev.clientX, ev.clientY),
      onPointerUp: endDrag,
      onLostPointerCapture: endDrag,
    };
  };

  const surfaceClear =
    Platform.OS === 'web' && isEdit
      ? ({ onPointerDown: () => onSelect?.(null) } as object)
      : {};

  const gridBg =
    Platform.OS === 'web'
      ? ({
          backgroundImage:
            `linear-gradient(to right, ${WebColors.gray100} 1px, transparent 1px),` +
            `linear-gradient(to bottom, ${WebColors.gray100} 1px, transparent 1px)`,
          backgroundSize: `${2 * k}px ${2 * k}px`,
        } as object)
      : {};

  return (
    <View
      {...surfaceClear}
      style={[
        cs.surface,
        { width: widthPx, height: heightPx },
        isEdit ? (gridBg as object) : null,
      ]}
    >
      {isEdit && elements.length === 0 && (
        <View style={cs.emptyWrap} pointerEvents="none">
          <Text style={cs.emptyText}>
            ยังไม่มีองค์ประกอบ — กดปุ่ม "เพิ่มองค์ประกอบ" เพื่อเริ่มออกแบบ
          </Text>
        </View>
      )}

      {sorted.map((el) => {
        const { leftPx, topPx, widthPx: wPx, heightPx: hPx } = layoutElement(el, zoom);
        const selected = isEdit && selectedId === el.id;
        const needsBorder = el.style.border || el.type === 'box' || el.type === 'line';
        const borderPx = Math.max(1, el.style.borderWidthMm * k);
        const lineStyle = el.style.lineStyle || 'solid';
        // RN borderStyle รองรับ solid/dashed/dotted; 'double' map เป็น solid หนาขึ้นบน preview
        const rnBorderStyle = lineStyle === 'double' ? 'solid' : lineStyle;
        const bColor = needsBorder ? el.style.color || WebColors.text : 'transparent';
        const isLine = el.type === 'line';
        return (
          <View
            key={el.id}
            {...webDragProps(el)}
            style={[
              cs.element,
              {
                left: leftPx,
                top: topPx,
                width: wPx,
                height: hPx,
                borderStyle: rnBorderStyle as any,
                // 'line' = เส้นคั่น → ขอบบนอย่างเดียว; อื่น ๆ = กรอบรอบ
                borderTopWidth: needsBorder ? (isLine ? borderPx : borderPx) : 0,
                borderRightWidth: needsBorder && !isLine ? borderPx : 0,
                borderBottomWidth: needsBorder && !isLine ? borderPx : 0,
                borderLeftWidth: needsBorder && !isLine ? borderPx : 0,
                borderColor: bColor,
              },
              selected ? cs.elementSelected : null,
            ]}
          >
            <View style={cs.elementInner} pointerEvents={isEdit ? 'none' : 'auto'}>
              <ElementContent el={el} data={data} zoom={zoom} />
            </View>

            {selected &&
              HANDLE_DIRS.map((dir) => (
                <View key={dir} {...webHandleProps(el, dir)} style={[cs.handle, handlePos(dir)]} />
              ))}
          </View>
        );
      })}
    </View>
  );
};

/** ตำแหน่งของ handle แต่ละทิศ (เป็น absolute offset) */
function handlePos(dir: HandleDir): object {
  const edge = -4;
  const mid = '50%' as const;
  const map: Record<HandleDir, object> = {
    nw: { left: edge, top: edge },
    n: { left: mid, top: edge, marginLeft: -4 },
    ne: { right: edge, top: edge },
    e: { right: edge, top: mid, marginTop: -4 },
    se: { right: edge, bottom: edge },
    s: { left: mid, bottom: edge, marginLeft: -4 },
    sw: { left: edge, bottom: edge },
    w: { left: edge, top: mid, marginTop: -4 },
  };
  return map[dir];
}

const cs = StyleSheet.create({
  surface: {
    backgroundColor: WebColors.white,
    position: 'relative',
    borderWidth: 1,
    borderColor: WebColors.cardBorder,
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 10px rgba(0,0,0,0.12)' as any } : {}),
  },
  element: {
    position: 'absolute',
    overflow: 'hidden',
  },
  elementInner: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  elementSelected: {
    borderWidth: 1,
    borderColor: WebColors.primary,
    ...(Platform.OS === 'web' ? { outlineStyle: 'solid' as any, outlineColor: WebColors.primary as any, outlineWidth: 1 as any } : {}),
  },
  handle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: WebColors.white,
    borderWidth: 1,
    borderColor: WebColors.primary,
    ...(Platform.OS === 'web' ? { cursor: 'nwse-resize' as any } : {}),
  },
  emptyWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 13,
    color: WebColors.textSecondary,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  itemCell: {
    color: WebColors.text,
  },
  itemCellFixed: {
    color: WebColors.text,
    flexShrink: 0,
  },
});
