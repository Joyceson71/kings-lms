'use client';

import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="flex flex-1 items-center justify-between px-6">
        <div className="flex flex-1">
          <form className="flex w-full md:ml-0" action="#" method="GET">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <div className="relative w-full max-w-md text-zinc-400 focus-within:text-zinc-300">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4" aria-hidden="true" />
              </div>
              <Input
                id="search-field"
                className="h-10 w-full bg-zinc-900/50 border-zinc-800 pl-10 pr-3 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500 rounded-full"
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
            className="rounded-full bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>
          
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center border-2 border-zinc-800 cursor-pointer">
              <span className="text-xs font-medium text-white">JD</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
