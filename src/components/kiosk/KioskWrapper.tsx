/**
 * KioskWrapper — ครอบ POSSaleScreen ด้วย Kiosk Mode
 * - ปุ่ม "ออก Kiosk" ที่มุมขวาบน (กดค้าง 2 วิ หรือกดได้เลยถ้า role = owner/admin)
 * - PIN Modal สำหรับออก
 * - Idle timer auto-lock
 * - Web: Fullscreen API
 * - Android: hide status/nav bar
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, AppState, Platform, Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKioskStore } from '../../store/kioskStore';
import { KioskExitModal } from './KioskExitModal';
import { KioskLockScreen } from './KioskLockScreen';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { IS_WEB } from '../../utils/platform';

interface KioskWrapperProps {
  children: React.ReactNode;
  onExited: () => void;
}

export const KioskWrapper: React.FC<KioskWrapperProps> = ({ children, onExited }) => {
  const {
    isKioskMode, isLocked, idleTimeout, lastActivity,
    lockScreen, recordActivity, exitKioskMode,
    toggleFullscreen, isFullscreen,
  } = useKioskStore();

  const [showExitModal, setShowExitModal] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdAnim = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width, height } = Dimensions.get('window');
  const isWide = width >= 768;

  // ── Idle timer ──────────────────────────────────────────────────────────────
  const resetIdle = useCallback(() => {
    recordActivity();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (idleTimeout > 0 && isKioskMode) {
      idleTimer.current = setTimeout(() => {
        lockScreen();
      }, idleTimeout * 1000);
    }
  }, [idleTimeout, isKioskMode, lockScreen, recordActivity]);

  useEffect(() => {
    resetIdle();
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [resetIdle]);

  // ── Hold-to-exit button ─────────────────────────────────────────────────────
  const startHold = () => {
    setHoldProgress(0);
    holdAnim.setValue(0);
    let pct = 0;
    holdTimer.current = setInterval(() => {
      pct += 5;
      setHoldProgress(pct);
      holdAnim.setValue(pct / 100);
      if (pct >= 100) {
        clearInterval(holdTimer.current!);
        setShowExitModal(true);
        setHoldProgress(0);
        holdAnim.setValue(0);
      }
    }, 100); // 2 วินาที = 100ms × 20 steps
  };

  const cancelHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    setHoldProgress(0);
    holdAnim.setValue(0);
  };

  const holdWidth = holdAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!isKioskMode) return <>{children}</>;

  return (
    <View style={styles.container} onTouchStart={resetIdle}>
      {/* Android: hide status bar */}
      <StatusBar hidden={!IS_WEB} translucent />

      {/* Kiosk top bar */}
      <View style={[styles.kioskBar, isWide && styles.kioskBarWide]}>
        {/* Left: Kiosk badge */}
        <View style={styles.kioskBadge}>
          <Ionicons name="storefront" size={16} color={Colors.primary} />
          <Text style={styles.kioskBadgeText}>KIOSK MODE</Text>
        </View>

        {/* Right: controls */}
        <View style={styles.kioskControls}>
          {/* Fullscreen toggle (Web only) */}
          {IS_WEB && (
            <TouchableOpacity style={styles.controlBtn} onPress={toggleFullscreen}>
              <Ionicons
                name={isFullscreen ? 'contract-outline' : 'expand-outline'}
                size={18}
                color={Colors.text}
              />
            </TouchableOpacity>
          )}

          {/* Exit Kiosk — hold 2 วิ */}
          <View style={styles.exitBtnWrap}>
            <TouchableOpacity
              style={styles.exitBtn}
              onPressIn={startHold}
              onPressOut={cancelHold}
              activeOpacity={0.85}
            >
              <Ionicons name="lock-open-outline" size={16} color={Colors.white} />
              <Text style={styles.exitBtnText}>
                {holdProgress > 0
                  ? `${Math.ceil((100 - holdProgress) / 50)}s...`
                  : 'ออก Kiosk'}
              </Text>
            </TouchableOpacity>
            {/* Hold progress bar */}
            {holdProgress > 0 && (
              <Animated.View style={[styles.holdBar, { width: holdWidth }]} />
            )}
          </View>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Lock screen overlay */}
      {isLocked && (
        <KioskLockScreen onUnlocked={() => resetIdle()} />
      )}

      {/* Exit PIN modal */}
      <KioskExitModal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        onExited={() => {
          setShowExitModal(false);
          onExited();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  kioskBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1, borderBottomColor: Colors.secondaryDark,
    height: 40,
  },
  kioskBarWide: { paddingHorizontal: Spacing.xl },
  kioskBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.primaryMid,
  },
  kioskBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 1 },
  kioskControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  controlBtn: {
    width: 32, height: 32, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  exitBtnWrap: { position: 'relative', overflow: 'hidden', borderRadius: BorderRadius.md },
  exitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    minWidth: 90,
  },
  exitBtnText: { fontSize: 12, color: Colors.white, fontWeight: '700' },
  holdBar: {
    position: 'absolute', bottom: 0, left: 0, height: 3,
    backgroundColor: Colors.secondary, borderRadius: 2,
  },
  content: { flex: 1 },
});
