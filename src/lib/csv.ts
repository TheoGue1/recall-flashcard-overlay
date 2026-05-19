import Papa from 'papaparse';
import { createCard } from './scheduler';
import type { Flashcard } from './types';

export function cardMatchKey(front: string, _back?: string): string {
  return front.trim().toLowerCase();
}

function pickPreferredCard(a: Flashcard, b: Flashcard): Flashcard {
  if (a.reps !== b.reps) return a.reps > b.reps ? a : b;
  return a.createdAt <= b.createdAt ? a : b;
}

export function dedupeCards(cards: Flashcard[]): Flashcard[] {
  const byKey = new Map<string, Flashcard>();
  const order: string[] = [];

  for (const card of cards) {
    const key = cardMatchKey(card.front);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, card);
      order.push(key);
    } else {
      byKey.set(key, pickPreferredCard(existing, card));
    }
  }

  return order.map((key) => byKey.get(key)!);
}

export interface MergeImportResult {
  cards: Flashcard[];
  added: number;
  updated: number;
  skippedDuplicates: number;
  removedDuplicates: number;
}

export function mergeImportedCards(
  existing: Flashcard[],
  imported: Flashcard[],
  now = Date.now()
): MergeImportResult {
  const deduped = dedupeCards(existing);
  const removedDuplicates = existing.length - deduped.length;

  const byKey = new Map<string, Flashcard>();
  for (const card of deduped) {
    byKey.set(cardMatchKey(card.front), card);
  }

  const seenInImport = new Set<string>();
  const newCards: Flashcard[] = [];
  let added = 0;
  let updated = 0;
  let skippedDuplicates = 0;

  for (const incoming of imported) {
    const key = cardMatchKey(incoming.front);
    if (seenInImport.has(key)) {
      skippedDuplicates++;
      continue;
    }
    seenInImport.add(key);

    const match = byKey.get(key);
    if (match) {
      byKey.set(key, {
        ...match,
        front: incoming.front.trim(),
        back: incoming.back.trim(),
        deck: incoming.deck,
        updatedAt: now,
      });
      updated++;
    } else {
      newCards.push(incoming);
      byKey.set(key, incoming);
      added++;
    }
  }

  const cards = [
    ...deduped.map((c) => byKey.get(cardMatchKey(c.front))!),
    ...newCards,
  ];

  return { cards, added, updated, skippedDuplicates, removedDuplicates };
}

export function parseCsvToCards(text: string): Flashcard[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors[0]?.message ?? 'CSV parse error');
  }

  const cards: Flashcard[] = [];

  for (const row of result.data) {
    const front =
      row.front ?? row.question ?? row.term ?? row['column 1'] ?? Object.values(row)[0];
    const back =
      row.back ?? row.answer ?? row.definition ?? row['column 2'] ?? Object.values(row)[1];

    if (!front?.trim() || !back?.trim()) continue;

    const deck = row.deck?.trim() || 'Default';
    cards.push(createCard(front, back, deck));
  }

  if (cards.length === 0) {
    const noHeader = Papa.parse<string[]>(text, { skipEmptyLines: true });
    for (const row of noHeader.data) {
      if (row.length >= 2 && row[0]?.trim() && row[1]?.trim()) {
        cards.push(createCard(row[0], row[1]));
      }
    }
  }

  return cards;
}
