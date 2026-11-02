import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, BorderWidth, Spacing, ComponentSize } from '../../constants/spacing';
import { useT } from '../../i18n/useT';
import type { Language, UiKey } from '../../i18n/types';

type Size = 'md' | 'lg';

export interface LanguageToggleProps {
  value: Language;
  onChange: (l: Language) => void;
  size?: Size;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

const OPTIONS: { lang: Language; labelKey: UiKey }[] = [
  { lang: 'th', labelKey: 'common.langShort.th' },
  { lang: 'en', labelKey: 'common.langShort.en' },
];

/** ตัวเลือกภาษาแบบ segmented (TH | EN) — controlled component */
export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  value,
  onChange,
  size = 'md',
  accessibilityLabel,
  style,
}) => {
  const t = useT();
  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel}
    >
      {OPTIONS.map(({ lang, labelKey }) => {
        const selected = value === lang;
        return (
          <TouchableOpacity
            key={lang}
            onPress={() => onChange(lang)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.segment, styles[`size_${size}`], selected && styles.segmentSelected]}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{t(labelKey)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  segment: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
  },
  segmentSelected: { backgroundColor: Colors.primary },
  // Sizes — ขั้นต่ำ 44 (ComponentSize.button.md) ตามกฎ accessibility
  size_md: { minHeight: ComponentSize.button.md, minWidth: ComponentSize.button.md },
  size_lg: { minHeight: ComponentSize.button.lg, minWidth: ComponentSize.button.lg },
  text: { ...Typography.button, color: Colors.text },
  textSelected: { color: Colors.white },
});
