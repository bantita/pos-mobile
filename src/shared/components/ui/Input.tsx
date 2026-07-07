import React from 'react';
import { AppInput } from '@/shared/ui/index';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  isPassword?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: string;
  rightIcon?: React.ReactNode;
  containerStyle?: any;
  multiline?: boolean;
}

export const Input: React.FC<InputProps> = ({ secureTextEntry, isPassword, leftIcon, ...rest }) => (
  <AppInput secureTextEntry={secureTextEntry || isPassword} {...rest} />
);
