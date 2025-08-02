'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
import { useNotifications } from '@/lib/notification-context';
import { DriveFolder } from '@/types';
import { GoogleDriveFolderBrowser } from './google-drive-folder-browser';

interface GoogleDriveSettingsProps {
  enabled: boolean;
  folderId?: string;
  folderName: string;
  autoUpload: boolean;
  onSettingsChange: (settings: {
    enabled: boolean;
    folderId?: string;
    folderName: string;
    autoUpload: boolean;
  }) => void;
  disabled?: boolean;
}



export function GoogleDriveSettings({
  enabled,
  folderId,
  folderName,
  autoUpload,
  onSettingsChange,
  disabled = false
}: GoogleDriveSettingsProps) {
  const [isFolderBrowserOpen, setIsFolderBrowserOpen] = useState(false);
  const [currentFolderName, setCurrentFolderName] = useState(folderName);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated' | 'error'>('checking');
  const [authError, setAuthError] = useState<string | null>(null);
  const { addErrorNotification, addSuccessNotification } = useNotifications();

  // Check authentication status when component mounts or when enabled changes
  useEffect(() => {
    if (enabled) {
      checkAuthStatus();
    }
  }, [enabled]);

  const checkAuthStatus = async () => {
    try {
      setAuthStatus('checking');
      setAuthError(null);

      const response = await fetch('/api/google-drive/auth-status');
      const data = await response.json();

      if (data.success) {
        if (data.data.isAuthenticated && data.data.hasValidToken) {
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthenticated');
          setAuthError(data.data.error || 'Authentication required');
        }
      } else {
        setAuthStatus('error');
        setAuthError(data.error.message);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthStatus('error');
      setAuthError('Failed to check authentication status');
    }
  };

  const handleToggleEnabled = async (checked: boolean) => {
    if (checked) {
      // Check authentication before enabling
      await checkAuthStatus();
      
      if (authStatus === 'unauthenticated' || authStatus === 'error') {
        addErrorNotification(
          'Please sign in to Google Drive before enabling storage.',
          () => window.location.href = '/api/auth/signin'
        );
        return;
      }
    }

    onSettingsChange({
      enabled: checked,
      folderId,
      folderName: currentFolderName,
      autoUpload
    });

    if (checked) {
      addSuccessNotification('Google Drive storage enabled successfully');
    }
  };

  const handleToggleAutoUpload = (checked: boolean) => {
    onSettingsChange({
      enabled,
      folderId,
      folderName: currentFolderName,
      autoUpload: checked
    });
  };

  const handleFolderSelect = (folder: DriveFolder | null) => {
    const newFolderId = folder?.id;
    const newFolderName = folder?.name || 'Invoices';
    
    setCurrentFolderName(newFolderName);
    onSettingsChange({
      enabled,
      folderId: newFolderId,
      folderName: newFolderName,
      autoUpload
    });

    addSuccessNotification(`Google Drive folder changed to "${newFolderName}"`);
  };

  const handleBrowseFolders = () => {
    if (authStatus === 'unauthenticated' || authStatus === 'error') {
      addErrorNotification(
        'Please sign in to Google Drive to browse folders.',
        () => window.location.href = '/api/auth/signin'
      );
      return;
    }
    
    setIsFolderBrowserOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Enable/Disable Toggle */}
      <FormField
        label="Google Drive Storage"
        helperText="Automatically store generated invoices in your Google Drive"
      >
        <div className="flex items-center space-x-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleToggleEnabled(e.target.checked)}
              disabled={disabled}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${
              enabled 
                ? 'bg-blue-600' 
                : 'bg-gray-200 dark:bg-gray-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              } mt-0.5 ml-0.5`} />
            </div>
          </label>
          <span className={`text-sm ${
            enabled 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </FormField>

      {/* Folder Selection - only show when enabled */}
      {enabled && (
        <>
          <FormField
            label="Storage Folder"
            helperText="Choose where your invoices will be stored in Google Drive"
          >
            <div className="flex items-center space-x-2">
              <Input
                value={currentFolderName}
                readOnly
                disabled={disabled}
                className="flex-1"
                placeholder="Invoices"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleBrowseFolders}
                disabled={disabled}
                className="whitespace-nowrap"
              >
                Browse Folders
              </Button>
            </div>
          </FormField>

          {/* Auto Upload Toggle */}
          <FormField
            label="Automatic Upload"
            helperText="Automatically upload invoices when they are generated"
          >
            <div className="flex items-center space-x-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoUpload}
                  onChange={(e) => handleToggleAutoUpload(e.target.checked)}
                  disabled={disabled}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  autoUpload 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    autoUpload ? 'translate-x-5' : 'translate-x-0'
                  } mt-0.5 ml-0.5`} />
                </div>
              </label>
              <span className={`text-sm ${
                autoUpload 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {autoUpload ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </FormField>
        </>
      )}

      {/* Folder Browser Modal */}
      <GoogleDriveFolderBrowser
        isOpen={isFolderBrowserOpen}
        onClose={() => setIsFolderBrowserOpen(false)}
        onSelectFolder={handleFolderSelect}
        currentFolderId={folderId}
      />
    </div>
  );
}