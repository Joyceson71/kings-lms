# 🎓 Kings EC Platform — Campus Learning & Management System

<div align="center">

![Kings EC Platform](https://img.shields.io/badge/Kings%20EC-Campus%20LMS-7c3aed?style=for-the-badge&logo=graduation-cap)
![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ecf8e?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss)

**A premium, full-stack Campus LMS for Kings Engineering College.**  
Features 3D animations, particle backgrounds, real-time attendance, and role-based dashboards.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth System** | Supabase email/password auth with role-based access |
| 🎨 **Premium UI** | Glassmorphism, 3D tilt cards, particle canvas backgrounds |
| 📊 **Dashboard** | Live stats with animated counters, Recharts area chart |
| ✅ **Attendance** | QR-based session tracking for faculty + students |
| 📚 **Courses** | Course management with 3D cards and attendance tracking |
| 📋 **Assignments** | Kanban board (Pending → Submitted → Graded) |
| 👥 **Students** | Searchable student table with attendance bars |
| ⚙️ **Settings** | Profile, notifications, security, and appearance tabs |
| 🌐 **Responsive** | Works on desktop, tablet, and mobile |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 with Server & Client Components |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 + Custom CSS Animations |
| **Database & Auth** | Supabase (PostgreSQL + Auth + Row Level Security) |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Fonts** | Inter (body) + Outfit (headings) via Google Fonts |

---

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** `v20+` — [Download](https://nodejs.org/)
- **npm** `v10+` (comes with Node.js)
- A **Supabase** account — [Sign up free](https://supabase.com/)

---

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd kings-lms

# Install dependencies
npm install
```

---

### 2. Supabase Setup

1. Go to [app.supabase.com](https://app.supabase.com/) and **create a new project**
2. Once your project is ready, navigate to:
   - **Project Settings → API** to get your keys
   
3. Run the database migration by going to **SQL Editor** in your Supabase dashboard, and paste the contents of:
   ```
   supabase/migrations/0000_initial_schema.sql
   ```
   Then click **Run**.

This will create the following tables:
- `profiles` — User profile with role (student/faculty/admin)
- `courses` — Course catalog
- `course_enrollments` — Many-to-many student↔course
- `attendance_sessions` — QR-enabled sessions created by faculty
- `attendance_records` — Student attendance per session

---

### 3. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Then fill in your Supabase credentials in `.env.local`:

```env
# Supabase Project URL (Project Settings → API → Project URL)
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"

# Supabase Anon (public) key — safe to expose
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Supabase Service Role key — NEVER expose publicly
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
```

### 3.5. Google OAuth Setup (Optional but Recommended)
To enable the "Continue with Google" buttons on the Login and Signup pages:
1. Go to your [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and navigate to **APIs & Services > Credentials**.
3. Create new **OAuth 2.0 Client IDs** (Web application).
4. Add your Supabase project's callback URL (e.g., `https://<project-id>.supabase.co/auth/v1/callback`) to the **Authorized redirect URIs**.
5. Copy the **Client ID** and **Client Secret**.
6. Go to your [Supabase Dashboard](https://app.supabase.com) > **Authentication > Providers > Google**.
7. Enable Google and paste the Client ID and Client Secret. Click **Save**.

> ⚠️ **Never commit `.env.local` to version control.** The `.gitignore` already excludes it.

---

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You'll be automatically redirected to `/login` if not authenticated.

---

## 📁 Project Structure

```
kings-lms/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group (no layout chrome)
│   │   │   ├── layout.tsx            # Auth layout — particles + glassmorphism
│   │   │   ├── login/page.tsx        # Login page (bug-fixed)
│   │   │   └── signup/page.tsx       # Signup with password strength meter
│   │   ├── dashboard/                # Protected dashboard pages
│   │   │   ├── layout.tsx            # Dashboard shell (sidebar + header)
│   │   │   ├── page.tsx              # Overview with stats + charts
│   │   │   ├── attendance/page.tsx   # QR attendance management
│   │   │   ├── courses/page.tsx      # Course cards grid
│   │   │   ├── assignments/page.tsx  # Kanban assignment board
│   │   │   ├── students/page.tsx     # Student table + search
│   │   │   └── settings/page.tsx     # Profile & preferences
│   │   ├── globals.css               # Design system + animations
│   │   ├── layout.tsx                # Root layout (fonts + metadata)
│   │   └── page.tsx                  # Root redirect to /dashboard
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx            # Top navigation bar
│   │   │   └── sidebar.tsx           # Collapsible navigation sidebar
│   │   └── ui/
│   │       ├── avatar.tsx            # Avatar with gradient initials + ring
│   │       ├── badge.tsx             # Status/role badges with glow
│   │       ├── button.tsx            # Base button component
│   │       ├── card.tsx              # Base card component
│   │       ├── input.tsx             # Base input component
│   │       ├── label.tsx             # Form label
│   │       ├── animated-counter.tsx  # Intersection-observer number counter
│   │       ├── particles-bg.tsx      # Canvas particle constellation
│   │       ├── progress.tsx          # Animated gradient progress bar
│   │       └── tilt-card.tsx         # Mouse-tracking 3D tilt wrapper
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client
│   │   │   ├── server.ts             # Server Supabase client
│   │   │   └── middleware.ts         # Session refresh middleware helper
│   │   └── utils.ts                  # cn() helper (clsx + tailwind-merge)
│   └── middleware.ts                 # Next.js middleware for auth session
├── supabase/
│   └── migrations/
│       └── 0000_initial_schema.sql  # Full DB schema + RLS policies
├── .env.example                     # Template for environment variables
├── .env.local                       # Your local secrets (git-ignored)
├── next.config.ts
├── package.json
├── tailwind.config.* (embedded in globals.css for v4)
└── tsconfig.json
```

---

## 👤 User Roles

The platform has **3 roles** managed via the `profiles.role` column in Supabase:

| Role | Permissions |
|---|---|
| `student` | View enrolled courses, mark attendance via QR, view own grades |
| `faculty` | Create sessions, show QR codes, view all student attendance, grade assignments |
| `admin` | All faculty permissions + manage users, departments, and system settings |

Roles are automatically set to `student` on signup. A `faculty` or `admin` must update the role via the Supabase dashboard or a dedicated admin panel.

---

## 🔒 Row Level Security (RLS)

All tables have RLS enabled with the following policies:

| Table | Who Can Read | Who Can Write |
|---|---|---|
| `profiles` | Everyone | Own profile only |
| `courses` | Everyone | Faculty/Admin |
| `course_enrollments` | Students (own) + Faculty (their courses) | Faculty |
| `attendance_sessions` | Enrolled students + Faculty (their courses) | Faculty |
| `attendance_records` | Students (own) + Faculty (their courses) | Students (mark own) + Faculty |

---

## 🎨 Design System

### Color Palette (Dark Theme)

| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.08 0.015 265)` | Deep midnight navy |
| `--primary` | `oklch(0.65 0.26 285)` | Electric violet |
| `--accent` | `oklch(0.75 0.14 85)` | Gold shimmer |
| `--emerald` (success) | `oklch(0.70 0.20 165)` | Attendance present |

### Key CSS Utilities

```css
.glass-card      /* Glassmorphism card */
.gradient-text   /* Animated shimmer gradient text */
.glow-violet     /* Box shadow violet glow */
.animate-float   /* 6s floating animation */
.bg-grid         /* Dot/grid background pattern */
```

---

## 🚢 Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com/) → **New Project** → Import your repo
3. Add all environment variables from `.env.local` in the Vercel project settings
4. Deploy — Vercel auto-detects Next.js

### Environment Variables on Vercel

Add these in **Project Settings → Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 🧑‍💻 Development Commands

```bash
npm run dev       # Start development server on localhost:3000
npm run build     # Production build
npm run start     # Run production build locally
npm run lint      # Lint with ESLint
```

---

## 📋 Known Bugs Fixed

| Bug | Status | Fix Applied |
|---|---|---|
| Login button permanently disabled (`!isValid` in `disabled` prop with `mode: 'onChange'`) | ✅ Fixed | Changed to `mode: 'onBlur'`, removed `!isValid` from `disabled` |
| `router.push('/dashboard')` allows back-navigation to login after sign-in | ✅ Fixed | Changed to `router.replace('/dashboard')` |
| Same fix applied to signup and logout | ✅ Fixed | All auth navigations use `router.replace` |

---

## 📄 License

© 2026 Kings Engineering College. All rights reserved.

---

<div align="center">
  <p>Built with ❤️ for Kings Engineering College</p>
</div>
