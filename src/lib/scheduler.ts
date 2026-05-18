import type { AppSettings, CardState, Flashcard, Rating } from './types';

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;
const HARD_MULTIPLIER = 1.2;
const EASY_BONUS = 1.3;
const AGAIN_MULTIPLIER = 0;

function clampEase(ease: number): number {
  return Math.max(MIN_EASE, ease);
}

function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

function nextDueFromMinutes(minutes: number, now: number): number {
  return now + minutesToMs(minutes);
}

function nextDueFromDays(days: number, now: number): number {
  return now + daysToMs(days);
}

function graduateToReview(
  card: Flashcard,
  _settings: AppSettings,
  now: number,
  intervalDays: number
): Flashcard {
  return {
    ...card,
    state: 'review',
    ease: DEFAULT_EASE,
    interval: intervalDays,
    stepIndex: 0,
    due: nextDueFromDays(intervalDays, now),
    reps: card.reps + 1,
    updatedAt: now,
  };
}

function scheduleLearning(
  card: Flashcard,
  settings: AppSettings,
  rating: Rating,
  now: number
): Flashcard {
  const steps = settings.learningStepsMinutes;
  const stepIndex = card.stepIndex;

  if (rating === 'again') {
    return {
      ...card,
      state: card.state === 'relearning' ? 'relearning' : 'learning',
      stepIndex: 0,
      due: nextDueFromMinutes(steps[0] ?? 1, now),
      updatedAt: now,
    };
  }

  if (rating === 'hard') {
    const currentStep = steps[stepIndex] ?? steps[steps.length - 1] ?? 1;
    const delay = Math.round(currentStep * HARD_MULTIPLIER);
    return {
      ...card,
      state: 'learning',
      due: nextDueFromMinutes(delay, now),
      updatedAt: now,
    };
  }

  if (rating === 'good') {
    const nextStep = stepIndex + 1;
    if (nextStep >= steps.length) {
      return graduateToReview(card, settings, now, settings.graduatingIntervalDays);
    }
    return {
      ...card,
      state: 'learning',
      stepIndex: nextStep,
      due: nextDueFromMinutes(steps[nextStep], now),
      reps: card.reps + 1,
      updatedAt: now,
    };
  }

  return graduateToReview(card, settings, now, settings.easyIntervalDays);
}

function scheduleRelearning(
  card: Flashcard,
  settings: AppSettings,
  rating: Rating,
  now: number
): Flashcard {
  if (rating === 'again') {
    return {
      ...card,
      state: 'relearning',
      stepIndex: 0,
      due: nextDueFromMinutes(settings.learningStepsMinutes[0] ?? 1, now),
      updatedAt: now,
    };
  }

  if (rating === 'good' || rating === 'easy') {
    const interval = Math.max(1, Math.round(card.interval * AGAIN_MULTIPLIER || 1));
    const newInterval =
      rating === 'easy'
        ? Math.max(interval + 1, Math.round(card.interval * card.ease * EASY_BONUS))
        : interval;

    return {
      ...card,
      state: 'review',
      interval: newInterval,
      stepIndex: 0,
      due: nextDueFromDays(newInterval, now),
      reps: card.reps + 1,
      updatedAt: now,
    };
  }

  return scheduleLearning(card, settings, rating, now);
}

function scheduleReview(
  card: Flashcard,
  settings: AppSettings,
  rating: Rating,
  now: number
): Flashcard {
  let { ease, interval } = card;

  if (rating === 'again') {
    return {
      ...card,
      state: 'relearning',
      ease: clampEase(ease - 0.2),
      interval: Math.max(1, Math.round(interval * AGAIN_MULTIPLIER)),
      stepIndex: 0,
      due: nextDueFromMinutes(settings.learningStepsMinutes[0] ?? 1, now),
      lapses: card.lapses + 1,
      updatedAt: now,
    };
  }

  if (rating === 'hard') {
    ease = clampEase(ease - 0.15);
    interval = Math.max(1, Math.round(interval * HARD_MULTIPLIER));
    return {
      ...card,
      ease,
      interval,
      due: nextDueFromDays(interval, now),
      reps: card.reps + 1,
      updatedAt: now,
    };
  }

  if (rating === 'good') {
    interval = Math.max(card.interval + 1, Math.round(interval * ease));
    return {
      ...card,
      interval,
      due: nextDueFromDays(interval, now),
      reps: card.reps + 1,
      updatedAt: now,
    };
  }

  ease = clampEase(ease + 0.15);
  interval = Math.max(
    card.interval + 1,
    Math.round(interval * ease * EASY_BONUS)
  );
  return {
    ...card,
    ease,
    interval,
    due: nextDueFromDays(interval, now),
    reps: card.reps + 1,
    updatedAt: now,
  };
}

export function scheduleCard(
  card: Flashcard,
  rating: Rating,
  settings: AppSettings,
  now = Date.now()
): Flashcard {
  if (card.state === 'new') {
    const base: Flashcard = {
      ...card,
      state: 'learning',
      ease: DEFAULT_EASE,
      stepIndex: 0,
    };
    if (rating === 'easy') {
      return graduateToReview(base, settings, now, settings.easyIntervalDays);
    }
    return scheduleLearning(base, settings, rating, now);
  }

  if (card.state === 'learning') {
    return scheduleLearning(card, settings, rating, now);
  }

  if (card.state === 'relearning') {
    return scheduleRelearning(card, settings, rating, now);
  }

  return scheduleReview(card, settings, rating, now);
}

export function isDue(card: Flashcard, now = Date.now()): boolean {
  return card.due <= now;
}

export function getStudyQueue(
  cards: Flashcard[],
  now = Date.now(),
  includeNotDue = false
): Flashcard[] {
  const pool = includeNotDue ? cards : cards.filter((c) => isDue(c, now));
  const stateOrder: Record<CardState, number> = {
    learning: 0,
    relearning: 1,
    review: 2,
    new: 3,
  };
  return [...pool].sort((a, b) => {
    if (a.due !== b.due) return a.due - b.due;
    return stateOrder[a.state] - stateOrder[b.state];
  });
}

export function formatNextDue(due: number, now = Date.now()): string {
  const diff = due - now;
  if (diff <= 0) return 'now';
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export function createCard(front: string, back: string, deck = 'Default'): Flashcard {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    front: front.trim(),
    back: back.trim(),
    deck,
    state: 'new',
    ease: DEFAULT_EASE,
    interval: 0,
    stepIndex: 0,
    due: now,
    reps: 0,
    lapses: 0,
    createdAt: now,
    updatedAt: now,
  };
}
