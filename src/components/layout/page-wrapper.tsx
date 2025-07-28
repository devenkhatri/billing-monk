import { ReactNode } from 'react';
import { Header } from './header';

interface PageWrapperProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

const PageWrapper = ({ title, subtitle, actions, children, className }: PageWrapperProps) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className || ''}`}>
      <Header title={title} subtitle={subtitle} actions={actions} />
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export { PageWrapper };