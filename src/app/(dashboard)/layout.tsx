import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar placeholder - will be implemented in later tasks */}
        <aside className="w-64 bg-white shadow-sm">
          <div className="p-4">
            <h1 className="text-xl font-bold text-gray-900">Invoice Ninja</h1>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}