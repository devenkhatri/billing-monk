'use client';

import { ReactNode } from 'react';
import { useAppInitialization } from '@/lib/hooks/use-app-initialization';
import { SetupWizard } from '@/components/setup/setup-wizard';
import { LoadingState } from '@/components/ui/loading';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AppInitializerProps {
  children: ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const { isLoading, needsSetup, isReady, error, retryInitialization } = useAppInitialization();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingState size="lg" />
          <p className="mt-4 text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert
            type="error"
            title="Initialization Error"
            message={error}
            className="mb-4"
          />
          <Button onClick={retryInitialization} className="w-full">
            Retry Initialization
          </Button>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <SetupWizard />;
  }

  if (isReady) {
    return <>{children}</>;
  }

  return null;
}