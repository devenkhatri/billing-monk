'use client';

import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon 
} from '@heroicons/react/24/outline';

interface ThemeToggleProps {
  variant?: 'button' | 'select';
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ variant = 'button', size = 'md' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  if (variant === 'select') {
    return (
      <div className="flex items-center space-x-2">
        <label htmlFor="theme-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme:
        </label>
        <select
          id="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
    );
  }

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}`} />;
      case 'dark':
        return <MoonIcon className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}`} />;
      case 'system':
        return <ComputerDesktopIcon className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}`} />;
      default:
        return <SunIcon className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}`} />;
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case 'light':
        return 'Switch to dark theme';
      case 'dark':
        return 'Switch to system theme';
      case 'system':
        return 'Switch to light theme';
      default:
        return 'Toggle theme';
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={cycleTheme}
      title={getTooltip()}
      className="relative hover:bg-primary-100 dark:hover:bg-primary-900/20"
    >
      {getIcon()}
      <span className="sr-only">{getTooltip()}</span>
      {theme === 'system' && (
        <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary-500 rounded-full"></span>
      )}
    </Button>
  );
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'System', icon: ComputerDesktopIcon },
  ] as const;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Color Theme
      </label>
      <div className="grid grid-cols-3 gap-2">
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
              theme === value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}