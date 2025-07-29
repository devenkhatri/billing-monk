# Clients API

The Clients API allows you to manage customer information programmatically. This includes creating, reading, updating, and deleting client records, as well as searching and filtering client data.

## Base Endpoint

```
/api/clients
```

## Authentication

All client endpoints require authentication. Include your access token in the Authorization header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Client Object

### Client Model
```json
{
  "id": "client_abc123",
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "phone": "+1-555-123-4567",
  "address": {
    "street": "123 Business Ave, Suite 100",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "United States"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "invoice_count": 5,
  "total_billed": 12500.00,
  "total_paid": 10000.00,
  "outstanding_balance": 2500.00
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Auto-generated | Unique client identifier |
| `name` | string | Yes | Client or company name |
| `email` | string | Yes | Primary email address |
| `phone` | string | No | Phone number |
| `address` | object | No | Complete address information |
| `address.street` | string | No | Street address |
| `address.city` | string | No | City name |
| `address.state` | string | No | State or province |
| `address.zip` | string | No | ZIP or postal code |
| `address.country` | string | No | Country name |
| `created_at` | string | Auto-generated | Creation timestamp |
| `updated_at` | string | Auto-generated | Last update timestamp |
| `invoice_count` | integer | Computed | Number of invoices for this client |
| `total_billed` | number | Computed | Total amount billed to client |
| `total_paid` | number | Computed | Total amount paid by client |
| `outstanding_balance` | number | Computed | Current outstanding balance |

## Endpoints

### List Clients

Retrieve a paginated list of all clients.

```http
GET /api/clients
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 25 | Number of clients per page (max 100) |
| `search` | string | - | Search clients by name or email |
| `sort` | string | `name` | Sort field (`name`, `email`, `created_at`, `updated_at`) |
| `order` | string | `asc` | Sort order (`asc` or `desc`) |
| `status` | string | - | Filter by status (`active`, `inactive`) |

#### Example Request

```bash
curl -X GET "https://your-domain.com/api/clients?page=1&limit=10&search=acme" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "client_abc123",
      "name": "Acme Corporation",
      "email": "billing@acme.com",
      "phone": "+1-555-123-4567",
      "address": {
        "street": "123 Business Ave",
        "city": "New York",
        "state": "NY",
        "zip": "10001",
        "country": "United States"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "invoice_count": 5,
      "total_billed": 12500.00,
      "total_paid": 10000.00,
      "outstanding_balance": 2500.00
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total": 1,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

### Get Client

Retrieve a specific client by ID.

```http
GET /api/clients/{id}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Client ID |

#### Example Request

```bash
curl -X GET "https://your-domain.com/api/clients/client_abc123" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "client_abc123",
    "name": "Acme Corporation",
    "email": "billing@acme.com",
    "phone": "+1-555-123-4567",
    "address": {
      "street": "123 Business Ave",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "United States"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "invoice_count": 5,
    "total_billed": 12500.00,
    "total_paid": 10000.00,
    "outstanding_balance": 2500.00,
    "recent_invoices": [
      {
        "id": "invoice_def456",
        "invoice_number": "INV-2024-0001",
        "status": "sent",
        "total": 2500.00,
        "issue_date": "2024-01-10"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

### Create Client

Create a new client.

```http
POST /api/clients
```

#### Request Body

```json
{
  "name": "New Client Corp",
  "email": "contact@newclient.com",
  "phone": "+1-555-987-6543",
  "address": {
    "street": "456 Client Street",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90210",
    "country": "United States"
  }
}
```

#### Example Request

```bash
curl -X POST "https://your-domain.com/api/clients" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Client Corp",
    "email": "contact@newclient.com",
    "phone": "+1-555-987-6543",
    "address": {
      "street": "456 Client Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90210",
      "country": "United States"
    }
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "client_xyz789",
    "name": "New Client Corp",
    "email": "contact@newclient.com",
    "phone": "+1-555-987-6543",
    "address": {
      "street": "456 Client Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90210",
      "country": "United States"
    },
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z",
    "invoice_count": 0,
    "total_billed": 0.00,
    "total_paid": 0.00,
    "outstanding_balance": 0.00
  },
  "meta": {
    "timestamp": "2024-01-15T11:00:00Z",
    "version": "1.0"
  }
}
```

### Update Client

Update an existing client.

```http
PUT /api/clients/{id}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Client ID |

#### Request Body

```json
{
  "name": "Updated Client Name",
  "phone": "+1-555-111-2222",
  "address": {
    "street": "789 Updated Street",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "United States"
  }
}
```

#### Example Request

```bash
curl -X PUT "https://your-domain.com/api/clients/client_abc123" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Client Name",
    "phone": "+1-555-111-2222"
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "client_abc123",
    "name": "Updated Client Name",
    "email": "billing@acme.com",
    "phone": "+1-555-111-2222",
    "address": {
      "street": "123 Business Ave",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "United States"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:15:00Z",
    "invoice_count": 5,
    "total_billed": 12500.00,
    "total_paid": 10000.00,
    "outstanding_balance": 2500.00
  },
  "meta": {
    "timestamp": "2024-01-15T11:15:00Z",
    "version": "1.0"
  }
}
```

### Delete Client

Delete a client. Note that clients with existing invoices cannot be deleted.

```http
DELETE /api/clients/{id}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Client ID |

#### Example Request

```bash
curl -X DELETE "https://your-domain.com/api/clients/client_abc123" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Example Response

```json
{
  "success": true,
  "message": "Client deleted successfully",
  "meta": {
    "timestamp": "2024-01-15T11:30:00Z",
    "version": "1.0"
  }
}
```

## Bulk Operations

### Bulk Create Clients

Create multiple clients in a single request.

```http
POST /api/clients/bulk
```

#### Request Body

```json
{
  "clients": [
    {
      "name": "Client One",
      "email": "one@example.com"
    },
    {
      "name": "Client Two",
      "email": "two@example.com"
    }
  ]
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "created": 2,
    "failed": 0,
    "clients": [
      {
        "id": "client_bulk1",
        "name": "Client One",
        "email": "one@example.com"
      },
      {
        "id": "client_bulk2",
        "name": "Client Two",
        "email": "two@example.com"
      }
    ]
  }
}
```

### Bulk Update Clients

Update multiple clients in a single request.

```http
PUT /api/clients/bulk
```

#### Request Body

```json
{
  "updates": [
    {
      "id": "client_abc123",
      "name": "Updated Name One"
    },
    {
      "id": "client_xyz789",
      "phone": "+1-555-999-8888"
    }
  ]
}
```

## Error Responses

### Validation Errors

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
          "field": "name",
          "code": "REQUIRED_FIELD",
          "message": "Name is required"
        }
      ]
    }
  }
}
```

### Not Found Error

```json
{
  "success": false,
  "error": {
    "code": "CLIENT_NOT_FOUND",
    "message": "Client with ID 'client_abc123' not found"
  }
}
```

### Duplicate Email Error

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "A client with this email address already exists"
  }
}
```

### Cannot Delete Error

```json
{
  "success": false,
  "error": {
    "code": "CLIENT_HAS_INVOICES",
    "message": "Cannot delete client with existing invoices",
    "details": {
      "invoice_count": 5
    }
  }
}
```

## Rate Limits

- **Standard**: 100 requests per minute per API key
- **Bulk operations**: 10 requests per minute per API key
- **Search operations**: 50 requests per minute per API key

## Best Practices

### Efficient Querying
- Use pagination for large datasets
- Implement client-side caching for frequently accessed clients
- Use search parameters to filter results server-side
- Sort results to improve user experience

### Data Validation
- Always validate email addresses before creating clients
- Check for duplicate emails to prevent conflicts
- Ensure required fields are present before submission
- Use proper data types for all fields

### Error Handling
- Implement retry logic for temporary failures
- Handle rate limiting with exponential backoff
- Provide meaningful error messages to users
- Log errors for debugging and monitoring

### Security
- Never expose sensitive client information in logs
- Use HTTPS for all API communications
- Implement proper access controls
- Regularly audit client data access

## Related Endpoints

- [Invoices API](./invoices.md) - Create invoices for clients
- [Payments API](./payments.md) - Track payments from clients
- [Reports API](./reports.md) - Generate client reports

## Code Examples

For detailed code examples and SDK usage, see:
- [Client Operations Examples](../examples/client-operations.md)
- [JavaScript SDK Documentation](https://github.com/your-org/invoice-ninja-clone-sdk)
- [API Testing Collection](https://github.com/your-org/invoice-ninja-clone-api-tests)