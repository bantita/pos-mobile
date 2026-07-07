import React from 'react';
import { type TextProps } from 'react-native';
import { Colors } from '@/shared/ui/index';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/tw/index';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
};

const typeClasses: Record<string, string> = {
  default: 'text-base font-medium leading-6',
  title: 'text-[48px] font-semibold leading-[52px]',
  small: 'text-sm font-medium leading-5',
  smallBold: 'text-sm font-bold leading-5',
  subtitle: 'text-[32px] font-semibold leading-[44px]',
  link: 'text-sm leading-[30px]',
  linkPrimary: 'text-sm leading-[30px] text-blue-500',
  code: '',
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  return (
    <Text
      className={cn(typeClasses[type])}
      style={[{ color: Colors.text }, type === 'code' && { fontSize: 12 }, style]}
      {...rest}
    />
  );
}
