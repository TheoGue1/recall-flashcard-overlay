import { describe, expect, it } from 'vitest';
import {
  createCard,
  getStudyQueue,
  isDue,
  scheduleCard,
} from './scheduler';
import type { AppSettings } from './types';

const settings: AppSettings = {
  timerEnabled: true,
  timerIntervalMinutes: 30,
  timerCardCount: 5,
  learningStepsMinutes: [1, 10],
  graduatingIntervalDays: 1,
  easyIntervalDays: 4,
};

describe('scheduleCard', () => {
  it('schedules a new card into learning on good', () => {
    const now = 1_000_000;
    const card = createCard('Q', 'A');
    const next = scheduleCard(card, 'good', settings, now);
    expect(next.state).toBe('learning');
    expect(next.due).toBeGreaterThan(now);
  });
});

describe('getStudyQueue', () => {
  it('returns only due cards by default', () => {
    const now = 5_000_000;
    const due = { ...createCard('due', 'x'), due: now - 1 };
    const later = { ...createCard('later', 'y'), due: now + 60_000 };
    expect(getStudyQueue([due, later], now)).toEqual([due]);
  });

  it('includes not-due cards during mandatory mode', () => {
    const now = 5_000_000;
    const due = { ...createCard('due', 'x'), due: now - 1 };
    const later = { ...createCard('later', 'y'), due: now + 60_000 };
    expect(getStudyQueue([due, later], now, true)).toHaveLength(2);
  });
});

describe('isDue', () => {
  it('is due when timestamp is in the past', () => {
    expect(isDue({ ...createCard('a', 'b'), due: 100 }, 200)).toBe(true);
    expect(isDue({ ...createCard('a', 'b'), due: 300 }, 200)).toBe(false);
  });
});
