/**
 * Tests — languageStore persist ('pos-language'), normalization, non-hook t()
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

// languageStore -> persistStorage นำเข้า react-native + AsyncStorage
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import { useLanguageStore } from '../languageStore';
import { t } from '../../i18n/useT';
import type { Language } from '../../i18n/types';

beforeEach(() => {
  localStorage.clear();
  useLanguageStore.setState({ uiLanguage: 'th' });
  localStorage.clear();
});

describe('languageStore', () => {
  test('defaults to th', () => {
    expect(useLanguageStore.getState().uiLanguage).toBe('th');
  });

  test("setUiLanguage('en') writes 'pos-language'", () => {
    useLanguageStore.getState().setUiLanguage('en');
    expect(useLanguageStore.getState().uiLanguage).toBe('en');
    const raw = localStorage.getItem('pos-language');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).state).toEqual({ uiLanguage: 'en' });
  });

  test('rehydrates en from storage', async () => {
    localStorage.setItem('pos-language', JSON.stringify({ state: { uiLanguage: 'en' }, version: 1 }));
    await useLanguageStore.persist.rehydrate();
    expect(useLanguageStore.getState().uiLanguage).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  test('garbage in storage -> th', async () => {
    useLanguageStore.setState({ uiLanguage: 'en' });
    localStorage.setItem('pos-language', JSON.stringify({ state: { uiLanguage: 'jp' }, version: 1 }));
    await useLanguageStore.persist.rehydrate();
    expect(useLanguageStore.getState().uiLanguage).toBe('th');
  });

  test('invalid set is ignored', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    useLanguageStore.getState().setUiLanguage('jp' as Language);
    expect(useLanguageStore.getState().uiLanguage).toBe('th');
  });

  test('non-hook t() follows the store at call time', () => {
    expect(t('common.save')).toBe('บันทึก');
    useLanguageStore.getState().setUiLanguage('en');
    expect(t('common.save')).toBe('Save');
    expect(document.documentElement.lang).toBe('en');
  });
});
