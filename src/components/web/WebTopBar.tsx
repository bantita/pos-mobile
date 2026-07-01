import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebColors } from '../../constants/webColors';
import { Colors, Space, Radius, Shadow, Font } from '../../design-system/tokens';
import { useAuthStore } from '../../store/authStore';
import { ROLE_LABELS } from '../../constants/rolePermissions';

interface Props {
  pageName: string;
  shopName?: string;
  posName?: string;
  onMenuPress?: () => void;
}

export const WebTopBar: React.FC<Props> = ({
  pageName,
  shopName: shopNameProp,
  posName  = 'POS 1',
  onMenuPress,
}) => {
  const { width } = useWindowDimensions();
  const isSmall = width < 768;

  const user = useAuthStore(s => s.user);

  const shopName  = shopNameProp ?? user?.shopName ?? '';
  const userName  = user?.name  ?? 'ผู้ใช้ทดลอง';
  const roleLabel = user?.role  ? ROLE_LABELS[user.role] : '';
  const initial   = userName.charAt(0).toUpperCase();

  return (
    <View style={[styles.bar, isSmall && { paddingHorizontal: 12, height: 48 }]}>
      {isSmall && onMenuPress && (
        <TouchableOpacity onPress={onMenuPress} style={{ marginRight: 10 }}>
          <Ionicons name="menu-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      )}
      <Text style={[styles.pageName, isSmall && { fontSize: 14 }]} numberOfLines={1}>
        {pageName}
      </Text>
      <View style={styles.right}>
      {/* ชื่อร้านค้าย้ายไปอยู่ที่ WebSidebar แล้ว — ใน topbar แสดงแค่ user + role + pos */}
        {!isSmall && (
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName}</Text>
            {roleLabel !== '' && (
              <Text style={styles.roleLabel}>{roleLabel}</Text>
            )}
            <Text style={styles.posName}>{posName}</Text>
          </View>
        )}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 56, backgroundColor: WebColors.topbar,
    borderBottomWidth: 1, borderBottomColor: WebColors.topbarBorder,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 24,
    flexShrink: 0,
  },
  pageName: { fontSize: 14, fontWeight: '700', color: WebColors.text, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  userInfo: { alignItems: 'flex-end', maxWidth: 180 },
  shopName: { fontSize: 12, fontWeight: '600', color: WebColors.text },
  userName: { fontSize: 13, color: WebColors.textSecondary },
  roleLabel: { fontSize: 13, fontWeight: '700', color: WebColors.primary },
  posName:  { fontSize: 13, color: WebColors.textDisabled },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: WebColors.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: WebColors.white },
});
