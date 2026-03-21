import { useState, useEffect, useCallback } from 'react';
import { ThemeId, ThemeColors } from '../types';
import { THEMES } from '../constants/themes';
import { STORAGE_KEYS } from '../constants/storage';
import { useStorage } from './useStorage';

export function useTheme() {
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>('default');
  const [unlockedThemes, setUnlockedThemes] = useState<ThemeId[]>(['default']);
  const storage = useStorage();

  useEffect(() => {
    (async () => {
      const saved = await storage.getString(STORAGE_KEYS.CURRENT_THEME, 'default');
      setCurrentThemeId(saved as ThemeId);
      const unlocked = await storage.getItem<ThemeId[]>(STORAGE_KEYS.UNLOCKED_THEMES, ['default']);
      setUnlockedThemes(unlocked);
    })();
  }, []);

  const currentTheme = THEMES.find(t => t.id === currentThemeId) ?? THEMES[0];
  const colors: ThemeColors = currentTheme.colors;

  const selectTheme = useCallback(async (id: ThemeId) => {
    setCurrentThemeId(id);
    await storage.setString(STORAGE_KEYS.CURRENT_THEME, id);
  }, [storage]);

  const purchaseTheme = useCallback(async (id: ThemeId): Promise<boolean> => {
    const theme = THEMES.find(t => t.id === id);
    if (!theme || unlockedThemes.includes(id)) return false;

    const coins = await storage.getNumber(STORAGE_KEYS.COINS, 0);
    if (coins < theme.price) return false;

    await storage.setNumber(STORAGE_KEYS.COINS, coins - theme.price);
    const newUnlocked = [...unlockedThemes, id];
    setUnlockedThemes(newUnlocked);
    await storage.setItem(STORAGE_KEYS.UNLOCKED_THEMES, newUnlocked);
    return true;
  }, [storage, unlockedThemes]);

  return { currentThemeId, colors, unlockedThemes, selectTheme, purchaseTheme, themes: THEMES };
}
