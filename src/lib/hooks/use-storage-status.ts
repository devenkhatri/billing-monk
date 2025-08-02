'use client';

import { useState, useEffect, useCallback } from 'react';
import { InvoiceStorageStatus } from '@/types';

interface BulkRetryResult {
  invoiceId: string;
  success: boolean;
  error?: string;
}

interface BulkRetryResponse {
  results: BulkRetryResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

interface UseStorageStatusReturn {
  storageStatuses: Record<string, InvoiceStorageStatus>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  retryUpload: (invoiceId: string) => Promise<void>;
  bulkRetryUpload: (invoiceIds: string[]) => Promise<BulkRetryResponse>;
}

export function useStorageStatus(invoiceIds: string[] = []): UseStorageStatusReturn {
  const [storageStatuses, setStorageStatuses] = useState<Record<string, InvoiceStorageStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStorageStatuses = useCallback(async () => {
    if (invoiceIds.length === 0) {
      setStorageStatuses({});
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/invoices/storage-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invoiceIds })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch storage statuses');
      }

      const data = await response.json();
      
      // Convert array to record for easy lookup
      const statusRecord: Record<string, InvoiceStorageStatus> = {};
      data.data.forEach((status: InvoiceStorageStatus) => {
        statusRecord[status.invoiceId] = status;
      });

      setStorageStatuses(statusRecord);
    } catch (err) {
      console.error('Error fetching storage statuses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch storage statuses');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceIds]);

  const retryUpload = useCallback(async (invoiceId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/invoices/${invoiceId}/retry-upload`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to retry upload');
      }

      // Refetch statuses to get updated status
      await fetchStorageStatuses();
    } catch (err) {
      console.error('Error retrying upload:', err);
      setError(err instanceof Error ? err.message : 'Failed to retry upload');
      throw err; // Re-throw to let the caller handle it
    }
  }, [fetchStorageStatuses]);

  const bulkRetryUpload = useCallback(async (invoiceIds: string[]): Promise<BulkRetryResponse> => {
    try {
      setError(null);

      const response = await fetch('/api/invoices/bulk-retry-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invoiceIds })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to bulk retry uploads');
      }

      const data = await response.json();
      
      // Refetch statuses to get updated statuses
      await fetchStorageStatuses();
      
      return data.data;
    } catch (err) {
      console.error('Error bulk retrying uploads:', err);
      setError(err instanceof Error ? err.message : 'Failed to bulk retry uploads');
      throw err; // Re-throw to let the caller handle it
    }
  }, [fetchStorageStatuses]);

  useEffect(() => {
    fetchStorageStatuses();
  }, [fetchStorageStatuses]);

  return {
    storageStatuses,
    isLoading,
    error,
    refetch: fetchStorageStatuses,
    retryUpload,
    bulkRetryUpload
  };
}