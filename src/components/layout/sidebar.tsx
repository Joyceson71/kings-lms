"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRole } from "@/components/role-provider";
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  FileEdit,
  MessageSquare,
  BarChart3,
  Award,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "faculty", "student"] },
  { name: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck, roles: ["admin", "faculty", "student"] },
  { name: "LMS", href: "/dashboard/lms", icon: BookOpen, roles: ["admin", "faculty", "student"] },
  { name: "Assignments", href: "/dashboard/assignments", icon: FileEdit, roles: ["admin", "faculty", "student"] },
  { name: "Community", href: "/dashboard/community", icon: MessageSquare, roles: ["admin", "faculty", "student"] },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["admin", "faculty"] },
  { name: "Gamification", href: "/dashboard/gamification", icon: Award, roles: ["admin", "student"] },
  { name: "AI Assistant", href: "/dashboard/ai", icon: Sparkles, roles: ["admin", "student"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();

  const filteredLinks = sidebarLinks.filter(link => link.roles.includes(role));

  return (
    <aside className="w-64 h-full glass-panel flex flex-col p-4 m-4 rounded-3xl z-10">
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.5)]">
          <span className="text-primary-foreground font-bold text-xl">K</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-gradient">Kings LMS</span>
          <span className="text-xs text-muted-foreground">Digital Campus</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {filteredLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link key={link.name} href={link.href} className="relative block group">
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
              <div
                className={cn(
                  "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-200",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon size={20} className={cn(isActive && "text-primary")} />
                <span>{link.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      {role === "student" && (
        <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Award size={18} className="text-primary" />
            <span className="font-semibold text-sm">Level 12</span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-3/4 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">250 XP to next level</p>
        </div>
      )}
    </aside>
  );
}
