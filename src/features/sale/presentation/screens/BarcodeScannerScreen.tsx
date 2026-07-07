/**
 * SCR-SALE-002 — Barcode Scanner Screen
 * FR-SALE-002: ใช้ Camera หรือ Bluetooth Scanner ค้นหาสินค้าจาก Barcode
 */
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Vibration, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { useCartStore } from '@/features/sale/application/stores/cartStore';
import { Product } from '@/features/sale/domain/sale';
import { formatCurrency } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Text, TextInput } from '@/shared/tw/index';

// Mock barcode lookup
const BARCODE_MAP: Record<string, Product> = {
  '8850999000001': { id: '1', code: 'P001', barcode: '8850999000001', name: 'น้ำดื่มสิงห์ 600ml', category: 'เครื่องดื่ม', price: 10, cost: 6, vatIncluded: true, vatRate: 7, unit: 'ขวด', stockQty: 100 },
  '8850999000002': { id: '2', code: 'P002', barcode: '8850999000002', name: 'น้ำอัดลม Pepsi 325ml', category: 'เครื่องดื่ม', price: 15, cost: 9, vatIncluded: true, vatRate: 7, unit: 'กระป๋อง', stockQty: 50 },
};

interface BarcodeScannerScreenProps {
  onBack: () => void;
  onProductFound?: (product: Product) => void;
}

type ScanStatus = 'idle' | 'found' | 'not_found';

export const BarcodeScannerScreen: React.FC<BarcodeScannerScreenProps> = ({
  onBack,
  onProductFound,
}) => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const feedbackAnim = new Animated.Value(0);
  const { addItem } = useCartStore();

  useEffect(() => {
    // Request camera permission
    setHasPermission(true); // assume granted for now
  }, []);

  const handleBarcode = (barcode: string) => {
    if (!barcode.trim()) return;
    const product = BARCODE_MAP[barcode.trim()];
    if (product) {
      setFoundProduct(product);
      setScanStatus('found');
      Vibration.vibrate(80);
      showFeedback();
    } else {
      setFoundProduct(null);
      setScanStatus('not_found');
      Vibration.vibrate([0, 100, 50, 100]);
      showFeedback();
    }
    setScanCount((c) => c + 1);
  };

  const showFeedback = () => {
    feedbackAnim.setValue(0);
    Animated.sequence([
      Animated.timing(feedbackAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(feedbackAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setScanStatus('idle'));
  };

  const handleAddToCart = () => {
    if (foundProduct) {
      addItem(foundProduct);
      onProductFound?.(foundProduct);
      setManualBarcode('');
      setScanStatus('idle');
      setFoundProduct(null);
    }
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-[#f6f7fb]')} edges={['top']}>
      {/* Header */}
      <View className={cn('flex-row items-center justify-between px-3 py-3')}>
        <TouchableOpacity onPress={onBack} className={cn('p-1')}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className={cn('text-lg font-semibold text-white')}>สแกน Barcode</Text>
        <View className={cn('bg-[rgba(255,255,255,0.15)] px-2 py-1 rounded-full')}>
          <Text className={cn('text-xs text-white')}>{scanCount} รายการ</Text>
        </View>
      </View>

      {/* Camera Viewfinder Area */}
      <View className={cn('flex-1 items-center justify-center relative')}>
        {hasPermission === false ? (
          <View className={cn('items-center gap-3')}>
            <Ionicons name="camera-outline" size={56} color="#9ca3af" />
            <Text className={cn('text-base leading-relaxed text-gray-400')}>ไม่ได้รับสิทธิ์เข้าถึงกล้อง</Text>
            <Text className={cn('text-base text-gray-400')}>ใช้การกรอกบาร์โค้ดด้วยตนเองได้ด้านล่าง</Text>
          </View>
        ) : (
          <>
            {/* Scanner Frame */}
            <View style={{ width: 240, height: 180, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', width: 24, height: 24, borderColor: '#f87171', top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }} />
              <View style={{ position: 'absolute', width: 24, height: 24, borderColor: '#f87171', top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }} />
              <View style={{ position: 'absolute', width: 24, height: 24, borderColor: '#f87171', bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }} />
              <View style={{ position: 'absolute', width: 24, height: 24, borderColor: '#f87171', bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }} />
              {/* Scan line animation */}
              <View className={cn('absolute left-0 right-0 h-[2px] bg-rose-500 opacity-80')} />
            </View>
            <Text className={cn('text-base text-slate-500 mt-4')}>จ่อกล้องไปที่บาร์โค้ดสินค้า</Text>
          </>
        )}

        {/* Feedback Overlay */}
        {scanStatus !== 'idle' && (
          <Animated.View
            className={cn('absolute inset-0 items-center justify-center gap-2 rounded-2xl', scanStatus === 'found' ? 'bg-[rgba(16,185,129,0.85)]' : 'bg-[rgba(239,68,68,0.85)]')}
            style={{ opacity: feedbackAnim }}
          >
            <Ionicons
              name={scanStatus === 'found' ? 'checkmark-circle' : 'close-circle'}
              size={64}
              color="#fafafa"
            />
            <Text className={cn('text-lg font-semibold text-white')}>
              {scanStatus === 'found' ? foundProduct?.name : 'ไม่พบสินค้า'}
            </Text>
            {scanStatus === 'found' && foundProduct && (
              <Text className={cn('text-xl font-semibold text-white')}>฿{formatCurrency(foundProduct.price)}</Text>
            )}
          </Animated.View>
        )}
      </View>

      {/* Found Product Card */}
      {scanStatus === 'found' && foundProduct && (
        <View className={cn('bg-white mx-3 rounded-2xl p-3 gap-2')}>
          <View className={cn('flex-row items-center gap-3')}>
            <View className={cn('w-14 h-14 rounded-xl bg-rose-50 items-center justify-center')}>
              <Ionicons name="cube-outline" size={32} color="#f87171" />
            </View>
            <View style={{ flex: 1 }}>
              <Text className={cn('text-base leading-relaxed text-slate-950 font-semibold')}>{foundProduct.name}</Text>
              <Text className={cn('text-xs text-slate-500')}>{foundProduct.code} · {foundProduct.barcode}</Text>
            </View>
            <Text className={cn('text-lg font-semibold text-rose-600')}>฿{formatCurrency(foundProduct.price)}</Text>
          </View>
          <TouchableOpacity className={cn('flex-row items-center justify-center bg-rose-500 rounded-xl py-2 gap-1')} onPress={handleAddToCart} activeOpacity={0.85}>
            <Ionicons name="add-circle" size={20} color="#fafafa" />
            <Text className={cn('text-base font-semibold text-white')}>เพิ่มลงบิล</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Not Found Card */}
      {scanStatus === 'not_found' && (
        <View className={cn('flex-row items-center gap-3 bg-rose-50 mx-3 rounded-2xl p-3')}>
          <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
          <View style={{ flex: 1 }}>
            <Text className={cn('text-xs font-semibold text-rose-600')}>ไม่พบสินค้าในระบบ</Text>
            <Text className={cn('text-xs text-rose-600')}>บาร์โค้ด: {manualBarcode}</Text>
          </View>
        </View>
      )}

      {/* Manual Input */}
      <View className={cn('bg-white p-3 border-t border-slate-200')}>
        <Text className={cn('text-xs font-semibold text-slate-500 mb-2')}>กรอกบาร์โค้ดด้วยตนเอง</Text>
        <View className={cn('flex-row gap-2')}>
          <TextInput
            className={cn('flex-1 h-12 bg-neutral-100 rounded-xl px-3 text-base leading-relaxed text-slate-950 border border-slate-200')}
            placeholder="กรอกบาร์โค้ด..."
            placeholderTextColor="#9ca3af"
            value={manualBarcode}
            onChangeText={setManualBarcode}
            keyboardType="number-pad"
            returnKeyType="search"
            onSubmitEditing={() => handleBarcode(manualBarcode)}
          />
          <TouchableOpacity
            className={cn('w-12 h-12 bg-rose-500 rounded-xl items-center justify-center')}
            onPress={() => handleBarcode(manualBarcode)}
          >
            <Ionicons name="search" size={20} color="#fafafa" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
