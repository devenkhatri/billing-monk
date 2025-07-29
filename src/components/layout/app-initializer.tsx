'use client';

import { ReactNode } from 'react';
import { signIn } from 'next-auth/react';
import { useAppInitialization } from '@/lib/hooks/use-app-initialization';
import { SetupWizard } from '@/components/setup/setup-wizard';
import { LoadingState } from '@/components/ui/loading';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AppInitializerProps {
  children: ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const { isLoading, needsAuth, needsSetup, isReady, error, retryInitialization } = useAppInitialization();

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

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Invoice Ninja Clone
            </h1>
            <p className="text-gray-600 mb-6">
              Please sign in with your Google account to continue.
            </p>
            <Button 
              onClick={() => signIn('google')} 
              className="w-full"
              size="lg"
            >
              Sign in with Google
            </Button>
          </div>
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