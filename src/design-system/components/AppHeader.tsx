/**
 * AppHeader — Modern top header bar
 * White, soft shadow, breadcrumb, notifications, user profile.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Space, Font, Shadow, Radius } from '../tokens';

interface Props {
  pageName: string;
  breadcrumb?: string[];
  userName?: string;
  userRole?: string;
  onNotification?: () => void;
  onProfile?: () => void;
  notificationCount?: number;
}

export const AppHeader: React.FC<Props> = ({
  pageName, breadcrumb, userName, userRole, onNotification, onProfile, notificationCount,
}) => (
  <View style={s.container}>
    {/* Left: Breadcrumb + Page name */}
    <View style={s.left}>
      {breadcrumb && breadcrumb.length > 0 && (
        <View style={s.breadcrumb}>
          {breadcrumb.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Text style={s.breadcrumbSep}>/</Text>}
              <Text style={s.breadcrumbItem}>{item}</Text>
            </React.Fragment>
          ))}
        </View>
      )}
      <Text style={s.pageName}>{pageName}</Text>
    </View>

    {/* Right: Notifications + User */}
    <View style={s.right}>
      {onNotification && (
        <TouchableOpacity style={s.iconBtn} onPress={onNotification}>
          <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
          {(notificationCount ?? 0) > 0 && (
            <View style={s.notifBadge}>
              <Text style={s.notifBadgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {onProfile && (
        <TouchableOpacity style={s.userBtn} onPress={onProfile}>
          <View style={s.avatar}>
            <Ionicons name="person" size={14} color={Colors.white} />
          </View>
          <View>
            <Text style={s.userName}>{userName || 'User'}</Text>
            <Text style={s.userRole}>{userRole || ''}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Space.xl,
    paddingVertical: Space.md,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadow.sm,
  },
  left: { flex: 1 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, marginBottom: 2 },
  breadcrumbItem: { ...Font.caption, color: Colors.textMuted },
  breadcrumbSep: { ...Font.caption, color: Colors.textMuted },
  pageName: { ...Font.h4, color: Colors.text },

  right: { flexDirection: 'row', alignItems: 'center', gap: Space.md },

  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.white },

  userBtn: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  userName: { ...Font.bodySm, color: Colors.text, fontWeight: '600' },
  userRole: { fontSize: 10, color: Colors.textMuted },
});
