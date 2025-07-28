'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChartBarIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Clients', href: '/clients', icon: UserGroupIcon },
  { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">IN</span>
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Invoice Ninja</h1>
          </div>
        </div>
        
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon
                className={clsx(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">U</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">User</p>
            <p className="text-xs text-gray-500">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className={clsx('hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64', className)}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          className="p-2 rounded-md bg-white shadow-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};

export { Sidebar };