'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface BobChatProps {
  userRole: 'student' | 'faculty' | 'admin';
  userName: string;
  context?: {
    courses?: string[];
    currentPage?: string;
  };
}

export function BobChat({ userRole, userName, context }: BobChatProps) {
  const router = useRouter();
  const [hasNewMessage, setHasNewMessage] = useState(true);

  return (
    <>
      <button
        onClick={() => {
          setHasNewMessage(false);
          router.push('/dashboard/assistant');
        }}
        aria-label="Open Bob — AI Study Assistant"
        className="bob-trigger"
      >
        <div className="bob-avatar">B</div>
        {hasNewMessage && <span className="bob-badge" />}
        <span className="bob-label">Ask Bob</span>
      </button>
    </>
  );
}
