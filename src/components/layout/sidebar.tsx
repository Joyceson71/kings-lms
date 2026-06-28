'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, FileText, Settings, LogOut, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Attendance', href: '/dashboard/attendance', icon: CheckCircle },
  { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
  { name: 'Assignments', href: '/dashboard/assignments', icon: FileText },
  { name: 'Students', href: '/dashboard/students', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Kings EC</span>
        </Link>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-zinc-800/80 text-indigo-400'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white',
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300',
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
