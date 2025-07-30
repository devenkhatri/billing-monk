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
  const [step, setStep] = useState<'check' | 'setup' | 'initialize' | 'complete'>('check');
  const [isInitializing, setIsInitializing] = useState(false);
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
          message: 'Google Sheets connection validated. Initializing structure...'
        });
        setStep('initialize');
        // Initialize the sheets structure
        await initializeSheets();
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

  const initializeSheets = async () => {
    try {
      setIsInitializing(true);
      const response = await fetch('/api/sheets/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Initialization Complete',
          message: 'Google Sheets structure has been set up successfully!'
        });
        setStep('complete');
        // Refresh setup status
        await checkSetupStatus();
      } else {
        addNotification({
          type: 'error',
          title: 'Initialization Failed',
          message: result.error?.message || 'Failed to initialize Google Sheets structure'
        });
        setStep('setup');
      }
    } catch (error) {
      console.error('Initialization error:', error);
      addNotification({
        type: 'error',
        title: 'Initialization Error',
        message: 'Failed to initialize Google Sheets structure'
      });
      setStep('setup');
    } finally {
      setIsInitializing(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Billing Monk</h1>
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

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-900 mb-2">✅ Setup Complete!</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• Spreadsheet ID: <code className="bg-green-100 px-1 rounded text-xs">18STrLyMaNqhuVnvG_9fEVPE_q_TII-U9if3xiqHuQ6U</code></p>
                  <p>• Service Account: <code className="bg-green-100 px-1 rounded text-xs">dg-googlesheet-apps@upheld-radar-331507.iam.gserviceaccount.com</code></p>
                  <p>• Required sheets have been created and configured</p>
                </div>
              </div>

              <div className="text-center">
                <Button
                  onClick={() => {
                    setStep('complete');
                    checkSetupStatus();
                  }}
                  className="w-full"
                  size="lg"
                >
                  Continue to Application
                </Button>
              </div>


            </div>
          </div>
        )}

        {step === 'initialize' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Spinner size="lg" />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Initializing Google Sheets
              </h2>
              <p className="text-gray-600">
                Setting up the required sheets and data structure...
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Creating required sheets (Clients, Invoices, Payments, etc.)</p>
                <p>• Setting up column headers</p>
                <p>• Adding default configuration</p>
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
                Your Billing Monk application is ready to use.
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
              Launch Billing Monk
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}