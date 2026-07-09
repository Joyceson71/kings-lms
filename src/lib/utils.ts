import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getURL(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000/';
  // Ensure https when not localhost
  url = url.includes('http') ? url : `https://${url}`;
  // Ensure trailing slash
  url = url.endsWith('/') ? url : `${url}/`;
  return url;
}
