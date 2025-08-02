'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading';
import { Alert } from '@/components/ui/alert';
import { useNotifications } from '@/lib/notification-context';
import { DriveFolder } from '@/types';

interface GoogleDriveFolderBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (folder: DriveFolder | null) => void;
  currentFolderId?: string;
}

export function GoogleDriveFolderBrowser({ 
  isOpen, 
  onClose, 
  onSelectFolder, 
  currentFolderId 
}: GoogleDriveFolderBrowserProps) {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(currentFolderId);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addErrorNotification, addSuccessNotification } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      loadFolders();
      setSelectedFolderId(currentFolderId);
      setSearchQuery('');
      setShowCreateForm(false);
      setNewFolderName('');
    }
  }, [isOpen, currentFolderId]);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/google-drive/folders');
      const data = await response.json();

      if (data.success) {
        setFolders(data.data);
      } else {
        const errorMessage = getErrorMessage(data.error);
        setError(errorMessage);
        
        // Show notification for authentication errors
        if (data.error.code === 'AUTHENTICATION_REQUIRED') {
          addErrorNotification(
            'Google Drive authentication required. Please sign in to browse folders.',
            () => window.location.href = '/api/auth/signin'
          );
        }
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      const errorMessage = 'Failed to connect to Google Drive. Please check your internet connection and try again.';
      setError(errorMessage);
      addErrorNotification(errorMessage, () => loadFolders());
    } finally {
      setIsLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      addErrorNotification('Please enter a folder name');
      return;
    }

    try {
      setIsCreatingFolder(true);
      setError(null);

      const response = await fetch('/api/google-drive/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        const newFolder = data.data;
        setFolders(prev => [newFolder, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedFolderId(newFolder.id);
        setNewFolderName('');
        setShowCreateForm(false);
        addSuccessNotification(`Folder "${newFolder.name}" created successfully`);
      } else {
        const errorMessage = getErrorMessage(data.error);
        setError(errorMessage);
        addErrorNotification(errorMessage);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      const errorMessage = 'Failed to create folder. Please try again.';
      setError(errorMessage);
      addErrorNotification(errorMessage);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    switch (error.code) {
      case 'AUTHENTICATION_REQUIRED':
        return 'Please sign in to Google Drive to browse folders.';
      case 'DRIVE_PERMISSION_ERROR':
        return 'You don\'t have permission to access Google Drive folders.';
      case 'DRIVE_QUOTA_ERROR':
        return 'Google Drive quota exceeded. Please try again later.';
      case 'DRIVE_NETWORK_ERROR':
        return 'Network error. Please check your connection and try again.';
      case 'FOLDER_ALREADY_EXISTS':
        return 'A folder with this name already exists.';
      case 'INVALID_FOLDER_NAME':
        return 'Please enter a valid folder name.';
      default:
        return error.message || 'Failed to load Google Drive folders.';
    }
  };

  const handleSelectFolder = () => {
    const selectedFolder = folders.find(f => f.id === selectedFolderId);
    onSelectFolder(selectedFolder || null);
    onClose();
  };

  const handleCreateFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFolder();
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[600px] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select Google Drive Folder
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search and Create Controls */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredFolders.length} folder{filteredFolders.length !== 1 ? 's' : ''} found
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                disabled={isLoading || isCreatingFolder}
                className="flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Folder</span>
              </Button>
            </div>

            {/* Create Folder Form */}
            {showCreateForm && (
              <form onSubmit={handleCreateFormSubmit} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isCreatingFolder}
                    autoFocus
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewFolderName('');
                    }}
                    disabled={isCreatingFolder}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreatingFolder || !newFolderName.trim()}
                    className="flex items-center space-x-1"
                  >
                    {isCreatingFolder ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-600">
            <Alert variant="error" title="Google Drive Error">
              <div className="space-y-2">
                <p>{error}</p>
                <div className="flex space-x-2">
                  {error.includes('sign in') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/api/auth/signin'}
                    >
                      Sign In to Google Drive
                    </Button>
                  )}
                  {(error.includes('connection') || error.includes('Network')) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={loadFolders}
                      disabled={isLoading}
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Folder List */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <LoadingState message="Loading folders..." />
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="p-4">
                {/* Default Option */}
                <label className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="folder"
                    value=""
                    checked={!selectedFolderId}
                    onChange={() => setSelectedFolderId(undefined)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Default (Invoices)
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Creates an "Invoices" folder in your Drive root
                      </p>
                    </div>
                  </div>
                </label>

                {/* Folder List */}
                {filteredFolders.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {filteredFolders.map((folder) => (
                      <label
                        key={folder.id}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name="folder"
                          value={folder.id}
                          checked={selectedFolderId === folder.id}
                          onChange={() => setSelectedFolderId(folder.id)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block truncate">
                              {folder.name}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Modified {folder.modifiedTime.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="mt-4 text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No folders found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      No folders match your search "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No folders available</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Create a new folder to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreatingFolder}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSelectFolder}
              disabled={isCreatingFolder}
              className="flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Select Folder</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}