'use client';

import { useTheme, colorThemes, type ColorTheme } from '@/lib/theme-context';
import { CheckIcon } from '@heroicons/react/24/outline';

interface ColorThemeSelectorProps {
  disabled?: boolean;
}

export function ColorThemeSelector({ disabled = false }: ColorThemeSelectorProps) {
  const { colorTheme, setColorTheme } = useTheme();

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Color Theme
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(colorThemes).map(([key, theme]) => (
          <button
            key={key}
            type="button"
            onClick={() => setColorTheme(key as ColorTheme)}
            disabled={disabled}
            className={`
              relative p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105
              ${colorTheme === key 
                ? 'border-gray-400 shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* Color Preview Circle */}
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: theme.preview }}
              />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {theme.name}
                </div>
              </div>
              {colorTheme === key && (
                <CheckIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            
            {/* Color Gradient Preview */}
            <div className="mt-2 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full w-full"
                style={{
                  background: `linear-gradient(90deg, ${theme.primaryLight} 0%, ${theme.primary} 50%, ${theme.primaryDark} 100%)`
                }}
              />
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Choose a color theme that will be applied throughout the application
      </p>
    </div>
  );
}