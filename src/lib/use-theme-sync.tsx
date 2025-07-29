'use client';

import { useEffect } from 'react';
import { useTheme } from '@/lib/theme-context';

interface UseThemeSyncProps {
  theme?: 'light' | 'dark' | 'system';
  colorTheme?: 'default' | 'lavender' | 'mint' | 'peach' | 'sky' | 'rose' | 'sage' | 'coral' | 'periwinkle';
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
  onColorThemeChange?: (colorTheme: 'default' | 'lavender' | 'mint' | 'peach' | 'sky' | 'rose' | 'sage' | 'coral' | 'periwinkle') => void;
}

export function useThemeSync({ theme, colorTheme, onThemeChange, onColorThemeChange }: UseThemeSyncProps = {}) {
  const { theme: contextTheme, setTheme, colorTheme: contextColorTheme, setColorTheme } = useTheme();

  // Sync theme from settings to context
  useEffect(() => {
    if (theme && theme !== contextTheme) {
      setTheme(theme);
    }
  }, [theme, contextTheme, setTheme]);

  // Sync color theme from settings to context
  useEffect(() => {
    if (colorTheme && colorTheme !== contextColorTheme) {
      setColorTheme(colorTheme);
    }
  }, [colorTheme, contextColorTheme, setColorTheme]);

  // Notify when theme changes in context
  useEffect(() => {
    if (onThemeChange && contextTheme !== theme) {
      onThemeChange(contextTheme);
    }
  }, [contextTheme, theme, onThemeChange]);

  // Notify when color theme changes in context
  useEffect(() => {
    if (onColorThemeChange && contextColorTheme !== colorTheme) {
      onColorThemeChange(contextColorTheme);
    }
  }, [contextColorTheme, colorTheme, onColorThemeChange]);

  return { 
    theme: contextTheme, 
    setTheme, 
    colorTheme: contextColorTheme, 
    setColorTheme 
  };
}