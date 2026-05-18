interface TitleBarProps {
  dueCount: number;
  totalCount: number;
  onSettings: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export function TitleBar({
  dueCount,
  totalCount,
  onSettings,
  onMinimize,
  onClose,
}: TitleBarProps) {
  return (
    <div className="drag-region flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-2 no-drag">
        <span className="text-lg">✦</span>
        <span className="text-sm font-semibold tracking-wide">Recall</span>
        <span className="text-xs text-[var(--color-text-muted)] px-2 py-0.5 rounded-full bg-[var(--color-accent-soft)]">
          {dueCount} due · {totalCount} cards
        </span>
      </div>
      <div className="flex items-center gap-1 no-drag">
        <IconBtn label="Settings" onClick={onSettings}>
          ⚙
        </IconBtn>
        <IconBtn label="Minimize" onClick={onMinimize}>
          ─
        </IconBtn>
        <IconBtn label="Hide" onClick={onClose}>
          ×
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="w-7 h-7 rounded-[var(--radius-btn)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/10 transition-colors text-sm"
    >
      {children}
    </button>
  );
}




