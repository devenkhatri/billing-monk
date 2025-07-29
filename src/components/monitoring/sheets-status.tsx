'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface SheetsHealthStatus {
  status: 'healthy' | 'unhealthy';
  responseTime?: string;
  timestamp: string;
  message?: string;
  error?: string;
  isQuotaError?: boolean;
  suggestion?: string;
}

export function SheetsStatus() {
  const [status, setStatus] = useState<SheetsHealthStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sheets/health');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Failed to check status',
        suggestion: 'Check your network connection'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusColor = () => {
    if (!status) return 'text-gray-500';
    return status.status === 'healthy' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = () => {
    if (loading) return '⏳';
    if (!status) return '❓';
    return status.status === 'healthy' ? '✅' : '❌';
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Google Sheets API Status</h3>
        <Button 
          onClick={checkStatus} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getStatusIcon()}</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {status?.status?.toUpperCase() || 'UNKNOWN'}
          </span>
          {status?.responseTime && (
            <span className="text-sm text-gray-500">
              ({status.responseTime})
            </span>
          )}
        </div>

        {status?.message && (
          <p className="text-sm text-gray-700">{status.message}</p>
        )}

        {status?.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800 font-medium">Error:</p>
            <p className="text-sm text-red-700">{status.error}</p>
            
            {status.isQuotaError && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800 font-medium">⚠️ Quota Exceeded</p>
                <p className="text-sm text-yellow-700">
                  You've hit the Google Sheets API quota limit. This typically resets every minute.
                  Try waiting a few minutes before making more requests.
                </p>
              </div>
            )}

            {status.suggestion && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Suggestion:</strong> {status.suggestion}
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500">
          Last checked: {status?.timestamp ? new Date(status.timestamp).toLocaleString() : 'Never'}
        </p>
      </div>
    </div>
  );
}