import type { AppSettings, AppSession } from './types';

export const MAX_TIMEOUT_MS = 2_147_483_647;
export const MIN_TIMER_MINUTES = 5;
export const MAX_TIMER_MINUTES = 240;

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeSettings(
  settings: Partial<AppSettings>,
  defaults: AppSettings
): AppSettings {
  const steps = Array.isArray(settings.learningStepsMinutes)
    ? settings.learningStepsMinutes
        .map((s) => clampInt(s, 1, 1440, 0))
        .filter((n) => n > 0)
    : defaults.learningStepsMinutes;

  return {
    ...defaults,
    ...settings,
    timerEnabled: settings.timerEnabled !== false,
    timerIntervalMinutes: clampInt(
      settings.timerIntervalMinutes,
      MIN_TIMER_MINUTES,
      MAX_TIMER_MINUTES,
      defaults.timerIntervalMinutes
    ),
    timerCardCount: clampInt(settings.timerCardCount, 1, 50, defaults.timerCardCount),
    learningStepsMinutes: steps.length ? steps : defaults.learningStepsMinutes,
    graduatingIntervalDays: clampInt(
      settings.graduatingIntervalDays,
      1,
      365,
      defaults.graduatingIntervalDays
    ),
    easyIntervalDays: clampInt(
      settings.easyIntervalDays,
      1,
      365,
      defaults.easyIntervalDays
    ),
  };
}

export function sanitizeSession(
  session: Partial<AppSession>,
  defaults: AppSession
): AppSession {
  const mandatoryRemaining = clampInt(session.mandatoryRemaining, 0, 50, 0);
  const mandatoryActive =
    Boolean(session.mandatoryActive) && mandatoryRemaining > 0;

  return {
    ...defaults,
    ...session,
    mandatoryActive,
    mandatoryRemaining,
    lastTimerFired:
      typeof session.lastTimerFired === 'number' ? session.lastTimerFired : null,
  };
}

export function timerIntervalMs(minutes: number): number {
  const clamped = clampInt(minutes, MIN_TIMER_MINUTES, MAX_TIMER_MINUTES, 30);
  const ms = clamped * 60 * 1000;
  return Math.min(ms, MAX_TIMEOUT_MS);
}

export function timerSettingsChanged(prev: AppSettings, next: AppSettings): boolean {
  return (
    prev.timerEnabled !== next.timerEnabled ||
    prev.timerIntervalMinutes !== next.timerIntervalMinutes
  );
}
