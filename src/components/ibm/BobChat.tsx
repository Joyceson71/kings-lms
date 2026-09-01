'use client';
import { useState } from 'react';
import { WebChatContainer } from '@ibm-watson/assistant-web-chat-react';

interface BobChatProps {
  userRole: 'student' | 'faculty' | 'admin';
  userName: string;
  context?: {
    courses?: string[];
    currentPage?: string;
  };
}

export function BobChat({ userRole, userName, context }: BobChatProps) {
  const [instance, setInstance] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const webChatOptions = {
    integrationID: process.env.NEXT_PUBLIC_IBM_BOB_INTEGRATION_ID!,
    region: process.env.NEXT_PUBLIC_IBM_BOB_REGION!,
    serviceInstanceID: process.env.NEXT_PUBLIC_IBM_BOB_SERVICE_INSTANCE_ID!,
    onLoad: async (instance: any) => {
      // Pre-populate context so Bob knows who it's talking to
      await instance.updateUserID(userName);
      await instance.send({
        input: { message_type: 'silent', text: '' },
        context: {
          global: {
            system: {
              user_id: userName,
            },
          },
          skills: {
            'main skill': {
              user_defined: {
                user_role: userRole,
                user_name: userName,
                enrolled_courses: context?.courses?.join(', ') || 'none',
                current_page: context?.currentPage || 'dashboard',
              },
            },
          },
        },
      });
      await instance.render();
      setInstance(instance);
    },
  };

  async function onBeforeRender(inst: any) {
    // Listen for new messages from Bob and show badge
    inst.on({ type: 'receive', handler: () => {
      if (!isOpen) setHasNewMessage(true);
    }});
    setInstance(inst);
  }

  return (
    <>
      <WebChatContainer
        config={webChatOptions}
        onBeforeRender={onBeforeRender}
      />
      {/* Custom Bob trigger button — replaces default IBM launcher */}
      <button
        onClick={() => { instance?.toggleOpen(); setIsOpen(o => !o); setHasNewMessage(false); }}
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
