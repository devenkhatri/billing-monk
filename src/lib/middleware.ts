import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { env } from './env'

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: env.nextAuthSecret
    })

    // Check if user is authenticated
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication required' 
          } 
        },
        { status: 401 }
      )
    }

    // Check for token refresh errors
    if (token.error === 'RefreshAccessTokenError') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'TOKEN_REFRESH_ERROR', 
            message: 'Please sign in again' 
          } 
        },
        { status: 401 }
      )
    }

    // Check if token has required Google Sheets scope
    if (!token.accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Google Sheets access required' 
          } 
        },
        { status: 403 }
      )
    }

    // Add user info to request headers for use in API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', token.sub || '')
    requestHeaders.set('x-user-email', token.email || '')
    requestHeaders.set('x-access-token', token.accessToken as string)

    // Create new request with updated headers
    const authenticatedRequest = new NextRequest(request.url, {
      method: request.method,
      headers: requestHeaders,
      body: request.body
    })

    return await handler(authenticatedRequest)
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'AUTH_ERROR', 
          message: 'Authentication failed' 
        } 
      },
      { status: 500 }
    )
  }
}

// Helper function to extract user info from authenticated request
export function getUserFromRequest(request: NextRequest) {
  return {
    id: request.headers.get('x-user-id') || '',
    email: request.headers.get('x-user-email') || '',
    accessToken: request.headers.get('x-access-token') || ''
  }
}

// Re-export error handling functions from error-handler
export { createErrorResponse, createSuccessResponse, handleApiError } from './error-handler';