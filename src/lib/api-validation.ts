import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { createErrorResponse } from './middleware';
import { z } from 'zod';

/**
 * Validates authentication for API routes
 */
export async function validateAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken) {
    return {
      isValid: false,
      error: createErrorResponse('UNAUTHORIZED', 'Authentication required', 401)
    };
  }

  return {
    isValid: true,
    session
  };
}

/**
 * Validates required parameters in API routes
 */
export function validateRequiredParams(params: Record<string, unknown>, required: string[]) {
  const missing = required.filter(param => !params[param]);
  
  if (missing.length > 0) {
    return {
      isValid: false,
      error: createErrorResponse(
        'VALIDATION_ERROR',
        `Missing required parameters: ${missing.join(', ')}`,
        400
      )
    };
  }

  return { isValid: true };
}

/**
 * Validates request body with Zod schema
 */
export function validateRequestBody<T>(body: unknown, schema: z.ZodSchema<T>) {
  const result = schema.safeParse(body);
  
  if (!result.success) {
    return {
      isValid: false,
      error: createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request data',
        400,
        result.error.issues
      )
    };
  }

  return {
    isValid: true,
    data: result.data
  };
}

/**
 * Validates query parameters with Zod schema
 */
export function validateQueryParams<T>(searchParams: URLSearchParams, schema: z.ZodSchema<T>) {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);
  
  if (!result.success) {
    return {
      isValid: false,
      error: createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        400,
        result.error.issues
      )
    };
  }

  return {
    isValid: true,
    data: result.data
  };
}

/**
 * Validates UUID format
 */
export function validateUUID(id: string, fieldName: string = 'ID') {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!id || !uuidRegex.test(id)) {
    return {
      isValid: false,
      error: createErrorResponse(
        'VALIDATION_ERROR',
        `Invalid ${fieldName} format`,
        400
      )
    };
  }

  return { isValid: true };
}

/**
 * Validates pagination parameters
 */
export function validatePagination(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  if (page < 1) {
    return {
      isValid: false,
      error: createErrorResponse(
        'VALIDATION_ERROR',
        'Page must be greater than 0',
        400
      )
    };
  }

  if (limit < 1 || limit > 100) {
    return {
      isValid: false,
      error: createErrorResponse(
        'VALIDATION_ERROR',
        'Limit must be between 1 and 100',
        400
      )
    };
  }

  if (!['asc', 'desc'].includes(sortOrder)) {
    return {
      isValid: false,
      error: createErrorResponse(
        'VALIDATION_ERROR',
        'Sort order must be "asc" or "desc"',
        400
      )
    };
  }

  return {
    isValid: true,
    data: { page, limit, sortBy, sortOrder }
  };
}

/**
 * Validates date range parameters
 */
export function validateDateRange(dateFrom?: string | null, dateTo?: string | null) {
  if (dateFrom && isNaN(Date.parse(dateFrom))) {
    return {
      isValid: false,
      error: createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid dateFrom format',
        400
      )
    };
  }

  if (dateTo && isNaN(Date.parse(dateTo))) {
    return {
      isValid: false,
      error: createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid dateTo format',
        400
      )
    };
  }

  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    return {
      isValid: false,
      error: createErrorResponse(
        'VALIDATION_ERROR',
        'dateFrom must be before dateTo',
        400
      )
    };
  }

  return { isValid: true };
}

/**
 * Comprehensive API route wrapper with common validations
 */
export async function withApiValidation<T>(
  request: NextRequest,
  handler: (request: NextRequest, session: any) => Promise<T>,
  options: {
    requireAuth?: boolean;
    validateParams?: string[];
    params?: Record<string, unknown>;
  } = {}
) {
  try {
    // Validate authentication if required
    if (options.requireAuth !== false) {
      const authResult = await validateAuth(request);
      if (!authResult.isValid) {
        return authResult.error;
      }

      // Validate required parameters if specified
      if (options.validateParams && options.params) {
        const paramsResult = validateRequiredParams(options.params, options.validateParams);
        if (!paramsResult.isValid) {
          return paramsResult.error;
        }
      }

      return await handler(request, authResult.session);
    }

    return await handler(request, null);
  } catch (error) {
    console.error('API validation error:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      500,
      error
    );
  }
}