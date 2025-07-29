'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface InitializationStatus {
  isLoading: boolean;
  needsAuth: boolean;
  needsSetup: boolean;
  isReady: boolean;
  error: string | null;
}

export function useAppInitialization() {
  const { data: session, status: sessionStatus } = useSession();
  const [status, setStatus] = useState<InitializationStatus>({
    isLoading: true,
    needsAuth: false,
    needsSetup: false,
    isReady: false,
    error: null,
  });

  useEffect(() => {
    if (sessionStatus === 'loading') {
      // Still loading session
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));
      return;
    }

    if (sessionStatus === 'unauthenticated') {
      // User needs to authenticate
      setStatus({
        isLoading: false,
        needsAuth: true,
        needsSetup: false,
        isReady: false,
        error: null,
      });
      return;
    }

    if (sessionStatus === 'authenticated' && session) {
      // User is authenticated, now check sheets setup
      checkInitialization();
    }
  }, [session, sessionStatus]);

  const checkInitialization = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if Google Sheets is set up
      const response = await fetch('/api/sheets/setup');
      
      if (response.status === 401) {
        // Authentication issue, redirect to auth
        setStatus({
          isLoading: false,
          needsAuth: true,
          needsSetup: false,
          isReady: false,
          error: null,
        });
        return;
      }

      const result = await response.json();

      if (result.success) {
        const { isConnected, sheetsInitialized } = result.data;
        
        if (isConnected && sheetsInitialized) {
          setStatus({
            isLoading: false,
            needsAuth: false,
            needsSetup: false,
            isReady: true,
            error: null,
          });
        } else {
          setStatus({
            isLoading: false,
            needsAuth: false,
            needsSetup: true,
            isReady: false,
            error: null,
          });
        }
      } else {
        setStatus({
          isLoading: false,
          needsAuth: false,
          needsSetup: true,
          isReady: false,
          error: result.error?.message || 'Failed to check initialization status',
        });
      }
    } catch (error) {
      console.error('Initialization check failed:', error);
      setStatus({
        isLoading: false,
        needsAuth: false,
        needsSetup: true,
        isReady: false,
        error: 'Failed to check application status',
      });
    }
  };

  const retryInitialization = () => {
    if (sessionStatus === 'authenticated') {
      checkInitialization();
    }
  };

  return {
    ...status,
    retryInitialization,
  };
}