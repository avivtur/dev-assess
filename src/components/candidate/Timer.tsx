'use client';

import { type FC, useEffect, useState } from 'react';

import { formatTime, getRemainingSeconds } from '@/utils/time';

const WARNING_THRESHOLD_SECONDS = 300;

type TimerProps = {
  startedAt: string;
  timeLimitMinutes: number;
  onExpire: () => void;
};

const Timer: FC<TimerProps> = ({ startedAt, timeLimitMinutes, onExpire }) => {
  const [remaining, setRemaining] = useState(() =>
    getRemainingSeconds(new Date(startedAt), timeLimitMinutes),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const secs = getRemainingSeconds(
        new Date(startedAt),
        timeLimitMinutes,
      );
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, timeLimitMinutes, onExpire]);

  const isWarning = remaining <= WARNING_THRESHOLD_SECONDS;

  return (
    <div
      style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        fontVariantNumeric: 'tabular-nums',
        color: isWarning ? 'var(--pf-t--global--color--status--danger--default)' : undefined,
        padding: '0.25rem 0.75rem',
        borderRadius: '4px',
        background: isWarning
          ? 'var(--pf-t--global--color--status--danger--default--50, rgba(201, 25, 11, 0.1))'
          : undefined,
      }}
    >
      {formatTime(remaining)}
    </div>
  );
};

export default Timer;
