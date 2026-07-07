import React, { useState, useRef } from 'react';
import { FlatList, Image, Modal, Platform } from 'react-native';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { useCustomerDisplayStore } from '@/features/customer-display/application/stores/customerDisplayStore';
import { AdMedia, AdMediaType } from '@/features/customer-display/domain/customerDisplay';

const DURATION_OPTS = [3, 5, 8, 10, 15, 20];
const SAMPLE_IMAGES = [
  { label: 'ร้านค้า', uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400' },
  { label: 'โปรโมชั่น', uri: 'https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=400' },
  { label: 'สินค้าสด', uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400' },
  { label: 'เครื่องดื่ม', uri: 'https://images.unsplash.com/photo-1581456495146-65a71b2c8ca1?w=400' },
  { label: 'ขนม', uri: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400' },
  { label: 'ร้านอาหาร', uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
];

interface Props { onBack: () => void }
export const AdSettingsScreen: React.FC<Props> = ({ onBack }) => {
  const { ads, shopName, addAd, removeAd, setShopName } = useCustomerDisplayStore();
  const [showForm, setShowForm] = useState(false);
  const [shopInput, setShopInput] = useState(shopName);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const fileRef = useRef<any>(null);
  const [adType, setAdType] = useState<AdMediaType>('image');
  const [uri, setUri] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [duration, setDuration] = useState(5);
  const [preview, setPreview] = useState('');

  const resetForm = () => { setUri(''); setTitle(''); setSubtitle(''); setDuration(5); setPreview(''); };
  const handleAdd = () => {
    if (!uri.trim()) return;
    addAd({ id: `ad_${Date.now()}`, type: adType, uri: uri.trim(), duration, title: title.trim() || undefined, subtitle: subtitle.trim() || undefined });
    resetForm();
    setShowForm(false);
  };

  const previewAd = ads.find(a => a.id === previewId);

  return (
    <View className={cn('flex-1 bg-[#f6f7fb]')}>
      <View className={cn('bg-rose-600 px-4 py-3 flex-row items-center gap-3')}>
        <TouchableOpacity className={cn('flex-row items-center gap-1')} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="#fafafa" />
          <Text className={cn('text-xs font-bold text-white')}>กลับ</Text>
        </TouchableOpacity>
        <Text className={cn('flex-1 text-sm font-extrabold text-white')}>จัดการโฆษณา จอ 2</Text>
        <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-white rounded-lg px-3 py-2 shadow-sm')} onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'chevron-up' : 'add'} size={16} color="#e11d48" />
          <Text className={cn('text-xs font-bold text-rose-600')}>{showForm ? 'ปิด' : 'เพิ่มโฆษณา'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName={cn('p-4 gap-4')}>
        <View className={cn('bg-white rounded-2xl p-4 gap-3 shadow-sm border border-rose-100')}>
          <Text className={cn('text-xs font-bold text-rose-600')}><Ionicons name="storefront-outline" size={14} color="#e11d48" /> ชื่อร้านค้า จอ 2</Text>
          <View className={cn('flex-row gap-2')}>
            <TextInput className={cn('flex-1 border border-rose-200 rounded-xl px-3 h-10 text-xs font-medium text-slate-800 bg-rose-50')} value={shopInput} onChangeText={setShopInput} placeholder="ชื่อร้านค้า..." placeholderTextColor="#cbd5e1" />
            <TouchableOpacity className={cn('bg-rose-500 rounded-xl px-4 h-10 items-center justify-center shadow-sm')} onPress={() => setShopName(shopInput.trim() || shopName)}>
              <Text className={cn('text-xs font-bold text-white')}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showForm && (
          <View className={cn('bg-white rounded-2xl p-4 gap-3 shadow-sm border border-rose-100')}>
            <Text className={cn('text-xs font-bold text-rose-600')}><Ionicons name="add-circle-outline" size={14} color="#e11d48" /> เพิ่มโฆษณาใหม่</Text>
            <View className={cn('flex-row gap-2')}>
              {(['image', 'video'] as AdMediaType[]).map(t => (
                <TouchableOpacity key={t} className={cn('flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border', adType === t ? 'bg-rose-500 border-rose-500' : 'bg-rose-50 border-rose-200')} onPress={() => setAdType(t)}>
                  <Ionicons name={t === 'image' ? 'image-outline' : 'videocam-outline'} size={16} color={adType === t ? '#fafafa' : '#64748b'} />
                  <Text className={cn('text-xs font-semibold', adType === t ? 'text-white font-bold' : 'text-slate-600')}>{t === 'image' ? 'รูปภาพ' : 'วิดีโอ (MP4)'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {adType === 'image' && (
              <>
                <Text className={cn('text-xs font-bold text-slate-500')}>เลือกรูปภาพ (ตัวอย่าง)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className={cn('flex-row gap-2 py-1')}>
                    {SAMPLE_IMAGES.map(img => (
                      <TouchableOpacity key={img.uri} className={cn('w-20 rounded-xl overflow-hidden border-2', uri === img.uri ? 'border-rose-500' : 'border-rose-100')} onPress={() => { setUri(img.uri); setPreview(img.uri); setTitle(img.label); }}>
                        <Image source={{ uri: img.uri }} style={{ width: 80, height: 60 }} />
                        <Text className={cn('text-xs text-center bg-[#f6f7fb] py-1 font-medium text-slate-700')}>{img.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
            <Text className={cn('text-xs font-bold text-slate-500')}>URL {adType === 'image' ? 'รูปภาพ' : 'วิดีโอ'} *</Text>
            <View className={cn('flex-row gap-2')}>
              <TextInput className={cn('flex-1 border border-rose-200 rounded-xl px-3 h-10 text-xs font-medium text-slate-800 bg-rose-50')} value={uri} onChangeText={v => { setUri(v); setPreview(''); }} placeholder={adType === 'image' ? 'https://.../image.jpg' : 'https://.../video.mp4'} placeholderTextColor="#cbd5e1" autoCapitalize="none" />
              {uri.trim() !== '' && (
                <TouchableOpacity className={cn('w-10 h-10 bg-rose-50 rounded-xl items-center justify-center border border-rose-300')} onPress={() => setPreview(uri)}>
                  <Ionicons name="eye-outline" size={16} color="#e11d48" />
                </TouchableOpacity>
              )}
            </View>
            {Platform.OS === 'web' && (
              <View className={cn('flex-row items-center gap-2.5 bg-rose-50 rounded-xl p-2.5 border border-rose-200')}>
                <input ref={fileRef} type="file" accept={adType === 'image' ? 'image/*' : 'video/mp4,video/*'} style={{ display: 'none' }} onChange={(e: any) => { const file = e.target.files?.[0]; if (!file) return; const url = URL.createObjectURL(file); setUri(url); setPreview(url); e.target.value = ''; }} />
                <TouchableOpacity className={cn('flex-row items-center gap-1.5 bg-rose-500 rounded-lg px-3.5 py-2 shadow-sm')} onPress={() => (fileRef.current as HTMLInputElement)?.click()}>
                  <Ionicons name={adType === 'image' ? 'image-outline' : 'videocam-outline'} size={15} color="#fafafa" />
                  <Text className={cn('text-xs font-bold text-white')}>เลือก{adType === 'image' ? 'รูปภาพ' : 'วิดีโอ'}จากเครื่อง</Text>
                </TouchableOpacity>
                <Text className={cn('text-xs text-slate-500 font-medium')}>หรือวาง URL ด้านบน</Text>
              </View>
            )}
            {preview !== '' && adType === 'image' && (
              <View className={cn('w-full rounded-xl overflow-hidden bg-slate-800 border border-rose-100 min-h-[200px] items-center justify-center')}>
                <Image source={{ uri: preview }} style={{ width: '100%', height: 280 }} resizeMode="contain" onError={() => setPreview('')} />
              </View>
            )}
            {preview !== '' && adType === 'video' && Platform.OS === 'web' && (
              <View className={cn('w-full rounded-xl overflow-hidden bg-slate-800 border border-rose-100 min-h-[200px] items-center justify-center')}>
                <video src={preview} controls style={{ width: '100%', maxHeight: 320, borderRadius: 12, backgroundColor: '#09090b', display: 'block' }} onError={() => setPreview('')} />
              </View>
            )}
            <View className={cn('flex-row gap-3')}>
              <View className={cn('flex-1')}>
                <Text className={cn('text-xs font-bold text-slate-500')}>หัวข้อ/ชื่อสินค้า</Text>
                <TextInput className={cn('border border-rose-200 rounded-xl px-3 h-10 text-xs font-medium text-slate-800 bg-rose-50')} value={title} onChangeText={setTitle} placeholder="เช่น โปรโมชั่นลดราคา" placeholderTextColor="#cbd5e1" />
              </View>
              <View className={cn('flex-1')}>
                <Text className={cn('text-xs font-bold text-slate-500')}>คำอธิบาย</Text>
                <TextInput className={cn('border border-rose-200 rounded-xl px-3 h-10 text-xs font-medium text-slate-800 bg-rose-50')} value={subtitle} onChangeText={setSubtitle} placeholder="เช่น ลด 10% ทุกสินค้า" placeholderTextColor="#cbd5e1" />
              </View>
            </View>
            <Text className={cn('text-xs font-bold text-slate-500')}>ระยะเวลาแสดง (วินาที)</Text>
            <View className={cn('flex-row gap-2 flex-wrap')}>
              {DURATION_OPTS.map(d => (
                <TouchableOpacity key={d} className={cn('px-3.5 py-2 rounded-xl border', duration === d ? 'bg-rose-500 border-rose-500' : 'bg-rose-50 border-rose-200')} onPress={() => setDuration(d)}>
                  <Text className={cn('text-xs', duration === d ? 'text-white font-bold' : 'text-slate-600 font-medium')}>{d}s</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity className={cn('flex-row items-center justify-center gap-1.5 bg-emerald-500 rounded-xl py-2.5 shadow-sm', !uri.trim() && 'opacity-30')} onPress={handleAdd} disabled={!uri.trim()}>
              <Ionicons name="add-circle-outline" size={18} color="#fafafa" />
              <Text className={cn('text-xs font-bold text-white')}>เพิ่มโฆษณา</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className={cn('bg-white rounded-2xl p-4 gap-3 shadow-sm border border-rose-100')}>
          <View className={cn('flex-row justify-between items-center')}>
            <Text className={cn('text-xs font-bold text-rose-600')}><Ionicons name="images-outline" size={14} color="#e11d48" /> โฆษณาทั้งหมด ({ads.length})</Text>
          </View>
          {ads.length === 0 ? (
            <View className={cn('items-center py-8 gap-2')}>
              <Ionicons name="images-outline" size={40} color="#fecdd3" />
              <Text className={cn('text-xs text-slate-400 font-medium')}>ยังไม่มีโฆษณา กดเพิ่มโฆษณาด้านบน</Text>
            </View>
          ) : (
            <View className={cn('flex-row flex-wrap gap-2.5')}>
              {ads.map((ad, idx) => (
                <View key={ad.id} className={cn('w-[48%] bg-white rounded-2xl overflow-hidden border border-rose-100 shadow-sm')}>
                  <View className={cn('w-full aspect-square relative bg-black')}>
                    {ad.type === 'image' ? (
                      <Image source={{ uri: ad.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <View className={cn('w-full h-full bg-slate-950 items-center justify-center')}>
                        <Ionicons name="play-circle" size={28} color="#fafafa" />
                      </View>
                    )}
                    <View className={cn('absolute top-1 left-1 bg-rose-500 rounded-lg px-2 py-1')}>
                      <Text className={cn('text-xs font-extrabold text-white')}>{ad.type === 'image' ? 'รูป' : 'วิดีโอ'}</Text>
                    </View>
                    <View className={cn('absolute top-1 right-1 bg-black/50 rounded-full w-5 h-5 items-center justify-center')}>
                      <Text className={cn('text-xs font-bold text-white')}>{idx + 1}</Text>
                    </View>
                  </View>
                  <View className={cn('p-2 gap-0.5')}>
                    <Text className={cn('text-xs font-semibold text-slate-800')} numberOfLines={1}>{ad.title || '(ไม่มีชื่อ)'}</Text>
                    {ad.subtitle && <Text className={cn('text-xs text-slate-500 font-medium')} numberOfLines={1}>{ad.subtitle}</Text>}
                    <View className={cn('flex-row items-center gap-1')}>
                      <Ionicons name="time-outline" size={12} color="#64748b" />
                      <Text className={cn('text-xs text-slate-500 font-medium')}>{ad.duration}s · ลำดับ {idx + 1}</Text>
                    </View>
                  </View>
                  <View className={cn('flex-row gap-1.5 p-2 border-t border-rose-100')}>
                    <TouchableOpacity className={cn('flex-1 h-9 rounded-lg bg-[#f6f7fb] items-center justify-center')} onPress={() => setPreviewId(ad.id)}>
                      <Ionicons name="eye-outline" size={16} color="#e11d48" />
                    </TouchableOpacity>
                    <TouchableOpacity className={cn('flex-1 h-9 rounded-lg bg-rose-100 items-center justify-center')} onPress={() => removeAd(ad.id)}>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className={cn('bg-white rounded-2xl p-4 gap-3 shadow-sm border border-rose-100')}>
          <Text className={cn('text-xs font-bold text-rose-600')}><Ionicons name="layers-outline" size={14} color="#e11d48" /> โหมดการแสดงผล จอ 2</Text>
          <View className={cn('flex-row flex-wrap gap-2.5')}>
            {[
              { icon: 'images-outline', label: 'Slideshow รูปภาพ', desc: 'สลับรูปโฆษณาอัตโนมัติ', color: '#e11d48' },
              { icon: 'cart-outline', label: 'แสดงรายการขาย', desc: 'รายการสินค้าที่กำลังขาย', color: '#10b981' },
              { icon: 'card-outline', label: 'แสดง QR จ่ายเงิน', desc: 'สแกนจ่ายผ่าน PromptPay', color: '#d97706' },
              { icon: 'checkmark-circle-outline', label: 'ยืนยันการชำระ', desc: 'แสดงยอด + ข้อความสำเร็จ', color: '#10b981' },
            ].map((m, i) => (
              <View key={i} className={cn('w-[47%] flex-grow bg-rose-50 rounded-2xl p-3 items-center gap-1.5 border border-rose-200')} style={{ borderTopWidth: 3, borderTopColor: m.color }}>
                <Ionicons name={m.icon as any} size={22} color={m.color} />
                <Text className={cn('text-xs font-bold text-center')} style={{ color: m.color }}>{m.label}</Text>
                <Text className={cn('text-xs text-slate-500 text-center font-medium')}>{m.desc}</Text>
              </View>
            ))}
          </View>
          <View className={cn('flex-row items-start gap-2 bg-rose-50 rounded-xl p-2.5 border border-rose-200')}>
            <Ionicons name="information-circle-outline" size={14} color="#e11d48" />
            <Text className={cn('text-xs text-rose-600 flex-1 leading-5 font-medium')}>โหมด จอ 2 จะเปลี่ยนอัตโนมัติตามสถานะการขาย สามารถทดสอบได้จากเมนูนี้</Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={!!previewId} transparent animationType="fade">
        <View className={cn('flex-1 bg-black/60 items-center justify-center')}>
          <View className={cn('bg-white rounded-2xl p-5 w-[400px] gap-3 shadow-lg shadow-rose-500/40')}>
            <Text className={cn('text-xs font-bold text-slate-800')}>พรีวิวโฆษณา</Text>
            {previewAd?.type === 'image' && (
              <Image source={{ uri: previewAd.uri }} style={{ width: '100%', height: 200 }} resizeMode="cover" className={cn('rounded-xl')} />
            )}
            {previewAd && (
              <View className={cn('gap-1')}>
                {previewAd.title && <Text className={cn('text-xs font-bold text-slate-800')}>{previewAd.title}</Text>}
                {previewAd.subtitle && <Text className={cn('text-xs text-slate-500 font-medium')}>{previewAd.subtitle}</Text>}
                <Text className={cn('text-xs text-slate-400 font-medium')}>ระยะเวลา: {previewAd.duration} วินาที</Text>
              </View>
            )}
            <TouchableOpacity className={cn('bg-rose-500 rounded-xl py-2.5 items-center shadow-sm')} onPress={() => setPreviewId(null)}>
              <Text className={cn('text-xs font-bold text-white')}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
