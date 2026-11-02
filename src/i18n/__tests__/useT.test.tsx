/**
 * Tests — useT() re-renders when the UI language changes
 */
import { describe, test, expect, vi, afterEach } from 'vitest';

// useT -> languageStore -> persistStorage นำเข้า react-native + AsyncStorage
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useT, useFormat } from '../useT';
import { useLanguageStore } from '../../store/languageStore';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Probe: React.FC = () => {
  const t = useT();
  const fmt = useFormat();
  return React.createElement('span', null, `${t('common.save')}|${fmt.date(new Date(2026, 5, 8))}`);
};

afterEach(() => {
  useLanguageStore.setState({ uiLanguage: 'th' });
});

describe('useT', () => {
  test('re-renders in English after setUiLanguage("en")', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(Probe));
    });
    expect(container.textContent).toBe('บันทึก|08/06/2569');

    await act(async () => {
      useLanguageStore.getState().setUiLanguage('en');
    });
    expect(container.textContent).toBe('Save|08/06/2026');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
