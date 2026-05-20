import { startStudyBreakSession } from './session';
import {
  sanitizeSession,
  sanitizeSettings,
  timerIntervalMs,
  timerSettingsChanged,
} from './timer';
import type { AppData } from './types';

const STORAGE_KEY = 'recall-flashcards';

const defaultData: AppData = {
  cards: [],
  settings: {
    timerEnabled: true,
    timerIntervalMinutes: 30,
    timerCardCount: 5,
    studyBreakFullscreen: false,
    learningStepsMinutes: [1, 10],
    graduatingIntervalDays: 1,
    easyIntervalDays: 4,
  },
  session: {
    mandatoryActive: false,
    mandatoryRemaining: 0,
    mandatoryCardIds: [],
    mandatoryEasyDoneIds: [],
    breakQueueOrder: [],
    lastTimerFired: null,
  },
};

function normalize(data: AppData): AppData {
  return {
    ...data,
    settings: sanitizeSettings(data.settings, defaultData.settings),
    session: sanitizeSession(data.session, defaultData.session),
  };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize({ ...defaultData, ...JSON.parse(raw) });
  } catch {
    /* ignore */
  }
  return structuredClone(defaultData);
}

function save(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(data)));
}

let timerId: ReturnType<typeof setTimeout> | null = null;

function clearStudyTimer() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function scheduleStudyTimer(onFire: (remaining: number) => void) {
  clearStudyTimer();
  const data = load();
  if (!data.settings.timerEnabled) return;

  const ms = timerIntervalMs(data.settings.timerIntervalMinutes);
  timerId = setTimeout(() => {
    const d = load();
    const next = normalize({
      ...d,
      session: startStudyBreakSession(d.cards, d.settings.timerCardCount),
    });
    save(next);
    onFire(next.session.mandatoryRemaining);
    scheduleStudyTimer(onFire);
  }, ms);
}

export function installMockApi() {
  if (window.flashApi) return;

  const listeners = new Set<(p: { remaining: number }) => void>();

  const notifyTimer = (remaining: number) => listeners.forEach((cb) => cb({ remaining }));

  window.flashApi = {
    getData: async () => load(),
    saveData: async (data) => {
      const prev = load();
      const next = normalize(data);
      save(next);
      if (timerSettingsChanged(prev.settings, next.settings)) {
        scheduleStudyTimer(notifyTimer);
      }
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
    close: async () => {
      const d = load();
      if (d.session.mandatoryActive && d.session.mandatoryRemaining > 0) {
        return { blocked: true };
      }
      return { blocked: false };
    },
    onTimerFired: (cb) => {
      listeners.add(cb);
      scheduleStudyTimer(notifyTimer);
      return () => listeners.delete(cb);
    },
    onMandatoryBlocked: () => () => {},
    triggerStudyBreak: async () => {
      const d = load();
      const next = normalize({
        ...d,
        session: startStudyBreakSession(d.cards, d.settings.timerCardCount),
      });
      save(next);
      notifyTimer(next.session.mandatoryRemaining);
      return true;
    },
  };
}
