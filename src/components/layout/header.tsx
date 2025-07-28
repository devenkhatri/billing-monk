'use client';

import { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

const Header = ({ title, subtitle, actions, className }: HeaderProps) => {
  return (
    <div className={`bg-white shadow-sm border-b border-gray-200 ${className || ''}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { Header };