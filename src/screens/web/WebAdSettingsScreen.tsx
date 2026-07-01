/**
 * WebAdSettingsScreen — ตั้งค่าโฆษณาจอที่ 2
 * เพิ่ม/ลบ รูปภาพ วิดีโอ ข้อความ ระยะเวลา
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Modal, Image, ScrollView, Switch, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { useCustomerDisplayStore } from '../../store/customerDisplayStore';
import { AdMedia, AdMediaType } from '../../types/customerDisplay';

const DURATION_OPTS = [3, 5, 8, 10, 15, 20];
const SAMPLE_IMAGES = [
  { label: 'ร้านค้า',     uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400' },
  { label: 'โปรโมชั่น',  uri: 'https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=400' },
  { label: 'สินค้าสด',   uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400' },
  { label: 'เครื่องดื่ม', uri: 'https://images.unsplash.com/photo-1581456495146-65a71b2c8ca1?w=400' },
  { label: 'ขนม',        uri: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400' },
  { label: 'ร้านอาหาร',  uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
];

interface Props { onBack: () => void }

export const WebAdSettingsScreen: React.FC<Props> = ({ onBack }) => {
  const { ads, shopName, addAd, removeAd, setShopName } = useCustomerDisplayStore();
  const [showForm, setShowForm]     = useState(false);
  const [shopInput, setShopInput]   = useState(shopName);
  const [previewId, setPreviewId]   = useState<string | null>(null);
  const fileRef = useRef<any>(null); // hidden file input

  // Form state
  const [adType, setAdType]     = useState<AdMediaType>('image');
  const [uri, setUri]           = useState('');
  const [title, setTitle]       = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [duration, setDuration] = useState(5);
  const [preview, setPreview]   = useState('');

  const resetForm = () => { setUri(''); setTitle(''); setSubtitle(''); setDuration(5); setPreview(''); };

  const handleAdd = () => {
    if (!uri.trim()) return;
    addAd({ id: `ad_${Date.now()}`, type: adType, uri: uri.trim(), duration, title: title.trim() || undefined, subtitle: subtitle.trim() || undefined });
    resetForm();
    setShowForm(false);
  };

  const previewAd = ads.find(a => a.id === previewId);

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={WebColors.primary} />
          <Text style={s.backText}>ตั้งค่า</Text>
        </TouchableOpacity>
        <Text style={s.title}>ตั้งค่าจอที่ 2 และโฆษณา</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'chevron-up' : 'add'} size={16} color="#fff" />
          <Text style={s.addBtnText}>{showForm ? 'ซ่อน' : 'เพิ่มโฆษณา'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>

        {/* Shop name */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            <Ionicons name="storefront-outline" size={14} color={WebColors.primary} /> ชื่อร้านบนจอที่ 2
          </Text>
          <View style={s.nameRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={shopInput}
              onChangeText={setShopInput}
              placeholder="ชื่อร้านค้า"
              placeholderTextColor={WebColors.textDisabled}
            />
            <TouchableOpacity style={s.saveNameBtn} onPress={() => setShopName(shopInput.trim() || shopName)}>
              <Text style={s.saveNameText}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add form */}
        {showForm && (
          <View style={s.card}>
            <Text style={s.cardTitle}>
              <Ionicons name="add-circle-outline" size={14} color={WebColors.primary} /> เพิ่มสื่อโฆษณา
            </Text>

            {/* Type toggle */}
            <View style={s.typeRow}>
              {(['image', 'video'] as AdMediaType[]).map(t => (
                <TouchableOpacity key={t} style={[s.typeBtn, adType === t && s.typeBtnActive]} onPress={() => setAdType(t)}>
                  <Ionicons name={t === 'image' ? 'image-outline' : 'videocam-outline'} size={16} color={adType === t ? '#fff' : WebColors.textSecondary} />
                  <Text style={[s.typeBtnText, adType === t && { color: '#fff' }]}>
                    {t === 'image' ? 'รูปภาพ' : 'วิดีโอ (MP4)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick pick */}
            {adType === 'image' && (
              <>
                <Text style={s.fieldLabel}>ตัวอย่างด่วน (กดเลือก)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                    {SAMPLE_IMAGES.map(img => (
                      <TouchableOpacity key={img.uri} style={[s.sampleCard, uri === img.uri && s.sampleCardActive]}
                        onPress={() => { setUri(img.uri); setPreview(img.uri); setTitle(img.label); }}>
                        <Image source={{ uri: img.uri }} style={s.sampleImg} />
                        <Text style={s.sampleLabel}>{img.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            <Text style={s.fieldLabel}>URL {adType === 'image' ? 'รูปภาพ' : 'วิดีโอ'} *</Text>
            <View style={s.uriRow}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={uri}
                onChangeText={v => { setUri(v); setPreview(''); }}
                placeholder={adType === 'image' ? 'https://.../image.jpg' : 'https://.../video.mp4'}
                placeholderTextColor={WebColors.textDisabled}
                autoCapitalize="none"
              />
              {uri.trim() !== '' && (
                <TouchableOpacity style={s.previewBtn} onPress={() => setPreview(uri)}>
                  <Ionicons name="eye-outline" size={16} color={WebColors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* ปุ่มเลือกไฟล์จากเครื่อง (web only) */}
            {Platform.OS === 'web' && (
              <View style={s.filePickRow}>
                {/* hidden file input */}
                <input
                  ref={fileRef}
                  type="file"
                  accept={adType === 'image' ? 'image/*' : 'video/mp4,video/*'}
                  style={{ display: 'none' }}
                  onChange={(e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    setUri(url);
                    setPreview(url);
                    e.target.value = '';
                  }}
                />
                <TouchableOpacity
                  style={s.filePickBtn}
                  onPress={() => (fileRef.current as HTMLInputElement)?.click()}
                >
                  <Ionicons
                    name={adType === 'image' ? 'image-outline' : 'videocam-outline'}
                    size={15} color={WebColors.primary}
                  />
                  <Text style={s.filePickBtnText}>
                    เลือก{adType === 'image' ? 'รูปภาพ' : 'วิดีโอ'}จากเครื่อง
                  </Text>
                </TouchableOpacity>
                <Text style={s.filePickHint}>หรือวาง URL ด้านบน</Text>
              </View>
            )}

            {/* ── Preview เต็มความกว้าง ── */}
            {preview !== '' && adType === 'image' && (
              <View style={s.previewWrap}>
                <Image
                  source={{ uri: preview }}
                  style={s.previewImg}
                  resizeMode="contain"
                  onError={() => setPreview('')}
                />
              </View>
            )}
            {preview !== '' && adType === 'video' && Platform.OS === 'web' && (
              <View style={s.previewWrap}>
                {/* @ts-ignore — video tag บน web */}
                <video
                  src={preview}
                  controls
                  style={{
                    width: '100%',
                    maxHeight: 320,
                    borderRadius: 8,
                    backgroundColor: '#000',
                    display: 'block',
                  }}
                  onError={() => setPreview('')}
                />
              </View>
            )}

            <View style={s.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>ชื่อ/หัวเรื่อง</Text>
                <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="เช่น โปรโมชั่นพิเศษ" placeholderTextColor={WebColors.textDisabled} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>คำบรรยาย</Text>
                <TextInput style={s.input} value={subtitle} onChangeText={setSubtitle} placeholder="เช่น ลด 10% ทุกสินค้า" placeholderTextColor={WebColors.textDisabled} />
              </View>
            </View>

            <Text style={s.fieldLabel}>ระยะเวลาแสดง (วินาที)</Text>
            <View style={s.durationRow}>
              {DURATION_OPTS.map(d => (
                <TouchableOpacity key={d} style={[s.durationBtn, duration === d && s.durationBtnActive]} onPress={() => setDuration(d)}>
                  <Text style={[s.durationText, duration === d && { color: '#fff', fontWeight: '700' }]}>{d}s</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[s.confirmBtn, !uri.trim() && s.confirmBtnDisabled]} onPress={handleAdd} disabled={!uri.trim()}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={s.confirmBtnText}>บันทึกโฆษณา</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ads list */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.cardTitle}>
              <Ionicons name="images-outline" size={14} color={WebColors.primary} /> รายการโฆษณา ({ads.length})
            </Text>
          </View>

          {ads.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="images-outline" size={40} color={WebColors.border} />
              <Text style={s.emptyText}>ยังไม่มีโฆษณา กดเพิ่มด้านบน</Text>
            </View>
          ) : (
            <View style={s.adGrid}>
              {ads.map((ad, idx) => (
                <View key={ad.id} style={s.adCard}>
                  {/* Thumbnail */}
                  <View style={s.adThumb}>
                    {ad.type === 'image' ? (
                      <Image source={{ uri: ad.uri }} style={s.adThumbImg} resizeMode="cover" />
                    ) : (
                      <View style={s.adThumbVideo}>
                        <Ionicons name="play-circle" size={28} color="#fff" />
                      </View>
                    )}
                    <View style={[s.typeBadge, ad.type === 'video' && { backgroundColor: WebColors.purple }]}>
                      <Text style={s.typeBadgeText}>{ad.type === 'image' ? 'รูป' : 'วิดีโอ'}</Text>
                    </View>
                    <View style={s.orderBadge}><Text style={s.orderText}>{idx + 1}</Text></View>
                  </View>
                  {/* Info */}
                  <View style={s.adInfo}>
                    <Text style={s.adTitle} numberOfLines={1}>{ad.title || '(ไม่มีชื่อ)'}</Text>
                    {ad.subtitle && <Text style={s.adSub} numberOfLines={1}>{ad.subtitle}</Text>}
                    <View style={s.adMeta}>
                      <Ionicons name="time-outline" size={11} color={WebColors.textSecondary} />
                      <Text style={s.adMetaText}>{ad.duration}s · ลำดับ {idx + 1}</Text>
                    </View>
                  </View>
                  {/* Actions */}
                  <View style={s.adActions}>
                    <TouchableOpacity style={s.adActionBtn} onPress={() => setPreviewId(ad.id)}>
                      <Ionicons name="eye-outline" size={14} color={WebColors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.adActionBtn, { backgroundColor: WebColors.dangerLight }]} onPress={() => removeAd(ad.id)}>
                      <Ionicons name="trash-outline" size={14} color={WebColors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Display modes info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            <Ionicons name="layers-outline" size={14} color={WebColors.primary} /> โหมดแสดงผลจอที่ 2
          </Text>
          <View style={s.modeGrid}>
            {[
              { icon: 'images-outline',          label: 'Slideshow โฆษณา', desc: 'เมื่อไม่มีลูกค้า',         color: WebColors.primary },
              { icon: 'cart-outline',             label: 'รายการสินค้า',   desc: 'ระหว่างเลือกสินค้า',       color: WebColors.success },
              { icon: 'card-outline',             label: 'รอชำระเงิน',    desc: 'แสดงยอดที่ต้องชำระ',        color: WebColors.warning },
              { icon: 'checkmark-circle-outline', label: 'ชำระสำเร็จ',    desc: 'ขอบคุณลูกค้า + เงินทอน',   color: WebColors.success },
            ].map((m, i) => (
              <View key={i} style={[s.modeCard, { borderTopColor: m.color }]}>
                <Ionicons name={m.icon as any} size={22} color={m.color} />
                <Text style={[s.modeLabel, { color: m.color }]}>{m.label}</Text>
                <Text style={s.modeDesc}>{m.desc}</Text>
              </View>
            ))}
          </View>
          <View style={s.hintBox}>
            <Ionicons name="information-circle-outline" size={14} color={WebColors.primary} />
            <Text style={s.hintText}>
              เปิดจอที่ 2 ได้จากปุ่ม "จอ 2" ในหน้าขายสินค้า แล้วเลือกโหมดที่ต้องการแสดง
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Preview Modal */}
      <Modal visible={!!previewId} transparent animationType="fade">
        <View style={s.previewOverlay}>
          <View style={s.previewSheet}>
            <Text style={s.previewTitle}>ตัวอย่างโฆษณา</Text>
            {previewAd?.type === 'image' && (
              <Image source={{ uri: previewAd.uri }} style={s.previewFullImg} resizeMode="cover" />
            )}
            {previewAd && (
              <View style={{ gap: 4 }}>
                {previewAd.title    && <Text style={s.previewAdTitle}>{previewAd.title}</Text>}
                {previewAd.subtitle && <Text style={s.previewAdSub}>{previewAd.subtitle}</Text>}
                <Text style={s.previewAdMeta}>ระยะเวลา: {previewAd.duration} วินาที</Text>
              </View>
            )}
            <TouchableOpacity style={s.closePreviewBtn} onPress={() => setPreviewId(null)}>
              <Text style={s.closePreviewText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 13, color: WebColors.primary },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: WebColors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: WebColors.border },
  cardTitle: { fontSize: 13, fontWeight: '700', color: WebColors.primary },
  nameRow: { flexDirection: 'row', gap: 8 },
  input: { borderWidth: 1.5, borderColor: WebColors.border, borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 13, color: WebColors.text, backgroundColor: WebColors.gray50 },
  saveNameBtn: { backgroundColor: WebColors.primary, borderRadius: 8, paddingHorizontal: 16, height: 40, alignItems: 'center', justifyContent: 'center' },
  saveNameText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, backgroundColor: WebColors.gray100, borderWidth: 1.5, borderColor: WebColors.border },
  typeBtnActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: WebColors.textSecondary },
  fieldLabel: { fontSize: 15, fontWeight: '600', color: WebColors.textSecondary, textTransform: 'uppercase' },
  uriRow: { flexDirection: 'row', gap: 8 },
  filePickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: WebColors.primaryLight, borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: WebColors.primary + '40',
  },
  filePickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: WebColors.primary, borderRadius: 7,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  filePickBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  filePickHint: { fontSize: 15, color: WebColors.textSecondary },
  previewBtn: { width: 40, height: 40, backgroundColor: WebColors.primaryLight, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: WebColors.primary },
  previewWrap: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden' as any,
    backgroundColor: WebColors.grayDark,
    borderWidth: 1,
    borderColor: WebColors.border,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImg: { width: '100%', height: 280, borderRadius: 0 },
  formRow: { flexDirection: 'row', gap: 12 },
  durationRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  durationBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: WebColors.gray100, borderWidth: 1.5, borderColor: WebColors.border },
  durationBtnActive: { backgroundColor: WebColors.primary, borderColor: WebColors.primary },
  durationText: { fontSize: 15, color: WebColors.textSecondary },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: WebColors.success, borderRadius: 8, paddingVertical: 11 },
  confirmBtnDisabled: { backgroundColor: WebColors.gray300 },
  confirmBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  sampleCard: { width: 80, borderRadius: 8, overflow: 'hidden' as any, borderWidth: 2, borderColor: WebColors.border },
  sampleCardActive: { borderColor: WebColors.primary },
  sampleImg: { width: 80, height: 60 },
  sampleLabel: { fontSize: 14, textAlign: 'center', backgroundColor: WebColors.gray50, paddingVertical: 3, color: WebColors.text },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13, color: WebColors.textSecondary },
  adGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  adCard: {
    width: '48%',
    backgroundColor: WebColors.white,
    borderRadius: 10, overflow: 'hidden' as any,
    borderWidth: 1, borderColor: WebColors.border,
  },
  adThumb: {
    width: '100%',
    aspectRatio: 1,   // สี่เหลี่ยมจตุรัส
    position: 'relative', backgroundColor: '#000',
  },
  adThumbImg: { width: '100%', height: '100%', resizeMode: 'cover' as any },
  adThumbVideo: { width: '100%', height: '100%', backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  typeBadge: { position: 'absolute', top: 5, left: 5, backgroundColor: WebColors.primary, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  typeBadgeText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  orderBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  orderText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  adInfo: { padding: 8, gap: 3 },
  adTitle: { fontSize: 15, fontWeight: '600', color: WebColors.text },
  adSub: { fontSize: 15, color: WebColors.textSecondary },
  adMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  adMetaText: { fontSize: 14, color: WebColors.textSecondary },
  adActions: { flexDirection: 'row', gap: 6, padding: 8, borderTopWidth: 1, borderTopColor: WebColors.border },
  adActionBtn: { flex: 1, height: 28, borderRadius: 6, backgroundColor: WebColors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modeCard: { width: '47%', flexGrow: 1, backgroundColor: WebColors.gray50, borderRadius: 10, padding: 12, alignItems: 'center', gap: 6, borderTopWidth: 3, borderWidth: 1, borderColor: WebColors.border },
  modeLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  modeDesc: { fontSize: 15, color: WebColors.textSecondary, textAlign: 'center' },
  hintBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: WebColors.primaryLight, borderRadius: 8, padding: 10 },
  hintText: { fontSize: 15, color: WebColors.primary, flex: 1, lineHeight: 18 },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  previewSheet: { backgroundColor: '#fff', borderRadius: 14, padding: 20, width: 400, gap: 12 },
  previewTitle: { fontSize: 15, fontWeight: '700', color: WebColors.text },
  previewFullImg: { width: '100%', height: 200, borderRadius: 8 },
  previewAdTitle: { fontSize: 14, fontWeight: '700', color: WebColors.text },
  previewAdSub: { fontSize: 13, color: WebColors.textSecondary },
  previewAdMeta: { fontSize: 15, color: WebColors.textDisabled },
  closePreviewBtn: { backgroundColor: WebColors.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  closePreviewText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
