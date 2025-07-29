# OAuth Authentication

Invoice Ninja Clone uses OAuth 2.0 for secure API authentication. This guide covers setting up OAuth authentication for API access, including both user authentication and service-to-service authentication.

## Overview

The API supports two OAuth 2.0 flows:
- **Authorization Code Flow**: For web applications acting on behalf of users
- **Client Credentials Flow**: For server-to-server integrations

## OAuth 2.0 Flows

### Authorization Code Flow

Used when your application needs to access the API on behalf of a user.

#### Step 1: Authorization Request

Redirect users to the authorization endpoint:

```
GET https://your-domain.com/api/auth/authorize?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  scope=read:clients write:invoices&
  state=RANDOM_STATE_STRING
```

#### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `response_type` | Yes | Must be `code` |
| `client_id` | Yes | Your OAuth client ID |
| `redirect_uri` | Yes | Must match registered redirect URI |
| `scope` | Yes | Space-separated list of requested scopes |
| `state` | Recommended | Random string to prevent CSRF attacks |

#### Step 2: Authorization Response

After user consent, they're redirected to your redirect URI:

```
https://your-app.com/callback?
  code=AUTHORIZATION_CODE&
  state=RANDOM_STATE_STRING
```

#### Step 3: Token Exchange

Exchange the authorization code for an access token:

```http
POST /api/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
redirect_uri=YOUR_REDIRECT_URI
```

#### Token Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def50200...",
  "scope": "read:clients write:invoices"
}
```

### Client Credentials Flow

Used for server-to-server authentication without user involvement.

#### Token Request

```http
POST /api/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
scope=read:clients write:invoices
```

#### Token Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read:clients write:invoices"
}
```

## Scopes

OAuth scopes define the permissions your application requests:

### Available Scopes

| Scope | Description |
|-------|-------------|
| `read:clients` | Read client information |
| `write:clients` | Create, update, delete clients |
| `read:invoices` | Read invoice information |
| `write:invoices` | Create, update, delete invoices |
| `read:payments` | Read payment information |
| `write:payments` | Record and update payments |
| `read:reports` | Generate and read reports |
| `read:settings` | Read application settings |
| `write:settings` | Update application settings |
| `admin` | Full administrative access |

### Scope Examples

```bash
# Read-only access to clients and invoices
scope=read:clients read:invoices

# Full access to clients and invoices
scope=read:clients write:clients read:invoices write:invoices

# Administrative access
scope=admin
```

## Using Access Tokens

### Making API Requests

Include the access token in the Authorization header:

```http
GET /api/clients
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Token Validation

The API validates tokens on each request:
- **Signature verification**: Ensures token integrity
- **Expiration check**: Rejects expired tokens
- **Scope validation**: Ensures sufficient permissions
- **Revocation check**: Verifies token hasn't been revoked

## Token Management

### Token Refresh

Use refresh tokens to obtain new access tokens:

```http
POST /api/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&
refresh_token=REFRESH_TOKEN&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET
```

### Token Revocation

Revoke tokens when no longer needed:

```http
POST /api/auth/revoke
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer ACCESS_TOKEN

token=ACCESS_TOKEN&
token_type_hint=access_token
```

## OAuth Client Setup

### Creating OAuth Clients

OAuth clients must be registered before use:

#### Web Application Client

```json
{
  "name": "My Invoice App",
  "client_type": "web",
  "redirect_uris": [
    "https://myapp.com/callback",
    "https://myapp.com/auth/callback"
  ],
  "scopes": [
    "read:clients",
    "write:clients",
    "read:invoices",
    "write:invoices"
  ]
}
```

#### Service Application Client

```json
{
  "name": "Invoice Integration Service",
  "client_type": "service",
  "scopes": [
    "read:clients",
    "read:invoices",
    "write:payments"
  ]
}
```

### Client Configuration

After registration, you'll receive:
- **Client ID**: Public identifier for your application
- **Client Secret**: Secret key for authentication (keep secure)
- **Allowed Scopes**: Scopes your client can request
- **Redirect URIs**: Valid redirect URIs for authorization flow

## Security Best Practices

### Token Security

- **Secure Storage**: Store tokens securely (encrypted at rest)
- **HTTPS Only**: Always use HTTPS for token transmission
- **Short Expiration**: Use short-lived access tokens
- **Refresh Rotation**: Rotate refresh tokens regularly

### Client Security

- **Secret Protection**: Never expose client secrets in client-side code
- **Redirect URI Validation**: Use exact redirect URI matching
- **State Parameter**: Always use state parameter to prevent CSRF
- **Scope Limitation**: Request minimal required scopes

### Implementation Security

```javascript
// Good: Secure token storage
const token = await secureStorage.get('access_token');

// Bad: Insecure token storage
localStorage.setItem('access_token', token);

// Good: HTTPS only
const apiUrl = 'https://api.example.com';

// Bad: HTTP usage
const apiUrl = 'http://api.example.com';
```

## Error Handling

### OAuth Errors

#### Invalid Client

```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}
```

#### Invalid Grant

```json
{
  "error": "invalid_grant",
  "error_description": "The provided authorization grant is invalid"
}
```

#### Insufficient Scope

```json
{
  "error": "insufficient_scope",
  "error_description": "The request requires higher privileges than provided"
}
```

### API Authentication Errors

#### Invalid Token

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The access token is invalid or expired"
  }
}
```

#### Insufficient Permissions

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_SCOPE",
    "message": "Token lacks required scope: write:clients"
  }
}
```

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

class InvoiceNinjaAuth {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.baseUrl = 'https://your-domain.com';
  }

  // Generate authorization URL
  getAuthorizationUrl(scopes, state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      state: state
    });
    
    return `${this.baseUrl}/api/auth/authorize?${params}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/auth/token`, {
        grant_type: 'authorization_code',
        code: code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Token exchange failed: ${error.response.data.error_description}`);
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/auth/token`, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      return response.data;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.response.data.error_description}`);
    }
  }
}

// Usage example
const auth = new InvoiceNinjaAuth(
  'your-client-id',
  'your-client-secret',
  'https://yourapp.com/callback'
);

// Generate authorization URL
const authUrl = auth.getAuthorizationUrl(
  ['read:clients', 'write:invoices'],
  'random-state-string'
);

console.log('Visit this URL to authorize:', authUrl);
```

### Python

```python
import requests
from urllib.parse import urlencode

class InvoiceNinjaAuth:
    def __init__(self, client_id, client_secret, redirect_uri):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.base_url = 'https://your-domain.com'

    def get_authorization_url(self, scopes, state):
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(scopes),
            'state': state
        }
        return f"{self.base_url}/api/auth/authorize?{urlencode(params)}"

    def exchange_code_for_tokens(self, code):
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'redirect_uri': self.redirect_uri
        }
        
        response = requests.post(
            f"{self.base_url}/api/auth/token",
            data=data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Token exchange failed: {response.json()}")

# Usage
auth = InvoiceNinjaAuth(
    'your-client-id',
    'your-client-secret',
    'https://yourapp.com/callback'
)

auth_url = auth.get_authorization_url(
    ['read:clients', 'write:invoices'],
    'random-state-string'
)

print(f"Visit this URL to authorize: {auth_url}")
```

## Testing OAuth Flow

### Using Postman

1. **Create OAuth 2.0 Request**:
   - Authorization Type: OAuth 2.0
   - Grant Type: Authorization Code
   - Callback URL: Your registered redirect URI
   - Auth URL: `https://your-domain.com/api/auth/authorize`
   - Access Token URL: `https://your-domain.com/api/auth/token`

2. **Configure Client Credentials**:
   - Client ID: Your OAuth client ID
   - Client Secret: Your OAuth client secret
   - Scope: Required scopes (space-separated)

3. **Get New Access Token**: Click to start OAuth flow

### Using cURL

```bash
# Step 1: Get authorization code (manual browser step)
# Visit: https://your-domain.com/api/auth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=read:clients&state=test

# Step 2: Exchange code for token
curl -X POST https://your-domain.com/api/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=AUTHORIZATION_CODE&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=YOUR_REDIRECT_URI"

# Step 3: Use access token
curl -X GET https://your-domain.com/api/clients \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Troubleshooting

### Common Issues

#### Invalid Redirect URI
- Ensure redirect URI exactly matches registered URI
- Check for trailing slashes and protocol (http vs https)
- Verify URI is properly URL-encoded

#### Scope Issues
- Verify requested scopes are allowed for your client
- Check that token has sufficient scope for API endpoint
- Ensure scope parameter is properly formatted (space-separated)

#### Token Expiration
- Implement automatic token refresh
- Handle 401 responses by refreshing tokens
- Store refresh tokens securely for long-term access

## Related Topics

- [API Overview](../overview.md)
- [API Keys Authentication](./api-keys.md)
- [Client Endpoints](../endpoints/clients.md)
- [Code Examples](../examples/client-operations.md)