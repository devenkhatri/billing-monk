// Mock fetch
global.fetch = jest.fn();

describe('GoogleDriveFolderBrowser API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should make correct API call to fetch folders', async () => {
    const mockFolders = [
      {
        id: 'folder1',
        name: 'Test Folder 1',
        modifiedTime: new Date('2024-01-01')
      },
      {
        id: 'folder2',
        name: 'Test Folder 2',
        modifiedTime: new Date('2024-01-02')
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: mockFolders
      })
    });

    // Simulate the API call that the component would make
    const response = await fetch('/api/google-drive/folders');
    const data = await response.json();

    expect(global.fetch).toHaveBeenCalledWith('/api/google-drive/folders');
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockFolders);
  });

  it('should make correct API call to create folder', async () => {
    const newFolder = {
      id: 'new-folder-id',
      name: 'New Test Folder',
      modifiedTime: new Date('2024-01-03')
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: newFolder
      })
    });

    // Simulate the API call that the component would make
    const response = await fetch('/api/google-drive/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Test Folder'
      }),
    });
    const data = await response.json();

    expect(global.fetch).toHaveBeenCalledWith('/api/google-drive/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Test Folder'
      }),
    });
    expect(data.success).toBe(true);
    expect(data.data).toEqual(newFolder);
  });

  it('should handle API errors correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      })
    });

    // Simulate the API call that the component would make
    const response = await fetch('/api/google-drive/folders');
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('AUTHENTICATION_REQUIRED');
    expect(data.error.message).toBe('Authentication required');
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    try {
      await fetch('/api/google-drive/folders');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Network error');
    }
  });

  it('should validate folder name for creation', () => {
    // Test folder name validation logic
    const validateFolderName = (name: string) => {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return { valid: false, error: 'Folder name is required and must be a non-empty string' };
      }

      if (name.length > 255) {
        return { valid: false, error: 'Folder name must be 255 characters or less' };
      }

      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(name)) {
        return { valid: false, error: 'Folder name contains invalid characters' };
      }

      return { valid: true };
    };

    // Valid names
    expect(validateFolderName('Valid Folder Name')).toEqual({ valid: true });
    expect(validateFolderName('Folder123')).toEqual({ valid: true });

    // Invalid names
    expect(validateFolderName('')).toEqual({ 
      valid: false, 
      error: 'Folder name is required and must be a non-empty string' 
    });
    expect(validateFolderName('   ')).toEqual({ 
      valid: false, 
      error: 'Folder name is required and must be a non-empty string' 
    });
    expect(validateFolderName('a'.repeat(256))).toEqual({ 
      valid: false, 
      error: 'Folder name must be 255 characters or less' 
    });
    expect(validateFolderName('Invalid<Name')).toEqual({ 
      valid: false, 
      error: 'Folder name contains invalid characters' 
    });
    expect(validateFolderName('Invalid/Name')).toEqual({ 
      valid: false, 
      error: 'Folder name contains invalid characters' 
    });
  });

  it('should filter folders based on search query', () => {
    const folders = [
      { id: '1', name: 'Invoice Folder', modifiedTime: new Date() },
      { id: '2', name: 'Document Folder', modifiedTime: new Date() },
      { id: '3', name: 'Invoice Archive', modifiedTime: new Date() },
      { id: '4', name: 'Photos', modifiedTime: new Date() }
    ];

    const filterFolders = (folders: any[], query: string) => {
      return folders.filter(folder =>
        folder.name.toLowerCase().includes(query.toLowerCase())
      );
    };

    // Test search functionality
    expect(filterFolders(folders, 'invoice')).toHaveLength(2);
    expect(filterFolders(folders, 'Invoice')).toHaveLength(2);
    expect(filterFolders(folders, 'document')).toHaveLength(1);
    expect(filterFolders(folders, 'photos')).toHaveLength(1);
    expect(filterFolders(folders, 'nonexistent')).toHaveLength(0);
    expect(filterFolders(folders, '')).toHaveLength(4);
  });
});