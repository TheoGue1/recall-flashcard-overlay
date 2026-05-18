const Box = 'div' as const;

interface EmptyStateProps {
  onAdd: () => void;
  onImport: () => void;
}

export function EmptyState({ onAdd, onImport }: EmptyStateProps) {
  return (
    <Box className="flex-1 flex flex-col items-center justify-center px-6 text-center no-drag animate-slide-up">
      <span className="text-4xl mb-3 opacity-60">◇</span>
      <h2 className="text-base font-semibold mb-1">No cards yet</h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Import a deck or add your first flashcard to start spaced repetition.
      </p>
      <Box className="flex gap-2 w-full">
        <button
          type="button"
          onClick={onAdd}
          className="flex-1 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] text-sm"
        >
          Add card
        </button>
        <button
          type="button"
          onClick={onImport}
          className="flex-1 py-2 rounded-[var(--radius-btn)] bg-[var(--color-accent)] text-white text-sm"
        >
          Import CSV
        </button>
      </Box>
    </Box>
  );
}
