import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { DriveAuthenticationError } from './google-drive';
import type { Session } from 'next-auth';

export interface AuthenticationStatus {
  isAuthenticated: boolean;
  hasValidToken: boolean;
  tokenExpired: boolean;
  needsReauth: boolean;
  error?: string;
}

export interface AuthenticationResult {
  success: boolean;
  session?: Session & { accessToken?: string };
  error?: string;
  redirectUrl?: string;
}

/**
 * Handles Google Drive authentication flow and token management
 */
export class GoogleDriveAuthHandler {
  /**
   * Checks the current authentication status for Google Drive access
   */
  static async checkAuthenticationStatus(): Promise<AuthenticationStatus> {
    try {
      const session = await getServerSession(authOptions) as Session & { 
        accessToken?: string;
        error?: string;
      };

      if (!session) {
        return {
          isAuthenticated: false,
          hasValidToken: false,
          tokenExpired: false,
          needsReauth: true,
          error: 'No active session found'
        };
      }

      if (session.error === 'RefreshAccessTokenError') {
        return {
          isAuthenticated: true,
          hasValidToken: false,
          tokenExpired: true,
          needsReauth: true,
          error: 'Access token has expired and could not be refreshed'
        };
      }

      if (!session.accessToken) {
        return {
          isAuthenticated: true,
          hasValidToken: false,
          tokenExpired: false,
          needsReauth: true,
          error: 'No access token available'
        };
      }

      // Token exists, assume it's valid (Google API will validate)
      return {
        isAuthenticated: true,
        hasValidToken: true,
        tokenExpired: false,
        needsReauth: false
      };

    } catch (error) {
      console.error('Error checking authentication status:', error);
      return {
        isAuthenticated: false,
        hasValidToken: false,
        tokenExpired: false,
        needsReauth: true,
        error: error instanceof Error ? error.message : 'Unknown authentication error'
      };
    }
  }

  /**
   * Attempts to get a valid authenticated session for Google Drive operations
   */
  static async getAuthenticatedSession(): Promise<AuthenticationResult> {
    try {
      const authStatus = await this.checkAuthenticationStatus();

      if (!authStatus.isAuthenticated) {
        return {
          success: false,
          error: 'User is not authenticated',
          redirectUrl: '/api/auth/signin'
        };
      }

      if (authStatus.needsReauth) {
        return {
          success: false,
          error: authStatus.error || 'Re-authentication required',
          redirectUrl: '/api/auth/signin'
        };
      }

      const session = await getServerSession(authOptions) as Session & { accessToken?: string };
      
      if (!session?.accessToken) {
        return {
          success: false,
          error: 'No valid access token available',
          redirectUrl: '/api/auth/signin'
        };
      }

      return {
        success: true,
        session
      };

    } catch (error) {
      console.error('Error getting authenticated session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Handles authentication errors and provides appropriate user guidance
   */
  static handleAuthenticationError(error: Error): {
    userMessage: string;
    shouldRedirect: boolean;
    redirectUrl?: string;
    canRetry: boolean;
  } {
    if (error instanceof DriveAuthenticationError) {
      return {
        userMessage: 'Your Google Drive access has expired. Please sign in again to continue storing invoices.',
        shouldRedirect: true,
        redirectUrl: '/api/auth/signin',
        canRetry: false
      };
    }

    // Handle other authentication-related errors
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('invalid_grant')) {
      return {
        userMessage: 'Your Google account access has been revoked. Please sign in again.',
        shouldRedirect: true,
        redirectUrl: '/api/auth/signin',
        canRetry: false
      };
    }

    if (errorMessage.includes('token') && errorMessage.includes('expired')) {
      return {
        userMessage: 'Your session has expired. Please sign in again to continue.',
        shouldRedirect: true,
        redirectUrl: '/api/auth/signin',
        canRetry: false
      };
    }

    // Generic authentication error
    return {
      userMessage: 'There was a problem with your Google account access. Please try signing in again.',
      shouldRedirect: true,
      redirectUrl: '/api/auth/signin',
      canRetry: false
    };
  }

  /**
   * Validates that the current session has the required Google Drive scopes
   */
  static async validateGoogleDriveScopes(): Promise<{
    hasRequiredScopes: boolean;
    missingScopes: string[];
    error?: string;
  }> {
    try {
      const authResult = await this.getAuthenticatedSession();
      
      if (!authResult.success || !authResult.session?.accessToken) {
        return {
          hasRequiredScopes: false,
          missingScopes: ['https://www.googleapis.com/auth/drive.file'],
          error: 'No valid session available'
        };
      }

      // For now, assume scopes are correct if we have a token
      // In a production environment, you might want to validate scopes
      // by making a test API call or checking the token info
      return {
        hasRequiredScopes: true,
        missingScopes: []
      };

    } catch (error) {
      console.error('Error validating Google Drive scopes:', error);
      return {
        hasRequiredScopes: false,
        missingScopes: ['https://www.googleapis.com/auth/drive.file'],
        error: error instanceof Error ? error.message : 'Scope validation failed'
      };
    }
  }

  /**
   * Provides user-friendly guidance for authentication issues
   */
  static getAuthenticationGuidance(authStatus: AuthenticationStatus): {
    title: string;
    message: string;
    actions: Array<{
      label: string;
      type: 'primary' | 'secondary';
      action: 'signin' | 'refresh' | 'contact_support';
      url?: string;
    }>;
  } {
    if (!authStatus.isAuthenticated) {
      return {
        title: 'Sign In Required',
        message: 'Please sign in with your Google account to enable Google Drive storage for your invoices.',
        actions: [
          {
            label: 'Sign In',
            type: 'primary',
            action: 'signin',
            url: '/api/auth/signin'
          }
        ]
      };
    }

    if (authStatus.tokenExpired) {
      return {
        title: 'Session Expired',
        message: 'Your Google account session has expired. Please sign in again to continue using Google Drive storage.',
        actions: [
          {
            label: 'Sign In Again',
            type: 'primary',
            action: 'signin',
            url: '/api/auth/signin'
          }
        ]
      };
    }

    if (authStatus.needsReauth) {
      return {
        title: 'Re-authentication Required',
        message: authStatus.error || 'Please re-authenticate with Google to continue using Google Drive storage.',
        actions: [
          {
            label: 'Re-authenticate',
            type: 'primary',
            action: 'signin',
            url: '/api/auth/signin'
          }
        ]
      };
    }

    // Fallback for unknown authentication issues
    return {
      title: 'Authentication Issue',
      message: 'There was a problem with your Google account authentication. Please try signing in again.',
      actions: [
        {
          label: 'Sign In',
          type: 'primary',
          action: 'signin',
          url: '/api/auth/signin'
        },
        {
          label: 'Contact Support',
          type: 'secondary',
          action: 'contact_support'
        }
      ]
    };
  }
}