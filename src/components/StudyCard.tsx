import type { Flashcard } from '../lib/types';
import { formatNextDue } from '../lib/scheduler';

const Box = 'div' as const;

interface StudyCardProps {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
}

export function StudyCard({ card, flipped, onFlip }: StudyCardProps) {
  return (
    <Box className="flex-1 flex flex-col min-h-0 px-3 pb-2">
      <Box className="flex items-center justify-between text-xs text-[var(--color-text-dim)] mb-2 px-1">
        <span className="capitalize">{card.state}</span>
        <span>{formatNextDue(card.due)}</span>
      </Box>
      <button
        type="button"
        onClick={onFlip}
        className="card-flip flex-1 min-h-[180px] no-drag focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-[var(--radius-card)]"
        aria-label={flipped ? 'Show question' : 'Show answer'}
      >
        <Box className={`card-flip-inner h-full ${flipped ? 'flipped' : ''}`}>
          <Box className="card-face glass-panel border border-[var(--color-border)] relative">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {card.front}
            </p>
            <span className="absolute bottom-3 left-0 right-0 text-[10px] text-[var(--color-text-dim)]">
              tap or Space to flip
            </span>
          </Box>
          <Box className="card-face back glass-panel border border-[var(--color-accent-soft)] bg-[var(--color-surface-elevated)]">
            <p className="text-base leading-relaxed whitespace-pre-wrap text-[var(--color-accent)]">
              {card.back}
            </p>
          </Box>
        </Box>
      </button>
    </Box>
  );
}

