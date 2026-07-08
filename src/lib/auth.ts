/**
 * Local auth system — no Supabase required.
 * Uses localStorage to store the user session and a cookie for middleware.
 */

export type UserRole = 'student' | 'faculty' | 'admin';

export interface LocalUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
}

/** The single admin account. Credentials are read from env vars — never hardcode them here. */
const ADMIN_ACCOUNT = {
  email: process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'admin@kingsecc.in',
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? '',
  user: {
    id: 'admin-001',
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'admin@kingsecc.in',
    full_name: 'Administrator',
    role: 'admin' as UserRole,
    avatar_url: null,
  },
};

/** Demo accounts for students and faculty. */
const DEMO_ACCOUNTS: Array<{ email: string; password: string; user: LocalUser }> = [
  {
    email: 'student@kingsecc.in',
    password: 'student123',
    user: {
      id: 'student-001',
      email: 'student@kingsecc.in',
      full_name: 'Arun Krishnamurthy',
      role: 'student',
      avatar_url: null,
    },
  },
  {
    email: 'faculty@kingsecc.in',
    password: 'faculty123',
    user: {
      id: 'faculty-001',
      email: 'faculty@kingsecc.in',
      full_name: 'Dr. A. Smith',
      role: 'faculty',
      avatar_url: null,
    },
  },
];

const SESSION_KEY = 'kings_lms_session';
const COOKIE_NAME = 'kings_lms_auth';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function setAuthCookie(value: boolean) {
  if (typeof document === 'undefined') return;
  if (value) {
    const expires = new Date(Date.now() + SESSION_DURATION_MS).toUTCString();
    document.cookie = `${COOKIE_NAME}=true; path=/; expires=${expires}; SameSite=Lax`;
  } else {
    document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
}

export function signIn(
  email: string,
  password: string
): { user: LocalUser | null; error: string | null } {
  if (typeof window === 'undefined') return { user: null, error: 'Server-side not supported' };

  const trimmedEmail = email.trim().toLowerCase();

  // Check admin
  if (
    trimmedEmail === ADMIN_ACCOUNT.email.toLowerCase() &&
    password === ADMIN_ACCOUNT.password
  ) {
    const session = {
      user: ADMIN_ACCOUNT.user,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setAuthCookie(true);
    return { user: ADMIN_ACCOUNT.user, error: null };
  }

  // Check demo accounts
  const demoMatch = DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === trimmedEmail && a.password === password
  );
  if (demoMatch) {
    const session = {
      user: demoMatch.user,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setAuthCookie(true);
    return { user: demoMatch.user, error: null };
  }

  // Check registered users (from signup)
  try {
    const stored = localStorage.getItem('kings_lms_registered_users');
    if (stored) {
      const users: Array<{ email: string; password: string; fullName: string }> = JSON.parse(stored);
      const registeredMatch = users.find(
        (u) => u.email.toLowerCase() === trimmedEmail && u.password === password
      );
      if (registeredMatch) {
        const user: LocalUser = {
          id: `user-${Date.now()}`,
          email: registeredMatch.email,
          full_name: registeredMatch.fullName,
          role: 'student',
          avatar_url: null,
        };
        const session = { user, expiresAt: Date.now() + SESSION_DURATION_MS };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setAuthCookie(true);
        return { user, error: null };
      }
    }
  } catch {
    // Ignore parse errors
  }

  return {
    user: null,
    error: 'Invalid email or password. Please check your credentials and try again.',
  };
}

export function signOut(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
    setAuthCookie(false);
  }
}

export function getCurrentUser(): LocalUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as {
      user: LocalUser;
      expiresAt: number;
    };
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      setAuthCookie(false);
      return null;
    }
    return session.user;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
