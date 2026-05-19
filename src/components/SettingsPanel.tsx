import type { AppSettings } from '../lib/types';
import { getMinTimerMinutes } from '../lib/timer';

const Box = 'div' as const;

interface SettingsPanelProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onImport: () => void;
  onAddCard: () => void;
  onBack: () => void;
  onTriggerStudyBreak?: () => void;
}

export function SettingsPanel({
  settings,
  onChange,
  onImport,
  onAddCard,
  onBack,
  onTriggerStudyBreak,
}: SettingsPanelProps) {
  const minTimerMinutes = getMinTimerMinutes();

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Box className="flex-1 flex flex-col px-3 py-2 overflow-auto no-drag animate-slide-up">
      <Box className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">Settings</h2>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          ← Study
        </button>
      </Box>

      <section className="mb-4">
        <h3 className="text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
          Study timer
        </h3>
        <label className="flex items-center gap-2 text-sm mb-3">
          <input
            type="checkbox"
            checked={settings.timerEnabled}
            onChange={(e) => update('timerEnabled', e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          Enable periodic study reminders
        </label>
        <label className="block text-xs text-[var(--color-text-muted)] mb-2">
          Remind every (minutes)
          <input
            type="number"
            min={minTimerMinutes}
            max={240}
            value={settings.timerIntervalMinutes}
            onChange={(e) =>
              update(
                'timerIntervalMinutes',
                Math.min(240, Math.max(minTimerMinutes, Number(e.target.value)))
              )
            }
            className="mt-1 w-full px-3 py-2 rounded-[var(--radius-btn)] bg-white/5 border border-[var(--color-border)] text-sm"
          />
        </label>
        <label className="block text-xs text-[var(--color-text-muted)]">
          Cards required per reminder
          <input
            type="number"
            min={1}
            max={50}
            value={settings.timerCardCount}
            onChange={(e) =>
              update('timerCardCount', Math.max(1, Number(e.target.value)))
            }
            className="mt-1 w-full px-3 py-2 rounded-[var(--radius-btn)] bg-white/5 border border-[var(--color-border)] text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm mt-3">
          <input
            type="checkbox"
            checked={settings.studyBreakFullscreen}
            onChange={(e) => update('studyBreakFullscreen', e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          Full screen on study break
        </label>
        <p className="text-[10px] text-[var(--color-text-dim)] mt-1 ml-6">
          Expands the window to fill your display when a reminder fires or you start a break
          manually.
        </p>
        {onTriggerStudyBreak && (
          <button
            type="button"
            onClick={onTriggerStudyBreak}
            className="mt-3 w-full py-2.5 rounded-[var(--radius-btn)] border border-[var(--color-again)] text-sm text-[var(--color-again)] hover:bg-[var(--color-again)]/10"
          >
            Start study break now
          </button>
        )}
        {import.meta.env.DEV && (
          <p className="text-[10px] text-[var(--color-text-dim)] mt-2">
            Dev: reminder interval can be as low as {minTimerMinutes} minute. Use the button above
            to test without waiting.
          </p>
        )}
      </section>

      <section className="mb-4">
        <h3 className="text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
          Spaced repetition (Anki-style SM-2)
        </h3>
        <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed mb-2">
          Again resets learning. Good advances steps then multiplies interval by ease.
          Easy graduates faster. Review cards use ease 2.5 default (min 1.3).
        </p>
        <label className="block text-xs text-[var(--color-text-muted)] mb-2">
          Learning steps (minutes, comma-separated)
          <input
            value={settings.learningStepsMinutes.join(', ')}
            onChange={(e) => {
              const steps = e.target.value
                .split(',')
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !Number.isNaN(n) && n > 0);
              if (steps.length) update('learningStepsMinutes', steps);
            }}
            className="mt-1 w-full px-3 py-2 rounded-[var(--radius-btn)] bg-white/5 border border-[var(--color-border)] text-sm"
          />
        </label>
      </section>

      <section className="flex flex-col gap-2 mt-auto">
        <button
          type="button"
          onClick={onAddCard}
          className="w-full py-2.5 rounded-[var(--radius-btn)] border border-[var(--color-border)] text-sm hover:bg-white/5"
        >
          + Add card manually
        </button>
        <button
          type="button"
          onClick={onImport}
          className="w-full py-2.5 rounded-[var(--radius-btn)] bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90"
        >
          Import CSV
        </button>
        <p className="text-[10px] text-[var(--color-text-dim)] text-center">
          CSV columns: front, back (or question, answer)
        </p>
      </section>
    </Box>
  );
}

