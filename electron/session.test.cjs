import { describe, expect, it } from 'vitest';
import {
  decrementMandatorySession,
  isMandatorySessionActive,
  shouldBlockWindowClose,
  shouldHideWindowAfterSave,
  shouldShowWindowOnLaunch,
} from './session.cjs';

const idle = { mandatoryActive: false, mandatoryRemaining: 0, lastTimerFired: null };
const active = (remaining) => ({
  mandatoryActive: true,
  mandatoryRemaining: remaining,
  lastTimerFired: 1,
});

describe('isMandatorySessionActive', () => {
  it('is false when idle', () => {
    expect(isMandatorySessionActive(idle)).toBe(false);
  });

  it('is true when cards remain', () => {
    expect(isMandatorySessionActive(active(3))).toBe(true);
  });

  it('is false when active flag set but no cards left', () => {
    expect(isMandatorySessionActive(active(0))).toBe(false);
  });
});

describe('decrementMandatorySession', () => {
  it('does not change idle session', () => {
    expect(decrementMandatorySession(idle)).toEqual(idle);
  });

  it('decrements remaining cards', () => {
    expect(decrementMandatorySession(active(3))).toEqual(active(2));
  });

  it('clears mandatory when last card is rated', () => {
    expect(decrementMandatorySession(active(1))).toEqual({
      ...active(0),
      mandatoryActive: false,
      mandatoryRemaining: 0,
    });
  });
});

describe('shouldHideWindowAfterSave', () => {
  it('hides when timer session completes', () => {
    expect(shouldHideWindowAfterSave(active(1), decrementMandatorySession(active(1)))).toBe(
      true
    );
  });

  it('does not hide when session still active', () => {
    expect(shouldHideWindowAfterSave(active(2), decrementMandatorySession(active(2)))).toBe(
      false
    );
  });

  it('does not hide when not in mandatory session', () => {
    expect(shouldHideWindowAfterSave(idle, idle)).toBe(false);
  });
});

describe('shouldBlockWindowClose', () => {
  it('blocks during mandatory session', () => {
    expect(shouldBlockWindowClose(active(2))).toBe(true);
  });

  it('allows close when idle', () => {
    expect(shouldBlockWindowClose(idle)).toBe(false);
  });
});

describe('shouldShowWindowOnLaunch', () => {
  it('shows only if mandatory session was interrupted', () => {
    expect(shouldShowWindowOnLaunch(active(2))).toBe(true);
    expect(shouldShowWindowOnLaunch(idle)).toBe(false);
  });
});
