const Box = 'div' as const;

interface MandatoryBannerProps {
  remaining: number;
  total: number;
}

export function MandatoryBanner({ remaining, total }: MandatoryBannerProps) {
  if (remaining <= 0) return null;

  return (
    <Box className="px-3 py-2 rounded-[var(--radius-btn)] border border-[var(--color-again)] bg-[var(--color-again)]/15">
      <p className="text-sm font-medium text-[var(--color-again)]">
        Study break — complete {remaining} of {total} cards
      </p>
      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
        Window stays open until you finish this mini-session.
      </p>
    </Box>
  );
}

