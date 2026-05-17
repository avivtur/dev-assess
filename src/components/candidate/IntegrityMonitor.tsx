'use client';

import { Alert } from '@patternfly/react-core';
import { type FC, type ReactNode, useEffect, useRef, useState } from 'react';

type IntegrityMonitorProps = {
  submissionId: string;
  currentQuestionId: string;
  children: ReactNode;
};

const PASTE_WARNING_DURATION_MS = 3000;

const IntegrityMonitor: FC<IntegrityMonitorProps> = ({
  submissionId,
  currentQuestionId,
  children,
}) => {
  const [showPasteWarning, setShowPasteWarning] = useState(false);
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

      setShowPasteWarning(true);
      setTimeout(() => setShowPasteWarning(false), PASTE_WARNING_DURATION_MS);
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
      {showPasteWarning && (
        <Alert
          variant="warning"
          title="Paste detected"
          isInline
          style={{ marginBottom: '1rem' }}
        >
          Clipboard paste events are recorded and visible to the reviewer.
        </Alert>
      )}
      {children}
    </div>
  );
};

export default IntegrityMonitor;
