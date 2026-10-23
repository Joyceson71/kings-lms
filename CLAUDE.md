# Kings LMS — Project Reference

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project REST/Auth endpoint (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key for client-side calls |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key for server-only admin operations |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (used for OAuth redirects) |
| `GEMINI_API_KEY` | Server-only Google Gemini API key for Kings Assistant |
| `GEMINI_MODEL` | Google Gemini model identifier used by Kings Assistant |

Copy `.env.example` → `.env.local` and fill in real values. Never commit `.env.local`.

## Database Tables (Supabase / Postgres)

| Table | Purpose |
|---|---|
| `profiles` | One row per user; extends `auth.users` |
| `courses` | Course catalogue created by faculty/admin |
| `course_enrollments` | Student ↔ course join (`student_id`, `course_id`) |
| `attendance_sessions` | A live QR session opened by faculty |
| `attendance_records` | Student attendance marks per session |

## User Roles

Roles are stored in `profiles.role` (type `text`, values: `student` / `faculty` / `admin`).
- **student** — enrols in courses, scans QR to mark attendance
- **faculty** — creates courses and attendance sessions
- **admin** — full access; manages users, departments, reports

Role is set during onboarding (`/onboarding`) and enforced server-side via RLS policies.

## Kings Assistant

Kings Assistant is implemented in `src/components/assistant/` and `src/lib/assistant/`.
Both `/api/assistant` and `/api/assistant/chat` use the shared handler, system prompts,
role-scoped tools, and the Google provider in `src/lib/assistant/provider.ts`. Configure
`GEMINI_API_KEY` and `GEMINI_MODEL`; the assistant reports a clear unavailable state when
either is missing.

## Folder Conventions

```
src/
  app/
    (auth)/          # Auth-flow pages: login, signup, reset-password, update-password
    auth/            # Next.js route handler: /auth/callback (OAuth exchange)
    dashboard/       # All protected dashboard routes
    attend/          # Public QR attendance scan landing page
  lib/
    supabase/        # Supabase client wrappers
      client.ts      # Browser client (singleton)
      server.ts      # Server-component client (cookies-based)
      middleware.ts  # Middleware client helper
      queries.ts     # Typed query helpers (getProfile, getCourses, …)
  components/        # Shared UI components
```

## Known Gotchas

- **Middleware**: `getUser()` must be called immediately after `createServerClient`; no logic in between. Authentication relies solely on `supabase.auth.getUser()` — there is no cookie fallback.
- **Redirect cookies**: After a Supabase token refresh in middleware, copy cookies from `supabaseResponse` onto any redirect response you return, or the browser won't persist the refreshed session.
- **`lucide-react` version**: `^0.447.0`.
- **Next.js**: Project targets `^15` (installed `15.5.20`). Read the installed guides in
  `node_modules/next/dist/docs/` when present before using framework APIs.
- **API handlers**: Route handlers in `src/app/api/` use `src/lib/api/handler.ts` for
  authentication, Zod request validation, and sanitized error responses.
- **Rate limits**: Shared limits use the `api_rate_limits` table and
  `consume_api_rate_limit` RPC from migration `0032_api_rate_limits.sql`.
