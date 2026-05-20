import { getStudyQueue } from './scheduler';
import type { AppSession, Flashcard, Rating } from './types';

export function isMandatorySessionActive(session: AppSession): boolean {
  return Boolean(session.mandatoryActive && session.mandatoryRemaining > 0);
}

export function normalizeBreakQueueOrder(
  mandatoryCardIds: string[],
  mandatoryEasyDoneIds: string[],
  breakQueueOrder: string[]
): string[] {
  const pending = mandatoryCardIds.filter((id) => !mandatoryEasyDoneIds.includes(id));
  const order = breakQueueOrder.filter((id) => pending.includes(id));
  for (const id of pending) {
    if (!order.includes(id)) order.push(id);
  }
  return order;
}

/** Reorder within the break pile after Again / Hard / Good. */
export function repositionInBreakQueue(
  queue: string[],
  cardId: string,
  rating: Rating
): string[] {
  const rest = queue.filter((id) => id !== cardId);

  if (rating === 'good') {
    return [...rest, cardId];
  }

  if (rating === 'again') {
    const mid = Math.floor(rest.length / 2);
    return [...rest.slice(0, mid), cardId, ...rest.slice(mid)];
  }

  // Hard → third quarter of the remaining pile
  const idx = Math.min(rest.length, Math.floor((rest.length * 3) / 4));
  return [...rest.slice(0, idx), cardId, ...rest.slice(idx)];
}

/** Next card in the break pile (custom order, not SRS due dates). */
export function getBreakStudyQueue(cards: Flashcard[], session: AppSession): Flashcard[] {
  const order = normalizeBreakQueueOrder(
    session.mandatoryCardIds,
    session.mandatoryEasyDoneIds,
    session.breakQueueOrder
  );
  if (!order.length) return [];

  const byId = new Map(cards.map((c) => [c.id, c]));
  return order
    .map((id) => byId.get(id))
    .filter((c): c is Flashcard => c !== undefined);
}

export function startStudyBreakSession(
  cards: Flashcard[],
  cardCount: number,
  now = Date.now()
): AppSession {
  const pool = getStudyQueue(cards, now, true);
  const mandatoryCardIds = pool.slice(0, cardCount).map((c) => c.id);

  return {
    mandatoryActive: mandatoryCardIds.length > 0,
    mandatoryRemaining: mandatoryCardIds.length,
    mandatoryCardIds,
    mandatoryEasyDoneIds: [],
    breakQueueOrder: [...mandatoryCardIds],
    lastTimerFired: now,
  };
}

/** SRS runs separately; this updates break pile order and Easy completion. */
export function applyBreakCardRating(
  session: AppSession,
  cardId: string,
  rating: Rating
): AppSession {
  if (!session.mandatoryActive || !session.mandatoryCardIds.includes(cardId)) {
    return { ...session };
  }

  let breakQueueOrder = normalizeBreakQueueOrder(
    session.mandatoryCardIds,
    session.mandatoryEasyDoneIds,
    session.breakQueueOrder
  );

  if (rating === 'easy') {
    if (session.mandatoryEasyDoneIds.includes(cardId)) {
      return { ...session, breakQueueOrder };
    }
    const mandatoryEasyDoneIds = [...session.mandatoryEasyDoneIds, cardId];
    breakQueueOrder = breakQueueOrder.filter((id) => id !== cardId);
    const mandatoryRemaining =
      session.mandatoryCardIds.length - mandatoryEasyDoneIds.length;
    return {
      ...session,
      mandatoryEasyDoneIds,
      breakQueueOrder,
      mandatoryRemaining,
      mandatoryActive: mandatoryRemaining > 0,
    };
  }

  if (!breakQueueOrder.includes(cardId)) {
    return { ...session, breakQueueOrder };
  }

  breakQueueOrder = repositionInBreakQueue(breakQueueOrder, cardId, rating);
  return { ...session, breakQueueOrder };
}

export function shouldHideWindowAfterSave(
  prevSession: AppSession,
  nextSession: AppSession
): boolean {
  return (
    isMandatorySessionActive(prevSession) &&
    !isMandatorySessionActive(nextSession)
  );
}
