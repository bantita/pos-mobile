import React, { useState } from 'react';
import { Image, FlatList } from 'react-native';
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from '@/shared/tw/index';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { AlertDialog } from '@/shared/ui/components/AlertDialog';
import { ConfirmModal } from '@/shared/ui/components/ConfirmModal';
import { useCustomerDisplayStore } from '@/features/customer-display/application/stores/customerDisplayStore';
import { AdMedia, AdMediaType } from '@/features/customer-display/domain/customerDisplay';

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

  const [nameInput, setNameInput]       = useState(shopName);
  const [showIdleAd, setShowIdleAd]     = useState(true);
  const [showDiscount, setShowDiscount] = useState(true);
  const [showVAT, setShowVAT]           = useState(true);
  const [fontSize, setFontSize]         = useState<'normal' | 'large'>('normal');

  const [adType, setAdType]     = useState<AdMediaType>('image');
  const [uri, setUri]           = useState('');
  const [adTitle, setAdTitle]   = useState('');
  const [adSub, setAdSub]       = useState('');
  const [duration, setDuration] = useState(5);
  const [preview, setPreview]   = useState('');
  const [showForm, setShowForm] = useState(false);

  const [alertDialog, setAlertDialog] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });
  const [confirmRemove, setConfirmRemove] = useState<{ visible: boolean; adId: string; adTitle?: string }>({ visible: false, adId: '' });

  const handleSaveName = () => {
    setShopName(nameInput.trim() || shopName);
    setAlertDialog({ visible: true, title: 'บันทึกแล้ว', message: 'ชื่อร้านค้าถูกบันทึกเรียบร้อย' });
  };

  const handleAddAd = () => {
    if (!uri.trim()) { setAlertDialog({ visible: true, title: 'กรุณากรอก URL', message: '' }); return; }
    addAd({
      id: `ad_${Date.now()}`,
      type: adType,
      uri: uri.trim(),
      duration,
      title: adTitle.trim() || undefined,
      subtitle: adSub.trim() || undefined,
    });
    setUri(''); setAdTitle(''); setAdSub(''); setPreview(''); setShowForm(false);
    setAlertDialog({ visible: true, title: 'เพิ่มโฆษณาสำเร็จ', message: '' });
  };

  const handleRemoveAd = (id: string, title?: string) => {
    setConfirmRemove({ visible: true, adId: id, adTitle: title });
  };

  const confirmRemoveAction = () => {
    removeAd(confirmRemove.adId);
    setConfirmRemove({ visible: false, adId: '' });
  };

  const GeneralTab = () => (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }} showsVerticalScrollIndicator={false}>
      <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
        <Text className={cn('text-xs font-bold text-rose-500')}>
          <Ionicons name="storefront-outline" size={14} color="#f87171" /> ข้อมูลร้านค้าบนจอที่ 2
        </Text>
        <Text className={cn('text-xs font-bold text-slate-600')}>ชื่อร้านค้า</Text>
        <View className={cn('flex-row gap-2 items-center')}>
          <TextInput
            className={cn('flex-1 bg-white rounded-xl border-2 border-slate-200 px-3 py-2 text-base font-medium text-slate-950')}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="กรอกชื่อร้าน"
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity className={cn('min-h-10 items-center justify-center rounded-xl bg-rose-500 px-4 py-2 shadow-sm')} onPress={handleSaveName}>
            <Text className={cn('text-xs font-bold text-white')}>บันทึก</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
        <Text className={cn('text-xs font-bold text-rose-500')}>
          <Ionicons name="eye-outline" size={14} color="#f87171" /> ตัวเลือกการแสดงผล
        </Text>
        {[
          { label: 'แสดงสื่อโฆษณาเมื่อไม่มีลูกค้า', sub: 'Slideshow รูป/วิดีโอ', value: showIdleAd, set: setShowIdleAd },
          { label: 'แสดงส่วนลด', sub: 'แสดงยอดส่วนลดในบิล', value: showDiscount, set: setShowDiscount },
          { label: 'แสดง VAT', sub: 'แสดงยอด VAT แยกต่างหาก', value: showVAT, set: setShowVAT },
        ].map((opt, i) => (
          <View key={i} className={cn('flex-row items-center justify-between gap-3', i > 0 && 'border-t border-slate-200 pt-3')}>
            <View style={{ flex: 1 }}>
              <Text className={cn('text-xs font-bold text-slate-950')}>{opt.label}</Text>
              <Text className={cn('text-xs font-medium text-slate-600')}>{opt.sub}</Text>
            </View>
            <Switch
              value={opt.value}
              onValueChange={opt.set}
            />
          </View>
        ))}
      </View>

      <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
        <Text className={cn('text-xs font-bold text-rose-500')}>
          <Ionicons name="text-outline" size={14} color="#f87171" /> ขนาดตัวอักษร
        </Text>
        <View className={cn('flex-row gap-2')}>
          {([['normal','ปกติ'],['large','ใหญ่']] as const).map(([k, lbl]) => (
            <TouchableOpacity
              key={k}
              className={cn('flex-1 py-3 rounded-xl items-center border-2', fontSize === k ? 'bg-rose-500 border-rose-500' : 'bg-[#f6f7fb] border-slate-200')}
              onPress={() => setFontSize(k)}
            >
              <Text className={cn('text-slate-600', fontSize === k && 'text-white font-bold')} style={{ fontSize: k === 'large' ? 16 : 13 }}>
                Aa — {lbl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
        <Text className={cn('text-xs font-bold text-rose-500')}>
          <Ionicons name="layers-outline" size={14} color="#f87171" /> โหมดการแสดงผล
        </Text>
        <View className={cn('flex-row flex-wrap gap-2')}>
          {[
            { mode: 'idle',            icon: 'images-outline',         label: 'Slideshow โฆษณา',  color: '#f87171',  desc: 'เมื่อไม่มีลูกค้า' },
            { mode: 'cart',            icon: 'cart-outline',            label: 'รายการสินค้า',    color: '#0f766e',  desc: 'ระหว่างเลือกสินค้า' },
            { mode: 'payment_pending', icon: 'card-outline',            label: 'รอชำระเงิน',      color: '#a16207',  desc: 'แสดงยอดรวม' },
            { mode: 'payment_success', icon: 'checkmark-circle-outline',label: 'ชำระสำเร็จ',     color: '#0f766e',  desc: 'ขอบคุณลูกค้า' },
          ].map((m) => (
            <View key={m.mode} className={cn('w-[47%] flex-grow bg-[#f6f7fb] rounded-xl p-2 items-center gap-1')} style={{ borderTopWidth: 3, borderTopColor: m.color }}>
              <Ionicons name={m.icon as any} size={24} color={m.color} />
              <Text style={[{ color: m.color }]} className={cn('text-xs font-bold')}>{m.label}</Text>
              <Text className={cn('text-xs font-medium text-slate-600 text-center')}>{m.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const AdsTab = () => (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }} showsVerticalScrollIndicator={false}>
      <TouchableOpacity className={cn('flex-row items-center justify-center gap-2 bg-rose-500 rounded-xl py-3 shadow-sm')} onPress={() => setShowForm(!showForm)}>
        <Ionicons name={showForm ? 'chevron-up' : 'add-circle-outline'} size={20} color="#fafafa" />
        <Text className={cn('text-base font-bold text-white')}>{showForm ? 'ซ่อนฟอร์ม' : 'เพิ่มสื่อโฆษณาใหม่'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-rose-500')}>
            <Ionicons name="add-outline" size={14} color="#f87171" /> ข้อมูลสื่อโฆษณา
          </Text>

          <View className={cn('flex-row gap-2')}>
            {(['image','video'] as AdMediaType[]).map((t) => (
              <TouchableOpacity
                key={t}
                className={cn('flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border-2', adType === t ? 'bg-rose-500 border-rose-500' : 'bg-[#f6f7fb] border-slate-200')}
                onPress={() => setAdType(t)}
              >
                <Ionicons name={t === 'image' ? 'image-outline' : 'videocam-outline'} size={18}
                  color={adType === t ? '#fafafa' : '#57534e'} />
                <Text className={cn('text-xs font-bold', adType === t ? 'text-white' : 'text-slate-600')}>
                  {t === 'image' ? 'รูปภาพ' : 'วิดีโอ (MP4)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {adType === 'image' && (
            <>
              <Text className={cn('text-xs font-bold text-slate-600')}>ตัวอย่างด่วน (กดเลือก)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className={cn('flex-row gap-2 py-1')}>
                  {SAMPLE_IMAGES.map((s) => (
                    <TouchableOpacity
                      key={s.uri}
                      className={cn('w-20 rounded-xl overflow-hidden border-2', uri === s.uri ? 'border-rose-500' : 'border-slate-200')}
                      onPress={() => { setUri(s.uri); setPreview(s.uri); setAdTitle(s.label); }}
                    >
                      <Image source={{ uri: s.uri }} style={{ width: 80, height: 60 }} />
                      <Text className={cn('text-xs font-medium text-center bg-[#f6f7fb] py-0.5')}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          <Text className={cn('text-xs font-bold text-slate-600')}>URL {adType === 'image' ? 'รูปภาพ' : 'วิดีโอ (MP4)'} *</Text>
          <View className={cn('flex-row gap-2 items-center')}>
            <TextInput
              className={cn('flex-1 bg-white rounded-xl border-2 border-slate-200 px-3 py-2 text-base font-medium text-slate-950')}
              value={uri}
              onChangeText={(v) => { setUri(v); setPreview(''); }}
              placeholder={adType === 'image' ? 'https://.../image.jpg' : 'https://.../video.mp4'}
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
            />
            {adType === 'image' && uri.trim() !== '' && (
              <TouchableOpacity className={cn('w-11 h-11 bg-[#f6f7fb] rounded-xl items-center justify-center border border-rose-500')} onPress={() => setPreview(uri)}>
                <Ionicons name="eye-outline" size={18} color="#f87171" />
              </TouchableOpacity>
            )}
          </View>

          {preview !== '' && (
            <Image
              source={{ uri: preview }}
              style={{ width: '100%', height: 160, borderRadius: 12 }}
              resizeMode="cover"
              onError={() => { setAlertDialog({ visible: true, title: 'URL ไม่ถูกต้อง', message: '' }); setPreview(''); }}
            />
          )}

          <Text className={cn('text-xs font-bold text-slate-600')}>ชื่อ / หัวเรื่อง</Text>
          <TextInput
            className={cn('bg-white rounded-xl border-2 border-slate-200 px-3 py-2 text-base font-medium text-slate-950')}
            value={adTitle}
            onChangeText={setAdTitle}
            placeholder="เช่น ยินดีต้อนรับ, โปรโมชั่น..."
            placeholderTextColor="#9ca3af"
          />

          <Text className={cn('text-xs font-bold text-slate-600')}>คำบรรยาย</Text>
          <TextInput
            className={cn('bg-white rounded-xl border-2 border-slate-200 px-3 py-2 text-base font-medium text-slate-950')}
            value={adSub}
            onChangeText={setAdSub}
            placeholder="เช่น ลด 10% ทุกสินค้า"
            placeholderTextColor="#9ca3af"
          />

          <Text className={cn('text-xs font-bold text-slate-600')}>ระยะเวลาแสดง (วินาที)</Text>
          <View className={cn('flex-row gap-2 flex-wrap')}>
            {DURATION_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                className={cn('px-3 py-2 rounded-xl border-2', duration === d ? 'bg-rose-500 border-rose-500' : 'bg-white border-slate-200')}
                onPress={() => setDuration(d)}
              >
                <Text className={cn('text-xs font-bold', duration === d ? 'text-white' : 'text-slate-600')}>{d}s</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className={cn('flex-row items-center justify-center gap-2 rounded-xl py-3 shadow-sm', uri.trim() ? 'bg-emerald-700' : 'bg-gray-300')}
            onPress={handleAddAd}
            disabled={!uri.trim()}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fafafa" />
            <Text className={cn('text-base font-bold text-white')}>บันทึกโฆษณา</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text className={cn('text-xs font-bold text-slate-600')}>รายการสื่อโฆษณา ({ads.length})</Text>
      {ads.length === 0 && (
        <View className={cn('items-center py-10 gap-2')}>
          <Ionicons name="images-outline" size={48} color="#e7e5e4" />
          <Text className={cn('text-base font-medium text-slate-600')}>ยังไม่มีโฆษณา</Text>
        </View>
      )}
      {ads.map((ad, i) => (
        <View key={ad.id} className={cn('flex-row bg-white rounded-2xl overflow-hidden border border-rose-100 shadow-sm')}>
          <View style={{ width: 80, height: 70, position: 'relative' }}>
            {ad.type === 'image' ? (
              <Image source={{ uri: ad.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View className={cn('w-full h-full bg-[#f6f7fb] items-center justify-center')}>
                <Ionicons name="play-circle" size={28} color="#fafafa" />
              </View>
            )}
            <View className={cn('absolute top-0.5 left-0.5 flex-row items-center gap-0.5 rounded px-1 py-0.5', 'bg-rose-500')}>
              <Ionicons name={ad.type === 'image' ? 'image-outline' : 'videocam-outline'} size={10} color="#fafafa" />
              <Text style={{ fontSize: 9, color: '#fafafa', fontWeight: '700' }}>{ad.type === 'image' ? 'รูป' : 'วิดีโอ'}</Text>
            </View>
          </View>
          <View className={cn('flex-1 justify-center gap-0.5 p-3')}>
            <Text className={cn('text-xs font-bold text-slate-950')} numberOfLines={1}>{ad.title || '(ไม่มีชื่อ)'}</Text>
            {ad.subtitle && <Text className={cn('text-xs font-medium text-slate-600')} numberOfLines={1}>{ad.subtitle}</Text>}
            <View className={cn('flex-row items-center gap-1')}>
              <Ionicons name="time-outline" size={11} color="#57534e" />
              <Text className={cn('text-xs font-medium text-slate-600')}>{ad.duration}s · ลำดับ {i + 1}</Text>
            </View>
          </View>
          <TouchableOpacity className={cn('w-11 items-center justify-center bg-[#f6f7fb]')} onPress={() => handleRemoveAd(ad.id, ad.title)}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const PreviewTab = () => {
    const [previewMode, setPreviewMode] = useState<'idle'|'cart'|'payment_pending'|'payment_success'>('idle');
    const { setMode } = useCustomerDisplayStore();

    return (
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
        <View className={cn('bg-white rounded-2xl p-3 gap-3 shadow-sm')}>
          <Text className={cn('text-xs font-bold text-rose-500')}>
            <Ionicons name="eye-outline" size={14} color="#f87171" /> ทดสอบโหมดจอที่ 2
          </Text>
          <Text className={cn('text-base font-medium text-slate-600')}>
            กดปุ่มด้านล่างเพื่อตั้งค่าโหมดจอที่ 2 แล้วเปิดจอที่ 2 จากปุ่ม "จอ 2" ในหน้าขาย
          </Text>
          <View className={cn('flex-row flex-wrap gap-2')}>
            {[
              { mode: 'idle'            as const, label: 'โฆษณา Slideshow',  icon: 'images-outline',          color: '#f87171'  },
              { mode: 'cart'            as const, label: 'รายการสินค้า',     icon: 'cart-outline',            color: '#0f766e'  },
              { mode: 'payment_pending' as const, label: 'รอชำระเงิน',       icon: 'card-outline',            color: '#a16207'  },
              { mode: 'payment_success' as const, label: 'ชำระสำเร็จ',      icon: 'checkmark-circle-outline', color: '#0f766e'  },
            ].map((m) => (
              <TouchableOpacity
                key={m.mode}
                className={cn('w-[47%] flex-grow bg-white rounded-xl p-3 items-center gap-1 relative border', previewMode === m.mode ? 'border-2' : 'border')}
                style={{ borderTopWidth: 4, borderTopColor: m.color, borderColor: previewMode === m.mode ? m.color : '#e7e5e4' }}
                onPress={() => { setPreviewMode(m.mode); setMode(m.mode); }}
              >
                {previewMode === m.mode && (
                  <View className={cn('absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center')} style={{ backgroundColor: m.color }}>
                    <Ionicons name="checkmark" size={11} color="#fafafa" />
                  </View>
                )}
                <Ionicons name={m.icon as any} size={28} color={m.color} />
                <Text style={[{ color: m.color }]} className={cn('text-xs font-bold text-center')}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className={cn('flex-row items-center gap-2 bg-[#f6f7fb] rounded-xl p-3')}>
            <Ionicons name="tv-outline" size={16} color="#475569" />
            <Text className={cn('text-base font-medium text-slate-700')}>
              โหมดปัจจุบัน: <Text style={{ fontWeight: '700' }}>
                {previewMode === 'idle' ? 'Slideshow โฆษณา'
                  : previewMode === 'cart' ? 'รายการสินค้า'
                  : previewMode === 'payment_pending' ? 'รอชำระเงิน'
                  : 'ชำระสำเร็จ'}
              </Text>
            </Text>
          </View>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      <View className={cn('flex-row items-center gap-2 bg-rose-600 px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-lg font-extrabold text-white')}>ตั้งค่าจอที่ 2</Text>
          <Text className={cn('text-xs font-medium text-rose-100')}>Customer Display · {ads.length} โฆษณา</Text>
        </View>
      </View>

      <View className={cn('flex-row bg-white border-b border-slate-200')}>
        {([
          ['general', 'settings-outline', 'ทั่วไป'],
          ['ads',     'images-outline',   'โฆษณา'],
          ['preview', 'eye-outline',      'ทดสอบ'],
        ] as const).map(([k, icon, lbl]) => (
          <TouchableOpacity
            key={k}
            className={cn('flex-1 flex-row items-center justify-center gap-1 py-3 border-b-[2.5px]', tab === k ? 'border-b-rose-500' : 'border-b-transparent')}
            onPress={() => setTab(k)}
          >
            <Ionicons name={icon as any} size={16} color={tab === k ? '#f87171' : '#57534e'} />
            <Text className={cn('text-xs font-bold', tab === k ? 'text-rose-500' : 'text-slate-600')}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'general' && <GeneralTab />}
      {tab === 'ads'     && <AdsTab />}
      {tab === 'preview' && <PreviewTab />}

      <AlertDialog
        visible={alertDialog.visible}
        title={alertDialog.title}
        message={alertDialog.message}
        onClose={() => setAlertDialog({ visible: false, title: '', message: '' })}
        onConfirm={() => setAlertDialog({ visible: false, title: '', message: '' })}
      />

      <ConfirmModal
        visible={confirmRemove.visible}
        title="ลบโฆษณา"
        message={`ลบ "${confirmRemove.adTitle || 'รายการนี้'}"?`}
        variant="danger"
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        onConfirm={confirmRemoveAction}
        onCancel={() => setConfirmRemove({ visible: false, adId: '' })}
        onClose={() => setConfirmRemove({ visible: false, adId: '' })}
      />
    </SafeAreaView>
  );
};
