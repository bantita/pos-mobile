/**
 * Persist Storage helper
 * - Web: localStorage
 * - Mobile: @react-native-async-storage/async-storage
 */
import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Web: ใช้ localStorage ตรงๆ
const webStorage: StateStorage = {
  getItem: (name) => {
    const val = localStorage.getItem(name);
    return val ?? null;
  },
  setItem: (name, value) => {
    localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

// Mobile: ใช้ AsyncStorage (persist จริง)
const mobileStorage: StateStorage = {
  getItem: async (name) => {
    const val = await AsyncStorage.getItem(name);
    return val ?? null;
  },
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

export const persistStorage: StateStorage =
  Platform.OS === 'web' ? webStorage : mobileStorage;
