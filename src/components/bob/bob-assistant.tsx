'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchBobContext, type BobStudentContext } from './bob-context';
import { askBob, getBobProactiveMessage, type ChatMessage } from './bob-ai';
import { createClient } from '@/lib/supabase/client';

// IBM Carbon design tokens
const IBM = {
  blue: '#0F62FE',
  dark: '#161616',
  dark2: '#262626',
  dark3: '#393939',
  border: 'rgba(255,255,255,0.08)',
  textPrimary: '#F4F4F4',
  textSecondary: '#A8A8B3',
  success: '#24A148',
  warning: '#F1C21B',
  danger: '#DA1E28',
} as const;

const SUGGESTIONS = [
  "Summarize my weak subjects",
  "Help me plan a study schedule",
  "Quiz me on my courses",
  "Check my attendance risk",
];

export default function BobAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<BobStudentContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setContextLoading(true);
        const ctx = await fetchBobContext(user.id);
        setContext(ctx);
        const proactive = getBobProactiveMessage(ctx);
        const short = proactive.length > 90 ? proactive.slice(0, 87) + '...' : proactive;
        setAlertMessage(short);
        setMessages([{ role: 'model', text: proactive }]);
      } catch (err) {
        console.error('BOB context error:', err);
      } finally {
        setContextLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (textOverride?: string) => {
    const textToSend = (typeof textOverride === 'string' ? textOverride : input).trim();
    if (!textToSend || isLoading || !context) return;
    
    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (typeof textOverride !== 'string') setInput('');
    setIsLoading(true);

    try {
      const reply = await askBob(userMsg.text, context, newHistory);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'model',
        text: 'Something went wrong on my end. Try again in a moment. - BOB',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, context, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    if (!context) return;
    const proactive = getBobProactiveMessage(context);
    setMessages([{ role: 'model', text: proactive }]);
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '84px',
    right: '24px',
    zIndex: 1001,
    width: '380px',
    maxWidth: 'calc(100vw - 32px)',
    height: '540px',
    maxHeight: 'calc(100vh - 120px)',
    background: IBM.dark,
    border: '1px solid ' + IBM.border,
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(15,98,254,0.2)',
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    overflow: 'hidden',
  };

  const overallAttendance = context && context.attendanceByCourse.length > 0
    ? Math.round(context.attendanceByCourse.reduce((s, c) => s + c.attendancePercentage, 0) / context.attendanceByCourse.length)
    : null;

  return (
    <>
      {/* Proactive alert bubble */}
      {alertMessage && !isOpen && !contextLoading && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(true)}
          onKeyDown={e => e.key === 'Enter' && setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            zIndex: 1000,
            maxWidth: '260px',
            background: IBM.dark2,
            border: '1px solid ' + IBM.border,
            borderRadius: '4px',
            padding: '10px 14px',
            cursor: 'pointer',
            borderLeft: '3px solid ' + IBM.blue,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <p style={{ fontSize: '12px', color: IBM.textPrimary, margin: 0, lineHeight: 1.4 }}>
            {alertMessage}
          </p>
          <p style={{ fontSize: '10px', color: IBM.textSecondary, margin: '4px 0 0', fontFamily: "'IBM Plex Mono', monospace" }}>
            BOB · Click to open chat
          </p>
        </div>
      )}

      {/* Floating trigger */}
      <button
        onClick={() => setIsOpen(o => !o)}
        aria-label="Open BOB Learning Assistant"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1001,
          width: '52px',
          height: '52px',
          borderRadius: '4px',
          background: IBM.blue,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(15,98,254,0.5), 0 0 32px rgba(15,98,254,0.6)'
            : '0 0 0 2px rgba(15,98,254,0.2), 0 0 24px rgba(15,98,254,0.4)',
          transition: 'all 0.2s ease',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '18px',
          fontWeight: 700,
          color: '#fff',
          animation: !isOpen ? 'bob-pulse 3s ease-in-out infinite' : 'none',
        }}
      >
        {isOpen ? '✕' : 'B'}
      </button>

      {/* Unified Chat panel */}
      {isOpen && (
        <div style={panelStyle} role="dialog" aria-label="BOB AI Learning Assistant">
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid ' + IBM.border,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: IBM.dark2,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: IBM.blue,
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 700,
                fontSize: '15px',
                color: '#fff',
              }}>B</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: IBM.textPrimary, lineHeight: 1.2 }}>BOB</div>
                <div style={{ fontSize: '10px', color: IBM.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>
                  Behaviour-Oriented Buddy · IBM
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {overallAttendance !== null && (
                <span style={{
                  fontSize: '10px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  padding: '2px 6px',
                  borderRadius: '2px',
                  background: overallAttendance < 60 ? 'rgba(218,30,40,0.2)' : overallAttendance < 75 ? 'rgba(241,194,27,0.2)' : 'rgba(36,161,72,0.2)',
                  color: overallAttendance < 60 ? IBM.danger : overallAttendance < 75 ? IBM.warning : IBM.success,
                  border: '1px solid ' + (overallAttendance < 60 ? IBM.danger : overallAttendance < 75 ? IBM.warning : IBM.success),
                }}>
                  {overallAttendance}% Att.
                </span>
              )}
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: contextLoading ? IBM.warning : IBM.success,
                boxShadow: contextLoading ? '0 0 6px ' + IBM.warning : '0 0 6px ' + IBM.success,
              }} />
              
              <button
                onClick={clearChat}
                aria-label="Clear chat history"
                title="Clear chat"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: IBM.textSecondary,
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '2px',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = IBM.textPrimary; }}
                onMouseLeave={e => { e.currentTarget.style.color = IBM.textSecondary; }}
              >
                🗑
              </button>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Hide BOB Assistant"
                title="Hide / Close BOB"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: IBM.textSecondary,
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = IBM.textPrimary;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = IBM.textSecondary;
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '8px',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
              }}>
                {msg.role === 'model' && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '2px',
                    background: IBM.blue,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}>B</div>
                )}
                <div style={{
                  maxWidth: '82%',
                  padding: '10px 12px',
                  borderRadius: '2px',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: IBM.textPrimary,
                  background: msg.role === 'user' ? 'rgba(15,98,254,0.18)' : IBM.dark3,
                  border: '1px solid ' + (msg.role === 'user' ? 'rgba(15,98,254,0.4)' : IBM.border),
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Quick Suggestion Chips */}
            {messages.length === 1 && !isLoading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(s)}
                    style={{
                      fontSize: '11px',
                      padding: '5px 10px',
                      borderRadius: '2px',
                      background: IBM.dark2,
                      border: '1px solid ' + IBM.border,
                      color: IBM.textSecondary,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = IBM.blue;
                      e.currentTarget.style.color = IBM.textPrimary;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = IBM.border;
                      e.currentTarget.style.color = IBM.textSecondary;
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '2px',
                  background: IBM.blue, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '10px', fontWeight: 700,
                  color: '#fff', flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace",
                }}>B</div>
                <div style={{
                  padding: '10px 12px', borderRadius: '2px', background: IBM.dark3,
                  border: '1px solid ' + IBM.border, display: 'flex', gap: '4px', alignItems: 'center',
                }}>
                  {[0, 1, 2].map(d => (
                    <span key={d} style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: IBM.blue, display: 'inline-block',
                      animation: 'bob-dot 1.2s ease-in-out ' + (d * 0.2) + 's infinite',
                    }} />
                  ))}
                </div>
              </div>
            )}

            {contextLoading && messages.length === 0 && (
              <div style={{ textAlign: 'center', color: IBM.textSecondary, fontSize: '12px', marginTop: '24px' }}>
                Loading student context...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid ' + IBM.border,
            display: 'flex',
            gap: '8px',
            flexShrink: 0,
            background: IBM.dark2,
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={contextLoading ? 'Loading context...' : 'Ask BOB anything...'}
              disabled={isLoading || contextLoading}
              style={{
                flex: 1,
                background: IBM.dark,
                border: '1px solid ' + IBM.border,
                borderRadius: '2px',
                padding: '9px 12px',
                fontSize: '13px',
                color: IBM.textPrimary,
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = IBM.blue; }}
              onBlur={e => { e.currentTarget.style.borderColor = IBM.border; }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || contextLoading || !input.trim()}
              style={{
                background: IBM.blue,
                border: 'none',
                borderRadius: '2px',
                padding: '0 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fff',
                cursor: (isLoading || contextLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isLoading || contextLoading || !input.trim()) ? 0.5 : 1,
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                transition: 'opacity 0.15s',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bob-pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(15,98,254,0.2), 0 0 24px rgba(15,98,254,0.4); }
          50%       { box-shadow: 0 0 0 4px rgba(15,98,254,0.15), 0 0 36px rgba(15,98,254,0.6); }
        }
        @keyframes bob-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </>
  );
}
