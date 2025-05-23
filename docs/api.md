# Data Space Search Service API Documentation

## Overview

The Search Service is a service of the Data Space Node, designed to process search queries and aggregate results from decentralized catalogs.

**Version:** 0.0.0  
**OpenAPI Specification:** OAS 3.1  
**License:** MIT  
**Contact:** all-hiro@hiro-microdatacenters.nl  
**API Base URL:** `/openapi.json`

## Endpoints

### Default Operations

#### GET /metrics

Returns service metrics.

**URL:** `/metrics`  
**Method:** GET  
**Description:** Returns service metrics.

#### GET /health-check

Performs a health check of the service.

**URL:** `/health-check`  
**Method:** GET  
**Description:** Health check endpoint to verify service status.

### Local Search

#### POST /search-catalog/

Search the local catalog with dataset list.

**URL:** `/search-catalog/`  
**Method:** POST  
**Description:** Search the local catalog with dataset list.

**Request Body Format:**

```json
{
  "@context": {
    "@vocab": "http://data-space.org/",
    "<namespace>": "<namespaceURL>"
  },
  "@type": "Filters",
  "filters": [
    {
      ["@type": "<[namespace:]Class>",]
      "<[namespace:]attribute>[@<lang>]": <nestedObject> | <value> | {
        "operation": "<operator>",
        "operationValue": <value>
      }
    }
  ]
}
```

**Supported Operators:**

- `gte`, `lte` - range filtering
- `in` - list filtering
- `contains` - substring search

**Example Request:**

```json
{
  "@context": {
    "@vocab": "http://data-space.org/",
    "dcat": "http://www.w3.org/ns/dcat#",
    "med": "http://oca.example.org/123/"
  },
  "@type": "Filters",
  "filters": [
    {
      "dcat:dataset": {
        "extraMetadata": {
          "@type": "med:Record",
          "med:hasAsthma": true,
          "med:hasSex": true
        }
      }
    }
  ]
}
```

**Responses:**

- `200 OK`: Successful Response (application/ld+json)
- `422 Unprocessable Entity`: Validation Error (application/json)

### Decentralized Search

#### POST /search/

Performs decentralized search across catalogs.

**URL:** `/search/`  
**Method:** POST  
**Description:** Performs decentralized search across catalogs.

**Request Body Format:**

```json
{
  "@context": {
    "@vocab": "http://data-space.org/",
    "<namespace>": "<namespaceURL>"
  },
  "@type": "Filters",
  "filters": [
    {
      ["@type": "<[namespace:]Class>",]
      "<[namespace:]attribute>[@<lang>]": <nestedObject> | <value> | {
        "operation": "<operator>",
        "operationValue": <value>
      }
    }
  ]
}
```

**Supported Operators:**

- `gte`, `lte` - range filtering
- `in` - list filtering
- `contains` - substring search

**Example Request:**

```json
{
  "@context": {
    "@vocab": "http://data-space.org/",
    "dcat": "http://www.w3.org/ns/dcat#",
    "med": "http://oca.example.org/123/"
  },
  "@type": "Filters",
  "filters": [
    {
      "dcat:dataset": {
        "extraMetadata": {
          "@type": "med:Record",
          "med:hasAsthma": true,
          "med:hasSex": true
        }
      }
    }
  ]
}
```

**Responses:**

- `200 OK`: Successful Response (application/ld+json)
  - Returns aggregated results from all connected catalogs
  - Results are merged and deduplicated
  - Includes source catalog information for each result
- `422 Unprocessable Entity`: Validation Error (application/json)
  - Invalid filter format
  - Unsupported operators
  - Missing required fields
- `503 Service Unavailable`: Service Error (application/json)
  - One or more remote catalogs are unavailable
  - Network connectivity issues
  - Timeout during remote catalog query

**Notes:**

- This endpoint performs parallel queries to all connected catalogs
- Results are aggregated and deduplicated before returning
- Timeout settings can be configured per catalog
- Failed catalog queries are logged but don't fail the entire request
- Results include metadata about the source catalog
- Pagination is supported through query parameters
- Results are sorted by relevance by default

## Schemas

### CatalogFilters

Object schema for catalog filtering.

### HTTPValidationError

Object schema for HTTP validation errors.

### HealthCheck

Object schema for health check responses.

### ValidationError

Object schema for validation errors.

## Filter Examples

### Basic Title Search

```json
{
  "dcat:dataset": {
    "dcterms:title": "example"
  }
}
```

### Language-Specific Title Search

```json
{
  "dcat:dataset": {
    "dcterms:title@en": "example"
  }
}
```

### Language Annotation

```json
{
  "dcat:dataset": {
    "dcterms:title": {
      "@language": "en"
    }
  }
}
```

### Value Annotation

```json
{
  "dcat:dataset": {
    "dcterms:title": {
      "@value": "example"
    }
  }
}
```

### Distribution Format

```json
{
  "dcat:dataset": {
    "dcat:distribution": {
      "dcat:format": "PDF"
    }
  }
}
```

### Extra Metadata

```json
{
  "dcat:dataset": {
    "extraMetadata": {
      "med:sex": "M"
    }
  }
}
```

### Typed Extra Metadata

```json
{
  "dcat:dataset": {
    "extraMetadata": {
      "@type": "med:Patient",
      "med:sex": "M"
    }
  }
}
```

### Numeric Value

```json
{
  "dcat:dataset": {
    "extraMetadata": {
      "med:weight": 75
    }
  }
}
```

### Typed Numeric Value

```json
{
  "dcat:dataset": {
    "extraMetadata": {
      "med:weight": {
        "@type": "xsd:integer"
      }
    }
  }
}
```

### Date Range Filter

```json
{
  "dcat:dataset": {
    "dcterms:datePublished": {
      "operationValue": "2021-01-01",
      "operation": "gte"
    }
  }
}
```

### Numeric Range Filter

```json
{
  "dcat:dataset": {
    "extraMetadata": {
      "med:weight": {
        "operationValue": 70,
        "operation": "gte"
      }
    }
  }
}
```

### Keyword List Filter

```json
{
  "dcat:dataset": {
    "dcat:keyword": {
      "operationValue": ["science", "health"],
      "operation": "in"
    }
  }
}
```

### Substring Search

```json
{
  "dcat:dataset": {
    "dcterms:title@en": {
      "operationValue": "example",
      "operation": "contains"
    }
  }
}
```

## Notes

- All requests should include appropriate content type headers
- The API supports JSON-LD format for requests and responses
- Error responses include detailed validation information
- The service supports both local and decentralized search operations
- All endpoints support CORS
- Authentication is not required for basic operations
- Rate limiting may be applied to prevent abuse
- All timestamps are in ISO 8601 format
- The service uses UTC timezone for all operations
