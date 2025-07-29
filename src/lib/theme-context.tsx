'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ColorTheme = 'default' | 'lavender' | 'mint' | 'peach' | 'sky' | 'rose' | 'sage' | 'coral' | 'periwinkle';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
}

// Pastel color themes configuration
export const colorThemes = {
  default: {
    name: 'Default Blue',
    primary: '#3b82f6',
    primaryLight: '#dbeafe',
    primaryDark: '#1e40af',
    accent: '#60a5fa',
    background: '#f8fafc',
    backgroundDark: '#0f172a',
    preview: '#3b82f6'
  },
  lavender: {
    name: 'Lavender Dreams',
    primary: '#a78bfa',
    primaryLight: '#ede9fe',
    primaryDark: '#7c3aed',
    accent: '#c4b5fd',
    background: '#faf8ff',
    backgroundDark: '#1e1b3a',
    preview: '#a78bfa'
  },
  mint: {
    name: 'Fresh Mint',
    primary: '#6ee7b7',
    primaryLight: '#d1fae5',
    primaryDark: '#059669',
    accent: '#a7f3d0',
    background: '#f0fdf4',
    backgroundDark: '#1a2e1a',
    preview: '#6ee7b7'
  },
  peach: {
    name: 'Soft Peach',
    primary: '#fbbf24',
    primaryLight: '#fef3c7',
    primaryDark: '#d97706',
    accent: '#fcd34d',
    background: '#fffbeb',
    backgroundDark: '#3a2e1a',
    preview: '#fbbf24'
  },
  sky: {
    name: 'Sky Blue',
    primary: '#38bdf8',
    primaryLight: '#e0f2fe',
    primaryDark: '#0284c7',
    accent: '#7dd3fc',
    background: '#f0f9ff',
    backgroundDark: '#1a2e3a',
    preview: '#38bdf8'
  },
  rose: {
    name: 'Blush Rose',
    primary: '#fb7185',
    primaryLight: '#fce7f3',
    primaryDark: '#e11d48',
    accent: '#fda4af',
    background: '#fdf2f8',
    backgroundDark: '#3a1a2e',
    preview: '#fb7185'
  },
  sage: {
    name: 'Sage Green',
    primary: '#84cc16',
    primaryLight: '#ecfccb',
    primaryDark: '#65a30d',
    accent: '#a3e635',
    background: '#f7fee7',
    backgroundDark: '#2e3a1a',
    preview: '#84cc16'
  },
  coral: {
    name: 'Coral Sunset',
    primary: '#f97316',
    primaryLight: '#fed7aa',
    primaryDark: '#ea580c',
    accent: '#fb923c',
    background: '#fff7ed',
    backgroundDark: '#3a2e1a',
    preview: '#f97316'
  },
  periwinkle: {
    name: 'Periwinkle Blue',
    primary: '#8b5cf6',
    primaryLight: '#e9d5ff',
    primaryDark: '#7c2d12',
    accent: '#a78bfa',
    background: '#faf5ff',
    backgroundDark: '#2e1a3a',
    preview: '#8b5cf6'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedColorTheme = localStorage.getItem('colorTheme') as ColorTheme;
    
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
    
    if (savedColorTheme && Object.keys(colorThemes).includes(savedColorTheme)) {
      setColorTheme(savedColorTheme);
    }
  }, []);

  // Update resolved theme based on theme setting and system preference
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes when using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateResolvedTheme);
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Remove existing color theme classes
    Object.keys(colorThemes).forEach(theme => {
      root.classList.remove(`theme-${theme}`);
    });
    
    // Add current theme classes
    root.classList.add(resolvedTheme);
    root.classList.add(`theme-${colorTheme}`);
    
    // Apply CSS custom properties for the selected color theme
    const selectedTheme = colorThemes[colorTheme];
    root.style.setProperty('--color-primary', selectedTheme.primary);
    root.style.setProperty('--color-primary-light', selectedTheme.primaryLight);
    root.style.setProperty('--color-primary-dark', selectedTheme.primaryDark);
    root.style.setProperty('--color-accent', selectedTheme.accent);
    root.style.setProperty('--color-background', selectedTheme.background);
    root.style.setProperty('--color-background-dark', selectedTheme.backgroundDark);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const themeColor = resolvedTheme === 'dark' ? selectedTheme.backgroundDark : selectedTheme.background;
      metaThemeColor.setAttribute('content', themeColor);
    }
  }, [resolvedTheme, colorTheme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSetColorTheme = (newColorTheme: ColorTheme) => {
    setColorTheme(newColorTheme);
    localStorage.setItem('colorTheme', newColorTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme: handleSetTheme, 
      resolvedTheme,
      colorTheme,
      setColorTheme: handleSetColorTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}