import { useCallback, useEffect, useMemo, useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { StudyCard } from './components/StudyCard';
import { RatingBar } from './components/RatingBar';
import { SettingsPanel } from './components/SettingsPanel';
import { AddCardForm } from './components/AddCardForm';
import { MandatoryBanner } from './components/MandatoryBanner';
import { EmptyState } from './components/EmptyState';
import { parseCsvToCards } from './lib/csv';
import { createCard, getStudyQueue, scheduleCard } from './lib/scheduler';
import {
  decrementMandatorySession,
  isMandatorySessionActive,
} from './lib/session';
import { installMockApi } from './lib/mockApi';
import type { AppData, Rating } from './lib/types';

const Box = 'div' as const;
type View = 'study' | 'settings' | 'add';

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [view, setView] = useState<View>('study');
  const [flipped, setFlipped] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const api = window.flashApi;

  const persist = useCallback(async (next: AppData) => {
    setData(next);
    await api?.saveData(next);
  }, [api]);

  useEffect(() => {
    installMockApi();
    window.flashApi?.getData().then(setData);

    const unsubTimer = window.flashApi?.onTimerFired(() => {
      window.flashApi?.getData().then(setData);
      setView('study');
      setToast('Time for a study break!');
      setTimeout(() => setToast(null), 4000);
    });

    const unsubBlock = window.flashApi?.onMandatoryBlocked(() => {
      setToast('Finish your required cards first');
      setTimeout(() => setToast(null), 3000);
    });

    return () => {
      unsubTimer?.();
      unsubBlock?.();
    };
  }, []);

  const mandatoryMode = data ? isMandatorySessionActive(data.session) : false;

  const queue = useMemo(() => {
    if (!data) return [];
    return getStudyQueue(data.cards, Date.now(), mandatoryMode);
  }, [data, mandatoryMode]);

  const current = queue[0] ?? null;
  const dueCount = queue.length;

  useEffect(() => {
    setFlipped(false);
  }, [current?.id]);

  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!data || !current) return;

      const updated = scheduleCard(current, rating, data.settings);
      const cards = data.cards.map((c) => (c.id === updated.id ? updated : c));

      const session = decrementMandatorySession(data.session);

      setFlipped(false);
      await persist({ ...data, cards, session });
    },
    [current, data, persist]
  );

  const handleAdd = async (front: string, back: string, deck: string) => {
    if (!data) return;
    const card = createCard(front, back, deck);
    await persist({ ...data, cards: [...data.cards, card] });
    setView('study');
    setToast('Card added');
    setTimeout(() => setToast(null), 2000);
  };

  const handleImport = async () => {
    const text = await api?.pickCsv();
    if (!text || !data) return;
    try {
      const imported = parseCsvToCards(text);
      if (!imported.length) {
        setToast('No valid rows in CSV');
        return;
      }
      await persist({ ...data, cards: [...data.cards, ...imported] });
      setView('study');
      setToast(`Imported ${imported.length} cards`);
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Import failed');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current || view !== 'study') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (!flipped) return;
      const map: Record<string, Rating> = {
        '1': 'again',
        '2': 'hard',
        '3': 'good',
        '4': 'easy',
      };
      const rating = map[e.key];
      if (rating) {
        e.preventDefault();
        void handleRate(rating);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, flipped, view, handleRate]);

  if (!data) {
    return (
      <Box className="h-full flex items-center justify-center glass-panel rounded-2xl m-1">
        <span className="text-sm text-[var(--color-text-muted)]">Loading…</span>
      </Box>
    );
  }

  const mandatoryTotal = data.settings.timerCardCount;

  return (
    <Box className="h-full flex flex-col glass-panel rounded-2xl m-1 overflow-hidden">
      <TitleBar
        dueCount={dueCount}
        totalCount={data.cards.length}
        onSettings={() => setView(view === 'settings' ? 'study' : 'settings')}
        onMinimize={() => api?.minimize()}
        onClose={async () => {
          const res = await api?.close();
          if (res?.blocked) {
            setToast('Complete required cards before hiding');
            setTimeout(() => setToast(null), 3000);
          }
        }}
      />

      {isMandatorySessionActive(data.session) && (
        <MandatoryBanner
          remaining={data.session.mandatoryRemaining}
          total={mandatoryTotal}
        />
      )}

      {toast && (
        <Box className="mx-3 mt-2 px-3 py-1.5 text-xs text-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] animate-slide-up">
          {toast}
        </Box>
      )}

      {view === 'settings' && (
        <SettingsPanel
          settings={data.settings}
          onChange={(settings) => persist({ ...data, settings })}
          onImport={handleImport}
          onAddCard={() => setView('add')}
          onBack={() => setView('study')}
        />
      )}

      {view === 'add' && (
        <AddCardForm onAdd={handleAdd} onCancel={() => setView('study')} />
      )}

      {view === 'study' && data.cards.length === 0 && (
        <EmptyState onAdd={() => setView('add')} onImport={handleImport} />
      )}

      {view === 'study' && data.cards.length > 0 && !current && (
        <Box className="flex-1 flex flex-col items-center justify-center px-6 text-center no-drag">
          <span className="text-3xl mb-2">✓</span>
          <p className="text-sm font-medium">All caught up!</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Next cards appear when they are due.
          </p>
          <button
            type="button"
            onClick={() => setView('settings')}
            className="mt-4 text-xs text-[var(--color-accent)] hover:underline"
          >
            Settings or import more
          </button>
        </Box>
      )}

      {view === 'study' && current && (
        <>
          <StudyCard
            card={current}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
          />
          <RatingBar visible={flipped} onRate={handleRate} />
        </>
      )}

      {view === 'study' && data.cards.length > 0 && (
        <Box className="px-3 pb-2 flex justify-center gap-3 text-[10px] text-[var(--color-text-dim)] no-drag">
          <button type="button" onClick={() => setView('add')} className="hover:text-[var(--color-text)]">
            + Add
          </button>
          <button type="button" onClick={handleImport} className="hover:text-[var(--color-text)]">
            Import
          </button>
          <button
            type="button"
            onClick={() => setView('settings')}
            className="hover:text-[var(--color-text)]"
          >
            Timer & SRS
          </button>
        </Box>
      )}
    </Box>
  );
}
