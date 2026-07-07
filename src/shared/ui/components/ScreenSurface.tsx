import React from 'react';
import { View } from '@/shared/tw/index';

interface Props {
  children: React.ReactNode;
}

/** Consistent application canvas injected by every feature navigator. */
export const ScreenSurface: React.FC<Props> = ({ children }) => (
  <View
    className="flex-1 bg-[#f6f7fb]"
    style={{ minWidth: 0, borderCurve: 'continuous' }}
  >
    {children}
  </View>
);
