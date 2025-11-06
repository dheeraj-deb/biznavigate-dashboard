# Authentication Response Format Fix

## Issue
The backend API wraps responses in a standardized format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success",
  "meta": { "timestamp": "..." }
}
```

The frontend was trying to access `access_token` directly from `response.data`, but it needed to access `response.data.data` instead.

## Solution

Updated the following files to handle the wrapped response format:

### 1. Auth Store ([src/store/auth-store.ts](src/store/auth-store.ts))

**Login Function:**
```typescript
const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials)

// Backend wraps response in { success, data, message, meta }
const responseData = response.data.data || response.data
const { access_token, refresh_token, user: userData } = responseData
```

**Register Function:**
```typescript
const response = await axios.post(`${API_BASE_URL}/auth/signup`, data)

// Backend wraps response in { success, data, message, meta }
const responseData = response.data.data || response.data
const { access_token, refresh_token, user: userData } = responseData
```

**Refresh Token Function:**
```typescript
const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
  refresh_token: refreshToken,
})

// Backend wraps response in { success, data, message, meta }
const responseData = response.data.data || response.data
const { access_token, refresh_token: new_refresh_token, user: userData } = responseData
```

### 2. API Client ([src/lib/api-client.ts](src/lib/api-client.ts))

**Refresh Interceptor:**
```typescript
const response = await axios.post(`${API_URL}/auth/refresh`, {
  refresh_token: refreshToken
})

// Backend wraps response in { success, data, message, meta }
const responseData = response.data.data || response.data
const { access_token, refresh_token: new_refresh_token } = responseData
```

## Backward Compatibility

The code uses `response.data.data || response.data` which provides backward compatibility:
- If the response has a `data` property, it uses `response.data.data`
- If not, it falls back to `response.data` (for unwrapped responses)

## Testing

### Signup Success Response
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": {
      "user_id": "de0a41ce-eb13-44fe-88c0-affaae62a10c",
      "email": "dheerajt9539@gmail.com",
      "name": "EcDevelopment",
      "business_id": "a32a847b-f29e-4278-b4d0-1eb7b9eb7999",
      "role_id": "75dfcd08-60f8-4154-8fd1-020fa08b343f"
    }
  },
  "message": "Success",
  "meta": {
    "timestamp": "2025-10-18T15:39:26.183Z"
  }
}
```

### Expected Behavior
- ✅ Signup should show success toast
- ✅ User should be redirected to `/dashboard`
- ✅ Tokens should be stored in localStorage
- ✅ User data should be stored in Zustand store
- ✅ Login should work the same way
- ✅ Token refresh should work automatically

## Files Changed

1. [src/store/auth-store.ts](src/store/auth-store.ts) - Updated login, register, and refresh functions
2. [src/lib/api-client.ts](src/lib/api-client.ts) - Updated refresh interceptor
3. [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md) - Updated documentation with correct response format

## Next Steps

Test all authentication flows:
1. ✅ Signup with new account
2. Login with existing account
3. Logout
4. Token refresh on API calls
5. Automatic redirect on expired tokens
