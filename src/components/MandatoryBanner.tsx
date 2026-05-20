const Box = 'div' as const;

interface MandatoryBannerProps {
  remaining: number;
  total: number;
  dueCount: number;
  breakPileFocus: boolean;
  onStudyAllDue: () => void;
  onFocusBreakPile: () => void;
}

export function MandatoryBanner({
  remaining,
  total,
  dueCount,
  breakPileFocus,
  onStudyAllDue,
  onFocusBreakPile,
}: MandatoryBannerProps) {
  if (remaining <= 0) return null;

  return (
    <Box className="px-3 py-2 rounded-[var(--radius-btn)] border border-[var(--color-again)] bg-[var(--color-again)]/15">
      <p className="text-sm font-medium text-[var(--color-again)]">
        Study break — rate {remaining} of {total} assigned cards Easy
      </p>
      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
        {breakPileFocus
          ? 'Good → back of pile · Again → middle · Hard → later · Easy → done.'
          : 'Studying your full due deck. Easy on an assigned card still counts toward the break.'}
      </p>
      <Box className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
        {breakPileFocus ? (
          dueCount > 0 && (
            <button
              type="button"
              onClick={onStudyAllDue}
              className="text-[var(--color-accent)] hover:underline"
            >
              Study all {dueCount} due instead
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={onFocusBreakPile}
            className="text-[var(--color-accent)] hover:underline"
          >
            Back to break pile ({remaining} left)
          </button>
        )}
      </Box>
    </Box>
  );
}

