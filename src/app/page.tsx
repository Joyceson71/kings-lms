import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect users from the root to the dashboard
  // The middleware will automatically handle redirecting unauthenticated users to /login
  redirect('/dashboard');
}
