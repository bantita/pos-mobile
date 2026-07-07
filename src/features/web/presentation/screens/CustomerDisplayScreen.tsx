import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform } from 'react-native';
import { ScrollView, Text, TouchableOpacity, View } from '@/shared/tw/index';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { useCartStore } from '@/features/sale/application/stores/cartStore';
import { useCustomerDisplayStore } from '@/features/customer-display/application/stores/customerDisplayStore';

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 });

const AdSlide: React.FC = () => {
  const { ads, currentAdIndex, nextAd, shopName } = useCustomerDisplayStore();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (ads.length > 0) {
      const dur = (ads[currentAdIndex]?.duration ?? 5) * 1000;
      timerRef.current = setInterval(nextAd, dur);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentAdIndex, ads.length]);

  if (ads.length === 0) {
    return (
      <View className={cn('flex-1 items-center justify-center gap-1.5 bg-slate-950')}>
        <Ionicons name="images-outline" size={32} color="#d1d5db" />
        <Text className={cn('text-sm font-medium text-slate-500')}>ยังไม่มีโฆษณา</Text>
      </View>
    );
  }

  const ad = ads[currentAdIndex];
  return (
    <Animated.View className={cn('flex-1 relative')} style={[{ opacity: fadeAnim }]}>
      {ad?.type === 'image' && ad.uri
        ? <Image source={{ uri: ad.uri }} className={cn('absolute inset-0')} resizeMode="cover" />
        : <View className={cn('absolute inset-0')} style={[{ backgroundColor: '#44403c' }]} />}
      <View className={cn('absolute inset-0 bg-[rgba(0,0,0,0.3)]')} />
      {(ad?.title || ad?.subtitle) && (
        <View className={cn('absolute bottom-5 left-0 right-0 px-3.5 gap-0.5')}>
          {ad.title    && <Text className={cn('text-sm font-extrabold text-white')} numberOfLines={1}>{ad.title}</Text>}
          {ad.subtitle && <Text className={cn('text-sm font-medium text-[rgba(255,255,255,0.85)]')} numberOfLines={1}>{ad.subtitle}</Text>}
        </View>
      )}
      {ads.length > 1 && (
        <View className={cn('absolute bottom-1.5 left-0 right-0 flex-row justify-center gap-1.25')}>
          {ads.map((_, i) => (
            <View key={i} className={cn('w-1.25 h-1.25 rounded-sm bg-[rgba(255,255,255,0.35)]', i === currentAdIndex && 'bg-white w-3.5')} />
          ))}
        </View>
      )}
    </Animated.View>
  );
};

type DisplayMode = 'idle' | 'cart' | 'payment_pending' | 'payment_success';

interface DisplayItem {
  id: string;
  name: string;
  unitPrice: number;
  qty: number;
  discAmt: number;
  subtotal: number;
}

interface Props {
  mode?: DisplayMode;
  paidAmount?: number;
  changeAmount?: number;
  discountOverride?: number;
  grandOverride?: number;
  displayItems?: DisplayItem[];
  onClose?: () => void;
  embedded?: boolean;
}

export const CustomerDisplayScreen: React.FC<Props> = ({
  mode: propMode, paidAmount = 0, changeAmount = 0,
  discountOverride, grandOverride, displayItems,
  onClose, embedded = false,
}) => {
  const store      = useCustomerDisplayStore();
  const cart       = useCartStore();
  const activeMode = propMode ?? store.mode;

  const subtotal  = cart.getSubtotal();
  const discTotal = discountOverride !== undefined ? discountOverride
    : store.syncedDiscount > 0 ? store.syncedDiscount
    : cart.getDiscountTotal();
  const grand     = grandOverride     !== undefined ? grandOverride
    : store.syncedGrand   > 0 ? store.syncedGrand
    : cart.getGrandTotal();

  const showItems = displayItems ?? (store.syncedItems.length > 0 ? store.syncedItems : cart.items.map(i => ({
    id:        i.product.id,
    name:      i.product.name,
    unitPrice: i.unitPrice,
    qty:       i.qty,
    discAmt:   i.discountAmount,
    subtotal:  i.subtotal,
  })));
  const totalQty  = showItems.reduce((s, i) => s + i.qty, 0);
  const lastItem  = showItems[showItems.length - 1];

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (activeMode === 'payment_pending') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [activeMode]);

  useEffect(() => {
    if (paidAmount) store.setPaidInfo(paidAmount, changeAmount);
  }, [paidAmount, changeAmount]);

  const modeColor =
    activeMode === 'payment_pending' ? '#a16207'
    : activeMode === 'payment_success' ? '#0f766e'
    : '#6b21a8';

  const modeDotColor =
    activeMode === 'payment_pending' ? '#a16207'
    : activeMode === 'payment_success' ? '#0f766e'
    : '#0f766e';

  const modeLabel: Record<DisplayMode, string> = {
    idle: 'โฆษณา',
    cart: 'รายการสินค้า',
    payment_pending: 'รอชำระ',
    payment_success: 'ชำระสำเร็จ',
  };

  const baseAmountClasses = 'border-2 rounded-2xl py-3 items-center bg-rose-50';

  const renderAmountBox = () => {
    if (activeMode === 'payment_success') {
      return (
        <View className={cn(baseAmountClasses, 'border-emerald-500')}>
          <Text className={cn('text-2xl font-extrabold text-emerald-600 tracking-wide')}>฿ {fmt(grand)}</Text>
        </View>
      );
    }
    if (activeMode === 'payment_pending') {
      return (
        <Animated.View className={cn(baseAmountClasses, 'border-amber-500')} style={[{ transform: [{ scale: pulseAnim }] }]}>
          <Text className={cn('text-2xl font-extrabold text-amber-600 tracking-wide')}>฿ {fmt(grand)}</Text>
        </Animated.View>
      );
    }
    return (
      <View className={cn(baseAmountClasses, 'border-violet-500')}>
        <Text className={cn('text-2xl font-extrabold text-violet-600 tracking-wide')}>฿ {fmt(grand)}</Text>
      </View>
    );
  };

  const renderBanner = () => {
    if (activeMode === 'payment_pending') {
      return (
        <View className={cn('flex-row items-center gap-2 border rounded-xl px-3 py-2 flex-wrap', 'bg-amber-50 border-amber-500')}>
          <Ionicons name="card-outline" size={18} color="#a16207" />
          <Text className={cn('text-xs font-extrabold flex-1 text-amber-600')}>กรุณาชำระเงิน</Text>
        </View>
      );
    }
    if (activeMode === 'payment_success') {
      return (
        <View className={cn('flex-row items-center gap-2 border rounded-xl px-3 py-2 flex-wrap', 'bg-emerald-50 border-emerald-500')}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#0f766e" />
          <Text className={cn('text-xs font-extrabold flex-1 text-emerald-600')}>ชำระเงินสำเร็จ!</Text>
          {store.changeAmount > 0 && (
            <Text className={cn('text-xs font-bold text-emerald-600 w-full')}>เงินทอน ฿ {fmt(store.changeAmount)}</Text>
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <View className={cn('flex-1 bg-[#f6f7fb]')} style={[Platform.OS === 'web' && { minHeight: '100%' }, embedded && { borderRadius: 12, overflow: 'hidden' }]}>
      {onClose && (
        <TouchableOpacity className={cn('absolute top-2 right-2 z-50 w-6 h-6 rounded-full items-center justify-center bg-[rgba(0,0,0,0.07)]')} onPress={onClose}>
          <Ionicons name="close" size={15} color="#57534e" />
        </TouchableOpacity>
      )}

      <View className={cn('flex-1 flex-row')}>
        <View className={cn('flex-1 bg-white border-r border-slate-200 flex-col')}>
          <View className={cn('flex-row items-center gap-1.25 self-start bg-[rgba(255,255,255,0.92)] rounded-full px-2.5 py-1 mx-2.5 mt-2 mb-1 border border-slate-200 shadow-sm')}>
            <View className={cn('w-1.5 h-1.5 rounded-full')} style={[{ backgroundColor: modeDotColor }]} />
            <Text className={cn('text-sm font-bold text-slate-500')}>{modeLabel[activeMode]}</Text>
          </View>

          <View className={cn('flex-row items-center px-3.5 py-[7px] bg-rose-50/50 border-b border-slate-200')}>
            <Text className={cn('text-sm font-extrabold text-slate-600')} style={[{ flex: 1 }]}>{totalQty} รายการ</Text>
            <Text className={cn('text-sm font-bold text-slate-500')} style={[{ width: 44, textAlign: 'center' }]}>จน.</Text>
            <Text className={cn('text-sm font-bold text-slate-500')} style={[{ width: 72, textAlign: 'right' }]}>ราคา</Text>
            <Text className={cn('text-sm font-bold')} style={[{ width: 68, textAlign: 'right', color: '#a16207' }]}>ลด</Text>
            <Text className={cn('text-sm font-bold text-slate-500')} style={[{ width: 82, textAlign: 'right' }]}>สุทธิ</Text>
          </View>

          <ScrollView className={cn('flex-1')} showsVerticalScrollIndicator={false}>
            {showItems.length === 0
              ? <Text className={cn('p-5 text-center text-slate-500 text-xs font-medium')}>ยังไม่มีสินค้า</Text>
              : showItems.map((item, idx) => (
                <View key={item.id} className={cn('flex-row items-center px-3.5 py-[9px] border-b border-neutral-100', idx % 2 === 1 && 'bg-rose-50/30')}>
                  <Text className={cn('text-xs font-medium text-slate-400 w-[20px]')}>{idx + 1}.</Text>
                  <Text className={cn('flex-1 text-xs font-medium text-slate-900')} numberOfLines={1}>{item.name}</Text>
                  <Text className={cn('text-xs font-medium text-slate-800')} style={[{ width: 44, textAlign: 'center' }]}>{item.qty}</Text>
                  <Text className={cn('text-xs font-medium text-slate-800')} style={[{ width: 72, textAlign: 'right' }]}>฿{fmt(item.unitPrice)}</Text>
                  <Text className={cn('text-xs font-medium')} style={[{ width: 68, textAlign: 'right', color: item.discAmt > 0 ? '#a16207' : '#d1d5db' }]}>
                    {item.discAmt > 0 ? `-฿${fmt(item.discAmt)}` : '—'}
                  </Text>
                  <Text className={cn('text-xs font-bold')} style={[{ width: 82, textAlign: 'right', color: '#292524' }]}>
                    ฿{fmt(item.subtotal)}
                  </Text>
                </View>
              ))
            }
          </ScrollView>

          <View className={cn('p-3.5 gap-1 border-t border-slate-200 bg-rose-50/50')}>
            <View className={cn('flex-row justify-between')}>
              <Text className={cn('text-xs font-medium text-slate-500')}>รวม</Text>
              <Text className={cn('text-xs font-medium text-slate-800')}>฿ {fmt(subtotal)}</Text>
            </View>
            <View className={cn('flex-row justify-between')}>
              <Text className={cn('text-xs font-medium text-amber-600')}>ส่วนลด</Text>
              <Text className={cn('text-xs font-medium text-amber-600')}>
                {discTotal > 0 ? `-฿ ${fmt(discTotal)}` : '฿ 0.00'}
              </Text>
            </View>
            <View className={cn('h-px bg-slate-200 my-0.5')} />
            <View className={cn('flex-row justify-between')}>
              <Text className={cn('text-xs font-bold text-slate-800')}>ยอดรวมสุทธิ</Text>
              <Text className={cn('text-lg font-extrabold')} style={[{ color: modeColor }]}>฿ {fmt(grand)}</Text>
            </View>
          </View>
        </View>

        <View className={cn('w-[44%] bg-white p-4 flex-col gap-2.5')}>
          <View className={cn('flex-row items-center gap-2 pb-2.5 border-b border-slate-200')}>
            <View className={cn('w-7 h-7 rounded-full bg-rose-50 items-center justify-center')}>
              <Ionicons name="storefront-outline" size={15} color="#e11d48" />
            </View>
            <Text className={cn('text-xs font-extrabold text-slate-800 flex-1')} numberOfLines={1}>{store.shopName}</Text>
          </View>

          {store.memberInfo && (
            <View className={cn('rounded-xl p-2.5', 'bg-amber-50')}>
              <Text className={cn('text-xs font-bold text-amber-600')}>{store.memberInfo.name}</Text>
              <View className={cn('flex-row justify-between mt-1')}>
                <View className={cn('flex-row items-center gap-1')}>
                  <Ionicons name="star" size={12} color="#d97706" />
                  <Text className={cn('text-[11px] font-medium text-amber-600')}>{store.memberInfo.points.toLocaleString()} pts</Text>
                </View>
                <View className={cn('flex-row items-center gap-1')}>
                  <Ionicons name="wallet-outline" size={12} color="#059669" />
                  <Text className={cn('text-[11px] font-bold text-emerald-600')}>฿{store.memberInfo.wallet.toLocaleString()}</Text>
                </View>
              </View>
              <Text className={cn('text-xs font-medium text-amber-600 mt-0.5')}>ระดับ: {store.memberInfo.level}</Text>
            </View>
          )}

          <Text className={cn('text-sm font-bold text-slate-500')}>ยอดชำระเงิน</Text>
          {renderAmountBox()}
          {renderBanner()}

          <View className={cn('flex-1 rounded-2xl overflow-hidden bg-slate-700 min-h-[80px] relative')}>
            {activeMode === 'payment_pending' && (
              <View className={cn('absolute inset-0 items-center justify-center gap-2 z-10 rounded-2xl')} style={[{ backgroundColor: 'rgba(249,115,22,0.88)' }]}>
                <Ionicons name="card-outline" size={48} color="#a16207" />
                <Text className={cn('text-lg font-extrabold text-center text-amber-600')}>กรุณาชำระเงิน</Text>
                <Animated.Text className={cn('text-[28px] font-extrabold text-amber-600 tracking-wide')} style={[{ transform: [{ scale: pulseAnim }] }]}>
                  ฿ {fmt(grand)}
                </Animated.Text>
              </View>
            )}
            {activeMode === 'payment_success' && (
              <View className={cn('absolute inset-0 items-center justify-center gap-2 z-10 rounded-2xl')} style={[{ backgroundColor: 'rgba(22,163,74,0.88)' }]}>
                <Ionicons name="checkmark-circle" size={56} color="#fafafa" />
                <Text className={cn('text-lg font-extrabold text-center text-white')}>ชำระเงินสำเร็จ!</Text>
                {store.changeAmount > 0 && (
                  <Text className={cn('text-lg font-extrabold text-white tracking-wide')}>
                    เงินทอน ฿ {fmt(store.changeAmount)}
                  </Text>
                )}
              </View>
            )}
            <AdSlide />
          </View>
        </View>
      </View>
    </View>
  );
};
