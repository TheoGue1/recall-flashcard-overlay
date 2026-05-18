import type { AppData } from './types';

const STORAGE_KEY = 'recall-flashcards';

const defaultData: AppData = {
  cards: [],
  settings: {
    timerEnabled: true,
    timerIntervalMinutes: 30,
    timerCardCount: 5,
    learningStepsMinutes: [1, 10],
    graduatingIntervalDays: 1,
    easyIntervalDays: 4,
  },
  session: {
    mandatoryActive: false,
    mandatoryRemaining: 0,
    lastTimerFired: null,
  },
};

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return structuredClone(defaultData);
}

function save(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let timerId: ReturnType<typeof setInterval> | null = null;

function resetTimer(onFire: (remaining: number) => void) {
  if (timerId) clearInterval(timerId);
  const data = load();
  if (!data.settings.timerEnabled) return;
  timerId = setInterval(() => {
    const d = load();
    d.session.mandatoryActive = true;
    d.session.mandatoryRemaining = d.settings.timerCardCount;
    d.session.lastTimerFired = Date.now();
    save(d);
    onFire(d.session.mandatoryRemaining);
  }, data.settings.timerIntervalMinutes * 60 * 1000);
}

export function installMockApi() {
  if (window.flashApi) return;

  const listeners = new Set<(p: { remaining: number }) => void>();

  window.flashApi = {
    getData: async () => load(),
    saveData: async (data) => {
      save(data);
      resetTimer((remaining) => listeners.forEach((cb) => cb({ remaining })));
      return true;
    },
    pickCsv: async () => {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return resolve(null);
          resolve(await file.text());
        };
        input.click();
      });
    },
    minimize: async () => {},
    close: async () => ({ blocked: false }),
    onTimerFired: (cb) => {
      listeners.add(cb);
      resetTimer((remaining) => listeners.forEach((l) => l({ remaining })));
      return () => listeners.delete(cb);
    },
    onMandatoryBlocked: () => () => {},
  };
}
