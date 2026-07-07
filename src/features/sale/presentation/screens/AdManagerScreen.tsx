/**
 * AdManagerScreen — จัดการสื่อโฆษณาจอที่ 2
 * เพิ่ม/ลบ/เรียงลำดับ รูปภาพ และวิดีโอ
 */
import React, { useState } from 'react';
import { View, TouchableOpacity, FlatList, Modal, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { useCustomerDisplayStore } from '@/features/customer-display/application/stores/customerDisplayStore';
import { AdMedia, AdMediaType } from '@/features/customer-display/domain/customerDisplay';
import { cn } from '@/shared/lib/cn';
import { Text, TextInput } from '@/shared/tw/index';

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

  // Modal states
  const [showUrlError, setShowUrlError] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState<string | undefined>(undefined);
  const [showImageError, setShowImageError] = useState(false);

  const handleAdd = () => {
    if (!uri.trim()) { setShowUrlError(true); return; }
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
    setShowAddSuccess(true);
  };

  const handleRemove = (id: string, title?: string) => {
    setDeleteTarget(id);
    setDeleteTargetTitle(title);
    setShowDeleteConfirm(true);
  };

  const renderAd = ({ item, index }: { item: AdMedia; index: number }) => (
    <View className={cn('flex-row bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm')}>
      {/* Thumbnail */}
      <View className={cn('w-[90px] h-20 relative')}>
        {item.type === 'image' ? (
          <Image source={{ uri: item.uri }} className={cn('w-full h-full')} resizeMode="cover" />
        ) : (
          <View className={cn('w-full h-full bg-[#f6f7fb] items-center justify-center gap-0.5')}>
            <Ionicons name="play-circle" size={36} color="#fafafa" />
            <Text className={cn('text-[10px] text-white font-bold')}>Video</Text>
          </View>
        )}
        {/* Type badge */}
        <View className={cn('absolute top-1 left-1 flex-row items-center gap-0.5 bg-rose-500 rounded px-1 py-0.5')}>
          <Ionicons
            name={item.type === 'image' ? 'image-outline' : 'videocam-outline'}
            size={11} color="#fafafa"
          />
          <Text className={cn('text-[9px] text-white font-bold')}>
            {item.type === 'image' ? 'รูปภาพ' : 'วิดีโอ'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View className={cn('flex-1 p-2 justify-center gap-[3px]')}>
        <Text className={cn('text-xs font-bold text-slate-950')} numberOfLines={1}>
          {item.title || '(ไม่มีชื่อ)'}
        </Text>
        {item.subtitle && (
          <Text className={cn('text-xs text-slate-500 font-medium')} numberOfLines={1}>{item.subtitle}</Text>
        )}
        <View className={cn('flex-row items-center gap-1 mt-0.5')}>
          <Ionicons name="time-outline" size={12} color="#57534e" />
          <Text className={cn('text-xs text-slate-500 font-medium')}>แสดง {item.duration} วินาที</Text>
          <Text className={cn('text-xs text-rose-600 ml-auto font-bold')}>ลำดับที่ {index + 1}</Text>
        </View>
      </View>

      {/* Actions */}
      <View className={cn('p-2 justify-center')}>
        <TouchableOpacity
          className={cn('w-9 h-9 rounded-lg bg-rose-50 items-center justify-center')}
          onPress={() => handleRemove(item.id, item.title)}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className={cn('flex-1 bg-rose-50')} edges={['top']}>
      {/* Header */}
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>จัดการสื่อโฆษณา</Text>
          <Text className={cn('text-xs text-white/70 font-medium')}>จอที่ 2 · {ads.length} รายการ</Text>
        </View>
        <TouchableOpacity className={cn('flex-row items-center gap-1 bg-white/20 rounded-xl px-2 py-1 border border-white/40')} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={20} color="#fafafa" />
          <Text className={cn('text-xs font-bold text-white')}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      {/* Preview hint */}
      <View className={cn('flex-row items-center gap-2 bg-rose-50 px-4 py-2 border-b border-slate-200')}>
        <Ionicons name="tv-outline" size={16} color="#f87171" />
        <Text className={cn('text-base text-rose-600 flex-1 font-medium')}>
          สื่อโฆษณาจะแสดงที่จอที่ 2 แบบ Slideshow เมื่อไม่มีลูกค้า
        </Text>
      </View>

      {/* Ad List */}
      <FlatList
        data={ads}
        keyExtractor={(item) => item.id}
        renderItem={renderAd}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className={cn('items-center py-20 gap-3')}>
            <Ionicons name="images-outline" size={64} color="#e7e5e4" />
            <Text className={cn('text-xl font-extrabold text-slate-500')}>ยังไม่มีสื่อโฆษณา</Text>
            <Text className={cn('text-base text-slate-500 text-center font-medium')}>กดปุ่ม "เพิ่ม" เพื่อเพิ่มรูปภาพหรือวิดีโอ</Text>
          </View>
        }
      />

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View className={cn('flex-1 bg-black/40 justify-end')}>
          <View className={cn('bg-white rounded-t-3xl p-4 gap-3 max-h-[90%]')}>
            <View className={cn('w-10 h-1 bg-gray-200 rounded-sm self-center mb-1')} />
            <Text className={cn('text-lg font-extrabold text-slate-950')}>เพิ่มสื่อโฆษณา</Text>

            {/* Type selector */}
            <View className={cn('flex-row gap-2')}>
              {(['image', 'video'] as AdMediaType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  className={cn('flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-neutral-100 border-[1.5px] border-slate-200', adType === t && 'bg-rose-500 border-rose-500')}
                  onPress={() => setAdType(t)}
                >
                  <Ionicons
                    name={t === 'image' ? 'image-outline' : 'videocam-outline'}
                    size={20}
                    color={adType === t ? '#fafafa' : '#57534e'}
                  />
                  <Text className={cn('text-xs font-bold text-slate-500', adType === t && 'text-white font-bold')}>
                    {t === 'image' ? 'รูปภาพ' : 'วิดีโอ'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {/* Sample images (quick pick) */}
              {adType === 'image' && (
                <View className={cn('mb-2')}>
                  <Text className={cn('text-xs font-bold text-slate-500 mt-1')}>เลือกตัวอย่างด่วน</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className={cn('flex-row gap-2 py-1')}>
                      {SAMPLE_IMAGES.map((s) => (
                        <TouchableOpacity
                          key={s.uri}
                          className={cn('w-20 rounded-lg overflow-hidden border-2 border-slate-200', uri === s.uri && 'border-rose-500')}
                          onPress={() => { setUri(s.uri); setPreviewUri(s.uri); setTitle(s.label); }}
                        >
                          <Image source={{ uri: s.uri }} className={cn('w-20 h-[60px]')} />
                          <Text className={cn('text-xs text-slate-950 text-center py-[3px] bg-neutral-100 font-medium')}>{s.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* URL Input */}
              <Text className={cn('text-xs font-bold text-slate-500 mt-1')}>
                {adType === 'image' ? 'URL รูปภาพ' : 'URL วิดีโอ (MP4)'} *
              </Text>
              <View className={cn('flex-row gap-2 items-center')}>
                <TextInput
                  className={cn('flex-1 bg-neutral-100 rounded-xl border-[1.5px] border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950')}
                  value={uri}
                  onChangeText={(v) => { setUri(v); setPreviewUri(''); }}
                  placeholder={adType === 'image'
                    ? 'https://example.com/image.jpg'
                    : 'https://example.com/video.mp4'}
                  placeholderTextColor="#57534e"
                  autoCapitalize="none"
                />
                {adType === 'image' && uri && (
                  <TouchableOpacity
                    className={cn('w-[46px] h-[46px] bg-rose-50 rounded-xl items-center justify-center border border-rose-500')}
                    onPress={() => setPreviewUri(uri)}
                  >
                    <Ionicons name="eye-outline" size={18} color="#f87171" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Image Preview */}
              {previewUri !== '' && (
                <View className={cn('rounded-xl overflow-hidden h-40 mt-1')}>
                  <Image
                    source={{ uri: previewUri }}
                    className={cn('w-full h-full')}
                    resizeMode="cover"
                    onError={() => { setShowImageError(true); setPreviewUri(''); }}
                  />
                </View>
              )}

              {/* Title */}
              <Text className={cn('text-xs font-bold text-slate-500 mt-1')}>ข้อความหัวเรื่อง</Text>
              <TextInput
                className={cn('bg-neutral-100 rounded-xl border-[1.5px] border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950')}
                value={title}
                onChangeText={setTitle}
                placeholder="เช่น ยินดีต้อนรับ, โปรโมชั่น..."
                placeholderTextColor="#57534e"
              />

              {/* Subtitle */}
              <Text className={cn('text-xs font-bold text-slate-500 mt-1')}>ข้อความรอง</Text>
              <TextInput
                className={cn('bg-neutral-100 rounded-xl border-[1.5px] border-slate-200 px-3 py-2 text-base leading-relaxed text-slate-950')}
                value={subtitle}
                onChangeText={setSubtitle}
                placeholder="เช่น ลด 10% ทุกสินค้า"
                placeholderTextColor="#57534e"
              />

              {/* Duration */}
              <Text className={cn('text-xs font-bold text-slate-500 mt-1')}>ระยะเวลาแสดง (วินาที)</Text>
              <View className={cn('flex-row gap-2 flex-wrap')}>
                {DURATION_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    className={cn('px-3 py-2 rounded-xl bg-neutral-100 border-[1.5px] border-slate-200', duration === d && 'bg-rose-500 border-rose-500')}
                    onPress={() => setDuration(d)}
                  >
                    <Text className={cn('text-xs font-bold text-slate-500', duration === d && 'text-white font-bold')}>
                      {d}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Actions */}
            <View className={cn('flex-row gap-2 mt-1')}>
              <TouchableOpacity className={cn('flex-1 items-center py-3 rounded-xl border-[1.5px] border-slate-200')} onPress={() => setShowAddModal(false)}>
                <Text className={cn('text-base font-bold text-slate-500')}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={cn('flex-[2] flex-row items-center justify-center gap-1 rounded-xl py-3', uri.trim() ? 'bg-rose-500' : 'bg-gray-300')}
                onPress={handleAdd}
                disabled={!uri.trim()}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fafafa" />
                <Text className={cn('text-base font-bold text-white')}>เพิ่มโฆษณา</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertDialog
        visible={showUrlError}
        onClose={() => setShowUrlError(false)}
        title="กรุณากรอก URL"
        message="ต้องระบุ URL ของรูปภาพหรือวิดีโอ"
        variant="warning"
      />

      <AlertDialog
        visible={showAddSuccess}
        onClose={() => setShowAddSuccess(false)}
        title="เพิ่มสำเร็จ"
        message={`เพิ่มสื่อโฆษณา ${adType === 'image' ? 'รูปภาพ' : 'วิดีโอ'} แล้ว`}
        variant="success"
      />

      <AlertDialog
        visible={showImageError}
        onClose={() => setShowImageError(false)}
        title="โหลดรูปไม่ได้"
        message="URL ไม่ถูกต้อง"
        variant="warning"
      />

      <ConfirmModal
        visible={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); setDeleteTargetTitle(undefined); }}
        title="ลบสื่อโฆษณา"
        message={`ต้องการลบ "${deleteTargetTitle || 'รายการนี้'}"?`}
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) removeAd(deleteTarget);
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
          setDeleteTargetTitle(undefined);
        }}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteTarget(null); setDeleteTargetTitle(undefined); }}
      />
    </SafeAreaView>
  );
};
