import { Ionicons } from '@/shared/icons/lucideAdapter';
import { cn } from '@/shared/lib/cn';
import React from 'react';
import { Text, TouchableOpacity, View } from '@/shared/tw/index';
import { AppModal } from '@/shared/ui/components/AppModal';

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  persistent?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible, onClose, title, message,
  confirmLabel = 'ยืนยัน', cancelLabel = 'ยกเลิก',
  onConfirm, onCancel, variant = 'info',
  loading, persistent = false,
}) => {
  const iconName = variant === 'danger' ? 'warning-outline' : variant === 'warning' ? 'alert-circle-outline' : 'help-circle-outline';
  const iconColor = variant === 'danger' ? '#dc2626' : variant === 'warning' ? '#d97706' : '#7c3aed';
  const iconBg = variant === 'danger' ? 'bg-red-50' : variant === 'warning' ? 'bg-amber-50' : 'bg-violet-50';
  const confirmBg = variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-rose-500';

  const footer = (
    <View className="flex-row gap-3">
      <TouchableOpacity
        className="min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4"
        onPress={() => { onCancel?.(); onClose(); }}
        disabled={loading}
      >
        <Text className="text-sm font-bold text-slate-700">{cancelLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={cn('min-h-10 flex-1 items-center justify-center rounded-xl px-4 shadow-sm', confirmBg, loading && 'opacity-50')}
        onPress={onConfirm}
        disabled={loading}
      >
        <Text className="text-sm font-bold text-white">{loading ? 'กำลังดำเนินการ...' : confirmLabel}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AppModal visible={visible} onClose={onClose} size="sm" persistent={persistent} footer={footer}>
      <View className="items-center gap-4 py-4">
        <View className={cn('h-14 w-14 items-center justify-center rounded-2xl', iconBg)}>
          <Ionicons name={iconName as any} size={24} color={iconColor} />
        </View>
        <Text className="text-center text-lg font-bold text-slate-900">{title}</Text>
        <Text className="text-center text-sm font-medium leading-6 text-slate-500">{message}</Text>
      </View>
    </AppModal>
  );
};
