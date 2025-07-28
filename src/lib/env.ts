// Environment variable validation and configuration

export interface EnvironmentConfig {
  googleClientId: string
  googleClientSecret: string
  googleSheetsSpreadsheetId: string
  nextAuthUrl: string
  nextAuthSecret: string
  nodeEnv: string
}

export function validateEnvironment(): EnvironmentConfig {
  const requiredEnvVars = {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleSheetsSpreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nextAuthSecret: process.env.NEXTAUTH_SECRET,
    nodeEnv: process.env.NODE_ENV || 'development'
  }

  // Only validate in runtime, not during build
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
    const missingVars: string[] = []

    // Check for missing required environment variables
    Object.entries(requiredEnvVars).forEach(([key, value]) => {
      if (!value && key !== 'nodeEnv') {
        missingVars.push(key.toUpperCase().replace(/([A-Z])/g, '_$1'))
      }
    })

    if (missingVars.length > 0 && process.env.NEXT_PHASE !== 'phase-production-build') {
      console.warn(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env.local file and ensure all required variables are set.'
      )
    }
  }

  return requiredEnvVars as EnvironmentConfig
}

export const env = validateEnvironment()