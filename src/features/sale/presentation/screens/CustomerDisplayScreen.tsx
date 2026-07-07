/**
 * CustomerDisplayScreen — จอที่ 2 (หันหน้าให้ลูกค้า)
 * Modes:
 *   idle              → Slideshow โฆษณา (รูป/วิดีโอ)
 *   cart              → รายการสินค้า + ยอดเงิน + ส่วนลด
 *   payment_pending   → ยอดที่ต้องชำระ (pulse)
 *   payment_success   → ชำระสำเร็จ + เงินทอน
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, Animated, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { useCartStore } from '@/features/sale/application/stores/cartStore';
import { useCustomerDisplayStore } from '@/features/customer-display/application/stores/customerDisplayStore';
import { CartItem } from '@/features/sale/domain/sale';
import { formatCurrency } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

const { width: W, height: H } = Dimensions.get('window');

// ─── Ad Slide ─────────────────────────────────────────────────────────────────
const AdSlide: React.FC<{
  uri: string;
  title?: string;
  subtitle?: string;
  type: 'image' | 'video';
}> = ({ uri, title, subtitle, type }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    return () => fadeAnim.setValue(0);
  }, [uri]);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        resizeMode="cover"
      />
      <View className={cn('absolute inset-0')} style={{ backgroundColor: 'rgba(0,0,0,0.35)' }} />
      {(title || subtitle) && (
        <View className={cn('absolute bottom-20 left-0 right-0 px-5 gap-1')}>
          {title && (
            <Text className={cn('text-[36px] font-extrabold text-white')} style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 6 }}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text className={cn('text-xl text-white/90')} style={{ textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </Animated.View>
  );
};

// ─── Idle Screen (Ad Slideshow) ───────────────────────────────────────────────
const IdleScreen: React.FC = () => {
  const { ads, currentAdIndex, nextAd, shopName } = useCustomerDisplayStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dotAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (ads.length === 0) return;
    const current = ads[currentAdIndex];
    timerRef.current = setInterval(() => {
      nextAd();
    }, (current?.duration ?? 5) * 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentAdIndex, ads]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (ads.length === 0) {
    return (
      <View className={cn('flex-1 items-center justify-center bg-rose-500 gap-4')}>
        <Ionicons name="storefront" size={100} color="#f87171" />
        <Text className={cn('text-[40px] font-extrabold text-white')}>{shopName}</Text>
        <Text className={cn('text-2xl text-white/80')}>ยินดีต้อนรับ</Text>
      </View>
    );
  }

  const currentAd = ads[currentAdIndex];

  return (
    <View className={cn('flex-1 relative')}>
      <AdSlide
        key={currentAd.id}
        uri={currentAd.uri}
        title={currentAd.title}
        subtitle={currentAd.subtitle}
        type={currentAd.type}
      />

      <View className={cn('absolute top-3 left-3 flex-row items-center gap-1 bg-black/30 rounded-full px-2 py-[5px]')}>
        <Ionicons name="storefront" size={16} color="rgba(255,255,255,0.8)" />
        <Text className={cn('text-base text-white/90 font-semibold')}>{shopName}</Text>
      </View>

      <View className={cn('absolute bottom-6 left-0 right-0 flex-row justify-center gap-2')}>
        {ads.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => useCustomerDisplayStore.getState().setMode('idle')}>
            <View
              className={cn('h-2 rounded-full', i === currentAdIndex ? 'w-6' : 'w-2')}
              style={{ backgroundColor: i === currentAdIndex ? '#fafafa' : 'rgba(255,255,255,0.4)' }}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Cart Screen ──────────────────────────────────────────────────────────────
const CartScreen: React.FC = () => {
  const { items, discount, getSubtotal, getDiscountTotal, getVatAmount, getGrandTotal, getItemCount } = useCartStore();
  const { shopName } = useCustomerDisplayStore();
  const subtotal    = getSubtotal();
  const discTotal   = getDiscountTotal();
  const vatAmount   = getVatAmount();
  const grandTotal  = getGrandTotal();
  const itemCount   = getItemCount();

  const renderItem = ({ item, index }: { item: CartItem; index: number }) => (
    <View className={cn('flex-row items-center px-4 py-2 border-b border-white/8', index % 2 === 1 && 'bg-white/5')}>
      <View className={cn('flex-1 flex-row items-center gap-2')}>
        <View className={cn('w-8 h-8 rounded-full bg-white items-center justify-center')}>
          <Text className={cn('text-sm font-extrabold text-slate-950')}>{item.qty}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text className={cn('text-xs font-semibold text-white font-medium')} numberOfLines={1}>{item.product.name}</Text>
          <Text className={cn('text-xs text-white/60')}>
            {item.product.unit} · ฿{formatCurrency(item.unitPrice)}
            {item.discountAmount > 0 && ` (-฿${formatCurrency(item.discountAmount)})`}
          </Text>
        </View>
      </View>
      <Text className={cn('text-lg font-bold text-white')}>฿{formatCurrency(item.subtotal)}</Text>
    </View>
  );

  return (
    <View className={cn('flex-1 bg-rose-500')}>
      <View className={cn('flex-row items-center gap-2 px-4 py-3 bg-rose-600')}>
        <Ionicons name="storefront" size={20} color="#fafafa" />
        <Text className={cn('text-lg font-semibold text-white flex-1')}>{shopName}</Text>
        <View className={cn('bg-white rounded-full px-2 py-[3px]')}>
          <Text className={cn('text-xs text-slate-950 font-bold')}>{itemCount} รายการ</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View className={cn('flex-1 items-center justify-center gap-3')}>
          <Ionicons name="cart-outline" size={80} color="#fca5a5" />
          <Text className={cn('text-2xl text-rose-400')}>กรุณาเลือกสินค้า</Text>
        </View>
      ) : (
        <>
          <View className={cn('flex-row px-4 py-1 border-b border-white/15')}>
            <Text className={cn('text-xs text-white/60 font-bold uppercase flex-1')}>สินค้า</Text>
            <Text className={cn('text-xs text-white/60 font-bold uppercase')} style={{ width: 80, textAlign: 'right' }}>ยอด</Text>
          </View>

          <FlatList
            data={items}
            keyExtractor={(i) => i.product.id}
            renderItem={renderItem}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      <View className={cn('bg-black/40 p-4 gap-2')}>
        <View className={cn('gap-1')}>
          <View className={cn('flex-row justify-between items-center')}>
            <Text className={cn('text-base leading-relaxed text-white/75')}>ราคารวมสินค้า</Text>
            <Text className={cn('text-base leading-relaxed text-white')}>฿{formatCurrency(subtotal)}</Text>
          </View>

          {discTotal > 0 && (
            <View className={cn('flex-row justify-between items-center')}>
              <View className={cn('flex-row items-center')}>
                <View className={cn('flex-row items-center gap-1 bg-rose-500 rounded-full px-2 py-[3px]')}>
                  <Ionicons name="pricetag-outline" size={12} color="#fafafa" />
                  <Text className={cn('text-xs text-white font-bold')}>
                    {discount?.type === 'percent' ? `ลด ${discount.value}%` : 'ส่วนลด'}
                  </Text>
                </View>
              </View>
              <Text className={cn('text-base leading-relaxed text-rose-600 font-bold')}>-฿{formatCurrency(discTotal)}</Text>
            </View>
          )}

          <View className={cn('flex-row justify-between items-center')}>
            <Text className={cn('text-base leading-relaxed text-white/75')}>VAT 7% (รวมแล้ว)</Text>
            <Text className={cn('text-base leading-relaxed text-white')}>฿{formatCurrency(vatAmount)}</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 }} />

        <View className={cn('flex-row justify-between items-center')}>
          <Text className={cn('text-2xl font-bold text-white')}>ยอดรวมสุทธิ</Text>
          <Text className={cn('text-[44px] font-black text-white')} style={{ letterSpacing: 1 }}>฿{formatCurrency(grandTotal)}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Payment Pending ──────────────────────────────────────────────────────────
const PaymentPendingScreen: React.FC = () => {
  const { getGrandTotal } = useCartStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View className={cn('flex-1 bg-amber-500 items-center justify-center gap-4 p-5')}>
      <View className={cn('w-[100px] h-[100px] rounded-full bg-white/20 items-center justify-center')}>
        <Ionicons name="card-outline" size={56} color="#fafafa" />
      </View>
      <Text className={cn('text-[32px] font-bold text-white')}>กรุณาชำระเงิน</Text>
      <Animated.Text className={cn('text-[64px] font-black text-white')} style={{ transform: [{ scale: pulseAnim }] }}>
        ฿{formatCurrency(getGrandTotal())}
      </Animated.Text>
      <View className={cn('flex-row gap-5 mt-3')}>
        {[
          { icon: 'cash-outline', label: 'เงินสด' },
          { icon: 'qr-code-outline', label: 'QR Code' },
          { icon: 'card-outline', label: 'บัตรเครดิต' },
          { icon: 'phone-portrait-outline', label: 'โอนเงิน' },
        ].map((p) => (
          <View key={p.label} className={cn('items-center gap-1')}>
            <Ionicons name={p.icon as any} size={28} color="#fafafa" />
            <Text className={cn('text-xs text-white/80')}>{p.label}</Text>
          </View>
        ))}
      </View>
      <Text className={cn('text-base leading-relaxed text-white/70')}>กำลังรอการยืนยัน...</Text>
    </View>
  );
};

// ─── Payment Success ──────────────────────────────────────────────────────────
const PaymentSuccessScreen: React.FC = () => {
  const { paidAmount, changeAmount, getGrandTotal } = { ...useCustomerDisplayStore(), ...useCartStore() };
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const grandTotal = useCartStore.getState().getGrandTotal();

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }).start();
  }, []);

  return (
    <View className={cn('flex-1 bg-emerald-500 items-center justify-center gap-4 p-5')}>
      <Animated.View className={cn('w-40 h-40 rounded-full bg-white/20 items-center justify-center')} style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons name="checkmark" size={80} color="#fafafa" />
      </Animated.View>
      <Text className={cn('text-[36px] font-extrabold text-white')}>ชำระเงินสำเร็จ</Text>
      <Text className={cn('text-[56px] font-black text-white')}>฿{formatCurrency(grandTotal)}</Text>

      {paidAmount > 0 && (
        <View className={cn('w-4/5 bg-white/15 rounded-2xl p-4 gap-2')}>
          <View className={cn('flex-row justify-between')}>
            <Text className={cn('text-base leading-relaxed text-white/80')}>รับเงิน</Text>
            <Text className={cn('text-base leading-relaxed text-white font-bold')}>฿{formatCurrency(paidAmount)}</Text>
          </View>
          {changeAmount > 0 && (
            <View className={cn('bg-white/15 rounded-xl p-2 flex-row justify-between')}>
              <Text className={cn('text-lg font-semibold text-white')}>เงินทอน</Text>
              <Text className={cn('text-xl font-semibold text-white font-black')}>฿{formatCurrency(changeAmount)}</Text>
            </View>
          )}
        </View>
      )}
      <View className={cn('flex-row items-center gap-3')}>
        <Ionicons name="heart-circle" size={30} color="#ffffff" />
        <Text className={cn('text-[28px] text-white/90')}>ขอบคุณที่ใช้บริการ</Text>
      </View>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface CustomerDisplayScreenProps {
  mode?: 'idle' | 'cart' | 'payment_pending' | 'payment_success';
  paidAmount?: number;
  changeAmount?: number;
  shopName?: string;
}

export const CustomerDisplayScreen: React.FC<CustomerDisplayScreenProps> = ({
  mode: propMode,
  paidAmount = 0,
  changeAmount = 0,
  shopName,
}) => {
  const store = useCustomerDisplayStore();
  const activeMode = propMode ?? store.mode;

  useEffect(() => {
    if (paidAmount) store.setPaidInfo(paidAmount, changeAmount);
    if (shopName) store.setShopName(shopName);
  }, [paidAmount, changeAmount, shopName]);

  return (
    <SafeAreaView className={cn('flex-1 bg-slate-950')} edges={['top', 'bottom']}>
      {activeMode === 'idle'             && <IdleScreen />}
      {activeMode === 'cart'             && <CartScreen />}
      {activeMode === 'payment_pending'  && <PaymentPendingScreen />}
      {activeMode === 'payment_success'  && <PaymentSuccessScreen />}
    </SafeAreaView>
  );
};
