import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse } from '@/lib/middleware'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'No active session found',
        401
      )
    }

    return createSuccessResponse({
      isAuthenticated: true,
      user: {
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image
      },
      hasAccessToken: !!session.accessToken,
      hasError: !!session.error,
      error: session.error
    })
  } catch (error) {
    console.error('Auth status check error:', error)
    
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to check authentication status',
      500
    )
  }
}