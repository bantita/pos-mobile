/**
 * AppModal — Unified modal with blur background
 * Rounded, responsive, consistent across all pages.
 */
import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, ViewStyle } from 'react-native';
import { Colors, Radius, Space, Font, Shadow, ZIndex } from '../tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  style?: ViewStyle;
}

export const AppModal: React.FC<Props> = ({
  visible, onClose, title, subtitle, children, footer, width = 480, style,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={s.overlay}>
      <View style={[s.container, { width, maxWidth: '92%' }, style]}>
        {/* Header */}
        {title && (
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{title}</Text>
              {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Body */}
        <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>

        {/* Footer */}
        {footer && <View style={s.footer}>{footer}</View>}
      </View>
    </View>
  </Modal>
);

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space['2xl'],
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    maxHeight: '85%',
    ...Shadow.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Space.xl,
    paddingBottom: Space.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { ...Font.h3, color: Colors.text },
  subtitle: { ...Font.bodySm, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
  body: { padding: Space.xl },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Space.sm,
    padding: Space.xl,
    paddingTop: Space.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
