# Knowledge Base API Sample Requests

This file contains sample curl commands for testing the Knowledge Base API endpoints.

## Create Knowledge Base

### Create a GLOBAL Knowledge Base
```bash
curl -X POST http://localhost:3000/api/knowledge-bases \
  -H "Content-Type: application/json" \
  -d '{
    "title": "General Company Policies",
    "content": "This knowledge base contains information about company policies and procedures.",
    "tags": ["policy", "company", "general"],
    "scope": "GLOBAL"
  }'
```

### Create a PRODUCT Knowledge Base
```bash
curl -X POST http://localhost:3000/api/knowledge-bases \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Product Information",
    "content": "This knowledge base contains information about our products.",
    "tags": ["product", "info"],
    "scope": "PRODUCT",
    "productIds": ["product_id_1", "product_id_2"]
  }'
```

### Create a READER Knowledge Base
```bash
curl -X POST http://localhost:3000/api/knowledge-bases \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Terminal Reader Guide",
    "content": "This knowledge base contains information about terminal readers.",
    "tags": ["terminal", "reader", "guide"],
    "scope": "READER",
    "terminalIds": ["terminal_id_1", "terminal_id_2"]
  }'
```

### Create a LOCATION Knowledge Base
```bash
curl -X POST http://localhost:3000/api/knowledge-bases \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Store Location Information",
    "content": "This knowledge base contains information about store locations.",
    "tags": ["store", "location", "info"],
    "scope": "LOCATION",
    "locationIds": ["location_id_1", "location_id_2"]
  }'
```

## Read Knowledge Base

### Get All Knowledge Bases
```bash
curl -X GET http://localhost:3000/api/knowledge-bases
```

### Get Knowledge Base by ID
```bash
curl -X GET http://localhost:3000/api/knowledge-bases?id=kb_123456789
```

### Get Knowledge Bases by Scope
```bash
curl -X GET http://localhost:3000/api/knowledge-bases?scope=GLOBAL
```

## Update Knowledge Base

### Update Knowledge Base Content
```bash
curl -X PUT http://localhost:3000/api/knowledge-bases?id=kb_123456789 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Company Policies",
    "content": "This knowledge base contains updated information about company policies and procedures.",
    "tags": ["policy", "company", "general", "updated"]
  }'
```

### Update Product Connections (for PRODUCT scope)
```bash
curl -X PUT http://localhost:3000/api/knowledge-bases?id=kb_123456789 \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["product_id_1", "product_id_3", "product_id_4"]
  }'
```

### Update Terminal Connections (for READER scope)
```bash
curl -X PUT http://localhost:3000/api/knowledge-bases?id=kb_123456789 \
  -H "Content-Type: application/json" \
  -d '{
    "terminalIds": ["terminal_id_2", "terminal_id_3"]
  }'
```

### Update Location Connections (for LOCATION scope)
```bash
curl -X PUT http://localhost:3000/api/knowledge-bases?id=kb_123456789 \
  -H "Content-Type: application/json" \
  -d '{
    "locationIds": ["location_id_1", "location_id_3"]
  }'
```

### Update Active Status
```bash
curl -X PUT http://localhost:3000/api/knowledge-bases?id=kb_123456789 \
  -H "Content-Type: application/json" \
  -d '{
    "active": false
  }'
```

## Delete Knowledge Base

### Delete Knowledge Base
```bash
curl -X DELETE http://localhost:3000/api/knowledge-bases?id=kb_123456789
``` 