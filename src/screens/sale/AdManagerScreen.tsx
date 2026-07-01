/**
 * AdManagerScreen — จัดการสื่อโฆษณาจอที่ 2
 * เพิ่ม/ลบ/เรียงลำดับ รูปภาพ และวิดีโอ
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Alert, Modal, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCustomerDisplayStore } from '../../store/customerDisplayStore';
import { AdMedia, AdMediaType } from '../../types/customerDisplay';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface Props { onBack: () => void }

const SAMPLE_IMAGES = [
  { label: 'ร้านค้า',   uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600' },
  { label: 'โปรโมชั่น', uri: 'https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=600' },
  { label: 'สินค้าสด',  uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600' },
  { label: 'เครื่องดื่ม', uri: 'https://images.unsplash.com/photo-1581456495146-65a71b2c8ca1?w=600' },
];

const DURATION_OPTIONS = [3, 5, 8, 10, 15];

export const AdManagerScreen: React.FC<Props> = ({ onBack }) => {
  const { ads, addAd, removeAd } = useCustomerDisplayStore();
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [adType, setAdType]         = useState<AdMediaType>('image');
  const [uri, setUri]               = useState('');
  const [title, setTitle]           = useState('');
  const [subtitle, setSubtitle]     = useState('');
  const [duration, setDuration]     = useState(5);
  const [previewUri, setPreviewUri] = useState('');

  const handleAdd = () => {
    if (!uri.trim()) { Alert.alert('กรุณากรอก URL'); return; }
    const newAd: AdMedia = {
      id: `ad_${Date.now()}`,
      type: adType,
      uri: uri.trim(),
      duration,
      title: title.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
    };
    addAd(newAd);
    setShowAddModal(false);
    setUri(''); setTitle(''); setSubtitle(''); setDuration(5);
    Alert.alert('✅ เพิ่มสำเร็จ', `เพิ่มสื่อโฆษณา ${adType === 'image' ? 'รูปภาพ' : 'วิดีโอ'} แล้ว`);
  };

  const handleRemove = (id: string, title?: string) => {
    Alert.alert('ลบสื่อโฆษณา', `ต้องการลบ "${title || 'รายการนี้'}"?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => removeAd(id) },
    ]);
  };

  const renderAd = ({ item, index }: { item: AdMedia; index: number }) => (
    <View style={styles.adCard}>
      {/* Thumbnail */}
      <View style={styles.adThumb}>
        {item.type === 'image' ? (
          <Image source={{ uri: item.uri }} style={styles.adThumbImg} resizeMode="cover" />
        ) : (
          <View style={styles.adThumbVideo}>
            <Ionicons name="play-circle" size={36} color={Colors.white} />
            <Text style={styles.adThumbVideoText}>Video</Text>
          </View>
        )}
        {/* Type badge */}
        <View style={[styles.typeBadge, item.type === 'video' && styles.typeBadgeVideo]}>
          <Ionicons
            name={item.type === 'image' ? 'image-outline' : 'videocam-outline'}
            size={11} color={Colors.white}
          />
          <Text style={styles.typeBadgeText}>
            {item.type === 'image' ? 'รูปภาพ' : 'วิดีโอ'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.adInfo}>
        <Text style={styles.adTitle} numberOfLines={1}>
          {item.title || '(ไม่มีชื่อ)'}
        </Text>
        {item.subtitle && (
          <Text style={styles.adSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        )}
        <View style={styles.adMeta}>
          <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.adMetaText}>แสดง {item.duration} วินาที</Text>
          <Text style={styles.adOrder}>ลำดับที่ {index + 1}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.adActions}>
        <TouchableOpacity
          style={styles.adDeleteBtn}
          onPress={() => handleRemove(item.id, item.title)}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>จัดการสื่อโฆษณา</Text>
          <Text style={styles.headerSub}>จอที่ 2 · {ads.length} รายการ</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      {/* Preview hint */}
      <View style={styles.hintBox}>
        <Ionicons name="tv-outline" size={16} color={Colors.primary} />
        <Text style={styles.hintText}>
          สื่อโฆษณาจะแสดงที่จอที่ 2 แบบ Slideshow เมื่อไม่มีลูกค้า
        </Text>
      </View>

      {/* Ad List */}
      <FlatList
        data={ads}
        keyExtractor={(item) => item.id}
        renderItem={renderAd}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>ยังไม่มีสื่อโฆษณา</Text>
            <Text style={styles.emptySub}>กดปุ่ม "เพิ่ม" เพื่อเพิ่มรูปภาพหรือวิดีโอ</Text>
          </View>
        }
      />

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>เพิ่มสื่อโฆษณา</Text>

            {/* Type selector */}
            <View style={styles.typeRow}>
              {(['image', 'video'] as AdMediaType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, adType === t && styles.typeBtnActive]}
                  onPress={() => setAdType(t)}
                >
                  <Ionicons
                    name={t === 'image' ? 'image-outline' : 'videocam-outline'}
                    size={20}
                    color={adType === t ? Colors.white : Colors.textSecondary}
                  />
                  <Text style={[styles.typeBtnText, adType === t && styles.typeBtnTextActive]}>
                    {t === 'image' ? 'รูปภาพ' : 'วิดีโอ'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {/* Sample images (quick pick) */}
              {adType === 'image' && (
                <View style={styles.sampleSection}>
                  <Text style={styles.fieldLabel}>เลือกตัวอย่างด่วน</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.sampleRow}>
                      {SAMPLE_IMAGES.map((s) => (
                        <TouchableOpacity
                          key={s.uri}
                          style={[styles.sampleCard, uri === s.uri && styles.sampleCardActive]}
                          onPress={() => { setUri(s.uri); setPreviewUri(s.uri); setTitle(s.label); }}
                        >
                          <Image source={{ uri: s.uri }} style={styles.sampleImg} />
                          <Text style={styles.sampleLabel}>{s.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* URL Input */}
              <Text style={styles.fieldLabel}>
                {adType === 'image' ? 'URL รูปภาพ' : 'URL วิดีโอ (MP4)'} *
              </Text>
              <View style={styles.urlRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={uri}
                  onChangeText={(v) => { setUri(v); setPreviewUri(''); }}
                  placeholder={adType === 'image'
                    ? 'https://example.com/image.jpg'
                    : 'https://example.com/video.mp4'}
                  placeholderTextColor={Colors.textDisabled}
                  autoCapitalize="none"
                />
                {adType === 'image' && uri && (
                  <TouchableOpacity
                    style={styles.previewBtn}
                    onPress={() => setPreviewUri(uri)}
                  >
                    <Ionicons name="eye-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Image Preview */}
              {previewUri !== '' && (
                <View style={styles.previewBox}>
                  <Image
                    source={{ uri: previewUri }}
                    style={styles.previewImg}
                    resizeMode="cover"
                    onError={() => { Alert.alert('โหลดรูปไม่ได้', 'URL ไม่ถูกต้อง'); setPreviewUri(''); }}
                  />
                </View>
              )}

              {/* Title */}
              <Text style={styles.fieldLabel}>ข้อความหัวเรื่อง</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="เช่น ยินดีต้อนรับ, โปรโมชั่น..."
                placeholderTextColor={Colors.textDisabled}
              />

              {/* Subtitle */}
              <Text style={styles.fieldLabel}>ข้อความรอง</Text>
              <TextInput
                style={styles.input}
                value={subtitle}
                onChangeText={setSubtitle}
                placeholder="เช่น ลด 10% ทุกสินค้า"
                placeholderTextColor={Colors.textDisabled}
              />

              {/* Duration */}
              <Text style={styles.fieldLabel}>ระยะเวลาแสดง (วินาที)</Text>
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.durationBtn, duration === d && styles.durationBtnActive]}
                    onPress={() => setDuration(d)}
                  >
                    <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>
                      {d}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !uri.trim() && styles.confirmBtnDisabled]}
                onPress={handleAdd}
                disabled={!uri.trim()}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
                <Text style={styles.confirmText}>เพิ่มโฆษณา</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h4, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  addBtnText: { ...Typography.label, color: Colors.white },
  hintBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  hintText: { ...Typography.body2, color: Colors.primary, flex: 1 },
  list: { padding: Spacing.md, gap: Spacing.sm },
  adCard: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  adThumb: { width: 90, height: 80, position: 'relative' },
  adThumbImg: { width: '100%', height: '100%' },
  adThumbVideo: {
    width: '100%', height: '100%', backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  adThumbVideoText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  typeBadge: {
    position: 'absolute', top: 4, left: 4,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: Colors.primary, borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  typeBadgeVideo: { backgroundColor: Colors.category1 },
  typeBadgeText: { fontSize: 9, color: Colors.white, fontWeight: '700' },
  adInfo: { flex: 1, padding: Spacing.sm, justifyContent: 'center', gap: 3 },
  adTitle: { ...Typography.label, color: Colors.text },
  adSubtitle: { ...Typography.caption, color: Colors.textSecondary },
  adMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  adMetaText: { ...Typography.caption, color: Colors.textSecondary },
  adOrder: { ...Typography.caption, color: Colors.primary, marginLeft: 'auto', fontWeight: '600' },
  adActions: { padding: Spacing.sm, justifyContent: 'center' },
  adDeleteBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary },
  emptySub: { ...Typography.body2, color: Colors.textDisabled, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, gap: Spacing.md, maxHeight: '90%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xs },
  modalTitle: { ...Typography.h4, color: Colors.text },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100, borderWidth: 1.5, borderColor: Colors.border,
  },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { ...Typography.label, color: Colors.textSecondary },
  typeBtnTextActive: { color: Colors.white, fontWeight: '700' },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary, marginTop: Spacing.xs },
  input: {
    backgroundColor: Colors.gray100, borderRadius: BorderRadius.md, borderWidth: 1.5,
    borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Typography.body1, color: Colors.text,
  },
  urlRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  previewBtn: {
    width: 46, height: 46, backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary,
  },
  previewBox: { borderRadius: BorderRadius.md, overflow: 'hidden', height: 160, marginTop: Spacing.xs },
  previewImg: { width: '100%', height: '100%' },
  sampleSection: { marginBottom: Spacing.sm },
  sampleRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  sampleCard: {
    width: 80, borderRadius: BorderRadius.sm, overflow: 'hidden',
    borderWidth: 2, borderColor: Colors.border,
  },
  sampleCardActive: { borderColor: Colors.primary },
  sampleImg: { width: 80, height: 60 },
  sampleLabel: { ...Typography.caption, color: Colors.text, textAlign: 'center', paddingVertical: 3, backgroundColor: Colors.gray100 },
  durationRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  durationBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.gray100,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  durationBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  durationText: { ...Typography.label, color: Colors.textSecondary },
  durationTextActive: { color: Colors.white, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border },
  cancelText: { ...Typography.button, color: Colors.textSecondary },
  confirmBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md },
  confirmBtnDisabled: { backgroundColor: Colors.gray300 },
  confirmText: { ...Typography.button, color: Colors.white },
});
