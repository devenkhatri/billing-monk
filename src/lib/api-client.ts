'use client';

import { ErrorCode, getUserFriendlyMessage } from './client-error-handler';
import {
  Client,
  Invoice,
  Payment,
  CompanySettings,
  Template,
  Project,
  Task,
  TimeEntry
} from '@/types';


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
  async makeRequest<T>(
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
import { apiCache, cachedFetch, invalidateCache } from './cache';

/**
 * Cached API wrapper with optimistic updates
 */
class CachedApiClient {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get data with caching using the simple cache system
   */
  async getCached<T>(
    url: string,
    params?: Record<string, string>,
    ttl?: number
  ): Promise<T> {
    return cachedFetch<T>(url, { method: 'GET' }, ttl);
  }

  /**
   * Update data with cache invalidation
   */
  async updateWithInvalidation<T>(
    url: string,
    data: unknown,
    method: 'POST' | 'PUT' | 'PATCH' = 'PUT',
    invalidationPattern?: string
  ): Promise<T> {
    const result = await this.apiClient.makeRequest<T>(url, {
      method,
      body: data ? JSON.stringify(data) : undefined,
    });

    // Invalidate related cache entries
    if (invalidationPattern) {
      invalidateCache(invalidationPattern);
    }

    return result;
  }

  /**
   * Delete with cache invalidation
   */
  async deleteWithInvalidation<T>(
    url: string,
    invalidationPattern?: string
  ): Promise<T> {
    const result = await this.apiClient.delete<T>(url);

    // Invalidate related cache entries
    if (invalidationPattern) {
      invalidateCache(invalidationPattern);
    }

    return result;
  }
}

const cachedApiClient = new CachedApiClient(apiClient);

// Specific API functions with caching
export const clientsApi = {
  getAll: async (params?: Record<string, string>) => {
    const url = params ? `/clients?${new URLSearchParams(params)}` : '/clients';
    return cachedApiClient.getCached<{ clients: Client[]; meta: any }>(url, undefined, 2 * 60 * 1000);
  },

  getById: async (id: string) => {
    return cachedApiClient.getCached<Client>(`/clients/${id}`, undefined, 5 * 60 * 1000);
  },

  create: async (data: Partial<Client>) => {
    const result = await cachedApiClient.updateWithInvalidation<Client>('/clients', data, 'POST', 'clients');
    return result;
  },

  update: async (id: string, data: Partial<Client>) => {
    return cachedApiClient.updateWithInvalidation<Client>(`/clients/${id}`, data, 'PUT', 'clients');
  },

  delete: async (id: string) => {
    return cachedApiClient.deleteWithInvalidation<void>(`/clients/${id}`, 'clients');
  }
};

export const invoicesApi = {
  getAll: async (params?: Record<string, string>) => {
    const url = params ? `/invoices?${new URLSearchParams(params)}` : '/invoices';
    return cachedApiClient.getCached<{ invoices: any[]; meta: any }>(url, undefined, 2 * 60 * 1000);
  },

  getById: async (id: string) => {
    return cachedApiClient.getCached<any>(`/invoices/${id}`, undefined, 5 * 60 * 1000);
  },

  getByClient: async (clientId: string) => {
    return cachedApiClient.getCached<{ invoices: any[]; meta: any }>(`/invoices?clientId=${clientId}`, undefined, 2 * 60 * 1000);
  },

  getRecurring: async () => {
    return cachedApiClient.getCached<{ invoices: any[]; meta: any }>('/invoices/recurring', undefined, 5 * 60 * 1000);
  },

  create: async (data: any) => {
    return cachedApiClient.updateWithInvalidation<any>('/invoices', data, 'POST', 'invoices');
  },

  update: async (id: string, data: any) => {
    return cachedApiClient.updateWithInvalidation<any>(`/invoices/${id}`, data, 'PUT', 'invoices');
  },

  delete: async (id: string) => {
    return cachedApiClient.deleteWithInvalidation<void>(`/invoices/${id}`, 'invoices');
  },

  generatePdf: (id: string) =>
    apiClient.get<Blob>(`/invoices/${id}/pdf`),

  send: async (id: string) => {
    const result = await cachedApiClient.updateWithInvalidation<any>(`/invoices/${id}/send`, {}, 'POST', 'invoices');
    return result;
  }
};

export const paymentsApi = {
  getAll: async (params?: Record<string, string>) => {
    const url = params ? `/payments?${new URLSearchParams(params)}` : '/payments';
    return cachedApiClient.getCached<{ payments: Payment[]; meta: any }>(url, undefined, 2 * 60 * 1000);
  },

  getById: async (id: string) => {
    return cachedApiClient.getCached<Payment>(`/payments/${id}`, undefined, 5 * 60 * 1000);
  },

  getByInvoice: async (invoiceId: string) => {
    return cachedApiClient.getCached<{ payments: Payment[]; meta: any }>(`/payments?invoiceId=${invoiceId}`, undefined, 2 * 60 * 1000);
  },

  create: async (data: Partial<Payment>) => {
    const result = await cachedApiClient.updateWithInvalidation<Payment>('/payments', data, 'POST', 'payments');
    // Also invalidate invoices cache since payment affects invoice status
    invalidateCache('invoices');
    return result;
  },

  delete: async (id: string) => {
    const result = await cachedApiClient.deleteWithInvalidation<void>(`/payments/${id}`, 'payments');
    // Also invalidate invoices cache since payment affects invoice status
    invalidateCache('invoices');
    return result;
  }
};

export const settingsApi = {
  getCompany: async () => {
    return cachedApiClient.getCached<any>('/settings', undefined, 30 * 60 * 1000); // 30 minutes TTL for settings
  },

  updateCompany: async (data: any) => {
    return cachedApiClient.updateWithInvalidation<any>('/settings', data, 'PUT', 'settings');
  }
};

export const templatesApi = {
  getAll: async () => {
    return cachedApiClient.getCached<{ templates: any[]; meta: any }>('/templates', undefined, 5 * 60 * 1000);
  },

  getById: async (id: string) => {
    return cachedApiClient.getCached<any>(`/templates/${id}`, undefined, 10 * 60 * 1000);
  },

  create: async (data: any) => {
    return cachedApiClient.updateWithInvalidation<any>('/templates', data, 'POST', 'templates');
  },

  update: async (id: string, data: any) => {
    return cachedApiClient.updateWithInvalidation<any>(`/templates/${id}`, data, 'PUT', 'templates');
  },

  delete: async (id: string) => {
    return cachedApiClient.deleteWithInvalidation<void>(`/templates/${id}`, 'templates');
  }
};

export const activityLogsApi = {
  getAll: async (filters?: any, pagination?: any) => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    if (pagination) {
      if (pagination.page) params.append('page', String(pagination.page));
      if (pagination.limit) params.append('limit', String(pagination.limit));
    }

    const url = `/activity-logs${params.toString() ? `?${params.toString()}` : ''}`;
    return cachedApiClient.getCached<{ logs: any[]; total: number; page: number; limit: number; hasMore: boolean }>(url, undefined, 1 * 60 * 1000); // 1 minute cache for activity logs
  },

  create: async (data: any) => {
    return apiClient.post<any>('/activity-logs', data);
  }
};