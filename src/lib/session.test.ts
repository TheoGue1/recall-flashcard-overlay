import { describe, expect, it } from 'vitest';
import {
  decrementMandatorySession,
  isMandatorySessionActive,
  shouldHideWindowAfterSave,
} from './session';
import type { AppSession } from './types';

const active = (remaining: number): AppSession => ({
  mandatoryActive: true,
  mandatoryRemaining: remaining,
  lastTimerFired: 1,
});

describe('session (renderer)', () => {
  it('matches electron session helpers for hide-after-save', () => {
    const prev = active(1);
    const next = decrementMandatorySession(prev);
    expect(isMandatorySessionActive(prev)).toBe(true);
    expect(isMandatorySessionActive(next)).toBe(false);
    expect(shouldHideWindowAfterSave(prev, next)).toBe(true);
  });
});
