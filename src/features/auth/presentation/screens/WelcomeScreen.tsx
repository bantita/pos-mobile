import React, { useEffect, useRef } from 'react';
import { View, StatusBar, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  onLogin: () => void;
  onRegister: () => void;
  appVersion?: string;
  isOnline?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onLogin,
  onRegister,
  appVersion = '1.0.0',
  isOnline = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {!isOnline && (
        <View className="flex-row items-center justify-center bg-amber-500 py-1 gap-1">
          <Ionicons name="cloud-offline-outline" size={14} color="#fafafa" />
          <Text className="text-xs font-semibold text-white">ไม่มีการเชื่อมต่ออินเทอร์เน็ต</Text>
        </View>
      )}

      <View className="flex-1 items-center justify-center px-5">
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]} className="items-center mb-6">
          <View className="w-[120px] h-[120px] rounded-full bg-rose-50 items-center justify-center mb-4 border-[3px] border-rose-200 shadow-lg shadow-rose-500/40">
            <Ionicons name="storefront" size={56} color="#f43f5e" />
          </View>
          <Text className="text-[26px] font-extrabold text-slate-950 mb-1">POS Mobile</Text>
          <Text className="text-base font-medium text-slate-500">ระบบขายหน้าร้านบนมือถือ</Text>
        </Animated.View>

        <Animated.View style={[{ opacity: fadeAnim }]} className="gap-2">
          {[
            { icon: 'phone-portrait-outline', label: 'ใช้งานบน iOS & Android' },
            { icon: 'cloud-offline-outline', label: 'รองรับ Offline' },
            { icon: 'business-outline', label: 'รองรับหลายสาขา' },
          ].map((f, i) => (
            <View key={i} className="flex-row items-center gap-2">
              <Ionicons name={f.icon as any} size={18} color="#fecdd3" />
              <Text className="text-base font-medium text-slate-500">{f.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]} className="px-5 pb-5 gap-3">
        <Button
          title="มีบัญชีอยู่แล้ว — เข้าสู่ระบบ"
          onPress={onLogin}
          variant="primary"
          size="lg"
          fullWidth
          style={{ backgroundColor: '#f43f5e' }}
        />
        <Button
          title="สมัครร้านค้าใหม่"
          onPress={onRegister}
          variant="outline"
          size="lg"
          fullWidth
          style={{ borderColor: '#fecdd3', backgroundColor: '#fff1f2' }}
        />
        <Text className="text-xs font-medium text-slate-500 text-center">v{appVersion}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};
