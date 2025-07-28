'use client';

import { ErrorCode, getUserFriendlyMessage } from './error-handler';

// API response types
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    retryable?: boolean;
    timestamp: string;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number,
    public retryable: boolean = false,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API client configuration
interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_CONFIG: Required<ApiClientConfig> = {
  baseUrl: '/api',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000 // 1 second
};

/**
 * Enhanced API client with error handling, retries, and loading states
 */
export class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Makes an HTTP request with error handling and retries
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Parse response
      const data: ApiResponse<T> = await response.json();

      // Handle successful response
      if (data.success) {
        return data.data;
      }

      // Handle API error response
      const apiError = new ApiError(
        data.error.code,
        data.error.message,
        response.status,
        data.error.retryable || false,
        data.error.details
      );

      // Retry if error is retryable and we haven't exceeded retry limit
      if (apiError.retryable && retryCount < this.config.retries) {
        console.warn(`API request failed (attempt ${retryCount + 1}/${this.config.retries + 1}), retrying:`, apiError.message);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)));
        
        return this.makeRequest<T>(url, options, retryCount + 1);
      }

      throw apiError;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle network/timeout errors
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(
          'NETWORK_ERROR',
          'Request timed out. Please check your connection and try again.',
          408,
          true
        );
      }

      // Handle other network errors
      const networkError = new ApiError(
        'NETWORK_ERROR',
        'Network error occurred. Please check your connection and try again.',
        0,
        true,
        error
      );

      // Retry network errors
      if (retryCount < this.config.retries) {
        console.warn(`Network error (attempt ${retryCount + 1}/${this.config.retries + 1}), retrying:`, error);
        
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)));
        
        return this.makeRequest<T>(url, options, retryCount + 1);
      }

      throw networkError;
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, params?: Record<string, string>): Promise<T> {
    const searchParams = params ? new URLSearchParams(params) : null;
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;
    
    return this.makeRequest<T>(fullUrl, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string): Promise<T> {
    return this.makeRequest<T>(url, { method: 'DELETE' });
  }
}

// Default API client instance
export const apiClient = new ApiClient();

/**
 * Utility function to handle API errors in components
 */
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return getUserFriendlyMessage(error.code, error.message);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Utility function to check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return error instanceof ApiError && error.retryable;
}

/**
 * Higher-order function to wrap API calls with consistent error handling
 */
export function withApiErrorHandling<T extends unknown[], R>(
  apiCall: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await apiCall(...args);
    } catch (error) {
      // Log error for debugging
      console.error('API call failed:', error);
      
      // Re-throw with consistent error handling
      throw error;
    }
  };
}

// Import caching utilities
import { 
  clientsCache, 
  invoicesCache, 
  paymentsCache, 
  settingsCache,
  templatesCache,
  cacheKeys, 
  cacheInvalidation 
} from './cache';

/**
 * Cached API wrapper with optimistic updates
 */
class CachedApiClient {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get data with caching
   */
  async getCached<T>(
    cacheKey: string,
    cache: any,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API and cache
    const data = await fetcher();
    cache.set(cacheKey, data, ttl);
    return data;
  }

  /**
   * Update data with optimistic updates
   */
  async updateOptimistic<T>(
    cacheKey: string,
    cache: any,
    optimisticData: T,
    updater: () => Promise<T>,
    onError?: (error: any) => void
  ): Promise<T> {
    // Store original data for rollback
    const originalData = cache.get(cacheKey);
    
    // Apply optimistic update
    cache.set(cacheKey, optimisticData);

    try {
      // Perform actual update
      const result = await updater();
      
      // Update cache with real result
      cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      // Rollback on error
      if (originalData) {
        cache.set(cacheKey, originalData);
      } else {
        cache.delete(cacheKey);
      }
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  }

  /**
   * Batch operations for multiple updates
   */
  async batchUpdate<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
    // Execute all operations in parallel
    const results = await Promise.allSettled(operations.map(op => op()));
    
    // Separate successful and failed operations
    const successful: T[] = [];
    const errors: any[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        errors.push({ index, error: result.reason });
      }
    });
    
    // If there are errors, log them but don't fail the entire batch
    if (errors.length > 0) {
      console.warn('Some batch operations failed:', errors);
    }
    
    return successful;
  }
}

const cachedApiClient = new CachedApiClient(apiClient);

// Specific API functions with caching and optimistic updates
export const clientsApi = {
  getAll: async (params?: Record<string, string>) => {
    const cacheKey = params ? 
      `${cacheKeys.clients.all()}:${JSON.stringify(params)}` : 
      cacheKeys.clients.all();
    
    return cachedApiClient.getCached(
      cacheKey,
      clientsCache,
      () => apiClient.get<{ clients: any[]; meta: any }>('/clients', params)
    );
  },
  
  getById: async (id: string) => {
    return cachedApiClient.getCached(
      cacheKeys.clients.byId(id),
      clientsCache,
      () => apiClient.get<any>(`/clients/${id}`)
    );
  },
  
  create: async (data: any) => {
    const result = await apiClient.post<any>('/clients', data);
    
    // Invalidate relevant caches
    cacheInvalidation.clients.invalidateAll();
    
    return result;
  },
  
  update: async (id: string, data: any) => {
    const optimisticData = { ...data, id };
    
    return cachedApiClient.updateOptimistic(
      cacheKeys.clients.byId(id),
      clientsCache,
      optimisticData,
      () => apiClient.put<any>(`/clients/${id}`, data),
      () => cacheInvalidation.clients.invalidateById(id)
    );
  },
  
  delete: async (id: string) => {
    // Optimistically remove from cache
    clientsCache.delete(cacheKeys.clients.byId(id));
    
    try {
      const result = await apiClient.delete<void>(`/clients/${id}`);
      cacheInvalidation.clients.invalidateAll();
      return result;
    } catch (error) {
      // On error, invalidate to force refresh
      cacheInvalidation.clients.invalidateAll();
      throw error;
    }
  },

  batchUpdate: async (updates: Array<{ id: string; data: any }>) => {
    return cachedApiClient.batchUpdate(
      updates.map(({ id, data }) => () => clientsApi.update(id, data))
    );
  }
};

export const invoicesApi = {
  getAll: async (params?: Record<string, string>) => {
    const cacheKey = params ? 
      `${cacheKeys.invoices.all()}:${JSON.stringify(params)}` : 
      cacheKeys.invoices.all();
    
    return cachedApiClient.getCached(
      cacheKey,
      invoicesCache,
      () => apiClient.get<{ invoices: any[]; meta: any }>('/invoices', params)
    );
  },
  
  getById: async (id: string) => {
    return cachedApiClient.getCached(
      cacheKeys.invoices.byId(id),
      invoicesCache,
      () => apiClient.get<any>(`/invoices/${id}`)
    );
  },
  
  getByClient: async (clientId: string) => {
    return cachedApiClient.getCached(
      cacheKeys.invoices.byClient(clientId),
      invoicesCache,
      () => apiClient.get<{ invoices: any[]; meta: any }>('/invoices', { clientId })
    );
  },
  
  getRecurring: async () => {
    return cachedApiClient.getCached(
      cacheKeys.invoices.recurring(),
      invoicesCache,
      () => apiClient.get<{ invoices: any[]; meta: any }>('/invoices/recurring')
    );
  },
  
  create: async (data: any) => {
    const result = await apiClient.post<any>('/invoices', data);
    
    // Invalidate relevant caches
    cacheInvalidation.invoices.invalidateAll();
    if (data.clientId) {
      cacheInvalidation.invoices.invalidateByClient(data.clientId);
    }
    
    return result;
  },
  
  update: async (id: string, data: any) => {
    const optimisticData = { ...data, id };
    
    return cachedApiClient.updateOptimistic(
      cacheKeys.invoices.byId(id),
      invoicesCache,
      optimisticData,
      () => apiClient.put<any>(`/invoices/${id}`, data),
      () => cacheInvalidation.invoices.invalidateById(id)
    );
  },
  
  delete: async (id: string) => {
    // Optimistically remove from cache
    invoicesCache.delete(cacheKeys.invoices.byId(id));
    
    try {
      const result = await apiClient.delete<void>(`/invoices/${id}`);
      cacheInvalidation.invoices.invalidateAll();
      return result;
    } catch (error) {
      // On error, invalidate to force refresh
      cacheInvalidation.invoices.invalidateAll();
      throw error;
    }
  },
  
  generatePdf: (id: string) => 
    apiClient.get<Blob>(`/invoices/${id}/pdf`),
  
  send: async (id: string) => {
    const result = await apiClient.post<any>(`/invoices/${id}/send`);
    
    // Invalidate invoice cache to reflect sent status
    cacheInvalidation.invoices.invalidateById(id);
    
    return result;
  },

  batchUpdate: async (updates: Array<{ id: string; data: any }>) => {
    return cachedApiClient.batchUpdate(
      updates.map(({ id, data }) => () => invoicesApi.update(id, data))
    );
  }
};

export const paymentsApi = {
  getAll: async (params?: Record<string, string>) => {
    const cacheKey = params ? 
      `${cacheKeys.payments.all()}:${JSON.stringify(params)}` : 
      cacheKeys.payments.all();
    
    return cachedApiClient.getCached(
      cacheKey,
      paymentsCache,
      () => apiClient.get<{ payments: any[]; meta: any }>('/payments', params)
    );
  },
  
  getById: async (id: string) => {
    return cachedApiClient.getCached(
      cacheKeys.payments.byId(id),
      paymentsCache,
      () => apiClient.get<any>(`/payments/${id}`)
    );
  },
  
  getByInvoice: async (invoiceId: string) => {
    return cachedApiClient.getCached(
      cacheKeys.payments.byInvoice(invoiceId),
      paymentsCache,
      () => apiClient.get<{ payments: any[]; meta: any }>('/payments', { invoiceId })
    );
  },
  
  create: async (data: any) => {
    const result = await apiClient.post<any>('/payments', data);
    
    // Invalidate relevant caches
    cacheInvalidation.payments.invalidateAll();
    if (data.invoiceId) {
      cacheInvalidation.payments.invalidateByInvoice(data.invoiceId);
      cacheInvalidation.invoices.invalidateById(data.invoiceId);
    }
    
    return result;
  },
  
  delete: async (id: string) => {
    // Get payment data first to know which invoice to invalidate
    const payment = paymentsCache.get(cacheKeys.payments.byId(id));
    
    // Optimistically remove from cache
    paymentsCache.delete(cacheKeys.payments.byId(id));
    
    try {
      const result = await apiClient.delete<void>(`/payments/${id}`);
      cacheInvalidation.payments.invalidateAll();
      
      // Invalidate related invoice cache
      if (payment?.invoiceId) {
        cacheInvalidation.invoices.invalidateById(payment.invoiceId);
      }
      
      return result;
    } catch (error) {
      // On error, invalidate to force refresh
      cacheInvalidation.payments.invalidateAll();
      throw error;
    }
  },

  batchCreate: async (payments: any[]) => {
    return cachedApiClient.batchUpdate(
      payments.map(data => () => paymentsApi.create(data))
    );
  }
};

export const settingsApi = {
  getCompany: async () => {
    return cachedApiClient.getCached(
      cacheKeys.settings.company(),
      settingsCache,
      () => apiClient.get<any>('/settings'),
      30 * 60 * 1000 // 30 minutes TTL for settings
    );
  },
  
  updateCompany: async (data: any) => {
    const result = await apiClient.put<any>('/settings', data);
    
    // Invalidate settings cache
    cacheInvalidation.settings.invalidateCompany();
    
    return result;
  }
};

export const templatesApi = {
  getAll: async () => {
    return cachedApiClient.getCached(
      cacheKeys.templates.all(),
      templatesCache,
      () => apiClient.get<{ templates: any[]; meta: any }>('/templates')
    );
  },
  
  getById: async (id: string) => {
    return cachedApiClient.getCached(
      cacheKeys.templates.byId(id),
      templatesCache,
      () => apiClient.get<any>(`/templates/${id}`)
    );
  },
  
  create: async (data: any) => {
    const result = await apiClient.post<any>('/templates', data);
    
    // Invalidate templates cache
    cacheInvalidation.templates.invalidateAll();
    
    return result;
  },
  
  update: async (id: string, data: any) => {
    const optimisticData = { ...data, id };
    
    return cachedApiClient.updateOptimistic(
      cacheKeys.templates.byId(id),
      templatesCache,
      optimisticData,
      () => apiClient.put<any>(`/templates/${id}`, data),
      () => cacheInvalidation.templates.invalidateById(id)
    );
  },
  
  delete: async (id: string) => {
    // Optimistically remove from cache
    templatesCache.delete(cacheKeys.templates.byId(id));
    
    try {
      const result = await apiClient.delete<void>(`/templates/${id}`);
      cacheInvalidation.templates.invalidateAll();
      return result;
    } catch (error) {
      // On error, invalidate to force refresh
      cacheInvalidation.templates.invalidateAll();
      throw error;
    }
  }
};