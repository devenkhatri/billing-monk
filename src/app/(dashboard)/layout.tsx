'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppInitializer } from '@/components/layout/app-initializer';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <AppInitializer>
          <div className="min-h-screen bg-gray-50">
            <Sidebar />
            
            {/* Main content */}
            <div className="md:pl-64">
              <main id="main-content" className="py-6" role="main">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </AppInitializer>
      </SessionProvider>
    </ErrorBoundary>
  );
}