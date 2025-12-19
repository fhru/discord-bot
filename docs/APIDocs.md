# Lucifer Key API Documentation

## Overview

REST API untuk mengelola lucifer keys menggunakan Cloudflare Workers dan D1 Database.

## Base URL

```
https://your-worker.your-subdomain.workers.dev
```

## Authentication

Beberapa endpoint memerlukan API key untuk akses. Kirim API key melalui header `X-API-Key`.

**Header:**
```
X-API-Key: your-secret-api-key
```

**Setup API Key:**
```bash
npx wrangler secret put API_KEY
```

**Endpoints yang memerlukan API key:**
- `GET /key-list`
- `GET /key/discord/:discord_id`
- `GET /key/:id`
- `POST /key-create`
- `PUT /key/:id`
- `DELETE /key/:id`

**Endpoints publik (tanpa API key):**
- `GET /` (health check)
- `POST /key-validate`

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS lucifer_key (
    id INTEGER PRIMARY KEY,
    discord_id TEXT NOT NULL,
    script_code TEXT NOT NULL,
    lucifer_username TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Endpoints

### 1. Health Check

**GET** `/`

Cek apakah API berjalan.

**Response:**
```
Hello World!
```

---

### 2. List All Keys

**GET** `/key-list`

Mengambil semua key dari database. **Memerlukan API key.**

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| X-API-Key | Yes | API key untuk autentikasi |

**Response (200):**
```json
[
  {
    "id": 1,
    "discord_id": "123456789",
    "script_code": "ABC123",
    "lucifer_username": "user1",
    "created_at": "2024-01-01 00:00:00"
  }
]
```

**Example:**
```bash
curl -X GET https://your-worker.workers.dev/key-list \
  -H "X-API-Key: your-secret-api-key"
```

---

### 3. Get Key by Discord ID

**GET** `/key/discord/:discord_id`

Mengambil key berdasarkan Discord ID. **Memerlukan API key.**

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| X-API-Key | Yes | API key untuk autentikasi |

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| discord_id | string | Discord user ID |

**Response (200):**
```json
[
  {
    "id": 1,
    "discord_id": "123456789",
    "script_code": "ABC123",
    "lucifer_username": "user1",
    "created_at": "2024-01-01 00:00:00"
  }
]
```

**Response (404):**
```json
{
  "error": "Key not found"
}
```

**Example:**
```bash
curl -X GET https://your-worker.workers.dev/key/discord/123456789 \
  -H "X-API-Key: your-secret-api-key"
```

---

### 4. Get Key by ID

**GET** `/key/:id`

Mengambil key berdasarkan ID. **Memerlukan API key.**

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| X-API-Key | Yes | API key untuk autentikasi |

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Key ID |

**Response (200):**
```json
{
  "id": 1,
  "discord_id": "123456789",
  "script_code": "ABC123",
  "lucifer_username": "user1",
  "created_at": "2024-01-01 00:00:00"
}
```

**Response (404):**
```json
{
  "error": "Key not found"
}
```

**Example:**
```bash
curl -X GET https://your-worker.workers.dev/key/1 \
  -H "X-API-Key: your-secret-api-key"
```

---

### 5. Create Key

**POST** `/key-create`

Membuat key baru. **Memerlukan API key.**

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| X-API-Key | Yes | API key untuk autentikasi |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| discord_id | string | Yes | Discord user ID |
| script_code | string | Yes | Script code |
| lucifer_username | string | Yes | Lucifer username |

**Request Example:**
```json
{
  "discord_id": "123456789",
  "script_code": "ABC123",
  "lucifer_username": "user1"
}
```

**Response (201):**
```json
{
  "success": true,
  "meta": {
    "duration": 0.5,
    "changes": 1,
    "last_row_id": 1
  }
}
```

**Response (400):**
```json
{
  "error": "discord_id, script_code, and lucifer_username are required"
}
```

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

**Example:**
```bash
curl -X POST https://your-worker.workers.dev/key-create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{"discord_id":"123456789","script_code":"ABC123","lucifer_username":"user1"}'
```

---

### 6. Validate Key

**POST** `/key-validate`

Memvalidasi apakah kombinasi script_code dan lucifer_username ada di database.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| script_code | string | Yes | Script code |
| lucifer_username | string | Yes | Lucifer username |

**Request Example:**
```json
{
  "script_code": "ABC123",
  "lucifer_username": "user1"
}
```

**Response (200):**
```json
{
  "valid": true,
  "data": {
    "id": 1,
    "discord_id": "123456789",
    "script_code": "ABC123",
    "lucifer_username": "user1",
    "created_at": "2024-01-01 00:00:00"
  }
}
```

**Response (404):**
```json
{
  "valid": false,
  "error": "Key not found"
}
```

**Response (400):**
```json
{
  "error": "script_code and lucifer_username are required"
}
```

**Example:**
```bash
curl -X POST https://your-worker.workers.dev/key-validate \
  -H "Content-Type: application/json" \
  -d '{"script_code":"ABC123","lucifer_username":"user1"}'
```

---

### 7. Update Key

**PUT** `/key/:id`

Mengupdate key berdasarkan ID. Semua field bersifat optional. **Memerlukan API key.**

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| X-API-Key | Yes | API key untuk autentikasi |

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Key ID |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| discord_id | string | No | Discord user ID |
| script_code | string | No | Script code |
| lucifer_username | string | No | Lucifer username |

**Request Example:**
```json
{
  "script_code": "NEW123"
}
```

**Response (200):**
```json
{
  "success": true,
  "meta": {
    "duration": 0.5,
    "changes": 1
  }
}
```

**Response (404):**
```json
{
  "error": "Key not found"
}
```

**Example:**
```bash
curl -X PUT https://your-worker.workers.dev/key/1 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{"script_code":"NEW123"}'
```

---

### 8. Delete Key

**DELETE** `/key/:id`

Menghapus key berdasarkan ID. **Memerlukan API key.**

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| X-API-Key | Yes | API key untuk autentikasi |

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Key ID |

**Response (200):**
```json
{
  "success": true,
  "meta": {
    "duration": 0.5,
    "changes": 1
  }
}
```

**Response (404):**
```json
{
  "error": "Key not found"
}
```

**Example:**
```bash
curl -X DELETE https://your-worker.workers.dev/key/1 \
  -H "X-API-Key: your-secret-api-key"
```

---

## Error Responses

Semua endpoint mengembalikan error dalam format yang konsisten:

**400 Bad Request** - Request body tidak valid
```json
{
  "error": "Field validation message"
}
```

**401 Unauthorized** - API key tidak valid atau tidak ada
```json
{
  "error": "Unauthorized"
}
```

**404 Not Found** - Resource tidak ditemukan
```json
{
  "error": "Key not found"
}
```

**500 Internal Server Error** - Database error
```json
{
  "error": "Database error"
}
```
