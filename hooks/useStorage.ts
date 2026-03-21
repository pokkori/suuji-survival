import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';

export function useStorage() {
  const getItem = useCallback(async <T>(key: string, defaultValue: T): Promise<T> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return defaultValue;
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }, []);

  const setItem = useCallback(async <T>(key: string, value: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // silently fail
    }
  }, []);

  const getNumber = useCallback(async (key: string, defaultValue: number = 0): Promise<number> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return defaultValue;
      return Number(value);
    } catch {
      return defaultValue;
    }
  }, []);

  const setNumber = useCallback(async (key: string, value: number): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch {
      // silently fail
    }
  }, []);

  const getString = useCallback(async (key: string, defaultValue: string = ''): Promise<string> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }, []);

  const setString = useCallback(async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // silently fail
    }
  }, []);

  return { getItem, setItem, getNumber, setNumber, getString, setString };
}
