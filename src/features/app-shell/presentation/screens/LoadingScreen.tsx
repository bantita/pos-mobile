import React, { useEffect, useRef } from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { Text } from '@/shared/tw/index';

interface Props {
  message?: string;
  progress?: number;
}

export const LoadingScreen: React.FC<Props> = ({
  message = 'กำลังโหลดข้อมูล...',
  progress,
}) => {
  const pulseAnim    = useRef(new Animated.Value(0.85)).current;
  const rotateAnim   = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const progressTrackWidth = Math.min(Math.max(width * 0.6, 220), 420);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.85, duration: 900, useNativeDriver: true }),
      ])
    );
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
    );
    pulseLoop.start();
    rotateLoop.start();
    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, [pulseAnim, rotateAnim]);

  useEffect(() => {
    if (progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: progress / 100,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, progressAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-[#f6f7fb]">
      <View className="absolute -top-20 -right-20 w-[280px] h-[280px] rounded-[140px]" style={{ backgroundColor: '#fca5a530' }} />
      <View className="absolute -bottom-15 -left-15 w-[220px] h-[220px] rounded-[110px]" style={{ backgroundColor: '#fafafa60' }} />
      <View className="absolute top-[40%] -left-10 w-[120px] h-[120px] rounded-[60px]" style={{ backgroundColor: '#e0f2fe80' }} />

      <View className="items-center gap-3 px-5">
        <Animated.View style={[{ transform: [{ scale: pulseAnim }] }]}>
          <View
            className="w-[110px] h-[110px] rounded-full bg-rose-50 items-center justify-center mb-1"
            style={{ shadowColor: '#f87171', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, boxShadow: '0 24px 64px rgba(15, 23, 42, 0.18)' }}
          >
            <View className="w-[84px] h-[84px] rounded-full bg-white items-center justify-center">
              <Ionicons name="storefront" size={48} color="#f87171" />
            </View>
          </View>
        </Animated.View>

        <Text className="text-[32px] font-extrabold text-slate-950 tracking-[0.5px]">POS Mobile</Text>
        <Text className="text-base leading-[26px] text-slate-500">ระบบขายหน้าร้านบนมือถือ</Text>

        <View className="w-12 h-12 items-center justify-center mt-2">
          <Animated.View style={[{ transform: [{ rotate: spin }] }]}>
            <View className="w-10 h-10 rounded-full border-[3px] items-start justify-start" style={{ borderColor: '#fca5a5', borderTopColor: '#f87171' }}>
              <View className="w-2 h-2 rounded-full bg-rose-500 absolute -top-[5px] left-3" />
            </View>
          </Animated.View>
        </View>

        {progress !== undefined ? (
          <View className="h-[6px] rounded-[3px] overflow-hidden mt-1" style={{ width: progressTrackWidth, backgroundColor: '#e7e5e4' }}>
            <Animated.View className="h-full rounded-[3px] bg-rose-500" style={{ width: progressWidth }} />
          </View>
        ) : (
          <View className="h-[6px] rounded-[3px] overflow-hidden mt-1" style={{ width: progressTrackWidth, backgroundColor: '#e7e5e4' }}>
            <Animated.View
              className="h-full rounded-[3px] bg-rose-500 w-[45%]"
              style={{
                transform: [{
                  translateX: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-progressTrackWidth, progressTrackWidth],
                  }),
                }],
              }}
            />
          </View>
        )}

        <Text className="text-base leading-[22px] text-slate-500 text-center">{message}</Text>
        {progress !== undefined && (
          <Text className="text-xs font-semibold leading-[18px] text-rose-600 font-bold">{Math.round(progress)}%</Text>
        )}
      </View>

      <View className="absolute bottom-5">
        <Text className="text-xs leading-[18px] text-slate-500">Powered by POS Mobile v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};
