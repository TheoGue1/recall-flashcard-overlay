import { describe, expect, it } from 'vitest';
import { createCard, getStudyQueue } from './scheduler';
import {
  applyBreakCardRating,
  getBreakStudyQueue,
  isMandatorySessionActive,
  repositionInBreakQueue,
  startStudyBreakSession,
} from './session';

const now = 1_000_000;

function cards(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    ...createCard(`Q${i}`, `A${i}`),
    due: now,
  }));
}

describe('repositionInBreakQueue', () => {
  it('matches the break pile rules', () => {
    expect(repositionInBreakQueue(['a', 'b', 'c', 'd', 'e'], 'a', 'good')).toEqual([
      'b',
      'c',
      'd',
      'e',
      'a',
    ]);

    let q = ['b', 'c', 'd', 'e', 'a'];
    q = repositionInBreakQueue(q, 'c', 'again');
    expect(q.indexOf('c')).toBe(Math.floor((q.length - 1) / 2));

    q = ['b', 'c', 'd', 'e', 'a'];
    q = q.filter((id) => id !== 'b');
    q = repositionInBreakQueue([...q, 'd'], 'd', 'hard');
    const hardIdx = q.indexOf('d');
    expect(hardIdx).toBe(Math.min(q.length - 1, Math.floor(((q.length - 1) * 3) / 4)));
  });
});

describe('startStudyBreakSession', () => {
  it('assigns cards and initial pile order', () => {
    const deck = cards(10);
    const session = startStudyBreakSession(deck, 5, now);
    expect(session.breakQueueOrder).toEqual(session.mandatoryCardIds);
    expect(session.mandatoryRemaining).toBe(5);
  });
});

describe('applyBreakCardRating', () => {
  it('walks through good → easy → again → hard pile behavior', () => {
    const deck = cards(5);
    let session = startStudyBreakSession(deck, 5, now);
    const [c1, c2, c3, c4] = session.mandatoryCardIds;

    session = applyBreakCardRating(session, c1, 'good');
    expect(session.breakQueueOrder[session.breakQueueOrder.length - 1]).toBe(c1);

    session = applyBreakCardRating(session, c2, 'easy');
    expect(session.breakQueueOrder).not.toContain(c2);
    expect(session.mandatoryRemaining).toBe(4);

    session = applyBreakCardRating(session, c3, 'again');
    const q = session.breakQueueOrder;
    expect(q).toContain(c3);
    expect(q.indexOf(c3)).toBe(Math.floor((q.length - 1) / 2));

    session = applyBreakCardRating(session, c4, 'hard');
    expect(session.breakQueueOrder).toContain(c4);

    const queue = getBreakStudyQueue(deck, session);
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[0].id).toBe(session.breakQueueOrder[0]);
  });

  it('finishes when every assigned card is Easy', () => {
    const deck = cards(3);
    let session = startStudyBreakSession(deck, 3, now);
    for (const id of session.mandatoryCardIds) {
      session = applyBreakCardRating(session, id, 'easy');
    }
    expect(isMandatorySessionActive(session)).toBe(false);
    expect(getBreakStudyQueue(deck, session)).toHaveLength(0);
  });
});

describe('getBreakStudyQueue', () => {
  it('uses break pile order, not SRS due dates', () => {
    const deck = cards(5).map((c, i) =>
      i === 0 ? { ...c, due: now + 999_999 } : c
    );
    const session = startStudyBreakSession(deck, 5, now);
    const queue = getBreakStudyQueue(deck, session);
    expect(queue[0].id).toBe(session.breakQueueOrder[0]);
    expect(queue[0].id).toBe(getStudyQueue(deck, now, true)[0].id);
  });
});
