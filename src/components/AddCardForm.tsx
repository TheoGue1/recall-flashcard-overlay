import { useState } from 'react';

const Box = 'div' as const;

interface AddCardFormProps {
  onAdd: (front: string, back: string, deck: string) => void;
  onCancel: () => void;
}

export function AddCardForm({ onAdd, onCancel }: AddCardFormProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [deck, setDeck] = useState('Default');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    onAdd(front, back, deck);
    setFront('');
    setBack('');
  };

  return (
    <Box className="flex-1 flex flex-col px-3 py-2 overflow-auto no-drag animate-slide-up">
      <h2 className="text-sm font-semibold mb-3">Add card</h2>
      <form onSubmit={submit} className="flex flex-col gap-2 flex-1">
        <label className="text-xs text-[var(--color-text-muted)]">
          Front
          <textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            className="mt-1 w-full h-20 px-3 py-2 rounded-[var(--radius-btn)] bg-white/5 border border-[var(--color-border)] text-sm resize-none focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="Question or term"
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Back
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            className="mt-1 w-full h-20 px-3 py-2 rounded-[var(--radius-btn)] bg-white/5 border border-[var(--color-border)] text-sm resize-none focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="Answer or definition"
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Deck
          <input
            value={deck}
            onChange={(e) => setDeck(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-[var(--radius-btn)] bg-white/5 border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <Box className="flex gap-2 mt-auto pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] text-sm hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 rounded-[var(--radius-btn)] bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90"
          >
            Add card
          </button>
        </Box>
      </form>
    </Box>
  );
}

