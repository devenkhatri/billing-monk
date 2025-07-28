import { NextResponse } from 'next/server';
import { GoogleSheetsError, AuthenticationError, RateLimitError, NetworkError, ValidationError } from './google-sheets';
import { ZodError } from 'zod';

// Error codes for consistent error handling
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // External service errors
  GOOGLE_SHEETS_ERROR: 'GOOGLE_SHEETS_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Internal errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    retryable?: boolean;
    timestamp: string;
  };
}

// Success response interface
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number = 400,
  details?: unknown,
  retryable: boolean = false
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
        retryable,
        timestamp: new Date().toISOString()
      }
    },
    { status }
  );
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  meta?: Record<string, unknown>
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Handles and converts various error types to standardized error responses
 */
export function handleApiError(error: unknown, operation: string = 'operation'): NextResponse<ErrorResponse> {
  console.error(`Error during ${operation}:`, error);

  // Handle Google Sheets specific errors
  if (error instanceof AuthenticationError) {
    return createErrorResponse(
      ERROR_CODES.AUTHENTICATION_FAILED,
      'Authentication with Google Sheets failed. Please sign in again.',
      401,
      { operation },
      false
    );
  }

  if (error instanceof RateLimitError) {
    return createErrorResponse(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      'Too many requests to Google Sheets. Please try again in a moment.',
      429,
      { operation, retryAfter: 60 },
      true
    );
  }

  if (error instanceof NetworkError) {
    return createErrorResponse(
      ERROR_CODES.NETWORK_ERROR,
      'Network connection to Google Sheets failed. Please check your connection and try again.',
      503,
      { operation },
      true
    );
  }

  if (error instanceof ValidationError) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      error.message,
      400,
      { operation },
      false
    );
  }

  if (error instanceof GoogleSheetsError) {
    return createErrorResponse(
      ERROR_CODES.GOOGLE_SHEETS_ERROR,
      error.message,
      error.statusCode || 500,
      { operation, code: error.code },
      error.retryable
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const fieldErrors = error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }));

    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid input data provided',
      400,
      { operation, fieldErrors },
      false
    );
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Authentication required',
        401,
        { operation },
        false
      );
    }

    if (error.message.includes('not found')) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Requested resource not found',
        404,
        { operation },
        false
      );
    }

    if (error.message.includes('network') || error.message.includes('timeout')) {
      return createErrorResponse(
        ERROR_CODES.NETWORK_ERROR,
        'Network error occurred. Please try again.',
        503,
        { operation },
        true
      );
    }

    // Generic error handling
    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'An unexpected error occurred. Please try again.',
      500,
      { operation, originalMessage: error.message },
      true
    );
  }

  // Handle unknown error types
  return createErrorResponse(
    ERROR_CODES.UNKNOWN_ERROR,
    'An unknown error occurred. Please try again.',
    500,
    { operation, error: String(error) },
    true
  );
}

/**
 * Wraps an async API handler with comprehensive error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>,
  operation: string
): Promise<NextResponse<SuccessResponse<T> | ErrorResponse>> {
  return handler()
    .then(result => createSuccessResponse(result))
    .catch(error => handleApiError(error, operation));
}

/**
 * User-friendly error messages for common error codes
 */
export const USER_FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.UNAUTHORIZED]: 'Please sign in to continue',
  [ERROR_CODES.AUTHENTICATION_FAILED]: 'Authentication failed. Please sign in again',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'You don\'t have permission to perform this action',
  
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again',
  [ERROR_CODES.INVALID_INPUT]: 'The information provided is not valid',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields',
  [ERROR_CODES.INVALID_FORMAT]: 'Please check the format of your input',
  
  [ERROR_CODES.NOT_FOUND]: 'The requested item could not be found',
  [ERROR_CODES.ALREADY_EXISTS]: 'This item already exists',
  [ERROR_CODES.RESOURCE_CONFLICT]: 'This action conflicts with existing data',
  
  [ERROR_CODES.GOOGLE_SHEETS_ERROR]: 'There was a problem with Google Sheets. Please try again',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again',
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection problem. Please check your connection',
  
  [ERROR_CODES.INTERNAL_ERROR]: 'Something went wrong. Please try again',
  [ERROR_CODES.DATABASE_ERROR]: 'Database error occurred. Please try again',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again'
};

/**
 * Gets a user-friendly error message for an error code
 */
export function getUserFriendlyMessage(code: ErrorCode, fallback?: string): string {
  return USER_FRIENDLY_MESSAGES[code] || fallback || 'An error occurred. Please try again.';
}