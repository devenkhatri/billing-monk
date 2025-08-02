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

  // Check for bypass flag
  const checkBypass = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bypass-initialization') === 'true';
    }
    return false;
  };

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
      // Check for bypass flag first
      if (checkBypass()) {
        setStatus({
          isLoading: false,
          needsAuth: false,
          needsSetup: false,
          isReady: true,
          error: null,
        });
        return;
      }
      
      // User is authenticated, now check sheets setup
      checkInitialization();
    }
  }, [session, sessionStatus]);

  const checkInitialization = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        // Check if Google Sheets is set up with timeout
        const response = await fetch('/api/sheets/setup', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
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
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          // Timeout occurred, skip setup check and proceed
          console.warn('Sheets setup check timed out, proceeding without verification');
          setStatus({
            isLoading: false,
            needsAuth: false,
            needsSetup: false,
            isReady: true,
            error: null,
          });
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Initialization check failed:', error);
      // On error, proceed to app instead of blocking
      setStatus({
        isLoading: false,
        needsAuth: false,
        needsSetup: false,
        isReady: true,
        error: null,
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