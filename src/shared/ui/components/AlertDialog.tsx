import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import React from 'react';
import { Text, TouchableOpacity, View } from '@/shared/tw/index';
import { AppModal } from '@/shared/ui/components/AppModal';

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface AlertDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: AlertVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  persistent?: boolean;
}

const ICON_MAP: Record<AlertVariant, { icon: string; color: string; bg: string; btnClass: string }> = {
  info: {
    icon: 'information-circle-outline',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    btnClass: 'bg-rose-500',
  },
  success: {
    icon: 'checkmark-circle-outline',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    btnClass: 'bg-emerald-600',
  },
  warning: {
    icon: 'warning-outline',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    btnClass: 'bg-amber-500',
  },
  danger: {
    icon: 'close-circle-outline',
    color: 'text-red-700',
    bg: 'bg-red-50',
    btnClass: 'bg-red-500',
  },
};

const COLOR_MAP: Record<string, string> = {
  info: '#7c3aed',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
};

export const AlertDialog: React.FC<AlertDialogProps> = ({
  visible, onClose, title, message, variant = 'info',
  confirmLabel = 'ตกลง', cancelLabel = 'ยกเลิก',
  onConfirm, onCancel, persistent = false,
}) => {
  const cfg = ICON_MAP[variant];

  const footer = (
    <View className="flex-row gap-3">
      {onCancel && (
        <TouchableOpacity
          className="min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4"
          onPress={() => { onCancel(); onClose(); }}
        >
          <Text className="text-sm font-bold text-slate-700">{cancelLabel}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        className={cn('min-h-10 flex-1 items-center justify-center rounded-xl px-4 shadow-sm', cfg.btnClass)}
        onPress={() => { onConfirm?.(); onClose(); }}
      >
        <Text className="text-sm font-bold text-white">{confirmLabel}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AppModal visible={visible} onClose={onClose} size="sm" persistent={persistent} footer={footer}>
      <View className="items-center gap-4 py-4">
        <View className={cn('h-14 w-14 items-center justify-center rounded-2xl', cfg.bg)}>
          <Ionicons name={cfg.icon as any} size={24} color={COLOR_MAP[variant]} />
        </View>
        <Text className="text-center text-lg font-bold text-slate-900">{title}</Text>
        <Text className="text-center text-sm font-medium leading-6 text-slate-500">{message}</Text>
      </View>
    </AppModal>
  );
};
