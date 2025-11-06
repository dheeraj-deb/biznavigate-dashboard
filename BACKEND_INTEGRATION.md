# Backend Integration Guide

## Overview

The frontend dashboard has been integrated with the backend API authentication system. The login page now communicates with the backend NestJS API for user authentication.

## Setup

### 1. Environment Configuration

The `.env.local` file contains the backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Make sure the backend server is running on port 8000 before testing the login.

### 2. Backend Server

The backend server should be running at `http://localhost:8000` with the following auth endpoints:

- `POST /auth/login` - Login with email and password
- `POST /auth/signup` - Register a new user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

## Authentication Flow

### Login Process

1. User enters email and password in the login form
2. Frontend sends POST request to `http://localhost:8000/auth/login`
3. Backend validates credentials and returns:
   ```json
   {
     "success": true,
     "data": {
       "access_token": "jwt_access_token",
       "refresh_token": "jwt_refresh_token",
       "user": {
         "user_id": "uuid",
         "email": "user@example.com",
         "name": "User Name",
         "business_id": "uuid",
         "role_id": "uuid"
       }
     },
     "message": "Success",
     "meta": {
       "timestamp": "2025-10-18T15:39:26.183Z"
     }
   }
   ```
4. Frontend extracts data from the wrapped response
5. Frontend stores tokens in localStorage and Zustand store
6. User is redirected to `/dashboard`

### Token Management

- **Access Token**: Short-lived (15 minutes), stored in localStorage as `biznavigate_auth_token`
- **Refresh Token**: Long-lived (7 days), stored in localStorage as `biznavigate_refresh_token`
- **Auto-refresh**: When a 401 error occurs, the API client automatically attempts to refresh the access token

### Logout Process

1. User clicks logout
2. Frontend sends POST request to `http://localhost:8000/auth/logout` with Bearer token
3. Backend invalidates the refresh token
4. Frontend clears localStorage and redirects to `/auth/login`

## API Client Configuration

The `api-client.ts` has been configured with:

- **Base URL**: `http://localhost:8000/api` for API endpoints
- **Auth Interceptor**: Automatically adds Bearer token to all requests
- **Refresh Interceptor**: Automatically refreshes token on 401 errors

## Updated Files

### Frontend Changes

1. **[src/types/index.ts](src/types/index.ts)**
   - Added `AuthResponse` interface to match backend response
   - Updated `User` interface with backend fields (`user_id`, `business_id`, `role_id`)
   - Added `refreshToken` to `AuthState`

2. **[src/store/auth-store.ts](src/store/auth-store.ts)**
   - Updated `login()` to call backend API
   - Updated `register()` to call backend signup API
   - Updated `logout()` to call backend logout API
   - Added `refreshAccessToken()` method
   - Stores both access_token and refresh_token

3. **[src/lib/api-client.ts](src/lib/api-client.ts)**
   - Configured to use `http://localhost:8000/api` as base URL
   - Added automatic token refresh on 401 errors
   - Stores refresh_token separately

4. **[src/app/auth/login/page.tsx](src/app/auth/login/page.tsx)**
   - Simplified to show only email and password fields
   - Removed the "Send 4-digit code" option
   - Directly calls the login API with credentials

5. **[.env.local](.env.local)**
   - Updated API URL to point to backend server

## Testing the Integration

### Prerequisites

1. **Start the backend server:**
   ```bash
   cd ../biznavigate-backend
   npm run start:dev
   ```

2. **Ensure database is running:**
   - Make sure PostgreSQL is running
   - Database should have the required tables (users, businesses, tenants, roles)

3. **Start the frontend:**
   ```bash
   cd biznavigate-dashboard
   npm run dev
   ```

### Test Login

1. Navigate to `http://localhost:3000/auth/login`
2. Enter valid credentials:
   - Email: (from your database)
   - Password: (from your database)
3. Click "Sign in"
4. Should redirect to `/dashboard` on success

### Verify Token Storage

Open browser DevTools > Application > Local Storage:
- `biznavigate_auth_token` - Access token
- `biznavigate_refresh_token` - Refresh token

## Error Handling

The integration handles common errors:

- **Invalid credentials**: Shows "Invalid credentials" error message
- **Network error**: Shows "No response from server" error
- **Inactive account**: Shows "Account is inactive" error
- **Token expired**: Automatically refreshes token or redirects to login

## Security Features

1. **JWT Authentication**: Access tokens expire in 15 minutes
2. **Token Refresh**: Refresh tokens expire in 7 days
3. **Secure Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
4. **Password Hashing**: Passwords are hashed with bcrypt on the backend
5. **HTTPS**: Use HTTPS in production

## Production Considerations

1. **Environment Variables**: Update `.env.production` with production API URL
2. **CORS**: Configure backend CORS to allow frontend domain
3. **HTTPS**: Use HTTPS for both frontend and backend
4. **Token Storage**: Consider using httpOnly cookies instead of localStorage
5. **Rate Limiting**: Implement rate limiting on auth endpoints
6. **Monitoring**: Add logging for authentication events

## Troubleshooting

### Login fails with network error
- Check if backend server is running on port 8000
- Verify CORS is configured correctly
- Check browser console for detailed error

### 401 Unauthorized errors
- Check if token is being sent in Authorization header
- Verify JWT secrets match between frontend and backend
- Check if token has expired

### Refresh token not working
- Verify refresh token endpoint is `/auth/refresh`
- Check if refresh_token is stored in localStorage
- Ensure backend JWT_REFRESH_SECRET is configured

## Next Steps

1. Implement role-based access control
2. Add email verification
3. Implement password reset functionality
4. Add two-factor authentication
5. Implement session management
