import Papa from 'papaparse';
import { createCard } from './scheduler';
import type { Flashcard } from './types';

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
