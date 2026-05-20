import { normalizeBreakQueueOrder } from './session';
import type { AppSettings, AppSession } from './types';

export const MAX_TIMEOUT_MS = 2_147_483_647;
export const PROD_MIN_TIMER_MINUTES = 5;
export const DEV_MIN_TIMER_MINUTES = 1;
export const MAX_TIMER_MINUTES = 240;

/** Minimum reminder interval (1 min in Vite dev, 5 min in production builds). */
export function getMinTimerMinutes(): number {
  return import.meta.env.DEV ? DEV_MIN_TIMER_MINUTES : PROD_MIN_TIMER_MINUTES;
}

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
      getMinTimerMinutes(),
      MAX_TIMER_MINUTES,
      defaults.timerIntervalMinutes
    ),
    timerCardCount: clampInt(settings.timerCardCount, 1, 50, defaults.timerCardCount),
    studyBreakFullscreen: Boolean(settings.studyBreakFullscreen),
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

function sanitizeIdList(ids: unknown, maxLen: number): string[] {
  if (!Array.isArray(ids)) return [];
  return ids
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
    .slice(0, maxLen);
}

export function sanitizeSession(
  session: Partial<AppSession>,
  defaults: AppSession
): AppSession {
  const mandatoryCardIds = sanitizeIdList(session.mandatoryCardIds, 50);
  const mandatoryEasyDoneIds = sanitizeIdList(session.mandatoryEasyDoneIds, 50).filter(
    (id) => mandatoryCardIds.includes(id)
  );
  const breakQueueOrder = normalizeBreakQueueOrder(
    mandatoryCardIds,
    mandatoryEasyDoneIds,
    sanitizeIdList(session.breakQueueOrder, 50)
  );
  const pendingFromIds = mandatoryCardIds.length - mandatoryEasyDoneIds.length;
  const mandatoryRemaining =
    mandatoryCardIds.length > 0
      ? pendingFromIds
      : clampInt(session.mandatoryRemaining, 0, 50, 0);
  const mandatoryActive =
    Boolean(session.mandatoryActive) && mandatoryRemaining > 0;

  return {
    ...defaults,
    ...session,
    mandatoryActive,
    mandatoryRemaining,
    mandatoryCardIds,
    mandatoryEasyDoneIds,
    breakQueueOrder,
    lastTimerFired:
      typeof session.lastTimerFired === 'number' ? session.lastTimerFired : null,
  };
}

export function timerIntervalMs(minutes: number): number {
  const clamped = clampInt(minutes, getMinTimerMinutes(), MAX_TIMER_MINUTES, 30);
  const ms = clamped * 60 * 1000;
  return Math.min(ms, MAX_TIMEOUT_MS);
}

export function timerSettingsChanged(prev: AppSettings, next: AppSettings): boolean {
  return (
    prev.timerEnabled !== next.timerEnabled ||
    prev.timerIntervalMinutes !== next.timerIntervalMinutes
  );
}
