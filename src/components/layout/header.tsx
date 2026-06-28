'use client';

import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex flex-1 items-center justify-between px-6">
        <div className="flex flex-1">
          <form className="flex w-full md:ml-0" action="#" method="GET">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <div className="relative w-full max-w-md text-muted-foreground focus-within:text-foreground">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4" aria-hidden="true" />
              </div>
              <Input
                id="search-field"
                className="h-10 w-full bg-card/50 border-border pl-10 pr-3 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary rounded-full"
                placeholder="Search courses, students, assignments..."
                type="search"
                name="search"
              />
            </div>
          </form>
        </div>
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          <button
            type="button"
            className="rounded-full bg-secondary p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>
          
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center border-2 border-border cursor-pointer">
              <span className="text-xs font-medium text-primary-foreground">JD</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
