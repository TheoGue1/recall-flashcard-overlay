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
        Study break — rate {remaining} of {total} assigned cards Easy
      </p>
      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
        Good → back of pile · Again → middle · Hard → later · Easy → done. Keep going until
        every assigned card is Easy.
      </p>
    </Box>
  );
}

