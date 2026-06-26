"use client";

import { Bell, Search, UserCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRole, Role } from "@/components/role-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { role, setRole } = useRole();

  const getRoleDisplayName = (r: Role) => {
    switch (r) {
      case "admin": return "Admin";
      case "faculty": return "Faculty";
      case "student": return "Student";
    }
  };

  const getRoleAvatarInitials = (r: Role) => {
    switch (r) {
      case "admin": return "AD";
      case "faculty": return "FC";
      case "student": return "ST";
    }
  };

  return (
    <header className="h-20 w-full glass flex items-center justify-between px-6 z-10 sticky top-0 border-b border-white/5 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search courses, students, or resources..." 
            className="pl-10 bg-black/10 border-white/10 rounded-2xl focus-visible:ring-primary/50 text-sm h-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="relative bg-transparent border-white/10 hover:bg-white/10 rounded-xl">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
        </Button>
        <ThemeToggle />
        <div className="h-8 w-[1px] bg-white/10 mx-1" />
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium">Test User</span>
            <span className="text-xs text-primary capitalize font-semibold">{getRoleDisplayName(role)}</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              <Avatar className="w-10 h-10 border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-colors">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${role}`} alt="@avatar" />
                <AvatarFallback>{getRoleAvatarInitials(role)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-panel border-white/10 w-48">
              <DropdownMenuLabel>Mock Role Switcher</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => setRole("admin")} className="hover:bg-white/10 cursor-pointer justify-between">
                Admin {role === "admin" && <span className="w-2 h-2 rounded-full bg-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole("faculty")} className="hover:bg-white/10 cursor-pointer justify-between">
                Faculty {role === "faculty" && <span className="w-2 h-2 rounded-full bg-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole("student")} className="hover:bg-white/10 cursor-pointer justify-between">
                Student {role === "student" && <span className="w-2 h-2 rounded-full bg-primary" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
