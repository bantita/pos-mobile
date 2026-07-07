import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, useColorScheme, View } from 'react-native';
import { cn } from '@/shared/lib/cn';
import { ExternalLink } from '@/shared/components/external-link';
import { Text } from '@/shared/tw/index';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <View className={cn('rounded-2xl px-4 py-1', isFocused ? 'bg-slate-200' : 'bg-slate-100')}>
        <Text className={cn('text-sm font-medium leading-5', isFocused ? 'text-slate-900' : 'text-slate-500')}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const tintColor = scheme === 'dark' ? '#fafafa' : '#09090b';

  return (
    <View {...props} className="absolute w-full flex-row items-center justify-center p-4">
      <View className="flex-row grow items-center gap-2 rounded-[32px] bg-slate-100 px-8 py-2" style={{ maxWidth: 800 }}>
        <Text className="mr-auto text-sm font-bold leading-5 text-slate-900">
          Expo Starter
        </Text>

        {props.children}

        <ExternalLink href="https://docs.expo.dev" asChild>
          <Pressable className="ml-4 flex-row items-center justify-center gap-1">
            <Text className="text-sm font-medium leading-5 text-blue-600 underline">Docs</Text>
          </Pressable>
        </ExternalLink>
      </View>
    </View>
  );
}
