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

// Specific API functions for common operations
export const clientsApi = {
  getAll: (params?: Record<string, string>) => 
    apiClient.get<{ clients: any[]; meta: any }>('/clients', params),
  
  getById: (id: string) => 
    apiClient.get<any>(`/clients/${id}`),
  
  create: (data: any) => 
    apiClient.post<any>('/clients', data),
  
  update: (id: string, data: any) => 
    apiClient.put<any>(`/clients/${id}`, data),
  
  delete: (id: string) => 
    apiClient.delete<void>(`/clients/${id}`)
};

export const invoicesApi = {
  getAll: (params?: Record<string, string>) => 
    apiClient.get<{ invoices: any[]; meta: any }>('/invoices', params),
  
  getById: (id: string) => 
    apiClient.get<any>(`/invoices/${id}`),
  
  create: (data: any) => 
    apiClient.post<any>('/invoices', data),
  
  update: (id: string, data: any) => 
    apiClient.put<any>(`/invoices/${id}`, data),
  
  delete: (id: string) => 
    apiClient.delete<void>(`/invoices/${id}`),
  
  generatePdf: (id: string) => 
    apiClient.get<Blob>(`/invoices/${id}/pdf`),
  
  send: (id: string) => 
    apiClient.post<any>(`/invoices/${id}/send`)
};

export const paymentsApi = {
  getAll: (params?: Record<string, string>) => 
    apiClient.get<{ payments: any[]; meta: any }>('/payments', params),
  
  getById: (id: string) => 
    apiClient.get<any>(`/payments/${id}`),
  
  create: (data: any) => 
    apiClient.post<any>('/payments', data),
  
  delete: (id: string) => 
    apiClient.delete<void>(`/payments/${id}`)
};