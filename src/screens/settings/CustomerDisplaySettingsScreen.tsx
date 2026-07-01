/**
 * CustomerDisplaySettingsScreen — ตั้งค่าจอที่ 2
 * SCR-SET-011
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, TextInput, Alert, Image, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCustomerDisplayStore } from '../../store/customerDisplayStore';
import { AdMedia, AdMediaType } from '../../types/customerDisplay';
import { Colors } from '../../constants/colors';
import { Typography, FontSize } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props { onBack: () => void }

const DURATION_OPTIONS = [3, 5, 8, 10, 15, 20];
const SAMPLE_IMAGES = [
  { label: 'ร้านค้า',     uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600' },
  { label: 'โปรโมชั่น',  uri: 'https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=600' },
  { label: 'สินค้าสด',   uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600' },
  { label: 'เครื่องดื่ม', uri: 'https://images.unsplash.com/photo-1581456495146-65a71b2c8ca1?w=600' },
  { label: 'ขนม',        uri: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600' },
];

type Tab = 'general' | 'ads' | 'preview';

export const CustomerDisplaySettingsScreen: React.FC<Props> = ({ onBack }) => {
  const { ads, shopName, addAd, removeAd, setShopName } = useCustomerDisplayStore();

  const [tab, setTab] = useState<Tab>('general');

  // General settings
  const [nameInput, setNameInput]       = useState(shopName);
  const [showIdleAd, setShowIdleAd]     = useState(true);
  const [showDiscount, setShowDiscount] = useState(true);
  const [showVAT, setShowVAT]           = useState(true);
  const [fontSize, setFontSize]         = useState<'normal' | 'large'>('normal');

  // Add ad form
  const [adType, setAdType]     = useState<AdMediaType>('image');
  const [uri, setUri]           = useState('');
  const [adTitle, setAdTitle]   = useState('');
  const [adSub, setAdSub]       = useState('');
  const [duration, setDuration] = useState(5);
  const [preview, setPreview]   = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSaveName = () => {
    setShopName(nameInput.trim() || shopName);
    Alert.alert('✅ บันทึกแล้ว');
  };

  const handleAddAd = () => {
    if (!uri.trim()) { Alert.alert('กรุณากรอก URL'); return; }
    addAd({
      id: `ad_${Date.now()}`,
      type: adType,
      uri: uri.trim(),
      duration,
      title: adTitle.trim() || undefined,
      subtitle: adSub.trim() || undefined,
    });
    setUri(''); setAdTitle(''); setAdSub(''); setPreview(''); setShowForm(false);
    Alert.alert('✅ เพิ่มโฆษณาสำเร็จ');
  };

  const handleRemoveAd = (id: string, title?: string) =>
    Alert.alert('ลบโฆษณา', `ลบ "${title || 'รายการนี้'}"?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => removeAd(id) },
    ]);

  // ─── Sub-renders ──────────────────────────────────────────────────────────

  const GeneralTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>

      {/* Shop name */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="storefront-outline" size={14} color={Colors.primary} /> ข้อมูลร้านค้าบนจอที่ 2
        </Text>
        <Text style={styles.fieldLabel}>ชื่อร้านค้า</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="กรอกชื่อร้าน"
            placeholderTextColor={Colors.textDisabled}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
            <Text style={styles.saveBtnText}>บันทึก</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Display options */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="eye-outline" size={14} color={Colors.primary} /> ตัวเลือกการแสดงผล
        </Text>
        {[
          { label: 'แสดงสื่อโฆษณาเมื่อไม่มีลูกค้า', sub: 'Slideshow รูป/วิดีโอ', value: showIdleAd, set: setShowIdleAd },
          { label: 'แสดงส่วนลด', sub: 'แสดงยอดส่วนลดในบิล', value: showDiscount, set: setShowDiscount },
          { label: 'แสดง VAT', sub: 'แสดงยอด VAT แยกต่างหาก', value: showVAT, set: setShowVAT },
        ].map((opt, i) => (
          <View key={i} style={[styles.switchRow, i > 0 && styles.switchRowBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>{opt.label}</Text>
              <Text style={styles.switchSub}>{opt.sub}</Text>
            </View>
            <Switch
              value={opt.value}
              onValueChange={opt.set}
              trackColor={{ true: Colors.primary, false: Colors.gray200 }}
              thumbColor={Colors.white}
            />
          </View>
        ))}
      </View>

      {/* Font size */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="text-outline" size={14} color={Colors.primary} /> ขนาดตัวอักษร
        </Text>
        <View style={styles.fontSizeRow}>
          {([['normal','ปกติ'],['large','ใหญ่']] as const).map(([k, lbl]) => (
            <TouchableOpacity
              key={k}
              style={[styles.fontBtn, fontSize === k && styles.fontBtnActive]}
              onPress={() => setFontSize(k)}
            >
              <Text style={[styles.fontBtnText, { fontSize: k === 'large' ? 16 : 13 }, fontSize === k && styles.fontBtnTextActive]}>
                Aa — {lbl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Mode preview cards */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="layers-outline" size={14} color={Colors.primary} /> โหมดการแสดงผล
        </Text>
        <View style={styles.modeGrid}>
          {[
            { mode: 'idle',            icon: 'images-outline',         label: 'Slideshow โฆษณา',  color: Colors.primary,  desc: 'เมื่อไม่มีลูกค้า' },
            { mode: 'cart',            icon: 'cart-outline',            label: 'รายการสินค้า',    color: Colors.success,  desc: 'ระหว่างเลือกสินค้า' },
            { mode: 'payment_pending', icon: 'card-outline',            label: 'รอชำระเงิน',      color: Colors.warning,  desc: 'แสดงยอดรวม' },
            { mode: 'payment_success', icon: 'checkmark-circle-outline',label: 'ชำระสำเร็จ',     color: Colors.success,  desc: 'ขอบคุณลูกค้า' },
          ].map((m) => (
            <View key={m.mode} style={[styles.modeCard, { borderTopColor: m.color }]}>
              <Ionicons name={m.icon as any} size={24} color={m.color} />
              <Text style={[styles.modeLabel, { color: m.color }]}>{m.label}</Text>
              <Text style={styles.modeDesc}>{m.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );

  const AdsTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>

      {/* Add button */}
      <TouchableOpacity style={styles.addAdBtn} onPress={() => setShowForm(!showForm)}>
        <Ionicons name={showForm ? 'chevron-up' : 'add-circle-outline'} size={20} color={Colors.white} />
        <Text style={styles.addAdBtnText}>{showForm ? 'ซ่อนฟอร์ม' : 'เพิ่มสื่อโฆษณาใหม่'}</Text>
      </TouchableOpacity>

      {/* Add form */}
      {showForm && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="add-outline" size={14} color={Colors.primary} /> ข้อมูลสื่อโฆษณา
          </Text>

          {/* Type */}
          <View style={styles.typeRow}>
            {(['image','video'] as AdMediaType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, adType === t && styles.typeBtnActive]}
                onPress={() => setAdType(t)}
              >
                <Ionicons name={t === 'image' ? 'image-outline' : 'videocam-outline'} size={18}
                  color={adType === t ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.typeBtnText, adType === t && { color: Colors.white }]}>
                  {t === 'image' ? 'รูปภาพ' : 'วิดีโอ (MP4)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick pick */}
          {adType === 'image' && (
            <>
              <Text style={styles.fieldLabel}>ตัวอย่างด่วน (กดเลือก)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sampleRow}>
                  {SAMPLE_IMAGES.map((s) => (
                    <TouchableOpacity
                      key={s.uri}
                      style={[styles.sampleCard, uri === s.uri && styles.sampleCardActive]}
                      onPress={() => { setUri(s.uri); setPreview(s.uri); setAdTitle(s.label); }}
                    >
                      <Image source={{ uri: s.uri }} style={styles.sampleImg} />
                      <Text style={styles.sampleLabel}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          <Text style={styles.fieldLabel}>URL {adType === 'image' ? 'รูปภาพ' : 'วิดีโอ (MP4)'} *</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={uri}
              onChangeText={(v) => { setUri(v); setPreview(''); }}
              placeholder={adType === 'image' ? 'https://.../image.jpg' : 'https://.../video.mp4'}
              placeholderTextColor={Colors.textDisabled}
              autoCapitalize="none"
            />
            {adType === 'image' && uri.trim() !== '' && (
              <TouchableOpacity style={styles.previewBtn} onPress={() => setPreview(uri)}>
                <Ionicons name="eye-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Preview */}
          {preview !== '' && (
            <Image
              source={{ uri: preview }}
              style={styles.previewImg}
              resizeMode="cover"
              onError={() => { Alert.alert('URL ไม่ถูกต้อง'); setPreview(''); }}
            />
          )}

          <Text style={styles.fieldLabel}>ชื่อ / หัวเรื่อง</Text>
          <TextInput
            style={styles.input}
            value={adTitle}
            onChangeText={setAdTitle}
            placeholder="เช่น ยินดีต้อนรับ, โปรโมชั่น..."
            placeholderTextColor={Colors.textDisabled}
          />

          <Text style={styles.fieldLabel}>คำบรรยาย</Text>
          <TextInput
            style={styles.input}
            value={adSub}
            onChangeText={setAdSub}
            placeholder="เช่น ลด 10% ทุกสินค้า"
            placeholderTextColor={Colors.textDisabled}
          />

          <Text style={styles.fieldLabel}>ระยะเวลาแสดง (วินาที)</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.durationBtn, duration === d && styles.durationBtnActive]}
                onPress={() => setDuration(d)}
              >
                <Text style={[styles.durationText, duration === d && { color: Colors.white, fontWeight: '700' }]}>{d}s</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, !uri.trim() && styles.confirmBtnDisabled]}
            onPress={handleAddAd}
            disabled={!uri.trim()}
          >
            <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
            <Text style={styles.confirmBtnText}>บันทึกโฆษณา</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Ads list */}
      <Text style={styles.listHeader}>รายการสื่อโฆษณา ({ads.length})</Text>
      {ads.length === 0 && (
        <View style={styles.emptyAds}>
          <Ionicons name="images-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyText}>ยังไม่มีโฆษณา</Text>
        </View>
      )}
      {ads.map((ad, i) => (
        <View key={ad.id} style={styles.adCard}>
          {/* Thumbnail */}
          <View style={styles.adThumb}>
            {ad.type === 'image' ? (
              <Image source={{ uri: ad.uri }} style={styles.adThumbImg} resizeMode="cover" />
            ) : (
              <View style={styles.adThumbVideo}>
                <Ionicons name="play-circle" size={28} color={Colors.white} />
              </View>
            )}
            <View style={[styles.typeBadge, ad.type === 'video' && { backgroundColor: Colors.category1 }]}>
              <Ionicons name={ad.type === 'image' ? 'image-outline' : 'videocam-outline'} size={10} color={Colors.white} />
              <Text style={styles.typeBadgeText}>{ad.type === 'image' ? 'รูป' : 'วิดีโอ'}</Text>
            </View>
          </View>
          {/* Info */}
          <View style={styles.adInfo}>
            <Text style={styles.adTitle} numberOfLines={1}>{ad.title || '(ไม่มีชื่อ)'}</Text>
            {ad.subtitle && <Text style={styles.adSub} numberOfLines={1}>{ad.subtitle}</Text>}
            <View style={styles.adMeta}>
              <Ionicons name="time-outline" size={11} color={Colors.textSecondary} />
              <Text style={styles.adMetaText}>{ad.duration}s · ลำดับ {i + 1}</Text>
            </View>
          </View>
          {/* Delete */}
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRemoveAd(ad.id, ad.title)}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );

  const PreviewTab = () => {
    const [previewMode, setPreviewMode] = useState<'idle'|'cart'|'payment_pending'|'payment_success'>('idle');
    const { setMode } = useCustomerDisplayStore();

    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="eye-outline" size={14} color={Colors.primary} /> ทดสอบโหมดจอที่ 2
          </Text>
          <Text style={styles.previewHint}>
            กดปุ่มด้านล่างเพื่อตั้งค่าโหมดจอที่ 2 แล้วเปิดจอที่ 2 จากปุ่ม "จอ 2" ในหน้าขาย
          </Text>
          <View style={styles.modeButtons}>
            {[
              { mode: 'idle'            as const, label: 'โฆษณา Slideshow',  icon: 'images-outline',          color: Colors.primary  },
              { mode: 'cart'            as const, label: 'รายการสินค้า',     icon: 'cart-outline',            color: Colors.success  },
              { mode: 'payment_pending' as const, label: 'รอชำระเงิน',       icon: 'card-outline',            color: Colors.warning  },
              { mode: 'payment_success' as const, label: 'ชำระสำเร็จ',      icon: 'checkmark-circle-outline', color: Colors.success  },
            ].map((m) => (
              <TouchableOpacity
                key={m.mode}
                style={[styles.modeBtn, previewMode === m.mode && { borderColor: m.color, borderWidth: 2 }, { borderTopColor: m.color }]}
                onPress={() => { setPreviewMode(m.mode); setMode(m.mode); }}
              >
                {previewMode === m.mode && (
                  <View style={[styles.modeCheck, { backgroundColor: m.color }]}>
                    <Ionicons name="checkmark" size={11} color={Colors.white} />
                  </View>
                )}
                <Ionicons name={m.icon as any} size={28} color={m.color} />
                <Text style={[styles.modeBtnLabel, { color: m.color }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.activeModeBanner}>
            <Ionicons name="tv-outline" size={16} color={Colors.primary} />
            <Text style={styles.activeModeText}>
              โหมดปัจจุบัน: <Text style={{ fontWeight: '700' }}>
                {previewMode === 'idle' ? 'Slideshow โฆษณา'
                  : previewMode === 'cart' ? 'รายการสินค้า'
                  : previewMode === 'payment_pending' ? 'รอชำระเงิน'
                  : 'ชำระสำเร็จ'}
              </Text>
            </Text>
          </View>
        </View>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ตั้งค่าจอที่ 2</Text>
          <Text style={styles.headerSub}>Customer Display · {ads.length} โฆษณา</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {([
          ['general', 'settings-outline', 'ทั่วไป'],
          ['ads',     'images-outline',   'โฆษณา'],
          ['preview', 'eye-outline',      'ทดสอบ'],
        ] as const).map(([k, icon, lbl]) => (
          <TouchableOpacity
            key={k}
            style={[styles.tabItem, tab === k && styles.tabItemActive]}
            onPress={() => setTab(k)}
          >
            <Ionicons name={icon as any} size={16} color={tab === k ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.tabLabel, tab === k && styles.tabLabelActive]}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {tab === 'general' && <GeneralTab />}
      {tab === 'ads'     && <AdsTab />}
      {tab === 'preview' && <PreviewTab />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.md, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: Colors.primary },
  tabLabel: { ...Typography.label, color: Colors.textSecondary, fontSize: FontSize.sm },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
  tabContent: { padding: Spacing.md, gap: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
  cardTitle: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary },
  input: { backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.body1, color: Colors.text },
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
  saveBtnText: { ...Typography.label, color: Colors.white },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  switchRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  switchLabel: { ...Typography.label, color: Colors.text },
  switchSub: { ...Typography.caption, color: Colors.textSecondary },
  fontSizeRow: { flexDirection: 'row', gap: Spacing.sm },
  fontBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.backgroundSecondary, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  fontBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  fontBtnText: { color: Colors.textSecondary },
  fontBtnTextActive: { color: Colors.white, fontWeight: '700' },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  modeCard: { width: '47%', flexGrow: 1, backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', gap: 4, borderTopWidth: 3 },
  modeLabel: { ...Typography.caption, fontWeight: '700' },
  modeDesc: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  // Ads
  addAdBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  addAdBtnText: { ...Typography.button, color: Colors.white },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.backgroundSecondary, borderWidth: 1.5, borderColor: Colors.border },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { ...Typography.label, color: Colors.textSecondary },
  sampleRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  sampleCard: { width: 80, borderRadius: BorderRadius.sm, overflow: 'hidden', borderWidth: 2, borderColor: Colors.border },
  sampleCardActive: { borderColor: Colors.primary },
  sampleImg: { width: 80, height: 60 },
  sampleLabel: { ...Typography.caption, textAlign: 'center', backgroundColor: Colors.backgroundSecondary, paddingVertical: 2 },
  previewBtn: { width: 46, height: 46, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary },
  previewImg: { width: '100%', height: 160, borderRadius: BorderRadius.md, marginTop: Spacing.xs },
  durationRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  durationBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.backgroundSecondary, borderWidth: 1.5, borderColor: Colors.border },
  durationBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  durationText: { ...Typography.label, color: Colors.textSecondary },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.success, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  confirmBtnDisabled: { backgroundColor: Colors.gray300 },
  confirmBtnText: { ...Typography.button, color: Colors.white },
  listHeader: { ...Typography.label, color: Colors.textSecondary },
  emptyAds: { alignItems: 'center', paddingVertical: 40, gap: Spacing.sm },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
  adCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  adThumb: { width: 80, height: 70, position: 'relative' },
  adThumbImg: { width: '100%', height: '100%' },
  adThumbVideo: { width: '100%', height: '100%', backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  typeBadge: { position: 'absolute', top: 3, left: 3, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.primary, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  typeBadgeText: { fontSize: FontSize.micro, color: Colors.white, fontWeight: '700' },
  adInfo: { flex: 1, padding: Spacing.sm, justifyContent: 'center', gap: 2 },
  adTitle: { ...Typography.label, color: Colors.text },
  adSub: { ...Typography.caption, color: Colors.textSecondary },
  adMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  adMetaText: { ...Typography.caption, color: Colors.textSecondary },
  deleteBtn: { width: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dangerLight },
  // Preview tab
  previewHint: { ...Typography.body2, color: Colors.textSecondary },
  modeButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  modeBtn: { width: '47%', flexGrow: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, borderTopWidth: 4, borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  modeCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeBtnLabel: { ...Typography.label, textAlign: 'center', fontWeight: '700' },
  activeModeBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md, padding: Spacing.md },
  activeModeText: { ...Typography.body2, color: Colors.primary },
});
