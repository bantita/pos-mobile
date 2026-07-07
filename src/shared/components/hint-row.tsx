import type { ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HintRowProps) {
  return (
    <View className={cn('flex-row justify-between')}>
      <Text className="text-sm font-medium leading-5 text-slate-600">{title}</Text>
      <View className="rounded-lg bg-slate-100 px-2 py-0.5">
        <Text className="text-sm font-medium leading-5 text-slate-500">{hint}</Text>
      </View>
    </View>
  );
}
