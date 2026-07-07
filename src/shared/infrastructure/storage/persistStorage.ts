/**
 * Persist Storage helper
 * - Native (iOS/Android): SQLite-backed key-value storage via expo-sqlite/kv-store
 * - Web: localStorage (avoids OPFS/SharedArrayBuffer issues with expo-sqlite web worker)
 */
import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';

// Web: use localStorage directly to avoid expo-sqlite web worker "Invalid VFS state" errors
const webStorage: StateStorage = {
  getItem: (name: string) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // quota exceeded or private browsing — silently ignore
    }
  },
  removeItem: (name: string) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

// Native: lazy-load expo-sqlite/kv-store to avoid bundling it on web
let nativeStorage: StateStorage | null = null;
function getNativeStorage(): StateStorage {
  if (!nativeStorage) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SQLiteStorage = require('expo-sqlite/kv-store').default;
    nativeStorage = {
      getItem: (name: string) => SQLiteStorage.getItem(name),
      setItem: (name: string, value: string) => SQLiteStorage.setItem(name, value),
      removeItem: (name: string) => SQLiteStorage.removeItem(name),
    };
  }
  return nativeStorage;
}

export const persistStorage: StateStorage =
  Platform.OS === 'web'
    ? webStorage
    : {
        getItem: (name: string) => getNativeStorage().getItem(name),
        setItem: (name: string, value: string) => getNativeStorage().setItem(name, value),
        removeItem: (name: string) => getNativeStorage().removeItem(name),
      };

export const clearPersistedState = () => {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SQLiteStorage = require('expo-sqlite/kv-store').default;
    SQLiteStorage.clear();
  }
};
