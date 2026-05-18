import type { Rating } from '../lib/types';

const Box = 'div' as const;

interface RatingBarProps {
  visible: boolean;
  onRate: (rating: Rating) => void;
}

const buttons: { rating: Rating; label: string; key: string; color: string }[] = [
  { rating: 'again', label: 'Again', key: '1', color: 'var(--color-again)' },
  { rating: 'hard', label: 'Hard', key: '2', color: 'var(--color-hard)' },
  { rating: 'good', label: 'Good', key: '3', color: 'var(--color-good)' },
  { rating: 'easy', label: 'Easy', key: '4', color: 'var(--color-easy)' },
];

export function RatingBar({ visible, onRate }: RatingBarProps) {
  if (!visible) return null;

  return (
    <Box className="grid grid-cols-4 gap-2 px-3 pb-3 no-drag animate-slide-up">
      {buttons.map((b) => (
        <button
          key={b.rating}
          type="button"
          onClick={() => onRate(b.rating)}
          className="flex flex-col items-center gap-0.5 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95"
          style={{ borderColor: `${b.color}44` }}
        >
          <span className="text-xs font-medium" style={{ color: b.color }}>
            {b.label}
          </span>
          <span className="text-[10px] text-[var(--color-text-dim)]">{b.key}</span>
        </button>
      ))}
    </Box>
  );
}

