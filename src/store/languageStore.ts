/**
 * languageStore — ภาษาของ UI ต่อเครื่อง (persist 'pos-language')
 * ภาษาใบเสร็จแยกอยู่ที่ receiptStore.config.receiptLanguage
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from './persistStorage';
import { isLanguage, type Language } from '../i18n/types';
import { isDev } from '../i18n/translate';

export interface LanguageState {
  uiLanguage: Language;
  setUiLanguage: (l: Language) => void;
}

/** web: ตั้ง <html lang> ให้ตรงกับภาษา UI */
function applyDocumentLang(lang: Language): void {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lang;
  }
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      uiLanguage: 'th',
      setUiLanguage: (l) => {
        if (!isLanguage(l)) {
          if (isDev()) console.warn('[i18n] invalid language ignored', l);
          return;
        }
        set({ uiLanguage: l });
      },
    }),
    {
      name: 'pos-language',
      version: 1,
      storage: createJSONStorage(() => persistStorage),
      partialize: (s) => ({ uiLanguage: s.uiLanguage }),
      // store นี้เป็นเจ้าของ invariant: ค่าขยะ/ไม่มีค่า → 'th'
      merge: (persisted, current) => {
        const saved = (persisted as { uiLanguage?: unknown } | undefined)?.uiLanguage;
        return { ...current, uiLanguage: isLanguage(saved) ? saved : 'th' };
      },
      onRehydrateStorage: () => (state) => {
        if (state) applyDocumentLang(state.uiLanguage);
      },
    },
  ),
);

useLanguageStore.subscribe((s) => applyDocumentLang(s.uiLanguage));
