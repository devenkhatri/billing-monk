'use client';

// Error codes for consistent error handling (client-side only)
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