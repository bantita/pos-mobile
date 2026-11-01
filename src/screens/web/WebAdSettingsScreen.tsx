/**
 * WebAdSettingsScreen — โฆษณาจอ 2 (หน้าเดียว บนลงล่าง)
 *
 *  1. สวิตช์เปิด/ปิดโฆษณา
 *  2. รายการโฆษณา — เพิ่มได้ในขั้นตอนเดียว (เลือกไฟล์ / วางลิงก์ / รูปตัวอย่าง)
 *     แต่ละการ์ด: เปิด/ปิด, ระยะเวลา 5/10/15/30 วิ + กำหนดเอง, ▲▼ + ลากเรียง (web), ลบ (ยืนยัน)
 *  3. จอ 2 ทำงานอย่างไร (โหมดเปลี่ยนอัตโนมัติ + ข้อความหลังชำระเงิน)
 *  4. ขั้นสูง (ชื่อร้าน, พื้นที่จัดเก็บ)
 *  5. ตัวอย่างจอ 2 แบบสด + ปุ่ม "เปิดจอ 2 จริง"
 *
 * store บันทึกอัตโนมัติทุกครั้งที่เปลี่ยน (persist) → ไม่มีปุ่มบันทึก
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image,
  ScrollView, Switch, Platform, ActivityIndicator, LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { FontSize, FontWeight, LineHeight } from '../../constants/typography';
import { Spacing, BorderRadius, BorderWidth, ComponentSize, Opacity } from '../../constants/spacing';
import { useCustomerDisplayStore } from '../../store/customerDisplayStore';
import { AdMedia, AdMediaType, DisplayMode } from '../../types/customerDisplay';
import {
  DURATION_PRESETS, SUCCESS_DURATION_PRESETS, AD_LIMITS, DEFAULT_THANK_YOU,
  inferAdType, validateAdFile, validateAdUrl, validateDuration,
  getPlayableAds, estimateAdsChars,
} from '../../utils/adSettings';
import {
  saveAdMedia, deleteAdMedia, dataUrlToBlob, isMediaStorageAvailable, useAdMediaUri,
} from '../../utils/adMedia';
import { WebCustomerDisplayScreen } from './WebCustomerDisplayScreen';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const SAMPLE_IMAGES = [
  { label: 'ร้านค้า',     uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800' },
  { label: 'โปรโมชั่น',  uri: 'https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=800' },
  { label: 'สินค้าสด',   uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800' },
  { label: 'เครื่องดื่ม', uri: 'https://images.unsplash.com/photo-1581456495146-65a71b2c8ca1?w=800' },
  { label: 'ขนม',        uri: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800' },
  { label: 'ร้านอาหาร',  uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800' },
];

// ข้อมูลตัวอย่างสำหรับหน้าตัวอย่างจอ 2 (โหมด 2–4)
const SAMPLE_ITEMS = [
  { id: 's1', name: 'น้ำดื่ม 600 มล.', unitPrice: 10, qty: 2, discAmt: 0, subtotal: 20 },
  { id: 's2', name: 'ขนมปังโฮลวีท',   unitPrice: 45, qty: 1, discAmt: 0, subtotal: 45 },
  { id: 's3', name: 'กาแฟเย็น',        unitPrice: 60, qty: 1, discAmt: 0, subtotal: 60 },
];
const SAMPLE_TOTAL = 125;
const SAMPLE_CHANGE = 375;

/** ขนาดจอ 2 เสมือน (ย่อด้วย scale ให้พอดีกล่องตัวอย่าง) */
const CANVAS_W = 1280;
const CANVAS_H = 720;
/** ความกว้างขั้นต่ำของการ์ดโฆษณา / คอลัมน์ ก่อนตัดขึ้นบรรทัดใหม่ */
const CARD_BASIS = 260;
const LEFT_COL_BASIS = 460;
const RIGHT_COL_BASIS = 340;
const THUMB_ICON = 36;
const TOAST_MS = 1500;
const MB = 1024 * 1024;

const STEPS: { mode: DisplayMode; icon: IconName; title: string; desc: string }[] = [
  { mode: 'idle',            icon: 'images-outline',           title: 'รอลูกค้า (โฆษณา)', desc: 'ยังไม่มีสินค้าในบิล' },
  { mode: 'cart',            icon: 'cart-outline',             title: 'รายการสินค้า',     desc: 'เมื่อสแกน/เพิ่มสินค้า' },
  { mode: 'payment_pending', icon: 'card-outline',             title: 'รอชำระเงิน',       desc: 'เมื่อกดปุ่มชำระเงิน' },
  { mode: 'payment_success', icon: 'checkmark-circle-outline', title: 'ชำระสำเร็จ',       desc: 'หลังรับเงิน แล้วกลับไปข้อ 1 อัตโนมัติ' },
];

const NO_MEDIA_STORAGE = 'เบราว์เซอร์นี้เก็บไฟล์ไม่ได้ — กรุณาวางลิงก์รูป/วิดีโอแทน';

const stripExt = (name: string) => name.replace(/\.[^.]+$/, '').trim();

const openDisplayWindow = (): boolean => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const w = window.open(
    window.location.href.split('?')[0] + '?display=1',
    'CustomerDisplay',
    'width=1280,height=720,menubar=no,toolbar=no,status=no,scrollbars=no',
  );
  w?.focus();
  return !!w;
};

// ─── Small building blocks ────────────────────────────────────────────────────
const ErrorBox: React.FC<{ message: string; onDismiss?: () => void }> = ({ message, onDismiss }) => (
  <View style={s.errorBox} accessibilityRole="alert">
    <Ionicons name="alert-circle" size={ComponentSize.icon.md} color={WebColors.danger} />
    <Text style={s.errorText}>{message}</Text>
    {onDismiss && (
      <TouchableOpacity style={s.iconBtn} onPress={onDismiss} accessibilityLabel="ปิดข้อความ">
        <Ionicons name="close" size={ComponentSize.icon.sm} color={WebColors.danger} />
      </TouchableOpacity>
    )}
  </View>
);

const Collapsible: React.FC<{ title: string; open: boolean; onToggle: () => void; icon?: IconName }> = ({
  title, open, onToggle, icon,
}) => (
  <TouchableOpacity
    style={s.collapseHead}
    onPress={onToggle}
    accessibilityRole="button"
    accessibilityState={{ expanded: open }}
  >
    {icon && <Ionicons name={icon} size={ComponentSize.icon.sm} color={WebColors.textSecondary} />}
    <Text style={s.collapseText}>{title}</Text>
    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={ComponentSize.icon.sm} color={WebColors.textSecondary} />
  </TouchableOpacity>
);

const Chip: React.FC<{ label: string; active: boolean; onPress: () => void; a11y?: string }> = ({
  label, active, onPress, a11y,
}) => (
  <TouchableOpacity
    style={[s.chip, active && s.chipActive]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    accessibilityLabel={a11y ?? label}
  >
    <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; label: string }> = ({ value, onChange, label }) => (
  <Switch
    value={value}
    onValueChange={onChange}
    trackColor={{ true: WebColors.primary, false: WebColors.gray300 }}
    thumbColor={WebColors.white}
    accessibilityLabel={label}
  />
);

// ─── Ad card ──────────────────────────────────────────────────────────────────
interface AdCardProps {
  ad: AdMedia;
  index: number;
  total: number;
  onSaved: () => void;
  onSelect: (ad: AdMedia) => void;
}

const AdCard: React.FC<AdCardProps> = ({ ad, index, total, onSaved, onSelect }) => {
  const { updateAd, toggleAd, moveAd, removeAd } = useCustomerDisplayStore();
  const isPreset = (DURATION_PRESETS as readonly number[]).includes(ad.duration);
  const [customOpen, setCustomOpen] = useState(!isPreset);
  const [customText, setCustomText] = useState(isPreset ? '' : String(ad.duration));
  const [customErr, setCustomErr]   = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [moreOpen, setMoreOpen]     = useState(false);
  const [title, setTitle]           = useState(ad.title ?? '');
  const [subtitle, setSubtitle]     = useState(ad.subtitle ?? '');
  const [focused, setFocused]       = useState<'title' | 'subtitle' | null>(null);
  const [thumbErr, setThumbErr]     = useState(false);
  const media = useAdMediaUri(ad.uri);
  const enabled = ad.enabled !== false;

  useEffect(() => { setThumbErr(false); }, [ad.uri]);
  // ค่าเปลี่ยนจากหน้าต่าง/แท็บอื่น → อัปเดตช่องที่ไม่ได้กำลังพิมพ์อยู่
  useEffect(() => { if (focused !== 'title') setTitle(ad.title ?? ''); }, [ad.title]);
  useEffect(() => { if (focused !== 'subtitle') setSubtitle(ad.subtitle ?? ''); }, [ad.subtitle]);

  const pickPreset = (d: number) => {
    setCustomOpen(false); setCustomErr(null);
    updateAd(ad.id, { duration: d });
    onSaved();
  };

  const applyCustom = () => {
    const err = validateDuration(customText);
    setCustomErr(err);
    if (err) return;
    updateAd(ad.id, { duration: Number(customText) });
    onSaved();
  };

  const commitText = () => {
    const t = title.trim();
    const st = subtitle.trim();
    if (t === (ad.title ?? '') && st === (ad.subtitle ?? '')) return;
    updateAd(ad.id, { title: t || undefined, subtitle: st || undefined });
    onSaved();
  };

  return (
    <View style={[s.adCard, !enabled && s.adCardOff]}>
      {/* Thumbnail */}
      <TouchableOpacity
        style={s.thumb}
        onPress={() => onSelect(ad)}
        accessibilityRole="button"
        accessibilityLabel={`ดูโฆษณาลำดับ ${index + 1} ในตัวอย่าง`}
      >
        {thumbErr || media.missing ? (
          <View style={s.thumbFallback}>
            <Ionicons name="warning-outline" size={THUMB_ICON} color={WebColors.warning} />
            <Text style={s.thumbFallbackText}>{media.missing ? 'ไม่พบไฟล์ในเครื่องนี้' : 'โหลดรูปไม่ได้'}</Text>
          </View>
        ) : !media.uri ? (
          <View style={s.thumbFallback}>
            <ActivityIndicator color={WebColors.white} />
          </View>
        ) : ad.type === 'image' ? (
          <Image source={{ uri: media.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setThumbErr(true)} />
        ) : Platform.OS === 'web' ? (
          <video
            src={media.uri}
            muted
            preload="metadata"
            playsInline
            onError={() => setThumbErr(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <View style={s.thumbFallback}>
            <Ionicons name="play-circle" size={THUMB_ICON} color={WebColors.white} />
          </View>
        )}
        <View style={s.orderBadge}><Text style={s.orderText}>{index + 1}</Text></View>
        <View style={[s.typeBadge, ad.type === 'video' && s.typeBadgeVideo]}>
          <Text style={s.typeBadgeText}>{ad.type === 'image' ? 'รูป' : 'วิดีโอ'}</Text>
        </View>
        {!enabled && (
          <View style={s.offOverlay}>
            <Text style={s.offOverlayText}>ปิดอยู่</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={s.adBody}>
        {/* Title + on/off */}
        <View style={s.rowBetween}>
          <Text style={s.adTitle} numberOfLines={1}>{ad.title || `โฆษณา ${index + 1}`}</Text>
          <View style={s.row}>
            <Text style={s.smallLabel}>แสดง</Text>
            <Toggle value={enabled} onChange={() => { toggleAd(ad.id); onSaved(); }} label={`แสดงโฆษณาลำดับ ${index + 1}`} />
          </View>
        </View>

        {/* Duration */}
        <Text style={s.smallLabel}>แสดงนาน</Text>
        <View style={s.chipRow}>
          {DURATION_PRESETS.map((d) => (
            <Chip key={d} label={`${d} วิ`} a11y={`${d} วินาที`} active={!customOpen && ad.duration === d} onPress={() => pickPreset(d)} />
          ))}
          <Chip label="กำหนดเอง" active={customOpen} onPress={() => { setCustomOpen(true); setCustomText(String(ad.duration)); }} />
        </View>
        {customOpen && (
          <View style={s.gapXs}>
            <View style={s.row}>
              <TextInput
                style={[s.input, s.inputNumber, !!customErr && s.inputError]}
                value={customText}
                onChangeText={(v) => { setCustomText(v); setCustomErr(null); }}
                onBlur={applyCustom}
                onSubmitEditing={applyCustom}
                keyboardType="number-pad"
                accessibilityLabel="ระยะเวลาที่กำหนดเอง (วินาที)"
                placeholder="เช่น 20"
                placeholderTextColor={WebColors.textDisabled}
              />
              <Text style={s.smallLabel}>วินาที</Text>
            </View>
            {customErr && <Text style={s.fieldError}>{customErr}</Text>}
          </View>
        )}

        {/* Reorder + delete */}
        {confirmDel ? (
          <View style={s.confirmRow}>
            <Text style={s.confirmText}>ลบโฆษณานี้?</Text>
            <TouchableOpacity style={s.secondaryBtn} onPress={() => setConfirmDel(false)}>
              <Text style={s.secondaryBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.dangerBtn}
              onPress={() => { setConfirmDel(false); removeAd(ad.id); onSaved(); }}
            >
              <Ionicons name="trash-outline" size={ComponentSize.icon.sm} color={WebColors.white} />
              <Text style={s.dangerBtnText}>ลบ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.rowBetween}>
            <View style={s.row}>
              {Platform.OS === 'web' && total > 1 && (
                <View style={s.dragHint} accessibilityElementsHidden importantForAccessibility="no">
                  <Ionicons name="reorder-three" size={ComponentSize.icon.md} color={WebColors.textDisabled} />
                </View>
              )}
              <TouchableOpacity
                style={[s.iconBtn, s.iconBtnBordered, index === 0 && s.disabled]}
                disabled={index === 0}
                onPress={() => { moveAd(ad.id, -1); onSaved(); }}
                accessibilityLabel="เลื่อนขึ้น"
                accessibilityState={{ disabled: index === 0 }}
              >
                <Ionicons name="chevron-up" size={ComponentSize.icon.md} color={WebColors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.iconBtn, s.iconBtnBordered, index === total - 1 && s.disabled]}
                disabled={index === total - 1}
                onPress={() => { moveAd(ad.id, 1); onSaved(); }}
                accessibilityLabel="เลื่อนลง"
                accessibilityState={{ disabled: index === total - 1 }}
              >
                <Ionicons name="chevron-down" size={ComponentSize.icon.md} color={WebColors.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[s.iconBtn, s.iconBtnDanger]}
              onPress={() => setConfirmDel(true)}
              accessibilityLabel={`ลบโฆษณาลำดับ ${index + 1}`}
            >
              <Ionicons name="trash-outline" size={ComponentSize.icon.md} color={WebColors.danger} />
            </TouchableOpacity>
          </View>
        )}

        {/* Optional details */}
        <Collapsible title="ตั้งค่าเพิ่มเติม" open={moreOpen} onToggle={() => setMoreOpen(!moreOpen)} />
        {moreOpen && (
          <View style={s.gapSm}>
            <Text style={s.helper}>ข้อความนี้จะแสดงทับบนโฆษณา (ไม่บังคับ)</Text>
            <Text style={s.smallLabel}>หัวข้อ</Text>
            <TextInput
              style={s.input}
              value={title}
              onChangeText={setTitle}
              onFocus={() => setFocused('title')}
              onBlur={() => { setFocused(null); commitText(); }}
              placeholder="เช่น โปรโมชั่นพิเศษ"
              placeholderTextColor={WebColors.textDisabled}
              accessibilityLabel="หัวข้อโฆษณา"
            />
            <Text style={s.smallLabel}>คำอธิบาย</Text>
            <TextInput
              style={s.input}
              value={subtitle}
              onChangeText={setSubtitle}
              onFocus={() => setFocused('subtitle')}
              onBlur={() => { setFocused(null); commitText(); }}
              placeholder="เช่น ลด 10% ทุกสินค้า"
              placeholderTextColor={WebColors.textDisabled}
              accessibilityLabel="คำอธิบายโฆษณา"
            />
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Draggable wrapper (web: HTML5 drag & drop; native: plain View) ──────────
interface DragProps {
  index: number;
  isOver: boolean;
  isDragging: boolean;
  onStart: (i: number) => void;
  onOver: (i: number) => void;
  onDrop: (i: number) => void;
  onEnd: () => void;
  children: React.ReactNode;
}

const DragItem: React.FC<DragProps> = ({ index, isOver, isDragging, onStart, onOver, onDrop, onEnd, children }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  if (Platform.OS !== 'web') return <View style={s.cardCell}>{children}</View>;
  return (
    <div
      ref={ref}
      draggable
      // กดในช่องกรอก → ปิดการลากชั่วคราว เพื่อให้เลือกข้อความได้ตามปกติ
      onMouseDownCapture={(e: React.MouseEvent<HTMLDivElement>) => {
        const tag = (e.target as HTMLElement).tagName;
        if (ref.current) ref.current.draggable = tag !== 'INPUT' && tag !== 'TEXTAREA';
      }}
      onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
        onStart(index);
      }}
      onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); onOver(index); }}
      onDrop={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); onDrop(index); }}
      onDragEnd={onEnd}
      style={{
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: CARD_BASIS,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        borderRadius: BorderRadius.md,
        outline: isOver && !isDragging ? `${BorderWidth.thick}px dashed ${WebColors.primary}` : 'none',
        outlineOffset: Spacing.xs / 2,
      }}
    >
      {children}
    </div>
  );
};

// ─── Live preview ─────────────────────────────────────────────────────────────
const LivePreview: React.FC<{ mode: DisplayMode }> = ({ mode }) => {
  const [boxW, setBoxW] = useState(0);
  const scale = boxW > 0 ? boxW / CANVAS_W : 0;
  const boxH = boxW * (CANVAS_H / CANVAS_W);
  const withItems = mode !== 'idle';

  return (
    <View
      style={[s.previewBox, { height: boxH || undefined }]}
      onLayout={(e: LayoutChangeEvent) => setBoxW(e.nativeEvent.layout.width)}
      accessibilityLabel="ตัวอย่างจอ 2"
    >
      {scale > 0 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: CANVAS_W,
            height: CANVAS_H,
            left: (boxW - CANVAS_W) / 2,
            top: (boxH - CANVAS_H) / 2,
            transform: [{ scale }],
          }}
        >
          <WebCustomerDisplayScreen
            embedded
            hideMemberInfo
            mode={mode}
            displayItems={withItems ? SAMPLE_ITEMS : []}
            subtotalOverride={withItems ? SAMPLE_TOTAL : 0}
            discountOverride={0}
            grandOverride={withItems ? SAMPLE_TOTAL : 0}
            changeAmount={mode === 'payment_success' ? SAMPLE_CHANGE : 0}
          />
        </View>
      )}
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
interface Props { onBack: () => void }

export const WebAdSettingsScreen: React.FC<Props> = ({ onBack }) => {
  const {
    ads, shopName, adsEnabled, successDurationSec, thankYouMessage, storageError,
    addAdWithDefaults, moveAdTo, setAdsEnabled, setShopName, setSuccessDuration,
    setThankYouMessage, clearStorageError, setAdIndex,
  } = useCustomerDisplayStore();

  const [hydrated, setHydrated] = useState<boolean>(() => useCustomerDisplayStore.persist.hasHydrated());
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [toast, setToast]       = useState<string | null>(null);
  const [urlOpen, setUrlOpen]   = useState(Platform.OS !== 'web');
  const [url, setUrl]           = useState('');
  const [urlErr, setUrlErr]     = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<DisplayMode>('idle');
  const [advOpen, setAdvOpen]   = useState(false);
  const [shopInput, setShopInput]   = useState(shopName);
  const [thankInput, setThankInput] = useState(thankYouMessage);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const fileRef  = useRef<HTMLInputElement | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hydrated) return;
    const unsub = useCustomerDisplayStore.persist.onFinishHydration(() => setHydrated(true));
    if (useCustomerDisplayStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [hydrated]);

  // sync local inputs เมื่อค่าใน store เปลี่ยน (เช่น หลังโหลด)
  useEffect(() => { setShopInput(shopName); }, [shopName]);
  useEffect(() => { setThankInput(thankYouMessage); }, [thankYouMessage]);
  useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

  const notify = (msg = 'บันทึกแล้ว') => {
    // ถ้าบันทึกลงเครื่องไม่สำเร็จ ไม่แสดง "บันทึกแล้ว" (จะแสดง error แทน)
    if (useCustomerDisplayStore.getState().storageError) return;
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), TOAST_MS);
  };

  const playable = getPlayableAds(ads, adsEnabled);
  const usedChars = estimateAdsChars(ads);

  const addFromUri = (uri: string, type: AdMediaType, title?: string): boolean => {
    if (estimateAdsChars(useCustomerDisplayStore.getState().ads) + uri.length > AD_LIMITS.totalChars) {
      setError('พื้นที่เก็บโฆษณาเต็ม — ลบโฆษณาบางรายการหรือวางลิงก์แทน');
      return false;
    }
    const created = addAdWithDefaults({ uri, type, title });
    if (adsEnabled) {
      const idx = getPlayableAds(useCustomerDisplayStore.getState().ads, true).findIndex((a) => a.id === created.id);
      if (idx >= 0) setAdIndex(idx);
    }
    setPreviewMode('idle');
    return true;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    let added = 0;
    const errors: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const err = validateAdFile({ type: file.type, size: file.size });
        if (err) { errors.push(`${file.name}: ${err}`); continue; }
        const type = inferAdType(file.type);
        if (!type) { errors.push(`${file.name}: รองรับเฉพาะไฟล์รูปภาพหรือวิดีโอ`); continue; }
        if (!isMediaStorageAvailable()) { errors.push(NO_MEDIA_STORAGE); break; }
        try {
          // เก็บไฟล์ใน IndexedDB — localStorage เก็บแค่ตัวอ้างอิงสั้นๆ
          const ref = await saveAdMedia(file);
          if (addFromUri(ref, type, stripExt(file.name))) added++;
          else { void deleteAdMedia(ref).catch(() => {}); break; }
        } catch {
          errors.push(`${file.name}: บันทึกไฟล์ไม่สำเร็จ (พื้นที่เบราว์เซอร์อาจเต็ม) ลองใหม่อีกครั้ง`);
        }
      }
    } finally {
      setBusy(false);
    }
    if (errors.length) setError(errors.join('\n'));
    if (added > 0) notify(added > 1 ? `เพิ่มโฆษณา ${added} รายการแล้ว` : 'เพิ่มโฆษณาแล้ว');
  };

  const pickFile = () => {
    if (Platform.OS === 'web') fileRef.current?.click();
    else setUrlOpen(true);
  };

  const addUrl = async () => {
    const err = validateAdUrl(url);
    const type = err ? null : inferAdType(url);
    if (err || !type) { setUrlErr(err ?? 'ลิงก์ไม่ถูกต้อง'); return; }
    setUrlErr(null);
    const v = url.trim();
    if (v.toLowerCase().startsWith('data:')) {
      // data URL ที่วางมา → เก็บเป็นไฟล์ใน IndexedDB แทน localStorage
      const blob = dataUrlToBlob(v);
      if (!blob) { setUrlErr('ลิงก์ไม่ถูกต้อง'); return; }
      const fileErr = validateAdFile({ type: blob.type, size: blob.size });
      if (fileErr) { setUrlErr(fileErr); return; }
      if (!isMediaStorageAvailable()) { setUrlErr(NO_MEDIA_STORAGE); return; }
      setBusy(true);
      try {
        const ref = await saveAdMedia(blob);
        if (addFromUri(ref, type)) { setUrl(''); notify('เพิ่มโฆษณาแล้ว'); }
        else void deleteAdMedia(ref).catch(() => {});
      } catch {
        setUrlErr('บันทึกไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง');
      } finally {
        setBusy(false);
      }
      return;
    }
    if (addFromUri(v, type)) { setUrl(''); notify('เพิ่มโฆษณาแล้ว'); }
  };

  const addSample = (img: { label: string; uri: string }) => {
    if (addFromUri(img.uri, 'image', img.label)) notify('เพิ่มโฆษณาแล้ว');
  };

  const selectAd = (ad: AdMedia) => {
    setPreviewMode('idle');
    const idx = playable.findIndex((a) => a.id === ad.id);
    if (idx >= 0) setAdIndex(idx);
  };

  const openReal = () => {
    if (!openDisplayWindow()) setError('เบราว์เซอร์บล็อกหน้าต่างใหม่ — กรุณาอนุญาตป๊อปอัปแล้วลองอีกครั้ง');
  };

  const commitShop = () => {
    const v = shopInput.trim();
    if (!v) { setShopInput(shopName); return; }
    if (v === shopName) return;
    setShopName(v);
    notify();
  };

  const commitThank = () => {
    const v = thankInput.trim() || DEFAULT_THANK_YOU;
    setThankInput(v);
    if (v === thankYouMessage) return;
    setThankYouMessage(v);
    notify();
  };

  const endDrag = () => { setDragFrom(null); setDragOver(null); };
  const dropAt = (to: number) => {
    if (dragFrom !== null && dragFrom !== to) { moveAdTo(dragFrom, to); notify(); }
    endDrag();
  };

  // ── Loading ──
  if (!hydrated) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={WebColors.primary} />
        <Text style={s.helper}>กำลังโหลด…</Text>
      </View>
    );
  }

  const addButton = (
    <TouchableOpacity
      style={[s.primaryBtn, s.primaryBtnLg, busy && s.disabled]}
      onPress={pickFile}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel="เพิ่มโฆษณา"
    >
      {busy
        ? <ActivityIndicator color={WebColors.white} />
        : <Ionicons name="add" size={ComponentSize.icon.lg} color={WebColors.white} />}
      <Text style={s.primaryBtnTextLg}>{busy ? 'กำลังอ่านไฟล์…' : 'เพิ่มโฆษณา'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel="กลับไปหน้าตั้งค่า">
          <Ionicons name="arrow-back" size={ComponentSize.icon.md} color={WebColors.primary} />
          <Text style={s.backText}>ตั้งค่า</Text>
        </TouchableOpacity>
        <View style={s.headerTitleWrap}>
          <Text style={s.title}>โฆษณาจอ 2</Text>
          <Text style={s.subtitle}>ภาพและวิดีโอที่ลูกค้าเห็นบนจอที่ 2 — บันทึกอัตโนมัติ</Text>
        </View>
        {Platform.OS === 'web' && (
          <TouchableOpacity style={s.secondaryBtn} onPress={openReal} accessibilityRole="button">
            <Ionicons name="tv-outline" size={ComponentSize.icon.sm} color={WebColors.primary} />
            <Text style={s.secondaryBtnText}>เปิดจอ 2 จริง</Text>
          </TouchableOpacity>
        )}
      </View>

      {toast && (
        <View style={s.toast} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={ComponentSize.icon.sm} color={WebColors.success} />
          <Text style={s.toastText}>{toast}</Text>
        </View>
      )}

      {/* hidden file input (web) */}
      {Platform.OS === 'web' && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            void handleFiles(files).finally(() => { e.target.value = ''; });
          }}
        />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.columns}>
          {/* ════════ LEFT ════════ */}
          <View style={s.leftCol}>
            {/* 1. Master switch */}
            <View style={s.card}>
              <View style={s.rowBetween}>
                <View style={s.flex1}>
                  <Text style={s.cardTitle}>แสดงโฆษณาบนจอ 2</Text>
                  <Text style={s.helper}>
                    โฆษณาจะเล่นวนที่มุมขวาล่างของจอ 2 ตลอดเวลา (ถ้าปิด จะแสดงชื่อร้านแทน)
                  </Text>
                </View>
                <Toggle value={adsEnabled} onChange={(v) => { setAdsEnabled(v); notify(); }} label="แสดงโฆษณาบนจอ 2" />
              </View>
              {storageError && <ErrorBox message={storageError} onDismiss={clearStorageError} />}
            </View>

            {/* 2. Ads */}
            <View style={s.card}>
              <View style={s.rowBetween}>
                <View style={s.flex1}>
                  <Text style={s.cardTitle}>รายการโฆษณา ({ads.length})</Text>
                  <Text style={s.helper}>
                    {adsEnabled
                      ? `กำลังเล่น ${playable.length} จาก ${ads.length} รายการ ตามลำดับด้านล่าง`
                      : 'ปิดอยู่ — โฆษณาจะไม่แสดงบนจอ 2 (ยังแก้ไขได้)'}
                  </Text>
                </View>
                {ads.length > 0 && addButton}
              </View>

              {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

              {/* URL / sample (secondary) */}
              {Platform.OS === 'web' && (
                <TouchableOpacity
                  style={s.linkBtn}
                  onPress={() => setUrlOpen(!urlOpen)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: urlOpen }}
                >
                  <Ionicons name="link-outline" size={ComponentSize.icon.sm} color={WebColors.primary} />
                  <Text style={s.linkBtnText}>หรือวางลิงก์รูป/วิดีโอ หรือใช้รูปตัวอย่าง</Text>
                  <Ionicons name={urlOpen ? 'chevron-up' : 'chevron-down'} size={ComponentSize.icon.sm} color={WebColors.primary} />
                </TouchableOpacity>
              )}
              {urlOpen && (
                <View style={s.gapSm}>
                  <View style={s.row}>
                    <TextInput
                      style={[s.input, s.flex1, !!urlErr && s.inputError]}
                      value={url}
                      onChangeText={(v) => { setUrl(v); setUrlErr(null); }}
                      onSubmitEditing={addUrl}
                      placeholder="https://.../รูป.jpg หรือ วิดีโอ.mp4"
                      placeholderTextColor={WebColors.textDisabled}
                      autoCapitalize="none"
                      accessibilityLabel="ลิงก์รูปหรือวิดีโอ"
                    />
                    <TouchableOpacity
                      style={[s.primaryBtn, !url.trim() && s.disabled]}
                      onPress={addUrl}
                      disabled={!url.trim()}
                      accessibilityRole="button"
                    >
                      <Text style={s.primaryBtnText}>เพิ่ม</Text>
                    </TouchableOpacity>
                  </View>
                  {urlErr && <Text style={s.fieldError}>{urlErr}</Text>}
                  <Text style={s.smallLabel}>หรือใช้รูปตัวอย่าง (กดเพื่อเพิ่มทันที)</Text>
                  <View style={s.chipRow}>
                    {SAMPLE_IMAGES.map((img) => (
                      <TouchableOpacity
                        key={img.uri}
                        style={s.sample}
                        onPress={() => addSample(img)}
                        accessibilityRole="button"
                        accessibilityLabel={`เพิ่มรูปตัวอย่าง ${img.label}`}
                      >
                        <Image source={{ uri: img.uri }} style={s.sampleImg} resizeMode="cover" />
                        <Text style={s.sampleLabel}>{img.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {ads.length === 0 ? (
                <View style={s.empty}>
                  <Ionicons name="images-outline" size={ComponentSize.avatar.lg} color={WebColors.gray300} />
                  <Text style={s.emptyText}>ยังไม่มีโฆษณา — กด เพิ่มโฆษณา เพื่ออัปโหลดรูปหรือวิดีโอ</Text>
                  {addButton}
                  <Text style={s.helper}>
                    รูปไม่เกิน {AD_LIMITS.imageBytes / MB} MB · วิดีโอไม่เกิน {AD_LIMITS.videoBytes / MB} MB
                  </Text>
                </View>
              ) : (
                <>
                  {Platform.OS === 'web' && ads.length > 1 && (
                    <Text style={s.helper}>ลากการ์ดเพื่อสลับลำดับ หรือกดปุ่ม ▲ ▼</Text>
                  )}
                  <View style={[s.grid, !adsEnabled && s.dimmed]}>
                    {ads.map((ad, idx) => (
                      <DragItem
                        key={ad.id}
                        index={idx}
                        isOver={dragOver === idx}
                        isDragging={dragFrom === idx}
                        onStart={setDragFrom}
                        onOver={(i) => { if (dragOver !== i) setDragOver(i); }}
                        onDrop={dropAt}
                        onEnd={endDrag}
                      >
                        <AdCard ad={ad} index={idx} total={ads.length} onSaved={() => notify()} onSelect={selectAd} />
                      </DragItem>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* 3. How it works */}
            <View style={s.card}>
              <Text style={s.cardTitle}>จอ 2 ทำงานอย่างไร</Text>
              <Text style={s.helper}>จอ 2 จะเปลี่ยนโหมดอัตโนมัติตามขั้นตอนการขาย — ไม่ต้องกดเลือกเอง</Text>
              <View style={s.steps}>
                {STEPS.map((st, i) => {
                  const selected = previewMode === st.mode;
                  return (
                    <React.Fragment key={st.mode}>
                      <TouchableOpacity
                        style={[s.step, selected && s.stepSelected]}
                        onPress={() => setPreviewMode(st.mode)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`ขั้นที่ ${i + 1} ${st.title} — กดเพื่อดูตัวอย่าง`}
                      >
                        <View style={s.rowBetween}>
                          <View style={[s.stepNum, selected && s.stepNumSelected]}>
                            <Text style={[s.stepNumText, selected && s.stepNumTextSelected]}>{i + 1}</Text>
                          </View>
                          {selected
                            ? <Ionicons name="checkmark-circle" size={ComponentSize.icon.md} color={WebColors.primary} />
                            : <Ionicons name={st.icon} size={ComponentSize.icon.md} color={WebColors.textSecondary} />}
                        </View>
                        <Text style={s.stepTitle}>{st.title}</Text>
                        <Text style={s.stepDesc}>{st.desc}</Text>
                        <Text style={s.stepHint}>กดเพื่อดูตัวอย่าง</Text>
                      </TouchableOpacity>
                      {i < STEPS.length - 1 && (
                        <View style={s.stepArrow} importantForAccessibility="no">
                          <Ionicons name="arrow-forward" size={ComponentSize.icon.sm} color={WebColors.textDisabled} />
                        </View>
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              <View style={s.stepSettings}>
                {previewMode === 'idle' && (
                  <Text style={s.helper}>เปิด/ปิดโฆษณาได้ที่ด้านบน และจัดการรายการโฆษณาได้ในหัวข้อ "รายการโฆษณา"</Text>
                )}
                {(previewMode === 'cart' || previewMode === 'payment_pending') && (
                  <Text style={s.helper}>ไม่ต้องตั้งค่า — แสดงข้อมูลจากหน้าขายอัตโนมัติ</Text>
                )}
                {previewMode === 'payment_success' && (
                  <View style={s.gapSm}>
                    <Text style={s.smallLabel}>ข้อความขอบคุณ</Text>
                    <TextInput
                      style={s.input}
                      value={thankInput}
                      onChangeText={setThankInput}
                      onBlur={commitThank}
                      onSubmitEditing={commitThank}
                      placeholder={DEFAULT_THANK_YOU}
                      placeholderTextColor={WebColors.textDisabled}
                      accessibilityLabel="ข้อความขอบคุณหลังชำระเงิน"
                    />
                    <Text style={s.helper}>เว้นว่างไว้ = ใช้ข้อความ "{DEFAULT_THANK_YOU}"</Text>
                    <Text style={s.smallLabel}>แสดงนานก่อนกลับหน้าโฆษณา</Text>
                    <View style={s.chipRow}>
                      {SUCCESS_DURATION_PRESETS.map((d) => (
                        <Chip
                          key={d}
                          label={`${d} วินาที`}
                          active={successDurationSec === d}
                          onPress={() => { setSuccessDuration(d); notify(); }}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* 4. Advanced */}
            <View style={s.card}>
              <Collapsible title="ขั้นสูง" icon="settings-outline" open={advOpen} onToggle={() => setAdvOpen(!advOpen)} />
              {advOpen && (
                <View style={s.gapSm}>
                  <Text style={s.smallLabel}>ชื่อร้านบนจอ 2</Text>
                  <TextInput
                    style={s.input}
                    value={shopInput}
                    onChangeText={setShopInput}
                    onBlur={commitShop}
                    onSubmitEditing={commitShop}
                    placeholder="ชื่อร้านค้า"
                    placeholderTextColor={WebColors.textDisabled}
                    accessibilityLabel="ชื่อร้านบนจอ 2"
                  />
                  <Text style={s.helper}>แสดงที่มุมขวาบนของจอ 2 และแสดงแทนโฆษณาเมื่อปิดโฆษณา</Text>
                  <Text style={s.smallLabel}>พื้นที่เก็บโฆษณาในเครื่องนี้</Text>
                  <Text style={s.helper}>
                    ไฟล์ที่อัปโหลดเก็บไว้ในเบราว์เซอร์นี้แยกจากข้อมูลการขาย จึงไม่กินพื้นที่ของระบบขาย
                    (ข้อมูลการตั้งค่าโฆษณาใช้ไป {(usedChars / MB).toFixed(2)} / {(AD_LIMITS.totalChars / MB).toFixed(1)} MB)
                    — ถ้าล้างข้อมูลเบราว์เซอร์ ไฟล์จะหายและต้องอัปโหลดใหม่
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ════════ RIGHT: preview ════════ */}
          <View style={s.rightCol}>
            <View style={s.card}>
              <Text style={s.cardTitle}>ตัวอย่างจอ 2</Text>
              <LivePreview mode={previewMode} />
              <View style={s.chipRow}>
                {STEPS.map((st, i) => (
                  <Chip
                    key={st.mode}
                    label={`${i + 1}. ${st.title}`}
                    active={previewMode === st.mode}
                    onPress={() => setPreviewMode(st.mode)}
                  />
                ))}
              </View>
              {previewMode === 'idle' && adsEnabled && playable.length === 0 && ads.length > 0 && (
                <Text style={s.helper}>โฆษณาทุกรายการปิดอยู่ — จอ 2 จะแสดงชื่อร้านแทน</Text>
              )}
              {Platform.OS === 'web' && (
                <TouchableOpacity style={[s.secondaryBtn, s.fullWidth]} onPress={openReal} accessibilityRole="button">
                  <Ionicons name="tv-outline" size={ComponentSize.icon.sm} color={WebColors.primary} />
                  <Text style={s.secondaryBtnText}>เปิดจอ 2 จริง</Text>
                </TouchableOpacity>
              )}
              <Text style={s.helper}>การเปลี่ยนแปลงบันทึกอัตโนมัติและส่งไปจอ 2 ที่เปิดอยู่ทันที</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  scroll: { paddingBottom: Spacing['3xl'] },
  flex1: { flex: 1, minWidth: 0 },
  fullWidth: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, flexWrap: 'wrap' },
  gapXs: { gap: Spacing.xs },
  gapSm: { gap: Spacing.sm },
  disabled: { opacity: Opacity.disabled },
  dimmed: { opacity: Opacity.pressed },

  // header
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    minHeight: ComponentSize.button.md, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.sm,
  },
  backText: { fontSize: FontSize.sm, color: WebColors.primary, fontWeight: FontWeight.semibold },
  headerTitleWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: FontSize.subtitle, fontWeight: FontWeight.extrabold, color: WebColors.text },
  subtitle: { fontSize: FontSize.sm, color: WebColors.textSecondary },

  toast: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.md,
    backgroundColor: WebColors.successLight, borderRadius: BorderRadius.sm,
  },
  toastText: { fontSize: FontSize.sm, color: WebColors.success, fontWeight: FontWeight.semibold },

  // layout
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg, alignItems: 'flex-start' },
  leftCol: { flexGrow: 3, flexShrink: 1, flexBasis: LEFT_COL_BASIS, minWidth: 0, gap: Spacing.lg },
  rightCol: { flexGrow: 2, flexShrink: 1, flexBasis: RIGHT_COL_BASIS, minWidth: 0, gap: Spacing.lg },

  card: {
    backgroundColor: WebColors.cardBg, borderRadius: BorderRadius.md, padding: Spacing.lg, gap: Spacing.md,
    borderWidth: BorderWidth.thin, borderColor: WebColors.border,
  },
  cardTitle: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: WebColors.text },
  helper: { fontSize: FontSize.sm, color: WebColors.textSecondary, lineHeight: LineHeight.tight },
  smallLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: WebColors.textSecondary },
  fieldError: { fontSize: FontSize.sm, color: WebColors.danger },

  // buttons
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    minHeight: ComponentSize.button.md, paddingHorizontal: Spacing.lg,
    backgroundColor: WebColors.primary, borderRadius: BorderRadius.sm,
  },
  primaryBtnLg: { minHeight: ComponentSize.button.lg, paddingHorizontal: Spacing.xl },
  primaryBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: WebColors.white },
  primaryBtnTextLg: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: WebColors.white },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    minHeight: ComponentSize.button.md, paddingHorizontal: Spacing.md,
    backgroundColor: WebColors.white, borderRadius: BorderRadius.sm,
    borderWidth: BorderWidth.medium, borderColor: WebColors.primary,
  },
  secondaryBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: WebColors.primary },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    minHeight: ComponentSize.button.md, paddingHorizontal: Spacing.lg,
    backgroundColor: WebColors.danger, borderRadius: BorderRadius.sm,
  },
  dangerBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: WebColors.white },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'flex-start',
    minHeight: ComponentSize.button.md,
  },
  linkBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: WebColors.primary },
  iconBtn: {
    width: ComponentSize.button.md, height: ComponentSize.button.md, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnBordered: { borderWidth: BorderWidth.thin, borderColor: WebColors.border, backgroundColor: WebColors.white },
  iconBtnDanger: { backgroundColor: WebColors.dangerLight },

  // chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    minHeight: ComponentSize.button.md, paddingHorizontal: Spacing.md, justifyContent: 'center',
    borderRadius: BorderRadius.sm, borderWidth: BorderWidth.medium, borderColor: WebColors.border,
    backgroundColor: WebColors.gray50,
  },
  chipActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: WebColors.textSecondary },
  chipTextActive: { color: WebColors.white },

  // inputs
  input: {
    minHeight: ComponentSize.input.md, borderWidth: BorderWidth.medium, borderColor: WebColors.border,
    borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, fontSize: FontSize.sm,
    color: WebColors.text, backgroundColor: WebColors.gray50,
  },
  inputNumber: { flexGrow: 0, flexBasis: ComponentSize.button.lg * 2 },
  inputError: { borderColor: WebColors.danger },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: WebColors.dangerLight, borderRadius: BorderRadius.sm,
    borderWidth: BorderWidth.thin, borderColor: WebColors.danger, paddingLeft: Spacing.md,
  },
  errorText: { flex: 1, fontSize: FontSize.sm, color: WebColors.danger, paddingVertical: Spacing.sm },

  collapseHead: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, minHeight: ComponentSize.button.md,
  },
  collapseText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: WebColors.textSecondary },

  // samples
  sample: {
    flexGrow: 0, borderRadius: BorderRadius.sm, overflow: 'hidden',
    borderWidth: BorderWidth.thin, borderColor: WebColors.border, backgroundColor: WebColors.gray50,
  },
  sampleImg: { width: ComponentSize.avatar.xl + Spacing.lg, height: ComponentSize.avatar.lg },
  sampleLabel: { fontSize: FontSize.xs, textAlign: 'center', color: WebColors.text, paddingVertical: Spacing.xs },

  // empty
  empty: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  emptyText: { fontSize: FontSize.body, color: WebColors.textSecondary, textAlign: 'center' },

  // grid + card
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  cardCell: { flexGrow: 1, flexShrink: 1, flexBasis: CARD_BASIS, minWidth: 0 },
  adCard: {
    flex: 1, backgroundColor: WebColors.white, borderRadius: BorderRadius.md, overflow: 'hidden',
    borderWidth: BorderWidth.thin, borderColor: WebColors.border,
  },
  adCardOff: { backgroundColor: WebColors.gray50 },
  thumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: WebColors.grayDark, position: 'relative', overflow: 'hidden' },
  thumbFallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  thumbFallbackText: { fontSize: FontSize.sm, color: WebColors.white },
  orderBadge: {
    position: 'absolute', top: Spacing.sm, left: Spacing.sm,
    minWidth: ComponentSize.icon.lg, height: ComponentSize.icon.lg, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: WebColors.primary,
  },
  orderText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: WebColors.white },
  typeBadge: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs / 2, backgroundColor: WebColors.white,
  },
  typeBadgeVideo: { backgroundColor: WebColors.purpleLight },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: WebColors.text },
  offOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: WebColors.overlay,
    alignItems: 'center', justifyContent: 'center',
  },
  offOverlayText: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: WebColors.white },
  adBody: { padding: Spacing.md, gap: Spacing.sm },
  adTitle: { flex: 1, minWidth: 0, fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: WebColors.text },
  dragHint: { width: ComponentSize.icon.lg, alignItems: 'center' },
  confirmRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap',
    backgroundColor: WebColors.dangerLight, borderRadius: BorderRadius.sm, padding: Spacing.sm,
  },
  confirmText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: WebColors.danger },

  // steps
  steps: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: Spacing.xs },
  step: {
    flexGrow: 1, flexShrink: 1, flexBasis: CARD_BASIS / 2, minWidth: 0, minHeight: ComponentSize.button.md,
    padding: Spacing.md, gap: Spacing.xs, borderRadius: BorderRadius.md,
    borderWidth: BorderWidth.medium, borderColor: WebColors.border, backgroundColor: WebColors.gray50,
  },
  stepSelected: { borderColor: WebColors.primary, backgroundColor: WebColors.primaryLight },
  stepNum: {
    width: ComponentSize.icon.lg, height: ComponentSize.icon.lg, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center', backgroundColor: WebColors.gray300,
  },
  stepNumSelected: { backgroundColor: WebColors.primary },
  stepNumText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: WebColors.text },
  stepNumTextSelected: { color: WebColors.white },
  stepTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: WebColors.text },
  stepDesc: { fontSize: FontSize.xs, color: WebColors.textSecondary },
  stepHint: { fontSize: FontSize.xs, color: WebColors.primary },
  stepArrow: { justifyContent: 'center' },
  stepSettings: { paddingTop: Spacing.xs },

  // preview
  previewBox: {
    width: '100%', aspectRatio: CANVAS_W / CANVAS_H, overflow: 'hidden', position: 'relative',
    borderRadius: BorderRadius.sm, borderWidth: BorderWidth.thin, borderColor: WebColors.border,
    backgroundColor: WebColors.gray100,
  },
});
