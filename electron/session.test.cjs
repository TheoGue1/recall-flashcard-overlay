import { describe, expect, it } from 'vitest';
import {
  applyStudyBreakRating,
  isMandatorySessionActive,
  shouldBlockWindowClose,
  shouldHideWindowAfterSave,
  shouldShowWindowOnLaunch,
} from './session.cjs';

const idle = {
  mandatoryActive: false,
  mandatoryRemaining: 0,
  mandatoryCardIds: [],
  mandatoryEasyDoneIds: [],
  lastTimerFired: null,
};

const active = (cardIds, easyDoneIds = []) => ({
  mandatoryActive: true,
  mandatoryRemaining: cardIds.length - easyDoneIds.length,
  mandatoryCardIds: cardIds,
  mandatoryEasyDoneIds: easyDoneIds,
  lastTimerFired: 1,
});

describe('isMandatorySessionActive', () => {
  it('is false when idle', () => {
    expect(isMandatorySessionActive(idle)).toBe(false);
  });

  it('is true when assigned cards remain', () => {
    expect(isMandatorySessionActive(active(['a', 'b', 'c']))).toBe(true);
  });
});

describe('applyStudyBreakRating', () => {
  it('decrements only when an assigned card is rated Easy', () => {
    expect(applyStudyBreakRating(active(['a', 'b', 'c']), 'a', 'good')).toEqual(
      active(['a', 'b', 'c'])
    );
    expect(applyStudyBreakRating(active(['a', 'b', 'c']), 'a', 'easy')).toEqual(
      active(['a', 'b', 'c'], ['a'])
    );
    expect(applyStudyBreakRating(active(['a', 'b', 'c']), 'z', 'easy')).toEqual(
      active(['a', 'b', 'c'])
    );
  });

  it('clears mandatory when all assigned cards are Easy', () => {
    expect(applyStudyBreakRating(active(['a']), 'a', 'easy')).toEqual({
      ...active(['a'], ['a']),
      mandatoryActive: false,
      mandatoryRemaining: 0,
    });
  });
});

describe('shouldHideWindowAfterSave', () => {
  it('hides when all assigned cards are Easy', () => {
    const prev = active(['a']);
    const next = applyStudyBreakRating(prev, 'a', 'easy');
    expect(shouldHideWindowAfterSave(prev, next)).toBe(true);
  });

  it('does not hide when session still active', () => {
    expect(shouldHideWindowAfterSave(active(['a', 'b']), active(['a', 'b']))).toBe(
      false
    );
  });
});

describe('shouldBlockWindowClose', () => {
  it('blocks during mandatory session', () => {
    expect(shouldBlockWindowClose(active(['a', 'b']))).toBe(true);
  });

  it('allows close when idle', () => {
    expect(shouldBlockWindowClose(idle)).toBe(false);
  });
});

describe('shouldShowWindowOnLaunch', () => {
  it('shows only if mandatory session was interrupted', () => {
    expect(shouldShowWindowOnLaunch(active(['a', 'b']))).toBe(true);
    expect(shouldShowWindowOnLaunch(idle)).toBe(false);
  });
});
