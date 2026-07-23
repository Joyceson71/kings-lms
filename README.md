# 🎓 Kings EC Platform — Campus Learning & Management System

<div align="center">

![Kings EC Platform](https://img.shields.io/badge/Kings%20EC-Campus%20LMS-7c3aed?style=for-the-badge&logo=graduation-cap)
![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ecf8e?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss)

**A premium, full-stack Campus LMS for Kings Engineering College.**  
Features 3D animations, particle backgrounds, real-time attendance, global focus timers, and role-based dashboards.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth System** | Supabase email/password auth exclusively (No split-brain local auth) |
| 🎨 **Premium UI** | Glassmorphism, 3D tilt cards, particle canvas backgrounds, smooth layout animations |
| 📊 **Dashboard** | Live stats with animated counters, Recharts area/radial charts, and streak widgets |
| ✅ **Attendance** | QR-based session tracking for faculty + students |
| 📚 **Courses** | Course management with 3D cards and attendance tracking |
| 📋 **Assignments** | Kanban board (Pending → Submitted → Graded) featuring **Smart Sort** (urgency & deadline-based sorting) |
| ⏱️ **Pomodoro Timer**| Global floating focus timer widget with persistent storage and break cycles |
| 🛡️ **Admin Panel** | Powerful admin tools: **User Details Drawer**, **Global Broadcast Announcements**, live **Health Metrics**, and **Department Breakdown Charts** |
| 👥 **Students** | Searchable student table with attendance bars |
| ⚙️ **Settings** | Real-time profile syncing, notifications, security, and appearance tabs |
| 🌐 **Responsive** | Works beautifully on desktop, tablet, and mobile with animated side nav |

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
git clone https://github.com/Joyceson71/kings-lms.git
cd kings-lms

# Install dependencies
npm install
```

---

### 2. Supabase Setup

1. Go to [app.supabase.com](https://app.supabase.com/) and **create a new project**
2. Once your project is ready, navigate to:
   - **Project Settings → API** to get your keys
   
3. Run the database migrations by going to **SQL Editor** in your Supabase dashboard. You must paste and run the contents of **all SQL files** in the migrations folder sequentially (from 0000 to 0014):
   ```
   supabase/migrations/
   ```
   (Alternatively, use the Supabase CLI if you have it installed: `npx supabase db push`)

This will create the following tables:
- `profiles` — User profile with role (student/faculty/admin)
- `courses` — Course catalog
- `course_enrollments` — Many-to-many student↔course
- `attendance_sessions` — QR-enabled sessions created by faculty
- `attendance_records` — Student attendance per session
- `announcements` — Global and course-specific broadcasts
- `assignment_submissions` — Grades and file links for assignments

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

### 3.5. OAuth Setup (Google & GitHub)
To enable the "Continue with Google" and "Continue with GitHub" buttons on the Login and Signup pages, you need to configure OAuth providers in Supabase.

**Google Setup:**
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

```text
kings-lms/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group (no layout chrome)
│   │   ├── dashboard/                # Protected dashboard pages
│   │   │   ├── admin/                # Admin Panel (Users, Departments)
│   │   │   ├── attendance/           # QR attendance management
│   │   │   ├── courses/              # Course cards grid
│   │   │   ├── assignments/          # Kanban assignment board (with Smart Sort)
│   │   │   ├── students/             # Student table + search
│   │   │   └── settings/             # Profile & preferences
│   │   ├── api/                      # Next.js Route Handlers
│   │   ├── globals.css               # Design system + animations
│   │   ├── layout.tsx                # Root layout (fonts + metadata)
│   │   └── page.tsx                  # Root redirect to /dashboard
│   ├── components/
│   │   ├── layout/                   # Header, Animated Sidebar, Pomodoro Timer
│   │   └── ui/                       # Glassmorphism cards, animated counters, particle bg
│   ├── lib/                          # Supabase clients, auth middleware, util functions
│   └── middleware.ts                 # Next.js middleware for auth session
├── supabase/
│   └── migrations/                   # Full DB schema + RLS policies + dummy data
├── .env.example                      # Template for environment variables
└── package.json
```

---

## 👤 User Roles

The platform has **3 roles** managed via the `profiles.role` column in Supabase:

| Role | Permissions |
|---|---|
| `student` | View enrolled courses, mark attendance via QR, view own grades, use Smart Sort |
| `faculty` | Create sessions, show QR codes, view all student attendance, grade assignments |
| `admin` | All faculty permissions + manage users, broadcast announcements, view health metrics |

Roles are automatically set to `student` on signup. A `faculty` or `admin` must update the role via the Supabase dashboard or the **Admin Panel**.

---

## 🔒 Row Level Security (RLS)

All tables have RLS enabled with the following policies:

| Table | Who Can Read | Who Can Write |
|---|---|---|
| `profiles` | Everyone | Own profile only (Admins can update all) |
| `courses` | Everyone | Faculty/Admin |
| `course_enrollments` | Students (own) + Faculty (their courses) | Faculty |
| `attendance_sessions` | Enrolled students + Faculty (their courses) | Faculty |
| `attendance_records` | Students (own) + Faculty (their courses) | Students (mark own) + Faculty |
| `announcements` | Enrolled students / Everyone (if global) | Faculty (course) / Admins (global) |

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

---

## 📋 Changelog / Recent Updates

| Feature / Fix | Status |
|---|---|
| **Admin Panel Overhaul** | Added User Detail Drawer, Global Broadcasts, and Dept Bar Charts |
| **Pomodoro Timer** | Implemented global floating focus timer with localStorage persistence |
| **Smart Sort (Assignments)** | Students can now auto-sort Kanban columns by urgency/deadline |
| **Dashboard Analytics** | Added Recharts Area & Radial charts for attendance/study scores |
| **UI Polish** | Added buttery-smooth fade animations to sidebar expansion |
| **Settings Profile Sync** | Wired the settings form directly to the Supabase `profiles` table |
| **Auth Fixes** | Purged split-brain mock auth, fully migrated to Supabase SSR sessions |

---

## 📄 License

© 2026 Kings Engineering College. All rights reserved.

---

<div align="center">
  <p>Built with ❤️ for Kings Engineering College</p>
</div>
