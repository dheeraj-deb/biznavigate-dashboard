# Troubleshooting Guide

## Error: "Cannot POST /api/auth/login" (404)

### Problem
The login request is going to `/api/auth/login` but the backend auth endpoints are at `/auth/login` (without the `/api` prefix).

### Solution

**IMPORTANT: You must restart the Next.js dev server for environment variable changes to take effect!**

1. **Stop the dev server** (Ctrl+C in the terminal)

2. **Clear the Next.js cache:**
   ```bash
   rm -rf .next
   # On Windows:
   # rmdir /s /q .next
   ```

3. **Verify the `.env.local` file has the correct URL:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

   Make sure it's `http://localhost:8000` and NOT `http://localhost:8000/api`

4. **Start the dev server again:**
   ```bash
   npm run dev
   ```

5. **Verify in browser console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Before attempting login, run:
     ```javascript
     console.log(process.env.NEXT_PUBLIC_API_URL)
     ```
   - It should show `http://localhost:8000`

6. **Try logging in again**

### Backend Endpoint Structure

The backend has two types of endpoints:

- **Auth endpoints** (no `/api` prefix):
  - `POST /auth/login`
  - `POST /auth/signup`
  - `POST /auth/refresh`
  - `POST /auth/logout`

- **Other API endpoints** (with `/api/v1` prefix):
  - `GET /api/v1/leads`
  - `POST /api/v1/leads`
  - etc.

### Verify Backend is Running

1. Check backend is running:
   ```bash
   curl http://localhost:8000
   ```

2. Test the auth endpoint directly:
   ```bash
   curl -X POST http://localhost:8000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

### Still Not Working?

If you still get the 404 error after restarting:

1. **Check the actual request URL in DevTools:**
   - Open DevTools > Network tab
   - Try to login
   - Look at the POST request
   - Check the Request URL - it should be `http://localhost:8000/auth/login`

2. **If it still shows `/api/auth/login`, check:**
   - Environment variable: `echo $NEXT_PUBLIC_API_URL` (Linux/Mac) or `echo %NEXT_PUBLIC_API_URL%` (Windows)
   - Verify no other `.env` files are overriding the value
   - Make sure you're editing the right `.env.local` file in the root of biznavigate-dashboard

3. **Hard refresh the browser:**
   - Clear browser cache
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
