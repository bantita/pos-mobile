/**
 * KioskWrapper — ครอบ POSSaleScreen ด้วย Kiosk Mode
 * - ปุ่ม "ออก Kiosk" ที่มุมขวาบน (กดค้าง 2 วิ หรือกดได้เลยถ้า role = owner/admin)
 * - PIN Modal สำหรับออก
 * - Idle timer auto-lock
 * - Web: Fullscreen API
 * - Android: hide status/nav bar
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, TouchableOpacity, StatusBar, AppState, Platform, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@/shared/icons/lucideAdapter';
import { useKioskStore } from '@/features/kiosk/application/stores/kioskStore';
import { KioskExitModal } from '@/features/kiosk/presentation/components/KioskExitModal';
import { KioskLockScreen } from '@/features/kiosk/presentation/components/KioskLockScreen';
import { cn } from '@/shared/lib/cn';
import { IS_WEB } from '@/shared/lib/platform';
import { Text } from '@/shared/tw/index';

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
    }, 100);
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
    <View className="flex-1 bg-[#f6f7fb]" onTouchStart={resetIdle}>
      {/* Android: hide status bar */}
      <StatusBar hidden={!IS_WEB} translucent />

      {/* Kiosk top bar */}
      <View className={cn('flex-row items-center justify-between bg-white px-3 py-1 border-b border-slate-200 h-10', isWide && 'px-5')}>
        {/* Left: Kiosk badge */}
        <View className="flex-row items-center gap-[5px] bg-rose-50 rounded-full px-2 py-[3px] border border-rose-400">
          <Ionicons name="storefront" size={16} color="#f87171" />
          <Text className="text-[10px] font-extrabold text-rose-600 tracking-[1px]">KIOSK MODE</Text>
        </View>

        {/* Right: controls */}
        <View className="flex-row items-center gap-2">
          {/* Fullscreen toggle (Web only) */}
          {IS_WEB && (
            <TouchableOpacity className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center border border-slate-200" onPress={toggleFullscreen}>
              <Ionicons
                name={isFullscreen ? 'contract-outline' : 'expand-outline'}
                size={18}
                color="#292524"
              />
            </TouchableOpacity>
          )}

          {/* Exit Kiosk — hold 2 วิ */}
          <View className="relative overflow-hidden rounded-xl">
            <TouchableOpacity
              className="flex-row items-center gap-[5px] bg-rose-500 rounded-xl px-3 py-[7px] min-w-[90px]"
              onPressIn={startHold}
              onPressOut={cancelHold}
              activeOpacity={0.85}
            >
              <Ionicons name="lock-open-outline" size={16} color="#fafafa" />
              <Text className="text-[12px] text-white font-bold">
                {holdProgress > 0
                  ? `${Math.ceil((100 - holdProgress) / 50)}s...`
                  : 'ออก Kiosk'}
              </Text>
            </TouchableOpacity>
            {/* Hold progress bar */}
            {holdProgress > 0 && (
              <Animated.View className="absolute bottom-0 left-0 h-[3px] bg-white rounded-sm" style={{ width: holdWidth }} />
            )}
          </View>
        </View>
      </View>

      {/* Main content */}
      <View className="flex-1">
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
