# API Overview

Invoice Ninja Clone provides a comprehensive REST API that allows developers to integrate with the invoicing system programmatically. This API enables you to manage clients, invoices, payments, and other resources through HTTP requests.

## API Architecture

### RESTful Design
The API follows REST principles with:
- **Resource-based URLs**: Each endpoint represents a specific resource
- **HTTP Methods**: Standard methods (GET, POST, PUT, DELETE) for different operations
- **Status Codes**: Meaningful HTTP status codes for responses
- **JSON Format**: All requests and responses use JSON

### Base URL
```
https://your-domain.com/api
```

### API Version
Current API version: **v1**
- Version is included in the URL path: `/api/v1/`
- Backward compatibility maintained for major versions
- Deprecation notices provided for breaking changes

## Authentication

### OAuth 2.0
The API uses OAuth 2.0 for authentication:
- **Authorization Code Flow**: For web applications
- **Client Credentials Flow**: For server-to-server integration
- **Scopes**: Fine-grained permissions for different resources

### API Keys
Alternative authentication method:
- **Header-based**: Include API key in request headers
- **Scope-limited**: Keys can be restricted to specific operations
- **Revocable**: Keys can be revoked without affecting user sessions

See [Authentication Guide](./authentication/oauth.md) for detailed setup instructions.

## Request Format

### Headers
Required headers for all requests:
```http
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
Accept: application/json
```

### Request Body
All POST and PUT requests should include JSON data:
```json
{
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "phone": "+1-555-123-4567"
}
```

### Query Parameters
GET requests support query parameters for filtering and pagination:
```
GET /api/clients?page=1&limit=25&status=active
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "client_123",
    "name": "Acme Corporation",
    "email": "billing@acme.com"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### Pagination
List endpoints return paginated results:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current_page": 1,
    "per_page": 25,
    "total": 150,
    "total_pages": 6,
    "has_next": true,
    "has_prev": false
  }
}
```

## HTTP Status Codes

### Success Codes
- **200 OK**: Request successful, data returned
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no data returned

### Client Error Codes
- **400 Bad Request**: Invalid request format or parameters
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate email)
- **422 Unprocessable Entity**: Validation errors

### Server Error Codes
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: External service unavailable
- **503 Service Unavailable**: Temporary service unavailability

## Rate Limiting

### Limits
- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour
- **Burst limit**: 50 requests per minute

### Headers
Rate limit information included in response headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

### Handling Rate Limits
When rate limit is exceeded:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 3600
  }
}
```

## Available Resources

### Core Resources

#### Clients
- **Endpoint**: `/api/clients`
- **Operations**: Create, read, update, delete clients
- **Features**: Search, filtering, bulk operations
- **Documentation**: [Clients API](./endpoints/clients.md)

#### Invoices
- **Endpoint**: `/api/invoices`
- **Operations**: Create, read, update, delete invoices
- **Features**: PDF generation, status management, line items
- **Documentation**: [Invoices API](./endpoints/invoices.md)

#### Payments
- **Endpoint**: `/api/payments`
- **Operations**: Record, read, update payments
- **Features**: Payment tracking, invoice association
- **Documentation**: [Payments API](./endpoints/payments.md)

#### Templates
- **Endpoint**: `/api/templates`
- **Operations**: Create, read, update, delete templates
- **Features**: Template management, line item presets
- **Documentation**: [Templates API](./endpoints/templates.md)

### Utility Resources

#### Reports
- **Endpoint**: `/api/reports`
- **Operations**: Generate various business reports
- **Features**: Revenue reports, client reports, export options
- **Documentation**: [Reports API](./endpoints/reports.md)

#### Settings
- **Endpoint**: `/api/settings`
- **Operations**: Read, update application settings
- **Features**: Company settings, tax configuration
- **Documentation**: [Settings API](./endpoints/settings.md)

## Data Models

### Client Model
```json
{
  "id": "client_123",
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "phone": "+1-555-123-4567",
  "address": {
    "street": "123 Business Ave",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Invoice Model
```json
{
  "id": "invoice_456",
  "invoice_number": "INV-2024-0001",
  "client_id": "client_123",
  "status": "sent",
  "issue_date": "2024-01-15",
  "due_date": "2024-02-15",
  "line_items": [
    {
      "id": "item_789",
      "description": "Web Development Services",
      "quantity": 40,
      "rate": 100.00,
      "amount": 4000.00
    }
  ],
  "subtotal": 4000.00,
  "tax_rate": 0.08,
  "tax_amount": 320.00,
  "total": 4320.00,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## Error Handling

### Error Codes
Common error codes and their meanings:

#### Validation Errors
- **VALIDATION_ERROR**: General validation failure
- **REQUIRED_FIELD**: Required field missing
- **INVALID_FORMAT**: Field format invalid
- **DUPLICATE_VALUE**: Value already exists

#### Authentication Errors
- **INVALID_TOKEN**: Access token invalid or expired
- **INSUFFICIENT_SCOPE**: Token lacks required permissions
- **AUTHENTICATION_REQUIRED**: Authentication needed

#### Resource Errors
- **RESOURCE_NOT_FOUND**: Requested resource doesn't exist
- **RESOURCE_CONFLICT**: Resource state conflict
- **RESOURCE_LOCKED**: Resource temporarily unavailable

### Error Response Details
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for one or more fields",
    "details": {
      "errors": [
        {
          "field": "email",
          "code": "INVALID_FORMAT",
          "message": "Email address format is invalid"
        },
        {
          "field": "phone",
          "code": "REQUIRED_FIELD",
          "message": "Phone number is required"
        }
      ]
    }
  }
}
```

## SDK and Libraries

### Official SDKs
- **JavaScript/Node.js**: npm package available
- **Python**: PyPI package available
- **PHP**: Composer package available

### Community Libraries
- **Ruby**: Community-maintained gem
- **Go**: Community-maintained package
- **C#**: Community-maintained NuGet package

### Installation Example (JavaScript)
```bash
npm install invoice-ninja-clone-sdk
```

```javascript
import { InvoiceNinjaClient } from 'invoice-ninja-clone-sdk';

const client = new InvoiceNinjaClient({
  baseUrl: 'https://your-domain.com/api',
  accessToken: 'your-access-token'
});

// Create a client
const newClient = await client.clients.create({
  name: 'Acme Corporation',
  email: 'billing@acme.com'
});
```

## Webhooks

### Event Types
The API supports webhooks for real-time notifications:
- **client.created**: New client added
- **client.updated**: Client information changed
- **invoice.created**: New invoice created
- **invoice.sent**: Invoice sent to client
- **invoice.paid**: Invoice marked as paid
- **payment.recorded**: New payment recorded

### Webhook Configuration
```json
{
  "url": "https://your-app.com/webhooks/invoice-ninja",
  "events": ["invoice.created", "invoice.paid"],
  "secret": "webhook-secret-key"
}
```

## Testing

### Sandbox Environment
- **Base URL**: `https://sandbox.your-domain.com/api`
- **Test Data**: Pre-populated with sample data
- **Reset**: Data resets daily
- **Rate Limits**: Relaxed for testing

### API Testing Tools
- **Postman Collection**: Available for download
- **OpenAPI Spec**: Swagger documentation available
- **cURL Examples**: Provided for each endpoint

## Best Practices

### Performance
- **Pagination**: Use pagination for large datasets
- **Filtering**: Apply filters to reduce response size
- **Caching**: Implement client-side caching where appropriate
- **Batch Operations**: Use bulk endpoints when available

### Security
- **HTTPS Only**: Always use HTTPS in production
- **Token Security**: Store tokens securely
- **Scope Limitation**: Use minimal required scopes
- **Regular Rotation**: Rotate API keys regularly

### Error Handling
- **Retry Logic**: Implement exponential backoff for retries
- **Error Logging**: Log errors for debugging
- **Graceful Degradation**: Handle API unavailability
- **User Feedback**: Provide meaningful error messages

## Support and Resources

### Documentation
- **API Reference**: Detailed endpoint documentation
- **Code Examples**: Sample implementations
- **SDKs**: Official and community libraries
- **Changelog**: API version history

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Stack Overflow**: Community Q&A
- **Discord**: Real-time community support
- **Blog**: Updates and tutorials

### Professional Support
- **Email Support**: Technical assistance
- **Priority Support**: Paid support plans
- **Custom Integration**: Professional services
- **Training**: API integration workshops

## Next Steps

To get started with the API:

1. [Set up authentication](./authentication/oauth.md)
2. [Explore client endpoints](./endpoints/clients.md)
3. [Try invoice operations](./endpoints/invoices.md)
4. [Review code examples](./examples/client-operations.md)
5. [Download SDK](https://github.com/your-org/invoice-ninja-clone-sdk)

## Related Topics

- [Authentication Guide](./authentication/oauth.md)
- [Client Endpoints](./endpoints/clients.md)
- [Invoice Endpoints](./endpoints/invoices.md)
- [Code Examples](./examples/client-operations.md)
- [SDK Documentation](https://github.com/your-org/invoice-ninja-clone-sdk)