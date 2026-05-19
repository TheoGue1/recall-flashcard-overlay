import { describe, expect, it } from 'vitest';
import {
  configureTimerLimits,
  sanitizeSettings,
  timerIntervalMs,
  timerSettingsChanged,
} from './timer.cjs';

configureTimerLimits(false);

const defaults = {
  timerEnabled: true,
  timerIntervalMinutes: 30,
  timerCardCount: 5,
  studyBreakFullscreen: false,
  learningStepsMinutes: [1, 10],
  graduatingIntervalDays: 1,
  easyIntervalDays: 4,
};

describe('timerIntervalMs', () => {
  it('clamps corrupt huge minute values below Node timeout max', () => {
    expect(timerIntervalMs(51111)).toBe(240 * 60 * 1000);
    expect(timerIntervalMs(51111)).toBeLessThanOrEqual(2_147_483_647);
  });

  it('returns 30 minutes in ms for default', () => {
    expect(timerIntervalMs(30)).toBe(30 * 60 * 1000);
  });
});

describe('sanitizeSettings', () => {
  it('clamps timer interval to 5–240 minutes in production', () => {
    configureTimerLimits(false);
    expect(sanitizeSettings({ timerIntervalMinutes: 51111 }, defaults).timerIntervalMinutes).toBe(
      240
    );
    expect(sanitizeSettings({ timerIntervalMinutes: 1 }, defaults).timerIntervalMinutes).toBe(5);
  });

  it('allows 1-minute interval in development', () => {
    configureTimerLimits(true);
    expect(sanitizeSettings({ timerIntervalMinutes: 1 }, defaults).timerIntervalMinutes).toBe(1);
    configureTimerLimits(false);
  });

  it('defaults study break fullscreen to false', () => {
    expect(sanitizeSettings({}, defaults).studyBreakFullscreen).toBe(false);
    expect(sanitizeSettings({ studyBreakFullscreen: true }, defaults).studyBreakFullscreen).toBe(
      true
    );
  });
});

describe('timerSettingsChanged', () => {
  it('detects timer setting updates', () => {
    expect(timerSettingsChanged(defaults, { ...defaults, timerIntervalMinutes: 60 })).toBe(
      true
    );
    expect(timerSettingsChanged(defaults, { ...defaults, timerCardCount: 10 })).toBe(false);
  });
});
