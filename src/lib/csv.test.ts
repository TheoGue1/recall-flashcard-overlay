import { describe, expect, it } from 'vitest';
import { createCard } from './scheduler';
import { cardMatchKey, dedupeCards, mergeImportedCards } from './csv';
import type { Flashcard } from './types';

function card(front: string, back: string, overrides: Partial<Flashcard> = {}): Flashcard {
  return { ...createCard(front, back), ...overrides };
}

describe('cardMatchKey', () => {
  it('matches on front text case-insensitively after trim', () => {
    expect(cardMatchKey(' Hello ')).toBe(cardMatchKey('hello'));
  });
});

describe('dedupeCards', () => {
  it('keeps one card per front text', () => {
    const a = card('Q', 'Answer A', { id: 'a', reps: 3 });
    const b = card('q', 'Answer B', { id: 'b', reps: 1 });
    expect(dedupeCards([a, b])).toHaveLength(1);
    expect(dedupeCards([a, b])[0].id).toBe('a');
  });
});

describe('mergeImportedCards', () => {
  it('adds new cards', () => {
    const existing = [card('Old', 'One')];
    const imported = [card('New', 'Two')];
    const result = mergeImportedCards(existing, imported, 1000);
    expect(result.added).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.cards).toHaveLength(2);
  });

  it('updates existing cards in place and preserves SRS fields', () => {
    const existing = card('Q', 'Old answer', {
      id: 'keep-me',
      state: 'review',
      reps: 5,
      interval: 10,
      ease: 2.4,
    });
    const imported = card('Q', 'New answer', { deck: 'Biology' });
    const result = mergeImportedCards([existing], [imported], 2000);

    expect(result.added).toBe(0);
    expect(result.updated).toBe(1);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]).toMatchObject({
      id: 'keep-me',
      back: 'New answer',
      deck: 'Biology',
      state: 'review',
      reps: 5,
      interval: 10,
      ease: 2.4,
      updatedAt: 2000,
    });
  });

  it('skips duplicate fronts within the same CSV', () => {
    const imported = [card('Q', 'A'), card('Q', 'B')];
    const result = mergeImportedCards([], imported, 1000);
    expect(result.added).toBe(1);
    expect(result.skippedDuplicates).toBe(1);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].back).toBe('A');
  });

  it('removes duplicate cards already in the deck', () => {
    const a = card('Q', 'A', { id: 'a', reps: 4 });
    const b = card('q', 'a', { id: 'b', reps: 1 });
    const result = mergeImportedCards([a, b], [], 1000);
    expect(result.removedDuplicates).toBe(1);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].id).toBe('a');
  });
});
