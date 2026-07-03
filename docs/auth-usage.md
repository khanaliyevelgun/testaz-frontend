# Auth Usage Guide

This frontend follows the backend contract in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Backend URL

Set the backend origin in `.env`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://192.168.100.39:8080
```

All API calls use `/api/v1` automatically through [src/lib/api.js](../src/lib/api.js).

## Token Model

The backend is stateless. It does not use a server-side session or auth cookie.

- `accessToken` is sent as `Authorization: Bearer <token>`.
- `refreshToken` is sent in the `POST /api/v1/auth/refresh` and `POST /api/v1/auth/logout` body.
- A successful refresh returns a new access token and refresh token. Store the newest pair only.
- Logout requires a valid access token and revokes the refresh token family.

The app also mirrors tokens into same-origin cookies so `middleware.js` can call `GET /api/v1/auth/me` before rendering dashboard routes. These cookies do not grant access by themselves; middleware always validates the token with the backend.

## Login

`POST /api/v1/auth/login`

```json
{
  "login": "email-or-phone",
  "password": "password"
}
```

On success, the app stores the returned tokens, calls `GET /api/v1/auth/me`, and redirects to `/admin`.

## Authorization

Frontend role checks are cosmetic. Real authorization is enforced by the backend and by `middleware.js` for `/admin` pages:

- `/admin/users`, `/admin/courses`, `/admin/reports`: `ADMIN`
- `/admin/children`, `/admin/progress`, `/admin/payments`: `PARENT`
- `/admin/my-courses`, `/admin/assignments`, `/admin/quiz-attempts`, `/admin/wishlist`, `/admin/profile`: `STUDENT`
- `/admin/organizations`, `/admin/members`, `/admin/invites`: `COURSE`, `PRIVATE_TUTOR`, `SCHOOL_TEACHER`
- `/admin/notifications`, `/admin/messages`, `/admin/settings`, `/admin`: any authenticated dashboard role

If an API returns `403` or `404` for relationship-scoped data, treat it as expected authorization behavior.

## Errors

Backend errors use the documented `ErrorResponse` shape:

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "traceId": "a1b2c3d4",
  "fieldErrors": []
}
```

Use `code` for logic and `message` or `fieldErrors` for display.
