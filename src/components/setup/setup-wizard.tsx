'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LoadingState, Spinner } from '@/components/ui/loading';
import { Alert } from '@/components/ui/alert';
import { useNotifications } from '@/lib/notification-context';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface SetupStatus {
  isConnected: boolean;
  sheetsInitialized: boolean;
  clientCount: number;
  hasSettings: boolean;
  message: string;
}

export function SetupWizard() {
  const [isLoading, setIsLoading] = useState(true);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [step, setStep] = useState<'check' | 'setup' | 'complete'>('check');
  const { addNotification } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sheets/setup');
      const result = await response.json();

      if (result.success) {
        setSetupStatus(result.data);
        if (result.data.isConnected && result.data.sheetsInitialized) {
          setStep('complete');
        } else {
          setStep('setup');
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Setup Check Failed',
          message: result.error?.message || 'Failed to check setup status'
        });
        setStep('setup');
      }
    } catch (error) {
      console.error('Setup check error:', error);
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Failed to check setup status'
      });
      setStep('setup');
    } finally {
      setIsLoading(false);
    }
  };

  const validateSpreadsheet = async () => {
    if (!spreadsheetId.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a Google Sheets Spreadsheet ID'
      });
      return;
    }

    try {
      setIsValidating(true);
      const response = await fetch('/api/sheets/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spreadsheetId }),
      });

      const result = await response.json();

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Connection Successful',
          message: 'Google Sheets integration is working!'
        });
        setStep('complete');
        // Refresh the page to load the main application
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } else {
        addNotification({
          type: 'error',
          title: 'Validation Failed',
          message: result.error?.message || 'Failed to validate Google Sheets connection'
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Failed to validate Google Sheets connection'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const proceedToApp = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <LoadingState size="lg" message="Checking application setup..." />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">IN</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Ninja</h1>
          <p className="text-gray-600 mt-2">Setup your invoice management system</p>
        </div>

        {step === 'check' && (
          <div className="text-center">
            <LoadingState size="lg" message="Checking setup status..." />
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Google Sheets Integration Setup
              </h2>
              
              {setupStatus && !setupStatus.isConnected && (
                <Alert
                  variant="warning"
                  title="Setup Required"
                  className="mb-6"
                >
                  {setupStatus.message}
                </Alert>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Setup Instructions:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Create a new Google Spreadsheet or use an existing one</li>
                  <li>Copy the Spreadsheet ID from the URL (the long string between /d/ and /edit)</li>
                  <li>Make sure the spreadsheet is shared with your Google account</li>
                  <li>Paste the Spreadsheet ID below and click "Validate Connection"</li>
                </ol>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="spreadsheetId" className="block text-sm font-medium text-gray-700 mb-2">
                    Google Sheets Spreadsheet ID
                  </label>
                  <Input
                    id="spreadsheetId"
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: https://docs.google.com/spreadsheets/d/<strong>1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms</strong>/edit
                  </p>
                </div>

                <Button
                  onClick={validateSpreadsheet}
                  disabled={isValidating || !spreadsheetId.trim()}
                  className="w-full"
                >
                  {isValidating ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Validating Connection...
                    </>
                  ) : (
                    'Validate Connection'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Setup Complete!
              </h2>
              <p className="text-gray-600">
                Your Invoice Ninja application is ready to use.
              </p>
            </div>

            {setupStatus && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-800 space-y-1">
                  <p>✓ Google Sheets connection: Active</p>
                  <p>✓ Data initialization: Complete</p>
                  <p>✓ Existing clients: {setupStatus.clientCount}</p>
                  <p>✓ Settings configured: {setupStatus.hasSettings ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}

            <Button onClick={proceedToApp} className="w-full">
              Launch Invoice Ninja
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}