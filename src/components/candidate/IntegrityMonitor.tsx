'use client';

import { type FC, type ReactNode, useEffect, useRef } from 'react';

type IntegrityMonitorProps = {
  submissionId: string;
  currentQuestionId: string;
  children: ReactNode;
};

const IntegrityMonitor: FC<IntegrityMonitorProps> = ({
  submissionId,
  currentQuestionId,
  children,
}) => {
  const leaveTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePaste = (e: ClipboardEvent): void => {
      const text = e.clipboardData?.getData('text') ?? '';

      fetch('/api/integrity-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          questionId: currentQuestionId,
          eventType: 'paste',
          detail: text.slice(0, 500),
        }),
      }).catch(() => {});
    };

    const handleVisibility = (): void => {
      if (document.hidden) {
        leaveTimeRef.current = Date.now();
      } else if (leaveTimeRef.current) {
        const duration = Date.now() - leaveTimeRef.current;
        leaveTimeRef.current = null;

        fetch('/api/integrity-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            questionId: currentQuestionId,
            eventType: 'focus_loss',
            detail: `${duration}ms`,
          }),
        }).catch(() => {});
      }
    };

    container.addEventListener('paste', handlePaste, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      container.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [submissionId, currentQuestionId]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
};

export default IntegrityMonitor;
