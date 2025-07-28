'use client';

import { useState, useCallback } from 'react';
import { useNotifications } from '../notification-context';
import { getUserFriendlyMessage, ErrorCode } from '../client-error-handler';

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface AsyncOperationOptions {
  successMessage?: string;
  errorMessage?: string;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  retryable?: boolean;
}

interface UseAsyncOperationReturn<T> {
  state: AsyncOperationState<T>;
  execute: (operation: () => Promise<T>, options?: AsyncOperationOptions) => Promise<T | null>;
  retry: () => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

/**
 * Custom hook for handling async operations with loading states, error handling, and notifications
 */
export function useAsyncOperation<T = unknown>(): UseAsyncOperationReturn<T> {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const [lastOperation, setLastOperation] = useState<{
    operation: () => Promise<T>;
    options?: AsyncOperationOptions;
  } | null>(null);

  const { addNotification } = useNotifications();

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    const {
      successMessage,
      errorMessage,
      showSuccessNotification = false,
      showErrorNotification = true,
      retryable = true
    } = options;

    // Store operation for retry functionality
    if (retryable) {
      setLastOperation({ operation, options });
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      const result = await operation();
      
      setState({
        data: result,
        loading: false,
        error: null
      });

      // Show success notification if requested
      if (showSuccessNotification && successMessage) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: successMessage
        });
      }

      return result;
    } catch (error: any) {
      console.error('Async operation failed:', error);
      
      // Parse error response
      let errorMsg = errorMessage || 'An error occurred';
      let isRetryable = retryable;

      if (error?.response?.data?.error) {
        const apiError = error.response.data.error;
        errorMsg = getUserFriendlyMessage(apiError.code as ErrorCode, apiError.message);
        isRetryable = apiError.retryable ?? retryable;
      } else if (error?.message) {
        errorMsg = error.message;
      }

      setState({
        data: null,
        loading: false,
        error: errorMsg
      });

      // Show error notification
      if (showErrorNotification) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: errorMsg,
          duration: isRetryable ? 8000 : 5000 // Longer duration for retryable errors
        });
      }

      return null;
    }
  }, [addNotification]);

  const retry = useCallback(async (): Promise<T | null> => {
    if (!lastOperation) {
      console.warn('No operation to retry');
      return null;
    }

    return execute(lastOperation.operation, lastOperation.options);
  }, [lastOperation, execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
    setLastOperation(null);
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
      error: null
    }));
  }, []);

  return {
    state,
    execute,
    retry,
    reset,
    setData
  };
}

/**
 * Hook specifically for API calls with automatic error handling
 */
export function useApiCall<T = unknown>() {
  const asyncOp = useAsyncOperation<T>();

  const call = useCallback(async (
    apiCall: () => Promise<Response>,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    return asyncOp.execute(async () => {
      const response = await apiCall();
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'API call failed');
      }

      return data.data;
    }, {
      showErrorNotification: true,
      ...options
    });
  }, [asyncOp]);

  return {
    ...asyncOp,
    call
  };
}

/**
 * Hook for handling form submissions with loading states
 */
export function useFormSubmission<T = unknown>() {
  const asyncOp = useAsyncOperation<T>();

  const submit = useCallback(async (
    submitFn: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    return asyncOp.execute(submitFn, {
      showSuccessNotification: true,
      showErrorNotification: true,
      successMessage: 'Changes saved successfully',
      ...options
    });
  }, [asyncOp]);

  return {
    ...asyncOp,
    submit
  };
}