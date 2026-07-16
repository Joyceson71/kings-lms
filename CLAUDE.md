# Kings LMS — Project Reference

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project REST/Auth endpoint (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key for client-side calls |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key for server-only admin operations |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (used for OAuth redirects) |

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

Role is set during onboarding (`/dashboard/onboarding`) and enforced server-side via RLS policies.

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
- **`lucide-react`**: Still on `0.x` (e.g. `^0.441.0`) — never reached `1.x`.
- **Next.js**: Project targets `^15` — not 16 (which does not exist).
