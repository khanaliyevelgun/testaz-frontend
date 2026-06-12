This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Auth Flow

This frontend is prepared for a secure JWT auth model:

- `accessToken` is stored only in memory through `AuthProvider`/`useAuth`; it is never written to `localStorage` or `sessionStorage`.
- The refresh token must be set by the backend as an HttpOnly cookie. Frontend JavaScript cannot and should not read it.
- All API calls use `credentials: "include"` so the refresh cookie is sent to the backend when its `Path` and origin rules match.
- Protected API calls automatically attach `Authorization: Bearer <accessToken>`.
- On `401` from protected calls, `src/lib/api.js` sends one shared `/auth/refresh` request and queues concurrent failed requests behind that same refresh promise.
- If refresh succeeds, the new access token is stored in memory and the original request is retried once.
- If refresh fails, client auth state is cleared and the user is redirected to `/sign-in`.
- On app startup, `AuthProvider` calls `/auth/refresh`; when successful it calls `/auth/profile` and fills the user state.
- Public auth pages (`/sign-in`, `/sign-up`, `/forgot-password`) redirect authenticated users to `/` or the `next` URL.
- Use `ProtectedRoute` from `src/components/auth/ProtectedRoute.jsx` to wrap protected pages or protected page sections.
- Logout calls `/auth/logout` and clears client state in a `finally` block.

Set the backend origin with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Frontend-only development without a backend:

Leave `NEXT_PUBLIC_API_BASE_URL` empty and enable the server-side mock auth routes:

```bash
NEXT_PUBLIC_API_BASE_URL=
AUTH_MOCK_ENABLED=true
AUTH_MOCK_GRANT_AUTH=true
AUTH_MOCK_ROLE=admin
AUTH_MOCK_ERROR_MODE=none
```

`AUTH_MOCK_*` variables are intentionally not `NEXT_PUBLIC_*`, so they are not bundled into browser code. The mock route handlers are also ignored automatically when `NODE_ENV=production`, even if `AUTH_MOCK_ENABLED=true` is set by mistake. Use `AUTH_MOCK_ROLE=admin|parent|child` to test role sidebars, `AUTH_MOCK_GRANT_AUTH=false` to test unauthorized flows, and `AUTH_MOCK_ERROR_MODE=login|register|refresh|profile|forgot-password|reset-password|all` to test error states.

Backend cookie requirements:

- `HttpOnly`
- `Secure` in HTTPS environments
- `SameSite=Lax`, or `SameSite=Strict` in production when compatible with the product flow
- `Path=/auth/refresh`
- `Max-Age` controlled by the backend

Backend security notes:

- CORS must allow only approved frontend origins.
- `credentials: true` must be enabled only for those approved origins.
- Refresh and logout should consider CSRF protection in addition to SameSite cookies.
- Login, register, refresh, and forgot-password endpoints should be rate limited.
- Refresh token rotation and reuse detection are recommended.
- Error responses should stay generic and must not expose sensitive internals.

The backend API contract is documented in `openapi.yaml`.
