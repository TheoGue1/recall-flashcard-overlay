import { describe, expect, it } from 'vitest';
import {
  countDueCards,
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

describe('countDueCards', () => {
  it('drops after a due card is rated out of the queue', () => {
    const now = 1_000_000;
    let cards = [
      { ...createCard('Q1', 'A1'), due: now },
      { ...createCard('Q2', 'A2'), due: now },
    ];
    expect(countDueCards(cards, now)).toBe(2);

    const updated = scheduleCard(cards[0], 'good', settings, now);
    cards = cards.map((c) => (c.id === updated.id ? updated : c));
    expect(countDueCards(cards, now + 1)).toBe(1);
  });
});
