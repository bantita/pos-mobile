import { PropsWithChildren, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <Pressable
        className={cn('flex-row items-center gap-2', isOpen && 'opacity-70')}
        onPress={() => setIsOpen((value) => !value)}
      >
        <View className="h-6 w-6 items-center justify-center rounded-xl bg-slate-100">
          <Ionicons
            name="chevron-forward"
            size={14}
            color="#475569"
            style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
          />
        </View>

        <Text className="text-sm font-medium leading-5 text-slate-600">{title}</Text>
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)}>
          <View className="ml-6 mt-4 rounded-2xl bg-slate-100 p-4">
            {children}
          </View>
        </Animated.View>
      )}
    </View>
  );
}
