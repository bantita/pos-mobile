import React from 'react';
import { AppButton } from '@/shared/ui/index';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: any;
  textStyle?: any;
}

export const Button: React.FC<ButtonProps> = ({ title, textStyle, ...rest }) => (
  <AppButton label={title} {...rest} />
);
