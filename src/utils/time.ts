const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;

export function getRemainingSeconds(
  startedAt: Date,
  timeLimitMinutes: number,
): number {
  const elapsed = (Date.now() - startedAt.getTime()) / MS_PER_SECOND;
  const total = timeLimitMinutes * SECONDS_PER_MINUTE;
  return Math.max(0, Math.floor(total - elapsed));
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const GRACE_PERIOD_SECONDS = 30;

export function isWithinTimeLimit(
  startedAt: Date,
  timeLimitMinutes: number,
): boolean {
  const elapsed = (Date.now() - startedAt.getTime()) / MS_PER_SECOND;
  const limit = timeLimitMinutes * SECONDS_PER_MINUTE + GRACE_PERIOD_SECONDS;
  return elapsed <= limit;
}
