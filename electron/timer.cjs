/** Node setTimeout/setInterval max delay (32-bit signed ms). */
const MAX_TIMEOUT_MS = 2_147_483_647;

const MAX_TIMER_MINUTES = 240;
const PROD_MIN_TIMER_MINUTES = 5;
const DEV_MIN_TIMER_MINUTES = 1;

let minTimerMinutes = PROD_MIN_TIMER_MINUTES;

function getMinTimerMinutes() {
  return minTimerMinutes;
}

/** @param {boolean} isDev */
function configureTimerLimits(isDev) {
  minTimerMinutes = isDev ? DEV_MIN_TIMER_MINUTES : PROD_MIN_TIMER_MINUTES;
}

function clampInt(value, min, max, fallback) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * @param {Record<string, unknown>} settings
 * @param {Record<string, unknown>} defaults
 */
function sanitizeSettings(settings, defaults) {
  const steps = Array.isArray(settings?.learningStepsMinutes)
    ? settings.learningStepsMinutes
        .map((s) => clampInt(s, 1, 1440, 0))
        .filter((n) => n > 0)
    : defaults.learningStepsMinutes;

  return {
    ...defaults,
    ...settings,
    timerEnabled: settings?.timerEnabled !== false,
    timerIntervalMinutes: clampInt(
      settings?.timerIntervalMinutes,
      getMinTimerMinutes(),
      MAX_TIMER_MINUTES,
      defaults.timerIntervalMinutes
    ),
    timerCardCount: clampInt(
      settings?.timerCardCount,
      1,
      50,
      defaults.timerCardCount
    ),
    learningStepsMinutes: steps.length ? steps : defaults.learningStepsMinutes,
    graduatingIntervalDays: clampInt(
      settings?.graduatingIntervalDays,
      1,
      365,
      defaults.graduatingIntervalDays
    ),
    easyIntervalDays: clampInt(
      settings?.easyIntervalDays,
      1,
      365,
      defaults.easyIntervalDays
    ),
  };
}

/**
 * @param {Record<string, unknown>} session
 * @param {Record<string, unknown>} defaults
 */
function sanitizeSession(session, defaults) {
  const mandatoryRemaining = clampInt(
    session?.mandatoryRemaining,
    0,
    50,
    0
  );
  const mandatoryActive =
    Boolean(session?.mandatoryActive) && mandatoryRemaining > 0;

  return {
    ...defaults,
    ...session,
    mandatoryActive,
    mandatoryRemaining,
    lastTimerFired:
      typeof session?.lastTimerFired === 'number' ? session.lastTimerFired : null,
  };
}

/**
 * Safe delay for setTimeout (avoids TimeoutOverflowWarning).
 * @param {number} minutes
 */
function timerIntervalMs(minutes) {
  const clamped = clampInt(
    minutes,
    getMinTimerMinutes(),
    MAX_TIMER_MINUTES,
    30
  );
  const ms = clamped * 60 * 1000;
  return Math.min(ms, MAX_TIMEOUT_MS);
}

/**
 * @param {Record<string, unknown>} prev
 * @param {Record<string, unknown>} next
 */
function timerSettingsChanged(prev, next) {
  return (
    prev.timerEnabled !== next.timerEnabled ||
    prev.timerIntervalMinutes !== next.timerIntervalMinutes
  );
}

module.exports = {
  MAX_TIMEOUT_MS,
  PROD_MIN_TIMER_MINUTES,
  DEV_MIN_TIMER_MINUTES,
  getMinTimerMinutes,
  configureTimerLimits,
  MAX_TIMER_MINUTES,
  sanitizeSettings,
  sanitizeSession,
  timerIntervalMs,
  timerSettingsChanged,
};
