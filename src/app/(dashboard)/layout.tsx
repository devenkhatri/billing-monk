import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        
        {/* Main content */}
        <div className="md:pl-64">
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}