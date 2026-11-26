# CampusConnect Frontend

React + Vite frontend for the CampusConnect Express/PostgreSQL project.

## Quick start (Windows PowerShell)
1. Extract this folder into your project directory so the layout is `campusconnect/frontend` next to `backend`.
2. Open PowerShell inside `frontend`.
3. Run:
   ```powershell
   npm install
   npm run dev
   ```
4. Open the Vite URL printed in the terminal (normally http://localhost:5173).

Backend must be running on `http://localhost:5000`. Optional: create `.env` from `.env.example` to change `VITE_API_URL`.

## Implemented UI/API calls
- Login and registration with OTP verification (`/api/auth/login`, `/api/auth/register`, `/api/auth/verify-email`, `/api/auth/me`)
- Feed listing, post creation, like, comments
- Profile update, social links, coding profiles and LeetCode sync
- Explore students list
- Lost & Found report creation, listing, responses
- Notifications and mark-read

## Notes
- Frontend uses backend routes as described in the project handoff. If an endpoint returns an error, check backend route/middleware and the browser DevTools Network tab.
- Follow/unfollow controls are not yet in the UI because the follow routes were still being added/mounted in the backend during this build.
- Media upload UI/storage integration is not yet implemented (placeholder hint in post composer).
