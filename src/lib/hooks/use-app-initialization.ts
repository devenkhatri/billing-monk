'use client';

import { useState, useEffect } from 'react';

interface InitializationStatus {
  isLoading: boolean;
  needsSetup: boolean;
  isReady: boolean;
  error: string | null;
}

export function useAppInitialization() {
  const [status, setStatus] = useState<InitializationStatus>({
    isLoading: true,
    needsSetup: false,
    isReady: false,
    error: null,
  });

  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if Google Sheets is set up
      const response = await fetch('/api/sheets/setup');
      const result = await response.json();

      if (result.success) {
        const { isConnected, sheetsInitialized } = result.data;
        
        if (isConnected && sheetsInitialized) {
          setStatus({
            isLoading: false,
            needsSetup: false,
            isReady: true,
            error: null,
          });
        } else {
          setStatus({
            isLoading: false,
            needsSetup: true,
            isReady: false,
            error: null,
          });
        }
      } else {
        setStatus({
          isLoading: false,
          needsSetup: true,
          isReady: false,
          error: result.error?.message || 'Failed to check initialization status',
        });
      }
    } catch (error) {
      console.error('Initialization check failed:', error);
      setStatus({
        isLoading: false,
        needsSetup: true,
        isReady: false,
        error: 'Failed to check application status',
      });
    }
  };

  const retryInitialization = () => {
    checkInitialization();
  };

  return {
    ...status,
    retryInitialization,
  };
}