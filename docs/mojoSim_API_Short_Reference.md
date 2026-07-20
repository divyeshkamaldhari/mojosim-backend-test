# mojoSim API (Short Reference)

Base URL: `/api/v1`

Success response shape:
`{ "success": true, "data": <object> }`

Error response shape:
`{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable message" } }`

## Auth

### POST `/auth/register`

Auth: public
Request body (`application/json`):
Required fields:

- `email`
- `password`
- `first_name`
- `last_name`
  Optional fields:
- `phone` (optional; stored as `null` if not provided)
- `locale` (optional; default DB value is `en`)
- `currency` (optional; default DB value is `USD`)
  Not accepted:
- `avatar_url` (removed; avatar upload is only via `PATCH /me`)
  Response (201):
- `data: { message }`

### POST `/auth/verify-email`

Auth: public
Request body (`application/json`):
Required:

- `token`
  Response (200):
- `data: { message }`

### POST `/auth/resend-verification`

Auth: public
Request body (`application/json`):
Required:

- `email`
  Response (200):
- `data: { message }`

### POST `/auth/login`

Auth: public
Request body (`application/json`):
Required:

- `email`
- `password`
  Response (200):
- `data: { access_token, expires_in, user }` (see `user` shape under GET `/me`)
- Also sets `httpOnly` cookie: `refresh_token`

### POST `/auth/logout`

Auth:

- Bearer access token required
- `refresh_token` cookie required
  Request body:
- none
  Response (200):
- `data: { message }`

### POST `/auth/refresh`

Auth:

- `refresh_token` cookie required
  Request body:
- none
  Response (200):
- `data: { access_token, expires_in }`

### POST `/auth/forgot-password`

Auth: public
Request body (`application/json`):
Required:

- `email`
  Response (200):
- `data: { message }`

### POST `/auth/reset-password`

Auth: public
Request body (`application/json`):
Required:

- `token`
- `password`
  Response (200):
- `data: { message }`

## Profile

All profile routes: **Bearer** access token + role **`customer`**.

### GET `/me`

Auth: Bearer + customer  
Request body: none  
Response (200): `data` is the current user profile (snake_case). **Never includes** `password_hash`.  
Includes: `id`, `email`, `first_name`, `last_name`, `avatar_url`, `phone`, `locale`, `currency`, `role`, `is_active`, `email_verified`, `created_at`, `updated_at`.

### PATCH `/me` (avatar upload)

Auth: Bearer + customer  
Request:

- `Content-Type: multipart/form-data`
- Field name: `avatar` (single file) — optional; if omitted, avatar unchanged.
- Optional text fields: `first_name`, `last_name`, `phone`, `locale`

Allowed file types: `jpeg`, `jpg`, `png`, `webp` — max **2MB**.  
Response (200): `data: { message }`

### PATCH `/me/password`

Auth: Bearer + customer  
Request body (`application/json`), required:

- `current_password`
- `new_password` (min 8, max 128 characters)

Verifies current password; on success updates hash and **revokes all other sessions** (keeps current session).  
Response (200): `data: { message }`  
Wrong current password: **401** `UNAUTHORIZED`.

### GET `/me/sessions`

Auth: Bearer + customer  
Response (200): `data` is an **array** of active sessions. Each item: `id`, `ip_address`, `user_agent`, `expires_at`, `created_at`. **Never includes** `token_hash`.

### DELETE `/me/sessions`

Auth: Bearer + customer  
Revokes **all** sessions for the user **except** the current one (from JWT `sessionId`).  
Response (200): `data: { message }`

### DELETE `/me/sessions/:id`

Auth: Bearer + customer  
Revokes one session by `id`. Must belong to the current user; otherwise **404** `NOT_FOUND`.  
Response (200): `data: { message }`

## Catalog (plans)

All routes are **public** (no auth).

### GET `/plans`

Query (all optional except pagination defaults):

- `country_code` — 2-letter ISO, e.g. `DE`
- `region` — e.g. `Europe` (matched with `ILIKE` on destination region)
- `is_featured` — `true` or `false` (only `true` filters to featured plans)
- `provider_id` — positive integer
- `page` — default `1`
- `limit` — default `20`, max `100`

Only **active** plans (`is_active=true`).  
Response (200): `data`: array of plans; `meta`: `{ page, limit, total }`.  
Each plan: `id`, `name`, `description`, `data_mb`, `validity_days`, `price`, `currency`, `is_featured`, `provider_name`, `destinations[]` (`country_code`, `country_name`, `region`).

### GET `/plans/:id`

Response (200): single plan with list fields plus `provider_id`, `provider_sku`, `metadata`, `synced_at`, `created_at`, `updated_at`.  
**404** if missing or inactive.

### GET `/plans/search`

Required query: `q` — searches `country_name` / `country_code` on destinations (ILIKE).  
Response (200): `data`: array of active plans (same shape as list items).

### GET `/plans/featured`

Response (200): `data` — active **featured** plans with destinations.

### GET `/plans/destinations`

Response (200): `data`: `{ countries: [{ country_code, country_name, region }], regions: string[] }` from distinct destinations on active plans.

## Swagger

### GET `/swagger.json`

Auth: public
Response:

- OpenAPI JSON spec

### GET `/docs`

Auth: public
Response:

- Swagger UI page
