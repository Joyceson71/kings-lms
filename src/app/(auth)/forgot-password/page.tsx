'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * /forgot-password — alias that redirects to /reset-password.
 * The reset-password page handles the full "forgot password" flow
 * (email input → Supabase sends reset link).
 */
export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reset-password');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
